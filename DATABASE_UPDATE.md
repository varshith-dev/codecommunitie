# Database Setup Instructions

Before running the application, you need to run these SQL scripts in your Supabase SQL Editor **in order**:

## Step 1: Run Database Schema (if not already done)
If you haven't set up your database yet, run:
```
database_complete.sql
```

## Step 2: Add Missing Profiles (IMPORTANT)
Run this to ensure all existing users have profile entries:
```
fix_missing_profiles.sql
```

## Step 3: Add Description Field and Search Indexes (NEW)
Run this to add the description field for meme posts and search indexes:
```
add_description_field.sql
```

## Verification

After running all scripts, verify in Supabase SQL Editor:

```sql
-- Check that description column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND table_schema = 'public'
  AND column_name = 'description';

-- Check that all users have profiles
SELECT COUNT(*) as users_without_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
-- Should return 0
```

## What's New

### Features Implemented:
1. **Username-based Profile URLs**: Access profiles via `/user/@username` instead of `/user/uuid`
2. **Search Functionality**: Search for users, posts, and code snippets from the new Search page
3. **Meme Descriptions**: Add optional descriptions to image/video posts
4. **Improved Profile Display**: Better handling of missing profiles with descriptive fallbacks

### Navigation Updates:
- Added Search icon to both desktop and mobile navigation
- All profile links now use @username format for cleaner URLs
- Avatar clicks navigate to user profiles

### Database Changes:
- Added `description` TEXT field to `posts` table
- Added full-text search indexes for better performance
