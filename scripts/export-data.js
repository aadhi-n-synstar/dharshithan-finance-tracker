/**
 * Cloud Data Export Script
 * Exports current data to data/cloud-backup.json
 */

const fs = require('fs');
const path = require('path');
const { db } = require('../api/db-adapter');

async function exportData() {
  console.log('=== Dharshithan Finance Tracker: Cloud Data Export ===');
  console.log(`Provider: ${db.getProvider().toUpperCase()}`);

  const users = await db.getUsers();
  const transactions = await db.getTransactions();
  const health = await db.getHealth();

  const backupPayload = {
    exportedAt: new Date().toISOString(),
    provider: db.getProvider(),
    counts: {
      users: users.length,
      transactions: transactions.length
    },
    users,
    transactions,
    liquidity: {
      opening_bank_balance: 150000.00,
      opening_cash_float: 25000.00,
      last_reconciled_at: new Date().toISOString()
    }
  };

  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const exportPath = path.join(dataDir, 'cloud-backup.json');
  fs.writeFileSync(exportPath, JSON.stringify(backupPayload, null, 2), 'utf8');

  console.log(`✓ Exported ${users.length} users and ${transactions.length} transactions to:`);
  console.log(`  ${exportPath}`);
  console.log('=== Export Complete ===');
}

exportData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Export failed:', err);
    process.exit(1);
  });
