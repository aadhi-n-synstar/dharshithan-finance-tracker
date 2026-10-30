-- ======================================================================
-- Dharshithan Waterproofing - Supabase PostgreSQL Schema (Free Tier)
-- 100% Free PostgreSQL Database with Row Level Security (RLS) & Performance Indexes
-- ======================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. User Roles ENUM
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

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
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

CREATE INDEX IF NOT EXISTS idx_supabase_users_uid ON public.users(user_id);
CREATE INDEX IF NOT EXISTS idx_supabase_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_supabase_users_role ON public.users(role);

-- Seed initial Super Admin
INSERT INTO public.users (user_id, full_name, email, category, role, phone, password_hash, must_change_password) VALUES
  ('admin', 'Super Administrator', 'admin@dharshithan.com', 'Executive Management', 'super_admin', '+91 98765 43210', crypt('admin@2026', gen_salt('bf')), FALSE),
  ('test', 'Aadhi N', 'aadhi.n@synstarstaffing.com', 'Management', 'admin', '+91 94432 10987', crypt('admin@2026', gen_salt('bf')), FALSE)
ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sl_no SERIAL,
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'Received / Income' OR 'Paid / Expense'
  party_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  description TEXT,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  mode VARCHAR(50) NOT NULL DEFAULT 'CASH', -- 'CASH', 'NETBANKING', 'UPI', 'DEBIT CARD / CREDIT CARD', 'CHEQUE', 'OTHERS'
  ref_number VARCHAR(255),
  quarter VARCHAR(10) NOT NULL, -- 'Q1', 'Q2', 'Q3', 'Q4'
  financial_year VARCHAR(20) NOT NULL, -- 'F.Y. 2026-27'
  profit_value NUMERIC(14, 2) NOT NULL, -- Signed amount (+ for income, - for expense)
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supabase_tx_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_supabase_tx_party ON public.transactions(party_name);
CREATE INDEX IF NOT EXISTS idx_supabase_tx_fy_qtr ON public.transactions(financial_year, quarter);

-- 4. Liquidity Float & Reconciliation Table
CREATE TABLE IF NOT EXISTS public.liquidity_settings (
  id SERIAL PRIMARY KEY,
  opening_bank_balance NUMERIC(14, 2) DEFAULT 0.00,
  opening_cash_float NUMERIC(14, 2) DEFAULT 0.00,
  last_reconciled_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

INSERT INTO public.liquidity_settings (id, opening_bank_balance, opening_cash_float)
VALUES (1, 150000.00, 25000.00)
ON CONFLICT (id) DO UPDATE SET 
  opening_bank_balance = EXCLUDED.opening_bank_balance,
  opening_cash_float = EXCLUDED.opening_cash_float;

-- 5. Audit Trail Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50),
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  record_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for Supabase Best Practices
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidity_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public service / anon access via policies
DO $$ BEGIN
  CREATE POLICY "Allow read transactions" ON public.transactions FOR SELECT USING (true);
  CREATE POLICY "Allow insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);
  CREATE POLICY "Allow update transactions" ON public.transactions FOR UPDATE USING (true);
  CREATE POLICY "Allow delete transactions" ON public.transactions FOR DELETE USING (true);

  CREATE POLICY "Allow read users" ON public.users FOR SELECT USING (true);
  CREATE POLICY "Allow write users" ON public.users FOR ALL USING (true);

  CREATE POLICY "Allow read liquidity" ON public.liquidity_settings FOR SELECT USING (true);
  CREATE POLICY "Allow write liquidity" ON public.liquidity_settings FOR ALL USING (true);

  CREATE POLICY "Allow audit logs" ON public.audit_logs FOR ALL USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
