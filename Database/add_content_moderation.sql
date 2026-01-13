-- Content Moderation System Database Setup (FIXED)
-- Run this in Supabase SQL Editor

-- ==========================================
-- 1. Add content moderation fields to posts
-- ==========================================

-- Add content rating column
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS content_rating TEXT DEFAULT 'unreviewed' 
CHECK (content_rating IN ('unreviewed', 'safe', 'risk', 'removed'));

-- Add review tracking columns
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id);

-- Create index for filtering by rating
CREATE INDEX IF NOT EXISTS idx_posts_content_rating ON public.posts(content_rating);
CREATE INDEX IF NOT EXISTS idx_posts_reviewed_at ON public.posts(reviewed_at DESC);

-- ==========================================
-- 2. Create content reviews history table
-- ==========================================

-- First, check if posts.id is bigint or something else
-- Adjust the post_id type accordingly
CREATE TABLE IF NOT EXISTS public.content_reviews (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    rating TEXT NOT NULL CHECK (rating IN ('safe', 'risk', 'removed')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key separately to avoid type issues
DO $$
BEGIN
    -- Try to add foreign key, ignore if it fails due to type mismatch
    ALTER TABLE public.content_reviews 
    ADD CONSTRAINT fk_content_reviews_post 
    FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
EXCEPTION
    WHEN foreign_key_violation OR datatype_mismatch THEN
        RAISE NOTICE 'Foreign key constraint skipped - check posts.id type';
END $$;

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_content_reviews_post_id ON public.content_reviews(post_id);
CREATE INDEX IF NOT EXISTS idx_content_reviews_admin_id ON public.content_reviews(admin_id);
CREATE INDEX IF NOT EXISTS idx_content_reviews_created_at ON public.content_reviews(created_at DESC);

-- ==========================================
-- 3. Create admin review progress table
-- ==========================================

CREATE TABLE IF NOT EXISTS public.admin_review_progress (
    admin_id UUID PRIMARY KEY REFERENCES public.profiles(id),
    last_reviewed_post_id BIGINT,
    current_filter JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key separately
DO $$
BEGIN
    ALTER TABLE public.admin_review_progress 
    ADD CONSTRAINT fk_admin_review_progress_post 
    FOREIGN KEY (last_reviewed_post_id) REFERENCES public.posts(id) ON DELETE SET NULL;
EXCEPTION
    WHEN foreign_key_violation OR datatype_mismatch THEN
        RAISE NOTICE 'Foreign key constraint skipped - check posts.id type';
END $$;

-- ==========================================
-- 4. Disable RLS (temporary for development)
-- ==========================================

ALTER TABLE public.content_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_review_progress DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- 5. Grant permissions
-- ==========================================

GRANT ALL ON public.content_reviews TO authenticated;
GRANT ALL ON public.admin_review_progress TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE content_reviews_id_seq TO authenticated;

-- ==========================================
-- 6. Verify setup
-- ==========================================

SELECT 'Content moderation tables created successfully!' as status;

-- Check posts table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('content_rating', 'reviewed_at', 'reviewed_by', 'id');
