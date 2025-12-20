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

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

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
