const { getSql } = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Role, X-User-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getSql();
  const userRole = req.headers['x-user-role'] || 'SUPER_ADMIN';

  if (userRole !== 'SUPER_ADMIN' && userRole !== 'OWNER') {
    return res.status(403).json({ error: 'Access denied: Audit logs are restricted to Super Admin & Owner.' });
  }

  try {
    const { table_name, action, limit = 50 } = req.query || {};
    let query = `
      SELECT a.*, u.full_name as user_name, u.email as user_email, u.role as user_role
      FROM finance_audit_logs a
      LEFT JOIN finance_users u ON a.performed_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (table_name) {
      params.push(table_name);
      query += ` AND a.table_name = $${params.length}`;
    }
    if (action) {
      params.push(action);
      query += ` AND a.action = $${params.length}`;
    }

    params.push(parseInt(limit) || 50);
    query += ` ORDER BY a.created_at DESC LIMIT $${params.length}`;

    const rows = await sql.query(query, params);
    return res.status(200).json({ audit_logs: rows });
  } catch (err) {
    console.error('Audit logs API error:', err);
    res.status(500).json({ error: err.message });
  }
};
