const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL not found in .env.local');
  }

  console.log('Connecting to Neon PostgreSQL direct endpoint...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Neon PostgreSQL!');

  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  console.log('Applying schema.sql to Neon database...');
  await client.query(schemaSql);
  console.log('Schema applied successfully!');

  // Verify created tables
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

  console.log('Public tables in Neon DB:');
  res.rows.forEach(r => console.log(' - ' + r.table_name));

  // Verify initial super admin
  const userRes = await client.query('SELECT user_id, full_name, email, role FROM users');
  console.log('Users in Neon DB:');
  userRes.rows.forEach(u => console.log(` - ${u.user_id} (${u.role}): ${u.full_name} <${u.email}>`));

  await client.end();
  console.log('Migration complete!');
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
