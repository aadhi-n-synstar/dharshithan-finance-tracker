const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function seedTransactions() {
  const sql = neon(process.env.DATABASE_URL);
  console.log('Seeding transactions into Neon PostgreSQL...');

  const countRes = await sql`SELECT count(*)::int as count FROM transactions`;
  if (countRes[0].count > 0) {
    console.log(`Transactions table already has ${countRes[0].count} records.`);
    return;
  }

  const initialSeed = [
    {
      sl_no: 1,
      date: '2026-11-01',
      type: 'Paid / Expense',
      party_name: 'David',
      category: 'Staff & Salary',
      description: 'Given Weekly Salary',
      amount: 1200.0,
      mode: 'CASH',
      ref_number: 'PYSL-001',
      quarter: 'Q3',
      financial_year: 'F.Y. 2026-27',
      profit_value: -1200.0
    },
    {
      sl_no: 2,
      date: '2026-11-01',
      type: 'Paid / Expense',
      party_name: 'Synstar',
      category: 'Software & Tracking',
      description: 'Paid for Client Tracking',
      amount: 20000.0,
      mode: 'CASH',
      ref_number: '-',
      quarter: 'Q3',
      financial_year: 'F.Y. 2026-27',
      profit_value: -20000.0
    },
    {
      sl_no: 3,
      date: '2026-11-01',
      type: 'Received / Income',
      party_name: 'Raj Enterprises',
      category: 'Client Waterproofing',
      description: 'Received for Client Work',
      amount: 40000.0,
      mode: 'NETBANKING',
      ref_number: '',
      quarter: 'Q3',
      financial_year: 'F.Y. 2026-27',
      profit_value: 40000.0
    }
  ];

  for (const t of initialSeed) {
    await sql`
      INSERT INTO transactions (
        sl_no, date, type, party_name, category, description, 
        amount, mode, ref_number, quarter, financial_year, profit_value
      ) VALUES (
        ${t.sl_no}, ${t.date}, ${t.type}, ${t.party_name}, ${t.category}, ${t.description},
        ${t.amount}, ${t.mode}, ${t.ref_number}, ${t.quarter}, ${t.financial_year}, ${t.profit_value}
      )
    `;
  }

  console.log(`Successfully seeded ${initialSeed.length} transactions into Neon DB!`);
  const rows = await sql`SELECT sl_no, party_name, amount, type, quarter, financial_year FROM transactions ORDER BY sl_no`;
  console.log('Current transactions in Neon DB:');
  console.table(rows);
}

seedTransactions().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
