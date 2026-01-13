-- Add review_status column to posts table for media moderation
ALTER TABLE posts ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id);

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_posts_review_status ON posts(review_status);

-- Update RLS policy to let admins update review status
DROP POLICY IF EXISTS "Admins can update post review status" ON posts;
CREATE POLICY "Admins can update post review status" ON posts
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
