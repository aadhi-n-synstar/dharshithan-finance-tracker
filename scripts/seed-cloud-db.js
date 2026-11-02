const { db } = require('../api/db-adapter');
require('dotenv').config({ path: '.env.local' });

async function seedCloudDb() {
  console.log('--- Dharshithan Finance Tracker: Cloud DB Seeding (Supabase / MongoDB) ---');
  console.log(`Active Provider: ${db.getProvider().toUpperCase()}`);

  const initialSeed = [
    {
      slNo: 1,
      date: '2026-11-01',
      type: 'Paid / Expense',
      partyName: 'David',
      category: 'Staff & Salary',
      description: 'Given Weekly Salary',
      amount: 1200.0,
      mode: 'CASH',
      refNumber: 'PYSL-001',
      quarter: 'Q3',
      financialYear: 'F.Y. 2026-27',
      profitValue: -1200.0
    },
    {
      slNo: 2,
      date: '2026-11-01',
      type: 'Paid / Expense',
      partyName: 'Synstar',
      category: 'Software & Tracking',
      description: 'Paid for Client Tracking',
      amount: 20000.0,
      mode: 'CASH',
      refNumber: '-',
      quarter: 'Q3',
      financialYear: 'F.Y. 2026-27',
      profitValue: -20000.0
    },
    {
      slNo: 3,
      date: '2026-11-01',
      type: 'Received / Income',
      partyName: 'Raj Enterprises',
      category: 'Client Waterproofing',
      description: 'Received for Client Work',
      amount: 40000.0,
      mode: 'NETBANKING',
      refNumber: 'INV-2026-001',
      quarter: 'Q3',
      financialYear: 'F.Y. 2026-27',
      profitValue: 40000.0
    }
  ];

  try {
    const existing = await db.getTransactions();
    if (existing.length > 0) {
      console.log(`Cloud database already contains ${existing.length} transactions. Skipping initial seed.`);
      return;
    }

    for (const item of initialSeed) {
      await db.createTransaction(item);
      console.log(`✓ Seeded transaction: ${item.partyName} (₹${item.amount})`);
    }
    console.log('✓ Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
}

seedCloudDb().then(() => process.exit(0));
