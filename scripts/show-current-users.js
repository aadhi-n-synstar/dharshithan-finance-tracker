const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { db } = require(path.join(__dirname, '..', 'api', 'db-adapter'));

async function showUsers() {
  console.log(`Checking data via Database Engine: ${db.getProvider()}...`);
  const users = await db.getUsers();
  console.log(`\n=== Users in ${db.getProvider().toUpperCase()} (${users.length}) ===`);
  console.table(users.map(u => ({
    userId: u.userId || u.user_id,
    fullName: u.fullName || u.full_name,
    email: u.email,
    role: u.role,
    category: u.category,
    isActive: u.isActive !== false
  })));

  const txns = await db.getTransactions();
  console.log(`\n=== Transactions in ${db.getProvider().toUpperCase()} (${txns.length}) ===`);
  console.table(txns.slice(0, 10).map(t => ({
    slNo: t.slNo || t.sl_no,
    date: t.date,
    type: t.type,
    partyName: t.partyName || t.party_name,
    amount: t.amount,
    mode: t.mode
  })));
}

showUsers().catch(console.error);
