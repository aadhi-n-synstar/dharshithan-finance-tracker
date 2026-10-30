const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const DEFAULT_DATABASE_URL = "postgresql://neondb_owner:npg_Lt1UVxrTkp2q@ep-late-art-b5308bnc-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function showUsers() {
  const sql = neon(process.env.DATABASE_URL || DEFAULT_DATABASE_URL);
  const rows = await sql`SELECT id, user_id, email, full_name, role, is_active FROM users`;
  console.log('Users in users table:');
  console.table(rows);
  const txns = await sql`SELECT id, sl_no, date, type, party_name, amount FROM transactions`;
  console.log('Transactions in transactions table:');
  console.table(txns);
}

showUsers().catch(console.error);
