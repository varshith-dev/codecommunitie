-- Add scheduled_at column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'scheduled_at') THEN 
        ALTER TABLE public.posts ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'status') THEN 
        ALTER TABLE public.posts ADD COLUMN status TEXT DEFAULT 'published';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'visibility') THEN 
        ALTER TABLE public.posts ADD COLUMN visibility TEXT DEFAULT 'public';
    END IF;
END $$;

-- Update RLS Policies for Posts to handle Drafts and Scheduled Posts securely

-- 1. Drop existing permissive select policy (old name)
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;

-- 2. Drop the NEW policy name if it exists (to fix the error you saw)
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;

-- 3. Create new comprehensive select policy
-- Users can see a post IF:
-- - It is their own post (regardless of status)
-- - OR it is published AND (scheduled_at is null OR passed) AND visibility is public
CREATE POLICY "Public posts are viewable by everyone" 
ON public.posts FOR SELECT 
USING (
  (auth.uid() = user_id) OR
  (
    status = 'published' AND 
    visibility = 'public' AND
    (scheduled_at IS NULL OR scheduled_at <= NOW())
  )
);
