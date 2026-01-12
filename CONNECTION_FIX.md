# 🔧 Connection Error Fix

## You're seeing "Database Not Set Up" error

This means the app can't connect to Supabase. Here's how to fix it:

### Step 1: Check Your .env.local File

1. Look in your project folder for a file called `.env.local`
2. If it doesn't exist, copy `.env.example` to `.env.local`:
   ```bash
   copy .env.example .env.local
   ```

### Step 2: Add Your Supabase Credentials

Open `.env.local` and fill in your actual Supabase details:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-very-long-anon-key-here
```

**Where to find these:**
1. Go to your Supabase project
2. Click **Settings** (gear icon) in the left sidebar
3. Click **API**
4. Copy:
   - **Project URL** → Put in `VITE_SUPABASE_URL`
   - **anon public** key → Put in `VITE_SUPABASE_ANON_KEY`

### Step 3: Restart the Dev Server

After saving `.env.local`:
1. Stop the dev server (Ctrl+C in terminal)
2. Run `npm run dev` again

### Step 4: Refresh Browser

Go to http://localhost:5173 and the error should be gone!

---

## Still Not Working?

### Check 1: Verify .env.local exists
Run in terminal:
```bash
dir .env.local
```
You should see the file listed.

### Check 2: Verify the URL format
Your `VITE_SUPABASE_URL` should look like:
- ✅ `https://abcdefghijklm.supabase.co`
- ❌ NOT like `https://app.supabase.com/project/...`

### Check 3: Check for typos
- No spaces before or after the `=` sign
- No quotes around the values
- No extra characters

---

## Quick Test

After fixing `.env.local`, check browser console (F12):
- If you see "Supabase error" → Database schema issue
- If you see "Database Not Set Up" → Still connection issue
- If feed loads → Success! ✅
