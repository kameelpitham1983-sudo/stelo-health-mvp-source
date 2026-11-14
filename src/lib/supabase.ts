import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bewndqxrmvhwngnszmdb.supabase.co';
const supabaseAnonKey = 'sb_publishable_GCoDAONmvt1APYvWMVMolA_XCWws4KI';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseConfigured = true;
