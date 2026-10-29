/**
 * Dharshithan Waterproofing - Finance Tracker
 * Enterprise Authentication, RBAC & User Management Engine
 * Controlled under Super Admin, Developer, and Admin RBAC policies.
 */

const AUTH_STORAGE_KEY = 'dharshithan_active_session';
const USERS_STORAGE_KEY = 'dharshithan_users_db';
const AUDIT_STORAGE_KEY = 'dharshithan_user_audit';

class AuthManager {
  constructor() {
    this.users = this.loadUsers();
    this.session = this.loadSession();
    this.authListeners = [];
    this.activeOTP = null; // { userId, code, expiresAt, email }

    // If session exists, sync with role manager
    if (this.session && window.roleManager) {
      window.roleManager.setRole(this.session.role);
    }
  }

  loadUsers() {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure default admin matches user's exact credentials: admin / admin@2026
          const adminUser = parsed.find(u => u.userId === 'admin');
          if (!adminUser) {
            parsed.unshift(this.getDefaultAdmin());
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
          }
          return parsed;
        }
      } catch (e) {
        console.warn('Error reading users from storage:', e);
      }
    }

    // Default Seed Users
    const seeds = this.getInitialSeedUsers();
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(seeds));
    return seeds;
  }

  getDefaultAdmin() {
    return {
      userId: 'admin',
      password: 'admin@2026',
      fullName: 'Super Administrator',
      category: 'Executive Management',
      role: 'super_admin',
      email: 'admin@dharshithan.com',
      phone: '+91 98765 43210',
      emailVerified: true,
      mustChangePassword: false, // Default super admin can log in directly
      createdAt: '2026-01-01T00:00:00Z',
      lastLogin: null,
      status: 'active'
    };
  }

  getInitialSeedUsers() {
    return [
      this.getDefaultAdmin(),
      {
        userId: 'owner',
        password: 'owner@2026',
        fullName: 'Business Principal & Owner',
        category: 'Executive Management',
        role: 'owner',
        email: 'owner@dharshithan.com',
        phone: '+91 98765 43211',
        emailVerified: true,
        mustChangePassword: false,
        createdAt: '2026-01-01T00:00:00Z',
        lastLogin: null,
        status: 'active'
      },
      {
        userId: 'admin_finance',
        password: 'finance@2026',
        fullName: 'Ramesh Kumar (Accountant)',
        category: 'Accounts & Audit',
        role: 'admin',
        email: 'finance@dharshithan.com',
        phone: '+91 98765 43212',
        emailVerified: true,
        mustChangePassword: false,
        createdAt: '2026-01-01T00:00:00Z',
        lastLogin: null,
        status: 'active'
      },
      {
        userId: 'dev_lead',
        password: 'dev@2026',
        fullName: 'Aadhi (Lead Developer)',
        category: 'Technology & Integrations',
        role: 'developer',
        email: 'developer@dharshithan.com',
        phone: '+91 98765 43213',
        emailVerified: true,
        mustChangePassword: false,
        createdAt: '2026-01-01T00:00:00Z',
        lastLogin: null,
        status: 'active'
      },
      {
        userId: 'employee_david',
        password: 'david@2026',
        fullName: 'David (Site Supervisor)',
        category: 'Site Operations',
        role: 'employee',
        email: 'david@dharshithan.com',
        phone: '+91 98765 43214',
        emailVerified: true,
        mustChangePassword: true, // Demonstrates forced password change on first login!
        createdAt: '2026-01-01T00:00:00Z',
        lastLogin: null,
        status: 'active'
      },
      {
        userId: 'stakeholder',
        password: 'investor@2026',
        fullName: 'Board Investor / Stakeholder',
        category: 'Board & Investors',
        role: 'stakeholder',
        email: 'stakeholder@dharshithan.com',
        phone: '+91 98765 43215',
        emailVerified: true,
        mustChangePassword: false,
        createdAt: '2026-01-01T00:00:00Z',
        lastLogin: null,
        status: 'active'
      }
    ];
  }

  saveUsers() {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users));
  }

  loadSession() {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  saveSession(sessionData) {
    this.session = sessionData;
    if (sessionData) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    this.notifyAuthChange();
  }

  isAuthenticated() {
    return !!this.session && !!this.session.userId;
  }

  getCurrentUser() {
    if (!this.session) return null;
    return this.users.find(u => u.userId === this.session.userId) || this.session;
  }

  onAuthChange(fn) {
    this.authListeners.push(fn);
  }

  notifyAuthChange() {
    const user = this.getCurrentUser();
    this.authListeners.forEach(fn => fn(user));
  }

  /**
   * Login with User ID and Password
   */
  async login(userId, password) {
    const cleanId = (userId || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Please enter User ID and Password.' };
    }

    const user = this.users.find(u => u.userId.toLowerCase() === cleanId);
    if (!user) {
      return { success: false, error: 'User ID not found in system.' };
    }

    if (user.status === 'inactive') {
      return { success: false, error: 'Account has been deactivated. Please contact Super Admin.' };
    }

    if (user.password !== cleanPass) {
      return { success: false, error: 'Incorrect password. Try again or use Forgot Password.' };
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    this.saveUsers();

    // Check if user must change password on first login
    if (user.mustChangePassword) {
      return {
        success: true,
        mustChangePassword: true,
        user: { ...user, password: '[PROTECTED]' }
      };
    }

    // Establish authenticated session
    const sessionData = {
      userId: user.userId,
      fullName: user.fullName,
      role: user.role,
      category: user.category,
      email: user.email,
      phone: user.phone,
      loginAt: new Date().toISOString()
    };

    this.saveSession(sessionData);

    // Sync active role with RoleManager
    if (window.roleManager) {
      window.roleManager.setRole(user.role);
    }

    this.logAudit(user.userId, 'USER_LOGIN', { role: user.role, category: user.category });

    return {
      success: true,
      mustChangePassword: false,
      user: sessionData
    };
  }

  /**
   * Logout active session
   */
  logout() {
    const u = this.getCurrentUser();
    if (u) {
      this.logAudit(u.userId, 'USER_LOGOUT', {});
    }
    this.saveSession(null);
  }

  /**
   * First-Time or Manual Password Change
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = this.users.find(u => u.userId.toLowerCase() === (userId || '').toLowerCase());
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    if (user.password !== currentPassword.trim()) {
      return { success: false, error: 'Current/Temporary password does not match.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    if (newPassword === currentPassword) {
      return { success: false, error: 'New password must be different from the temporary password.' };
    }

    // Update password & clear mustChangePassword
    user.password = newPassword.trim();
    user.mustChangePassword = false;
    user.lastPasswordChange = new Date().toISOString();
    this.saveUsers();

    // Establish or refresh session
    const sessionData = {
      userId: user.userId,
      fullName: user.fullName,
      role: user.role,
      category: user.category,
      email: user.email,
      phone: user.phone,
      loginAt: new Date().toISOString()
    };
    this.saveSession(sessionData);

    if (window.roleManager) {
      window.roleManager.setRole(user.role);
    }

    this.logAudit(user.userId, 'PASSWORD_CHANGED', { initialPasswordUpdated: true });

    return { success: true, message: 'Password updated successfully! Welcome to Dharshithan Finance Tracker.' };
  }

  /**
   * Generate 6-digit OTP for Forgot Password
   */
  requestOTP(userIdOrEmail) {
    const query = (userIdOrEmail || '').trim().toLowerCase();
    if (!query) {
      return { success: false, error: 'Please enter your User ID or Mail ID.' };
    }

    const user = this.users.find(u => u.userId.toLowerCase() === query || u.email.toLowerCase() === query);
    if (!user) {
      return { success: false, error: 'No account found matching this User ID or Mail ID.' };
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.activeOTP = {
      userId: user.userId,
      email: user.email,
      code: code,
      expiresAt: expiresAt
    };

    user.resetOTP = code;
    user.resetOTPExpires = new Date(expiresAt).toISOString();
    this.saveUsers();

    this.logAudit(user.userId, 'OTP_REQUESTED', { email: user.email });

    return {
      success: true,
      userId: user.userId,
      email: user.email,
      code: code, // Surfaced for testing & immediate entry
      expiresInMinutes: 10
    };
  }

  /**
   * Verify OTP and reset password
   */
  verifyOTPAndReset(userId, otpCode, newPassword) {
    const user = this.users.find(u => u.userId.toLowerCase() === (userId || '').toLowerCase());
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    if (!user.resetOTP || user.resetOTP !== otpCode.trim()) {
      return { success: false, error: 'Invalid verification code. Please check your email and try again.' };
    }

    if (new Date(user.resetOTPExpires).getTime() < Date.now()) {
      return { success: false, error: 'Verification code has expired. Please request a new OTP.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    user.password = newPassword.trim();
    user.mustChangePassword = false;
    user.resetOTP = null;
    user.resetOTPExpires = null;
    user.lastPasswordChange = new Date().toISOString();
    this.saveUsers();

    this.logAudit(user.userId, 'PASSWORD_RESET_VIA_OTP', { email: user.email });

    return { success: true, message: 'Password reset successfully! You can now log in with your new password.' };
  }

  // =========================================================================
  // RBAC USER MANAGEMENT (Super Admin, Developer & Admin Control)
  // =========================================================================

  canManageUsers() {
    const user = this.getCurrentUser();
    if (!user) return false;
    return ['super_admin', 'developer', 'admin', 'owner'].includes(user.role);
  }

  getAllUsers() {
    return this.users.map(u => ({
      userId: u.userId,
      fullName: u.fullName,
      category: u.category || 'General Operations',
      role: u.role,
      email: u.email,
      phone: u.phone,
      mustChangePassword: !!u.mustChangePassword,
      status: u.status || 'active',
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
      // Passwords only viewable/retrievable by Super Admin and Developer for governance
      hasPassword: !!u.password,
      passwordPreview: (this.getCurrentUser()?.role === 'super_admin' || this.getCurrentUser()?.role === 'developer') ? u.password : '••••••••'
    }));
  }

  /**
   * Super Admin / Admin creates a new user
   */
  createUser(userData) {
    if (!this.canManageUsers()) {
      return { success: false, error: 'Unauthorized: Only Super Admin, Developer, and Admin can add users.' };
    }

    const userId = (userData.userId || '').trim().toLowerCase();
    const fullName = (userData.fullName || '').trim();
    const email = (userData.email || '').trim().toLowerCase();
    const phone = (userData.phone || '').trim();
    const category = (userData.category || 'Site Operations').trim();
    const role = (userData.role || 'employee').trim().toLowerCase();
    const tempPassword = (userData.password || '').trim() || this.generateSecureTempPassword();

    if (!userId || !fullName || !email) {
      return { success: false, error: 'User ID, Full Name, and Mail ID are required.' };
    }

    // Check duplicate User ID or Email
    if (this.users.some(u => u.userId.toLowerCase() === userId)) {
      return { success: false, error: `User ID "${userId}" is already taken.` };
    }

    if (this.users.some(u => u.email.toLowerCase() === email)) {
      return { success: false, error: `Mail ID "${email}" is already registered.` };
    }

    const newUser = {
      userId: userId,
      password: tempPassword,
      fullName: fullName,
      category: category,
      role: role,
      email: email,
      phone: phone,
      emailVerified: true,
      mustChangePassword: true, // Forces password change on their first login!
      createdAt: new Date().toISOString(),
      lastLogin: null,
      status: 'active'
    };

    this.users.push(newUser);
    this.saveUsers();

    this.logAudit(this.getCurrentUser()?.userId || 'admin', 'USER_CREATED', {
      createdUserId: userId,
      role: role,
      category: category,
      email: email
    });

    return {
      success: true,
      user: newUser,
      tempPassword: tempPassword,
      message: `User ${userId} created with temporary password. They must change password on first login.`
    };
  }

  /**
   * Super Admin, Developer or Admin issues password reset link / OTP
   */
  issuePasswordReset(targetUserId) {
    if (!this.canManageUsers()) {
      return { success: false, error: 'Unauthorized: Only Super Admin, Developer, and Admin can issue resets.' };
    }

    const user = this.users.find(u => u.userId.toLowerCase() === targetUserId.toLowerCase());
    if (!user) {
      return { success: false, error: 'Target user not found.' };
    }

    const otpResult = this.requestOTP(user.userId);
    this.logAudit(this.getCurrentUser()?.userId || 'admin', 'ADMIN_ISSUED_PASSWORD_RESET', {
      targetUserId: user.userId,
      targetEmail: user.email
    });

    return {
      success: true,
      userId: user.userId,
      email: user.email,
      otpCode: otpResult.code,
      resetLink: `${window.location.origin}${window.location.pathname}?action=reset&user=${encodeURIComponent(user.userId)}&otp=${otpResult.code}`,
      message: `Password reset instructions & OTP (${otpResult.code}) generated for ${user.email}.`
    };
  }

  /**
   * Direct admin reset of user password
   */
  adminResetPassword(targetUserId, newTempPassword) {
    if (!this.canManageUsers()) {
      return { success: false, error: 'Unauthorized.' };
    }

    const user = this.users.find(u => u.userId.toLowerCase() === targetUserId.toLowerCase());
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    const pass = (newTempPassword || '').trim() || this.generateSecureTempPassword();
    user.password = pass;
    user.mustChangePassword = true; // Force change on next login
    user.lastPasswordChange = new Date().toISOString();
    this.saveUsers();

    this.logAudit(this.getCurrentUser()?.userId || 'admin', 'ADMIN_DIRECT_PASSWORD_RESET', {
      targetUserId: user.userId
    });

    return {
      success: true,
      newTempPassword: pass,
      message: `Password for ${user.userId} has been reset to temporary password: ${pass}. They must change it upon login.`
    };
  }

  generateSecureTempPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = 'Dhar@';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }

  generatePostgresUserSQL() {
    const lines = [
      '-- ==========================================================',
      '-- Dharshithan Waterproofing - User Database Seed for PostgreSQL',
      `-- Exported on: ${new Date().toISOString()}`,
      '-- ==========================================================',
      ''
    ];

    this.users.forEach(u => {
      const escape = s => (s || '').replace(/'/g, "''");
      lines.push(
        `INSERT INTO users (user_id, full_name, email, role, category, phone, must_change_password, password_hash, is_active) ` +
        `VALUES ('${escape(u.userId)}', '${escape(u.fullName)}', '${escape(u.email)}', '${u.role}', '${escape(u.category)}', '${escape(u.phone)}', ${u.mustChangePassword}, crypt('${escape(u.password)}', gen_salt('bf')), TRUE) ` +
        `ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, category = EXCLUDED.category, must_change_password = EXCLUDED.must_change_password;`
      );
    });

    return lines.join('\n');
  }

  logAudit(userId, action, details) {
    try {
      const logs = JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) || '[]');
      logs.unshift({
        id: 'audit-' + Date.now(),
        userId,
        action,
        details,
        timestamp: new Date().toISOString()
      });
      if (logs.length > 500) logs.pop();
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.warn('Audit log write error:', e);
    }
  }

  getAuditLogs() {
    try {
      return JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }
}

window.authManager = new AuthManager();
