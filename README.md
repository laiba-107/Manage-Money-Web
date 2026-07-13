# Manage Money — Personal Finance Web App

A production-grade personal finance management app built with a static web frontend + NestJS API + PostgreSQL. Features Google OAuth, cloud sync, budgets, and analytics.

---

## Features

### Core Finance
- **Dashboard** — Total balance, monthly income/expenses, savings, spending charts
- **Income Tracking** — Multi-source income with recurring support
- **Expense Tracking** — Categorized expenses with receipt images
- **Budget Management** — Category budgets with visual progress
- **Analytics** — Charts and transaction summaries

### Technical
- **Google OAuth** — Passwordless Gmail sign-in
- **JWT Authentication** — Secure access + refresh token rotation
- **Cloud Sync** — PostgreSQL backend with REST API
- **Single deployment option** — NestJS serves both API and static frontend

---

## Architecture

```
manage-money/
├── backend/                   # NestJS REST API + static file server
│   ├── src/                   # API modules (auth, transactions, budgets, etc.)
│   ├── public/                # Built frontend (generated from frontend/)
│   └── package.json
│
├── frontend/                  # Web frontend source (HTML/CSS/JS)
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── auth_callback.html
│
├── database/
│   ├── 001_initial_schema.sql
│   └── 002_seed_categories.sql
│
├── docs/
│   ├── API.md
│   └── DEPLOYMENT.md
│
└── docker-compose.yml
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript (Chart.js) |
| Backend API | NestJS (Node.js) |
| Database | PostgreSQL 15+ |
| Authentication | Google OAuth 2.0 + JWT |
| Containerization | Docker + Docker Compose |

---

## Quick Start

### 1. Clone and configure

```bash
git clone <your-repo-url>
cd manage-money

cp backend/.env.example backend/.env
# Edit backend/.env with your DB and Google OAuth credentials
```

### 2. Start the database

```bash
docker-compose up -d postgres
```

Apply schema manually if needed:

```bash
psql -h localhost -U postgres -d manage_money -f database/001_initial_schema.sql
psql -h localhost -U postgres -d manage_money -f database/002_seed_categories.sql
```

### 3. Run the backend (serves API + frontend)

```bash
cd backend
npm install
npm run copy:frontend
npm run start:dev
```

Open the app at:
- **App:** http://localhost:3000
- **API:** http://localhost:3000/api/v1
- **Swagger:** http://localhost:3000/api/docs

### 4. Optional: run frontend separately for development

```bash
cd frontend
python -m http.server 3001
```

When using port 3001, the frontend automatically calls the API at http://localhost:3000.

---

## Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth 2.0 Web credentials
3. Add redirect URI: `http://localhost:3000/api/v1/auth/google/callback`
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`
5. Set `FRONTEND_URL=http://localhost:3000` (or `http://localhost:3001` if using a separate dev server)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete setup.

---

## Build

```bash
cd backend
npm run build
```

This copies `frontend/` → `backend/public/` → `backend/dist/public/` for production.

---

## API Documentation

Full REST API documentation: **[docs/API.md](docs/API.md)**

Interactive Swagger UI (development): `http://localhost:3000/api/docs`

---

## License

MIT © Manage Money Team
