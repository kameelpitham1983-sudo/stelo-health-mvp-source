import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const missingEnv = !supabaseUrl || !supabaseAnonKey;

export const supabase: SupabaseClient = missingEnv
  ? createClient('https://placeholder.supabase.co', 'placeholder-anon-key')
  : createClient(supabaseUrl, supabaseAnonKey);

export const supabaseConfigured = !missingEnv;
