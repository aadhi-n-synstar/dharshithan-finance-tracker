const { getSql } = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getSql();
  const report = {
    status: 'online',
    timestamp: new Date().toISOString(),
    engine: 'Neon Serverless PostgreSQL',
    services: {}
  };

  try {
    const dbRes = await sql.query('SELECT current_database(), current_user');
    const invCount = await sql.query('SELECT count(*)::int as count FROM invoices_receipts');
    const vouCount = await sql.query('SELECT count(*)::int as count FROM financial_vouchers');
    const salCount = await sql.query('SELECT count(*)::int as count FROM salary_disbursements');

    report.services.postgres = {
      status: 'healthy',
      database: dbRes[0].current_database,
      total_invoices: invCount[0].count,
      total_vouchers: vouCount[0].count,
      total_salaries: salCount[0].count,
      connected: true
    };
  } catch (err) {
    report.services.postgres = {
      status: 'error',
      connected: false,
      error: err.message
    };
    report.status = 'degraded';
  }

  return res.status(200).json(report);
};
