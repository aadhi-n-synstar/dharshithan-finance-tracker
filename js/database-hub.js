/**
 * Dharshithan Waterproofing - Finance Tracker
 * Enterprise Database Hub & Cloud Migration Manager
 * Pre-configured for Free Vercel-supported Databases:
 * 1. Supabase (PostgreSQL - Free Tier)
 * 2. Neon Serverless Postgres (Free Tier)
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
      activeProvider: 'google_sheets', // 'google_sheets' | 'supabase' | 'neon'
      supabaseUrl: '',
      supabaseKey: '',
      neonConnectionString: '',
      lastMigrationDate: null
    };
  }

  saveConfig(updates) {
    this.config = { ...this.config, ...updates };
    localStorage.setItem(this.storageKey, JSON.stringify(this.config));
  }

  getActiveProvider() {
    return this.config.activeProvider || 'google_sheets';
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
}

window.databaseHub = new DatabaseHub();
