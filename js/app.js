/**
 * Dharshithan Waterproofing - Finance Tracker
 * Main Application Controller & View Orchestrator
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

    // Subscribe to DB changes
    window.financeDB.onChange(() => {
      this.refreshData();
    });

    // Populate initial FY dropdown dynamically
    await this.refreshData();

    // Set today's date in transaction modal
    const today = new Date().toISOString().slice(0, 10);
    const dateInput = document.getElementById('modalDate');
    if (dateInput) dateInput.value = today;

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

    console.log('Dharshithan Finance Tracker Initialized');
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

  setActiveTab(tabName) {
    this.activeTab = tabName;

    // Desktop nav buttons
    ['dashboard', 'transactions', 'parties', 'reports'].forEach(tab => {
      const btn = document.getElementById(`tab-${tab}`);
      const mBtn = document.getElementById(`m-tab-${tab}`);
      const view = document.getElementById(`view-${tab}`);

      if (tab === tabName) {
        if (btn) {
          btn.className = 'px-3 py-1.5 rounded-lg transition-all text-white bg-sky-600 font-semibold shadow flex items-center space-x-1.5';
        }
        if (mBtn) {
          mBtn.className = 'py-2 px-3 text-sky-400 font-semibold border-b-2 border-sky-400';
        }
        if (view) view.classList.remove('hidden');
      } else {
        if (btn) {
          btn.className = 'px-3 py-1.5 rounded-lg transition-all hover:text-white hover:bg-slate-800 flex items-center space-x-1.5 text-slate-400';
        }
        if (mBtn) {
          mBtn.className = 'py-2 px-3 text-slate-400';
        }
        if (view) view.classList.add('hidden');
      }
    });

    this.renderCurrentView();

    if (window.lucide) {
      window.lucide.createIcons();
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
    } else if (this.activeTab === 'parties') {
      this.renderParties();
    } else if (this.activeTab === 'reports') {
      this.renderReports();
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderDashboard() {
    const metrics = FinanceAnalytics.calculateDashboardMetrics(this.filteredTransactions);

    // KPI 1: Turnover / Income
    const elIncome = document.getElementById('kpi-total-income');
    if (elIncome) elIncome.textContent = FinanceAnalytics.formatINR(metrics.totalIncome);
    const elIncTxns = document.getElementById('kpi-income-txns');
    const incTxnCnt = this.filteredTransactions.filter(t => t.type.includes('Received') || t.type.includes('Income')).length;
    if (elIncTxns) elIncTxns.textContent = `${incTxnCnt} receipts`;

    // KPI 2: Total Expenses
    const elExpenses = document.getElementById('kpi-total-expenses');
    if (elExpenses) elExpenses.textContent = FinanceAnalytics.formatINR(metrics.totalExpenses);
    const elExpTxns = document.getElementById('kpi-expense-txns');
    const expTxnCnt = this.filteredTransactions.filter(t => t.type.includes('Paid') || t.type.includes('Expense')).length;
    if (elExpTxns) elExpTxns.textContent = `${expTxnCnt} payouts`;

    // KPI 3: Net Income in Stands
    const elNet = document.getElementById('kpi-net-income');
    if (elNet) {
      elNet.textContent = FinanceAnalytics.formatINR(metrics.netIncome);
      if (metrics.netIncome >= 0) {
        elNet.className = 'text-2xl font-bold text-sky-300 font-mono tracking-tight';
      } else {
        elNet.className = 'text-2xl font-bold text-rose-400 font-mono tracking-tight';
      }
    }
    const elMargin = document.getElementById('kpi-profit-margin');
    if (elMargin) {
      const margin = metrics.totalIncome > 0 ? ((metrics.netIncome / metrics.totalIncome) * 100).toFixed(1) : '0.0';
      elMargin.textContent = `${margin}% margin`;
    }

    // KPI 4: Bank Balance & Cash in hand
    const elBankBal = document.getElementById('kpi-bank-balance');
    if (elBankBal) {
      elBankBal.textContent = FinanceAnalytics.formatINR(metrics.bankSummary.currentBalance, { parenthesesNegative: true });
      if (metrics.bankSummary.currentBalance < 0) {
        elBankBal.className = 'text-2xl font-bold font-mono tracking-tight text-amber-400';
      } else {
        elBankBal.className = 'text-2xl font-bold font-mono tracking-tight text-white';
      }
    }
    const elCashBal = document.getElementById('kpi-cash-balance');
    if (elCashBal) elCashBal.textContent = FinanceAnalytics.formatINR(metrics.cashSummary.currentBalance);

    // Bank Liquidity Box
    const elBankIn = document.getElementById('bank-total-in');
    if (elBankIn) elBankIn.textContent = FinanceAnalytics.formatINR(metrics.bankSummary.totalIncome);
    const elBankOut = document.getElementById('bank-total-out');
    if (elBankOut) elBankOut.textContent = FinanceAnalytics.formatINR(metrics.bankSummary.totalExpenses);
    const elBankCurrent = document.getElementById('bank-current-bal');
    if (elBankCurrent) {
      elBankCurrent.textContent = FinanceAnalytics.formatINR(metrics.bankSummary.currentBalance, { parenthesesNegative: true });
    }
    const elCashCurrent = document.getElementById('cash-current-bal');
    if (elCashCurrent) elCashCurrent.textContent = FinanceAnalytics.formatINR(metrics.cashSummary.currentBalance);

    // Mode rows
    this.renderModeList('list-income-modes', metrics.incomeByMode, metrics.totalIncome, 'emerald');
    this.renderModeList('list-expense-modes', metrics.expensesByMode, metrics.totalExpenses, 'rose');

    // Recent Transactions Table in Dashboard
    const recentTbody = document.getElementById('dashboard-recent-table');
    if (recentTbody) {
      const recent = [...this.filteredTransactions].reverse().slice(0, 5);
      if (recent.length === 0) {
        recentTbody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-slate-500">No transactions recorded for this period</td></tr>`;
      } else {
        recentTbody.innerHTML = recent.map(t => {
          const isIncome = t.type.includes('Received') || t.type.includes('Income');
          const typeBadge = isIncome 
            ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Income</span>`
            : `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Expense</span>`;
          
          const profitClass = (t.profitValue || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400';
          return `
            <tr class="hover:bg-slate-800/40 transition">
              <td class="py-2 px-3 text-slate-400">#${t.slNo}</td>
              <td class="py-2 px-3 text-slate-300 font-sans">${FinanceAnalytics.formatDateDisplay(t.date)}</td>
              <td class="py-2 px-3 font-sans font-medium text-white">${this.escapeHtml(t.partyName)}</td>
              <td class="py-2 px-3 font-sans">${typeBadge}</td>
              <td class="py-2 px-3 font-sans">${this.getModeBadge(t.mode)}</td>
              <td class="py-2 px-3 text-right text-slate-200">${FinanceAnalytics.formatINR(t.amount)}</td>
              <td class="py-2 px-3 text-right ${profitClass} font-semibold">${FinanceAnalytics.formatINR(t.profitValue)}</td>
            </tr>
          `;
        }).join('');
      }
    }

    // Trigger Charts
    window.financeCharts.render(this.filteredTransactions);
  }

  renderModeList(containerId, modeMap, total, themeColor) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const modes = ['CASH', 'NETBANKING', 'UPI', 'DEBIT CARD / CREDIT CARD', 'CHEQUE', 'OTHERS'];
    const html = modes.map(m => {
      const amount = modeMap[m] || 0;
      const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
      return `
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-slate-400 font-medium">${m}</span>
            <div class="flex items-center space-x-2 font-mono">
              <span class="text-slate-200">${FinanceAnalytics.formatINR(amount)}</span>
              <span class="text-slate-500 text-[10px]">(${pct}%)</span>
            </div>
          </div>
          <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-${themeColor}-500 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
          </div>
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

  renderTransactionsTable() {
    const tbody = document.getElementById('transactions-table-body');
    if (!tbody) return;

    if (this.filteredTransactions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" class="py-12 text-center text-slate-500">
            <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
            <p class="font-medium text-slate-400">No transactions match the selected filters</p>
            <p class="text-xs text-slate-600 mt-1">Try resetting period or search query</p>
          </td>
        </tr>
      `;
      this.updateTableSummary(0, 0, 0, 0);
      return;
    }

    let sumIncome = 0;
    let sumExpense = 0;

    tbody.innerHTML = this.filteredTransactions.map(t => {
      const isIncome = t.type.includes('Received') || t.type.includes('Income');
      if (isIncome) sumIncome += Number(t.amount) || 0;
      else sumExpense += Number(t.amount) || 0;

      const typeBadge = isIncome
        ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">Received</span>`
        : `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap">Paid</span>`;

      const profitVal = Number(t.profitValue) || 0;
      const profitClass = profitVal >= 0 ? 'text-emerald-400' : 'text-rose-400';

      return `
        <tr class="hover:bg-slate-800/40 transition">
          <td class="py-2.5 px-3 font-mono text-slate-400">${t.slNo}</td>
          <td class="py-2.5 px-3 whitespace-nowrap text-slate-300 font-mono">${FinanceAnalytics.formatDateDisplay(t.date)}</td>
          <td class="py-2.5 px-3">${typeBadge}</td>
          <td class="py-2.5 px-4 font-semibold text-white cursor-pointer hover:text-sky-400" onclick="app.openPartyModal('${this.escapeHtml(t.partyName)}')">${this.escapeHtml(t.partyName)}</td>
          <td class="py-2.5 px-4 max-w-xs truncate text-slate-400" title="${this.escapeHtml(t.description)}">
            <span class="text-slate-300">${this.escapeHtml(t.description)}</span>
            ${t.category ? `<span class="block text-[10px] text-slate-500">${this.escapeHtml(t.category)}</span>` : ''}
          </td>
          <td class="py-2.5 px-3 text-right font-mono font-medium text-slate-100">${FinanceAnalytics.formatINR(t.amount)}</td>
          <td class="py-2.5 px-3">${this.getModeBadge(t.mode)}</td>
          <td class="py-2.5 px-4 text-slate-400 text-[11px] max-w-xs truncate" title="${this.escapeHtml(t.refNumber)}">${this.escapeHtml(t.refNumber)}</td>
          <td class="py-2.5 px-2 text-center text-slate-400 font-mono text-[11px]">${t.quarter || '-'}</td>
          <td class="py-2.5 px-3 text-right font-mono font-semibold ${profitClass}">${FinanceAnalytics.formatINR(t.profitValue)}</td>
          <td class="py-2.5 px-3 text-center">
            <div class="flex items-center justify-center space-x-1.5">
              <button onclick="app.editTransaction('${t.id}')" title="Edit" class="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-sky-400 transition">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="app.deleteTransaction('${t.id}')" title="Delete" class="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

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
      grid.innerHTML = `<div class="col-span-3 py-12 text-center text-slate-500">No parties found matching criteria.</div>`;
      return;
    }

    grid.innerHTML = parties.map(p => {
      const netClass = p.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400';
      const statusBadge = p.netBalance >= 0
        ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Client / Surplus</span>`
        : `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Vendor / Payable</span>`;

      return `
        <div class="glass-card glass-card-hover rounded-2xl p-4 space-y-3 cursor-pointer" onclick="app.openPartyModal('${this.escapeHtml(p.name)}')">
          <div class="flex items-start justify-between">
            <div>
              <h4 class="font-bold text-white text-sm hover:text-sky-400 transition">${this.escapeHtml(p.name)}</h4>
              <p class="text-[11px] text-slate-400 mt-0.5">${p.transactionCount} transactions | Last: ${FinanceAnalytics.formatDateDisplay(p.lastDate)}</p>
            </div>
            ${statusBadge}
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
            <div>
              <span class="text-slate-500 block text-[10px]">Total Received</span>
              <span class="font-mono text-emerald-400 font-semibold">${FinanceAnalytics.formatINR(p.totalReceived)}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px]">Total Paid</span>
              <span class="font-mono text-rose-400 font-semibold">${FinanceAnalytics.formatINR(p.totalPaid)}</span>
            </div>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
            <span class="text-slate-400 font-medium">Net Standing:</span>
            <span class="font-mono font-bold ${netClass}">${FinanceAnalytics.formatINR(p.netBalance)}</span>
          </div>
        </div>
      `;
    }).join('');

    // Trigger party chart
    window.financeCharts.renderPartyChart(this.filteredTransactions);
  }

  renderReports() {
    const container = document.getElementById('fy-summary-container');
    if (!container) return;

    const fySummaries = FinanceAnalytics.getFYQuarterSummary(this.transactions);
    const fyKeys = Object.keys(fySummaries).sort().reverse();

    if (fyKeys.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-slate-500">No financial data to generate reports.</div>`;
      return;
    }

    container.innerHTML = fyKeys.map(fy => {
      const data = fySummaries[fy];
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

      const quarterRows = quarters.map(q => {
        const qData = data.quarters[q];
        const profitClass = qData.profit >= 0 ? 'text-emerald-400' : 'text-rose-400';
        return `
          <tr class="hover:bg-slate-800/40">
            <td class="py-2.5 px-4 font-semibold text-slate-200">${q}</td>
            <td class="py-2.5 px-4 font-mono text-emerald-400">${FinanceAnalytics.formatINR(qData.income)}</td>
            <td class="py-2.5 px-4 font-mono text-rose-400">${FinanceAnalytics.formatINR(qData.expense)}</td>
            <td class="py-2.5 px-4 font-mono font-bold ${profitClass}">${FinanceAnalytics.formatINR(qData.profit)}</td>
            <td class="py-2.5 px-4 text-slate-400">${qData.count} entries</td>
          </tr>
        `;
      }).join('');

      const monthRows = Object.keys(data.monthly).sort().map(m => {
        const mData = data.monthly[m];
        const profitClass = mData.profit >= 0 ? 'text-emerald-400' : 'text-rose-400';
        return `
          <tr class="hover:bg-slate-800/40">
            <td class="py-2 px-4 font-medium text-slate-300 font-mono">${m}</td>
            <td class="py-2 px-4 font-mono text-emerald-400">${FinanceAnalytics.formatINR(mData.income)}</td>
            <td class="py-2 px-4 font-mono text-rose-400">${FinanceAnalytics.formatINR(mData.expense)}</td>
            <td class="py-2 px-4 font-mono font-bold ${profitClass}">${FinanceAnalytics.formatINR(mData.profit)}</td>
            <td class="py-2 px-4 text-slate-400 text-xs">${mData.count} txns</td>
          </tr>
        `;
      }).join('');

      return `
        <div class="glass-card rounded-2xl p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 class="text-base font-bold text-white">${fy} Financial Summary</h3>
              <p class="text-xs text-slate-400">Total Profit Value: <span class="font-mono font-bold text-sky-400">${FinanceAnalytics.formatINR(data.totalProfit)}</span></p>
            </div>
            <div class="flex items-center space-x-4 text-xs font-mono">
              <span class="text-emerald-400">Turnover: ${FinanceAnalytics.formatINR(data.totalIncome)}</span>
              <span class="text-rose-400">Expenses: ${FinanceAnalytics.formatINR(data.totalExpenses)}</span>
            </div>
          </div>

          <!-- Quarters Breakdown -->
          <div>
            <h4 class="text-xs uppercase font-semibold text-slate-400 mb-2">Quarterly Breakdown (Matches Google Sheet Pivot)</h4>
            <div class="overflow-x-auto rounded-xl border border-slate-800">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-900 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th class="py-2.5 px-4">Quarter</th>
                    <th class="py-2.5 px-4">Turnover (Income)</th>
                    <th class="py-2.5 px-4">Expenses</th>
                    <th class="py-2.5 px-4">Net Profit Value</th>
                    <th class="py-2.5 px-4">Transactions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-mono">
                  ${quarterRows}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Monthly Breakdown -->
          <div>
            <h4 class="text-xs uppercase font-semibold text-slate-400 mb-2">Monthly Trajectory</h4>
            <div class="overflow-x-auto rounded-xl border border-slate-800 max-h-56 overflow-y-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-900 sticky top-0 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th class="py-2 px-4">Month</th>
                    <th class="py-2 px-4">Turnover</th>
                    <th class="py-2 px-4">Expenses</th>
                    <th class="py-2 px-4">Net Profit</th>
                    <th class="py-2 px-4">Volume</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-mono">
                  ${monthRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // MODAL HANDLERS
  openTransactionModal(editId = null) {
    this.editingId = editId;
    const modal = document.getElementById('txnModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('txnForm');

    form.reset();

    if (editId) {
      const item = this.transactions.find(t => t.id === editId);
      if (!item) return;

      title.innerHTML = `<i data-lucide="edit-3" class="w-5 h-5 text-sky-400"></i><span>Edit Transaction #${item.slNo}</span>`;
      document.getElementById('txnId').value = item.id;
      document.getElementById('modalDate').value = item.date;
      document.getElementById('modalParty').value = item.partyName;
      document.getElementById('modalAmount').value = item.amount;
      document.getElementById('modalMode').value = item.mode || 'CASH';
      document.getElementById('modalCategory').value = item.category || '';
      document.getElementById('modalRef').value = item.refNumber || '';
      document.getElementById('modalDesc').value = item.description || '';

      const isIncome = item.type.includes('Received') || item.type.includes('Income');
      const radio = document.querySelector(`input[name="modalType"][value="${isIncome ? 'Received / Income' : 'Paid / Expense'}"]`);
      if (radio) radio.checked = true;
    } else {
      title.innerHTML = `<i data-lucide="plus-circle" class="w-5 h-5 text-emerald-400"></i><span>Add New Transaction</span>`;
      document.getElementById('txnId').value = '';
      document.getElementById('modalDate').value = new Date().toISOString().slice(0, 10);
      document.getElementById('modalMode').value = 'CASH';
    }

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
    document.getElementById('modalParty').focus();
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
      if (id) {
        await window.financeDB.update(id, payload);
        this.showToast('Transaction updated successfully', 'success');
      } else {
        await window.financeDB.add(payload);
        this.showToast('Transaction added successfully', 'success');
      }
      this.closeTransactionModal();
    } catch (err) {
      console.error(err);
      this.showToast('Error saving transaction: ' + err.message, 'error');
    }
  }

  async deleteTransaction(id) {
    const item = this.transactions.find(t => t.id === id);
    if (!item) return;

    if (confirm(`Are you sure you want to delete transaction #${item.slNo} for "${item.partyName}" (${FinanceAnalytics.formatINR(item.amount)})?`)) {
      await window.financeDB.delete(id);
      this.showToast('Transaction deleted', 'info');
    }
  }

  editTransaction(id) {
    this.openTransactionModal(id);
  }

  // PARTY MODAL
  openPartyModal(partyName) {
    const modal = document.getElementById('partyModal');
    const parties = FinanceAnalytics.getPartySummary(this.transactions);
    const party = parties.find(p => p.name.toLowerCase() === partyName.toLowerCase());
    if (!party) return;

    document.getElementById('partyModalName').textContent = party.name;
    document.getElementById('partyModalSubtitle').textContent = `${party.transactionCount} entries recorded | Last activity on ${FinanceAnalytics.formatDateDisplay(party.lastDate)}`;
    document.getElementById('partyModalReceived').textContent = FinanceAnalytics.formatINR(party.totalReceived);
    document.getElementById('partyModalPaid').textContent = FinanceAnalytics.formatINR(party.totalPaid);
    
    const elNet = document.getElementById('partyModalNet');
    elNet.textContent = FinanceAnalytics.formatINR(party.netBalance);
    elNet.className = party.netBalance >= 0 ? 'font-mono font-bold text-sm text-emerald-400' : 'font-mono font-bold text-sm text-rose-400';

    const tbody = document.getElementById('partyModalTable');
    tbody.innerHTML = party.transactions.map(t => {
      const isIncome = t.type.includes('Received') || t.type.includes('Income');
      const badge = isIncome
        ? `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">Received</span>`
        : `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400">Paid</span>`;

      return `
        <tr class="hover:bg-slate-800/40">
          <td class="py-2 px-3 text-slate-300 font-sans">${FinanceAnalytics.formatDateDisplay(t.date)}</td>
          <td class="py-2 px-3 font-sans">${badge}</td>
          <td class="py-2 px-3 font-sans">${this.getModeBadge(t.mode)}</td>
          <td class="py-2 px-3 text-slate-400 font-sans text-[11px]">${this.escapeHtml(t.refNumber || '-')}</td>
          <td class="py-2 px-3 text-right font-semibold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}">${FinanceAnalytics.formatINR(t.amount)}</td>
        </tr>
      `;
    }).join('');

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closePartyModal() {
    const modal = document.getElementById('partyModal');
    if (modal) modal.classList.add('hidden');
  }

  // IMPORT / EXPORT
  openImportModal() {
    const modal = document.getElementById('importModal');
    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) modal.classList.add('hidden');
    document.getElementById('importTextInput').value = '';
    document.getElementById('importFileInput').value = '';
    document.getElementById('importPreview').classList.add('hidden');
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('importTextInput').value = event.target.result;
      this.previewImportData(event.target.result);
    };
    reader.readAsText(file);
  }

  previewImportData(text) {
    const items = FinanceDataTransfer.parseCSV(text);
    const previewBox = document.getElementById('importPreview');
    if (items.length > 0) {
      previewBox.classList.remove('hidden');
      previewBox.innerHTML = `
        <span class="text-emerald-400 font-bold block mb-1">Found ${items.length} valid transactions to import:</span>
        <ul class="list-disc pl-4 space-y-0.5 text-[11px]">
          ${items.slice(0, 3).map(x => `<li>${FinanceAnalytics.formatDateDisplay(x.date)}: ${x.partyName} (${FinanceAnalytics.formatINR(x.amount)}) [${x.type}]</li>`).join('')}
          ${items.length > 3 ? `<li class="text-slate-500 font-italic">...and ${items.length - 3} more</li>` : ''}
        </ul>
      `;
    } else {
      previewBox.classList.remove('hidden');
      previewBox.innerHTML = `<span class="text-amber-400">Could not parse tabular rows from text. Check headers or paste directly.</span>`;
    }
  }

  async executeImport() {
    const text = document.getElementById('importTextInput').value;
    if (!text.trim()) {
      this.showToast('Please paste CSV or select a file first', 'error');
      return;
    }

    const items = FinanceDataTransfer.parseCSV(text);
    if (items.length === 0) {
      this.showToast('No valid transactions could be parsed', 'error');
      return;
    }

    for (const item of items) {
      await window.financeDB.add(item, true);
    }

    window.financeDB.notify();
    this.closeImportModal();
    this.showToast(`Successfully imported ${items.length} transactions!`, 'success');
  }

  async resetToSampleData() {
    if (confirm('Reset tracker back to the default Google Sheet records (Synstar Staffing & Raj Enterprises)? Current entries will be replaced.')) {
      await window.financeDB.resetToSample();
      this.closeImportModal();
      this.showToast('Data reset to original spreadsheet records', 'info');
    }
  }

  exportCSV() {
    FinanceDataTransfer.exportToCSV(this.filteredTransactions);
    this.showToast('CSV downloaded successfully', 'success');
  }

  async copyForGoogleSheets() {
    try {
      await FinanceDataTransfer.copyForGoogleSheets(this.filteredTransactions);
      this.showToast('Copied to clipboard! Ready to paste into Google Sheets (Ctrl+V)', 'success');
    } catch (e) {
      this.showToast('Clipboard access denied, using CSV download instead', 'error');
      this.exportCSV();
    }
  }

  closeAllModals() {
    this.closeTransactionModal();
    this.closePartyModal();
    this.closeImportModal();
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40',
      error: 'bg-rose-950/90 text-rose-300 border-rose-500/40',
      info: 'bg-slate-900/95 text-sky-300 border-sky-500/40'
    };

    const icons = {
      success: 'check-circle',
      error: 'alert-circle',
      info: 'info'
    };

    toast.className = `p-3.5 rounded-xl border shadow-xl flex items-center space-x-2.5 text-xs font-medium animate-fade-in pointer-events-auto transition-all ${colors[type] || colors.info}`;
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

// Start application when DOM loads
window.app = new FinanceApp();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
