/**
 * Dharshithan Waterproofing - Finance Tracker
 * Financial Computation & Analytics Engine
 * Directly implements all metrics from the master "Dashboard" Worksheet:
 * - Gross Revenue & Operating Costs
 * - Net Profit & Profit Margin % ("Healthy >20%")
 * - Total Liquidity & Liquidity Split
 * - Bank Account Position & Reconciled Health
 * - Cash Position & Float Health ("Replenish Cash" vs "Sufficient Cash")
 * - Channel Turnover & Disbursement Mix
 * - Historical Profit Trends (Monthly & Quarterly)
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
  static formatINR(val, options = {}) {
    if (val === undefined || val === null || isNaN(val)) return '₹0.00';
    const num = Number(val);
    const isNegative = num < 0;
    const absVal = Math.abs(num);

    const parts = absVal.toFixed(2).split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1];

    let lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    const formattedString = `${formattedInteger}.${decimalPart}`;

    if (options.parenthesesNegative && isNegative) {
      return `₹(${formattedString})`;
    }
    return isNegative ? `-₹${formattedString}` : `₹${formattedString}`;
  }

  static formatK(val) {
    const num = Number(val) || 0;
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
    if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
    if (abs >= 1000) return `${sign}₹${Math.round(abs / 1000)}k`;
    return `${sign}₹${Math.round(abs)}`;
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
   * Complete calculation matching the master "Dashboard" Worksheet in Google Sheets
   */
  static calculateDashboardMetrics(transactions) {
    let grossRevenue = 0;
    let operatingCosts = 0;

    const incomeByMode = {};
    const expensesByMode = {};
    MODES.forEach(m => {
      incomeByMode[m] = 0;
      expensesByMode[m] = 0;
    });

    let bankInflows = 0;
    let bankOutflows = 0;
    let cashInflows = 0;
    let cashExpenses = 0;

    for (const t of transactions) {
      const amount = Number(t.amount) || 0;
      const isIncome = t.type.includes('Received') || t.type.includes('Income');
      const mode = t.mode ? t.mode.toUpperCase().trim() : 'OTHERS';
      const cleanMode = MODES.includes(mode) ? mode : 'OTHERS';

      if (isIncome) {
        grossRevenue += amount;
        incomeByMode[cleanMode] = (incomeByMode[cleanMode] || 0) + amount;
        if (cleanMode === 'CASH') {
          cashInflows += amount;
        } else {
          bankInflows += amount;
        }
      } else {
        operatingCosts += amount;
        expensesByMode[cleanMode] = (expensesByMode[cleanMode] || 0) + amount;
        if (cleanMode === 'CASH') {
          cashExpenses += amount;
        } else {
          bankOutflows += amount;
        }
      }
    }

    const netProfit = grossRevenue - operatingCosts;
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    
    // Float values from localStorage or default to 0
    const openingBankBalance = parseFloat(localStorage.getItem('dharshithan_opening_bank') || '0');
    const openingCashFloat = parseFloat(localStorage.getItem('dharshithan_opening_cash') || '0');

    const bankMovement = bankInflows - bankOutflows;
    const currentBankBalance = openingBankBalance + bankMovement;

    const netCashMovement = cashInflows - cashExpenses;
    const availableCashInHand = openingCashFloat + netCashMovement;

    const totalLiquidity = currentBankBalance + availableCashInHand;

    // Health indicators exactly matching Google Sheet
    const isProfitHealthy = profitMargin >= 20.0;
    const accountHealth = currentBankBalance >= 0 ? 'Reconciled' : 'Overdrawn';
    const cashHealth = availableCashInHand >= 0 ? 'Sufficient Cash' : 'Replenish Cash';

    const liquiditySplit = `${FinanceAnalytics.formatK(currentBankBalance)} Bank / ${FinanceAnalytics.formatK(availableCashInHand)} Cash`;

    return {
      grossRevenue,
      operatingCosts,
      netProfit,
      profitMargin,
      isProfitHealthy,
      totalLiquidity,
      liquiditySplit,
      bankPosition: {
        totalInflows: bankInflows,
        totalOutflows: bankOutflows,
        operatingMovement: bankMovement,
        openingBalance: openingBankBalance,
        currentBalance: currentBankBalance,
        accountHealth
      },
      cashPosition: {
        totalInflows: cashInflows,
        totalExpenses: cashExpenses,
        netCashMovement,
        openingCashFloat,
        availableCashInHand,
        cashHealth
      },
      incomeByMode,
      expensesByMode,
      transactionCount: transactions.length
    };
  }

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

  static getMonthlyTrend(transactions) {
    const monthMap = {};

    transactions.forEach(t => {
      if (!t.date) return;
      const parts = t.date.split('-');
      if (parts.length < 2) return;
      const key = `${parts[0]}-${parts[1]}`;

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
  /**
   * Convert Indian Currency Amount (INR) to Words
   * Example: 125000 -> One Lakh Twenty Five Thousand Rupees Only
   */
  static amountToWords(num) {
    if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
    const a = [
      '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
      'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
      'Seventeen ', 'Eighteen ', 'Nineteen '
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n) => {
      let str = '';
      if (n > 19) {
        str += b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : ' ');
      } else {
        str += a[n];
      }
      return str;
    };

    let n = Math.floor(num);
    const paise = Math.round((num - n) * 100);

    let output = '';
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const hundred = Math.floor(n / 100);
    n %= 100;

    if (crore > 0) output += inWords(crore) + 'Crore ';
    if (lakh > 0) output += inWords(lakh) + 'Lakh ';
    if (thousand > 0) output += inWords(thousand) + 'Thousand ';
    if (hundred > 0) output += inWords(hundred) + 'Hundred ';
    if (n > 0) {
      if (output !== '') output += 'and ';
      output += inWords(n);
    }

    output = output.trim() + ' Rupees';
    if (paise > 0) {
      output += ' and ' + inWords(paise).trim() + ' Paise';
    }
    return output + ' Only';
  }

  /**
   * Compute GST Tax Breakdown (18% Standard for Waterproofing SAC 9954)
   */
  static calculateGST(subtotal, ratePercent = 18, isInterstate = false) {
    const sub = Number(subtotal) || 0;
    const rate = Number(ratePercent) || 0;
    const totalTax = (sub * rate) / 100;

    if (isInterstate) {
      return {
        subtotal: sub,
        cgst: 0,
        sgst: 0,
        igst: totalTax,
        totalTax,
        grandTotal: sub + totalTax
      };
    }

    const halfTax = totalTax / 2;
    return {
      subtotal: sub,
      cgst: halfTax,
      sgst: halfTax,
      igst: 0,
      totalTax,
      grandTotal: sub + totalTax
    };
  }
}

if (typeof window !== 'undefined') {
  window.FinanceAnalytics = FinanceAnalytics;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FinanceAnalytics;
}
