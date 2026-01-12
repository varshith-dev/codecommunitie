-- MINIMAL FIX: Just add the essential columns for Media Review to work
-- Run this if the full migration failed

-- Add content_rating column
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS content_rating TEXT DEFAULT 'unreviewed';

-- Add review tracking columns
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- Create index
CREATE INDEX IF NOT EXISTS idx_posts_content_rating ON public.posts(content_rating);

SELECT 'Essential columns added! Media Review should work now.' as status;
