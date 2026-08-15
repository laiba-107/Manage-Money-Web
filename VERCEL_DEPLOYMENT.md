# Vercel Deployment Guide

All deployment files (`vercel.json`, `backend/vercel.json`, `backend/src/main.ts`, static assets sync) have been configured for seamless serverless deployment on Vercel.

---

## Step 1: Deploy on Vercel

### Option A: Using Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New** → **Project**.
3. Import your **Manage Money** GitHub repository.
4. Set **Root Directory** to `backend` (or leave default root directory as `vercel.json` will automatically route the build).
5. Click **Deploy**.

### Option B: Using Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy directly from repository root
vercel
```

---

## Step 2: Set Environment Variables in Vercel

Go to your Vercel Project → **Settings** → **Environment Variables** and add:

```env
NODE_ENV=production
PORT=3000

# Database Credentials
DB_HOST=your_postgresql_host
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgresql_password
DB_NAME=manage_money
DB_SSL=true

# Authentication Secrets (min 32 chars)
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_min_32_chars
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-vercel-domain.vercel.app/api/v1/auth/google/callback

# Allowed Origins & Domain
FRONTEND_URL=https://your-vercel-domain.vercel.app
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
```

> **Note:** Replace `your-vercel-domain.vercel.app` with your actual assigned Vercel URL.

---

## Step 3: Google OAuth Setup (If enabled)
1. Open [Google Cloud Console](https://console.cloud.google.com).
2. Go to **APIs & Services** → **Credentials**.
3. Edit your OAuth 2.0 Client ID and add to **Authorized Redirect URIs**:
   `https://your-vercel-domain.vercel.app/api/v1/auth/google/callback`

---

## Technical Files Configured:
1. **`backend/src/main.ts`**: Configured to serve static frontend assets from `public/` / `dist/public/` with SPA wildcard fallback and CORS wildcard handling for `.vercel.app` domains.
2. **`backend/vercel.json`**: Configured for `@vercel/node` serverless functions.
3. **`vercel.json`**: Root configuration for monorepo deployments.
4. **`copy-frontend.js` & `copy-public-to-dist.js`**: Automatically syncs frontend files into serverless distribution directories during build.
