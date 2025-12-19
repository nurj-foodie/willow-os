import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only initialize if we have the credentials
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null as any; // Cast as any to avoid type errors in components that use it unsafely

if (!isSupabaseConfigured) {
    console.warn('Willow: Supabase not configured. Running in local/mock mode.');
}
