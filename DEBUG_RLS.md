# RLS Debugging Guide

## Step 1: Verify Policies in Supabase Dashboard

Go to Supabase Dashboard → Authentication → Policies and check if you have:
- Duplicate policies with different names
- Policies that might be conflicting

**Expected policies:**
```sql
- Users can view own trades (SELECT)
- Users can insert own trades (INSERT)
- Users can update own trades (UPDATE)
- Users can delete own trades (DELETE)
```

If you see policies like "Users can insert their own" or "Users can view their own", you have duplicates.

**Fix: Drop all policies and recreate:**
```sql
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert their own" ON public.trades;
DROP POLICY IF EXISTS "Users can view their own" ON public.trades;
DROP POLICY IF EXISTS "Users can view own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can insert own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can delete own trades" ON public.trades;

-- Recreate clean policies
CREATE POLICY "Users can view own trades"
ON public.trades
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
ON public.trades
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades"
ON public.trades
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades"
ON public.trades
FOR DELETE
USING (auth.uid() = user_id);
```

---

## Step 2: Test if auth.uid() is Working

Run this in Supabase SQL Editor:
```sql
SELECT auth.uid();
```

**If it returns NULL:**
- You're not logged in to Supabase dashboard with the test user
- The SQL editor uses YOUR dashboard session, not your app's session

**To properly test RLS:**
Use the Supabase dashboard's "RLS Helper" or test from your app's console.

---

## Step 3: Debug from Browser Console

Add this to your `add-trade/page.js` to see what's happening:

```javascript
// Add after line 39
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();

console.log('🔍 Current User:', user);
console.log('🔍 User ID:', user?.id);
console.log('🔍 Session:', await supabase.auth.getSession());

// Test RLS directly
const testQuery = await supabase
  .from('trades')
  .select('*')
  .limit(1);

console.log('🔍 Test Query Result:', testQuery);
```

**What to look for:**
- If `user` is `null` → You're not logged in
- If `user.id` exists but query fails → RLS policy issue
- If you see a specific error in `testQuery.error` → That's your clue

---

## Step 4: Check if User is Actually Logged In

In your dashboard page, open browser console and run:
```javascript
const { data, error } = await (await import('@/lib/supabase/client')).createClient().auth.getSession();
console.log('Session:', data.session);
console.log('User:', data.session?.user);
```

**If session is null:**
1. You're not logged in
2. Cookies are blocked
3. Session expired

---

## Step 5: Verify Environment Variables

Check `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG... (starts with "eyJ")
```

**Common mistakes:**
- Using service_role key instead of anon key
- Missing NEXT_PUBLIC_ prefix
- URL doesn't match project

---

## Step 6: Test Direct Insert with user_id

To isolate if it's an RLS issue vs code issue, try inserting directly from SQL Editor with a known user_id:

```sql
-- First, get your test user's ID
SELECT id, email FROM auth.users LIMIT 5;

-- Then try inserting with that ID
INSERT INTO public.trades (user_id, symbol, entry_price, exit_price, quantity, pnl, strategy)
VALUES (
  'PASTE_USER_ID_HERE',
  'TEST',
  100.00,
  110.00,
  1,
  10.00,
  'Test'
);
```

**If this works:**
- RLS policies are correct
- Issue is with session authentication in your app

**If this fails:**
- Check if RLS is actually enabled: `SELECT * FROM pg_tables WHERE tablename = 'trades';`
- Verify user_id column exists with proper FK

---

## Step 7: Bypass RLS Temporarily for Testing

**ONLY FOR DEBUGGING - REMOVE AFTER:**

```sql
-- Temporarily allow all authenticated users to read/write all trades
DROP POLICY IF EXISTS "temp_allow_all_select" ON public.trades;
DROP POLICY IF EXISTS "temp_allow_all_insert" ON public.trades;

CREATE POLICY "temp_allow_all_select"
ON public.trades
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "temp_allow_all_insert"
ON public.trades
FOR INSERT
TO authenticated
WITH CHECK (true);
```

**Test your app:**
- If it NOW works → The issue is `auth.uid() != user_id` mismatch
- If it STILL fails → The issue is authentication/session not being passed

**IMPORTANT: Delete these policies after testing:**
```sql
DROP POLICY IF EXISTS "temp_allow_all_select" ON public.trades;
DROP POLICY IF EXISTS "temp_allow_all_insert" ON public.trades;
```

---

## Step 8: Nuclear Option - Fresh Start

If nothing works, reset everything:

```sql
-- Drop all policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'trades') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.trades';
    END LOOP;
END $$;

-- Disable and re-enable RLS
ALTER TABLE public.trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Recreate policies from scratch
CREATE POLICY "enable_read_own_trades"
ON public.trades
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "enable_insert_own_trades"
ON public.trades
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## Most Likely Fix

Based on your description, you probably have **duplicate policies**. Run this:

```sql
-- See all current policies
SELECT * FROM pg_policies WHERE tablename = 'trades';
```

Then drop the old ones you created manually and use the ones from `rls-migration.sql`.
