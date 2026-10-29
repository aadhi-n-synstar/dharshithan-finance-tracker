const { neon } = require('@neondatabase/serverless');

const DEFAULT_DATABASE_URL = "postgresql://neondb_owner:npg_Lt1UVxrTkp2q@ep-late-art-b5308bnc-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

function getDb() {
  const url = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
  return neon(url);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const sql = getDb();

    // 1. GET - Fetch all users
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT 
          user_id as "userId",
          full_name as "fullName",
          email,
          category,
          role,
          phone,
          must_change_password as "mustChangePassword",
          is_active as "isActive",
          created_at as "createdAt",
          last_password_change as "lastPasswordChange"
        FROM users
        ORDER BY created_at ASC
      `;
      return res.status(200).json({ success: true, count: rows.length, data: rows });
    }

    // 2. POST - Add new user
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { userId, fullName, email, category, role, phone, password } = body;

      if (!userId || !fullName || !email) {
        return res.status(400).json({ success: false, error: 'User ID, Full Name, and Email are required' });
      }

      const tempPass = password || 'Dhar@2026';

      const inserted = await sql`
        INSERT INTO users (
          user_id, full_name, email, category, role, phone, 
          password_hash, must_change_password
        ) VALUES (
          ${userId.toLowerCase().trim()}, ${fullName.trim()}, ${email.toLowerCase().trim()},
          ${category || 'Site Operations'}, ${role || 'employee'}, ${phone || ''},
          crypt(${tempPass}, gen_salt('bf')), TRUE
        )
        RETURNING user_id as "userId", full_name as "fullName", email, role, category
      `;

      return res.status(201).json({ success: true, data: inserted[0] });
    }

    // 3. PUT - Update user
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { userId, fullName, email, category, role, phone, status } = body;

      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
      }

      const isActive = status !== 'inactive';

      const updated = await sql`
        UPDATE users SET
          full_name = COALESCE(${fullName}, full_name),
          email = COALESCE(${email}, email),
          category = COALESCE(${category}, category),
          role = COALESCE(${role}, role),
          phone = COALESCE(${phone}, phone),
          is_active = ${isActive},
          updated_at = NOW()
        WHERE user_id = ${userId.toLowerCase().trim()}
        RETURNING user_id as "userId", full_name as "fullName", email, role, category, is_active as "isActive"
      `;

      return res.status(200).json({ success: true, data: updated[0] });
    }

    // 4. DELETE - Delete user (permanently removes from Neon DB!)
    if (req.method === 'DELETE') {
      const userId = req.query.userId || (req.body && req.body.userId);
      if (!userId) {
        return res.status(400).json({ success: false, error: 'Missing userId parameter' });
      }

      if (userId.toLowerCase() === 'admin') {
        return res.status(403).json({ success: false, error: 'The primary Super Admin account cannot be deleted' });
      }

      await sql`DELETE FROM users WHERE user_id = ${userId.toLowerCase().trim()}`;
      return res.status(200).json({ success: true, message: `User ${userId} permanently deleted from Neon DB` });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
