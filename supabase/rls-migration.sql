-- Run this SQL in your Supabase SQL Editor to:
-- 1. Add user_id column to trades table (if not exists)
-- 2. Enable Row Level Security (RLS)
-- 3. Create policies so users can only access their own trades

-- Step 1: Add user_id column (run only if your trades table doesn't have it yet)
ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Enable RLS on the trades table
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if any (optional - only if you have conflicting policies)
-- DROP POLICY IF EXISTS "Users can view own trades" ON public.trades;
-- DROP POLICY IF EXISTS "Users can insert own trades" ON public.trades;
-- DROP POLICY IF EXISTS "Users can update own trades" ON public.trades;
-- DROP POLICY IF EXISTS "Users can delete own trades" ON public.trades;

-- Step 4: Create RLS policies using auth.uid()

-- Users can SELECT only their own trades
CREATE POLICY "Users can view own trades"
ON public.trades
FOR SELECT
USING (auth.uid() = user_id);

-- Users can INSERT only with their own user_id
CREATE POLICY "Users can insert own trades"
ON public.trades
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can UPDATE only their own trades
CREATE POLICY "Users can update own trades"
ON public.trades
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can DELETE only their own trades
CREATE POLICY "Users can delete own trades"
ON public.trades
FOR DELETE
USING (auth.uid() = user_id);

-- Optional: Backfill user_id for existing rows (if you have old trades without user_id)
-- You may need to assign them to a specific user or leave them orphaned.
-- UPDATE public.trades SET user_id = 'YOUR_USER_UUID' WHERE user_id IS NULL;
