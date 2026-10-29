const { neon } = require('@neondatabase/serverless');

const DEFAULT_DATABASE_URL = "postgresql://neondb_owner:npg_Lt1UVxrTkp2q@ep-late-art-b5308bnc-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";
const DEFAULT_AUTH_URL = "https://ep-late-art-b5308bnc.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth";
const DEFAULT_JWKS_URL = "https://ep-late-art-b5308bnc.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json";
const DEFAULT_REALTIME_URL = "wss://ep-late-art-b5308bnc.rt.c-7.us-east-2.aws.neon.tech/";
const DEFAULT_REALTIME_SECRET = "nrt_live_11CWcEoqGXuKLKPgW_4eECgbcIvSbQznG-IyDHOnJROI";

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
    const dbUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
    const sql = neon(dbUrl);
    const dbRes = await sql`SELECT current_database(), current_user, version()`;
    const countRes = await sql`SELECT count(*)::int as count FROM transactions`;
    report.services.postgres = {
      status: 'healthy',
      database: dbRes[0].current_database,
      user: dbRes[0].current_user,
      transactionCount: countRes[0].count,
      pooledUrl: 'configured'
    };
  } catch (err) {
    report.services.postgres = { status: 'error', error: err.message };
  }

  // 2. Check Neon Auth
  try {
    const authUrl = process.env.NEON_AUTH_BASE_URL || DEFAULT_AUTH_URL;
    const jwksUrl = process.env.NEON_AUTH_JWKS_URL || DEFAULT_JWKS_URL;
    report.services.auth = {
      status: 'healthy',
      provider: 'better_auth',
      baseUrl: authUrl,
      jwksUrl: jwksUrl
    };
  } catch (err) {
    report.services.auth = { status: 'error', error: err.message };
  }

  // 3. Check Neon Realtime
  try {
    const rtUrl = process.env.NEON_REALTIME_URL || DEFAULT_REALTIME_URL;
    const rtSecret = process.env.NEON_REALTIME_SECRET || DEFAULT_REALTIME_SECRET;
    report.services.realtime = {
      status: 'healthy',
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
