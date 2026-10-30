const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const DEFAULT_DATABASE_URL = "postgresql://neondb_owner:npg_Lt1UVxrTkp2q@ep-late-art-b5308bnc-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function exportNeonData() {
  console.log('--- Exporting Existing Data from Neon ---');
  const sql = neon(process.env.DATABASE_URL || DEFAULT_DATABASE_URL);

  let users = [];
  let transactions = [];
  let liquidity = [];
  let auditLogs = [];

  try {
    users = await sql`SELECT * FROM users ORDER BY created_at ASC`;
    console.log(`✓ Fetched ${users.length} users`);
  } catch (e) {
    console.warn('Could not read users:', e.message);
  }

  try {
    transactions = await sql`SELECT * FROM transactions ORDER BY sl_no ASC`;
    console.log(`✓ Fetched ${transactions.length} transactions`);
  } catch (e) {
    console.warn('Could not read transactions:', e.message);
  }

  try {
    liquidity = await sql`SELECT * FROM liquidity_settings`;
    console.log(`✓ Fetched ${liquidity.length} liquidity settings`);
  } catch (e) {
    console.warn('Could not read liquidity settings:', e.message);
  }

  try {
    auditLogs = await sql`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`;
    console.log(`✓ Fetched ${auditLogs.length} audit logs`);
  } catch (e) {
    console.warn('Could not read audit logs:', e.message);
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    source: 'Neon Lakebase PostgreSQL',
    counts: {
      users: users.length,
      transactions: transactions.length,
      liquidity: liquidity.length,
      auditLogs: auditLogs.length
    },
    users,
    transactions,
    liquidity,
    auditLogs
  };

  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outPath = path.join(dataDir, 'neon-backup.json');
  fs.writeFileSync(outPath, JSON.stringify(exportPayload, null, 2), 'utf8');
  console.log(`✓ Successfully exported data to ${outPath}`);
  return exportPayload;
}

if (require.main === module) {
  exportNeonData()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Export error:', err);
      process.exit(1);
    });
}

module.exports = { exportNeonData };
