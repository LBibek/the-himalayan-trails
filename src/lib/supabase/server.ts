import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseServerConfigured = Boolean(
  supabaseUrl && 
  (supabaseServiceRole || supabaseAnonKey) &&
  !supabaseUrl.includes('your-project-id')
);

export function getSupabaseServerClient() {
  if (!isSupabaseServerConfigured) {
    return null;
  }
  
  // Use service role if available for trusted backend operations, else anon key
  const key = supabaseServiceRole || supabaseAnonKey;
  return createClient(supabaseUrl!, key!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
