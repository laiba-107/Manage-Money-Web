# 💰 Manage Money — Personal Finance Web App

A production-grade, full-stack personal finance and money management application built with **NestJS**, **Firebase Firestore**, and a responsive **Single-Page Application (SPA)** frontend.

Features multi-currency support for 100+ world currencies, income and single/group expense tracking, smart category budgets, goal planning, financial analytics charts, and seamless one-click cloud deployment.

---

## ✨ Features

### 💵 Core Finance & Expense Tracking
- **📊 Real-time Dashboard** — Live balance overview, monthly cashflow metrics, savings rates, and financial trend charts.
- **📈 Income Tracking** — Track multiple income sources (Salary, Freelance, Business, Investments) with recurring income support.
- **📉 Single & Group Expenses** — Categorize single transactions or create **Expense Groups / Trips** (with custom dates, budget caps, and multi-line item tracking).
- **🎯 Category Budgets** — Set monthly spending caps per category with visual progress bars and real-time threshold warnings.
- **🚀 Financial Plans & Goals** — Create long-term savings plans with target amounts, expected completion dates, and progress tracking.
- **📝 All Transactions Log** — Search, filter by date/type/category, sort, and paginate all financial entries.

### 🌐 Global Multi-Currency Engine
- **100+ World Currencies** — Support for all standard world currencies (USD, EUR, GBP, PKR, INR, AED, SAR, CAD, AUD, JPY, CNY, CHF, KGS, etc.).
- **Live Exchange Rates** — Real-time currency conversions powered by live open exchange rate API sync.
- **Interactive Currency Picker** — Switch your base currency on the fly directly from the navbar with automatic recalculation across all cards and charts.

### 🛡️ Security & Authentication
- **Email & Password Authentication** — Secure account registration and login.
- **JWT Authentication** — Bearer token authentication with secure refresh token rotation and bcrypt password hashing.
- **Firebase Firestore** — Fast, cloud-hosted, schemaless database with automated category seeding on startup.

### 📱 Responsive Design
- **Desktop & Mobile Optimized** — Sleek glassmorphism navigation, animated charts, and touch-friendly mobile drawer menu.
- **Unified Full-Stack Deployment** — The NestJS backend serves both the REST API and the static frontend from a single service.

---

## 🏗️ Architecture & Project Structure

```
Manage-Money-Web/
├── backend/                     # NestJS REST API + Static File Server
│   ├── src/
│   │   ├── firebase/            # Firebase Admin SDK module & Firestore service
│   │   ├── modules/
│   │   │   ├── auth/            # JWT authentication & registration
│   │   │   ├── users/           # User profile management
│   │   │   ├── transactions/    # Income & Expense operations
│   │   │   ├── budgets/         # Budget status & usage calculations
│   │   │   ├── categories/      # Category taxonomy & automatic seeding
│   │   │   ├── analytics/       # Cashflow trends & spending breakdown
│   │   │   ├── notifications/   # System alerts & notifications
│   │   │   └── settings/        # User settings & preferences
│   │   ├── app.module.ts        # Root module with Firebase & Joi validation
│   │   ├── main.ts              # Server bootstrap (Render / Node entrypoint)
│   │   └── serverless.ts        # Vercel serverless entrypoint
│   ├── public/                  # Bundled frontend assets served by NestJS
│   ├── package.json
│   └── .env.example
│
├── frontend/                    # Single Page Application (SPA)
│   ├── index.html               # Main UI structure & view containers
│   ├── app.js                   # Application state, chart engine & API client
│   ├── styles.css               # Modern vanilla CSS design system
│   └── bg.png                   # Background visual asset
│
├── api/                         # Vercel serverless function bridge
│   ├── index.js
│   └── dist/
│
├── render.yaml                  # Render Blueprint configuration
├── vercel.json                  # Vercel deployment configuration
└── package.json                 # Monorepo root scripts & dependencies
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Modern Vanilla CSS, JavaScript (ES6+), Chart.js |
| **Backend API** | NestJS 11, Node.js (v20+), Express |
| **Database** | Google Firebase Cloud Firestore (`firebase-admin`) |
| **Authentication** | JWT (JSON Web Tokens), Passport, bcryptjs |
| **Exchange Rates** | Live Open Exchange Rate API |
| **Hosting / Deployment** | Render (Web Service / Blueprint), Vercel |

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20 or newer)
- A [Firebase Project](https://console.firebase.google.com/) with Cloud Firestore enabled.

### 2. Clone the Repository
```bash
git clone https://github.com/laiba-107/Manage-Money-Web.git
cd Manage-Money-Web
```

### 3. Configure Environment Variables
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

Open `backend/.env` and configure your Firebase credentials and JWT secrets:
```env
PORT=3000
NODE_ENV=development

# Firebase Firestore Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_REFRESH_SECRET=your_refresh_token_secret_minimum_32_characters_long
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost
```

### 4. Install Dependencies & Run
From the root directory:
```bash
npm run build
npm run start
```
Or inside the `backend` directory:
```bash
cd backend
npm install
npm run build
npm run start:dev
```

### 5. Access the Application
- **Web App:** [http://localhost:3000](http://localhost:3000)
- **API Base:** [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **Swagger Docs:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs) *(available in development)*

---

## ☁️ Deployment

### Option A: Deploy to Render (Recommended)

1. Push your code to GitHub.
2. Go to **[Render Dashboard](https://dashboard.render.com)**.
3. Click **New +** → **Blueprint** and select your `Manage-Money-Web` repository (Render will automatically read [`render.yaml`](render.yaml)).
4. Or create a manual **Web Service**:
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm run start:prod`
5. Add the following **Environment Variables** in Render:
   - `NODE_ENV`: `production`
   - `FIREBASE_PROJECT_ID`: `your-firebase-project-id`
   - `FIREBASE_CLIENT_EMAIL`: `your-firebase-client-email`
   - `FIREBASE_PRIVATE_KEY`: `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n`
   - `JWT_SECRET`: `your_jwt_secret_key`
   - `JWT_REFRESH_SECRET`: `your_jwt_refresh_secret_key`
6. Click **Deploy**.

---

### Option B: Deploy to Vercel

1. Import the repository into **Vercel**.
2. Set the Root Directory to `./` or `backend`.
3. Add the same Firebase and JWT environment variables under **Settings → Environment Variables**.
4. Deploy!

---

## 📡 REST API Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/v1/auth/register` | Register a new user account | No |
| `POST` | `/api/v1/auth/login` | Sign in with email and password | No |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | No |
| `POST` | `/api/v1/auth/logout` | Invalidate current session | Yes |
| `GET` | `/api/v1/auth/me` | Get current user profile | Yes |
| `GET` | `/api/v1/transactions` | Query & paginate transactions (income/expense) | Yes |
| `POST` | `/api/v1/transactions` | Create income or expense entry | Yes |
| `PUT` | `/api/v1/transactions/:id` | Update a transaction | Yes |
| `DELETE` | `/api/v1/transactions/:id` | Delete a transaction | Yes |
| `GET` | `/api/v1/budgets` | List budgets with real-time spending status | Yes |
| `POST` | `/api/v1/budgets` | Create category budget | Yes |
| `GET` | `/api/v1/categories` | List available transaction categories | Yes |
| `GET` | `/api/v1/analytics/dashboard` | Get summary KPIs and monthly totals | Yes |
| `GET` | `/api/v1/analytics/trends` | Get multi-month income vs expense trends | Yes |

---

## 📄 License

MIT License © 2026 Manage Money Team
