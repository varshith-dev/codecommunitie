-- ============================================
-- FINAL FIX: Add Missing Foreign Key
-- ============================================
-- This fixes the "Could not find a relationship" error

-- Add foreign key constraint to posts table
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

ALTER TABLE public.posts
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Verify the constraint was added
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conname = 'posts_user_id_fkey';

-- ============================================
-- SUCCESS! Refresh your browser after running this
-- ============================================
