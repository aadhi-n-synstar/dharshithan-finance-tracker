/**
 * Dharshithan Waterproofing - Finance Tracker
 * Main Controller: Executive Dashboard, Multi-Role RBAC & Neon Serverless PostgreSQL
 */

class FinanceApp {
  constructor() {
    this.activeTab = 'dashboard';
    this.transactions = [];
    this.filteredTransactions = [];
    this.editingId = null;

    this.filters = {
      financialYear: 'F.Y. 2026-27',
      quarter: 'ALL',
      type: 'ALL',
      mode: 'ALL',
      search: ''
    };
  }

  async init() {
    await window.financeDB.init();

    // Initialize Auth state
    this.checkAuthUI();
    if (window.authManager) {
      window.authManager.onAuthChange(() => {
        this.checkAuthUI();
        this.applyRolePermissions();
        this.renderCurrentView();
      });
    }

    // Subscribe to DB changes
    window.financeDB.onChange(() => {
      this.refreshData();
    });

    // Subscribe to Role changes
    if (window.roleManager) {
      window.roleManager.onChange(() => {
        this.checkAuthUI();
        this.applyRolePermissions();
        this.renderCurrentView();
      });
    }

    // Populate initial FY dropdown dynamically
    await this.refreshData();

    // Refresh when user returns to window/tab
    window.addEventListener('focus', () => {
      this.refreshFromNeon({ silent: true });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.refreshFromNeon({ silent: true });
      }
    });

    // Set today's date in transaction modal
    const today = new Date().toISOString().slice(0, 10);
    const dateInput = document.getElementById('modalDate');
    if (dateInput) dateInput.value = today;

    // Apply role-based visibility
    this.applyRolePermissions();

    // Check URL parameters (e.g. for PWA shortcuts)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'add') {
      setTimeout(() => this.openTransactionModal(), 300);
    } else if (urlParams.get('tab')) {
      this.setActiveTab(urlParams.get('tab'));
    }

    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      } else if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.openTransactionModal();
      }
    });

    

    // Enterprise 30-minute inactivity security lock
    this.setupInactivityTimer();

    console.log('Dharshithan Finance Tracker Initialized');
  }

  setupInactivityTimer() {
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (window.authManager && window.authManager.isAuthenticated()) {
          window.authManager.logout();
          this.checkAuthUI();
          this.showToast('Session locked after 30 minutes of inactivity for company data protection.', 'info');
        }
      }, 30 * 60 * 1000); // 30 minutes
    };

    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, reset, { passive: true });
    });
    reset();
  }

  

  async refreshData() {
    this.transactions = await window.financeDB.getAll();
    this.updateFYDropdown();
    this.updatePartyDatalist();
    this.applyFilters();
  }

  updateFYDropdown() {
    const fySet = new Set(['F.Y. 2026-27', 'F.Y. 2025-26']);
    this.transactions.forEach(t => {
      if (t.financialYear) fySet.add(t.financialYear);
    });

    const select = document.getElementById('filterFY');
    if (!select) return;

    const currentVal = select.value || this.filters.financialYear;
    select.innerHTML = '<option value="ALL">All FY</option>';
    Array.from(fySet).sort().reverse().forEach(fy => {
      const opt = document.createElement('option');
      opt.value = fy;
      opt.textContent = fy;
      if (fy === currentVal) opt.selected = true;
      select.appendChild(opt);
    });
  }

  updatePartyDatalist() {
    const datalist = document.getElementById('partySuggestions');
    if (!datalist) return;
    const parties = new Set();
    this.transactions.forEach(t => {
      if (t.partyName) parties.add(t.partyName.trim());
    });
    datalist.innerHTML = '';
    parties.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      datalist.appendChild(opt);
    });
  }

  // RBAC PERMISSION ENFORCEMENT
  applyRolePermissions() {
    if (!window.roleManager) return;
    const role = window.roleManager.getRole();

    // Update Top Role Pill
    const pillText = document.getElementById('rolePillText');
    const pillDot = document.getElementById('roleAvatarDot');
    const pillBtn = document.getElementById('rolePillBtn');

    if (pillText) pillText.textContent = role.name;
    if (pillBtn) {
      pillBtn.className = `flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition shadow-2xs ${role.badgeClass}`;
    }
    if (pillDot) {
      pillDot.className = `w-2 h-2 rounded-full ${role.avatarBg}`;
    }

    // Add buttons visibility
    const canAdd = window.roleManager.can('canAdd');
    const headerBtn = document.getElementById('headerAddTxnBtn');
    const fabBtn = document.getElementById('androidFabBtn');
    const ledgerBtn = document.getElementById('ledgerNewEntryBtn');

    if (headerBtn) headerBtn.style.display = canAdd ? 'flex' : 'none';
    if (fabBtn) fabBtn.style.display = canAdd ? 'flex' : 'none';
    if (ledgerBtn) ledgerBtn.style.display = canAdd ? 'flex' : 'none';

    // Summary description in role modal
    const summary = document.getElementById('rolePermissionsSummary');
    if (summary) {
      summary.textContent = `Active Role: ${role.name} (${role.title}). Permissions: ` +
        [
          role.permissions.canAdd ? 'Add Transactions' : null,
          role.permissions.canEdit ? 'Edit Records' : null,
          role.permissions.canDelete ? 'Delete Records' : null,
          role.permissions.canManageDatabase ? 'Cloud Database Migration' : null,
          role.permissions.canAdjustFloat ? 'Adjust Float' : null,
          role.permissions.canViewReports ? 'View P&L' : 'Basic View Only'
        ].filter(Boolean).join(', ');
    }
  }

  setActiveTab(tabName) {
    if (tabName === 'reports' && window.roleManager && !window.roleManager.can('canViewReports')) {
      this.showToast('Access restricted: P&L reports are restricted for your role.', 'error');
      return;
    }

    this.activeTab = tabName;
    const allTabs = ['dashboard', 'transactions', 'sales', 'expenses', 'banking', 'parties', 'reports'];

    allTabs.forEach(tab => {
      const desktopBtn = document.getElementById(`tab-${tab}`);
      const tabletBtn = document.getElementById(`subtab-${tab}`);
      const mobileNav = document.getElementById(`nav-${tab}`);
      const view = document.getElementById(`view-${tab}`);

      const isActive = tab === tabName;

      // Desktop top nav
      if (desktopBtn) {
        if (isActive) {
          desktopBtn.className = 'px-3 py-1.5 rounded-lg transition-all text-white bg-sky-600 font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer';
        } else {
          desktopBtn.className = 'px-3 py-1.5 rounded-lg transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 flex items-center space-x-1.5 cursor-pointer';
        }
      }

      // Tablet secondary nav
      if (tabletBtn) {
        if (isActive) {
          tabletBtn.className = 'px-2.5 py-1 rounded-lg text-white bg-sky-600 font-bold whitespace-nowrap cursor-pointer';
        } else {
          tabletBtn.className = 'px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 whitespace-nowrap cursor-pointer';
        }
      }

      // Mobile bottom nav
      if (mobileNav) {
        if (isActive) {
          mobileNav.classList.add('active');
        } else {
          mobileNav.classList.remove('active');
        }
      }

      // View container
      if (view) {
        if (isActive) {
          view.classList.remove('hidden');
        } else {
          view.classList.add('hidden');
        }
      }
    });

    this.renderCurrentView();

    if (window.lucide) {
      window.lucide.createIcons();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleFilterChange() {
    const fySelect = document.getElementById('filterFY');
    const qSelect = document.getElementById('filterQuarter');
    const typeSelect = document.getElementById('txnTypeFilter');
    const modeSelect = document.getElementById('txnModeFilter');
    const searchInput = document.getElementById('txnSearch');

    this.filters.financialYear = fySelect ? fySelect.value : 'ALL';
    this.filters.quarter = qSelect ? qSelect.value : 'ALL';
    this.filters.type = typeSelect ? typeSelect.value : 'ALL';
    this.filters.mode = modeSelect ? modeSelect.value : 'ALL';
    this.filters.search = searchInput ? searchInput.value : '';

    this.applyFilters();
  }

  applyFilters() {
    this.filteredTransactions = FinanceAnalytics.filterTransactions(this.transactions, this.filters);
    this.renderCurrentView();
  }

  renderCurrentView() {
    if (this.activeTab === 'dashboard') {
      this.renderDashboard();
    } else if (this.activeTab === 'transactions') {
      this.renderTransactionsTable();
    } else if (this.activeTab === 'sales') {
      this.renderSalesView();
    } else if (this.activeTab === 'expenses') {
      this.renderExpensesView();
    } else if (this.activeTab === 'banking') {
      this.renderBankingView();
    } else if (this.activeTab === 'parties') {
      this.renderParties();
    } else if (this.activeTab === 'reports') {
      this.renderReports();
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /**
   * Complete render mirroring financial analytics from Neon PostgreSQL:
   * 1. 5 Top KPI Cards
   * 2. Financial Summary Panel
   * 3. Income by Mode Panel
   * 4. Expenses by Mode Panel
   * 5. Bank Account Position Panel
   * 6. Cash Position & Float Panel
   */
  
  // =========================================================================
  // CORPORATE VIEWS: SALES (RECEIVABLES), EXPENSES (PAYABLES) & BANKING
  // =========================================================================

  renderSalesView() {
    const rawSales = (this.filteredTransactions || []).filter(t => 
      t.type && (t.type.toLowerCase().includes('received') || t.type.toLowerCase().includes('income'))
    );
    this.salesList = rawSales;

    const totalRevenue = rawSales.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const count = rawSales.length;
    const highest = rawSales.reduce((max, t) => Math.max(max, Number(t.amount) || 0), 0);
    const uniqueClients = new Set(rawSales.map(t => (t.partyName || '').trim().toLowerCase())).size;

    const elRev = document.getElementById('salesTotalRevenue');
    if (elRev) elRev.textContent = FinanceAnalytics.formatINR(totalRevenue);

    const elCnt = document.getElementById('salesTotalReceiptsCount');
    if (elCnt) elCnt.textContent = count;

    const elHigh = document.getElementById('salesHighestReceipt');
    if (elHigh) elHigh.textContent = FinanceAnalytics.formatINR(highest);

    const elClients = document.getElementById('salesActiveClientsCount');
    if (elClients) elClients.textContent = uniqueClients;

    this.filterSalesTable();
  }

  filterSalesTable() {
    const search = (document.getElementById('salesSearchInput')?.value || '').toLowerCase().trim();
    const mode = document.getElementById('salesModeFilter')?.value || 'ALL';

    const list = (this.salesList || []).filter(t => {
      const matchSearch = !search || 
        (t.partyName && t.partyName.toLowerCase().includes(search)) ||
        (t.refNumber && t.refNumber.toLowerCase().includes(search)) ||
        (t.description && t.description.toLowerCase().includes(search));
      const matchMode = mode === 'ALL' || (t.mode && t.mode.toUpperCase() === mode.toUpperCase());
      return matchSearch && matchMode;
    });

    const tbody = document.getElementById('salesTableBody');
    const emptyState = document.getElementById('salesEmptyState');

    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    const canEdit = window.roleManager ? window.roleManager.can('canEdit') : false;
    const canDelete = window.roleManager ? window.roleManager.can('canDelete') : false;

    tbody.innerHTML = list.map((t, idx) => `
      <tr class="hover:bg-slate-50/80 transition-colors">
        <td class="py-3 px-3.5 font-mono text-slate-500 font-semibold text-xs">#${t.slNo || (idx + 1)}</td>
        <td class="py-3 px-3.5 font-mono text-slate-700 whitespace-nowrap">${FinanceAnalytics.formatDateDisplay(t.date)}</td>
        <td class="py-3 px-3.5 font-bold text-slate-900">
          <div>${t.partyName}</div>
          ${t.description ? `<div class="text-[10px] font-normal text-slate-400 truncate max-w-xs">${t.description}</div>` : ''}
        </td>
        <td class="py-3 px-3.5">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            ${t.category || 'General Invoicing'}
          </span>
        </td>
        <td class="py-3 px-3.5 font-semibold text-slate-700 text-[11px]">${t.mode || 'CASH'}</td>
        <td class="py-3 px-3.5 font-mono text-slate-500 text-[11px]">${t.refNumber || '-'}</td>
        <td class="py-3 px-3.5 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
          +${FinanceAnalytics.formatINR(t.amount)}
        </td>
        <td class="py-3 px-3.5 text-center whitespace-nowrap">
          <div class="inline-flex items-center space-x-1">
            <button onclick="app.showTransactionDetail('${t.id}')" class="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer" title="View Full Receipt">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            ${canEdit ? `
              <button onclick="app.openTransactionModal('${t.id}')" class="p-1 rounded-lg hover:bg-sky-50 text-sky-600 hover:text-sky-700 transition cursor-pointer" title="Edit Receipt">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
            ${canDelete ? `
              <button onclick="app.deleteTransaction('${t.id}')" class="p-1 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition cursor-pointer" title="Permanently Delete">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  renderExpensesView() {
    const rawExpenses = (this.filteredTransactions || []).filter(t => 
      t.type && (t.type.toLowerCase().includes('paid') || t.type.toLowerCase().includes('expense'))
    );
    this.expensesList = rawExpenses;

    const totalExpenses = rawExpenses.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const count = rawExpenses.length;
    const avg = count > 0 ? (totalExpenses / count) : 0;

    // Find top category
    const catMap = {};
    rawExpenses.forEach(t => {
      const c = t.category || 'General';
      catMap[c] = (catMap[c] || 0) + (Number(t.amount) || 0);
    });
    let topCat = 'None';
    let topCatVal = 0;
    Object.entries(catMap).forEach(([k, v]) => {
      if (v > topCatVal) {
        topCatVal = v;
        topCat = k;
      }
    });

    const elTotal = document.getElementById('expenseTotalAmount');
    if (elTotal) elTotal.textContent = FinanceAnalytics.formatINR(totalExpenses);

    const elCnt = document.getElementById('expenseTotalVouchersCount');
    if (elCnt) elCnt.textContent = count;

    const elTop = document.getElementById('expenseTopCategory');
    if (elTop) elTop.textContent = topCat;

    const elAvg = document.getElementById('expenseAverageSize');
    if (elAvg) elAvg.textContent = FinanceAnalytics.formatINR(avg);

    this.filterExpensesTable();
  }

  filterExpensesTable() {
    const search = (document.getElementById('expenseSearchInput')?.value || '').toLowerCase().trim();
    const cat = document.getElementById('expenseCategoryFilter')?.value || 'ALL';

    const list = (this.expensesList || []).filter(t => {
      const matchSearch = !search || 
        (t.partyName && t.partyName.toLowerCase().includes(search)) ||
        (t.refNumber && t.refNumber.toLowerCase().includes(search)) ||
        (t.category && t.category.toLowerCase().includes(search)) ||
        (t.description && t.description.toLowerCase().includes(search));
      const matchCat = cat === 'ALL' || (t.category && t.category.toLowerCase() === cat.toLowerCase());
      return matchSearch && matchCat;
    });

    const tbody = document.getElementById('expenseTableBody');
    const emptyState = document.getElementById('expenseEmptyState');

    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    const canEdit = window.roleManager ? window.roleManager.can('canEdit') : false;
    const canDelete = window.roleManager ? window.roleManager.can('canDelete') : false;

    tbody.innerHTML = list.map((t, idx) => `
      <tr class="hover:bg-slate-50/80 transition-colors">
        <td class="py-3 px-3.5 font-mono text-slate-500 font-semibold text-xs">#${t.slNo || (idx + 1)}</td>
        <td class="py-3 px-3.5 font-mono text-slate-700 whitespace-nowrap">${FinanceAnalytics.formatDateDisplay(t.date)}</td>
        <td class="py-3 px-3.5 font-bold text-slate-900">
          <div>${t.partyName}</div>
          ${t.description ? `<div class="text-[10px] font-normal text-slate-400 truncate max-w-xs">${t.description}</div>` : ''}
        </td>
        <td class="py-3 px-3.5">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            ${t.category || 'Site Overhead'}
          </span>
        </td>
        <td class="py-3 px-3.5 font-semibold text-slate-700 text-[11px]">${t.mode || 'CASH'}</td>
        <td class="py-3 px-3.5 font-mono text-slate-500 text-[11px]">${t.refNumber || '-'}</td>
        <td class="py-3 px-3.5 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
          -${FinanceAnalytics.formatINR(t.amount)}
        </td>
        <td class="py-3 px-3.5 text-center whitespace-nowrap">
          <div class="inline-flex items-center space-x-1">
            <button onclick="app.showTransactionDetail('${t.id}')" class="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer" title="View Full Voucher">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            ${canEdit ? `
              <button onclick="app.openTransactionModal('${t.id}')" class="p-1 rounded-lg hover:bg-sky-50 text-sky-600 hover:text-sky-700 transition cursor-pointer" title="Edit Voucher">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
            ${canDelete ? `
              <button onclick="app.deleteTransaction('${t.id}')" class="p-1 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition cursor-pointer" title="Permanently Delete">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  renderBankingView() {
    const metrics = FinanceAnalytics.calculateDashboardMetrics(this.filteredTransactions);

    const elBank = document.getElementById('bankFloatAmount');
    if (elBank) elBank.textContent = FinanceAnalytics.formatINR(metrics.bankPosition);

    const elCash = document.getElementById('cashFloatAmount');
    if (elCash) elCash.textContent = FinanceAnalytics.formatINR(metrics.cashBalance);

    const elTotal = document.getElementById('totalLiquidityAmount');
    if (elTotal) elTotal.textContent = FinanceAnalytics.formatINR(metrics.totalLiquidity);

    const channels = [
      { name: 'Netbanking (NEFT / RTGS)', key: 'NETBANKING', icon: 'landmark', color: 'sky' },
      { name: 'Unified Payments (UPI)', key: 'UPI', icon: 'smartphone', color: 'indigo' },
      { name: 'Petty Cash in Hand', key: 'CASH', icon: 'banknote', color: 'emerald' },
      { name: 'Cheque / Draft Clearing', key: 'CHEQUE', icon: 'file-check', color: 'purple' },
      { name: 'Card Settlements', key: 'DEBIT CARD / CREDIT CARD', icon: 'credit-card', color: 'slate' }
    ];

    const grid = document.getElementById('bankingChannelGrid');
    if (grid) {
      grid.innerHTML = channels.map(ch => {
        const inAmt = metrics.incomeByMode[ch.key] || 0;
        const outAmt = metrics.expenseByMode[ch.key] || 0;
        const netAmt = inAmt - outAmt;

        return `
          <div class="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white transition shadow-xs space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-800 truncate">${ch.name}</span>
              <div class="w-6 h-6 rounded-lg bg-${ch.color}-100 text-${ch.color}-700 flex items-center justify-center">
                <i data-lucide="${ch.icon}" class="w-3.5 h-3.5"></i>
              </div>
            </div>
            <div class="space-y-0.5 pt-1 text-[11px] font-mono">
              <div class="flex justify-between text-slate-500">
                <span>Inflows:</span>
                <span class="text-emerald-700 font-bold">${FinanceAnalytics.formatINR(inAmt)}</span>
              </div>
              <div class="flex justify-between text-slate-500">
                <span>Outflows:</span>
                <span class="text-rose-700 font-bold">${FinanceAnalytics.formatINR(outAmt)}</span>
              </div>
              <div class="flex justify-between border-t border-slate-200 pt-1 font-bold">
                <span class="text-slate-700">Net Flow:</span>
                <span class="${netAmt >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${FinanceAnalytics.formatINR(netAmt)}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  renderDashboard() {
    const metrics = FinanceAnalytics.calculateDashboardMetrics(this.filteredTransactions);

    // 1. Top 5 KPI Cards
    const elRev = document.getElementById('kpi-total-revenue');
    if (elRev) elRev.textContent = FinanceAnalytics.formatINR(metrics.grossRevenue);
    const elIncCnt = document.getElementById('kpi-income-txns');
    const incCnt = this.filteredTransactions.filter(t => t.type.includes('Received') || t.type.includes('Income')).length;
    if (elIncCnt) elIncCnt.textContent = `${incCnt} txns`;

    const elExp = document.getElementById('kpi-total-expenses');
    if (elExp) elExp.textContent = FinanceAnalytics.formatINR(metrics.operatingCosts);
    const elExpCnt = document.getElementById('kpi-expense-txns');
    const expCnt = this.filteredTransactions.filter(t => t.type.includes('Paid') || t.type.includes('Expense')).length;
    if (elExpCnt) elExpCnt.textContent = `${expCnt} txns`;

    const elNet = document.getElementById('kpi-net-profit');
    if (elNet) elNet.textContent = FinanceAnalytics.formatINR(metrics.netProfit);

    const elMargin = document.getElementById('kpi-profit-margin');
    if (elMargin) elMargin.textContent = `${metrics.profitMargin.toFixed(1)}%`;
    const elMarginBadge = document.getElementById('kpi-margin-health-badge');
    if (elMarginBadge) {
      if (metrics.isProfitHealthy) {
        elMarginBadge.className = 'px-1.5 py-0.5 rounded font-semibold text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200';
        elMarginBadge.textContent = 'Healthy (>20%)';
      } else {
        elMarginBadge.className = 'px-1.5 py-0.5 rounded font-semibold text-[9px] bg-amber-50 text-amber-700 border border-amber-200';
        elMarginBadge.textContent = 'Under Target (<20%)';
      }
    }

    const elLiq = document.getElementById('kpi-total-liquidity');
    if (elLiq) elLiq.textContent = FinanceAnalytics.formatINR(metrics.totalLiquidity);

    // 2. Financial Summary Panel
    const fsRev = document.getElementById('fs-gross-revenue');
    if (fsRev) fsRev.textContent = FinanceAnalytics.formatINR(metrics.grossRevenue);
    const fsCosts = document.getElementById('fs-operating-costs');
    if (fsCosts) fsCosts.textContent = FinanceAnalytics.formatINR(metrics.operatingCosts);
    const fsNet = document.getElementById('fs-net-profit');
    if (fsNet) fsNet.textContent = FinanceAnalytics.formatINR(metrics.netProfit);
    const fsMargin = document.getElementById('fs-profit-margin');
    if (fsMargin) fsMargin.textContent = `${metrics.profitMargin.toFixed(1)}%`;
    const fsLiq = document.getElementById('fs-total-liquidity');
    if (fsLiq) fsLiq.textContent = FinanceAnalytics.formatINR(metrics.totalLiquidity);
    const fsSplit = document.getElementById('fs-liquidity-split');
    if (fsSplit) fsSplit.textContent = metrics.liquiditySplit;

    // 3. Bank Account Position Panel
    const bpIn = document.getElementById('bp-total-inflows');
    if (bpIn) bpIn.textContent = FinanceAnalytics.formatINR(metrics.bankPosition.totalInflows);
    const bpOut = document.getElementById('bp-total-outflows');
    if (bpOut) bpOut.textContent = FinanceAnalytics.formatINR(metrics.bankPosition.totalOutflows);
    const bpMov = document.getElementById('bp-operating-movement');
    if (bpMov) bpMov.textContent = FinanceAnalytics.formatINR(metrics.bankPosition.operatingMovement);
    const bpOpen = document.getElementById('bp-opening-balance');
    if (bpOpen) bpOpen.textContent = FinanceAnalytics.formatINR(metrics.bankPosition.openingBalance);
    const bpCur = document.getElementById('bp-current-balance');
    if (bpCur) bpCur.textContent = FinanceAnalytics.formatINR(metrics.bankPosition.currentBalance);
    const bpBadge = document.getElementById('bp-health-badge');
    if (bpBadge) {
      if (metrics.bankPosition.accountHealth === 'Reconciled') {
        bpBadge.className = 'px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200';
        bpBadge.textContent = 'Reconciled';
      } else {
        bpBadge.className = 'px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200';
        bpBadge.textContent = 'Overdrawn';
      }
    }

    // 4. Cash Position & Float Panel
    const cpIn = document.getElementById('cp-total-inflows');
    if (cpIn) cpIn.textContent = FinanceAnalytics.formatINR(metrics.cashPosition.totalInflows);
    const cpExp = document.getElementById('cp-total-expenses');
    if (cpExp) cpExp.textContent = FinanceAnalytics.formatINR(metrics.cashPosition.totalExpenses);
    const cpMov = document.getElementById('cp-net-movement');
    if (cpMov) cpMov.textContent = FinanceAnalytics.formatINR(metrics.cashPosition.netCashMovement);
    const cpOpen = document.getElementById('cp-opening-float');
    if (cpOpen) cpOpen.textContent = FinanceAnalytics.formatINR(metrics.cashPosition.openingCashFloat);
    const cpAvail = document.getElementById('cp-available-cash');
    if (cpAvail) cpAvail.textContent = FinanceAnalytics.formatINR(metrics.cashPosition.availableCashInHand);
    const cpBadge = document.getElementById('cp-health-badge');
    if (cpBadge) {
      if (metrics.cashPosition.cashHealth === 'Sufficient Cash') {
        cpBadge.className = 'px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200';
        cpBadge.textContent = 'Sufficient Cash';
      } else {
        cpBadge.className = 'px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200';
        cpBadge.textContent = 'Replenish Cash';
      }
    }

    // 5. Modes
    this.renderModeList('list-income-modes', metrics.incomeByMode, metrics.grossRevenue, 'emerald');
    this.renderModeList('list-expense-modes', metrics.expensesByMode, metrics.operatingCosts, 'rose');

    // 6. Recent preview
    const recent = [...this.filteredTransactions].reverse().slice(0, 5);
    const recentTbody = document.getElementById('dashboard-recent-table');
    if (recentTbody) {
      if (recent.length === 0) {
        recentTbody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-slate-400">No transactions recorded</td></tr>`;
      } else {
        recentTbody.innerHTML = recent.map(t => {
          const isIncome = t.type.includes('Received') || t.type.includes('Income');
          const typeBadge = isIncome 
            ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Income</span>`
            : `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Expense</span>`;
          
          const profitClass = (t.profitValue || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600';
          return `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100">
              <td class="py-2 px-3 text-slate-500">#${t.slNo}</td>
              <td class="py-2 px-3 text-slate-600 font-sans">${FinanceAnalytics.formatDateDisplay(t.date)}</td>
              <td class="py-2 px-3 font-sans font-medium text-slate-900">${this.escapeHtml(t.partyName)}</td>
              <td class="py-2 px-3 font-sans">${typeBadge}</td>
              <td class="py-2 px-3 font-sans">${this.getModeBadge(t.mode)}</td>
              <td class="py-2 px-3 text-right text-slate-800">${FinanceAnalytics.formatINR(t.amount)}</td>
              <td class="py-2 px-3 text-right ${profitClass} font-semibold">${FinanceAnalytics.formatINR(t.profitValue)}</td>
            </tr>
          `;
        }).join('');
      }
    }

    const recentMobile = document.getElementById('dashboard-recent-mobile');
    if (recentMobile) {
      if (recent.length === 0) {
        recentMobile.innerHTML = `<div class="py-4 text-center text-slate-400 text-xs">No transactions recorded</div>`;
      } else {
        recentMobile.innerHTML = recent.map(t => this.renderMobileCardHtml(t)).join('');
      }
    }

    // Trigger Charts
    window.financeCharts.render(this.filteredTransactions);
  }

  renderModeList(containerId, modeMap, total, themeColor) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const modes = ['UPI', 'NETBANKING', 'CASH', 'DEBIT CARD / CREDIT CARD', 'CHEQUE', 'OTHERS'];
    const barColors = {
      emerald: 'bg-emerald-500',
      rose: 'bg-rose-500'
    };

    const html = modes.map(m => {
      const amount = modeMap[m] || 0;
      const displayLabel = m === 'DEBIT CARD / CREDIT CARD' ? 'DEBIT / CREDIT' : m;
      return `
        <div class="flex items-center justify-between py-0.5">
          <span class="text-slate-500 text-[11px]">${displayLabel}</span>
          <span class="font-mono font-semibold text-slate-800">${FinanceAnalytics.formatINR(amount)}</span>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  getModeBadge(mode) {
    const m = (mode || 'CASH').toUpperCase();
    if (m === 'CASH') return `<span class="px-2 py-0.5 rounded text-[10px] font-semibold mode-badge-cash">CASH</span>`;
    if (m === 'NETBANKING') return `<span class="px-2 py-0.5 rounded text-[10px] font-semibold mode-badge-netbanking">NETBANKING</span>`;
    if (m === 'UPI') return `<span class="px-2 py-0.5 rounded text-[10px] font-semibold mode-badge-upi">UPI</span>`;
    if (m.includes('CARD')) return `<span class="px-2 py-0.5 rounded text-[10px] font-semibold mode-badge-card">CARD</span>`;
    if (m === 'CHEQUE') return `<span class="px-2 py-0.5 rounded text-[10px] font-semibold mode-badge-cheque">CHEQUE</span>`;
    return `<span class="px-2 py-0.5 rounded text-[10px] font-semibold mode-badge-others">${m}</span>`;
  }

  renderMobileCardHtml(t) {
    const isIncome = t.type.includes('Received') || t.type.includes('Income');
    const profitClass = isIncome ? 'text-emerald-700' : 'text-rose-700';
    const initial = (t.partyName || 'P').trim().charAt(0).toUpperCase();

    const canEdit = window.roleManager ? window.roleManager.can('canEdit') : true;
    const canDelete = window.roleManager ? window.roleManager.can('canDelete') : true;

    return `
      <div class="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-full ${isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'} flex items-center justify-center font-bold text-xs">
              ${initial}
            </div>
            <div>
              <h4 class="font-bold text-slate-900 text-xs leading-tight" onclick="app.openPartyModal('${this.escapeHtml(t.partyName)}')">${this.escapeHtml(t.partyName)}</h4>
              <p class="text-[10px] text-slate-400 mt-0.5">${FinanceAnalytics.formatDateDisplay(t.date)} • ${t.quarter || 'Q3'}</p>
            </div>
          </div>
          <div class="text-right">
            <span class="font-mono font-bold text-sm ${profitClass}">${isIncome ? '+' : '-'}${FinanceAnalytics.formatINR(t.amount)}</span>
            <div class="mt-0.5">${this.getModeBadge(t.mode)}</div>
          </div>
        </div>

        ${t.description ? `<p class="text-[11px] text-slate-600 line-clamp-1">${this.escapeHtml(t.description)}</p>` : ''}
        
        <div class="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
          <span class="truncate max-w-[180px]">${t.refNumber ? `Ref: ${this.escapeHtml(t.refNumber)}` : `#${t.slNo}`}</span>
          <button onclick="app.viewTransactionDetails('${t.id}')" class="text-sky-700 font-semibold px-2 py-0.5 rounded-lg bg-sky-50 border border-sky-200 flex items-center space-x-1">
            <i data-lucide="eye" class="w-3 h-3"></i>
            <span>View Details</span>
          </button>
        </div>
      </div>
    `;
  }

  renderTransactionsTable() {
    const tbody = document.getElementById('transactions-table-body');
    const mobileCards = document.getElementById('transactions-mobile-cards');

    if (this.filteredTransactions.length === 0) {
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="11" class="py-12 text-center text-slate-400">
              <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
              <p class="font-medium text-slate-600">No transactions match the selected filters</p>
            </td>
          </tr>
        `;
      }
      if (mobileCards) {
        mobileCards.innerHTML = `<div class="p-8 text-center text-slate-400 text-xs">No transactions match filters</div>`;
      }
      this.updateTableSummary(0, 0, 0, 0);
      return;
    }

    let sumIncome = 0;
    let sumExpense = 0;

    if (tbody) {
      tbody.innerHTML = this.filteredTransactions.map(t => {
        const isIncome = t.type.includes('Received') || t.type.includes('Income');
        if (isIncome) sumIncome += Number(t.amount) || 0;
        else sumExpense += Number(t.amount) || 0;

        const typeBadge = isIncome
          ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">Received</span>`
          : `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">Paid</span>`;

        const profitVal = Number(t.profitValue) || 0;
        const profitClass = profitVal >= 0 ? 'text-emerald-600' : 'text-rose-600';

        return `
          <tr class="hover:bg-slate-50 transition border-b border-slate-100">
            <td class="py-2.5 px-3 font-mono text-slate-500">${t.slNo}</td>
            <td class="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono">${FinanceAnalytics.formatDateDisplay(t.date)}</td>
            <td class="py-2.5 px-3">${typeBadge}</td>
            <td class="py-2.5 px-4 font-semibold text-slate-900 cursor-pointer hover:text-sky-600" onclick="app.openPartyModal('${this.escapeHtml(t.partyName)}')">${this.escapeHtml(t.partyName)}</td>
            <td class="py-2.5 px-4 max-w-xs truncate text-slate-600" title="${this.escapeHtml(t.description)}">
              <span class="text-slate-800">${this.escapeHtml(t.description)}</span>
              ${t.category ? `<span class="block text-[10px] text-slate-400 font-normal">${this.escapeHtml(t.category)}</span>` : ''}
            </td>
            <td class="py-2.5 px-3 text-right font-mono font-medium text-slate-900">${FinanceAnalytics.formatINR(t.amount)}</td>
            <td class="py-2.5 px-3">${this.getModeBadge(t.mode)}</td>
            <td class="py-2.5 px-4 text-slate-500 text-[11px] max-w-xs truncate" title="${this.escapeHtml(t.refNumber)}">${this.escapeHtml(t.refNumber)}</td>
            <td class="py-2.5 px-2 text-center text-slate-500 font-mono text-[11px]">${t.quarter || '-'}</td>
            <td class="py-2.5 px-3 text-right font-mono font-semibold ${profitClass}">${FinanceAnalytics.formatINR(t.profitValue)}</td>
            <td class="py-2.5 px-3 text-center">
              <button onclick="app.viewTransactionDetails('${t.id}')" title="View Transaction Details" class="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-semibold flex items-center justify-center space-x-1 border border-sky-200 mx-auto transition">
                <i data-lucide="eye" class="w-3.5 h-3.5 text-sky-600"></i>
                <span>View</span>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    if (mobileCards) {
      mobileCards.innerHTML = this.filteredTransactions.map(t => this.renderMobileCardHtml(t)).join('');
    }

    this.updateTableSummary(this.filteredTransactions.length, sumIncome, sumExpense, sumIncome - sumExpense);
  }

  updateTableSummary(count, income, expense, net) {
    const elCount = document.getElementById('table-record-count');
    if (elCount) elCount.textContent = `Showing ${count} entries`;
    const elInc = document.getElementById('table-sum-income');
    if (elInc) elInc.textContent = FinanceAnalytics.formatINR(income);
    const elExp = document.getElementById('table-sum-expense');
    if (elExp) elExp.textContent = FinanceAnalytics.formatINR(expense);
    const elNet = document.getElementById('table-sum-net');
    if (elNet) elNet.textContent = FinanceAnalytics.formatINR(net);

    const mCount = document.getElementById('m-record-count');
    if (mCount) mCount.textContent = count;
    const mInc = document.getElementById('m-sum-income');
    if (mInc) mInc.textContent = FinanceAnalytics.formatINR(income);
    const mExp = document.getElementById('m-sum-expense');
    if (mExp) mExp.textContent = FinanceAnalytics.formatINR(expense);
    const mNet = document.getElementById('m-sum-net');
    if (mNet) mNet.textContent = FinanceAnalytics.formatINR(net);
  }

  renderParties() {
    const grid = document.getElementById('parties-grid');
    if (!grid) return;

    const searchInput = document.getElementById('partySearch');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let parties = FinanceAnalytics.getPartySummary(this.filteredTransactions);
    if (query) {
      parties = parties.filter(p => p.name.toLowerCase().includes(query));
    }

    if (parties.length === 0) {
      grid.innerHTML = `<div class="col-span-3 py-12 text-center text-slate-400">No parties found matching criteria.</div>`;
      return;
    }

    grid.innerHTML = parties.map(p => {
      const netClass = p.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600';
      const statusBadge = p.netBalance >= 0
        ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Client / Surplus</span>`
        : `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Vendor / Payable</span>`;

      return `
        <div class="glass-card glass-card-hover rounded-2xl p-4 space-y-3 cursor-pointer" onclick="app.openPartyModal('${this.escapeHtml(p.name)}')">
          <div class="flex items-start justify-between">
            <div>
              <h4 class="font-bold text-slate-900 text-sm hover:text-sky-600 transition">${this.escapeHtml(p.name)}</h4>
              <p class="text-[11px] text-slate-500 mt-0.5">${p.transactionCount} transactions | Last: ${FinanceAnalytics.formatDateDisplay(p.lastDate)}</p>
            </div>
            ${statusBadge}
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            <div>
              <span class="text-slate-400 block text-[10px]">Total Received</span>
              <span class="font-mono text-emerald-600 font-semibold">${FinanceAnalytics.formatINR(p.totalReceived)}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Total Paid</span>
              <span class="font-mono text-rose-600 font-semibold">${FinanceAnalytics.formatINR(p.totalPaid)}</span>
            </div>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span class="text-slate-600 font-medium">Net Standing:</span>
            <span class="font-mono font-bold ${netClass}">${FinanceAnalytics.formatINR(p.netBalance)}</span>
          </div>
        </div>
      `;
    }).join('');

    window.financeCharts.renderPartyChart(this.filteredTransactions);
  }

  renderReports() {
    const container = document.getElementById('fy-summary-container');
    if (!container) return;

    const fySummaries = FinanceAnalytics.getFYQuarterSummary(this.transactions);
    const fyKeys = Object.keys(fySummaries).sort().reverse();

    if (fyKeys.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-slate-400">No financial data to generate reports.</div>`;
      return;
    }

    container.innerHTML = fyKeys.map(fy => {
      const data = fySummaries[fy];
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

      const quarterRows = quarters.map(q => {
        const qData = data.quarters[q];
        const profitClass = qData.profit >= 0 ? 'text-emerald-600' : 'text-rose-600';
        return `
          <tr class="hover:bg-slate-50 border-b border-slate-100">
            <td class="py-2.5 px-4 font-semibold text-slate-800">${q}</td>
            <td class="py-2.5 px-4 font-mono text-emerald-600">${FinanceAnalytics.formatINR(qData.income)}</td>
            <td class="py-2.5 px-4 font-mono text-rose-600">${FinanceAnalytics.formatINR(qData.expense)}</td>
            <td class="py-2.5 px-4 font-mono font-bold ${profitClass}">${FinanceAnalytics.formatINR(qData.profit)}</td>
            <td class="py-2.5 px-4 text-slate-500">${qData.count} entries</td>
          </tr>
        `;
      }).join('');

      const monthRows = Object.keys(data.monthly).sort().map(m => {
        const mData = data.monthly[m];
        const profitClass = mData.profit >= 0 ? 'text-emerald-600' : 'text-rose-600';
        return `
          <tr class="hover:bg-slate-50 border-b border-slate-100">
            <td class="py-2 px-4 font-medium text-slate-800 font-mono">${m}</td>
            <td class="py-2 px-4 font-mono text-emerald-600">${FinanceAnalytics.formatINR(mData.income)}</td>
            <td class="py-2 px-4 font-mono text-rose-600">${FinanceAnalytics.formatINR(mData.expense)}</td>
            <td class="py-2 px-4 font-mono font-bold ${profitClass}">${FinanceAnalytics.formatINR(mData.profit)}</td>
            <td class="py-2 px-4 text-slate-500 text-xs">${mData.count} txns</td>
          </tr>
        `;
      }).join('');

      return `
        <div class="glass-card rounded-2xl p-4 md:p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-2">
            <div>
              <h3 class="text-base font-bold text-slate-900">${fy} Financial Summary</h3>
              <p class="text-xs text-slate-500">Total Profit Value: <span class="font-mono font-bold text-sky-700">${FinanceAnalytics.formatINR(data.totalProfit)}</span></p>
            </div>
            <div class="flex items-center space-x-3 text-xs font-mono">
              <span class="text-emerald-700 font-semibold">Turnover: ${FinanceAnalytics.formatINR(data.totalIncome)}</span>
              <span class="text-rose-700 font-semibold">Expenses: ${FinanceAnalytics.formatINR(data.totalExpenses)}</span>
            </div>
          </div>

          <div>
            <h4 class="text-xs uppercase font-semibold text-slate-500 mb-2">Quarterly Breakdown</h4>
            <div class="overflow-x-auto rounded-xl border border-slate-200">
              <table class="w-full text-left text-xs text-slate-800">
                <thead class="bg-slate-100 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th class="py-2.5 px-4">Quarter</th>
                    <th class="py-2.5 px-4">Turnover (Income)</th>
                    <th class="py-2.5 px-4">Expenses</th>
                    <th class="py-2.5 px-4">Net Profit Value</th>
                    <th class="py-2.5 px-4">Transactions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-mono">
                  ${quarterRows}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 class="text-xs uppercase font-semibold text-slate-500 mb-2">Monthly Trajectory</h4>
            <div class="overflow-x-auto rounded-xl border border-slate-200 max-h-56 overflow-y-auto">
              <table class="w-full text-left text-xs text-slate-800">
                <thead class="bg-slate-100 sticky top-0 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th class="py-2 px-4">Month</th>
                    <th class="py-2 px-4">Turnover</th>
                    <th class="py-2 px-4">Expenses</th>
                    <th class="py-2 px-4">Net Profit</th>
                    <th class="py-2 px-4">Volume</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-mono">
                  ${monthRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // FLOAT ADJUSTMENTS
  promptOpeningFloat(type) {
    if (!window.roleManager || !window.roleManager.can('canAdjustFloat')) {
      this.showToast('Float adjustments require Admin or Owner permissions.', 'error');
      return;
    }

    const isBank = type === 'bank';
    const key = isBank ? 'dharshithan_opening_bank' : 'dharshithan_opening_cash';
    const label = isBank ? 'Opening Bank Balance' : 'Opening Cash Float';
    const current = localStorage.getItem(key) || '0';

    const newVal = prompt(`Enter ${label} (₹):`, current);
    if (newVal !== null && !isNaN(parseFloat(newVal))) {
      localStorage.setItem(key, parseFloat(newVal).toString());
      this.showToast(`${label} updated to ${FinanceAnalytics.formatINR(parseFloat(newVal))}`, 'success');
      this.renderCurrentView();
    }
  }

  // MODAL HANDLERS
  openTransactionModal(editId = null, defaultType = null) {
    if (window.roleManager && !window.roleManager.can('canAdd') && !editId) {
      this.showToast('Your role does not have permission to add transactions.', 'error');
      return;
    }
    if (window.roleManager && !window.roleManager.can('canEdit') && editId) {
      this.showToast('Your role does not have permission to edit transactions.', 'error');
      return;
    }

    const modal = document.getElementById('txnModal');
    if (!modal) return;

    this.editingId = editId;
    const form = document.getElementById('txnForm');
    if (form) form.reset();

    const titleEl = document.getElementById('modalTitle');
    const idInput = document.getElementById('txnId');
    const dateInput = document.getElementById('modalDate');

    if (editId) {
      const item = this.transactions.find(t => t.id === editId || t.slNo === editId);
      if (item) {
        if (titleEl) titleEl.innerHTML = `<i data-lucide="edit-3" class="w-5 h-5 text-sky-600"></i><span>Edit Transaction #${item.slNo}</span>`;
        if (idInput) idInput.value = item.id;
        if (dateInput) dateInput.value = item.date;

        const isIncome = item.type.includes('Received') || item.type.includes('Income');
        const radios = document.querySelectorAll('input[name="modalType"]');
        radios.forEach(r => {
          if (isIncome && (r.value.includes('Received') || r.value.includes('Income'))) r.checked = true;
          if (!isIncome && (r.value.includes('Paid') || r.value.includes('Expense'))) r.checked = true;
        });

        const partyInput = document.getElementById('modalParty');
        if (partyInput) partyInput.value = item.partyName;

        const amtInput = document.getElementById('modalAmount');
        if (amtInput) amtInput.value = item.amount;

        const modeInput = document.getElementById('modalMode');
        if (modeInput) modeInput.value = item.mode || 'CASH';

        const catInput = document.getElementById('modalCategory');
        if (catInput) catInput.value = item.category || 'General';

        const refInput = document.getElementById('modalRef');
        if (refInput) refInput.value = item.refNumber || '';

        const descInput = document.getElementById('modalDesc');
        if (descInput) descInput.value = item.description || '';
      }
    } else {
      if (titleEl) titleEl.innerHTML = `<i data-lucide="plus-circle" class="w-5 h-5 text-sky-600"></i><span>Record Financial Transaction</span>`;
      if (idInput) idInput.value = '';
      if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

      const isExpense = defaultType && (defaultType.includes('Paid') || defaultType.includes('Expense'));
      const radioIncome = document.querySelector('input[name="modalType"][value*="Received"]');
      const radioExpense = document.querySelector('input[name="modalType"][value*="Paid"]');

      if (isExpense && radioExpense) {
        radioExpense.checked = true;
      } else if (radioIncome) {
        radioIncome.checked = true;
      }
    }

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeTransactionModal() {
    const modal = document.getElementById('txnModal');
    if (modal) modal.classList.add('hidden');
    this.editingId = null;
  }

  async saveTransaction(e) {
    e.preventDefault();

    const id = document.getElementById('txnId').value;
    const typeRadio = document.querySelector('input[name="modalType"]:checked');
    const type = typeRadio ? typeRadio.value : 'Received / Income';
    const date = document.getElementById('modalDate').value;
    const partyName = document.getElementById('modalParty').value.trim();
    const amount = parseFloat(document.getElementById('modalAmount').value);
    const mode = document.getElementById('modalMode').value;
    const category = document.getElementById('modalCategory').value.trim();
    const refNumber = document.getElementById('modalRef').value.trim();
    const description = document.getElementById('modalDesc').value.trim();

    if (!partyName || isNaN(amount) || amount <= 0) {
      this.showToast('Please provide valid party name and positive amount', 'error');
      return;
    }

    const payload = {
      date,
      type,
      partyName,
      amount,
      mode,
      category,
      refNumber,
      description
    };

    try {
      let savedRecord = null;
      if (id) {
        savedRecord = await window.financeDB.update(id, payload);
        this.showToast('Transaction updated', 'success');
        
        
      } else {
        savedRecord = await window.financeDB.add(payload);
        this.showToast('Transaction saved', 'success');

        
      }
      this.closeTransactionModal();
    } catch (err) {
      console.error(err);
      this.showToast('Error saving: ' + err.message, 'error');
    }
  }

  async deleteTransaction(id) {
    if (window.roleManager && !window.roleManager.can('canDelete')) {
      this.showToast('Your role does not have permission to delete transactions.', 'error');
      return;
    }

    const item = this.transactions.find(t => t.id === id);
    if (!item) return;

    if (confirm(`Delete #${item.slNo} "${item.partyName}" (${FinanceAnalytics.formatINR(item.amount)})? This will permanently delete it from Neon Database.`)) {
      await window.financeDB.delete(id);
      this.showToast('Transaction deleted from Neon DB', 'info');
      await this.refreshData();
    }
  }

  editTransaction(id) {
    this.openTransactionModal(id);
  }

  // ROLES & RBAC MODAL
  openRoleModal() {
    const modal = document.getElementById('roleModal');
    if (!modal || !window.roleManager) return;

    const container = document.getElementById('rolesListContainer');
    const active = window.roleManager.getRole();
    const allRoles = window.roleManager.getAllRoles();

    if (container) {
      container.innerHTML = allRoles.map(r => {
        const isSelected = r.id === active.id;
        return `
          <div onclick="app.selectRole('${r.id}')" class="p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${isSelected ? 'border-purple-500 bg-purple-50/50 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300'}">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-full ${r.avatarBg} text-white font-bold flex items-center justify-center text-xs">
                ${r.name.charAt(0)}
              </div>
              <div>
                <h4 class="font-bold text-slate-900 leading-tight">${r.name}</h4>
                <p class="text-[10px] text-slate-500 mt-0.5">${r.title}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border ${r.badgeClass}">${r.name}</span>
              ${isSelected ? `<i data-lucide="check-circle" class="w-4 h-4 text-purple-600"></i>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeRoleModal() {
    const modal = document.getElementById('roleModal');
    if (modal) modal.classList.add('hidden');
  }

  selectRole(roleId) {
    if (!window.roleManager) return;
    window.roleManager.setRole(roleId);
    this.showToast(`Switched active role to: ${window.roleManager.getRole().name}`, 'info');
    this.closeRoleModal();
  }

  // DATABASE HUB MODAL (STRICTLY SUPER ADMIN & DEVELOPER RESTRICTED)
  openDatabaseHubModal() {
    const user = window.authManager ? window.authManager.getCurrentUser() : null;
    if (!user || (user.role !== 'super_admin' && user.role !== 'developer')) {
      this.showToast('Access Denied: Enterprise Database Hub is restricted to Super Admin and Developer roles.', 'error');
      return;
    }

    this.refreshDatabaseHubUI();
    const modal = document.getElementById('dbHubModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeDatabaseHubModal() {
    const modal = document.getElementById('dbHubModal');
    if (modal) modal.classList.add('hidden');
  }

  selectDbProvider(provider) {
    if (!window.databaseHub) return;
    window.databaseHub.setProvider('postgres');
    this.refreshDatabaseHubUI();
    this.showToast('Master Database: Neon Serverless PostgreSQL', 'info');
  }

  testAndSavePgConnection() {
    if (!window.databaseHub) return;
    const input = document.getElementById('pgConnInput');
    const uri = input ? input.value : '';
    const res = window.databaseHub.testAndSaveConnection(uri);

    const dot = document.getElementById('pgStatusDot');
    const text = document.getElementById('pgStatusText');

    if (res.success) {
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
      if (text) {
        text.className = 'text-emerald-700 font-medium';
        text.textContent = `✓ Verified: Connected to ${res.host} (Database: ${res.database})`;
      }
      this.showToast(res.message, 'success');
    } else {
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-rose-500';
      if (text) {
        text.className = 'text-rose-700 font-medium';
        text.textContent = `✗ Verification Failed: ${res.error}`;
      }
      this.showToast(res.error, 'error');
    }
  }

  togglePgPasswordVisibility() {
    const input = document.getElementById('pgConnInput');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  copySchemaSQL() {
    if (!window.databaseHub) return;
    const ddl = window.databaseHub.getSchemaDDL();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ddl).then(() => {
        this.showToast('PostgreSQL schema.sql DDL copied to clipboard! Paste in Supabase/Neon SQL editor.', 'success');
      }).catch(() => {
        this.fallbackCopyText(ddl, 'PostgreSQL schema.sql DDL copied to clipboard!');
      });
    } else {
      this.fallbackCopyText(ddl, 'PostgreSQL schema.sql DDL copied to clipboard!');
    }
  }

  fallbackCopyText(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      this.showToast(successMsg, 'success');
    } catch (e) {
      this.showToast('Could not copy automatically. Please use Download .SQL.', 'error');
    }
    document.body.removeChild(ta);
  }

  refreshDatabaseHubUI() {
    if (!window.databaseHub) return;
    const uri = window.databaseHub.getPostgresUri();
    const input = document.getElementById('pgConnInput');
    if (input && uri) input.value = uri;

    const dot = document.getElementById('pgStatusDot');
    const text = document.getElementById('pgStatusText');
    if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
    if (text) {
      text.className = 'text-emerald-700 font-medium';
      text.textContent = 'Connected: ep-late-art-b5308bnc-pooler.c-7.us-east-2.aws.neon.tech (neondb)';
    }
  }

  downloadMigrationSQL() {
    if (!window.databaseHub) return;
    window.databaseHub.downloadSQLMigration(this.transactions);
    this.showToast('PostgreSQL Backup Script Downloaded!', 'success');
  }

  async refreshFromNeon(options = {}) {
    const isSilent = options.silent === true;
    const icons = [
      document.getElementById('headerSyncIcon'),
      document.getElementById('fabSyncIcon'),
      document.getElementById('navSyncIcon')
    ];
    icons.forEach(i => { if (i) i.classList.add('animate-spin'); });

    try {
      if (!isSilent) this.showToast('Fetching latest from Neon Database...', 'info');
      await this.refreshData();
      this.updateLastSyncTimeDisplay();
      if (!isSilent) {
        const count = this.transactions ? this.transactions.length : 0;
        this.showToast(`Neon DB Live: ${count} records active`, 'success');
      }
    } catch (e) {
      console.warn('Neon refresh failed:', e);
      if (!isSilent) this.showToast('Failed to refresh from Neon: ' + e.message, 'error');
    } finally {
      setTimeout(() => {
        icons.forEach(i => { if (i) i.classList.remove('animate-spin'); });
      }, 500);
    }
  }

  updateLastSyncTimeDisplay() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const count = this.transactions ? this.transactions.length : 0;
    
    const bannerEl = document.getElementById('lastSyncBannerText');
    if (bannerEl) bannerEl.textContent = `Neon DB Live • ${timeStr} (${count} entries)`;

    const statusText = document.getElementById('neonStatusText');
    if (statusText) statusText.textContent = `Neon Live ${timeStr}`;
  }

  closeAllModals() {
    this.closeTransactionDetailModal();
    this.closeTransactionModal();
    this.closePartyModal();
    this.closeSyncModal();
    this.closeRoleModal();
    this.closeDatabaseHubModal();
    this.closeForgotPasswordModal();
    this.closeUserManagementModal();
    this.closeNewUserModal();
  }

  // =========================================================================
  // AUTHENTICATION & SESSION MANAGEMENT
  // =========================================================================

  checkAuthUI() {
    const isAuth = window.authManager && window.authManager.isAuthenticated();
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) {
      if (isAuth) {
        loginOverlay.classList.add('hidden');
      } else {
        loginOverlay.classList.remove('hidden');
      }
    }

    const user = window.authManager ? window.authManager.getCurrentUser() : null;
    const activeRoleId = window.roleManager ? window.roleManager.getRole().id : (user ? user.role : 'employee');
    const isSuperAdmin = isAuth && (activeRoleId === 'super_admin');
    const isSuperOrDev = isAuth && (activeRoleId === 'super_admin' || activeRoleId === 'developer');
    const canManageUsers = isAuth && ['super_admin', 'developer', 'admin', 'owner'].includes(activeRoleId);

    // =========================================================================
    // STRICT SUPER-ADMIN ONLY DATABASE GATING
    // (Only Super Admin Dashboard shows DB telemetry, connection strings, or sync)
    // =========================================================================
    const neonStatusBar = document.getElementById('neonStatusBar');
    if (neonStatusBar) {
      if (isSuperAdmin) {
        neonStatusBar.classList.remove('hidden');
        neonStatusBar.style.display = 'flex';
      } else {
        neonStatusBar.classList.add('hidden');
        neonStatusBar.style.display = 'none';
      }
    }

    const headerSyncBtn = document.getElementById('headerSyncBtn');
    if (headerSyncBtn) {
      headerSyncBtn.style.display = isSuperAdmin ? 'inline-flex' : 'none';
    }

    const neonSyncPill = document.getElementById('neonSyncPill');
    if (neonSyncPill) {
      neonSyncPill.style.display = isSuperAdmin ? 'inline-flex' : 'none';
    }

    const dbHubBtn = document.getElementById('dbHubBtn');
    if (dbHubBtn) {
      dbHubBtn.style.display = isSuperAdmin ? 'inline-flex' : 'none';
    }

    const filterBarSyncBtn = document.getElementById('filterBarSyncBtn');
    if (filterBarSyncBtn) {
      filterBarSyncBtn.style.display = isSuperAdmin ? 'inline-flex' : 'none';
    }

    const filterBarSqlBtn = document.getElementById('filterBarSqlBtn');
    if (filterBarSqlBtn) {
      filterBarSqlBtn.style.display = isSuperAdmin ? 'inline-flex' : 'none';
    }

    const androidFabBtn = document.getElementById('androidFabBtn');
    if (androidFabBtn) {
      androidFabBtn.style.display = isSuperAdmin ? 'flex' : 'none';
    }

    // =========================================================================
    // UPDATE RIGHT-SIDE USER PROFILE PILL BUTTON (Zoho Books Style)
    // =========================================================================
    if (user) {
      const roleObj = window.roleManager ? window.roleManager.getRole() : null;
      const roleName = roleObj ? roleObj.name : user.role;
      const roleId = roleObj ? roleObj.id : user.role;

      // Header Profile Avatar Initials
      const profileAvatar = document.getElementById('headerProfileAvatar');
      if (profileAvatar) {
        const initials = (user.fullName || user.userId || 'U')
          .split(' ')
          .map(w => w[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        profileAvatar.textContent = initials || 'SA';

        // Avatar color coding based on role
        if (roleId === 'super_admin') profileAvatar.className = 'w-7 h-7 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs';
        else if (roleId === 'owner') profileAvatar.className = 'w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs';
        else if (roleId === 'admin') profileAvatar.className = 'w-7 h-7 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs';
        else if (roleId === 'developer') profileAvatar.className = 'w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs';
        else profileAvatar.className = 'w-7 h-7 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs';
      }

      // Header Profile Full Name
      const profileName = document.getElementById('headerProfileName');
      if (profileName) {
        profileName.textContent = user.fullName || user.userId;
      }

      // Header Profile Role Badge
      const profileBadge = document.getElementById('headerProfileBadge');
      if (profileBadge) {
        let badgeIcon = '👑';
        if (roleId === 'owner') badgeIcon = '💼';
        else if (roleId === 'admin') badgeIcon = '📊';
        else if (roleId === 'developer') badgeIcon = '💻';
        else if (roleId === 'employee') badgeIcon = '👷';
        else if (roleId === 'stakeholder') badgeIcon = '📈';

        profileBadge.textContent = `${badgeIcon} ${roleName}`;
      }
    }
  }

  // =========================================================================
  // USER PROFILE & RIGHTS TO USE DRAWER / MODAL
  // =========================================================================

  openUserProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (!modal) return;

    const user = window.authManager ? window.authManager.getCurrentUser() : null;
    const roleObj = window.roleManager ? window.roleManager.getRole() : null;
    const roleId = roleObj ? roleObj.id : (user ? user.role : 'employee');
    const roleName = roleObj ? roleObj.name : 'Staff';

    // Avatar
    const modalAvatar = document.getElementById('modalProfileAvatar');
    if (modalAvatar && user) {
      const initials = (user.fullName || user.userId || 'U')
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      modalAvatar.textContent = initials || 'SA';
    }

    // Name & User ID
    const modalName = document.getElementById('modalProfileFullName');
    if (modalName) modalName.textContent = user ? (user.fullName || user.userId) : 'User';

    const modalId = document.getElementById('modalProfileUserId');
    if (modalId) modalId.textContent = user ? `ID: ${user.userId} • ${user.email || 'account@dharshithan.com'}` : '';

    // Role Badge & Category
    const modalRoleBadge = document.getElementById('modalProfileRoleBadge');
    if (modalRoleBadge) {
      modalRoleBadge.textContent = `${roleName}`;
      if (roleObj) modalRoleBadge.className = `inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${roleObj.badgeClass}`;
    }

    const modalCategory = document.getElementById('modalProfileCategory');
    if (modalCategory) {
      modalCategory.textContent = user ? (user.category || 'Financial Management') : 'Operations';
    }

    // Render Rights to Use matrix
    const rightsList = document.getElementById('profileRightsList');
    if (rightsList && window.roleManager) {
      const matrix = window.roleManager.getRightsMatrix(roleId);
      rightsList.innerHTML = matrix.map(r => `
        <div class="p-2.5 rounded-xl border flex items-start space-x-2.5 ${r.granted ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50 opacity-60'}">
          <div class="w-6 h-6 rounded-lg ${r.granted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'} flex items-center justify-center flex-shrink-0 mt-0.5">
            <i data-lucide="${r.granted ? 'check' : 'lock'}" class="w-3.5 h-3.5"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h5 class="text-xs font-bold ${r.granted ? 'text-slate-900' : 'text-slate-600'}">${r.title}</h5>
              <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${r.granted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
                ${r.granted ? 'Granted' : 'Restricted'}
              </span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">${r.desc}</p>
          </div>
        </div>
      `).join('');
    }

    // Show/hide Super Admin Preview Box
    const previewBox = document.getElementById('superAdminRolePreviewBox');
    const actualRole = user ? user.role : '';
    if (previewBox) {
      if (actualRole === 'super_admin') {
        previewBox.classList.remove('hidden');
        const select = document.getElementById('rolePreviewSelect');
        if (select) select.value = roleId;
      } else {
        previewBox.classList.add('hidden');
      }
    }

    // User management button visibility
    const canManageUsers = ['super_admin', 'developer', 'admin', 'owner'].includes(roleId);
    const modalUserMgmtBtn = document.getElementById('modalUserMgmtBtn');
    if (modalUserMgmtBtn) {
      modalUserMgmtBtn.style.display = canManageUsers ? 'inline-flex' : 'none';
    }

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeUserProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (modal) modal.classList.add('hidden');
  }

  switchRolePreview(roleId) {
    if (!window.roleManager) return;
    window.roleManager.setRole(roleId);
    this.applyRolePermissions();
    this.checkAuthUI();
    this.renderCurrentView();

    // Re-render permissions in open modal
    this.openUserProfileModal();
    this.showToast(`Previewing interface as ${roleId.toUpperCase()}`, 'info');
  }

  openSelfPasswordChangeModal() {
    this.closeUserProfileModal();
    const modal = document.getElementById('selfPasswordChangeModal');
    if (modal) modal.classList.remove('hidden');
  }

  closeSelfPasswordChangeModal() {
    const modal = document.getElementById('selfPasswordChangeModal');
    if (modal) modal.classList.add('hidden');
  }

  async handleSelfPasswordChange(e) {
    e.preventDefault();
    const newPass = document.getElementById('selfNewPass')?.value;
    const confirmPass = document.getElementById('selfConfirmPass')?.value;

    if (!newPass || newPass.length < 6) {
      this.showToast('New password must be at least 6 characters long', 'error');
      return;
    }
    if (newPass !== confirmPass) {
      this.showToast('Passwords do not match. Please verify.', 'error');
      return;
    }

    const user = window.authManager ? window.authManager.getCurrentUser() : null;
    if (!user) return;

    try {
      const res = await window.authManager.changeFirstLoginPassword(user.userId, newPass);
      if (res.success) {
        this.closeSelfPasswordChangeModal();
        this.showToast('Password updated successfully in Neon Database!', 'success');
      } else {
        this.showToast(res.error || 'Failed to update password', 'error');
      }
    } catch (err) {
      this.showToast('Password update error: ' + err.message, 'error');
    }
  }

  async handleLogin(e) {
    if (e) e.preventDefault();
    const userIdInput = document.getElementById('loginUserId');
    const passwordInput = document.getElementById('loginPassword');
    const submitBtn = document.getElementById('loginSubmitBtn');

    if (!userIdInput || !passwordInput) return;
    const userId = userIdInput.value.trim();
    const password = passwordInput.value.trim();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Authenticating...</span>`;
      if (window.lucide) window.lucide.createIcons();
    }

    try {
      const res = await window.authManager.login(userId, password);
      if (res.mustChangePassword) {
        // First-time login forced password change
        this.openFirstLoginModal(userId, password);
      } else if (res.success) {
        this.checkAuthUI();
        this.showToast(`Welcome back, ${res.user.fullName}!`, 'success');
        this.renderCurrentView();
      } else {
        this.showToast(res.error || 'Login failed', 'error');
      }
    } catch (err) {
      this.showToast('Authentication error: ' + err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i><span>Sign In</span>`;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  }

  fillCredentials(userId, password) {
    const uInput = document.getElementById('loginUserId');
    const pInput = document.getElementById('loginPassword');
    if (uInput) uInput.value = userId;
    if (pInput) pInput.value = password;
    this.showToast(`Credentials filled for "${userId}"! Click Sign In to proceed.`, 'info');
  }

  toggleLoginPasswordVisibility() {
    const pInput = document.getElementById('loginPassword');
    const icon = document.getElementById('loginPassEyeIcon');
    if (!pInput) return;
    const isPass = pInput.type === 'password';
    pInput.type = isPass ? 'text' : 'password';
    if (icon) {
      icon.setAttribute('data-lucide', isPass ? 'eye-off' : 'eye');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  openFirstLoginModal(userId, currentPassword) {
    const modal = document.getElementById('firstLoginModal');
    const nameEl = document.getElementById('firstLoginTargetName');
    const curPassInput = document.getElementById('firstLoginCurrentPass');
    const newPassInput = document.getElementById('firstLoginNewPass');
    const confirmPassInput = document.getElementById('firstLoginConfirmPass');

    this.pendingFirstLoginUserId = userId;
    if (nameEl) nameEl.textContent = userId;
    if (curPassInput) curPassInput.value = currentPassword;
    if (newPassInput) newPassInput.value = '';
    if (confirmPassInput) confirmPassInput.value = '';

    if (modal) modal.classList.remove('hidden');
    if (newPassInput) newPassInput.focus();
    if (window.lucide) window.lucide.createIcons();
  }

  closeFirstLoginModal() {
    const modal = document.getElementById('firstLoginModal');
    if (modal) modal.classList.add('hidden');
  }

  async handleFirstLoginPasswordChange(e) {
    if (e) e.preventDefault();
    const curPass = document.getElementById('firstLoginCurrentPass').value;
    const newPass = document.getElementById('firstLoginNewPass').value;
    const confirmPass = document.getElementById('firstLoginConfirmPass').value;

    if (newPass !== confirmPass) {
      this.showToast('New password and confirmation do not match.', 'error');
      return;
    }

    const res = await window.authManager.changePassword(this.pendingFirstLoginUserId, curPass, newPass);
    if (res.success) {
      this.closeFirstLoginModal();
      this.checkAuthUI();
      this.showToast(res.message, 'success');
      this.renderCurrentView();
    } else {
      this.showToast(res.error || 'Failed to update password', 'error');
    }
  }

  handleLogout() {
    if (confirm('Are you sure you want to sign out?')) {
      window.authManager.logout();
      this.checkAuthUI();
      this.showToast('You have been signed out successfully.', 'info');
    }
  }

  // =========================================================================
  // FORGOT PASSWORD & OTP VERIFICATION
  // =========================================================================

  openForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    const step1 = document.getElementById('forgotStep1');
    const step2 = document.getElementById('forgotStep2');
    const input = document.getElementById('forgotInputUserOrEmail');

    if (step1) step1.classList.remove('hidden');
    if (step2) step2.classList.add('hidden');
    if (input) input.value = '';

    if (modal) modal.classList.remove('hidden');
    if (input) input.focus();
    if (window.lucide) window.lucide.createIcons();
  }

  closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) modal.classList.add('hidden');
  }

  handleRequestResetOTP() {
    const input = document.getElementById('forgotInputUserOrEmail');
    if (!input) return;
    const val = input.value.trim();

    const res = window.authManager.requestOTP(val);
    if (res.success) {
      this.pendingResetUserId = res.userId;
      this.generatedTestOTP = res.code;

      document.getElementById('forgotDispatchedEmail').textContent = res.email;
      document.getElementById('forgotTestingOTP').textContent = res.code;

      document.getElementById('forgotStep1').classList.add('hidden');
      document.getElementById('forgotStep2').classList.remove('hidden');
      document.getElementById('forgotOTPCode').focus();
      if (window.lucide) window.lucide.createIcons();

      this.showToast(`6-Digit OTP code sent to ${res.email}! (Test Code: ${res.code})`, 'success');
    } else {
      this.showToast(res.error || 'Failed to request OTP', 'error');
    }
  }

  autofillOTP() {
    const input = document.getElementById('forgotOTPCode');
    if (input && this.generatedTestOTP) {
      input.value = this.generatedTestOTP;
      document.getElementById('forgotNewPass')?.focus();
    }
  }

  handleVerifyOTPAndReset() {
    const otp = document.getElementById('forgotOTPCode').value.trim();
    const newPass = document.getElementById('forgotNewPass').value.trim();

    const res = window.authManager.verifyOTPAndReset(this.pendingResetUserId, otp, newPass);
    if (res.success) {
      this.closeForgotPasswordModal();
      this.fillCredentials(this.pendingResetUserId, newPass);
      this.showToast(res.message, 'success');
    } else {
      this.showToast(res.error || 'Failed to verify OTP', 'error');
    }
  }

  // =========================================================================
  // USER MANAGEMENT & RBAC DIRECTORY
  // =========================================================================

  openUserManagementModal() {
    if (!window.authManager || !window.authManager.canManageUsers()) {
      this.showToast('Access restricted to Super Admin, Developer & Admin.', 'error');
      return;
    }

    this.renderUserManagementTable();
    const modal = document.getElementById('userMgmtModal');
    if (modal) modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeUserManagementModal() {
    const modal = document.getElementById('userMgmtModal');
    if (modal) modal.classList.add('hidden');
  }

  renderUserManagementTable() {
    const tbody = document.getElementById('userMgmtTableBody');
    if (!tbody || !window.authManager) return;

    const users = window.authManager.getAllUsers();
    
    // Update summary counts
    const totalEl = document.getElementById('mgmtStatTotalUsers');
    if (totalEl) totalEl.textContent = users.length;

    const cats = new Set(users.map(u => u.category));
    const catEl = document.getElementById('mgmtStatCategories');
    if (catEl) catEl.textContent = cats.size;

    const pendingCount = users.filter(u => u.mustChangePassword).length;
    const pendEl = document.getElementById('mgmtStatPendingChanges');
    if (pendEl) pendEl.textContent = pendingCount;

    tbody.innerHTML = users.map(u => {
      const roleObj = window.roleManager ? window.roleManager.getAllRoles().find(r => r.id === u.role) : null;
      const roleBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${roleObj ? roleObj.badgeClass : 'bg-slate-100 text-slate-700'}">${roleObj ? roleObj.name : u.role}</span>`;

      const passStatus = u.mustChangePassword 
        ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Temporary (Must Change)</span>`
        : `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Active & Verified</span>`;

      const isMasterAdmin = u.userId.toLowerCase() === 'admin';

      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
          <td class="py-2.5 px-3">
            <div class="font-bold text-slate-900">${this.escapeHtml(u.fullName)}</div>
            <div class="font-mono text-[11px] text-slate-500">ID: <strong class="text-slate-800">${this.escapeHtml(u.userId)}</strong></div>
          </td>
          <td class="py-2.5 px-3">
            <span class="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
              ${this.escapeHtml(u.category)}
            </span>
          </td>
          <td class="py-2.5 px-3">${roleBadge}</td>
          <td class="py-2.5 px-3">
            <div class="text-slate-700">${this.escapeHtml(u.email)}</div>
            <div class="text-[11px] text-slate-400 font-mono">${this.escapeHtml(u.phone || '-')}</div>
          </td>
          <td class="py-2.5 px-3">${passStatus}</td>
          <td class="py-2.5 px-3 text-center">
            <div class="flex items-center justify-center space-x-1.5">
              <button onclick="app.openEditUserModal('${this.escapeHtml(u.userId)}')" title="Edit User & Permissions" class="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-100 text-slate-600 hover:text-sky-700 transition">
                <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
              </button>
              ${isMasterAdmin ? '' : `
              <button onclick="app.confirmDeleteUser('${this.escapeHtml(u.userId)}')" title="Delete User" class="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
              `}
              <button onclick="app.issueUserPasswordReset('${this.escapeHtml(u.userId)}')" title="Send Reset OTP / Instructions to Mail" class="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition">
                <i data-lucide="mail" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="app.adminResetUserPassword('${this.escapeHtml(u.userId)}')" title="Direct Password Reset (Forces Change on Next Login)" class="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 transition">
                <i data-lucide="key" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  openEditUserModal(userId) {
    if (!window.authManager) return;
    const user = window.authManager.getUser(userId);
    if (!user) {
      this.showToast('User account not found.', 'error');
      return;
    }

    const idInput = document.getElementById('editUserId');
    const nameInput = document.getElementById('editUserFullName');
    const catInput = document.getElementById('editUserCategory');
    const roleInput = document.getElementById('editUserRole');
    const emailInput = document.getElementById('editUserEmail');
    const phoneInput = document.getElementById('editUserPhone');
    const statusInput = document.getElementById('editUserStatus');

    if (idInput) idInput.value = user.userId;
    if (nameInput) nameInput.value = user.fullName || '';
    if (catInput) catInput.value = user.category || 'Site Operations';
    if (roleInput) roleInput.value = user.role || 'employee';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (statusInput) statusInput.value = user.status || 'active';

    const modal = document.getElementById('editUserModal');
    if (modal) modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) modal.classList.add('hidden');
  }

  handleEditUser(e) {
    if (e) e.preventDefault();
    if (!window.authManager) return;

    const userId = document.getElementById('editUserId').value.trim();
    const fullName = document.getElementById('editUserFullName').value.trim();
    const category = document.getElementById('editUserCategory').value;
    const role = document.getElementById('editUserRole').value;
    const email = document.getElementById('editUserEmail').value.trim();
    const phone = document.getElementById('editUserPhone').value.trim();
    const status = document.getElementById('editUserStatus').value;

    const res = window.authManager.updateUser(userId, {
      fullName,
      category,
      role,
      email,
      phone,
      status
    });

    if (res.success) {
      this.closeEditUserModal();
      this.renderUserManagementTable();
      this.checkAuthUI();
      this.showToast(res.message, 'success');
    } else {
      this.showToast(res.error || 'Failed to update user', 'error');
    }
  }

  confirmDeleteUser(userId) {
    if (!window.authManager) return;
    if (userId.toLowerCase() === 'admin') {
      this.showToast('Super Administrator account ("admin") cannot be deleted.', 'error');
      return;
    }

    const ok = confirm(`Are you sure you want to permanently delete user "${userId}"? This action cannot be undone.`);
    if (!ok) return;

    const res = window.authManager.deleteUser(userId);
    if (res.success) {
      this.renderUserManagementTable();
      this.showToast(res.message, 'success');
    } else {
      this.showToast(res.error || 'Failed to delete user', 'error');
    }
  }

  openNewUserModal() {
    const modal = document.getElementById('newUserModal');
    const form = document.getElementById('newUserForm');
    if (form) form.reset();

    const passInput = document.getElementById('newUserTempPassword');
    if (passInput) passInput.value = window.authManager.generateSecureTempPassword();

    if (modal) modal.classList.remove('hidden');
    document.getElementById('newUserId')?.focus();
    if (window.lucide) window.lucide.createIcons();
  }

  closeNewUserModal() {
    const modal = document.getElementById('newUserModal');
    if (modal) modal.classList.add('hidden');
  }

  generateRandomTempPassword() {
    const passInput = document.getElementById('newUserTempPassword');
    if (passInput && window.authManager) {
      passInput.value = window.authManager.generateSecureTempPassword();
    }
  }

  handleCreateUser(e) {
    if (e) e.preventDefault();
    const userId = document.getElementById('newUserId').value.trim();
    const fullName = document.getElementById('newUserFullName').value.trim();
    const category = document.getElementById('newUserCategory').value;
    const role = document.getElementById('newUserRole').value;
    const email = document.getElementById('newUserEmail').value.trim();
    const phone = document.getElementById('newUserPhone').value.trim();
    const tempPassword = document.getElementById('newUserTempPassword').value.trim();

    const res = window.authManager.createUser({
      userId,
      fullName,
      category,
      role,
      email,
      phone,
      password: tempPassword
    });

    if (res.success) {
      this.closeNewUserModal();
      this.renderUserManagementTable();
      this.showToast(`User ${userId} created with temporary password "${tempPassword}". Forced change on first login enabled!`, 'success');
    } else {
      this.showToast(res.error || 'Failed to create user', 'error');
    }
  }

  issueUserPasswordReset(userId) {
    const res = window.authManager.issuePasswordReset(userId);
    if (res.success) {
      this.showToast(`Password reset OTP (${res.otpCode}) dispatched to ${res.email}!`, 'success');
    } else {
      this.showToast(res.error || 'Failed to issue reset', 'error');
    }
  }

  adminResetUserPassword(userId) {
    const newTemp = prompt(`Enter new temporary password for "${userId}":`, window.authManager.generateSecureTempPassword());
    if (newTemp && newTemp.trim()) {
      const res = window.authManager.adminResetPassword(userId, newTemp.trim());
      if (res.success) {
        this.renderUserManagementTable();
        this.showToast(res.message, 'success');
      } else {
        this.showToast(res.error || 'Failed to reset password', 'error');
      }
    }
  }

  downloadUserSQL() {
    const sql = window.authManager.generatePostgresUserSQL();
    const blob = new Blob([sql], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'dharshithan_users_seed.sql');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast('Downloaded dharshithan_users_seed.sql for PostgreSQL database!', 'success');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-white text-emerald-800 border-emerald-300 shadow-md',
      error: 'bg-white text-rose-800 border-rose-300 shadow-md',
      info: 'bg-white text-sky-800 border-sky-300 shadow-md'
    };

    const icons = {
      success: 'check-circle',
      error: 'alert-circle',
      info: 'info'
    };

    toast.className = `p-3 md:p-3.5 rounded-xl border shadow-lg flex items-center space-x-2.5 text-xs font-medium animate-fade-in pointer-events-auto transition-all ${colors[type] || colors.info}`;
    toast.innerHTML = `
      <i data-lucide="${icons[type] || 'info'}" class="w-4 h-4 flex-shrink-0"></i>
      <span>${this.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.app = new FinanceApp();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
