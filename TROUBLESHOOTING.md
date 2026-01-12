# 🔧 Quick Fixes for Common Issues

## Issue 1: Profile Photo Upload Fails

**Error Message**: "Storage bucket 'profile-pictures' not found"

**Solution**:
1. Go to your Supabase project
2. Click **Storage** in the left sidebar
3. Click **"New bucket"**
4. Create these buckets (make sure "Public bucket" is checked):
   - `profile-pictures`
   - `banner-images`  
   - `meme-uploads`

5. **Important**: Each bucket must be set to **PUBLIC**

---

## Issue 2: Posts Not Showing in Feed

**Symptom**: You can see your posts on your profile page, but they don't appear in the main feed.

**Cause**: Your user profile entry might not be created in the database.

**Quick Fix**:

1. Open Supabase **SQL Editor**
2. Run this query to create/update the database function:

```sql
-- Function to auto-create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

3. **Then manually create your profile** (replace YOUR_USER_ID and YOUR_EMAIL):

```sql
-- Get your user ID first
SELECT id, email FROM auth.users;

-- Insert your profile (replace the ID with yours from above)
INSERT INTO public.profiles (id, username)
VALUES ('your-user-id-here', 'your-username')
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;
```

4. Refresh the feed page - your posts should now appear!

---

## Issue 3: "Error loading feed" Message

**Solution**: Make sure you've completed ALL setup steps:

1. ✅ Run `database_complete.sql` in Supabase SQL Editor
2. ✅ Create storage buckets (profile-pictures, banner-images, meme-uploads)
3. ✅ Configure `.env.local` with correct credentials
4. ✅ Restart dev server after changing `.env.local`

---

## Testing Your Setup

### Test Profile Upload:
1. Go to `/profile`
2. Click Edit Profile
3. Click the camera icon to upload a photo
4. If you see an error, check the browser console (F12) for details

### Test Feed Display:
1. Go to `/create`
2. Create a test post
3. Go back to home `/`
4. Your post should appear

If it doesn't appear:
- Check browser console for errors
- Verify your profile exists in Supabase Table Editor > profiles table
- Make sure the `posts` table has your posts

---

## Still Having Issues?

### Check Browser Console:
1. Press F12 to open Developer Tools
2. Go to Console tab
3. Look for red error messages
4. Share the error with me!

### Check Supabase Logs:
1. In Supabase, go to **Logs** → **API**
2. Look for failed requests
3. Check the error messages

---

## Need Help?
If you still can't resolve the issue, please share:
- The exact error message
- Browser console logs (F12 → Console)
- Supabase API logs

I'll help you fix it immediately!
