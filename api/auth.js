const { neon } = require('@neondatabase/serverless');

const DEFAULT_DATABASE_URL = "postgresql://neondb_owner:npg_Lt1UVxrTkp2q@ep-late-art-b5308bnc-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

function getDb() {
  const url = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
  return neon(url);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const sql = getDb();
    const action = req.query.action || (req.body && req.body.action) || 'login';
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // LOGIN
    if (action === 'login') {
      const { userId, password } = body;
      if (!userId || !password) {
        return res.status(400).json({ success: false, error: 'User ID and Password are required' });
      }

      const cleanId = userId.toLowerCase().trim();

      const userRows = await sql`
        SELECT 
          id, user_id as "userId", full_name as "fullName", email,
          category, role, phone, must_change_password as "mustChangePassword",
          is_active as "isActive",
          (password_hash = crypt(${password}, password_hash)) as "passwordMatches"
        FROM users 
        WHERE LOWER(user_id) = ${cleanId} OR LOWER(email) = ${cleanId}
        LIMIT 1
      `;

      if (!userRows || userRows.length === 0) {
        return res.status(401).json({ success: false, error: 'Invalid credentials. User ID not found.' });
      }

      const user = userRows[0];
      if (!user.isActive) {
        return res.status(403).json({ success: false, error: 'Account has been deactivated. Please contact Super Admin.' });
      }

      if (!user.passwordMatches) {
        return res.status(401).json({ success: false, error: 'Incorrect password. Please verify and try again.' });
      }

      if (user.mustChangePassword) {
        return res.status(200).json({
          success: true,
          mustChangePassword: true,
          user: {
            userId: user.userId,
            fullName: user.fullName,
            role: user.role,
            category: user.category,
            email: user.email
          }
        });
      }

      return res.status(200).json({
        success: true,
        mustChangePassword: false,
        user: {
          userId: user.userId,
          fullName: user.fullName,
          role: user.role,
          category: user.category,
          email: user.email
        }
      });
    }

    // FIRST TIME PASSWORD CHANGE
    if (action === 'change-password') {
      const { userId, newPassword } = body;
      if (!userId || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
      }

      await sql`
        UPDATE users SET 
          password_hash = crypt(${newPassword}, gen_salt('bf')),
          must_change_password = FALSE,
          last_password_change = NOW(),
          updated_at = NOW()
        WHERE LOWER(user_id) = ${userId.toLowerCase().trim()}
      `;

      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    }

    // REQUEST PASSWORD RESET OTP
    if (action === 'request-otp') {
      const { emailOrUserId } = body;
      const cleanTarget = (emailOrUserId || '').toLowerCase().trim();

      const userRows = await sql`
        SELECT user_id as "userId", email FROM users 
        WHERE LOWER(user_id) = ${cleanTarget} OR LOWER(email) = ${cleanTarget}
        LIMIT 1
      `;

      if (!userRows.length) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const user = userRows[0];
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await sql`
        UPDATE users SET
          reset_otp = ${otp},
          reset_otp_expires = NOW() + INTERVAL '15 minutes'
        WHERE user_id = ${user.userId}
      `;

      return res.status(200).json({
        success: true,
        message: `OTP generated for verification: ${otp} (Valid for 15 mins)`,
        maskedEmail: user.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length))
      });
    }

    // VERIFY OTP AND RESET PASSWORD
    if (action === 'verify-otp-reset') {
      const { emailOrUserId, otp, newPassword } = body;
      const cleanTarget = (emailOrUserId || '').toLowerCase().trim();

      const userRows = await sql`
        SELECT user_id as "userId", reset_otp, reset_otp_expires 
        FROM users 
        WHERE (LOWER(user_id) = ${cleanTarget} OR LOWER(email) = ${cleanTarget})
          AND reset_otp = ${otp.trim()}
          AND reset_otp_expires > NOW()
        LIMIT 1
      `;

      if (!userRows.length) {
        return res.status(400).json({ success: false, error: 'Invalid or expired OTP code' });
      }

      const user = userRows[0];
      await sql`
        UPDATE users SET
          password_hash = crypt(${newPassword}, gen_salt('bf')),
          reset_otp = NULL,
          reset_otp_expires = NULL,
          must_change_password = FALSE,
          last_password_change = NOW()
        WHERE user_id = ${user.userId}
      `;

      return res.status(200).json({ success: true, message: 'Password reset completed. You may now sign in.' });
    }

    return res.status(400).json({ success: false, error: 'Invalid action requested' });
  } catch (err) {
    console.error('Auth API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
