import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface Profile {
    id: string;
    display_name: string | null;
    last_login_at: string | null;
}

export function useProfile(user: User | null) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Demo mode: skip Supabase, use localStorage keyed by email
        if (user.id.startsWith('demo_')) {
            const storageKey = `willow_profile_${user.email}`;
            const saved = localStorage.getItem(storageKey);

            if (saved) {
                setProfile(JSON.parse(saved));
            } else {
                setProfile({
                    id: user.id,
                    display_name: null, // Force naming ritual
                    last_login_at: new Date().toISOString()
                });
            }
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timed out')), 5000)
            );

            // Race the query against the timeout
            const queryPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setProfile(data);
            } else {
                // Create profile if it doesn't exist
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert([{ id: user.id, last_login_at: new Date().toISOString() }])
                    .select()
                    .single();

                if (createError) throw createError;
                if (newProfile) setProfile(newProfile);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            console.log('Profile fetch complete. Profile:', profile);
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) return;

        // Demo mode: update localStorage
        if (user.id.startsWith('demo_')) {
            setProfile(prev => {
                const next = prev ? { ...prev, ...updates } : { id: user.id, display_name: null, last_login_at: new Date().toISOString(), ...updates };
                localStorage.setItem(`willow_profile_${user.email}`, JSON.stringify(next));
                return next;
            });
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;
            setProfile(prev => prev ? { ...prev, ...updates } : null);
        } catch (err) {
            console.error('Error updating profile:', err);
        }
    };

    const recordLogin = async () => {
        if (!user) return;
        await updateProfile({ last_login_at: new Date().toISOString() });
    };

    return { profile, loading, updateProfile, recordLogin };
}
