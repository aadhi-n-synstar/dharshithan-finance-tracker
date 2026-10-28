/**
 * Dharshithan Waterproofing - Finance Tracker
 * Financial Computation & Analytics Engine
 */

const MODES = [
  'CASH',
  'NETBANKING',
  'UPI',
  'DEBIT CARD / CREDIT CARD',
  'CHEQUE',
  'OTHERS'
];

const BANK_MODES = [
  'NETBANKING',
  'UPI',
  'DEBIT CARD / CREDIT CARD',
  'CHEQUE'
];

class FinanceAnalytics {
  /**
   * Format number as Indian Currency (INR)
   * Example: 40000 -> ₹ 40,000.00, -20000 -> -₹ 20,000.00 or ₹ (20,000.00)
   */
  static formatINR(val, options = {}) {
    if (val === undefined || val === null || isNaN(val)) return '₹ 0.00';
    const num = Number(val);
    const isNegative = num < 0;
    const absVal = Math.abs(num);

    const parts = absVal.toFixed(2).split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1];

    // Indian numbering format: 3 digits, then groups of 2 digits
    let lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    const formattedString = `${formattedInteger}.${decimalPart}`;

    if (options.parenthesesNegative && isNegative) {
      return `₹ (${formattedString})`;
    }
    return isNegative ? `-₹ ${formattedString}` : `₹ ${formattedString}`;
  }

  static formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateStr;
    }
  }

  /**
   * Filter transactions by FY, Quarter, Date Range, Party, Mode, Search query
   */
  static filterTransactions(transactions, filters = {}) {
    return transactions.filter(t => {
      if (filters.financialYear && filters.financialYear !== 'ALL') {
        if (t.financialYear !== filters.financialYear) return false;
      }
      if (filters.quarter && filters.quarter !== 'ALL') {
        if (t.quarter !== filters.quarter) return false;
      }
      if (filters.type && filters.type !== 'ALL') {
        const isIncome = t.type.includes('Received') || t.type.includes('Income');
        if (filters.type === 'INCOME' && !isIncome) return false;
        if (filters.type === 'EXPENSE' && isIncome) return false;
      }
      if (filters.mode && filters.mode !== 'ALL') {
        if (t.mode !== filters.mode) return false;
      }
      if (filters.startDate) {
        if (t.date < filters.startDate) return false;
      }
      if (filters.endDate) {
        if (t.date > filters.endDate) return false;
      }
      if (filters.party && filters.party !== 'ALL') {
        if (t.partyName !== filters.party) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const matchParty = (t.partyName || '').toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchRef = (t.refNumber || '').toLowerCase().includes(q);
        const matchCat = (t.category || '').toLowerCase().includes(q);
        const matchAmt = (t.amount || '').toString().includes(q);
        if (!matchParty && !matchDesc && !matchRef && !matchCat && !matchAmt) return false;
      }
      return true;
    });
  }

  /**
   * Calculate top-level dashboard metrics (matching Dashboard sheet structure)
   */
  static calculateDashboardMetrics(transactions) {
    let totalIncome = 0;
    let totalExpenses = 0;

    const incomeByMode = {};
    const expensesByMode = {};
    MODES.forEach(m => {
      incomeByMode[m] = 0;
      expensesByMode[m] = 0;
    });

    let bankIncome = 0;
    let bankExpenses = 0;
    let cashIncome = 0;
    let cashExpenses = 0;

    for (const t of transactions) {
      const amount = Number(t.amount) || 0;
      const isIncome = t.type.includes('Received') || t.type.includes('Income');
      const mode = t.mode ? t.mode.toUpperCase().trim() : 'OTHERS';
      const cleanMode = MODES.includes(mode) ? mode : 'OTHERS';

      if (isIncome) {
        totalIncome += amount;
        incomeByMode[cleanMode] = (incomeByMode[cleanMode] || 0) + amount;
        if (BANK_MODES.includes(cleanMode)) {
          bankIncome += amount;
        } else if (cleanMode === 'CASH') {
          cashIncome += amount;
        }
      } else {
        totalExpenses += amount;
        expensesByMode[cleanMode] = (expensesByMode[cleanMode] || 0) + amount;
        if (BANK_MODES.includes(cleanMode)) {
          bankExpenses += amount;
        } else if (cleanMode === 'CASH') {
          cashExpenses += amount;
        }
      }
    }

    const netIncome = totalIncome - totalExpenses;
    const currentBankBalance = bankIncome - bankExpenses;
    const currentCashBalance = cashIncome - cashExpenses;

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      bankSummary: {
        totalIncome: bankIncome,
        totalExpenses: bankExpenses,
        currentBalance: currentBankBalance
      },
      cashSummary: {
        totalIncome: cashIncome,
        totalExpenses: cashExpenses,
        currentBalance: currentCashBalance
      },
      incomeByMode,
      expensesByMode,
      transactionCount: transactions.length
    };
  }

  /**
   * Aggregate by Financial Year and Quarter (matches Sheet1 right-side pivots)
   */
  static getFYQuarterSummary(transactions) {
    const fyMap = {};

    transactions.forEach(t => {
      const fy = t.financialYear || 'Other';
      const q = t.quarter || 'Other';
      const profit = Number(t.profitValue) || 0;
      const isIncome = t.type.includes('Received') || t.type.includes('Income');
      const amt = Number(t.amount) || 0;

      if (!fyMap[fy]) {
        fyMap[fy] = {
          financialYear: fy,
          totalProfit: 0,
          totalIncome: 0,
          totalExpenses: 0,
          quarters: {
            Q1: { income: 0, expense: 0, profit: 0, count: 0 },
            Q2: { income: 0, expense: 0, profit: 0, count: 0 },
            Q3: { income: 0, expense: 0, profit: 0, count: 0 },
            Q4: { income: 0, expense: 0, profit: 0, count: 0 },
          },
          monthly: {}
        };
      }

      fyMap[fy].totalProfit += profit;
      if (isIncome) {
        fyMap[fy].totalIncome += amt;
      } else {
        fyMap[fy].totalExpenses += amt;
      }

      if (fyMap[fy].quarters[q]) {
        if (isIncome) fyMap[fy].quarters[q].income += amt;
        else fyMap[fy].quarters[q].expense += amt;
        fyMap[fy].quarters[q].profit += profit;
        fyMap[fy].quarters[q].count += 1;
      }

      // Month key YYYY-MMM e.g. 2026-Nov
      const d = new Date(t.date);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthKey = !isNaN(d.getTime()) ? `${d.getFullYear()}-${monthNames[d.getMonth()]}` : 'Unknown';

      if (!fyMap[fy].monthly[monthKey]) {
        fyMap[fy].monthly[monthKey] = { income: 0, expense: 0, profit: 0, count: 0 };
      }
      if (isIncome) fyMap[fy].monthly[monthKey].income += amt;
      else fyMap[fy].monthly[monthKey].expense += amt;
      fyMap[fy].monthly[monthKey].profit += profit;
      fyMap[fy].monthly[monthKey].count += 1;
    });

    return fyMap;
  }

  /**
   * Aggregate by Parties (Clients & Vendors)
   */
  static getPartySummary(transactions) {
    const partyMap = {};

    transactions.forEach(t => {
      const party = (t.partyName || 'Unknown').trim();
      if (!party) return;

      if (!partyMap[party]) {
        partyMap[party] = {
          name: party,
          totalReceived: 0,
          totalPaid: 0,
          netBalance: 0,
          transactionCount: 0,
          lastDate: t.date,
          transactions: []
        };
      }

      const amt = Number(t.amount) || 0;
      const isIncome = t.type.includes('Received') || t.type.includes('Income');

      if (isIncome) {
        partyMap[party].totalReceived += amt;
      } else {
        partyMap[party].totalPaid += amt;
      }

      partyMap[party].netBalance = partyMap[party].totalReceived - partyMap[party].totalPaid;
      partyMap[party].transactionCount += 1;
      if (t.date > partyMap[party].lastDate) {
        partyMap[party].lastDate = t.date;
      }
      partyMap[party].transactions.push(t);
    });

    return Object.values(partyMap).sort((a, b) => (b.totalReceived + b.totalPaid) - (a.totalReceived + a.totalPaid));
  }

  /**
   * Monthly trend for charts
   */
  static getMonthlyTrend(transactions) {
    const monthMap = {};

    transactions.forEach(t => {
      if (!t.date) return;
      const parts = t.date.split('-');
      if (parts.length < 2) return;
      const key = `${parts[0]}-${parts[1]}`; // YYYY-MM

      if (!monthMap[key]) {
        monthMap[key] = { key, income: 0, expense: 0, profit: 0 };
      }

      const amt = Number(t.amount) || 0;
      const isIncome = t.type.includes('Received') || t.type.includes('Income');
      if (isIncome) {
        monthMap[key].income += amt;
      } else {
        monthMap[key].expense += amt;
      }
      monthMap[key].profit = monthMap[key].income - monthMap[key].expense;
    });

    // Sort chronologically
    return Object.keys(monthMap).sort().map(k => {
      const [year, month] = k.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      return {
        key: k,
        label,
        income: monthMap[k].income,
        expense: monthMap[k].expense,
        profit: monthMap[k].profit
      };
    });
  }
}

window.FinanceAnalytics = FinanceAnalytics;
