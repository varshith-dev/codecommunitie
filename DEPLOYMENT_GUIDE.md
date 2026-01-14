# Email Backend Deployment Guide

## Overview

Your email system uses backend API endpoints in the `/api` folder that need to be deployed to Vercel as serverless functions. This guide shows you how to deploy and configure everything.

## Architecture

```
Frontend (Vite/React) → Vercel Serverless Functions (/api/*) → ZeptoMail SMTP → Email Delivery
```

## Files in `/api` Folder

1. **otp.js** - Handles OTP generation, verification, and password reset
2. **send-email.js** - Sends custom emails (admin features)
3. **generate-link.js** - Generates verification links

## Deployment Steps

### Step 1: Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 2: Add Environment Variables in Vercel Dashboard

Go to your Vercel project → Settings → Environment Variables and add:

| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Supabase Dashboard → Settings → API |
| `SMTP_PASSWORD` | ZeptoMail SMTP password | Already in your code (or get from ZeptoMail dashboard) |

**Note:** The SMTP password is already in your `otp.js` and `send-email.js` files. You can use that value or set it as an environment variable for better security.

### Step 3: Verify Deployment

After deployment, Vercel will give you a URL like `https://your-app.vercel.app`

Test the API endpoints:
- `https://your-app.vercel.app/api/otp`
- `https://your-app.vercel.app/api/send-email`

## Local Development

For local development, you have two options:

### Option 1: Use Production API (Recommended)
The app is configured to use the production API by default in development. No setup needed!

### Option 2: Run API Locally
If you want to run the API locally:

1. Set environment variable:
   ```bash
   # .env.local
   VITE_API_URL=http://localhost:8000
   ```

2. Run a local server for the API files (you'll need to set up Express or similar)

## How It Works

### Production (Vercel)
- Frontend calls `/api/otp`, `/api/send-email`, etc.
- Vercel automatically routes these to serverless functions
- No server management needed!

### Development
- Frontend calls production API at `https://codecommunitie.vercel.app/api/*`
- Or set `VITE_API_URL` to use localhost if running API locally

## Email Flow Examples

### Signup Flow
1. User signs up → Frontend calls `signUpWithEmail`
2. Supabase creates user
3. Frontend calls `/api/send-email` with welcome template
4. otp.js sends confirmation email via ZeptoMail
5. User receives email and verifies

### Password Reset Flow
1. User requests reset → Frontend calls `/api/otp` with `action: 'forgot_password'`
2. API generates OTP code and stores in database
3. API sends email with OTP via ZeptoMail
4. User enters OTP → Frontend calls `/api/otp` with `action: 'reset_password'`
5. API verifies OTP and updates password

## Troubleshooting

### "Failed to send email"
- Check that environment variables are set in Vercel
- Verify SMTP credentials are correct
- Check Vercel function logs

### "API endpoint not found"
- Ensure you deployed to Vercel
- Check that `/api` folder is included in deployment
- Verify vercel.json configuration

### OTP not received
- Check spam folder
- Verify email address is correct
- Check Vercel function logs for errors

## Monitoring

View logs in Vercel Dashboard:
1. Go to your project
2. Click "Deployments"
3. Click on latest deployment
4. Click "Functions" tab to see serverless function logs

## Security Notes

- Service role key should ONLY be in Vercel environment variables, never in frontend code
- SMTP password should be in environment variables for production
- API endpoints use CORS to allow requests from your domain

## Next Steps

After deployment:
1. Test signup flow end-to-end
2. Test password reset
3. Test OTP verification
4. Test admin email sending
5. Monitor function logs for any errors
