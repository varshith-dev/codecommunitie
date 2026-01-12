# 🚨 QUICK FIX: Posts Not Showing in Feed

## The Problem
You can see your posts on your profile page, but they don't appear in the main feed.

## The Cause
Your user account exists, but you don't have a profile entry in the `profiles` table. The feed joins posts with profiles, so without a profile, posts are filtered out.

## The Solution (2 Minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project
2. Click **SQL Editor** in the left sidebar
3. Click **New query**

### Step 2: Run This SQL
Copy and paste this into the SQL editor:

```sql
-- Create profiles for all users who don't have one
INSERT INTO public.profiles (id, username, created_at)
SELECT 
  id,
  split_part(email, '@', 1) as username,
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
```

### Step 3: Click "Run" (or press Ctrl+Enter)
You should see: "Success. 1 row(s) affected" or similar

### Step 4: Refresh Your Browser
Go back to http://localhost:5173 and refresh the page.

**Your posts should now appear in the feed!** ✅

---

## Alternative: Use the SQL File
I've created `create_my_profile.sql` with all the steps. Just:
1. Open it in Supabase SQL Editor
2. Run each section step by step
3. Refresh your browser

---

## Why This Happens
When you sign up with magic link, sometimes the profile entry doesn't get created automatically. The database trigger should do this, but if you created your account before running the latest schema, it wouldn't have worked.

---

## Prevent This in the Future
The updated `database_complete.sql` includes a trigger to auto-create profiles for new users. Any new users won't have this problem!
