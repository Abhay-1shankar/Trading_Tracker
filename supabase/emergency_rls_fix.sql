-- EMERGENCY RLS DEBUG & FIX
-- Run this step by step in Supabase SQL Editor

-- ============================================
-- STEP 1: Verify your user exists and get the ID
-- ============================================
SELECT
    id,
    email,
    created_at
FROM auth.users
WHERE email = 'abhayakgr19@gmail.com';

-- You should see: c71a79ff-4ae8-42ac-802a-8cc7c665ef92
-- If you don't see this, there's an auth issue

-- ============================================
-- STEP 2: Check RLS is enabled
-- ============================================
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'trades';

-- rls_enabled should be 't' (true)

-- ============================================
-- STEP 3: See ALL current policies
-- ============================================
SELECT
    policyname,
    cmd,
    permissive,
    roles::text[],
    qual::text as using_expression,
    with_check::text as with_check_expression
FROM pg_policies
WHERE tablename = 'trades'
ORDER BY policyname;

-- ============================================
-- STEP 4: NUCLEAR OPTION - Remove ALL policies and RLS
-- ============================================
-- This temporarily disables security to test if RLS is the issue

-- Drop EVERY policy
DROP POLICY IF EXISTS "Users can insert their own" ON public.trades;
DROP POLICY IF EXISTS "Users can view their own" ON public.trades;
DROP POLICY IF EXISTS "Users can view own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can insert own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can delete own trades" ON public.trades;
DROP POLICY IF EXISTS "users_select_own_trades" ON public.trades;
DROP POLICY IF EXISTS "users_insert_own_trades" ON public.trades;
DROP POLICY IF EXISTS "users_update_own_trades" ON public.trades;
DROP POLICY IF EXISTS "users_delete_own_trades" ON public.trades;
DROP POLICY IF EXISTS "allow_select_own_trades" ON public.trades;
DROP POLICY IF EXISTS "allow_insert_own_trades" ON public.trades;
DROP POLICY IF EXISTS "enable_read_own_trades" ON public.trades;
DROP POLICY IF EXISTS "enable_insert_own_trades" ON public.trades;

-- Drop any remaining policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'trades') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.trades';
    END LOOP;
END $$;

-- Verify ALL policies are gone
SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'trades';
-- Should return 0

-- ============================================
-- STEP 5: TEMPORARILY disable RLS for testing
-- ============================================
-- WARNING: This makes the table accessible to ALL authenticated users
-- We'll re-enable it in Step 7

ALTER TABLE public.trades DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Test if this fixes the issue
-- ============================================
-- Go back to your browser: http://localhost:3000/fix-rls
-- Click "Test INSERT"
-- It SHOULD work now

-- If it STILL doesn't work, the problem is NOT RLS - it's something else
-- (like table permissions or authentication)

-- ============================================
-- STEP 7: Re-enable RLS with SIMPLE policies
-- ============================================
-- Only run this AFTER confirming Step 6 works

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create the SIMPLEST possible policies
-- These allow ANY authenticated user to do anything
-- (We'll make them stricter after confirming they work)

CREATE POLICY "temp_allow_all_reads"
ON public.trades
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "temp_allow_all_inserts"
ON public.trades
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "temp_allow_all_updates"
ON public.trades
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "temp_allow_all_deletes"
ON public.trades
FOR DELETE
TO authenticated
USING (true);

-- Test again in browser at http://localhost:3000/fix-rls
-- If this WORKS, then the issue is with the auth.uid() = user_id check

-- ============================================
-- STEP 8: If Step 7 works, replace with proper policies
-- ============================================
-- Only run this if Step 7 worked

-- Drop temporary policies
DROP POLICY IF EXISTS "temp_allow_all_reads" ON public.trades;
DROP POLICY IF EXISTS "temp_allow_all_inserts" ON public.trades;
DROP POLICY IF EXISTS "temp_allow_all_updates" ON public.trades;
DROP POLICY IF EXISTS "temp_allow_all_deletes" ON public.trades;

-- Create proper user-specific policies
CREATE POLICY "user_select_own"
ON public.trades
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_insert_own"
ON public.trades
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_update_own"
ON public.trades
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_delete_own"
ON public.trades
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- STEP 9: Debug auth.uid() if Step 8 fails
-- ============================================
-- This checks if auth.uid() actually works

SELECT
    auth.uid() as current_user_id,
    auth.role() as current_role,
    CASE
        WHEN auth.uid() IS NULL THEN '❌ auth.uid() is NULL - not authenticated'
        WHEN auth.uid() = 'c71a79ff-4ae8-42ac-802a-8cc7c665ef92'::uuid THEN '✅ Correct user ID'
        ELSE '⚠️ Different user ID'
    END as status;

-- If auth.uid() is NULL in the SQL Editor, that's EXPECTED
-- (SQL Editor uses your Supabase dashboard session, not your app session)
-- The important thing is that it works in the app

-- ============================================
-- STEP 10: Check table structure
-- ============================================
-- Verify user_id column exists and has correct type

SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'trades'
AND column_name = 'user_id';

-- Should show:
-- user_id | uuid | YES (or NO)

-- ============================================
-- WHAT TO DO NEXT
-- ============================================
/*
Run steps 1-6 FIRST

After Step 6:
- If insert STILL fails → Problem is NOT RLS (check table permissions below)
- If insert WORKS → Problem IS RLS, continue to Step 7

If Step 7 (temp policies) works but Step 8 (proper policies) fails:
→ The issue is that auth.uid() doesn't match user_id
→ Check if you have old trades with different user_ids
→ Run: DELETE FROM public.trades; -- to clear old data

*/

-- ============================================
-- BONUS: Check table permissions (if Step 6 fails)
-- ============================================
SELECT
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'trades';

-- You should see grants for 'authenticated' role
