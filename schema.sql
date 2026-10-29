-- ==============================================================================
-- DHARSHITHAN WATERPROOFING AND CONCRETE SOLUTIONS
-- Enterprise Financial, Billing, Voucher & Salary Disbursement Ledger Engine
-- Native Neon PostgreSQL DDL Schema
-- ==============================================================================

-- 1. Authentication & RBAC
DO $$ BEGIN
    CREATE TYPE finance_role AS ENUM ('SUPER_ADMIN', 'OWNER', 'FINANCE', 'AUDITOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS finance_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role finance_role NOT NULL DEFAULT 'FINANCE',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tax Invoices & Receipts Engine
CREATE TABLE IF NOT EXISTS invoices_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_no VARCHAR(50) UNIQUE NOT NULL, -- e.g., DWCS/REC/2026/001
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    client_name VARCHAR(200) NOT NULL,
    client_address TEXT,
    client_gstin VARCHAR(20),
    site_location VARCHAR(255),
    work_description TEXT,
    sub_total DECIMAL(12,2) NOT NULL,
    is_interstate BOOLEAN DEFAULT FALSE, -- FALSE = Intra (CGST+SGST), TRUE = Inter (IGST)
    cgst_rate DECIMAL(5,2) DEFAULT 9.00,
    cgst_amount DECIMAL(12,2) DEFAULT 0.00,
    sgst_rate DECIMAL(5,2) DEFAULT 9.00,
    sgst_amount DECIMAL(12,2) DEFAULT 0.00,
    igst_rate DECIMAL(5,2) DEFAULT 0.00,
    igst_amount DECIMAL(12,2) DEFAULT 0.00,
    grand_total DECIMAL(12,2) NOT NULL,
    grand_total_words TEXT NOT NULL,
    payment_mode VARCHAR(50) NOT NULL, -- Bank Transfer, NEFT, RTGS, UPI, Cheque, Cash
    transaction_ref VARCHAR(100),
    signing_authority VARCHAR(100) DEFAULT 'Authorized Signatory',
    status VARCHAR(50) DEFAULT 'PAID', -- DRAFT, PAID, CANCELLED
    created_by UUID REFERENCES finance_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices_receipts(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    hsn_sac_code VARCHAR(20) DEFAULT '9954', -- Waterproofing & Construction Services
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(30) DEFAULT 'Sq.Ft',
    rate DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL
);

-- 3. Comprehensive Financial Vouchers (Expense, Vendor, Subcontractor, Cash)
CREATE TABLE IF NOT EXISTS financial_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_no VARCHAR(50) UNIQUE NOT NULL, -- e.g., DWCS/VOU/2026/001
    voucher_type VARCHAR(50) NOT NULL, -- 'PAYMENT', 'RECEIPT', 'PETTY_CASH', 'JOURNAL'
    category VARCHAR(100) NOT NULL, -- 'Material Cost', 'Chemical Purchase', 'Subcontractor', 'Equipment', 'Site Overhead', 'Fuel'
    voucher_date DATE NOT NULL DEFAULT CURRENT_DATE,
    paid_to_or_received_from VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    amount_in_words TEXT NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    narration TEXT NOT NULL,
    prepared_by UUID REFERENCES finance_users(id),
    approved_by VARCHAR(100) DEFAULT 'Partner / Managing Director',
    status VARCHAR(50) DEFAULT 'CONFIRMED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Financial Salary Disbursement & Payslip Register (Pure Finance Records)
CREATE TABLE IF NOT EXISTS salary_disbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disbursement_no VARCHAR(50) UNIQUE NOT NULL, -- e.g., DWCS/SAL/2026/001
    disbursement_month VARCHAR(30) NOT NULL, -- e.g., "October 2026"
    disbursement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    employee_name VARCHAR(150) NOT NULL,
    employee_id VARCHAR(50),
    designation VARCHAR(100) NOT NULL,
    bank_account_no VARCHAR(50),
    ifsc_code VARCHAR(30),
    basic_pay DECIMAL(10,2) NOT NULL,
    hra DECIMAL(10,2) DEFAULT 0.00,
    special_allowance DECIMAL(10,2) DEFAULT 0.00,
    total_earnings DECIMAL(10,2) NOT NULL,
    pf_deduction DECIMAL(10,2) DEFAULT 0.00,
    esi_deduction DECIMAL(10,2) DEFAULT 0.00,
    tds_deduction DECIMAL(10,2) DEFAULT 0.00,
    advance_adjustment DECIMAL(10,2) DEFAULT 0.00,
    total_deductions DECIMAL(10,2) NOT NULL,
    net_salary DECIMAL(10,2) NOT NULL,
    net_salary_words TEXT NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Bank Transfer',
    transaction_ref VARCHAR(100),
    linked_voucher_id UUID REFERENCES financial_vouchers(id),
    created_by UUID REFERENCES finance_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Audit Log (Tracks any alter/edit/delete operation)
CREATE TABLE IF NOT EXISTS finance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'VOID'
    performed_by UUID REFERENCES finance_users(id),
    reason TEXT,
    previous_state JSONB,
    new_state JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high performance querying
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices_receipts(date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices_receipts(client_name);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices_receipts(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON financial_vouchers(voucher_date DESC);
CREATE INDEX IF NOT EXISTS idx_vouchers_type ON financial_vouchers(voucher_type);
CREATE INDEX IF NOT EXISTS idx_vouchers_category ON financial_vouchers(category);
CREATE INDEX IF NOT EXISTS idx_salaries_month ON salary_disbursements(disbursement_month);
CREATE INDEX IF NOT EXISTS idx_audit_created ON finance_audit_logs(created_at DESC);
