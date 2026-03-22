-- RLS Diagnostic & Fix Script
-- Run this in Supabase SQL Editor while logged into the dashboard

-- ============================================
-- STEP 1: Check your current user ID
-- ============================================
SELECT
    id as user_id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Copy your user ID from above (the UUID in the first column)

-- ============================================
-- STEP 2: Check existing trades
-- ============================================
SELECT
    id,
    user_id,
    symbol,
    created_at
FROM public.trades
ORDER BY created_at DESC
LIMIT 10;

-- Check if user_id column has values and if they match your user ID from Step 1

-- ============================================
-- STEP 3: Check current RLS policies
-- ============================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'trades';

-- ============================================
-- STEP 4: NUCLEAR OPTION - Clean Slate
-- ============================================
-- This will:
-- 1. Drop all existing policies
-- 2. Clear all trades (if you want to start fresh)
-- 3. Recreate clean policies

-- Drop all policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'trades') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.trades';
    END LOOP;
END $$;

-- OPTIONAL: Delete all existing trades (uncomment if you want to start fresh)
-- TRUNCATE TABLE public.trades;

-- Disable and re-enable RLS
ALTER TABLE public.trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create clean, simple policies
CREATE POLICY "users_select_own_trades"
ON public.trades
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_trades"
ON public.trades
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_trades"
ON public.trades
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_trades"
ON public.trades
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- STEP 5: Verify auth.uid() works
-- ============================================
-- This will only work if you're logged into Supabase dashboard
-- It tests if auth.uid() returns a value
SELECT
    auth.uid() as my_user_id,
    CASE
        WHEN auth.uid() IS NULL THEN '❌ NULL - You are not authenticated in SQL Editor'
        ELSE '✅ You are authenticated'
    END as status;

-- ============================================
-- STEP 6: Test Insert (Run AFTER policies are created)
-- ============================================
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from Step 1
-- Or run this through your app's /api/debug endpoint

-- Manual test insert (replace with YOUR user ID):
/*
INSERT INTO public.trades (user_id, symbol, entry_price, exit_price, quantity, pnl, strategy)
VALUES (
    'PASTE_YOUR_USER_ID_HERE',  -- Replace this with your actual user ID
    'TEST',
    100.00,
    110.00,
    1,
    10.00,
    'Test'
);
*/

-- ============================================
-- STEP 7: Verify policies are active
-- ============================================
SELECT
    tablename,
    policyname,
    cmd as command
FROM pg_policies
WHERE tablename = 'trades'
ORDER BY policyname;

-- You should see 4 policies:
-- 1. users_select_own_trades (SELECT)
-- 2. users_insert_own_trades (INSERT)
-- 3. users_update_own_trades (UPDATE)
-- 4. users_delete_own_trades (DELETE)

-- ============================================
-- TROUBLESHOOTING NOTES
-- ============================================
/*
If you still get permission denied after this:

1. Verify the user_id column type matches auth.users.id type:
   Both should be UUID

2. Check if user_id column is NOT NULL:
   \d public.trades

3. Verify RLS is enabled:
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename = 'trades';
   -- rowsecurity should be 't' (true)

4. Make sure you're using the ANON key, not SERVICE_ROLE key in your app
*/
