-- Add 'blog' to the allowed post types
-- This fixes the "posts_type_check" constraint violation

-- Drop the old constraint
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_type_check;

-- Add new constraint with 'blog' included
ALTER TABLE public.posts ADD CONSTRAINT posts_type_check 
CHECK (type IN ('code', 'meme', 'blog'));

-- Verify the change
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.posts'::regclass 
AND conname = 'posts_type_check';
