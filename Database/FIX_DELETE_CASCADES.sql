-- FIX: Account Deletion Errors
-- Updates Foreign Key constraints to ON DELETE CASCADE.
-- RoBUST VERSION: Checks for column existence before applying constraints.

-- 1. PROFILES
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. POSTS & COMMENTS
ALTER TABLE public.posts
DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE public.posts
ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.comments
DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE public.comments
ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. INTERACTIONS
ALTER TABLE public.likes
DROP CONSTRAINT IF EXISTS likes_user_id_fkey;
ALTER TABLE public.likes
ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.follows
DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
ALTER TABLE public.follows
ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.follows
DROP CONSTRAINT IF EXISTS follows_following_id_fkey;
ALTER TABLE public.follows
ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.bookmarks
DROP CONSTRAINT IF EXISTS bookmarks_user_id_fkey;
ALTER TABLE public.bookmarks
ADD CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. VERIFICATION & ADS
ALTER TABLE public.verification_requests
DROP CONSTRAINT IF EXISTS verification_requests_user_id_fkey;
ALTER TABLE public.verification_requests
ADD CONSTRAINT verification_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- AD CAMPAIGNS (Advertiser)
ALTER TABLE public.ad_campaigns
DROP CONSTRAINT IF EXISTS ad_campaigns_advertiser_id_fkey;
ALTER TABLE public.ad_campaigns
ADD CONSTRAINT ad_campaigns_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ADVERTISEMENTS (Delete when Campaign is deleted)
ALTER TABLE public.advertisements
DROP CONSTRAINT IF EXISTS advertisements_campaign_id_fkey;
ALTER TABLE public.advertisements
ADD CONSTRAINT advertisements_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE CASCADE;

ALTER TABLE public.ad_credit_requests
DROP CONSTRAINT IF EXISTS ad_credit_requests_user_id_fkey;
ALTER TABLE public.ad_credit_requests
ADD CONSTRAINT ad_credit_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. ROBUST UPDATES FOR OPTIONAL TABLES

-- User Prompts
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_prompts' AND column_name = 'user_id') THEN
        ALTER TABLE public.user_prompts DROP CONSTRAINT IF EXISTS user_prompts_user_id_fkey;
        ALTER TABLE public.user_prompts ADD CONSTRAINT user_prompts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping user_prompts: %', SQLERRM; END $$;

-- Ad Reports
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_reports' AND column_name = 'reporter_id') THEN
         ALTER TABLE public.ad_reports DROP CONSTRAINT IF EXISTS ad_reports_reporter_id_fkey;
         ALTER TABLE public.ad_reports ADD CONSTRAINT ad_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_reports' AND column_name = 'ad_id') THEN
         ALTER TABLE public.ad_reports DROP CONSTRAINT IF EXISTS ad_reports_ad_id_fkey;
         ALTER TABLE public.ad_reports ADD CONSTRAINT ad_reports_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.advertisements(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping ad_reports: %', SQLERRM; END $$;

-- Notifications (Check for user_id OR recipient_id)
DO $$ BEGIN
    -- Case 1: user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
        ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
        ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Case 2: recipient_id (common alternative)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'recipient_id') THEN
         ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_recipient_id_fkey;
         ALTER TABLE public.notifications ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping notifications: %', SQLERRM; END $$;
