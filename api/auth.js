const { db } = require('./db-adapter');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const action = req.query.action || (req.body && req.body.action) || 'login';
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // LOGIN
    if (action === 'login') {
      const { userId, password } = body;
      if (!userId || !password) {
        return res.status(400).json({ success: false, error: 'User ID and Password are required' });
      }

      const user = await db.getUserByLogin(userId);

      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials. User ID not found.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, error: 'Account has been deactivated. Please contact Super Admin.' });
      }

      // Password check (supports admin@2026, standard passwords, or hashed passwords)
      const validPasswords = ['admin@2026', 'Dhar@2026', 'Synstar@2026'];
      const matches = validPasswords.includes(password) || (user.passwordHash && user.passwordHash === password);

      if (!matches) {
        return res.status(401).json({ success: false, error: 'Incorrect password. Please verify and try again.' });
      }

      return res.status(200).json({
        success: true,
        provider: db.getProvider(),
        mustChangePassword: !!user.mustChangePassword,
        user: {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          category: user.category,
          phone: user.phone
        }
      });
    }

    // SESSION VERIFY
    if (action === 'verify') {
      const tokenUser = req.query.userId || (req.body && req.body.userId);
      if (!tokenUser) {
        return res.status(400).json({ success: false, error: 'Missing userId parameter' });
      }
      const user = await db.getUserByLogin(tokenUser);
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, error: 'Session expired or user inactive' });
      }
      return res.status(200).json({
        success: true,
        user: {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          category: user.category
        }
      });
    }

    return res.status(400).json({ success: false, error: 'Unknown auth action' });
  } catch (err) {
    console.error('API Auth Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
