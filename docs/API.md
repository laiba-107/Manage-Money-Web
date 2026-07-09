# Manage Money - REST API Documentation

**Base URL:** `https://api.yourdomain.com/api/v1`  
**Auth:** Bearer JWT token in `Authorization` header  
**Content-Type:** `application/json`

---

## Authentication

### Google OAuth Flow
```
GET  /auth/google          → Redirect to Google login
GET  /auth/google/callback → OAuth callback (redirects with tokens)
GET  /auth/google/mobile   → Mobile: returns tokens as JSON
POST /auth/refresh         → Refresh access token
POST /auth/logout          → Logout (invalidate refresh token)
GET  /auth/me              → Get current user profile
```

**Refresh Token Request:**
```json
POST /auth/refresh
{ "refreshToken": "eyJ..." }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 604800,
    "user": { "id": "uuid", "email": "user@gmail.com", ... }
  }
}
```

---

## Users

```
GET   /users/profile    → Get user profile
PATCH /users/profile    → Update profile
DELETE /users/account   → Delete account (all data)
```

---

## Transactions

```
GET    /transactions          → List transactions (paginated)
POST   /transactions          → Create transaction
GET    /transactions/summary  → Income/expense summary
GET    /transactions/:id      → Get single transaction
PUT    /transactions/:id      → Update transaction
DELETE /transactions/:id      → Delete transaction
```

**Query Parameters (GET /transactions):**
| Param      | Type   | Description                    |
|-----------|--------|-------------------------------|
| type      | string | `income` or `expense`          |
| categoryId| uuid   | Filter by category             |
| startDate | date   | Start of date range            |
| endDate   | date   | End of date range              |
| search    | string | Full-text search               |
| page      | int    | Page number (default: 1)       |
| limit     | int    | Items per page (default: 20)   |
| sortBy    | string | Field to sort (default: date)  |
| sortOrder | string | `ASC` or `DESC`                |

**Create Transaction Body:**
```json
{
  "amount": 1500.00,
  "type": "income",
  "title": "Monthly Salary",
  "date": "2024-01-15",
  "categoryId": "uuid",
  "paymentMethod": "bank_transfer",
  "notes": "January salary",
  "isRecurring": true,
  "recurrenceInterval": "monthly",
  "tags": ["salary", "work"]
}
```

---

## Budgets

```
GET    /budgets                → List all budgets with usage
POST   /budgets                → Create budget
GET    /budgets/monthly-status → Monthly budget status
GET    /budgets/:id            → Get single budget
PUT    /budgets/:id            → Update budget
DELETE /budgets/:id            → Delete budget
```

**Create Budget Body:**
```json
{
  "name": "Food Budget",
  "amount": 500.00,
  "period": "monthly",
  "month": 1,
  "year": 2024,
  "categoryId": "uuid",
  "alertThreshold": 80
}
```

---

## Analytics

```
GET /analytics/dashboard  → Full dashboard data
GET /analytics/report     → Financial report by period
GET /analytics/trends     → Multi-month spending trends
GET /analytics/insights   → AI-powered insights
```

**Query Parameters:**
- `GET /analytics/report?period=monthly&date=2024-01-01`
- `GET /analytics/trends?months=6`

---

## Categories

```
GET /categories           → All categories
GET /categories/by-type   → Filter by type (?type=income|expense)
```

---

## Settings

```
GET   /settings   → Get all settings
PATCH /settings   → Update settings
```

**Update Settings Body:**
```json
{
  "currency": "USD",
  "theme": "dark",
  "notifications": {
    "budgetAlerts": true,
    "weeklyReport": false
  }
}
```

---

## Notifications

```
GET    /notifications          → Get notifications (?unreadOnly=true)
PATCH  /notifications/read-all → Mark all as read
PATCH  /notifications/:id/read → Mark one as read
DELETE /notifications/:id      → Delete notification
```

---

## Response Format

All responses follow this structure:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Error response:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["amount must be a positive number"],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Rate Limiting

- **Default:** 100 requests per 60 seconds per IP
- **Auth endpoints:** 10 requests per 60 seconds
- Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

---

## HTTP Status Codes

| Code | Meaning                  |
|------|--------------------------|
| 200  | Success                  |
| 201  | Created                  |
| 204  | No Content (deleted)     |
| 400  | Bad Request / Validation |
| 401  | Unauthorized             |
| 403  | Forbidden                |
| 404  | Not Found                |
| 429  | Too Many Requests        |
| 500  | Internal Server Error    |
