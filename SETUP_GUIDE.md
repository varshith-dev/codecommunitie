# 🚀 Quick Setup Guide for CodeKrafts

Follow these steps **in order** to get CodeKrafts running locally.

---

## ✅ Step 1: Install Dependencies

```bash
npm install
```

---

## ✅ Step 2: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in or create an account
4. Click "New Project"
5. Fill in:
   - **Name**: CodeKrafts (or any name)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to you
6. Click "Create new project"
7. Wait for project to finish setting up (~2 minutes)

---

## ✅ Step 3: Run Database Schema

1. In your Supabase project, click **"SQL Editor"** in the left sidebar
2. Click "New query"
3. Open the file `database_complete.sql` in this project
4. **Copy ALL the contents** and paste into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see: "Success. No rows returned"

---

## ✅ Step 4: Create Storage Buckets

1. In Supabase, click **"Storage"** in the left sidebar
2. Click "Create a new bucket"
3. Create these THREE buckets (one at a time):

   **Bucket 1:**
   - Name: `profile-pictures`
   - ✅ Check "Public bucket"
   - Click "Create bucket"

   **Bucket 2:**
   - Name: `banner-images`
   - ✅ Check "Public bucket"
   - Click "Create bucket"

   **Bucket 3:**
   - Name: `meme-uploads`
   - ✅ Check "Public bucket"
   - Click "Create bucket"

---

## ✅ Step 5: Get Your API Credentials

1. In Supabase, click **"Settings"** (gear icon) in the left sidebar
2. Click **"API"** in the settings menu
3. You'll see two important values:
   - **Project URL**: Looks like `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`

---

## ✅ Step 6: Configure Environment Variables

1. In your project folder, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` in your code editor

3. Replace with your actual values:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. Save the file

---

## ✅ Step 7: Start the Development Server

```bash
npm run dev
```

The app should now open at [http://localhost:5173](http://localhost:5173)

---

## ✅ Step 8: Create Your First Account

1. Click "Get Started" or go to the Auth page
2. Enter your email
3. Click "Send Magic Link"
4. Check your email (including spam folder)
5. Click the magic link
6. You'll be redirected and logged in!

---

## 🎉 You're Done!

Your CodeKrafts platform is now fully functional. Try:
- Creating a post (code or meme)
- Uploading a profile picture
- Following other users
- Viewing analytics in the dashboard

---

## 🔧 Troubleshooting

### "Database Not Set Up" Error
- Make sure you ran the entire `database_complete.sql` file
- Check that all tables were created in Supabase Table Editor

### "Error loading feed" 
- Verify your `.env.local` file has the correct credentials
- Make sure you copied the URL and key exactly (no extra spaces)
- Restart the dev server after changing `.env.local`

### Images won't upload
- Confirm all 3 storage buckets are created and set to PUBLIC
- Check bucket names match exactly: `profile-pictures`, `banner-images`, `meme-uploads`

### Magic link not arriving
- Check spam/junk folder
- Wait 2-3 minutes (sometimes delayed)
- Try a different email address

---

## 📚 Need More Help?

See the full [README.md](./README.md) for detailed documentation.
