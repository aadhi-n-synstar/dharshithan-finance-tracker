/**
 * Dharshithan Waterproofing - Unified Database Engine
 * Supports:
 *  1. Supabase (Free Tier PostgreSQL & PostgREST) - Recommended
 *  2. MongoDB Atlas (Free M0 Sandbox)
 *  3. Neon Cloud PostgreSQL (Lakebase)
 *  4. High-Reliability Local/Offline Fallback (zero downtime)
 */

const { Pool } = require('pg');
const { neon } = require('@neondatabase/serverless');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const LOCAL_DB_FILE = path.join(DATA_DIR, 'local-db.json');

// Initial seed data for fresh start
const DEFAULT_SEED = {
  users: [
    {
      id: "563fd33e-d726-45ae-a31d-1ecca9a776e3",
      user_id: "admin",
      full_name: "Super Administrator",
      email: "admin@dharshithan.com",
      category: "Executive Management",
      role: "super_admin",
      phone: "+91 98765 43210",
      password_hash: "$2a$10$wT0l72W2q8oM1K3T6oYmPe3O6G.Pq7WkZ5b9jB8zD0a1c2e3f4g5h", // admin@2026
      must_change_password: false,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: "acce0495-bb42-4252-86de-29c03815c969",
      user_id: "test",
      full_name: "Aadhi N",
      email: "aadhi.n@synstarstaffing.com",
      category: "Management",
      role: "admin",
      phone: "+91 94432 10987",
      password_hash: "$2a$10$wT0l72W2q8oM1K3T6oYmPe3O6G.Pq7WkZ5b9jB8zD0a1c2e3f4g5h",
      must_change_password: false,
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
  transactions: [
    {
      id: "cbf012b8-207d-4c5d-b549-0db3579474f6",
      sl_no: 1,
      date: "2026-10-30",
      type: "Received / Income",
      party_name: "AYYAN HOMES",
      category: "Waterproofing Contract",
      description: JSON.stringify({
        items: [
          { description: "Basement Waterproofing Membrane SAC 9954", hsn: "9954", qty: 1000, unit: "Sq.Ft", rate: 120, amount: 120000 }
        ],
        taxType: "INTRA_18",
        subtotal: 101694.92,
        taxAmount: 18305.08,
        grandTotal: 120000.00,
        remarks: "Ayyan Homes Phase 2 Villa Waterproofing Milestone 1"
      }),
      amount: 120000.00,
      mode: "NETBANKING",
      ref_number: "DWCS/INV/2026/001",
      quarter: "Q3",
      financial_year: "F.Y. 2026-27",
      profit_value: 120000.00,
      created_at: new Date().toISOString()
    },
    {
      id: "7dc512c4-4910-4cc3-a8b4-56f3e68d794c",
      sl_no: 2,
      date: "2026-10-30",
      type: "Paid / Expense",
      party_name: "David",
      category: "Site Labor Wages",
      description: "Weekly site supervision and labor wages payment",
      amount: 3200.00,
      mode: "CASH",
      ref_number: "VOUCH-CASH-002",
      quarter: "Q3",
      financial_year: "F.Y. 2026-27",
      profit_value: -3200.00,
      created_at: new Date().toISOString()
    }
  ],
  liquidity: {
    opening_bank_balance: 150000.00,
    opening_cash_float: 25000.00,
    last_reconciled_at: new Date().toISOString()
  },
  audit_logs: [
    {
      id: "audit-001",
      user_id: "admin",
      user_email: "admin@dharshithan.com",
      action: "SYSTEM_INITIALIZE",
      record_id: "init",
      details: { message: "Dharshithan Finance ERP Initialized on Free Tier Cloud Engine" },
      created_at: new Date().toISOString()
    }
  ]
};

// Check if backup exists to load initial data
function loadInitialStore() {
  const backupFile = path.join(DATA_DIR, 'neon-backup.json');
  if (fs.existsSync(backupFile)) {
    try {
      const b = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      if (b.users && b.users.length) {
        return {
          users: b.users,
          transactions: b.transactions || [],
          liquidity: b.liquidity ? (b.liquidity[0] || b.liquidity) : DEFAULT_SEED.liquidity,
          audit_logs: b.auditLogs || []
        };
      }
    } catch (e) {}
  }

  if (fs.existsSync(LOCAL_DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf8'));
    } catch (e) {}
  }

  return DEFAULT_SEED;
}

let localStore = loadInitialStore();

function saveLocalStore() {
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(localStore, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving local store:', e.message);
  }
}

// -------------------------------------------------------------
// Active Provider Resolver
// -------------------------------------------------------------
function resolveProvider() {
  const p = (process.env.DB_PROVIDER || '').toLowerCase().trim();
  if (p === 'supabase') return 'supabase';
  if (p === 'mongodb' || p === 'mongo') return 'mongodb';
  if (p === 'neon') return 'neon';

  // Auto-detect based on env variables
  if (process.env.SUPABASE_DATABASE_URL || (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)) {
    return 'supabase';
  }
  if (process.env.MONGODB_URI) {
    return 'mongodb';
  }
  if (process.env.DATABASE_URL) {
    return 'neon';
  }
  return 'supabase'; // Default recommendation for free tier
}

// Pool & Client caches
let pgPool = null;
let mongoClient = null;

function getPgPool(connectionString) {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000
    });
  }
  return pgPool;
}

async function getMongoClient(uri) {
  if (!mongoClient) {
    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000
    });
    await mongoClient.connect();
  }
  return mongoClient;
}

// -------------------------------------------------------------
// Database Operations Interface
// -------------------------------------------------------------
class DatabaseAdapter {
  constructor() {
    this.provider = resolveProvider();
  }

  getProvider() {
    return this.provider;
  }

  setProvider(provider) {
    this.provider = provider;
  }

  // 1. TRANSACTIONS
  async getTransactions() {
    const provider = this.getProvider();

    // Supabase / Neon via PostgreSQL
    if (provider === 'supabase' || provider === 'neon') {
      const connStr = provider === 'supabase'
        ? (process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL)
        : process.env.DATABASE_URL;

      if (connStr) {
        try {
          const sql = neon(connStr);
          const rows = await sql`
            SELECT 
              id,
              sl_no as "slNo",
              to_char(date, 'YYYY-MM-DD') as "date",
              type,
              party_name as "partyName",
              category,
              description,
              amount::numeric as amount,
              mode,
              ref_number as "refNumber",
              quarter,
              financial_year as "financialYear",
              profit_value::numeric as "profitValue",
              created_at as "createdAt"
            FROM transactions
            ORDER BY sl_no ASC, date ASC
          `;
          return rows.map(r => ({ ...r, amount: parseFloat(r.amount), profitValue: parseFloat(r.profitValue) }));
        } catch (e) {
          console.warn(`[${provider}] Postgres query failed, falling back to cached store:`, e.message);
        }
      }
    }

    // MongoDB
    if (provider === 'mongodb' && process.env.MONGODB_URI) {
      try {
        const client = await getMongoClient(process.env.MONGODB_URI);
        const db = client.db(process.env.MONGODB_DB_NAME || 'dharshithan_finance');
        const docs = await db.collection('transactions').find({}).sort({ slNo: 1, date: 1 }).toArray();
        return docs.map(d => ({
          id: d._id ? d._id.toString() : d.id,
          slNo: d.slNo || d.sl_no,
          date: d.date,
          type: d.type,
          partyName: d.partyName || d.party_name,
          category: d.category,
          description: d.description,
          amount: parseFloat(d.amount),
          mode: d.mode,
          refNumber: d.refNumber || d.ref_number,
          quarter: d.quarter,
          financialYear: d.financialYear || d.financial_year,
          profitValue: parseFloat(d.profitValue || d.profit_value),
          createdAt: d.createdAt || d.created_at
        }));
      } catch (e) {
        console.warn('[MongoDB] Query failed, falling back to cached store:', e.message);
      }
    }

    // Local / Fallback Store
    return (localStore.transactions || []).map(t => ({
      id: t.id,
      slNo: t.sl_no || t.slNo,
      date: typeof t.date === 'string' ? t.date.slice(0, 10) : t.date,
      type: t.type,
      partyName: t.party_name || t.partyName,
      category: t.category,
      description: t.description,
      amount: parseFloat(t.amount),
      mode: t.mode,
      refNumber: t.ref_number || t.refNumber,
      quarter: t.quarter,
      financialYear: t.financial_year || t.financialYear,
      profitValue: parseFloat(t.profit_value || t.profitValue),
      createdAt: t.created_at || t.createdAt
    }));
  }

  async createTransaction(data) {
    const provider = this.getProvider();
    const numAmount = parseFloat(data.amount);
    const isIncome = (data.type || '').toLowerCase().includes('received') || (data.type || '').toLowerCase().includes('income');
    const calcProfit = data.profitValue !== undefined ? parseFloat(data.profitValue) : (isIncome ? numAmount : -numAmount);

    // Postgres (Supabase / Neon)
    if (provider === 'supabase' || provider === 'neon') {
      const connStr = provider === 'supabase'
        ? (process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL)
        : process.env.DATABASE_URL;

      if (connStr) {
        try {
          const sql = neon(connStr);
          const maxRes = await sql`SELECT COALESCE(MAX(sl_no), 0) + 1 as "nextSl" FROM transactions`;
          const nextSl = maxRes[0].nextSl;

          const rows = await sql`
            INSERT INTO transactions (
              sl_no, date, type, party_name, category, description,
              amount, mode, ref_number, quarter, financial_year, profit_value
            ) VALUES (
              ${nextSl}, ${data.date}, ${data.type}, ${data.partyName}, ${data.category || 'General'}, ${data.description || ''},
              ${numAmount}, ${data.mode || 'CASH'}, ${data.refNumber || ''}, ${data.quarter || 'Q1'}, 
              ${data.financialYear || 'F.Y. 2026-27'}, ${calcProfit}
            )
            RETURNING 
              id,
              sl_no as "slNo",
              to_char(date, 'YYYY-MM-DD') as "date",
              type,
              party_name as "partyName",
              category,
              description,
              amount::numeric as amount,
              mode,
              ref_number as "refNumber",
              quarter,
              financial_year as "financialYear",
              profit_value::numeric as "profitValue"
          `;
          const res = { ...rows[0], amount: parseFloat(rows[0].amount), profitValue: parseFloat(rows[0].profitValue) };
          this._syncLocalTransaction(res);
          return res;
        } catch (e) {
          console.warn(`[${provider}] Insert failed, writing to fallback store:`, e.message);
        }
      }
    }

    // Local / In-Memory Fallback
    const nextSl = (localStore.transactions.reduce((max, t) => Math.max(max, t.sl_no || t.slNo || 0), 0)) + 1;
    const newTx = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      slNo: nextSl,
      sl_no: nextSl,
      date: data.date,
      type: data.type,
      partyName: data.partyName,
      party_name: data.partyName,
      category: data.category || 'General',
      description: data.description || '',
      amount: numAmount,
      mode: data.mode || 'CASH',
      refNumber: data.refNumber || '',
      ref_number: data.refNumber || '',
      quarter: data.quarter || 'Q1',
      financialYear: data.financialYear || 'F.Y. 2026-27',
      financial_year: data.financialYear || 'F.Y. 2026-27',
      profitValue: calcProfit,
      profit_value: calcProfit,
      createdAt: new Date().toISOString()
    };
    localStore.transactions.push(newTx);
    saveLocalStore();
    return newTx;
  }

  async updateTransaction(id, data) {
    const provider = this.getProvider();
    const numAmount = parseFloat(data.amount);
    const isIncome = (data.type || '').toLowerCase().includes('received') || (data.type || '').toLowerCase().includes('income');
    const calcProfit = data.profitValue !== undefined ? parseFloat(data.profitValue) : (isIncome ? numAmount : -numAmount);

    if (provider === 'supabase' || provider === 'neon') {
      const connStr = provider === 'supabase'
        ? (process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL)
        : process.env.DATABASE_URL;

      if (connStr) {
        try {
          const sql = neon(connStr);
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
          let rows;
          if (isUuid) {
            rows = await sql`
              UPDATE transactions SET
                date = ${data.date},
                type = ${data.type},
                party_name = ${data.partyName},
                category = ${data.category},
                description = ${data.description},
                amount = ${numAmount},
                mode = ${data.mode},
                ref_number = ${data.refNumber},
                quarter = ${data.quarter},
                financial_year = ${data.financialYear},
                profit_value = ${calcProfit},
                updated_at = NOW()
              WHERE id = ${id}
              RETURNING id, sl_no as "slNo", to_char(date, 'YYYY-MM-DD') as "date", type, party_name as "partyName", amount::numeric as amount
            `;
          } else {
            rows = await sql`
              UPDATE transactions SET
                date = ${data.date},
                type = ${data.type},
                party_name = ${data.partyName},
                category = ${data.category},
                description = ${data.description},
                amount = ${numAmount},
                mode = ${data.mode},
                ref_number = ${data.refNumber},
                quarter = ${data.quarter},
                financial_year = ${data.financialYear},
                profit_value = ${calcProfit},
                updated_at = NOW()
              WHERE sl_no = ${Number(id)}
              RETURNING id, sl_no as "slNo", to_char(date, 'YYYY-MM-DD') as "date", type, party_name as "partyName", amount::numeric as amount
            `;
          }
          if (rows && rows.length) return rows[0];
        } catch (e) {
          console.warn(`[${provider}] Update failed:`, e.message);
        }
      }
    }

    // Local Store update
    const idx = localStore.transactions.findIndex(t => t.id === id || String(t.sl_no || t.slNo) === String(id));
    if (idx !== -1) {
      localStore.transactions[idx] = {
        ...localStore.transactions[idx],
        ...data,
        amount: numAmount,
        profitValue: calcProfit,
        profit_value: calcProfit
      };
      saveLocalStore();
      return localStore.transactions[idx];
    }
    return null;
  }

  async deleteTransaction(id) {
    const provider = this.getProvider();
    if (provider === 'supabase' || provider === 'neon') {
      const connStr = provider === 'supabase'
        ? (process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL)
        : process.env.DATABASE_URL;

      if (connStr) {
        try {
          const sql = neon(connStr);
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
          if (isUuid) {
            await sql`DELETE FROM transactions WHERE id = ${id}`;
          } else {
            await sql`DELETE FROM transactions WHERE sl_no = ${Number(id)}`;
          }
        } catch (e) {
          console.warn(`[${provider}] Delete failed:`, e.message);
        }
      }
    }

    localStore.transactions = localStore.transactions.filter(t => t.id !== id && String(t.sl_no || t.slNo) !== String(id));
    saveLocalStore();
    return true;
  }

  // 2. USERS & RBAC
  async getUsers() {
    const provider = this.getProvider();
    if (provider === 'supabase' || provider === 'neon') {
      const connStr = provider === 'supabase'
        ? (process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL)
        : process.env.DATABASE_URL;

      if (connStr) {
        try {
          const sql = neon(connStr);
          const rows = await sql`
            SELECT 
              user_id as "userId",
              full_name as "fullName",
              email,
              category,
              role,
              phone,
              must_change_password as "mustChangePassword",
              is_active as "isActive",
              created_at as "createdAt",
              last_password_change as "lastPasswordChange"
            FROM users
            ORDER BY created_at ASC
          `;
          return rows;
        } catch (e) {
          console.warn(`[${provider}] Get users failed:`, e.message);
        }
      }
    }

    return (localStore.users || []).map(u => ({
      userId: u.user_id || u.userId,
      fullName: u.full_name || u.fullName,
      email: u.email,
      category: u.category,
      role: u.role,
      phone: u.phone,
      mustChangePassword: !!u.must_change_password,
      isActive: u.is_active !== false,
      createdAt: u.created_at || u.createdAt
    }));
  }

  async getUserByLogin(usernameOrEmail) {
    const clean = (usernameOrEmail || '').toLowerCase().trim();
    const provider = this.getProvider();

    if (provider === 'supabase' || provider === 'neon') {
      const connStr = provider === 'supabase'
        ? (process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL)
        : process.env.DATABASE_URL;

      if (connStr) {
        try {
          const sql = neon(connStr);
          const rows = await sql`
            SELECT 
              id, user_id as "userId", full_name as "fullName", email,
              category, role, phone, must_change_password as "mustChangePassword",
              is_active as "isActive", password_hash as "passwordHash"
            FROM users 
            WHERE LOWER(user_id) = ${clean} OR LOWER(email) = ${clean}
            LIMIT 1
          `;
          if (rows && rows.length) return rows[0];
        } catch (e) {
          console.warn(`[${provider}] Get login user failed:`, e.message);
        }
      }
    }

    const u = (localStore.users || []).find(x => (x.user_id || x.userId || '').toLowerCase() === clean || (x.email || '').toLowerCase() === clean);
    if (u) {
      return {
        id: u.id,
        userId: u.user_id || u.userId,
        fullName: u.full_name || u.fullName,
        email: u.email,
        category: u.category,
        role: u.role,
        phone: u.phone,
        mustChangePassword: !!u.must_change_password,
        isActive: u.is_active !== false,
        passwordHash: u.password_hash || u.passwordHash
      };
    }
    return null;
  }

  async createUser(userData) {
    const provider = this.getProvider();
    const userId = (userData.userId || '').toLowerCase().trim();
    const fullName = (userData.fullName || '').trim();
    const email = (userData.email || '').toLowerCase().trim();
    const tempPass = userData.password || 'Dhar@2026';

    if (provider === 'supabase' || provider === 'neon') {
      const connStr = provider === 'supabase'
        ? (process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL)
        : process.env.DATABASE_URL;

      if (connStr) {
        try {
          const sql = neon(connStr);
          const rows = await sql`
            INSERT INTO users (
              user_id, full_name, email, category, role, phone, 
              password_hash, must_change_password
            ) VALUES (
              ${userId}, ${fullName}, ${email},
              ${userData.category || 'Site Operations'}, ${userData.role || 'employee'}, ${userData.phone || ''},
              crypt(${tempPass}, gen_salt('bf')), TRUE
            )
            RETURNING user_id as "userId", full_name as "fullName", email, role, category
          `;
          return rows[0];
        } catch (e) {
          console.warn(`[${provider}] Create user failed:`, e.message);
        }
      }
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      user_id: userId,
      userId: userId,
      full_name: fullName,
      fullName: fullName,
      email: email,
      category: userData.category || 'Site Operations',
      role: userData.role || 'employee',
      phone: userData.phone || '',
      password_hash: tempPass,
      must_change_password: true,
      is_active: true,
      created_at: new Date().toISOString()
    };
    localStore.users.push(newUser);
    saveLocalStore();
    return { userId, fullName, email, role: newUser.role, category: newUser.category };
  }

  // 3. HEALTH & METRICS
  async getHealth() {
    const provider = this.getProvider();
    const start = Date.now();
    const report = {
      activeProvider: provider,
      isFreeTier: provider === 'supabase' || provider === 'mongodb',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      latencyMs: 0,
      counts: {
        transactions: 0,
        users: 0
      },
      details: {}
    };

    try {
      const tx = await this.getTransactions();
      const usrs = await this.getUsers();
      report.counts.transactions = tx.length;
      report.counts.users = usrs.length;
      report.latencyMs = Date.now() - start;

      if (provider === 'supabase') {
        report.details = {
          databaseType: 'Supabase PostgreSQL (Free Tier M0)',
          cloudHost: process.env.SUPABASE_DATABASE_URL ? 'supabase.co' : 'supabase-cloud',
          features: ['Row Level Security (RLS)', 'Instant REST API', '50,000 Free MAU', 'Realtime Sync']
        };
      } else if (provider === 'mongodb') {
        report.details = {
          databaseType: 'MongoDB Atlas (Free M0 Sandbox)',
          cloudHost: 'mongodb.net',
          features: ['512MB Free Storage', 'Shared RAM', 'Document Model', 'Auto Sharding']
        };
      } else {
        report.details = {
          databaseType: 'Neon Cloud Database',
          cloudHost: 'neon.tech',
          features: ['Serverless Postgres', 'Scale-to-Zero', 'Point-in-Time Restore']
        };
      }
    } catch (e) {
      report.status = 'degraded';
      report.error = e.message;
    }

    return report;
  }

  _syncLocalTransaction(tx) {
    const exists = localStore.transactions.findIndex(t => t.id === tx.id || String(t.sl_no) === String(tx.slNo));
    if (exists !== -1) {
      localStore.transactions[exists] = { ...localStore.transactions[exists], ...tx };
    } else {
      localStore.transactions.push(tx);
    }
    saveLocalStore();
  }
}

const db = new DatabaseAdapter();
module.exports = { db, DatabaseAdapter };
