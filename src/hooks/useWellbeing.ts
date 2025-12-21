import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useWellbeing(user: User | null) {
    const [mood, setMood] = useState<number>(3);
    const [priorities, setPriorities] = useState<string[]>(['', '', '']);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    const fetchWellbeing = useCallback(async () => {
        if (!user) return;

        // Demo mode: use localStorage
        if (user.id.startsWith('demo_')) {
            const saved = localStorage.getItem('willow_demo_wellbeing');
            if (saved) {
                const data = JSON.parse(saved);
                setMood(data.mood || 3);
                setPriorities(data.priorities || ['', '', '']);
            }
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('wellbeing')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                throw error;
            }

            if (data) {
                setMood(data.mood || 3);
                setPriorities(data.priorities || ['', '', '']);
            }
        } catch (err) {
            console.error('Error fetching wellbeing:', err);
        } finally {
            setLoading(false);
        }
    }, [user, today]);

    useEffect(() => {
        fetchWellbeing();
    }, [fetchWellbeing]);

    const saveWellbeing = async (updates: { mood?: number; priorities?: string[] }) => {
        if (!user) return;

        // Demo mode: save to localStorage
        if (user.id.startsWith('demo_')) {
            const current = { mood, priorities };
            localStorage.setItem('willow_demo_wellbeing', JSON.stringify({ ...current, ...updates }));
            setSaving(true);
            setTimeout(() => setSaving(false), 300);
            return;
        }

        try {
            setSaving(true);
            const { error } = await supabase
                .from('wellbeing')
                .upsert({
                    user_id: user.id,
                    date: today,
                    ...updates,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,date' });

            if (error) throw error;
        } catch (err) {
            console.error('Error saving wellbeing:', err);
        } finally {
            setSaving(false);
        }
    };

    const updateMood = (newMood: number) => {
        setMood(newMood);
        saveWellbeing({ mood: newMood });
    };

    const updatePriority = (index: number, value: string) => {
        const next = [...priorities];
        next[index] = value;
        setPriorities(next);
        // Debounce or wait for blur in component? 
        // For now, let's just expose the setter and the component can decide when to save.
    };

    const persistPriorities = () => {
        saveWellbeing({ priorities });
    };

    return {
        mood,
        priorities,
        loading,
        saving,
        updateMood,
        updatePriority,
        persistPriorities
    };
}
