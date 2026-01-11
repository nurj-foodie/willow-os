import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export function usePushNotifications(user: User | null) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);
    const [loading, setLoading] = useState(false);

    // Check if push is supported
    const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;

    // Helper to convert VAPID key
    const urlBase64ToUint8Array = (base64String: string | undefined) => {
        if (!base64String) {
            throw new Error('VAPID_PUBLIC_KEY is missing via VITE_VAPID_PUBLIC_KEY env var.');
        }
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    // Check existing subscription
    const checkSubscription = useCallback(async () => {
        if (!isPushSupported || !user) return;

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        setIsSubscribed(!!subscription);

        // Optional: Re-sync with DB if subscription exists locally but missing in DB
        // For now, we assume local state implies sync attempt was made
    }, [user, isPushSupported]);

    useEffect(() => {
        checkSubscription();
    }, [checkSubscription]);

    // Subscribe logic
    const subscribeToPush = async () => {
        if (!isPushSupported) {
            alert('Push notifications are not supported on this browser.');
            return;
        }

        if (!user) return;

        setLoading(true);
        try {
            // 1. Register Service Worker (should be done by VitePWA, but ensure ready)
            const registration = await navigator.serviceWorker.ready;

            // 2. Request Permission
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== 'granted') {
                throw new Error('Notification permission denied');
            }

            // 3. Subscribe to PushManager
            let publicKey = VAPID_PUBLIC_KEY;

            // Fallback: Fetch from Edge Function if not in env
            if (!publicKey) {
                console.log('VAPID key missing in env, fetching from server...');
                const { data, error } = await supabase.functions.invoke('get-vapid-key');
                if (error || !data?.publicKey) throw new Error('Could not retrieve VAPID key');
                publicKey = data.publicKey;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            // 4. Save to Database
            // Conversion fix: Use Array.from to convert Uint8Array before passing to String.fromCharCode
            const p256dhKey = subscription.getKey('p256dh');
            const authKey = subscription.getKey('auth');

            if (!p256dhKey || !authKey) throw new Error('Failed to generate subscription keys');

            const p256dh = btoa(String.fromCharCode(...Array.from(new Uint8Array(p256dhKey))));
            const auth = btoa(String.fromCharCode(...Array.from(new Uint8Array(authKey))));

            const { error } = await supabase.from('push_subscriptions').upsert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                p256dh,
                auth,
                user_agent: navigator.userAgent
            }, { onConflict: 'endpoint' });

            if (error) throw error;

            setIsSubscribed(true);
            console.log('Push subscription saved to DB endpoint:', subscription.endpoint);

        } catch (error) {
            console.error('Failed to subscribe to push:', error);
            const msg = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to enable notifications: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    // Unsubscribe logic
    const unsubscribeFromPush = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Unsubscribe from browser
                await subscription.unsubscribe();

                // Remove from DB
                if (user) {
                    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
                }
            }

            setIsSubscribed(false);
        } catch (error) {
            console.error('Error unsubscribing:', error);
        } finally {
            setLoading(false);
        }
    };

    return {
        isSupported: isPushSupported,
        isSubscribed,
        permission,
        loading,
        subscribeToPush,
        unsubscribeFromPush
    };
}
