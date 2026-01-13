-- Add description field to posts table for memes
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS description TEXT;

-- Add index for text search on posts
CREATE INDEX IF NOT EXISTS idx_posts_title_search ON public.posts USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_posts_description_search ON public.posts USING gin(to_tsvector('english', COALESCE(description, '')));

-- Add index for username search on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username_search ON public.profiles USING gin(to_tsvector('english', COALESCE(username, '')));
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_search ON public.profiles USING gin(to_tsvector('english', COALESCE(display_name, '')));

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
