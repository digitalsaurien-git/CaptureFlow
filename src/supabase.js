import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Mock client pour éviter les plantages dans store.js si la config est absente
const mockSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ error: { message: "Supabase non configuré" } }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }),
  })
};

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : mockSupabase;

