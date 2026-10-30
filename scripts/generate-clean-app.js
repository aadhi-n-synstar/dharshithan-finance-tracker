const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'js', 'app.js');

console.log('--- Generating Enterprise Zoho ERP Controller (js/app.js) ---');

const appJsContent = `/**
 * Dharshithan Waterproofing and Concrete Solutions
 * Enterprise Financial, Billing, Voucher & Tax Management Platform
 * Authentic Zoho ERP / Zoho Books Corporate Architecture
 * Powered by Neon Serverless PostgreSQL Native Engine
 */

class FinanceApp {
  constructor() {
    this.activeTab = 'dashboard';
    this.transactions = [];
    this.filteredTransactions = [];
    this.editingId = null;
    this.currentDetailId = null;

    // Table Pagination
    this.currentPage = 1;
    this.pageSize = 15;

    // Column Sorting
    this.sortColumn = 'date';
    this.sortOrder = 'desc';

    // Bulk Row Selection
    this.selectedTxnIds = new Set();

    // Party Segmentation
    this.partySegment = 'ALL';

    // Global Filters
    this.filters = {
      financialYear: 'ALL',
      quarter: 'ALL',
      type: 'ALL',
      mode: 'ALL',
      search: ''
    };

    // Cached lists for dedicated corporate views
    this.salesList = [];
    this.expensesList = [];
  }

  async init() {
    console.log('Initializing Dharshithan Enterprise Finance ERP...');
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

    // Initial data load
    await this.refreshData();

    // Real-time synchronization when user returns to window/tab
    window.addEventListener('focus', () => {
      this.refreshFromNeon({ silent: true });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.refreshFromNeon({ silent: true });
      }
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      } else if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const searchInput = document.getElementById('globalSearchInput');
        if (searchInput) searchInput.focus();
      } else if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.openTransactionModal();
      }
    });

    // URL Routing
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'add') {
      setTimeout(() => this.openTransactionModal(), 300);
    } else if (urlParams.get('tab')) {
      this.setActiveTab(urlParams.get('tab'));
    }

    // Enterprise 30-minute inactivity security lock
    this.setupInactivityTimer();

    // Lucide Icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    console.log('Dharshithan Finance ERP Initialized Successfully.');
  }

  setupInactivityTimer() {
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (window.authManager && window.authManager.isAuthenticated()) {
          window.authManager.logout();
          this.checkAuthUI();
          this.showToast('Session locked after 30 minutes of inactivity for security.', 'info');
        }
      }, 30 * 60 * 1000); // 30 minutes
    };

    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, reset, { passive: true });
    });
    reset();
  }

  // =========================================================================
  // DATA REFRESHING, FILTERING & METRICS
  // =========================================================================

  async refreshData() {
    this.transactions = await window.financeDB.getAll();
    this.updateFYDropdown();
    this.updatePartyDatalist();
    this.applyFilters();
  }

  async refreshFromNeon(options = {}) {
    const isSilent = options.silent === true;
    const syncBtn = document.getElementById('headerSyncBtn');
    const syncIcon = document.getElementById('headerSyncIcon');

    if (syncIcon) syncIcon.classList.add('animate-spin');

    try {
      this.transactions = await window.financeDB.getAll();
      this.updateFYDropdown();
      this.updatePartyDatalist();
      this.applyFilters();

      const bannerText = document.getElementById('lastSyncBannerText');
      if (bannerText) {
        const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        bannerText.textContent = \`Neon DB Connected • Synced \${timeStr}\`;
      }

      if (!isSilent) {
        this.showToast('Synchronized with Neon PostgreSQL Cloud Database', 'success');
      }
    } catch (err) {
      console.error('Neon sync error:', err);
      if (!isSilent) {
        this.showToast('Sync error: ' + err.message, 'error');
      }
    } finally {
      if (syncIcon) {
        setTimeout(() => syncIcon.classList.remove('animate-spin'), 600);
      }
    }
  }

  updateFYDropdown() {
    const fySet = new Set(['F.Y. 2026-27', 'F.Y. 2025-26']);
    this.transactions.forEach(t => {
      if (t.financialYear) fySet.add(t.financialYear);
    });

    const select = document.getElementById('filterFY');
    if (!select) return;

    const currentVal = select.value || this.filters.financialYear;
    select.innerHTML = '<option value="ALL">All Financial Years</option>';
    Array.from(fySet).sort().reverse().forEach(fy => {
      const opt = document.createElement('option');
      opt.value = fy;
      opt.textContent = fy;
      if (fy === currentVal) opt.selected = true;
      select.appendChild(opt);
    });
  }

  updatePartyDatalist() {
    let datalist = document.getElementById('parties-datalist');
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = 'parties-datalist';
      document.body.appendChild(datalist);
    }
    const parties = Array.from(new Set(this.transactions.map(t => t.partyName).filter(Boolean))).sort();
    datalist.innerHTML = parties.map(p => \`<option value="\${this.escapeHtml(p)}"></option>\`).join('');

    const modalParty = document.getElementById('modalParty');
    if (modalParty && !modalParty.getAttribute('list')) {
      modalParty.setAttribute('list', 'parties-datalist');
    }
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
    this.filters.search = searchInput ? searchInput.value.trim() : '';

    this.applyFilters();
  }

  applyFilters() {
    this.filteredTransactions = this.transactions.filter(t => {
      if (this.filters.financialYear !== 'ALL' && t.financialYear !== this.filters.financialYear) return false;
      if (this.filters.quarter !== 'ALL' && t.quarter !== this.filters.quarter) return false;
      
      if (this.filters.type !== 'ALL') {
        const isIncome = t.type.includes('Received') || t.type.includes('Income');
        if (this.filters.type === 'Received / Income' && !isIncome) return false;
        if (this.filters.type === 'Paid / Expense' && isIncome) return false;
      }

      if (this.filters.mode !== 'ALL') {
        const tMode = (t.mode || '').toUpperCase();
        if (tMode !== this.filters.mode.toUpperCase()) return false;
      }

      if (this.filters.search) {
        const q = this.filters.search.toLowerCase();
        const inParty = (t.partyName || '').toLowerCase().includes(q);
        const inDesc = (t.description || '').toLowerCase().includes(q);
        const inRef = (t.refNumber || '').toLowerCase().includes(q);
        const inCat = (t.category || '').toLowerCase().includes(q);
        const inAmt = String(t.amount || '').includes(q);
        const inSl = String(t.slNo || '').includes(q);
        if (!inParty && !inDesc && !inRef && !inCat && !inAmt && !inSl) return false;
      }

      return true;
    });

    this.currentPage = 1;
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

  // =========================================================================
  // NAVIGATION & COLLAPSIBLE SIDEBAR
  // =========================================================================

  toggleSidebar() {
    const sidebar = document.getElementById('erpSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!sidebar) return;

    if (sidebar.classList.contains('-translate-x-full')) {
      sidebar.classList.remove('-translate-x-full');
      if (backdrop) backdrop.classList.remove('hidden');
    } else {
      sidebar.classList.add('-translate-x-full');
      if (backdrop) backdrop.classList.add('hidden');
    }
  }

  closeSidebar() {
    const sidebar = document.getElementById('erpSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (backdrop) backdrop.classList.add('hidden');
  }

  setActiveTab(tabName) {
    this.activeTab = tabName;

    // Breadcrumb updates
    const breadcrumbEl = document.getElementById('topBarBreadcrumb');
    const titles = {
      dashboard: 'Dashboard',
      transactions: 'General Ledger',
      sales: 'Sales & Invoices',
      expenses: 'Purchases & Expenses',
      banking: 'Banking & Liquidity',
      parties: 'Parties & Contacts',
      reports: 'Financial Reports'
    };
    if (breadcrumbEl && titles[tabName]) {
      breadcrumbEl.textContent = titles[tabName];
    }

    // Sidebar active item styling
    const tabs = ['dashboard', 'transactions', 'sales', 'expenses', 'banking', 'parties', 'reports'];
    tabs.forEach(t => {
      const sideItem = document.getElementById(\`side-tab-\${t}\`);
      const isActive = t === tabName;
      if (sideItem) {
        if (isActive) {
          sideItem.classList.add('erp-sidebar-item-active');
        } else {
          sideItem.classList.remove('erp-sidebar-item-active');
        }
      }

      const view = document.getElementById(\`view-\${t}\`);
      if (view) {
        if (isActive) {
          view.classList.remove('hidden');
        } else {
          view.classList.add('hidden');
        }
      }
    });

    this.closeSidebar();
    this.renderCurrentView();

    // Scroll to top of content
    const mainScroll = document.getElementById('erpMainScroll');
    if (mainScroll) mainScroll.scrollTop = 0;
  }

  handleGlobalSearch(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      this.filters.search = '';
      this.applyFilters();
      return;
    }

    this.filters.search = q;
    if (this.activeTab === 'dashboard') {
      this.setActiveTab('transactions');
    } else {
      this.applyFilters();
    }
  }

  toggleQuickCreateMenu() {
    const menu = document.getElementById('quickCreateMenu');
    if (menu) menu.classList.toggle('hidden');
  }

  closeQuickCreateMenu() {
    const menu = document.getElementById('quickCreateMenu');
    if (menu) menu.classList.add('hidden');
  }

  openOrgDetailsModal() {
    const modal = document.getElementById('orgDetailsModal');
    if (modal) modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeOrgDetailsModal() {
    const modal = document.getElementById('orgDetailsModal');
    if (modal) modal.classList.add('hidden');
  }

  // =========================================================================
  // VIEW 1: DASHBOARD CONTROLLER
  // =========================================================================

  renderDashboard() {
    const metrics = FinanceAnalytics.calculateDashboardMetrics(this.filteredTransactions);

    // 4 Top Executive KPI Cards
    const elRev = document.getElementById('kpi-total-revenue');
    if (elRev) elRev.textContent = FinanceAnalytics.formatINR(metrics.totalIncome);

    const elExp = document.getElementById('kpi-total-expenses');
    if (elExp) elExp.textContent = FinanceAnalytics.formatINR(metrics.totalExpense);

    const elProf = document.getElementById('kpi-net-profit');
    if (elProf) {
      elProf.textContent = FinanceAnalytics.formatINR(metrics.netProfit);
      elProf.className = \`font-mono text-lg sm:text-2xl font-bold \${metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}\`;
    }

    const elLiq = document.getElementById('kpi-total-liquidity');
    if (elLiq) elLiq.textContent = FinanceAnalytics.formatINR(metrics.totalLiquidity);

    // Bank & Cash Position Cards
    const elBankBal = document.getElementById('cardBankBalance');
    if (elBankBal) elBankBal.textContent = FinanceAnalytics.formatINR(metrics.bankPosition);

    const elCashBal = document.getElementById('cardCashBalance');
    if (elCashBal) elCashBal.textContent = FinanceAnalytics.formatINR(metrics.cashBalance);

    const elTotLiq = document.getElementById('cardTotalLiquidity');
    if (elTotLiq) elTotLiq.textContent = FinanceAnalytics.formatINR(metrics.totalLiquidity);

    // Cashflow Chart
    if (window.FinanceCharts) {
      const summary = FinanceAnalytics.getFYQuarterSummary(this.transactions);
      window.FinanceCharts.renderCashflowChart('cashflowChart', summary);
    }

    // Recent Transactions Table (Latest 8 entries)
    const recentBody = document.getElementById('dashboardRecentTableBody');
    if (recentBody) {
      const recentTxns = [...this.filteredTransactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date) || (b.slNo || 0) - (a.slNo || 0))
        .slice(0, 8);

      if (recentTxns.length === 0) {
        recentBody.innerHTML = \`
          <tr>
            <td colspan="6" class="p-8 text-center text-slate-400 font-medium">
              No recent transactions recorded in this period.
            </td>
          </tr>
        \`;
      } else {
        recentBody.innerHTML = recentTxns.map(t => {
          const isIncome = t.type && (t.type.includes('Received') || t.type.includes('Income'));
          const typeBadge = isIncome
            ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Invoice</span>'
            : '<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Voucher</span>';

          const amtClass = isIncome ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold';
          const amtPrefix = isIncome ? '+' : '-';

          return \`
            <tr class="hover:bg-slate-50 transition border-b border-slate-100 text-xs">
              <td class="py-2.5 px-3 font-mono text-slate-500 font-semibold">#\${t.slNo}</td>
              <td class="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono">\${FinanceAnalytics.formatDateDisplay(t.date)}</td>
              <td class="py-2.5 px-3">\${typeBadge}</td>
              <td class="py-2.5 px-3 font-bold text-slate-900 cursor-pointer hover:text-sky-600 transition" onclick="app.openPartyModal('\${this.escapeHtml(t.partyName)}')">
                \${this.escapeHtml(t.partyName)}
              </td>
              <td class="py-2.5 px-3 text-right font-mono \${amtClass}">
                \${amtPrefix}\${FinanceAnalytics.formatINR(t.amount)}
              </td>
              <td class="py-2.5 px-3 text-center">
                <button onclick="app.printTaxInvoice('\${t.id}')" title="Print Commercial Tax Invoice / Voucher" class="p-1 rounded-lg text-sky-600 hover:bg-sky-50 transition cursor-pointer">
                  <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                </button>
              </td>
            </tr>
          \`;
        }).join('');
      }
    }
  }

  // =========================================================================
  // VIEW 2: GENERAL LEDGER (TABLE WITH SORTING, BULK ACTIONS & PAGINATION)
  // =========================================================================

  sortByColumn(column) {
    if (this.sortColumn === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortOrder = (column === 'date' || column === 'slNo') ? 'desc' : 'asc';
    }
    this.updateSortIcons();
    this.renderTransactionsTable();
  }

  updateSortIcons() {
    ['slNo', 'date', 'partyName', 'amount'].forEach(col => {
      const icon = document.getElementById(\`sort-icon-\${col}\`);
      if (icon) {
        if (this.sortColumn === col) {
          icon.textContent = this.sortOrder === 'asc' ? '▲' : '▼';
          icon.className = 'text-sky-600 font-bold';
        } else {
          icon.textContent = '⇅';
          icon.className = 'text-slate-400';
        }
      }
    });
  }

  setPageSize(size) {
    this.pageSize = (size === 'ALL') ? 999999 : parseInt(size, 10);
    this.currentPage = 1;
    this.renderTransactionsTable();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderTransactionsTable();
    }
  }

  nextPage() {
    const totalPages = Math.ceil(this.filteredTransactions.length / this.pageSize) || 1;
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.renderTransactionsTable();
    }
  }

  toggleSelectAll(checked) {
    const pageItems = this.getPagedTransactions();
    pageItems.forEach(t => {
      if (checked) {
        this.selectedTxnIds.add(t.id);
      } else {
        this.selectedTxnIds.delete(t.id);
      }
    });

    const checkboxes = document.querySelectorAll('.txn-row-checkbox');
    checkboxes.forEach(cb => { cb.checked = checked; });

    this.updateBulkActionBar();
  }

  handleRowSelect(id, checked) {
    if (checked) {
      this.selectedTxnIds.add(id);
    } else {
      this.selectedTxnIds.delete(id);
    }
    this.updateBulkActionBar();
  }

  updateBulkActionBar() {
    const bar = document.getElementById('bulkActionBar');
    const countEl = document.getElementById('bulkSelectedCount');
    const selectAllCb = document.getElementById('selectAllTxns');

    const count = this.selectedTxnIds.size;
    if (countEl) countEl.textContent = \`\${count} transaction\${count === 1 ? '' : 's'} selected\`;

    if (bar) {
      if (count > 0) {
        bar.classList.remove('hidden');
      } else {
        bar.classList.add('hidden');
      }
    }

    if (selectAllCb) {
      const pageItems = this.getPagedTransactions();
      const allSelected = pageItems.length > 0 && pageItems.every(t => this.selectedTxnIds.has(t.id));
      selectAllCb.checked = allSelected;
    }
  }

  clearRowSelection() {
    this.selectedTxnIds.clear();
    const selectAllCb = document.getElementById('selectAllTxns');
    if (selectAllCb) selectAllCb.checked = false;

    const checkboxes = document.querySelectorAll('.txn-row-checkbox');
    checkboxes.forEach(cb => { cb.checked = false; });

    this.updateBulkActionBar();
  }

  bulkExportCSV() {
    const selected = this.transactions.filter(t => this.selectedTxnIds.has(t.id));
    if (selected.length === 0) {
      this.showToast('Please select transactions to export', 'info');
      return;
    }
    FinanceDataTransfer.exportToCSV(selected);
    this.showToast(\`Exported \${selected.length} transactions as CSV\`, 'success');
  }

  async bulkDeleteSelected() {
    if (window.roleManager && !window.roleManager.can('canDelete')) {
      this.showToast('Your role does not have permission to delete transactions.', 'error');
      return;
    }

    const count = this.selectedTxnIds.size;
    if (count === 0) return;

    if (!confirm(\`Are you sure you want to permanently delete \${count} selected transactions from Neon Cloud Database? This action cannot be undone.\`)) {
      return;
    }

    try {
      const idsToDelete = Array.from(this.selectedTxnIds);
      for (const id of idsToDelete) {
        await window.financeDB.delete(id);
      }
      this.clearRowSelection();
      this.showToast(\`Successfully deleted \${count} transactions from Neon DB\`, 'info');
      await this.refreshData();
    } catch (err) {
      console.error(err);
      this.showToast('Error during bulk delete: ' + err.message, 'error');
    }
  }

  getPagedTransactions() {
    const list = [...this.filteredTransactions];

    // Sorting
    list.sort((a, b) => {
      let valA = a[this.sortColumn];
      let valB = b[this.sortColumn];

      if (this.sortColumn === 'slNo' || this.sortColumn === 'amount') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (this.sortColumn === 'date') {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  renderTransactionsTable() {
    const tbody = document.getElementById('txnTableBody');
    const emptyState = document.getElementById('txnEmptyState');
    if (!tbody) return;

    if (this.filteredTransactions.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      this.updateTableFooters(0, 0, 0);
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    const pageItems = this.getPagedTransactions();
    const canEdit = window.roleManager ? window.roleManager.can('canEdit') : false;
    const canDelete = window.roleManager ? window.roleManager.can('canDelete') : false;

    tbody.innerHTML = pageItems.map(t => {
      const isIncome = t.type && (t.type.includes('Received') || t.type.includes('Income'));
      const typeBadge = isIncome
        ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">Received</span>'
        : '<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">Paid</span>';

      const amtClass = isIncome ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold';
      const amtPrefix = isIncome ? '+' : '-';
      const isChecked = this.selectedTxnIds.has(t.id);

      // Extract human-readable description if packed as JSON
      let displayDesc = t.description || '';
      if (displayDesc.startsWith('{') && displayDesc.endsWith('}')) {
        try {
          const p = JSON.parse(displayDesc);
          displayDesc = p.remarks || (p.items && p.items[0] ? p.items[0].description : '') || 'GST Tax Invoice';
        } catch (e) {}
      }

      return \`
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs">
          <td class="py-2.5 px-3 text-center">
            <input type="checkbox" onchange="app.handleRowSelect('\${t.id}', this.checked)" \${isChecked ? 'checked' : ''} class="txn-row-checkbox rounded text-sky-600 focus:ring-sky-500 cursor-pointer">
          </td>
          <td class="py-2.5 px-3 font-mono text-slate-500 font-semibold whitespace-nowrap">#\${t.slNo}</td>
          <td class="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">\${FinanceAnalytics.formatDateDisplay(t.date)}</td>
          <td class="py-2.5 px-3">\${typeBadge}</td>
          <td class="py-2.5 px-3.5 font-bold text-slate-900 cursor-pointer hover:text-sky-600 transition" onclick="app.openPartyModal('\${this.escapeHtml(t.partyName)}')">
            <div>\${this.escapeHtml(t.partyName)}</div>
            \${displayDesc ? \`<div class="text-[10px] font-normal text-slate-400 truncate max-w-xs">\${this.escapeHtml(displayDesc)}</div>\` : ''}
          </td>
          <td class="py-2.5 px-3 text-slate-600">
            <span class="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-700 font-medium">
              \${this.escapeHtml(t.category || 'General')}
            </span>
          </td>
          <td class="py-2.5 px-3 text-slate-700 font-semibold text-[11px]">\${t.mode || 'CASH'}</td>
          <td class="py-2.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">\${this.escapeHtml(t.refNumber || '-')}</td>
          <td class="py-2.5 px-3.5 text-right font-mono \${amtClass} whitespace-nowrap">
            \${amtPrefix}\${FinanceAnalytics.formatINR(t.amount)}
          </td>
          <td class="py-2.5 px-3 text-center whitespace-nowrap">
            <div class="inline-flex items-center space-x-1">
              <button onclick="app.printTaxInvoice('\${t.id}')" title="Print Commercial Tax Invoice / Voucher" class="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition cursor-pointer">
                <i data-lucide="printer" class="w-3.5 h-3.5"></i>
              </button>
              \${canEdit ? \`
                <button onclick="app.openTransactionModal('\${t.id}')" title="Edit Transaction" class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                </button>
              \` : ''}
              \${canDelete ? \`
                <button onclick="app.deleteTransaction('\${t.id}')" title="Delete Transaction" class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              \` : ''}
            </div>
          </td>
        </tr>
      \`;
    }).join('');

    // Update Totals and Pagination Bar
    let totalIn = 0;
    let totalOut = 0;
    this.filteredTransactions.forEach(t => {
      const isInc = t.type && (t.type.includes('Received') || t.type.includes('Income'));
      const val = Number(t.amount) || 0;
      if (isInc) totalIn += val;
      else totalOut += val;
    });

    this.updateTableFooters(totalIn, totalOut, totalIn - totalOut);
    this.updatePaginationUI();
    this.updateSortIcons();
    this.updateBulkActionBar();
  }

  updateTableFooters(inflow, outflow, net) {
    const elCount = document.getElementById('txnFilteredCount');
    if (elCount) elCount.textContent = this.filteredTransactions.length;

    const elIn = document.getElementById('txnFooterInflow');
    if (elIn) elIn.textContent = FinanceAnalytics.formatINR(inflow);

    const elOut = document.getElementById('txnFooterOutflow');
    if (elOut) elOut.textContent = FinanceAnalytics.formatINR(outflow);

    const elNet = document.getElementById('txnFooterNet');
    if (elNet) {
      elNet.textContent = FinanceAnalytics.formatINR(net);
      elNet.className = \`font-bold \${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}\`;
    }
  }

  updatePaginationUI() {
    const totalPages = Math.ceil(this.filteredTransactions.length / this.pageSize) || 1;
    const pageIndicator = document.getElementById('pageIndicator');
    if (pageIndicator) {
      pageIndicator.textContent = \`Page \${this.currentPage} of \${totalPages}\`;
    }

    const btnPrev = document.getElementById('btnPrevPage');
    if (btnPrev) btnPrev.disabled = this.currentPage <= 1;

    const btnNext = document.getElementById('btnNextPage');
    if (btnNext) btnNext.disabled = this.currentPage >= totalPages;
  }

  exportCSV() {
    if (this.filteredTransactions.length === 0) {
      this.showToast('No transactions to export', 'info');
      return;
    }
    FinanceDataTransfer.exportToCSV(this.filteredTransactions);
    this.showToast(\`Exported \${this.filteredTransactions.length} transactions as CSV\`, 'success');
  }

  // =========================================================================
  // VIEW 3: SALES & CUSTOMER INVOICES
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

    tbody.innerHTML = list.map((t, idx) => \`
      <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs">
        <td class="py-3 px-3.5 font-mono text-slate-500 font-semibold">#\${t.slNo || (idx + 1)}</td>
        <td class="py-3 px-3.5 font-mono text-slate-700 whitespace-nowrap">\${FinanceAnalytics.formatDateDisplay(t.date)}</td>
        <td class="py-3 px-3.5 font-bold text-slate-900 cursor-pointer hover:text-sky-600 transition" onclick="app.openPartyModal('\${this.escapeHtml(t.partyName)}')">
          <div>\${this.escapeHtml(t.partyName)}</div>
          \${t.description ? \`<div class="text-[10px] font-normal text-slate-400 truncate max-w-xs">\${this.escapeHtml(t.description)}</div>\` : ''}
        </td>
        <td class="py-3 px-3.5">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            \${this.escapeHtml(t.category || 'General Invoicing')}
          </span>
        </td>
        <td class="py-3 px-3.5 font-semibold text-slate-700 text-[11px]">\${t.mode || 'CASH'}</td>
        <td class="py-3 px-3.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">\${this.escapeHtml(t.refNumber || '-')}</td>
        <td class="py-3 px-3.5 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
          +\${FinanceAnalytics.formatINR(t.amount)}
        </td>
        <td class="py-3 px-3.5 text-center whitespace-nowrap">
          <div class="inline-flex items-center space-x-1">
            <button onclick="app.printTaxInvoice('\${t.id}')" title="Print Commercial Tax Invoice" class="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition cursor-pointer">
              <i data-lucide="printer" class="w-3.5 h-3.5"></i>
            </button>
            \${canEdit ? \`
              <button onclick="app.openTransactionModal('\${t.id}')" title="Edit Invoice" class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              </button>
            \` : ''}
            \${canDelete ? \`
              <button onclick="app.deleteTransaction('\${t.id}')" title="Delete Invoice" class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            \` : ''}
          </div>
        </td>
      </tr>
    \`).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // =========================================================================
  // VIEW 4: PURCHASES & OPERATING EXPENSES
  // =========================================================================

  renderExpensesView() {
    const rawExpenses = (this.filteredTransactions || []).filter(t => 
      t.type && (t.type.toLowerCase().includes('paid') || t.type.toLowerCase().includes('expense'))
    );
    this.expensesList = rawExpenses;

    const totalExpenses = rawExpenses.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const count = rawExpenses.length;
    const avg = count > 0 ? (totalExpenses / count) : 0;

    // Find top cost category
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

    tbody.innerHTML = list.map((t, idx) => \`
      <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs">
        <td class="py-3 px-3.5 font-mono text-slate-500 font-semibold">#\${t.slNo || (idx + 1)}</td>
        <td class="py-3 px-3.5 font-mono text-slate-700 whitespace-nowrap">\${FinanceAnalytics.formatDateDisplay(t.date)}</td>
        <td class="py-3 px-3.5 font-bold text-slate-900 cursor-pointer hover:text-sky-600 transition" onclick="app.openPartyModal('\${this.escapeHtml(t.partyName)}')">
          <div>\${this.escapeHtml(t.partyName)}</div>
          \${t.description ? \`<div class="text-[10px] font-normal text-slate-400 truncate max-w-xs">\${this.escapeHtml(t.description)}</div>\` : ''}
        </td>
        <td class="py-3 px-3.5">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            \${this.escapeHtml(t.category || 'Site Overhead')}
          </span>
        </td>
        <td class="py-3 px-3.5 font-semibold text-slate-700 text-[11px]">\${t.mode || 'CASH'}</td>
        <td class="py-3 px-3.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">\${this.escapeHtml(t.refNumber || '-')}</td>
        <td class="py-3 px-3.5 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
          -\${FinanceAnalytics.formatINR(t.amount)}
        </td>
        <td class="py-3 px-3.5 text-center whitespace-nowrap">
          <div class="inline-flex items-center space-x-1">
            <button onclick="app.printTaxInvoice('\${t.id}')" title="Print Payment Voucher" class="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition cursor-pointer">
              <i data-lucide="printer" class="w-3.5 h-3.5"></i>
            </button>
            \${canEdit ? \`
              <button onclick="app.openTransactionModal('\${t.id}')" title="Edit Voucher" class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              </button>
            \` : ''}
            \${canDelete ? \`
              <button onclick="app.deleteTransaction('\${t.id}')" title="Delete Voucher" class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            \` : ''}
          </div>
        </td>
      </tr>
    \`).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // =========================================================================
  // VIEW 5: BANKING & LIQUIDITY RECONCILIATION
  // =========================================================================

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

        return \`
          <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition shadow-xs space-y-2">
            <div class="flex items-center space-x-2 text-slate-700">
              <i data-lucide="\${ch.icon}" class="w-4 h-4 text-\${ch.color}-600"></i>
              <span class="text-xs font-bold truncate">\${ch.name}</span>
            </div>
            <div class="space-y-1 font-mono text-xs">
              <div class="flex justify-between text-slate-500 text-[11px]">
                <span>Inflows:</span>
                <span class="text-emerald-600 font-semibold">\${FinanceAnalytics.formatINR(inAmt)}</span>
              </div>
              <div class="flex justify-between text-slate-500 text-[11px]">
                <span>Outflows:</span>
                <span class="text-rose-600 font-semibold">\${FinanceAnalytics.formatINR(outAmt)}</span>
              </div>
              <div class="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
                <span>Net Channel:</span>
                <span class="\${netAmt >= 0 ? 'text-emerald-700' : 'text-rose-700'}">\${FinanceAnalytics.formatINR(netAmt)}</span>
              </div>
            </div>
          </div>
        \`;
      }).join('');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  openFloatModal() {
    const modal = document.getElementById('floatModal');
    if (!modal) return;

    const bankInput = document.getElementById('inputBankFloat');
    const cashInput = document.getElementById('inputCashFloat');

    if (bankInput) bankInput.value = FinanceAnalytics.openingBankBalance || 0;
    if (cashInput) cashInput.value = FinanceAnalytics.openingCashFloat || 0;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeFloatModal() {
    const modal = document.getElementById('floatModal');
    if (modal) modal.classList.add('hidden');
  }

  saveFloatAdjustments(e) {
    e.preventDefault();

    const bankVal = parseFloat(document.getElementById('inputBankFloat')?.value) || 0;
    const cashVal = parseFloat(document.getElementById('inputCashFloat')?.value) || 0;

    FinanceAnalytics.openingBankBalance = bankVal;
    FinanceAnalytics.openingCashFloat = cashVal;

    try {
      localStorage.setItem('dharshithan_opening_bank', bankVal);
      localStorage.setItem('dharshithan_opening_cash', cashVal);
    } catch (err) {}

    this.showToast('Float reserves updated successfully', 'success');
    this.closeFloatModal();
    this.renderBankingView();
    this.renderDashboard();
  }

  // =========================================================================
  // VIEW 6: PARTIES & CONTACTS DIRECTORY
  // =========================================================================

  filterPartySegment(segment) {
    this.partySegment = segment;

    ['all', 'customer', 'vendor'].forEach(s => {
      const btn = document.getElementById(\`party-seg-\${s}\`);
      if (btn) {
        if (s.toUpperCase() === segment.toUpperCase()) {
          btn.className = 'px-2.5 py-1 rounded-md bg-white shadow-xs text-slate-900 font-bold';
        } else {
          btn.className = 'px-2.5 py-1 rounded-md hover:text-slate-900 font-semibold text-slate-600';
        }
      }
    });

    this.renderParties();
  }

  renderParties() {
    const grid = document.getElementById('parties-grid');
    if (!grid) return;

    let parties = FinanceAnalytics.getPartySummary(this.transactions);

    // Segment filtering
    if (this.partySegment === 'CUSTOMER') {
      parties = parties.filter(p => p.totalReceived >= p.totalPaid);
    } else if (this.partySegment === 'VENDOR') {
      parties = parties.filter(p => p.totalPaid > p.totalReceived);
    }

    if (parties.length === 0) {
      grid.innerHTML = \`<div class="col-span-3 py-12 text-center text-slate-400 font-medium text-xs">No contacts match the selected segment.</div>\`;
      return;
    }

    grid.innerHTML = parties.map(p => {
      const isCustomer = p.totalReceived >= p.totalPaid;
      const statusBadge = isCustomer
        ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Customer</span>'
        : '<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Vendor</span>';

      return \`
        <div class="erp-card p-4 space-y-3 cursor-pointer hover:border-slate-300 transition shadow-xs" onclick="app.openPartyModal('\${this.escapeHtml(p.name)}')">
          <div class="flex items-start justify-between">
            <div>
              <h4 class="font-bold text-slate-900 text-sm hover:text-sky-600 transition">\${this.escapeHtml(p.name)}</h4>
              <p class="text-[11px] text-slate-500 mt-0.5">\${p.transactionCount} transactions | Last: \${FinanceAnalytics.formatDateDisplay(p.lastDate)}</p>
            </div>
            \${statusBadge}
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Total Inflow</span>
              <span class="font-mono text-emerald-600 font-bold">\${FinanceAnalytics.formatINR(p.totalReceived)}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Total Outflow</span>
              <span class="font-mono text-rose-600 font-bold">\${FinanceAnalytics.formatINR(p.totalPaid)}</span>
            </div>
          </div>

          <div class="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
            <span class="text-slate-500 font-medium">Running Balance:</span>
            <span class="font-mono font-bold \${p.netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
              \${FinanceAnalytics.formatINR(p.netBalance)}
            </span>
          </div>
        </div>
      \`;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  openPartyModal(partyName) {
    const modal = document.getElementById('partyModal');
    if (!modal) return;

    const partyTxns = this.transactions
      .filter(t => (t.partyName || '').trim().toLowerCase() === (partyName || '').trim().toLowerCase())
      .sort((a, b) => new Date(a.date) - new Date(b.date) || (a.slNo || 0) - (b.slNo || 0));

    let totalReceived = 0;
    let totalPaid = 0;
    let runningBalance = 0;

    const titleEl = document.getElementById('partyModalTitle');
    if (titleEl) titleEl.textContent = partyName;

    const tbody = document.getElementById('partyModalTable');
    if (tbody) {
      if (partyTxns.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400">No records found for this contact.</td></tr>';
      } else {
        tbody.innerHTML = partyTxns.map(t => {
          const isIncome = t.type && (t.type.includes('Received') || t.type.includes('Income'));
          const amt = Number(t.amount) || 0;
          let debit = 0;
          let credit = 0;
          if (isIncome) {
            credit = amt;
            totalReceived += amt;
            runningBalance += amt;
          } else {
            debit = amt;
            totalPaid += amt;
            runningBalance -= amt;
          }

          const balClass = runningBalance >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold';

          return \`
            <tr class="hover:bg-slate-50 transition border-b border-slate-100 text-xs">
              <td class="p-2.5 font-mono text-slate-600 whitespace-nowrap">\${FinanceAnalytics.formatDateDisplay(t.date)}</td>
              <td class="p-2.5 font-mono text-slate-500">\${t.refNumber || '#' + t.slNo}</td>
              <td class="p-2.5 text-slate-800">\${this.escapeHtml(t.description || t.category || '-')}</td>
              <td class="p-2.5 text-right font-mono text-rose-600">\${debit > 0 ? FinanceAnalytics.formatINR(debit) : '-'}</td>
              <td class="p-2.5 text-right font-mono text-emerald-600">\${credit > 0 ? FinanceAnalytics.formatINR(credit) : '-'}</td>
              <td class="p-2.5 text-right font-mono \${balClass}">₹ \${runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          \`;
        }).join('');
      }
    }

    const elRec = document.getElementById('partyModalReceived');
    if (elRec) elRec.textContent = FinanceAnalytics.formatINR(totalReceived);

    const elPaid = document.getElementById('partyModalPaid');
    if (elPaid) elPaid.textContent = FinanceAnalytics.formatINR(totalPaid);

    const elNet = document.getElementById('partyModalNet');
    if (elNet) {
      elNet.textContent = FinanceAnalytics.formatINR(totalReceived - totalPaid);
      elNet.className = \`font-mono text-lg font-bold \${(totalReceived - totalPaid) >= 0 ? 'text-emerald-600' : 'text-rose-600'}\`;
    }

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closePartyModal() {
    const modal = document.getElementById('partyModal');
    if (modal) modal.classList.add('hidden');
  }

  // =========================================================================
  // VIEW 7: PROFIT & LOSS & GST TAX REPORTS
  // =========================================================================

  renderReports() {
    const container = document.getElementById('fy-summary-container');
    if (!container) return;

    const fySummaries = FinanceAnalytics.getFYQuarterSummary(this.transactions);
    const fyKeys = Object.keys(fySummaries).sort().reverse();

    // GST Tax Position Calculation
    const rawSales = (this.transactions || []).filter(t => t.type && (t.type.includes('Received') || t.type.includes('Income')));
    const rawExpenses = (this.transactions || []).filter(t => t.type && (t.type.includes('Paid') || t.type.includes('Expense')));

    const totalTaxableTurnover = rawSales.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const outputTax = Math.round(totalTaxableTurnover * 0.18 * 100) / 100;
    const totalBusinessExpenses = rawExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const inputCredit = Math.round(totalBusinessExpenses * 0.18 * 100) / 100;
    const netTaxPayable = Math.max(0, outputTax - inputCredit);

    const elTurnover = document.getElementById('gstTaxableTurnover');
    if (elTurnover) elTurnover.textContent = FinanceAnalytics.formatINR(totalTaxableTurnover);

    const elOutput = document.getElementById('gstOutputTax');
    if (elOutput) elOutput.textContent = FinanceAnalytics.formatINR(outputTax);

    const elInput = document.getElementById('gstInputCredit');
    if (elInput) elInput.textContent = FinanceAnalytics.formatINR(inputCredit);

    const elNetGst = document.getElementById('gstNetPayable');
    if (elNetGst) elNetGst.textContent = FinanceAnalytics.formatINR(netTaxPayable);

    if (fyKeys.length === 0) {
      container.innerHTML = '<div class="p-8 text-center text-slate-400 font-medium text-xs">No financial data to generate reports.</div>';
      return;
    }

    container.innerHTML = fyKeys.map(fy => {
      const data = fySummaries[fy];
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

      const quarterRows = quarters.map(q => {
        const qData = data.quarters[q];
        const profitClass = qData.profit >= 0 ? 'text-emerald-600' : 'text-rose-600';
        return \`
          <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs">
            <td class="py-2.5 px-4 font-semibold text-slate-800">\${q}</td>
            <td class="py-2.5 px-4 font-mono text-emerald-600">\${FinanceAnalytics.formatINR(qData.income)}</td>
            <td class="py-2.5 px-4 font-mono text-rose-600">\${FinanceAnalytics.formatINR(qData.expense)}</td>
            <td class="py-2.5 px-4 font-mono font-bold \${profitClass}">\${FinanceAnalytics.formatINR(qData.profit)}</td>
            <td class="py-2.5 px-4 text-slate-500">\${qData.count} entries</td>
          </tr>
        \`;
      }).join('');

      return \`
        <div class="erp-card p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-base font-bold text-slate-900">\${fy} Statement of Profit & Loss</h3>
              <p class="text-xs text-slate-500">Comprehensive statutory summary</p>
            </div>
            <div class="text-right">
              <span class="text-xs font-semibold text-slate-500 block">FY Net Margin</span>
              <span class="font-mono text-base font-bold \${data.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
                \${FinanceAnalytics.formatINR(data.totalProfit)}
              </span>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="erp-table text-xs">
              <thead>
                <tr>
                  <th>Financial Quarter</th>
                  <th>Total Revenue (Inflows)</th>
                  <th>Operating Costs (Outflows)</th>
                  <th>Net Surplus / Deficit</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                \${quarterRows}
              </tbody>
            </table>
          </div>
        </div>
      \`;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  exportComprehensiveReportCSV() {
    if (this.transactions.length === 0) {
      this.showToast('No transaction data to export', 'info');
      return;
    }

    const headers = [
      'Sl No',
      'Date',
      'Document Type',
      'Ref Number',
      'Party Name',
      'Category',
      'Payment Mode',
      'Taxable Value (INR)',
      'GST Rate',
      'Output Tax (18%)',
      'Input Tax Credit (18%)',
      'Gross Total (INR)',
      'Quarter',
      'Financial Year'
    ];

    const rows = this.transactions.map(t => {
      const isInc = t.type && (t.type.includes('Received') || t.type.includes('Income'));
      const amt = Number(t.amount) || 0;
      const subtotal = Math.round((amt / 1.18) * 100) / 100;
      const tax = Math.round((amt - subtotal) * 100) / 100;

      return [
        t.slNo || 0,
        \`"\${FinanceAnalytics.formatDateDisplay(t.date)}"\`,
        \`"\${t.type}"\`,
        \`"\${(t.refNumber || '').replace(/"/g, '""')}"\`,
        \`"\${(t.partyName || '').replace(/"/g, '""')}"\`,
        \`"\${(t.category || '').replace(/"/g, '""')}"\`,
        \`"\${t.mode || 'CASH'}"\`,
        subtotal.toFixed(2),
        '18%',
        isInc ? tax.toFixed(2) : '0.00',
        !isInc ? tax.toFixed(2) : '0.00',
        amt.toFixed(2),
        \`"\${t.quarter || 'Q3'}"\`,
        \`"\${t.financialYear || 'F.Y. 2026-27'}"\`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\\r\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = \`dharshithan_financial_audit_report_\${new Date().toISOString().slice(0, 10)}.csv\`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast('Downloaded comprehensive financial audit CSV report', 'success');
  }

  // =========================================================================
  // GST TAX INVOICING & PAYMENT VOUCHER ENGINE (MULTI-LINE ITEMS)
  // =========================================================================

  addLineItemRow(item = null) {
    const tbody = document.getElementById('lineItemsTableBody');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100 text-xs';

    const desc = item ? item.description : 'Waterproofing Treatment & Structural Grouting Services';
    const hsn = item ? item.hsn : '9954';
    const qty = item ? item.qty : 1;
    const unit = item ? item.unit : 'Sq.Ft';
    const rate = item ? item.rate : '';
    const lineAmt = (Number(qty) || 0) * (Number(rate) || 0);

    tr.innerHTML = \`
      <td class="p-1">
        <input type="text" class="line-desc w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-sky-500" placeholder="Description of Work Scope" value="\${this.escapeHtml(desc)}">
      </td>
      <td class="p-1 w-20">
        <input type="text" class="line-hsn w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-center font-mono text-slate-700 focus:outline-none focus:border-sky-500" value="\${this.escapeHtml(hsn)}">
      </td>
      <td class="p-1 w-16">
        <input type="number" step="any" min="0" class="line-qty w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-right font-mono text-slate-800 focus:outline-none focus:border-sky-500" value="\${qty}" oninput="app.recalculateLineItems()">
      </td>
      <td class="p-1 w-16">
        <input type="text" class="line-unit w-full bg-white border border-slate-200 rounded px-1 py-1 text-center text-slate-700 focus:outline-none focus:border-sky-500" value="\${this.escapeHtml(unit)}">
      </td>
      <td class="p-1 w-24">
        <input type="number" step="any" min="0" class="line-rate w-full bg-white border border-slate-200 rounded px-2 py-1 text-right font-mono text-slate-800 focus:outline-none focus:border-sky-500" placeholder="0.00" value="\${rate}" oninput="app.recalculateLineItems()">
      </td>
      <td class="p-1 w-28 text-right font-mono font-bold text-slate-800">
        <span class="line-amount block py-1">₹ \${lineAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </td>
      <td class="p-1 w-8 text-center">
        <button type="button" onclick="app.removeLineItemRow(this)" class="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </td>
    \`;

    tbody.appendChild(tr);
    if (window.lucide) window.lucide.createIcons();
    this.recalculateLineItems();
  }

  removeLineItemRow(btn) {
    const tr = btn.closest('tr');
    if (tr) {
      tr.remove();
      this.recalculateLineItems();
    }
  }

  recalculateLineItems() {
    const rows = document.querySelectorAll('#lineItemsTableBody tr');
    let subtotal = 0;
    const items = [];

    rows.forEach(tr => {
      const desc = tr.querySelector('.line-desc')?.value.trim() || '';
      const hsn = tr.querySelector('.line-hsn')?.value.trim() || '9954';
      const qty = parseFloat(tr.querySelector('.line-qty')?.value) || 0;
      const unit = tr.querySelector('.line-unit')?.value.trim() || 'Sq.Ft';
      const rate = parseFloat(tr.querySelector('.line-rate')?.value) || 0;
      const lineAmt = Math.round(qty * rate * 100) / 100;

      const amtEl = tr.querySelector('.line-amount');
      if (amtEl) {
        amtEl.textContent = '₹ ' + lineAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }

      subtotal += lineAmt;
      items.push({ description: desc, hsn, qty, unit, rate, amount: lineAmt });
    });

    const taxType = document.getElementById('modalTaxType')?.value || 'INTRA_18';
    let cgst = 0, sgst = 0, igst = 0, totalTax = 0;

    if (taxType === 'INTRA_18') {
      cgst = Math.round(subtotal * 0.09 * 100) / 100;
      sgst = Math.round(subtotal * 0.09 * 100) / 100;
      totalTax = cgst + sgst;
    } else if (taxType === 'INTER_18') {
      igst = Math.round(subtotal * 0.18 * 100) / 100;
      totalTax = igst;
    } else {
      totalTax = 0;
    }

    const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;

    // Update form displays
    const elSub = document.getElementById('modalSubtotalDisplay');
    if (elSub) elSub.textContent = '₹ ' + subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const elTaxLabel = document.getElementById('modalTaxLabel');
    if (elTaxLabel) {
      elTaxLabel.textContent = taxType === 'INTRA_18' ? 'CGST (9%) + SGST (9%)' : (taxType === 'INTER_18' ? 'IGST (18%)' : 'Exempt (0%)');
    }

    const elTax = document.getElementById('modalTaxDisplay');
    if (elTax) elTax.textContent = '₹ ' + totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const elGrand = document.getElementById('modalGrandTotalDisplay');
    if (elGrand) elGrand.textContent = '₹ ' + grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const elWords = document.getElementById('modalAmountInWords');
    if (elWords) elWords.textContent = FinanceAnalytics.amountToWords(grandTotal);

    const hiddenAmt = document.getElementById('modalAmount');
    if (hiddenAmt) hiddenAmt.value = grandTotal;

    return { subtotal, totalTax, grandTotal, items, taxType };
  }

  handleDocTypeChange(type) {
    const isIncome = type === 'income';
    const prefix = isIncome ? 'DWCS/REC/26-27/' : 'DWCS/PV/26-27/';
    const count = this.transactions.filter(t => {
      const isInc = t.type && (t.type.includes('Received') || t.type.includes('Income'));
      return isIncome ? isInc : !isInc;
    }).length + 1;

    const refInput = document.getElementById('modalRef');
    if (refInput && (!refInput.value || refInput.value.startsWith('DWCS/'))) {
      refInput.value = prefix + String(count).padStart(3, '0');
    }

    const catInput = document.getElementById('modalCategory');
    if (catInput && (!catInput.value || catInput.value === 'Waterproofing Services' || catInput.value === 'Material Cost')) {
      catInput.value = isIncome ? 'Waterproofing & Construction Services' : 'Chemical Material Purchase';
    }
  }

  openTransactionModal(editId = null, defaultType = null) {
    if (window.roleManager && !window.roleManager.can('canAdd') && !editId) {
      this.showToast('Your role does not have permission to record transactions.', 'error');
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

    const tbody = document.getElementById('lineItemsTableBody');
    if (tbody) tbody.innerHTML = '';

    const titleEl = document.getElementById('modalTitle');
    const idInput = document.getElementById('txnId');
    const dateInput = document.getElementById('modalDate');

    if (editId) {
      const item = this.transactions.find(t => t.id === editId || t.slNo === editId);
      if (item) {
        if (titleEl) titleEl.innerHTML = \`<i data-lucide="edit-3" class="w-5 h-5 text-sky-600"></i><span>Edit Document #\${item.slNo}</span>\`;
        if (idInput) idInput.value = item.id;
        if (dateInput) dateInput.value = item.date;

        const isIncome = item.type && (item.type.includes('Received') || item.type.includes('Income'));
        const radios = document.querySelectorAll('input[name="modalType"]');
        radios.forEach(r => {
          if (isIncome && r.value.includes('Received')) r.checked = true;
          if (!isIncome && r.value.includes('Paid')) r.checked = true;
        });

        const partyInput = document.getElementById('modalParty');
        if (partyInput) partyInput.value = item.partyName;

        const catInput = document.getElementById('modalCategory');
        if (catInput) catInput.value = item.category || '';

        const refInput = document.getElementById('modalRef');
        if (refInput) refInput.value = item.refNumber || '';

        const modeInput = document.getElementById('modalMode');
        if (modeInput) modeInput.value = item.mode || 'CASH';

        // Parse line items if saved as structured JSON in description
        let parsed = null;
        try {
          if (item.description && item.description.startsWith('{') && item.description.endsWith('}')) {
            parsed = JSON.parse(item.description);
          }
        } catch (e) {}

        const descInput = document.getElementById('modalDesc');
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          if (descInput) descInput.value = parsed.remarks || '';
          const taxTypeSelect = document.getElementById('modalTaxType');
          if (taxTypeSelect && parsed.taxType) taxTypeSelect.value = parsed.taxType;
          parsed.items.forEach(it => this.addLineItemRow(it));
        } else {
          if (descInput) descInput.value = item.description || '';
          const sub = Math.round((Number(item.amount || 0) / 1.18) * 100) / 100;
          this.addLineItemRow({
            description: item.category || (isIncome ? 'Waterproofing & Injection Grouting' : 'Material & Chemicals Purchase'),
            hsn: '9954',
            qty: 1,
            unit: 'Lot',
            rate: sub,
            amount: sub
          });
        }
      }
    } else {
      if (titleEl) titleEl.innerHTML = '<i data-lucide="plus-circle" class="w-5 h-5 text-sky-600"></i><span>Record Financial Document</span>';
      if (idInput) idInput.value = '';
      if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

      const isExpense = defaultType && (defaultType.includes('Paid') || defaultType.includes('Expense'));
      const radioIncome = document.querySelector('input[name="modalType"][value*="Received"]');
      const radioExpense = document.querySelector('input[name="modalType"][value*="Paid"]');

      if (isExpense && radioExpense) {
        radioExpense.checked = true;
        this.handleDocTypeChange('expense');
      } else if (radioIncome) {
        radioIncome.checked = true;
        this.handleDocTypeChange('income');
      }

      this.addLineItemRow();
    }

    this.recalculateLineItems();
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

    const id = document.getElementById('txnId')?.value;
    const typeRadio = document.querySelector('input[name="modalType"]:checked');
    const type = typeRadio ? typeRadio.value : 'Received / Income';
    const date = document.getElementById('modalDate')?.value;
    const partyName = document.getElementById('modalParty')?.value.trim();
    const category = document.getElementById('modalCategory')?.value.trim();
    const refNumber = document.getElementById('modalRef')?.value.trim();
    const mode = document.getElementById('modalMode')?.value;
    const remarks = document.getElementById('modalDesc')?.value.trim();

    // Recalculate totals and gather line items
    const { subtotal, totalTax, grandTotal, items, taxType } = this.recalculateLineItems();

    if (!partyName) {
      this.showToast('Please provide a valid client / vendor party name', 'error');
      return;
    }

    if (grandTotal <= 0) {
      this.showToast('Total amount must be greater than zero. Please enter line item rate and quantity.', 'error');
      return;
    }

    // Encapsulate line items & tax breakdown into description JSON
    const description = JSON.stringify({
      items,
      taxType,
      subtotal,
      taxAmount: totalTax,
      grandTotal,
      remarks: remarks || (items[0] ? items[0].description : '')
    });

    const payload = {
      date,
      type,
      partyName,
      amount: grandTotal,
      mode,
      category,
      refNumber,
      description
    };

    try {
      if (id) {
        await window.financeDB.update(id, payload);
        this.showToast('Financial document updated in Neon DB', 'success');
      } else {
        await window.financeDB.add(payload);
        this.showToast('Financial document successfully posted to Neon DB', 'success');
      }
      this.closeTransactionModal();
      await this.refreshData();
    } catch (err) {
      console.error(err);
      this.showToast('Error saving to Neon DB: ' + err.message, 'error');
    }
  }

  async deleteTransaction(id) {
    if (window.roleManager && !window.roleManager.can('canDelete')) {
      this.showToast('Your role does not have permission to delete transactions.', 'error');
      return;
    }

    const item = this.transactions.find(t => t.id === id);
    if (!item) return;

    if (confirm(\`Delete Document #\${item.slNo} "\${item.partyName}" (\${FinanceAnalytics.formatINR(item.amount)})? This will permanently erase it from Neon Database.\`)) {
      try {
        await window.financeDB.delete(id);
        this.showToast('Transaction permanently removed from Neon DB', 'info');
        await this.refreshData();
      } catch (err) {
        this.showToast('Failed to delete: ' + err.message, 'error');
      }
    }
  }

  // =========================================================================
  // COMMERCIAL TAX INVOICE & VOUCHER PRINT VIEWER
  // =========================================================================

  printTaxInvoice(id) {
    const item = this.transactions.find(t => t.id === id || t.slNo === id);
    if (!item) return;

    const modal = document.getElementById('invoicePrintModal');
    if (!modal) return;

    const isIncome = item.type && (item.type.includes('Received') || item.type.includes('Income'));

    // Badge
    const badge = document.getElementById('printDocTypeBadge');
    if (badge) {
      badge.textContent = isIncome ? 'TAX INVOICE' : 'PAYMENT VOUCHER';
      badge.className = \`px-2.5 py-1 rounded text-xs font-bold \${isIncome ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}\`;
    }

    // Invoice Meta
    const elDocNo = document.getElementById('printDocNo');
    if (elDocNo) elDocNo.textContent = item.refNumber || (isIncome ? \`DWCS/INV/26-27/\${String(item.slNo).padStart(3, '0')}\` : \`DWCS/PV/26-27/\${String(item.slNo).padStart(3, '0')}\`);

    const elDate = document.getElementById('printDocDate');
    if (elDate) elDate.textContent = FinanceAnalytics.formatDateDisplay(item.date);

    const elParty = document.getElementById('printPartyName');
    if (elParty) elParty.textContent = item.partyName;

    const elMode = document.getElementById('printPaymentMode');
    if (elMode) elMode.textContent = item.mode || 'NETBANKING';

    const elRef = document.getElementById('printRefNumber');
    if (elRef) elRef.textContent = item.refNumber || '-';

    // Parse Line Items
    let lineItems = [];
    let taxType = 'INTRA_18';
    try {
      if (item.description && item.description.startsWith('{') && item.description.endsWith('}')) {
        const p = JSON.parse(item.description);
        if (Array.isArray(p.items) && p.items.length > 0) {
          lineItems = p.items;
          taxType = p.taxType || 'INTRA_18';
        }
      }
    } catch (e) {}

    const totalAmt = Number(item.amount) || 0;
    if (lineItems.length === 0) {
      const sub = Math.round((totalAmt / 1.18) * 100) / 100;
      lineItems = [
        {
          description: item.category || (isIncome ? 'Waterproofing Treatment & Concrete Injection Grouting Services' : 'Material & Waterproofing Chemicals Supply'),
          hsn: '9954',
          qty: 1,
          unit: 'Lot',
          rate: sub,
          amount: sub
        }
      ];
    }

    const subtotal = lineItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    const isInter = taxType === 'INTER_18';
    const gst = FinanceAnalytics.calculateGST(subtotal, taxType === 'EXEMPT' ? 0 : 18, isInter);
    const grandTotal = gst.grandTotal > 0 ? gst.grandTotal : totalAmt;

    // Render Table
    const printTbody = document.getElementById('printLineItemsBody');
    if (printTbody) {
      printTbody.innerHTML = lineItems.map((it, idx) => \`
        <tr class="border-b border-slate-200">
          <td class="p-2 border border-slate-300 text-center font-mono">\${idx + 1}</td>
          <td class="p-2 border border-slate-300 font-semibold">\${this.escapeHtml(it.description)}</td>
          <td class="p-2 border border-slate-300 text-center font-mono">\${it.hsn || '9954'}</td>
          <td class="p-2 border border-slate-300 text-right font-mono">\${it.qty || 1}</td>
          <td class="p-2 border border-slate-300 text-center">\${this.escapeHtml(it.unit || 'Sq.Ft')}</td>
          <td class="p-2 border border-slate-300 text-right font-mono">₹ \${(Number(it.rate) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td class="p-2 border border-slate-300 text-right font-mono font-bold">₹ \${(Number(it.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      \`).join('');
    }

    // Totals
    const elSub = document.getElementById('printSubTotal');
    if (elSub) elSub.textContent = '₹ ' + subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const elCgstL = document.getElementById('printCgstLabel');
    if (elCgstL) elCgstL.textContent = isInter ? 'IGST (18%):' : 'CGST (9%):';

    const elCgst = document.getElementById('printCgstAmount');
    if (elCgst) elCgst.textContent = '₹ ' + (isInter ? gst.igst : gst.cgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const elSgstL = document.getElementById('printSgstLabel');
    if (elSgstL) elSgstL.textContent = isInter ? '' : 'SGST (9%):';

    const elSgst = document.getElementById('printSgstAmount');
    if (elSgst) elSgst.textContent = isInter ? '' : '₹ ' + gst.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const elGrand = document.getElementById('printGrandTotal');
    if (elGrand) elGrand.textContent = '₹ ' + grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const elWords = document.getElementById('printAmountWords');
    if (elWords) elWords.textContent = FinanceAnalytics.amountToWords(grandTotal);

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeInvoicePrintModal() {
    const modal = document.getElementById('invoicePrintModal');
    if (modal) modal.classList.add('hidden');
  }

  viewTransactionDetails(id) {
    const item = this.transactions.find(t => t.id === id || t.slNo === id);
    if (!item) return;

    this.currentDetailId = item.id;
    const modal = document.getElementById('txnDetailModal');
    if (!modal) return;

    const isIncome = item.type && (item.type.includes('Received') || item.type.includes('Income'));

    const badge = document.getElementById('detailTypeBadge');
    if (badge) {
      badge.textContent = isIncome ? 'IN' : 'OUT';
      badge.className = \`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs \${isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}\`;
    }

    const party = document.getElementById('detailPartyName');
    if (party) party.textContent = item.partyName;

    const slDate = document.getElementById('detailSlNoDate');
    if (slDate) slDate.textContent = \`Document #\${item.slNo} • \${FinanceAnalytics.formatDateDisplay(item.date)}\`;

    const amt = document.getElementById('detailAmount');
    if (amt) amt.textContent = FinanceAnalytics.formatINR(item.amount);

    const profit = document.getElementById('detailProfit');
    if (profit) {
      profit.textContent = (isIncome ? '+' : '-') + FinanceAnalytics.formatINR(item.amount);
      profit.className = \`font-mono font-bold text-lg \${isIncome ? 'text-emerald-600' : 'text-rose-600'}\`;
    }

    const mode = document.getElementById('detailMode');
    if (mode) mode.textContent = item.mode || 'CASH';

    const ref = document.getElementById('detailRefNumber');
    if (ref) ref.textContent = item.refNumber || '-';

    const qfy = document.getElementById('detailQuarterFY');
    if (qfy) qfy.textContent = \`\${item.quarter || 'Q3'} • \${item.financialYear || 'F.Y. 2026-27'}\`;

    const cat = document.getElementById('detailCategory');
    if (cat) cat.textContent = item.category || 'General';

    const desc = document.getElementById('detailDescription');
    if (desc) desc.textContent = item.description || '-';

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeTransactionDetailModal() {
    const modal = document.getElementById('txnDetailModal');
    if (modal) modal.classList.add('hidden');
    this.currentDetailId = null;
  }

  printCurrentDetailInvoice() {
    if (this.currentDetailId) {
      this.closeTransactionDetailModal();
      this.printTaxInvoice(this.currentDetailId);
    }
  }

  // =========================================================================
  // AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
  // =========================================================================

  checkAuthUI() {
    const isAuth = window.authManager && window.authManager.isAuthenticated();
    const loginOverlay = document.getElementById('loginOverlay');
    const appWrapper = document.getElementById('erpAppWrapper');

    if (isAuth) {
      if (loginOverlay) loginOverlay.classList.add('hidden');
      if (appWrapper) appWrapper.classList.remove('hidden');

      const user = window.authManager.getCurrentUser() || {};
      const role = window.roleManager ? window.roleManager.getRole() : { label: 'Admin', color: 'sky' };

      // Top Executive App Bar Badges
      const avatarEl = document.getElementById('headerProfileAvatar');
      if (avatarEl) avatarEl.textContent = (user.fullName || 'Admin').slice(0, 2).toUpperCase();

      const nameEl = document.getElementById('headerProfileName');
      if (nameEl) nameEl.textContent = user.fullName || 'Administrator';

      const badgeEl = document.getElementById('headerProfileBadge');
      if (badgeEl) {
        badgeEl.textContent = role.label || 'Super Admin';
      }

      // Sidebar Profile Info
      const sideAvatar = document.getElementById('sideProfileAvatar');
      if (sideAvatar) sideAvatar.textContent = (user.fullName || 'Admin').slice(0, 2).toUpperCase();

      const sideName = document.getElementById('sideProfileName');
      if (sideName) sideName.textContent = user.fullName || 'Administrator';

      const sideRole = document.getElementById('sideProfileRole');
      if (sideRole) sideRole.textContent = role.label || 'Executive';
    } else {
      if (loginOverlay) loginOverlay.classList.remove('hidden');
      if (appWrapper) appWrapper.classList.add('hidden');
    }
  }

  applyRolePermissions() {
    const isSuperAdmin = window.roleManager ? window.roleManager.isSuperAdmin() : true;
    const canAdd = window.roleManager ? window.roleManager.can('canAdd') : true;

    // Strict Super Admin Database Gating
    const dbSidebarTab = document.getElementById('side-tab-database');
    if (dbSidebarTab) {
      if (isSuperAdmin) dbSidebarTab.classList.remove('hidden');
      else dbSidebarTab.classList.add('hidden');
    }

    const headerSyncBtn = document.getElementById('headerSyncBtn');
    if (headerSyncBtn) {
      if (isSuperAdmin) headerSyncBtn.classList.remove('hidden');
      else headerSyncBtn.classList.add('hidden');
    }

    const neonBar = document.getElementById('neonStatusBar');
    if (neonBar) {
      if (isSuperAdmin) neonBar.classList.remove('hidden');
      else neonBar.classList.add('hidden');
    }

    // Role switcher in user profile drawer
    const roleSelect = document.getElementById('rolePreviewSelect');
    if (roleSelect && window.roleManager) {
      roleSelect.value = window.roleManager.currentRoleId;
      roleSelect.disabled = !isSuperAdmin;
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const userInput = document.getElementById('loginUserId');
    const passInput = document.getElementById('loginPassword');
    const submitBtn = document.getElementById('loginSubmitBtn');

    if (!userInput || !passInput) return;

    const userId = userInput.value.trim();
    const password = passInput.value;

    if (!userId || !password) {
      this.showToast('Please enter both User ID and Password', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="inline-block animate-spin mr-2">⟳</span> Authenticating...';
    }

    try {
      const res = await window.authManager.login(userId, password);
      if (res.success) {
        if (res.mustChangePassword) {
          document.getElementById('firstLoginTargetName').textContent = res.user.fullName;
          document.getElementById('firstLoginModal').classList.remove('hidden');
        } else {
          this.showToast(\`Welcome back, \${res.user.fullName}!\`, 'success');
        }
        this.checkAuthUI();
        this.applyRolePermissions();
        this.renderCurrentView();
      } else {
        this.showToast(res.error || 'Authentication failed. Please verify credentials.', 'error');
      }
    } catch (err) {
      this.showToast('Login error: ' + err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign in to ERP Portal';
      }
    }
  }

  toggleLoginPasswordVisibility() {
    const passInput = document.getElementById('loginPassword');
    const eyeIcon = document.getElementById('loginPassEyeIcon');
    if (!passInput) return;

    if (passInput.type === 'password') {
      passInput.type = 'text';
      if (eyeIcon) eyeIcon.setAttribute('data-lucide', 'eye-off');
    } else {
      passInput.type = 'password';
      if (eyeIcon) eyeIcon.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) window.lucide.createIcons();
  }

  handleLogout() {
    if (window.authManager) {
      window.authManager.logout();
      this.checkAuthUI();
      this.showToast('Signed out of Dharshithan ERP portal', 'info');
    }
  }

  openUserProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (!modal) return;

    const user = window.authManager.getCurrentUser() || {};
    const role = window.roleManager ? window.roleManager.getRole() : { label: 'Admin' };

    const drawerAvatar = document.getElementById('drawerAvatar');
    if (drawerAvatar) drawerAvatar.textContent = (user.fullName || 'Admin').slice(0, 2).toUpperCase();

    const drawerName = document.getElementById('drawerUserName');
    if (drawerName) drawerName.textContent = user.fullName || 'Administrator';

    const drawerEmail = document.getElementById('drawerUserEmail');
    if (drawerEmail) drawerEmail.textContent = user.email || 'admin@dharshithan.com';

    const drawerBadge = document.getElementById('drawerUserRoleBadge');
    if (drawerBadge) drawerBadge.textContent = role.label || 'Executive';

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeUserProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (modal) modal.classList.add('hidden');
  }

  switchRolePreview(roleId) {
    if (!window.roleManager.isSuperAdmin() && window.roleManager.currentRoleId !== roleId) {
      this.showToast('Only Super Admin can simulate different role permissions', 'error');
      return;
    }

    window.roleManager.setRole(roleId);
    this.checkAuthUI();
    this.applyRolePermissions();
    this.renderCurrentView();
    this.showToast(\`Switched role view to: \${window.roleManager.getRole().label}\`, 'info');
  }

  // =========================================================================
  // PASSWORD RESET, OTP & USER MANAGEMENT
  // =========================================================================

  openForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (!modal) return;
    document.getElementById('forgotStep1')?.classList.remove('hidden');
    document.getElementById('forgotStep2')?.classList.add('hidden');
    modal.classList.remove('hidden');
  }

  closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) modal.classList.add('hidden');
  }

  handleRequestOTP() {
    const input = document.getElementById('forgotTargetId') || document.getElementById('forgotInputUserOrEmail');
    if (!input) return;
    const val = input.value.trim();

    if (!val) {
      this.showToast('Please enter your User ID or Email Address', 'error');
      return;
    }

    const res = window.authManager.requestOTP(val);
    if (res.success) {
      this.pendingResetUserId = res.userId;
      this.generatedTestOTP = res.code;

      const emailEl = document.getElementById('forgotDispatchedEmail');
      if (emailEl) emailEl.textContent = res.email;

      const testOtpEl = document.getElementById('forgotTestingOTP');
      if (testOtpEl) testOtpEl.textContent = res.code;

      document.getElementById('forgotStep1')?.classList.add('hidden');
      document.getElementById('forgotStep2')?.classList.remove('hidden');
      document.getElementById('forgotOTPCode')?.focus();
      this.showToast(\`6-Digit OTP code generated for \${res.email}\`, 'success');
    } else {
      this.showToast(res.error || 'User not found in Neon records', 'error');
    }
  }

  autofillOTP() {
    if (this.generatedTestOTP) {
      const input = document.getElementById('forgotOTPCode');
      if (input) input.value = this.generatedTestOTP;
      this.showToast('Autofilled security OTP', 'info');
    }
  }

  async handleVerifyOTPAndReset() {
    const code = document.getElementById('forgotOTPCode')?.value.trim();
    const newPass = document.getElementById('forgotNewPass')?.value;

    if (!code || !newPass) {
      this.showToast('Please provide both OTP code and new password', 'error');
      return;
    }

    const res = await window.authManager.verifyOTPAndResetPassword(this.pendingResetUserId, code, newPass);
    if (res.success) {
      this.showToast('Password reset successfully! Please sign in with your new credentials.', 'success');
      this.closeForgotPasswordModal();
    } else {
      this.showToast(res.error || 'Invalid or expired OTP', 'error');
    }
  }

  async handleFirstLoginPasswordChange(e) {
    e.preventDefault();
    const currentPass = document.getElementById('firstLoginCurrentPass')?.value;
    const newPass = document.getElementById('firstLoginNewPass')?.value;
    const confirmPass = document.getElementById('firstLoginConfirmPass')?.value;

    if (newPass !== confirmPass) {
      this.showToast('New passwords do not match', 'error');
      return;
    }

    const user = window.authManager.getCurrentUser();
    const res = await window.authManager.changePassword(user.userId, currentPass, newPass);
    if (res.success) {
      this.showToast('Password initialized! Welcome to Dharshithan ERP.', 'success');
      document.getElementById('firstLoginModal')?.classList.add('hidden');
    } else {
      this.showToast(res.error || 'Failed to update password', 'error');
    }
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
    const curPass = document.getElementById('selfCurrentPass')?.value;
    const newPass = document.getElementById('selfNewPass')?.value;
    const conPass = document.getElementById('selfConfirmPass')?.value;

    if (newPass !== conPass) {
      this.showToast('New passwords do not match', 'error');
      return;
    }

    const user = window.authManager.getCurrentUser();
    const res = await window.authManager.changePassword(user.userId, curPass, newPass);
    if (res.success) {
      this.showToast('Your password was updated successfully', 'success');
      this.closeSelfPasswordChangeModal();
    } else {
      this.showToast(res.error || 'Password update failed', 'error');
    }
  }

  // =========================================================================
  // STAFF DIRECTORY & USER PROVISIONING MODAL
  // =========================================================================

  openUserManagementModal() {
    if (!window.roleManager.isSuperAdmin()) {
      this.showToast('Only Super Administrator has access to Staff Directory', 'error');
      return;
    }
    const modal = document.getElementById('userManagementModal');
    if (!modal) return;

    this.renderUsersTable();
    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeUserManagementModal() {
    const modal = document.getElementById('userManagementModal');
    if (modal) modal.classList.add('hidden');
  }

  async renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    try {
      const res = await fetch('/api/users');
      let users = [];
      if (res.ok) {
        const body = await res.json();
        if (body.success && Array.isArray(body.data)) users = body.data;
      }

      if (users.length === 0 && window.authManager) {
        users = window.authManager.getAllUsers();
      }

      tbody.innerHTML = users.map(u => {
        const isSuper = (u.role || '').toLowerCase().includes('super');
        return \`
          <tr class="hover:bg-slate-50 transition border-b border-slate-100 text-xs">
            <td class="p-2.5 font-bold text-slate-900">\${this.escapeHtml(u.fullName || u.full_name)}</td>
            <td class="p-2.5 font-mono text-slate-600">\${this.escapeHtml(u.userId || u.user_id)}</td>
            <td class="p-2.5 text-slate-600">\${this.escapeHtml(u.email)}</td>
            <td class="p-2.5">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold \${isSuper ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-sky-50 text-sky-700 border border-sky-200'}">
                \${u.role}
              </span>
            </td>
            <td class="p-2.5 text-center">
              <span class="inline-block w-2 h-2 rounded-full \${u.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
            </td>
          </tr>
        \`;
      }).join('');
    } catch (err) {
      console.error(err);
      tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-rose-500">Failed to load staff list</td></tr>';
    }
  }

  async handleAddUser(e) {
    e.preventDefault();
    const fullName = document.getElementById('newFullName')?.value.trim();
    const userId = document.getElementById('newUserId')?.value.trim();
    const email = document.getElementById('newEmail')?.value.trim();
    const role = document.getElementById('newRole')?.value;
    const phone = document.getElementById('newPhone')?.value.trim();
    const password = document.getElementById('newPassword')?.value;

    if (!fullName || !userId || !email || !password) {
      this.showToast('Please fill all required staff account fields', 'error');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, userId, email, role, phone, password, category: 'Internal' })
      });

      if (res.ok) {
        this.showToast(\`Staff account for \${fullName} created in Neon DB\`, 'success');
        document.getElementById('addUserForm')?.reset();
        this.renderUsersTable();
      } else {
        const body = await res.json();
        this.showToast(body.error || 'Failed to create staff account', 'error');
      }
    } catch (err) {
      this.showToast('User provisioning error: ' + err.message, 'error');
    }
  }

  // =========================================================================
  // NEON DATABASE CONSOLE & SQL TOOLS (SUPER ADMIN ONLY)
  // =========================================================================

  openDatabaseHubModal() {
    if (!window.roleManager.isSuperAdmin()) {
      this.showToast('Restricted: Database Console is accessible only to Super Admin', 'error');
      return;
    }
    const modal = document.getElementById('databaseHubModal');
    if (modal) {
      modal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  closeDatabaseHubModal() {
    const modal = document.getElementById('databaseHubModal');
    if (modal) modal.classList.add('hidden');
  }

  downloadMigrationSQL() {
    const sql = \`-- Dharshithan Waterproofing and Concrete Solutions
-- Enterprise PostgreSQL Native DDL Migration for Neon Cloud

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sl_no SERIAL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type VARCHAR(50) NOT NULL,
  party_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  amount NUMERIC(14,2) NOT NULL,
  mode VARCHAR(50) DEFAULT 'CASH',
  ref_number VARCHAR(100),
  quarter VARCHAR(10),
  financial_year VARCHAR(30),
  profit_value NUMERIC(14,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(50) DEFAULT 'Internal',
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  phone VARCHAR(30),
  password_hash TEXT NOT NULL,
  must_change_password BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
\`;

    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dharshithan_neon_schema.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast('Downloaded dharshithan_neon_schema.sql for Neon Database', 'success');
  }

  // =========================================================================
  // UTILITIES & FEEDBACK
  // =========================================================================

  closeAllModals() {
    const modals = [
      'txnModal',
      'invoicePrintModal',
      'orgDetailsModal',
      'userProfileModal',
      'txnDetailModal',
      'partyModal',
      'floatModal',
      'userManagementModal',
      'databaseHubModal',
      'forgotPasswordModal',
      'selfPasswordChangeModal'
    ];
    modals.forEach(m => {
      const el = document.getElementById(m);
      if (el) el.classList.add('hidden');
    });
    this.closeQuickCreateMenu();
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

    toast.className = \`p-3 md:p-3.5 rounded-xl border shadow-lg flex items-center space-x-2.5 text-xs font-medium animate-fade-in pointer-events-auto transition-all \${colors[type] || colors.info}\`;
    toast.innerHTML = \`
      <i data-lucide="\${icons[type] || 'info'}" class="w-4 h-4 flex-shrink-0"></i>
      <span>\${this.escapeHtml(message)}</span>
    \`;

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

// Global Instantiation
window.app = new FinanceApp();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
`;

fs.writeFileSync(targetPath, appJsContent, 'utf8');
console.log('✓ Successfully wrote complete enterprise Zoho ERP Controller (js/app.js)');
