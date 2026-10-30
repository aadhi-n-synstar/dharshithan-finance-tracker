/**
 * Dharshithan Waterproofing - Finance Tracker
 * Multi-Role User Management & Role-Based Access Control (RBAC)
 */

const ROLES = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Admin',
    title: 'System & Database Administrator',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    avatarBg: 'bg-purple-600',
    permissions: {
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canViewDashboard: true,
      canViewReports: true,
      canManageDatabase: true,
      canAdjustFloat: true,
      canManageUsers: true,
      canExportData: true
    }
  },
  OWNER: {
    id: 'owner',
    name: 'Company Owner',
    title: 'Business Principal & Executive',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    avatarBg: 'bg-emerald-600',
    permissions: {
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canViewDashboard: true,
      canViewReports: true,
      canManageDatabase: true,
      canAdjustFloat: true,
      canManageUsers: true,
      canExportData: true
    }
  },
  ADMIN: {
    id: 'admin',
    name: 'Finance Admin',
    title: 'Financial Controller & Accountant',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-300',
    avatarBg: 'bg-sky-600',
    permissions: {
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canViewDashboard: true,
      canViewReports: true,
      canManageDatabase: false,
      canAdjustFloat: true,
      canManageUsers: true, // Super Admin, Developer, and Admin have User Management control
      canExportData: true
    }
  },
  DEVELOPER: {
    id: 'developer',
    name: 'Lead Developer',
    title: 'Integrations & API Engineer',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    avatarBg: 'bg-indigo-600',
    permissions: {
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canViewDashboard: true,
      canViewReports: true,
      canManageDatabase: true,
      canAdjustFloat: false,
      canManageUsers: true, // Super Admin, Developer, and Admin have User Management control
      canExportData: true
    }
  },
  EMPLOYEE: {
    id: 'employee',
    name: 'Site Employee',
    title: 'Field Technician & Site Worker',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    avatarBg: 'bg-amber-600',
    permissions: {
      canAdd: true,
      canEdit: false,
      canDelete: false,
      canViewDashboard: true,
      canViewReports: false,
      canManageDatabase: false,
      canAdjustFloat: false,
      canManageUsers: false,
      canExportData: false
    }
  },
  STAKEHOLDER: {
    id: 'stakeholder',
    name: 'Stakeholder / Investor',
    title: 'Executive Board Member',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    avatarBg: 'bg-slate-700',
    permissions: {
      canAdd: false,
      canEdit: false,
      canDelete: false,
      canViewDashboard: true,
      canViewReports: true,
      canManageDatabase: false,
      canAdjustFloat: false,
      canManageUsers: false,
      canExportData: true
    }
  }
};

class RoleManager {
  constructor() {
    this.storageKey = 'dharshithan_active_role';
    const saved = localStorage.getItem(this.storageKey);
    this.activeRole = ROLES[saved] || ROLES.SUPER_ADMIN;
    this.listeners = [];
  }

  getRole() {
    return this.activeRole;
  }

  setRole(roleKey) {
    const target = ROLES[roleKey] || Object.values(ROLES).find(r => r.id === roleKey);
    if (!target) return;

    this.activeRole = target;
    localStorage.setItem(this.storageKey, target.id.toUpperCase());
    this.notify();
  }

  can(action) {
    return !!this.activeRole.permissions[action];
  }

  onChange(fn) {
    this.listeners.push(fn);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.activeRole));
  }

  getRightsMatrix(roleKey) {
    const role = ROLES[roleKey] || Object.values(ROLES).find(r => r.id === roleKey) || this.activeRole;
    return [
      {
        action: 'canAdd',
        title: 'Record & Add Financial Transactions',
        desc: 'Post new client revenue, receipts, vendor bills, and operational expenses to Neon DB.',
        granted: !!role.permissions.canAdd
      },
      {
        action: 'canEdit',
        title: 'Edit & Alter Existing Ledger Entries',
        desc: 'Modify parties, amounts, dates, payment modes, and invoice references.',
        granted: !!role.permissions.canEdit
      },
      {
        action: 'canDelete',
        title: 'Permanent Database Deletion',
        desc: 'Permanently remove transactions from Neon PostgreSQL Database.',
        granted: !!role.permissions.canDelete
      },
      {
        action: 'canViewReports',
        title: 'Executive P&L and Fiscal Analytics',
        desc: 'Access Profit & Loss statements, quarterly breakdowns, and tax summaries.',
        granted: !!role.permissions.canViewReports
      },
      {
        action: 'canManageUsers',
        title: 'User Management & Access Governance',
        desc: 'Provision new staff IDs, update roles, and manage credentials.',
        granted: !!role.permissions.canManageUsers
      },
      {
        action: 'canManageDatabase',
        title: 'Cloud Database Console & Backups',
        desc: 'Super Admin direct access to Neon PostgreSQL telemetry and .SQL backup exports.',
        granted: !!role.permissions.canManageDatabase
      },
      {
        action: 'canAdjustFloat',
        title: 'Liquidity & Cash Float Adjustments',
        desc: 'Reconcile opening bank balances and petty cash floating reserves.',
        granted: !!role.permissions.canAdjustFloat
      },
      {
        action: 'canExportData',
        title: 'Data Export & Download (CSV / TSV)',
        desc: 'Export financial ledger data to CSV and copy formatted TSV to clipboard.',
        granted: !!role.permissions.canExportData
      }
    ];
  }

  getAllRoles() {
    return Object.values(ROLES);
  }
}

window.roleManager = new RoleManager();
