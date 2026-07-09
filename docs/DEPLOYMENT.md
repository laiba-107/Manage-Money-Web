# Deployment Guide

## Prerequisites

- Node.js 20+
- Flutter 3.16+
- PostgreSQL 15+
- Docker & Docker Compose (optional)
- Google Cloud Console project

---

## 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API** and **Google Sign-In API**
4. Go to **Credentials → Create OAuth 2.0 Client IDs**
5. Configure:
   - **Web client**: for backend callback
   - **Android client**: for mobile app
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/v1/auth/google/callback` (development)
   - `https://api.yourdomain.com/api/v1/auth/google/callback` (production)

---

## 2. Backend Deployment

### Development

```bash
cd backend
cp .env.example .env    # Fill in your values
npm install
npm run start:dev
```

### Docker (Recommended)

```bash
# Copy and configure env
cp backend/.env.example backend/.env
# Edit .env with your values

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api
```

### Production (Railway / Render)

1. Push code to GitHub
2. Create new service pointing to `/backend`
3. Set environment variables from `.env.production`
4. Set build command: `npm run build`
5. Set start command: `node dist/main`

### Production (AWS ECS)

```bash
# Build and push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URL
docker build -t manage-money-api ./backend
docker tag manage-money-api:latest $ECR_URL/manage-money-api:latest
docker push $ECR_URL/manage-money-api:latest
```

---

## 3. Database Setup

### Local PostgreSQL

```bash
# Create database
psql -U postgres -c "CREATE DATABASE manage_money;"

# Run migrations
psql -U postgres -d manage_money -f database/001_initial_schema.sql
psql -U postgres -d manage_money -f database/002_seed_categories.sql
```

### Supabase (Recommended for production)

1. Create project at [supabase.com](https://supabase.com)
2. Get connection string from Settings → Database
3. Run SQL files in Supabase SQL editor
4. Set `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`

### Railway PostgreSQL

```bash
# Provision via Railway CLI
railway add postgresql
railway run psql < database/001_initial_schema.sql
railway run psql < database/002_seed_categories.sql
```

---

## 4. Flutter App Setup

### Prerequisites

```bash
flutter doctor  # Ensure Flutter is correctly installed
```

### Configuration

```bash
cd frontend

# Install dependencies
flutter pub get

# Generate code (freezed, hive adapters)
flutter pub run build_runner build --delete-conflicting-outputs
```

### API URL Configuration

Edit [lib/core/constants/api_constants.dart](../frontend/lib/core/constants/api_constants.dart):

```dart
static const String baseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://api.yourdomain.com/api/v1',
);
```

Or build with:
```bash
flutter build apk --dart-define=API_BASE_URL=https://api.yourdomain.com/api/v1
```

### Android - Google Sign-In Setup

1. Get `SHA-1` fingerprint:
   ```bash
   # Debug
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # Release
   keytool -list -v -keystore your-release-key.jks
   ```

2. Add SHA-1 to Firebase Console → Project Settings → Android App

3. Download `google-services.json` → place at `frontend/android/app/google-services.json`

### Build APK

```bash
# Debug APK
flutter build apk --debug

# Release APK
flutter build apk --release

# App Bundle (for Play Store)
flutter build appbundle --release

# APK location: frontend/build/outputs/apk/release/
```

### Signing Release Build

```bash
# Generate keystore
keytool -genkey -v -keystore manage-money-release.jks \
  -alias manage-money -keyalg RSA -keysize 2048 -validity 10000

# Configure in android/key.properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD  
keyAlias=manage-money
storeFile=../manage-money-release.jks
```

---

## 5. Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` / `production` |
| `PORT` | No | API port (default: 3000) |
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_PORT` | No | PostgreSQL port (default: 5432) |
| `DB_USERNAME` | Yes | Database user |
| `DB_PASSWORD` | Yes | Database password |
| `DB_NAME` | Yes | Database name |
| `DB_SSL` | No | Enable SSL (`true`/`false`) |
| `JWT_SECRET` | Yes | Min 32 chars random string |
| `JWT_EXPIRES_IN` | No | Token expiry (default: 7d) |
| `JWT_REFRESH_SECRET` | Yes | Different from JWT_SECRET |
| `GOOGLE_CLIENT_ID` | Yes | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | Yes | OAuth redirect URL |
| `FRONTEND_URL` | Yes | Your frontend URL |
| `ALLOWED_ORIGINS` | Yes | CORS allowed origins |
| `MOBILE_DEEP_LINK` | No | App deep link scheme |

---

## 6. Health Check

```bash
# API health
curl http://localhost:3000/api/health

# Database connection
curl http://localhost:3000/api/v1/categories
```

---

## 7. Monitoring

- **Logs**: `backend/logs/` (daily rotate, 14d retention)
- **API Docs**: `http://localhost:3000/api/docs` (Swagger UI, dev only)
- **Database**: Use pgAdmin or TablePlus for DB management
