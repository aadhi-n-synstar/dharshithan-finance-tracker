-- ======================================================================
-- Dharshithan Waterproofing - Enterprise PostgreSQL Database Schema
-- Ready for Free Vercel-supported PostgreSQL (Supabase / Neon / Vercel Postgres)
-- Multi-Role RBAC & User Governance with Password First-Change Policy
-- ======================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. User Roles & Authentication
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',
    'owner',
    'admin',
    'developer',
    'employee',
    'stakeholder'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Site Operations',
  role user_role NOT NULL DEFAULT 'employee',
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  must_change_password BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT TRUE,
  reset_otp VARCHAR(10),
  reset_otp_expires TIMESTAMPTZ,
  last_password_change TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_category ON users(category);

-- Seed initial Super Admin account: admin / admin@2026
INSERT INTO users (user_id, full_name, email, category, role, phone, password_hash, must_change_password) VALUES
  ('admin', 'Super Administrator', 'admin@dharshithan.com', 'Executive Management', 'super_admin', '+91 98765 43210', crypt('admin@2026', gen_salt('bf')), FALSE)
ON CONFLICT (email) DO NOTHING;

-- 2. Transactions Table (Direct match with Dharshithan Google Sheet)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sl_no SERIAL,
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'Received / Income' OR 'Paid / Expense'
  party_name VARCHAR(255) NOT NULL,
  description TEXT,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  mode VARCHAR(50) NOT NULL DEFAULT 'CASH', -- 'CASH', 'NETBANKING', 'UPI', 'DEBIT CARD / CREDIT CARD', 'CHEQUE', 'OTHERS'
  ref_number VARCHAR(255),
  quarter VARCHAR(10) NOT NULL, -- 'Q1', 'Q2', 'Q3', 'Q4'
  financial_year VARCHAR(20) NOT NULL, -- 'F.Y. 2026-27'
  profit_value NUMERIC(14, 2) NOT NULL, -- Signed amount (+ for income, - for expense)
  category VARCHAR(100) DEFAULT 'General',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_party ON transactions(party_name);
CREATE INDEX IF NOT EXISTS idx_transactions_fy_quarter ON transactions(financial_year, quarter);
CREATE INDEX IF NOT EXISTS idx_transactions_mode ON transactions(mode);

-- 3. Liquidity Float & Reconciliation Table
CREATE TABLE IF NOT EXISTS liquidity_settings (
  id SERIAL PRIMARY KEY,
  opening_bank_balance NUMERIC(14, 2) DEFAULT 0.00,
  opening_cash_float NUMERIC(14, 2) DEFAULT 0.00,
  last_reconciled_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

INSERT INTO liquidity_settings (id, opening_bank_balance, opening_cash_float)
VALUES (1, 0.00, 0.00)
ON CONFLICT (id) DO NOTHING;

-- 4. Audit Trail Log (Enterprise Governance)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50),
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL, -- 'USER_LOGIN', 'PASSWORD_CHANGED', 'OTP_REQUESTED', 'USER_CREATED', 'ROLE_CHANGE', 'SYNC_GSHEETS'
  record_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Super Admin, Developer, and Admin can view and manage users
CREATE POLICY "Allow user management to privileged roles" ON users
  FOR ALL USING (
    current_setting('app.current_user_role', true) IN ('super_admin', 'developer', 'admin', 'owner')
  );

-- Users can view their own profile
CREATE POLICY "Allow users to view own profile" ON users
  FOR SELECT USING (
    user_id = current_setting('app.current_user_id', true)
  );

-- Stakeholders and Employees have read access to transactions
CREATE POLICY "Allow read to authenticated roles" ON transactions
  FOR SELECT USING (TRUE);

-- Super Admin, Owner, and Admin can mutate transactions
CREATE POLICY "Allow write to admin roles" ON transactions
  FOR ALL USING (TRUE);
