import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

const LOCAL_STORAGE_KEY = 'willow_ledger_mock';

export interface LedgerEntry {
    id: string;
    amount: number;
    currency: string;
    category: string;
    description: string;
    receipt_url?: string;
    created_at: string;
}

export const useLedger = (user: User | null, _profile: any, updateProfile: any) => {
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    // Gatekeeper disabled for testing - trial logic removed

    const fetchEntries = useCallback(async () => {
        if (isSupabaseConfigured && user) {
            setLoading(true);
            const { data, error } = await supabase
                .from('ledger')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) console.error('Error fetching ledger:', error);
            else setEntries(data || []);
            setLoading(false);
        } else if (!isSupabaseConfigured || (user?.aud === 'demo')) {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) setEntries(JSON.parse(saved));
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchEntries();
    }, [user, fetchEntries]);

    // Sync to local storage for demo mode
    useEffect(() => {
        if ((!isSupabaseConfigured || user?.aud === 'demo') && !loading) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
        }
    }, [entries, loading, user]);

    const startTrial = async () => {
        if (!user) return;
        await updateProfile({ trial_started_at: new Date().toISOString() });
    };

    const addEntry = async (entry: Omit<LedgerEntry, 'id' | 'created_at'>) => {
        console.log('[useLedger] Adding entry:', entry);

        if (isSupabaseConfigured && user && user.aud !== 'demo') {
            const { data, error } = await supabase
                .from('ledger')
                .insert([{ ...entry, user_id: user.id }])
                .select();

            if (error) {
                console.error('[useLedger] Error adding ledger entry:', error);
                throw error;
            }

            console.log('[useLedger] Entry saved to Supabase:', data);
            if (data) setEntries(prev => [data[0], ...prev]);
            return data;
        } else {
            const newEntry: LedgerEntry = {
                ...entry,
                id: Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString()
            };
            console.log('[useLedger] Entry saved to localStorage:', newEntry);
            setEntries(prev => [newEntry, ...prev]);
            return [newEntry];
        }
    };

    return { entries, loading, isTrialActive: true, trialDaysLeft: 999, startTrial, addEntry, hasStartedTrial: true };
};
