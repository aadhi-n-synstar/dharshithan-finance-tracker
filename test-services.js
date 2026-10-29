const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_Lt1UVxrTkp2q@ep-late-art-b5308bnc-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function testServices() {
  console.log('========================================================================');
  console.log('   Dharshithan Waterproofing - Enterprise Neon Ledger Test Suite');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 4;

  const sql = neon(dbUrl);

  // --- TEST 1: NEON DATABASE CONNECTIVITY ---
  console.log('[1/4] Testing Neon Serverless PostgreSQL Connection...');
  try {
    const dbInfo = await sql.query('SELECT current_database(), current_user, version()');
    console.log(`  ✓ Connected: Database=${dbInfo[0].current_database}, User=${dbInfo[0].current_user}`);
    passed++;
  } catch (err) {
    console.error('  ✗ Neon connection error:', err.message);
  }

  // --- TEST 2: TAX INVOICES & RECEIPTS ENGINE ---
  console.log('\n[2/4] Testing Invoices & Receipts Engine...');
  try {
    const invCount = await sql.query('SELECT count(*)::int as count FROM invoices_receipts');
    console.log(`  ✓ Invoices table accessible. Total invoices: ${invCount[0].count}`);

    // Insert test invoice
    const testInv = await sql.query(`
      INSERT INTO invoices_receipts (
        receipt_no, date, client_name, sub_total, grand_total, grand_total_words, payment_mode
      ) VALUES (
        'DWCS/TEST/001', CURRENT_DATE, 'Automated Test Client', 10000.00, 11800.00,
        'Eleven Thousand Eight Hundred Rupees Only', 'UPI'
      ) RETURNING id, receipt_no
    `);
    console.log(`  ✓ Inserted test invoice id=${testInv[0].id}`);

    // Clean up
    await sql.query('DELETE FROM invoices_receipts WHERE id = $1', [testInv[0].id]);
    console.log('  ✓ Cleaned up test invoice');
    passed++;
  } catch (err) {
    console.error('  ✗ Invoices test error:', err.message);
  }

  // --- TEST 3: FINANCIAL VOUCHERS ENGINE ---
  console.log('\n[3/4] Testing Financial Vouchers Engine...');
  try {
    const vouCount = await sql.query('SELECT count(*)::int as count FROM financial_vouchers');
    console.log(`  ✓ Financial vouchers table accessible. Total vouchers: ${vouCount[0].count}`);

    const testVou = await sql.query(`
      INSERT INTO financial_vouchers (
        voucher_no, voucher_type, category, paid_to_or_received_from, amount,
        amount_in_words, payment_mode, narration
      ) VALUES (
        'DWCS/TEST/V01', 'PAYMENT', 'Chemical Purchase', 'Test Vendor', 5000.00,
        'Five Thousand Rupees Only', 'UPI', 'Test Voucher'
      ) RETURNING id, voucher_no
    `);
    console.log(`  ✓ Inserted test voucher id=${testVou[0].id}`);

    await sql.query('DELETE FROM financial_vouchers WHERE id = $1', [testVou[0].id]);
    console.log('  ✓ Cleaned up test voucher');
    passed++;
  } catch (err) {
    console.error('  ✗ Vouchers test error:', err.message);
  }

  // --- TEST 4: SALARY DISBURSEMENT & AUDIT LOG ENGINE ---
  console.log('\n[4/4] Testing Salary Disbursements & Audit Logs...');
  try {
    const salCount = await sql.query('SELECT count(*)::int as count FROM salary_disbursements');
    const auditCount = await sql.query('SELECT count(*)::int as count FROM finance_audit_logs');
    console.log(`  ✓ Salary disbursements: ${salCount[0].count} records`);
    console.log(`  ✓ Finance audit logs: ${auditCount[0].count} records`);
    passed++;
  } catch (err) {
    console.error('  ✗ Salary/Audit test error:', err.message);
  }

  console.log('\n========================================================================');
  console.log(`Summary: ${passed}/${total} Enterprise Ledger Engines Verified and Active`);
  console.log('========================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
  process.exit(0);
}

testServices();
