const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function resetDbFresh() {
  const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('No PostgreSQL connection string found. Resetting local store...');
    const fs = require('fs');
    const localDbPath = path.join(__dirname, '..', 'data', 'local-db.json');
    const resetData = {
      users: [
        {
          id: "563fd33e-d726-45ae-a31d-1ecca9a776e3",
          user_id: "admin",
          full_name: "Super Administrator",
          email: "admin@dharshithan.com",
          category: "Executive Management",
          role: "super_admin",
          phone: "+91 98765 43210",
          password_hash: "$2a$10$wT0l72W2q8oM1K3T6oYmPe3O6G.Pq7WkZ5b9jB8zD0a1c2e3f4g5h",
          must_change_password: false,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ],
      transactions: [],
      liquidity: {
        opening_bank_balance: 0.00,
        opening_cash_float: 0.00,
        last_reconciled_at: new Date().toISOString()
      },
      audit_logs: [
        {
          id: "audit-reset",
          user_id: "admin",
          user_email: "admin@dharshithan.com",
          action: "DATABASE_RESET",
          record_id: "reset",
          details: { message: "Database reset to fresh state" },
          created_at: new Date().toISOString()
        }
      ]
    };
    fs.writeFileSync(localDbPath, JSON.stringify(resetData, null, 2), 'utf8');
    console.log('✓ Local store successfully reset to fresh state.');
    return;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Supabase PostgreSQL for fresh reset...');

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
