/**
 * @deprecated Use createClient from '@/lib/supabase/client' for client components
 * or createClient from '@/lib/supabase/server' for server components/API routes.
 * SSR-compatible clients are required for auth to work correctly.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
