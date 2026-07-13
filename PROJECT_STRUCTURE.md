# Project Structure

```
Manage money Web/
├── backend/                          # NestJS API + Static Frontend Server
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts                   # ← Serves /public as static files
│   │   ├── common/                   # Guards, filters, interceptors
│   │   ├── config/                   # Database config
│   │   ├── modules/                  # API modules (auth, users, transactions, etc)
│   │   └── migrations/               # Database migrations
│   ├── public/                        # ← Static frontend files (served by NestJS)
│   │   ├── index.html                # Main page with dynamic API URL detection
│   │   ├── app.js                    # Frontend logic (handles login, dashboard)
│   │   ├── styles.css                # Styling
│   │   └── auth_callback.html        # OAuth callback page
│   ├── dist/                          # ← Built output (TypeScript → JavaScript)
│   │   ├── main.js                   # Compiled entry point
│   │   ├── public/                   # ← Frontend files copied here for production
│   │   └── ...
│   ├── package.json                  # Backend dependencies
│   ├── vercel.json                   # Vercel deployment config
│   ├── copy-frontend.js              # Build script: copies frontend → public/
│   ├── copy-public-to-dist.js        # Build script: copies public/ → dist/
│   ├── tsconfig.json
│   └── nest-cli.json
│
├── frontend/                         # Source frontend files (not served directly)
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── auth_callback.html
│   └── .env.production
│
├── database/
│   ├── 001_initial_schema.sql       # PostgreSQL schema
│   └── 002_seed_categories.sql      # Initial data
│
├── docs/
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── nginx/
│   └── nginx.conf                    # (Docker-based, not used in Vercel)
│
├── docker-compose.yml                # Local development with Docker
├── .env                              # Local environment variables
├── .env.example                      # Template for environment variables
├── .gitignore
├── README.md
├── VERCEL_DEPLOYMENT.md              # ← START HERE for Vercel setup
└── DEPLOYMENT_READY.md               # ← Quick reference checklist
```

## How It All Works

### Local Development
1. **Recommended:** Run backend only — it serves frontend from `backend/public/` at http://localhost:3000
2. **Optional:** Run frontend separately with `python -m http.server 3001` from `frontend/` folder
3. When on port 3001, frontend auto-detects API at http://localhost:3000

### Vercel Production
1. **Entire backend folder is deployed**
   - NestJS compiles TypeScript to `dist/`
   - Frontend files copied to `dist/public/`
   - NestJS serves static files from `/public` route
   - NestJS API routes at `/api/v1/*`

2. **Single domain serves both**
   - Frontend: `https://your-domain.vercel.app/` (served by NestJS)
   - API: `https://your-domain.vercel.app/api/v1/*` (NestJS handlers)

3. **Frontend auto-detects API URL**
   ```javascript
   // In app.js
   // If on vercel.app domain, API is same origin: https://your-domain.vercel.app
   // If localhost, API is http://localhost:3000
   ```

## Build Process

```
npm run build  →  copy-frontend.js  →  nest build  →  copy-public-to-dist.js
                  (frontend → public/)              (public/ → dist/public/)
```

Result: `dist/` folder is ready for Vercel with everything needed:
- Compiled backend code
- Frontend HTML/CSS/JS
- Package.json with production scripts

## Environment Variables Flow

```
.env (local)
    ↓
package.json (build scripts)
    ↓
    ├─ Frontend (index.html sets window.API_BASE_URL)
    └─ Backend (NestJS uses ALLOWED_ORIGINS, DB_*, JWT_*, GOOGLE_*)
    ↓
VERCEL_DEPLOYMENT.md (copy these to Vercel UI)
    ↓
Vercel Project Settings → Environment Variables
    ↓
Deployed app reads from environment at runtime
```

## Important Notes

- **Never deploy the frontend folder separately** - it's only source
- **Vercel root must be `backend/`** - not the project root
- **Backend serves BOTH frontend AND API** - no CORS issues on same domain
- **Database must be externally accessible** - or use cloud PostgreSQL service
- **Public folder is generated during build** - git can ignore it with .gitignore

---

All deployment instructions are in `VERCEL_DEPLOYMENT.md`
