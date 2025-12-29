import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Task } from '../types';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

const LOCAL_STORAGE_KEY = 'willow_tasks_mock';

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });

    // Monitor auth state OR demo mode
    useEffect(() => {
        const demoEmail = localStorage.getItem('willow_demo_email');

        // Demo mode: create mock user from localStorage
        if (demoEmail) {
            setUser({
                id: `demo_${btoa(demoEmail)}`,
                email: demoEmail,
                app_metadata: {},
                user_metadata: {},
                aud: 'demo',
                created_at: new Date().toISOString()
            } as User);
            return;
        }

        // Normal Supabase auth
        if (!isSupabaseConfigured) return;

        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchTasks = useCallback(async () => {
        if (isSupabaseConfigured && user) {
            try {
                // Use selectedDate for filtering
                const startOfDay = new Date(selectedDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(selectedDate);
                endOfDay.setHours(23, 59, 59, 999);

                const { data, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', user.id)
                    .or(`status.eq.parked,and(due_date.gte.${startOfDay.toISOString()},due_date.lte.${endOfDay.toISOString()})`)
                    .order('position_rank', { ascending: true });

                if (error) throw error;
                if (data) setTasks(data as Task[]);
            } catch (err) {
                console.error('Error fetching tasks:', err);
            } finally {
                setLoading(false);
            }
        } else if (isSupabaseConfigured && !user) {
            setTasks([]);
            setLoading(false);
        } else if (!isSupabaseConfigured) {
            // Mock/Local storage mode
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
                const allTasks: Task[] = JSON.parse(saved);

                // Filter to selected date's tasks + parked tasks
                const startOfDay = new Date(selectedDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(selectedDate);
                endOfDay.setHours(23, 59, 59, 999);

                const filtered = allTasks.filter(t => {
                    if (t.status === 'parked') return true;
                    if (!t.due_date) return false;
                    const dueDate = new Date(t.due_date);
                    return dueDate >= startOfDay && dueDate <= endOfDay;
                });

                setTasks(filtered);
            } else {
                const initial: Task[] = [
                    {
                        id: '1',
                        title: 'Finish the slide deck',
                        due_date: new Date().toISOString(),
                        status: 'todo',
                        color_theme: 'clay',
                        priority: 4,
                        position_rank: 1000,
                        emoji: '📝',
                    },
                    {
                        id: '2',
                        title: 'Coffee with Sarah',
                        due_date: new Date(Date.now() + 3600000).toISOString(),
                        status: 'todo',
                        color_theme: 'matcha',
                        priority: 4,
                        position_rank: 2000,
                        emoji: '☕',
                    }
                ];
                setTasks(initial);
            }
            setLoading(false);
        }
    }, [user, selectedDate]);

    useEffect(() => {
        fetchTasks();

        if (isSupabaseConfigured && user) {
            const channel = supabase
                .channel(`tasks_${user.id}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
                    () => {
                        fetchTasks();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [fetchTasks, user]);

    // Sync back to local storage in mock mode
    useEffect(() => {
        if (!isSupabaseConfigured && !loading) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
        }
    }, [tasks, loading]);

    async function addTask(title: string, dueDate: Date | null, priority: number = 4) {
        const newRank = tasks.length > 0 ? tasks[0].position_rank - 1000 : 1000;
        const emoji = title.toLowerCase().includes('coffee') ? '☕' :
            title.toLowerCase().includes('gym') || title.toLowerCase().includes('yoga') ? '🧘' :
                title.toLowerCase().includes('email') || title.toLowerCase().includes('finish') ? '📝' : undefined;

        // Use selectedDate if no dueDate is provided
        const finalDueDate = dueDate || selectedDate;

        const newTaskData: any = {
            title,
            due_date: finalDueDate?.toISOString(),
            position_rank: newRank,
            emoji,
            color_theme: (['matcha', 'clay', 'lavender', 'sage'][Math.floor(Math.random() * 4)]) as any,
            priority,
            status: 'todo',
        };

        if (user) {
            newTaskData.user_id = user.id;
        }

        if (isSupabaseConfigured && user) {
            const { data, error } = await supabase
                .from('tasks')
                .insert([newTaskData])
                .select();

            if (error) console.error('Error adding task:', error);
            return data;
        } else if (!isSupabaseConfigured) {
            const id = Math.random().toString(36).substr(2, 9);
            setTasks(prev => [{ ...newTaskData, id } as Task, ...prev]);
            return [{ ...newTaskData, id }];
        }
    }

    async function updateTask(id: string, updates: Partial<Task>) {
        if (isSupabaseConfigured && user) {
            const { error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) console.error('Error updating task:', error);
        } else {
            setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        }
    }

    async function updateTasks(ids: string[], updates: Partial<Task>) {
        if (isSupabaseConfigured && user) {
            const { error } = await supabase
                .from('tasks')
                .update(updates)
                .in('id', ids)
                .eq('user_id', user.id);

            if (error) console.error('Error updating tasks:', error);
        } else {
            setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, ...updates } : t));
        }
    }

    async function reorderTasks(activeId: string, overId: string) {
        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        const overIndex = tasks.findIndex(t => t.id === overId);
        let newRank: number;

        if (overIndex === 0) {
            newRank = tasks[0].position_rank - 1000;
        } else if (overIndex === tasks.length - 1) {
            newRank = tasks[tasks.length - 1].position_rank + 1000;
        } else {
            const prevIndex = tasks.findIndex(t => t.id === activeId) < overIndex ? overIndex : overIndex - 1;
            const nextIndex = prevIndex + 1;
            newRank = (tasks[prevIndex].position_rank + tasks[nextIndex].position_rank) / 2;
        }

        if (isSupabaseConfigured && user) {
            const { error } = await supabase
                .from('tasks')
                .update({ position_rank: newRank })
                .eq('id', activeId)
                .eq('user_id', user.id);

            if (error) {
                console.error('Error reordering task:', error);
                fetchTasks();
            }
        } else {
            setTasks(prev => {
                const oldIndex = prev.findIndex(t => t.id === activeId);
                const newIndex = prev.findIndex(t => t.id === overId);
                const moved = [...prev];
                const [item] = moved.splice(oldIndex, 1);
                moved.splice(newIndex, 0, { ...item, position_rank: newRank });
                return moved;
            });
        }
    }

    const logout = async () => {
        const demoEmail = localStorage.getItem('willow_demo_email');
        if (demoEmail) {
            localStorage.removeItem('willow_demo_email');
            window.location.reload();
            return;
        }

        if (isSupabaseConfigured) {
            await supabase.auth.signOut();
        }
    };

    const deleteAccount = async () => {
        if (!user) return;
        const confirmDelete = window.confirm("Are you sure? This will permanently delete your tasks, priorities, and legal records. This cannot be undone.");
        if (!confirmDelete) return;

        try {
            // RLS will allow user to delete their own rows in tasks, user_credentials, wellbeing, profiles
            const { error: tasksError } = await supabase.from('tasks').delete().eq('user_id', user.id);
            if (tasksError) throw tasksError;

            // Log out after deletion
            await logout();
            window.location.reload();
        } catch (err) {
            console.error('Account deletion failed:', err);
            alert("Failed to delete account data. Please contact support.");
        }
    };

    return { tasks, loading, user, selectedDate, setSelectedDate, addTask, updateTask, updateTasks, reorderTasks, logout, deleteAccount };
}
