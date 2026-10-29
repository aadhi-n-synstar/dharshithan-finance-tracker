const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function build() {
  console.log('--- Dharshithan Finance Tracker: Neon Cloud Build ---');

  // 1. Verify required environment variables
  console.log('1. Verifying Neon Environment Variables...');
  const required = ['DATABASE_URL', 'NEON_AUTH_BASE_URL', 'NEON_REALTIME_URL'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required Neon variable: ${key}`);
    }
    console.log(`   ✓ ${key}: OK`);
  }

  // 2. Validate essential files exist
  console.log('2. Validating Project Structure...');
  const files = [
    'index.html',
    'neon.ts',
    'vercel.json',
    'api/transactions.js',
    'api/users.js',
    'api/auth.js',
    'api/health.js',
    'js/app.js',
    'js/db.js',
    'js/auth.js'
  ];

  for (const f of files) {
    if (!fs.existsSync(path.join(__dirname, '..', f))) {
      throw new Error(`Critical file missing: ${f}`);
    }
  }
  console.log('   ✓ All critical files verified.');

  // 3. Test Live Connection to Neon PostgreSQL
  console.log('3. Testing Live Connection to Neon PostgreSQL...');
  const sql = neon(process.env.DATABASE_URL);
  const version = await sql`SELECT version(), current_database(), current_user`;
  console.log(`   ✓ Connected to ${version[0].current_database} as ${version[0].current_user}`);

  const txCount = await sql`SELECT count(*)::int as count FROM transactions`;
  console.log(`   ✓ Active transactions in Neon DB: ${txCount[0].count}`);

  const userCount = await sql`SELECT count(*)::int as count FROM users`;
  console.log(`   ✓ Active users in Neon DB: ${userCount[0].count}`);

  console.log('\n========================================');
  console.log('BUILD SUCCESSFUL! App ready for Neon deployment.');
  console.log('========================================');
}

build().catch(err => {
  console.error('\nBuild failed:', err);
  process.exit(1);
});
