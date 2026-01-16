/*
  COMPREHENSIVE AUDIT & FIX SCRIPT (ULTIMATE DYNAMIC VERSION)
  -----------------------------------------------------------
  1. Cleans up orphaned data using DYNAMIC SQL to avoid "column does not exist" errors
  2. Fixes Foreign Key Cascades
  3. Audits and Fixes RLS Policies
*/

-- =================================================================
-- SECTION 1: DYNAMIC PRE-CLEANUP
-- (Uses EXECUTE to prevent parser errors if columns don't exist)
-- =================================================================

DO $$
BEGIN
    -- 1. Profiles (Remove ghosts not in auth.users)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id') THEN
        EXECUTE 'DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users)';
        RAISE NOTICE 'Cleaned orphan profiles';
    END IF;

    -- 2. Posts
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'user_id') THEN
        EXECUTE 'DELETE FROM public.posts WHERE user_id NOT IN (SELECT id FROM public.profiles)';
    END IF;

    -- 3. Comments
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'user_id') THEN
        EXECUTE 'DELETE FROM public.comments WHERE user_id NOT IN (SELECT id FROM public.profiles)';
    END IF;

    -- 4. Likes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'likes' AND column_name = 'user_id') THEN
        EXECUTE 'DELETE FROM public.likes WHERE user_id NOT IN (SELECT id FROM public.profiles)';
    END IF;

    -- 5. Bookmarks
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookmarks' AND column_name = 'user_id') THEN
        EXECUTE 'DELETE FROM public.bookmarks WHERE user_id NOT IN (SELECT id FROM public.profiles)';
    END IF;

    -- 6. Follows
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'follows' AND column_name = 'follower_id') THEN
        EXECUTE 'DELETE FROM public.follows WHERE follower_id NOT IN (SELECT id FROM public.profiles)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'follows' AND column_name = 'following_id') THEN
        EXECUTE 'DELETE FROM public.follows WHERE following_id NOT IN (SELECT id FROM public.profiles)';
    END IF;

    -- 7. Verification Requests
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_requests' AND column_name = 'user_id') THEN
        EXECUTE 'DELETE FROM public.verification_requests WHERE user_id NOT IN (SELECT id FROM public.profiles)';
    END IF;

    -- 8. Ad Campaigns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'advertiser_id') THEN
        EXECUTE 'DELETE FROM public.ad_campaigns WHERE advertiser_id NOT IN (SELECT id FROM public.profiles)';
    END IF;

    -- 9. Ad Credit Requests
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_credit_requests' AND column_name = 'user_id') THEN
        EXECUTE 'DELETE FROM public.ad_credit_requests WHERE user_id NOT IN (SELECT id FROM public.profiles)';
    END IF;

    -- 10. User Prompts (Dynamic Check)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'user_id') THEN
        EXECUTE 'DELETE FROM public.user_prompts WHERE user_id NOT IN (SELECT id FROM public.profiles)';
        RAISE NOTICE 'Cleaned orphan user_prompts';
    END IF;

    -- 11. Notifications (Dynamic Check for various column names)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
        EXECUTE 'DELETE FROM public.notifications WHERE user_id NOT IN (SELECT id FROM public.profiles)';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'recipient_id') THEN
        EXECUTE 'DELETE FROM public.notifications WHERE recipient_id NOT IN (SELECT id FROM public.profiles)';
    END IF;

    -- 12. Advertisements
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advertisements' AND column_name = 'campaign_id') THEN
        EXECUTE 'DELETE FROM public.advertisements WHERE campaign_id NOT IN (SELECT id FROM public.ad_campaigns)';
    END IF;

END $$;


-- =================================================================
-- SECTION 2: FOREIGN KEY CASCADES
-- =================================================================

DO $$     
BEGIN
    -- 1. PROFILES
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- 2. POSTS
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'user_id') THEN
        ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
        ALTER TABLE public.posts ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- 3. COMMENTS
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'user_id') THEN
        ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
        ALTER TABLE public.comments ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- 4. LIKES
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'likes' AND column_name = 'user_id') THEN
        ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;
        ALTER TABLE public.likes ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- 5. BOOKMARKS
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookmarks' AND column_name = 'user_id') THEN
        ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_id_fkey;
        ALTER TABLE public.bookmarks ADD CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- 6. FOLLOWS
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'follows' AND column_name = 'follower_id') THEN
        ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
        ALTER TABLE public.follows ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'follows' AND column_name = 'following_id') THEN
        ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_following_id_fkey;
        ALTER TABLE public.follows ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- 7. VERIFICATION REQUESTS
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_requests' AND column_name = 'user_id') THEN
        ALTER TABLE public.verification_requests DROP CONSTRAINT IF EXISTS verification_requests_user_id_fkey;
        ALTER TABLE public.verification_requests ADD CONSTRAINT verification_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- 8. AD CAMPAIGNS
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'advertiser_id') THEN
        ALTER TABLE public.ad_campaigns DROP CONSTRAINT IF EXISTS ad_campaigns_advertiser_id_fkey;
        ALTER TABLE public.ad_campaigns ADD CONSTRAINT ad_campaigns_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- 9. AD CREDIT REQUESTS
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_credit_requests' AND column_name = 'user_id') THEN
        ALTER TABLE public.ad_credit_requests DROP CONSTRAINT IF EXISTS ad_credit_requests_user_id_fkey;
        ALTER TABLE public.ad_credit_requests ADD CONSTRAINT ad_credit_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- 10. USER PROMPTS
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'user_id') THEN
        ALTER TABLE public.user_prompts DROP CONSTRAINT IF EXISTS user_prompts_user_id_fkey;
        ALTER TABLE public.user_prompts ADD CONSTRAINT user_prompts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- 11. NOTIFICATIONS
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
        ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
        ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'recipient_id') THEN
        ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_recipient_id_fkey;
        ALTER TABLE public.notifications ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- 12. ADVERTISEMENTS
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advertisements' AND column_name = 'campaign_id') THEN
        ALTER TABLE public.advertisements DROP CONSTRAINT IF EXISTS advertisements_campaign_id_fkey;
        ALTER TABLE public.advertisements ADD CONSTRAINT advertisements_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE CASCADE;
    END IF;

    -- 13. AD REPORTS
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_reports' AND column_name = 'reporter_id') THEN
        ALTER TABLE public.ad_reports DROP CONSTRAINT IF EXISTS ad_reports_reporter_id_fkey;
        ALTER TABLE public.ad_reports ADD CONSTRAINT ad_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_reports' AND column_name = 'ad_id') THEN
        ALTER TABLE public.ad_reports DROP CONSTRAINT IF EXISTS ad_reports_ad_id_fkey;
        ALTER TABLE public.ad_reports ADD CONSTRAINT ad_reports_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.advertisements(id) ON DELETE CASCADE;
    END IF;

END $$;


-- =================================================================
-- SECTION 3: RLS POLICY AUDIT
-- =================================================================

-- Helper function to check email verification
CREATE OR REPLACE FUNCTION public.is_email_verified()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (email_confirmed_at IS NOT NULL)
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. POSTS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;
CREATE POLICY "Public posts are viewable by everyone" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Verified users can create posts" ON public.posts;
CREATE POLICY "Verified users can create posts" ON public.posts FOR INSERT 
WITH CHECK (auth.uid() = user_id AND public.is_email_verified());

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE
USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
));


-- 2. COMMENTS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.comments;
CREATE POLICY "Comments viewable by everyone" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Verified users can insert comments" ON public.comments;
CREATE POLICY "Verified users can insert comments" ON public.comments FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.is_email_verified());

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE
USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
));


-- 3. USER PROMPTS (Dynamic Policy Create)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_prompts') THEN
        ALTER TABLE public.user_prompts ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own prompts" ON public.user_prompts;
        EXECUTE 'CREATE POLICY "Users can view own prompts" ON public.user_prompts FOR SELECT USING (auth.uid() = user_id)';

        DROP POLICY IF EXISTS "Users can dismiss prompts" ON public.user_prompts;
        EXECUTE 'CREATE POLICY "Users can dismiss prompts" ON public.user_prompts FOR UPDATE USING (auth.uid() = user_id)';
        
        DROP POLICY IF EXISTS "Users can insert own prompts" ON public.user_prompts;
        EXECUTE 'CREATE POLICY "Users can insert own prompts" ON public.user_prompts FOR INSERT WITH CHECK (auth.uid() = user_id)';
    END IF;
END $$;


-- 4. AD CAMPAIGNS
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Advertisers view own campaigns" ON public.ad_campaigns;
CREATE POLICY "Advertisers view own campaigns" ON public.ad_campaigns FOR SELECT
USING (auth.uid() = advertiser_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Advertisers insert own campaigns" ON public.ad_campaigns;
CREATE POLICY "Advertisers insert own campaigns" ON public.ad_campaigns FOR INSERT
WITH CHECK (auth.uid() = advertiser_id);

DROP POLICY IF EXISTS "Advertisers update own campaigns" ON public.ad_campaigns;
CREATE POLICY "Advertisers update own campaigns" ON public.ad_campaigns FOR UPDATE
USING (auth.uid() = advertiser_id);
