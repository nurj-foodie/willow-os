import { useEffect, useCallback } from 'react';
import type { Task } from '../types';

export function useNotifications(tasks: Task[]) {
    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        requestPermission();
    }, [requestPermission]);

    useEffect(() => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const interval = setInterval(() => {
            const now = new Date();

            tasks.forEach(task => {
                if (task.status === 'todo' && task.due_date) {
                    const dueDate = new Date(task.due_date);
                    const diffInMinutes = Math.floor((dueDate.getTime() - now.getTime()) / 1000 / 60);

                    // Notify exactly when due (within 1 minute precision check)
                    if (diffInMinutes === 0 && dueDate > now) {
                        new Notification(`Willow: ${task.emoji || '🌿'} ${task.title}`, {
                            body: 'Time to flow with this task.',
                            icon: '/pwa-192x192.png', // Assuming default PWA icon exists
                        });
                    }
                }
            });
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [tasks]);

    return { requestPermission };
}
