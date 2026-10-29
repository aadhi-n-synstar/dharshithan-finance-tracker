const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const report = {
    timestamp: new Date().toISOString(),
    services: {}
  };

  // 1. Check Neon PostgreSQL
  try {
    const sql = neon(process.env.DATABASE_URL);
    const dbRes = await sql`SELECT current_database(), current_user, version()`;
    const countRes = await sql`SELECT count(*)::int as count FROM transactions`;
    report.services.postgres = {
      status: 'healthy',
      database: dbRes[0].current_database,
      user: dbRes[0].current_user,
      transactionCount: countRes[0].count,
      pooledUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
    };
  } catch (err) {
    report.services.postgres = { status: 'error', error: err.message };
  }

  // 2. Check Neon Auth
  try {
    const authUrl = process.env.NEON_AUTH_BASE_URL;
    const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
    report.services.auth = {
      status: authUrl ? 'healthy' : 'unconfigured',
      provider: 'better_auth',
      baseUrl: authUrl,
      jwksUrl: jwksUrl
    };
  } catch (err) {
    report.services.auth = { status: 'error', error: err.message };
  }

  // 3. Check Neon Realtime
  try {
    const rtUrl = process.env.NEON_REALTIME_URL;
    const rtSecret = process.env.NEON_REALTIME_SECRET;
    report.services.realtime = {
      status: rtUrl ? 'healthy' : 'unconfigured',
      url: rtUrl,
      secretConfigured: !!rtSecret
    };
  } catch (err) {
    report.services.realtime = { status: 'error', error: err.message };
  }

  const allHealthy = Object.values(report.services).every(s => s.status === 'healthy');
  return res.status(allHealthy ? 200 : 207).json({
    success: allHealthy,
    ...report
  });
};
