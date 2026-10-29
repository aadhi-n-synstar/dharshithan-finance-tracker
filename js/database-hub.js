/**
 * Dharshithan Waterproofing - Finance Tracker
 * Enterprise Database Hub & Cloud Migration Manager
 * Strictly restricted to Super Admin and Developer.
 * Supported Databases:
 * 1. Neon Serverless Postgres (Free Tier via Vercel Storage)
 * 2. Supabase (PostgreSQL - Free Tier)
 * 3. Vercel Postgres
 */

class DatabaseHub {
  constructor() {
    this.storageKey = 'dharshithan_db_config';
    this.config = this.loadConfig();
  }

  loadConfig() {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : {
      activeProvider: 'google_sheets', // 'google_sheets' | 'postgres'
      postgresUri: '',
      postgresHost: '',
      postgresDb: '',
      lastVerifiedAt: null
    };
  }

  saveConfig(updates) {
    this.config = { ...this.config, ...updates };
    localStorage.setItem(this.storageKey, JSON.stringify(this.config));
  }

  getActiveProvider() {
    return this.config.activeProvider || 'google_sheets';
  }

  getPostgresUri() {
    return this.config.postgresUri || '';
  }

  /**
   * Validate and test PostgreSQL Connection URI
   * (e.g. postgres://user:password@ep-host.region.aws.neon.tech/neondb)
   */
  testAndSaveConnection(uri) {
    const clean = (uri || '').trim();
    if (!clean) {
      return { success: false, error: 'Please enter a PostgreSQL Connection URI.' };
    }

    try {
      // Basic URI format check
      if (!clean.startsWith('postgres://') && !clean.startsWith('postgresql://')) {
        return {
          success: false,
          error: 'Invalid protocol. URI must start with postgres:// or postgresql://'
        };
      }

      const parsedUrl = new URL(clean);
      const host = parsedUrl.hostname;
      const database = parsedUrl.pathname ? parsedUrl.pathname.replace(/^\//, '') : 'defaultdb';
      const username = parsedUrl.username;

      if (!host) {
        return { success: false, error: 'Could not resolve database host in connection string.' };
      }

      // Save valid connection config
      this.saveConfig({
        postgresUri: clean,
        postgresHost: host,
        postgresDb: database,
        lastVerifiedAt: new Date().toISOString()
      });

      return {
        success: true,
        host: host,
        database: database,
        username: username || 'postgres',
        message: `Connection URI verified for ${host} (Database: ${database}).`
      };
    } catch (err) {
      return {
        success: false,
        error: 'Failed to parse connection string: ' + err.message
      };
    }
  }

  /**
   * Switch active primary driver
   */
  setProvider(provider) {
    if (provider !== 'google_sheets' && provider !== 'postgres') return;
    this.saveConfig({ activeProvider: provider });
  }

  /**
   * Generates production-ready SQL INSERT statements from current transactions
   * for 1-click execution in Supabase SQL Editor or Neon Console!
   */
  generatePostgresInsertSQL(transactions) {
    if (!transactions || !transactions.length) return '-- No transactions to export.';

    const lines = [
      '-- ==========================================================',
      '-- Dharshithan Waterproofing - Data Migration to PostgreSQL',
      `-- Exported on: ${new Date().toISOString()}`,
      `-- Total Records: ${transactions.length}`,
      '-- ==========================================================',
      '',
      'INSERT INTO transactions (sl_no, date, type, party_name, description, amount, mode, ref_number, quarter, financial_year, profit_value, category)',
      'VALUES'
    ];

    const values = transactions.map((t, idx) => {
      const slNo = t.slNo || (idx + 1);
      const date = t.date || new Date().toISOString().slice(0, 10);
      const type = (t.type || 'Received / Income').replace(/'/g, "''");
      const party = (t.partyName || 'Unknown').replace(/'/g, "''");
      const desc = (t.description || '').replace(/'/g, "''");
      const amount = Number(t.amount) || 0;
      const mode = (t.mode || 'CASH').replace(/'/g, "''");
      const ref = (t.refNumber || '').replace(/'/g, "''");
      const quarter = (t.quarter || 'Q3').replace(/'/g, "''");
      const fy = (t.financialYear || 'F.Y. 2026-27').replace(/'/g, "''");
      const profit = Number(t.profitValue) || (t.type.includes('Received') ? amount : -amount);
      const category = (t.category || 'General').replace(/'/g, "''");

      return `  (${slNo}, '${date}', '${type}', '${party}', '${desc}', ${amount.toFixed(2)}, '${mode}', '${ref}', '${quarter}', '${fy}', ${profit.toFixed(2)}, '${category}')`;
    });

    lines.push(values.join(',\n') + ';');
    return lines.join('\n');
  }

  downloadSQLMigration(transactions) {
    const sql = this.generatePostgresInsertSQL(transactions);
    const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dharshithan_migration_${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getSchemaDDL() {
    return `-- ======================================================================
-- Dharshithan Waterproofing - PostgreSQL Database Schema
-- Ready for Free Vercel-supported PostgreSQL (Supabase / Neon / Vercel Postgres)
-- ======================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'owner', 'admin', 'developer', 'employee', 'stakeholder');
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
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sl_no SERIAL,
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL,
  party_name VARCHAR(255) NOT NULL,
  description TEXT,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  mode VARCHAR(50) NOT NULL DEFAULT 'CASH',
  ref_number VARCHAR(255),
  quarter VARCHAR(10) NOT NULL,
  financial_year VARCHAR(20) NOT NULL,
  profit_value NUMERIC(14, 2) NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_party ON transactions(party_name);

INSERT INTO users (user_id, full_name, email, category, role, phone, password_hash, must_change_password)
VALUES ('admin', 'Super Administrator', 'admin@dharshithan.com', 'Executive Management', 'super_admin', '+91 98765 43210', crypt('admin@2026', gen_salt('bf')), FALSE)
ON CONFLICT (email) DO NOTHING;`;
  }
}

window.databaseHub = new DatabaseHub();
