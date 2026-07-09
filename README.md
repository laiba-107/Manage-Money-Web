# Manage Money — Personal Finance App

A production-grade personal finance management app built with Flutter (Android) + NestJS + PostgreSQL. Features Google OAuth, real-time cloud sync, intelligent analytics, and a premium fintech-style UI.

---

## Features

### Core Finance
- **Dashboard** — Total balance, monthly income/expenses, savings rate, spending charts
- **Income Tracking** — Multi-source income with recurring support
- **Expense Tracking** — Categorized expenses with receipt images
- **Budget Management** — Category budgets with visual progress & alerts
- **Analytics & Reports** — Charts, trends, period comparisons, top categories
- **Smart Insights** — AI-powered spending analysis and financial tips

### Technical
- **Google OAuth** — Passwordless Gmail sign-in, no duplicate accounts
- **JWT Authentication** — Secure access + refresh token rotation
- **Cloud Sync** — Real-time PostgreSQL backend, multi-device access
- **Offline Support** — Local caching with Hive, auto-sync on reconnect
- **Biometric Login** — Fingerprint / Face ID support
- **Data Export** — PDF and CSV export
- **Dark/Light Mode** — Fully themed with system preference support
- **Multi-currency** — Currency picker with exchange rate support

---

## Architecture

```
manage-money/
├── backend/                   # NestJS REST API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # Google OAuth + JWT
│   │   │   ├── users/         # User management
│   │   │   ├── transactions/  # Income & expense CRUD
│   │   │   ├── budgets/       # Budget management
│   │   │   ├── analytics/     # Financial reports
│   │   │   ├── categories/    # Transaction categories
│   │   │   ├── notifications/ # In-app notifications
│   │   │   └── settings/      # User preferences
│   │   ├── common/            # Guards, interceptors, decorators
│   │   └── config/            # Environment configuration
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                  # Flutter Android App
│   ├── lib/
│   │   ├── core/
│   │   │   ├── constants/     # API & app constants
│   │   │   ├── theme/         # Material 3 theme + colors
│   │   │   ├── router/        # go_router navigation
│   │   │   ├── network/       # Dio API client + interceptors
│   │   │   └── storage/       # Secure token storage
│   │   ├── features/
│   │   │   ├── auth/          # Splash + Login screens
│   │   │   ├── dashboard/     # Home screen + widgets
│   │   │   ├── transactions/  # List, add, detail screens
│   │   │   ├── budgets/       # Budget management screens
│   │   │   ├── analytics/     # Charts & reports screen
│   │   │   └── settings/      # Settings & profile screens
│   │   └── shared/            # Reusable widgets
│   └── android/               # Android configuration
│
├── database/
│   ├── 001_initial_schema.sql # Full normalized schema + RLS
│   └── 002_seed_categories.sql
│
├── docs/
│   ├── API.md                 # Full API documentation
│   └── DEPLOYMENT.md          # Setup & deployment guide
│
└── docker-compose.yml         # Full stack deployment
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Frontend | Flutter 3.16 + Riverpod |
| Navigation | go_router |
| Charts | fl_chart |
| HTTP Client | Dio |
| Local Storage | Hive + flutter_secure_storage |
| Backend API | NestJS (Node.js) |
| Database | PostgreSQL 15 |
| Authentication | Google OAuth 2.0 + Passport.js |
| Sessions | JWT (access + refresh tokens) |
| Security | Helmet, rate-limiting, RLS |
| API Docs | Swagger (OpenAPI 3) |
| Containerization | Docker + Docker Compose |

---

## Quick Start

### 1. Clone and configure

```bash
git clone <your-repo-url>
cd manage-money

# Configure backend
cp backend/.env.example backend/.env
# Edit backend/.env with your DB and Google OAuth credentials
```

### 2. Start with Docker

```bash
docker-compose up -d
# API running at: http://localhost:3000/api/v1
# Swagger docs: http://localhost:3000/api/docs
```

### 3. Run Flutter app

```bash
cd frontend
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs

# Ensure Android emulator/device is connected
flutter run
```

---

## Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials (Web + Android)
3. Add redirect URI: `http://localhost:3000/api/v1/auth/google/callback`
4. Add SHA-1 fingerprint for Android
5. Download `google-services.json` → `frontend/android/app/`
6. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete setup.

---

## API Documentation

Full REST API documentation: **[docs/API.md](docs/API.md)**

Interactive Swagger UI (development): `http://localhost:3000/api/docs`

---

## Security

- HTTPS-only in production
- JWT with short expiry (7d) + refresh rotation (30d)
- Secure token storage (Android EncryptedSharedPreferences)
- Row-Level Security (RLS) at PostgreSQL level
- SQL injection prevention via TypeORM parameterized queries
- Rate limiting: 100 req/min default
- Input validation on all endpoints
- CORS with allowlist
- Helmet security headers
- Audit log for sensitive actions

---

## Database Schema

Core tables: `users`, `transactions`, `budgets`, `categories`, `notifications`, `settings`, `audit_logs`

Full schema with indexes, RLS policies, triggers, and views: [database/001_initial_schema.sql](database/001_initial_schema.sql)

---

## License

MIT © Manage Money Team
