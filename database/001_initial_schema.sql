-- ============================================================
-- Manage Money - PostgreSQL Database Schema
-- Production-grade personal finance management schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password        VARCHAR(255),
    display_name    VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    photo_url       TEXT,
    google_id       VARCHAR(255) UNIQUE,
    refresh_token   TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at   TIMESTAMPTZ,
    timezone        VARCHAR(100),
    currency        VARCHAR(10) NOT NULL DEFAULT 'USD',
    theme           VARCHAR(20) NOT NULL DEFAULT 'light',
    biometric_enabled BOOLEAN,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(100) NOT NULL,
    color       VARCHAR(20) NOT NULL,
    type        VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'both')),
    is_default  BOOLEAN NOT NULL DEFAULT TRUE,
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_is_default ON categories(is_default);

-- ============================================================
-- TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount                  DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    type                    VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    title                   VARCHAR(100) NOT NULL,
    notes                   TEXT,
    date                    DATE NOT NULL,
    payment_method          VARCHAR(30) CHECK (payment_method IN (
                                'cash', 'credit_card', 'debit_card',
                                'bank_transfer', 'mobile_payment', 'other'
                            )),
    receipt_url             TEXT,
    is_recurring            BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_interval     VARCHAR(20) CHECK (recurrence_interval IN (
                                'daily', 'weekly', 'biweekly',
                                'monthly', 'quarterly', 'yearly'
                            )),
    recurrence_end_date     DATE,
    recurrence_parent_id    UUID REFERENCES transactions(id) ON DELETE SET NULL,
    currency                VARCHAR(10) NOT NULL DEFAULT 'USD',
    exchange_rate           DECIMAL(10,4) NOT NULL DEFAULT 1,
    tags                    TEXT[],
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id             UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_title_search ON transactions USING gin(title gin_trgm_ops);

-- ============================================================
-- BUDGETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    amount          DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    period          VARCHAR(20) NOT NULL CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
    month           SMALLINT CHECK (month BETWEEN 1 AND 12),
    year            SMALLINT,
    start_date      DATE,
    end_date        DATE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    alert_threshold SMALLINT NOT NULL DEFAULT 80 CHECK (alert_threshold BETWEEN 1 AND 100),
    alert_sent      BOOLEAN NOT NULL DEFAULT FALSE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_user_period ON budgets(user_id, month, year);
CREATE INDEX idx_budgets_category ON budgets(category_id);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    body        TEXT NOT NULL,
    type        VARCHAR(50) NOT NULL CHECK (type IN (
                    'budget_alert', 'bill_reminder',
                    'recurring_transaction', 'weekly_summary', 'system'
                )),
    data        JSONB,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key         VARCHAR(100) NOT NULL,
    value       JSONB NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, key)
);

CREATE INDEX idx_settings_user_id ON settings(user_id);

-- ============================================================
-- AUDIT LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    entity      VARCHAR(100),
    entity_id   UUID,
    ip_address  INET,
    user_agent  TEXT,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['users', 'categories', 'transactions', 'budgets', 'settings']
    LOOP
        EXECUTE format(
            'CREATE TRIGGER update_%s_updated_at
             BEFORE UPDATE ON %s
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
            t, t
        );
    END LOOP;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Enable RLS on all user-owned tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create app user role for RLS
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user;
    END IF;
END
$$;

-- RLS Policies: users can only access their own data
CREATE POLICY transactions_user_isolation ON transactions
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY budgets_user_isolation ON budgets
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY notifications_user_isolation ON notifications
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY settings_user_isolation ON settings
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- ============================================================
-- USEFUL VIEWS
-- ============================================================
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
    t.user_id,
    DATE_TRUNC('month', t.date) AS month,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) AS net_savings,
    COUNT(*) AS transaction_count
FROM transactions t
GROUP BY t.user_id, DATE_TRUNC('month', t.date);

CREATE OR REPLACE VIEW category_monthly_spending AS
SELECT
    t.user_id,
    t.category_id,
    c.name AS category_name,
    c.icon,
    c.color,
    DATE_TRUNC('month', t.date) AS month,
    SUM(t.amount) AS total,
    COUNT(*) AS transaction_count
FROM transactions t
LEFT JOIN categories c ON c.id = t.category_id
WHERE t.type = 'expense'
GROUP BY t.user_id, t.category_id, c.name, c.icon, c.color, DATE_TRUNC('month', t.date);

COMMENT ON TABLE users IS 'Core user accounts with Google OAuth';
COMMENT ON TABLE transactions IS 'All financial transactions (income + expenses)';
COMMENT ON TABLE budgets IS 'Monthly/periodic spending budgets per category';
COMMENT ON TABLE categories IS 'Transaction categories (default + user-custom)';
COMMENT ON TABLE notifications IS 'In-app notifications and alerts';
COMMENT ON TABLE settings IS 'User preferences and app settings (key-value jsonb)';
COMMENT ON TABLE audit_logs IS 'Security audit trail for sensitive actions';
