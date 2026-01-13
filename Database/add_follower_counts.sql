-- ================================================================
-- FIX: Add Missing Follower Count Columns
-- ================================================================
-- Run this if you get "column follower_count does not exist" error
-- ================================================================

-- Add follower and following count columns if they don't exist
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Update existing counts based on actual follows
UPDATE public.profiles p
SET 
  follower_count = (
    SELECT COUNT(*) 
    FROM public.follows 
    WHERE following_id = p.id
  ),
  following_count = (
    SELECT COUNT(*) 
    FROM public.follows 
    WHERE follower_id = p.id
  );

-- Create trigger to auto-update counts on follow/unfollow
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment follower count for the followed user
    UPDATE public.profiles 
    SET follower_count = follower_count + 1 
    WHERE id = NEW.following_id;
    
    -- Increment following count for the follower
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement follower count
    UPDATE public.profiles 
    SET follower_count = GREATEST(follower_count - 1, 0) 
    WHERE id = OLD.following_id;
    
    -- Decrement following count
    UPDATE public.profiles 
    SET following_count = GREATEST(following_count - 1, 0) 
    WHERE id = OLD.follower_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_follow_change ON public.follows;

-- Create new trigger
CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- Verify the columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name IN ('follower_count', 'following_count')
ORDER BY column_name;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✅ Follower count columns added successfully!';
  RAISE NOTICE 'Trigger created to auto-update counts on follow/unfollow';
END $$;
