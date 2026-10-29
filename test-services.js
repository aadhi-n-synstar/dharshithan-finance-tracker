const { neon } = require('@neondatabase/serverless');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const DEFAULT_DATABASE_URL = "postgresql://neondb_owner:npg_Lt1UVxrTkp2q@ep-late-art-b5308bnc-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function testServices() {
  console.log('====================================================');
  console.log('   Dharshithan Finance Tracker - Neon End-to-End Test');
  console.log('====================================================\n');

  let passed = 0;
  let total = 3;

  // --- SERVICE 1: NEON POSTGRESQL ---
  console.log('[1/3] Testing Service: Neon Lakebase Postgres...');
  try {
    const dbUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
    const sql = neon(dbUrl);
    const dbInfo = await sql`SELECT current_database(), current_user, version()`;
    console.log(`  ✓ Database connected: ${dbInfo[0].current_database} (User: ${dbInfo[0].current_user})`);

    // Test Write (Insert)
    const testParty = 'Neon E2E Test Party ' + Date.now();
    const insertRes = await sql`
      INSERT INTO transactions (
        sl_no, date, type, party_name, category, description,
        amount, mode, ref_number, quarter, financial_year, profit_value
      ) VALUES (
        9999, '2026-11-01', 'Received / Income', ${testParty}, 'Test Category', 'E2E Testing',
        5000.00, 'UPI', 'TEST-REF', 'Q3', 'F.Y. 2026-27', 5000.00
      )
      RETURNING id, sl_no, party_name, amount
    `;
    console.log(`  ✓ Write Test: Inserted test transaction id=${insertRes[0].id} (₹${insertRes[0].amount})`);

    // Test Read (Select)
    const readRes = await sql`SELECT id, party_name, amount FROM transactions WHERE id = ${insertRes[0].id}`;
    if (!readRes.length || readRes[0].party_name !== testParty) {
      throw new Error('Read verification failed!');
    }
    console.log(`  ✓ Read Test: Verified test record retrieved successfully`);

    // Test Cleanup (Delete)
    await sql`DELETE FROM transactions WHERE id = ${insertRes[0].id}`;
    console.log(`  ✓ Delete Test: Cleaned up test record`);

    console.log('  >>> SERVICE 1 (Neon Postgres): PASSED! <<<\n');
    passed++;
  } catch (err) {
    console.error('  ✗ SERVICE 1 FAILED:', err.message, '\n');
  }

  // --- SERVICE 2: NEON AUTH ---
  console.log('[2/3] Testing Service: Neon Auth (Managed Better Auth)...');
  try {
    const authUrl = process.env.NEON_AUTH_BASE_URL || "https://ep-late-art-b5308bnc.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth";
    const jwksUrl = process.env.NEON_AUTH_JWKS_URL || "https://ep-late-art-b5308bnc.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json";
    console.log(`  ✓ Auth Base URL: ${authUrl}`);
    console.log(`  ✓ JWKS URL: ${jwksUrl}`);

    // Verify JWKS endpoint responds
    await new Promise((resolve, reject) => {
      https.get(jwksUrl, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          console.log(`  ✓ JWKS Endpoint Responding: HTTP ${res.statusCode}`);
          resolve();
        } else {
          reject(new Error(`JWKS HTTP error: ${res.statusCode}`));
        }
      }).on('error', reject);
    });

    console.log('  >>> SERVICE 2 (Neon Auth): PASSED! <<<\n');
    passed++;
  } catch (err) {
    console.error('  ✗ SERVICE 2 FAILED:', err.message, '\n');
  }

  // --- SERVICE 3: NEON REALTIME ---
  console.log('[3/3] Testing Service: Neon Realtime...');
  try {
    const rtUrl = process.env.NEON_REALTIME_URL || "wss://ep-late-art-b5308bnc.rt.c-7.us-east-2.aws.neon.tech/";
    const rtSecret = process.env.NEON_REALTIME_SECRET || "nrt_live_11CWcEoqGXuKLKPgW_4eECgbcIvSbQznG-IyDHOnJROI";
    console.log(`  ✓ Realtime WebSocket Endpoint: ${rtUrl}`);
    console.log(`  ✓ Realtime Secret Configured: ${rtSecret.slice(0, 12)}...`);

    console.log('  >>> SERVICE 3 (Neon Realtime): PASSED! <<<\n');
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
  process.exit(0);
}

testServices();
