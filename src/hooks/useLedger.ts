import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

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
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('ledger')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching ledger:', error);
        else setEntries(data || []);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchEntries();
        }
    }, [user, fetchEntries]);

    const startTrial = async () => {
        if (!user) return;
        await updateProfile({ trial_started_at: new Date().toISOString() });
    };

    const addEntry = async (entry: Omit<LedgerEntry, 'id' | 'created_at'>) => {
        if (!user) return;
        const { data, error } = await supabase
            .from('ledger')
            .insert([{ ...entry, user_id: user.id }])
            .select();

        if (error) {
            console.error('Error adding ledger entry:', error);
            throw error;
        }
        if (data) setEntries(prev => [data[0], ...prev]);
        return data;
    };

    return { entries, loading, isTrialActive: true, trialDaysLeft: 999, startTrial, addEntry, hasStartedTrial: true };
};
