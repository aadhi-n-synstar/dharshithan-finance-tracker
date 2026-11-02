const { db } = require('./db-adapter');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 1. GET - Fetch all users
    if (req.method === 'GET') {
      const rows = await db.getUsers();
      return res.status(200).json({
        success: true,
        provider: db.getProvider(),
        count: rows.length,
        data: rows
      });
    }

    // 2. POST - Add new user
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { userId, fullName, email, category, role, phone, password } = body;

      if (!userId || !fullName || !email) {
        return res.status(400).json({ success: false, error: 'User ID, Full Name, and Email are required' });
      }

      const created = await db.createUser({
        userId,
        fullName,
        email,
        category,
        role,
        phone,
        password
      });

      return res.status(201).json({
        success: true,
        provider: db.getProvider(),
        data: created
      });
    }

    // 3. PUT - Update / Alter User Details & Role
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { userId, fullName, email, category, role, phone, password, isActive, status } = body;

      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required to update details' });
      }

      const updated = await db.updateUser(userId, {
        fullName,
        email,
        category,
        role,
        phone,
        password,
        isActive,
        status
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: `User "${userId}" not found` });
      }

      return res.status(200).json({
        success: true,
        provider: db.getProvider(),
        message: `User "${userId}" details updated successfully`,
        data: updated
      });
    }

    // 4. DELETE - Delete User Account
    if (req.method === 'DELETE') {
      let userId = req.query ? req.query.userId : null;
      if (!userId && req.body) {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        userId = body.userId;
      }

      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required to delete account' });
      }

      if (userId.toLowerCase().trim() === 'admin') {
        return res.status(403).json({ success: false, error: 'The primary Super Administrator account ("admin") cannot be deleted' });
      }

      await db.deleteUser(userId);
      return res.status(200).json({
        success: true,
        provider: db.getProvider(),
        message: `User "${userId}" deleted successfully`
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Users Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
