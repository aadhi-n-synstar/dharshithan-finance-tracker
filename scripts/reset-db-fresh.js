const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function resetDbFresh() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Neon PostgreSQL for fresh reset...');

  // 1. Truncate transactions (fresh null start)
  await client.query('TRUNCATE TABLE transactions RESTART IDENTITY CASCADE;');
  console.log('✓ Cleared all transactions (0 records, fresh start)');

  // 2. Ensure only Super Admin exists
  await client.query("DELETE FROM users WHERE user_id != 'admin';");
  await client.query(`
    INSERT INTO users (user_id, full_name, email, category, role, phone, password_hash, must_change_password)
    VALUES ('admin', 'Super Administrator', 'admin@dharshithan.com', 'Executive Management', 'super_admin', '+91 98765 43210', crypt('admin@2026', gen_salt('bf')), FALSE)
    ON CONFLICT (email) DO UPDATE SET password_hash = crypt('admin@2026', gen_salt('bf')), role = 'super_admin', user_id = 'admin';
  `);
  console.log('✓ Users reset: only Super Admin (admin / admin@2026) retained');

  // 3. Reset liquidity settings
  await client.query('TRUNCATE TABLE liquidity_settings RESTART IDENTITY;');
  await client.query('INSERT INTO liquidity_settings (id, opening_bank_balance, opening_cash_float) VALUES (1, 0.00, 0.00) ON CONFLICT (id) DO NOTHING;');
  console.log('✓ Liquidity settings reset to 0.00');

  // 4. Verification
  const txRes = await client.query('SELECT count(*)::int as count FROM transactions');
  const uRes = await client.query('SELECT count(*)::int as count FROM users');
  console.log('Current transactions count:', txRes.rows[0].count);
  console.log('Current users count:', uRes.rows[0].count);

  await client.end();
  console.log('DATABASE RESET COMPLETE: 100% FRESH AND READY!');
}

resetDbFresh().catch(err => {
  console.error('Reset failed:', err);
  process.exit(1);
});
