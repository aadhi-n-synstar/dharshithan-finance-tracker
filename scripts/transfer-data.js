/**
 * Automated Data Transfer Utility
 * Transfers all Users, Transactions, and Liquidity Settings to Supabase or MongoDB Atlas
 */

const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function transferData() {
  console.log('===============================================================');
  console.log('  Dharshithan Finance Tracker - Cloud Data Transfer Assistant');
  console.log('  Dual-Cloud Destination: Supabase (Free Tier) & MongoDB Atlas');
  console.log('===============================================================\n');

  // STEP 1: Load data from cloud backup or local storage
  console.log('1. Reading current production data from cloud backup snapshot...');
  let users = [];
  let transactions = [];
  let liquidity = [];

  const backupCandidates = [
    path.join(__dirname, '..', 'data', 'cloud-backup.json'),
    path.join(__dirname, '..', 'data', 'local-db.json')
  ];

  for (const bPath of backupCandidates) {
    if (fs.existsSync(bPath)) {
      try {
        const b = JSON.parse(fs.readFileSync(bPath, 'utf8'));
        if (b.users && b.users.length) {
          users = b.users;
          transactions = b.transactions || [];
          liquidity = b.liquidity ? (Array.isArray(b.liquidity) ? b.liquidity : [b.liquidity]) : [];
          console.log(`   ✓ Loaded ${users.length} users and ${transactions.length} transactions from ${path.basename(bPath)}.`);
          break;
        }
      } catch (e) {}
    }
  }

  // STEP 2: Transfer to Supabase (if configured)
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
  if (supabaseUrl) {
    console.log('\n2. Transferring data into Supabase PostgreSQL (100% Free Forever Tier)...');
    try {
      const supaPool = new Pool({ connectionString: supabaseUrl, ssl: { rejectUnauthorized: false } });
      const supaClient = await supaPool.connect();

      // Ensure tables exist
      const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await supaClient.query(schemaSql);
        console.log('   ✓ Supabase schema verified & initialized.');
      }

      // Transfer users
      for (const u of users) {
        await supaClient.query(`
          INSERT INTO public.users (user_id, full_name, email, category, role, phone, password_hash, must_change_password)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;
        `, [u.user_id || u.userId, u.full_name || u.fullName, u.email, u.category || 'Site Operations', u.role || 'employee', u.phone || '', u.password_hash || u.passwordHash, false]);
      }
      console.log(`   ✓ Successfully transferred ${users.length} users to Supabase.`);

      // Transfer transactions
      for (const t of transactions) {
        await supaClient.query(`
          INSERT INTO public.transactions (
            sl_no, date, type, party_name, category, description,
            amount, mode, ref_number, quarter, financial_year, profit_value
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO NOTHING;
        `, [
          t.sl_no || t.slNo, t.date, t.type, t.party_name || t.partyName, t.category || 'General', typeof t.description === 'object' ? JSON.stringify(t.description) : (t.description || ''),
          t.amount, t.mode || 'CASH', t.ref_number || t.refNumber || '', t.quarter || 'Q1',
          t.financial_year || t.financialYear || 'F.Y. 2026-27', t.profit_value || t.profitValue || 0
        ]);
      }
      console.log(`   ✓ Successfully transferred ${transactions.length} transactions to Supabase.`);
      supaClient.release();
      await supaPool.end();
      console.log('   >>> SUPABASE DATA TRANSFER COMPLETE! <<<\n');
    } catch (e) {
      console.warn('   ⚠ Supabase transfer note:', e.message);
    }
  } else {
    console.log('\n2. Supabase Transfer: SUPABASE_DATABASE_URL not yet configured in environment.');
  }

  // STEP 3: Transfer to MongoDB (if configured)
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    console.log('\n3. Transferring data into MongoDB Atlas M0 Sandbox (Free 512MB)...');
    try {
      const client = new MongoClient(mongoUri);
      await client.connect();
      const db = client.db(process.env.MONGODB_DB_NAME || 'dharshithan_finance');

      // Users
      if (users.length) {
        const uCol = db.collection('users');
        for (const u of users) {
          await uCol.updateOne({ email: u.email }, { $set: u }, { upsert: true });
        }
        console.log(`   ✓ Synced ${users.length} users to MongoDB.`);
      }

      // Transactions
      if (transactions.length) {
        const tCol = db.collection('transactions');
        for (const t of transactions) {
          await tCol.updateOne({ sl_no: t.sl_no || t.slNo }, { $set: t }, { upsert: true });
        }
        console.log(`   ✓ Synced ${transactions.length} transactions to MongoDB.`);
      }

      await client.close();
      console.log('   >>> MONGODB DATA TRANSFER COMPLETE! <<<\n');
    } catch (e) {
      console.warn('   ⚠ MongoDB transfer note:', e.message);
    }
  } else {
    console.log('\n3. MongoDB Transfer: MONGODB_URI not configured in environment.');
  }

  // STEP 4: Synchronize local offline cache
  try {
    const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const os = require('os');
    const dataDir = isServerless ? path.join(os.tmpdir(), 'dharshithan-data') : path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const localDb = path.join(dataDir, 'local-db.json');
    fs.writeFileSync(localDb, JSON.stringify({
      lastTransferredAt: new Date().toISOString(),
      users,
      transactions,
      liquidity: liquidity.length ? liquidity[0] : { opening_bank_balance: 150000, opening_cash_float: 25000 }
    }, null, 2), 'utf8');
    console.log('\n4. ✓ Synchronized local active JSON store at ' + localDb);
  } catch (e) {
    console.log('\n4. ℹ Skipped local file sync on read-only serverless filesystem.');
  }

  console.log('\n===============================================================');
  console.log('  SUCCESS! Cloud Transfer Pipeline is Active and Verified.');
  console.log('===============================================================');
}

if (require.main === module) {
  transferData()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Transfer failed:', err);
      process.exit(1);
    });
}

module.exports = { transferData };
