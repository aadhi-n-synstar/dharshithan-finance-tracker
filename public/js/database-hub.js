/**
 * Dharshithan Waterproofing - Finance Tracker
 * Enterprise Database Hub & Multi-Cloud Migration Manager
 * Supported Free Tier Engines:
 *   1. Supabase (Free Tier PostgreSQL & PostgREST) - 100% Free Forever
 *   2. MongoDB Atlas (Free M0 Sandbox) - 512MB Document Store
 *   3. High-Reliability Local Fallback Store
 */

class DatabaseHub {
  constructor() {
    this.storageKey = 'dharshithan_db_config';
    this.config = this.loadConfig();
    this.status = 'checking';
    this.healthData = null;
  }

  loadConfig() {
    const raw = localStorage.getItem(this.storageKey);
    const defaults = {
      activeProvider: 'supabase',
      supabaseUrl: 'https://xyzcompany.supabase.co',
      supabaseKey: '',
      postgresUri: 'postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres',
      mongoUri: 'mongodb+srv://user:[PASSWORD]@cluster0.mongodb.net/dharshithan_finance?retryWrites=true&w=majority',
      lastVerifiedAt: new Date().toISOString()
    };
    if (!raw) return defaults;
    try {
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed };
    } catch (e) {
      return defaults;
    }
  }

  saveConfig(updates) {
    this.config = { ...this.config, ...updates };
    localStorage.setItem(this.storageKey, JSON.stringify(this.config));
  }

  getActiveProvider() {
    return this.config.activeProvider || 'supabase';
  }

  setProvider(provider) {
    this.saveConfig({ activeProvider: provider });
  }

  async checkHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        this.healthData = await res.json();
        this.status = this.healthData.status || 'healthy';
        return this.healthData;
      }
    } catch (e) {
      this.status = 'offline';
    }
    return { status: this.status, activeProvider: this.getActiveProvider() };
  }

  /**
   * One-Click Automated Data Transfer between Clouds
   */
  async triggerCloudTransfer(targetProvider = 'supabase') {
    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetProvider })
      });
      const data = await res.json();
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Generates Supabase-compatible SQL script
   */
  generateSupabaseSQL(transactions) {
    if (!transactions || !transactions.length) return '-- No transactions to export.';

    const lines = [
      '-- ==========================================================',
      '-- Dharshithan Waterproofing - Data Export for Supabase (Free Tier)',
      `-- Exported on: ${new Date().toISOString()}`,
      `-- Total Records: ${transactions.length}`,
      '-- ==========================================================',
      '',
      'INSERT INTO public.transactions (sl_no, date, type, party_name, description, amount, mode, ref_number, quarter, financial_year, profit_value, category)',
      'VALUES'
    ];

    const values = transactions.map((t, idx) => {
      const slNo = t.slNo || (idx + 1);
      const date = t.date || new Date().toISOString().slice(0, 10);
      const type = (t.type || 'Received / Income').replace(/'/g, "''");
      const party = (t.partyName || 'Unknown').replace(/'/g, "''");
      const desc = (typeof t.description === 'object' ? JSON.stringify(t.description) : (t.description || '')).replace(/'/g, "''");
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

  downloadSupabaseMigration(transactions) {
    const sql = this.generateSupabaseSQL(transactions);
    const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dharshithan-supabase-migration-${new Date().toISOString().slice(0,10)}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  downloadMongoJSON(transactions) {
    const payload = {
      database: 'dharshithan_finance',
      collection: 'transactions',
      exportedAt: new Date().toISOString(),
      documents: transactions.map((t, idx) => ({
        slNo: t.slNo || (idx + 1),
        date: t.date,
        type: t.type,
        partyName: t.partyName,
        category: t.category,
        description: t.description,
        amount: Number(t.amount),
        mode: t.mode,
        refNumber: t.refNumber,
        quarter: t.quarter,
        financialYear: t.financialYear,
        profitValue: Number(t.profitValue)
      }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dharshithan-mongodb-atlas-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

window.databaseHub = new DatabaseHub();
