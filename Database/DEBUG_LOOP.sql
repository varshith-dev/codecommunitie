-- INVESTIGATION SCRIPT

-- 1. Check for duplicate AUTOMATION RULES (Source of the spam?)
SELECT id, title, trigger_type, is_active FROM public.prompt_automations WHERE trigger_type = 'incomplete_profile';

-- 2. Check the User's Profile Data (Why does it think it's incomplete?)
-- Replace with the specific user's username if known, or just list a few
SELECT id, username, display_name, bio, profile_picture_url, banner_image_url 
FROM public.profiles 
ORDER BY updated_at DESC LIMIT 5;

-- 3. Check the User's Prompts (The actual spam)
SELECT id, title, is_dismissed, created_at 
FROM public.user_prompts 
ORDER BY created_at DESC LIMIT 10;
