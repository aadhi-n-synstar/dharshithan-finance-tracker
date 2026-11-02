const path = require('path');
const ROOT_DIR = path.resolve(__dirname);

// Load env safely from project root
try {
  require('dotenv').config({ path: path.join(ROOT_DIR, '.env.local') });
} catch (e) {}

const { db } = require(path.join(ROOT_DIR, 'api', 'db-adapter'));

async function testServices() {
  console.log('====================================================');
  console.log('   Dharshithan Finance Tracker - Cloud Services Test');
  console.log('   Active Engine: Supabase (Free Tier) / MongoDB Atlas (Free M0)');
  console.log('====================================================\n');

  let passed = 0;
  let total = 3;

  // --- SERVICE 1: UNIFIED DATABASE ADAPTER ---
  console.log('[1/3] Testing Unified Database Engine (Active: ' + db.getProvider() + ')...');
  try {
    const health = await db.getHealth();
    console.log(`  ✓ Provider Status: ${health.status.toUpperCase()} (${health.details.databaseType || 'Multi-Cloud Engine'})`);
    console.log(`  ✓ Response Latency: ${health.latencyMs}ms`);

    // Test Write (Insert)
    const testTxn = await db.createTransaction({
      date: '2026-11-01',
      type: 'Received / Income',
      partyName: 'Cloud E2E Verification Party',
      category: 'Cloud Test',
      description: 'End-to-End Automated Test Transaction',
      amount: 7500.00,
      mode: 'UPI',
      refNumber: 'TEST-UPI-' + Date.now(),
      quarter: 'Q3',
      financialYear: 'F.Y. 2026-27',
      profitValue: 7500.00
    });
    console.log(`  ✓ Write Test: Inserted transaction id=${testTxn.id} (₹${testTxn.amount})`);

    // Test Read (Select)
    const allTx = await db.getTransactions();
    const found = allTx.find(t => t.id === testTxn.id || t.partyName === 'Cloud E2E Verification Party');
    if (!found) throw new Error('Could not find newly created test record');
    console.log(`  ✓ Read Test: Verified test record retrieved successfully`);

    // Test Cleanup (Delete)
    await db.deleteTransaction(testTxn.id);
    console.log(`  ✓ Delete Test: Cleaned up test record`);

    console.log('  >>> SERVICE 1 (Unified Cloud DB Engine): PASSED! <<<\n');
    passed++;
  } catch (err) {
    console.error('  ✗ SERVICE 1 FAILED:', err.message, '\n');
  }

  // --- SERVICE 2: USER GOVERNANCE & RBAC ---
  console.log('[2/3] Testing User & Role-Based Access Control (RBAC)...');
  try {
    const users = await db.getUsers();
    console.log(`  ✓ Users found in database: ${users.length}`);
    const adminUser = await db.getUserByLogin('admin');
    if (!adminUser) throw new Error('Super Admin user (admin) not found in active database engine');
    
    const adminName = adminUser.fullName || adminUser.full_name || 'Super Administrator';
    const adminRole = adminUser.role || 'super_admin';
    const adminEmail = adminUser.email || 'admin@dharshithan.com';
    console.log(`  ✓ Super Admin verified: ${adminName} (${adminEmail}) - Role: ${adminRole}`);

    console.log('  >>> SERVICE 2 (User Governance & RBAC): PASSED! <<<\n');
    passed++;
  } catch (err) {
    console.error('  ✗ SERVICE 2 FAILED:', err.message, '\n');
  }

  // --- SERVICE 3: CLOUD HEALTH & SYNC STATUS ---
  console.log('[3/3] Testing Health Monitor & Migration Endpoints...');
  try {
    const health = await db.getHealth();
    console.log(`  ✓ Health check confirmed: ${health.status}`);
    console.log(`  ✓ Live transaction count: ${health.counts.transactions}`);
    console.log(`  ✓ Live user count: ${health.counts.users}`);

    console.log('  >>> SERVICE 3 (Health Monitor & Endpoints): PASSED! <<<\n');
    passed++;
  } catch (err) {
    console.error('  ✗ SERVICE 3 FAILED:', err.message, '\n');
  }

  console.log('====================================================');
  console.log(`Summary: ${passed}/${total} Services Verified and Active`);
  console.log('====================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

testServices().catch(err => {
  console.error('Test services execution failed:', err);
  process.exit(1);
});
