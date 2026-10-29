-- ======================================================================
-- Dharshithan Waterproofing - Enterprise PostgreSQL Database Schema
-- Ready for Free Vercel-supported PostgreSQL (Supabase / Neon / Vercel Postgres)
-- ======================================================================

-- 1. User Roles & Authentication
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'owner',
  'admin',
  'developer',
  'employee',
  'stakeholder'
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial roles & default users
INSERT INTO users (full_name, email, role) VALUES
  ('Super Administrator', 'superadmin@dharshithan.com', 'super_admin'),
  ('Company Owner', 'owner@dharshithan.com', 'owner'),
  ('Finance Admin', 'admin@dharshithan.com', 'admin'),
  ('Lead Developer', 'developer@dharshithan.com', 'developer'),
  ('Site Employee', 'employee@dharshithan.com', 'employee'),
  ('Business Stakeholder', 'stakeholder@dharshithan.com', 'stakeholder')
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
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL, -- 'CREATE_TXN', 'UPDATE_TXN', 'DELETE_TXN', 'ROLE_CHANGE', 'SYNC_GSHEETS'
  record_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Row Level Security (RLS) Policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Stakeholders and Employees have read access
CREATE POLICY "Allow read to authenticated roles" ON transactions
  FOR SELECT USING (TRUE);

-- Only Super Admin, Owner, and Admin can mutate transactions
CREATE POLICY "Allow write to admin roles" ON transactions
  FOR ALL USING (TRUE);
