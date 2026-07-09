# Vercel Deployment Guide

## Step 1: Deploy the Backend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. **Select the `backend` folder as the root directory** (important!)
5. Click "Deploy"

## Step 2: Set Environment Variables in Vercel

After deployment, go to your Vercel project settings:

1. Click "Settings" → "Environment Variables"
2. Add all these variables:

```
NODE_ENV=production
PORT=3000
DB_HOST=your_postgresql_host
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgresql_password
DB_NAME=manage_money
DB_SSL=false

JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_min_32_chars
JWT_REFRESH_EXPIRES_IN=30d

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-vercel-domain.vercel.app/api/v1/auth/google/callback

FRONTEND_URL=https://your-vercel-domain.vercel.app
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
```

**Important:** Replace `your-vercel-domain` with your actual Vercel domain!

## Step 3: Verify Frontend & Backend Connection

After deployment and environment variables are set:

1. Visit your Vercel domain: `https://your-domain.vercel.app`
2. You should see the Manage Money frontend
3. Click "Sign in" to test the authentication flow
4. Check that the dashboard loads with data from the API

## Step 4: Fix the Google OAuth Callback

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Find your OAuth 2.0 credential
3. Update "Authorized redirect URIs" to include:
   ```
   https://your-vercel-domain.vercel.app/api/v1/auth/google/callback
   ```

## Troubleshooting

### Frontend shows but API calls fail
- Check that `ALLOWED_ORIGINS` includes your Vercel domain
- Verify database credentials in environment variables
- Check Vercel logs: `vercel logs --follow`

### Database connection fails
- Ensure your PostgreSQL host is accessible from the internet
- Or use a managed PostgreSQL service (AWS RDS, Railway, Supabase, etc.)
- Verify credentials are correct

### Cannot find the frontend
- Make sure the backend is set as root directory, not the frontend
- Frontend files should be in `backend/public/`

## Local Development

To test locally:
```bash
cd backend
npm install
npm run build
npm run start
```

Then visit `http://localhost:3000`
