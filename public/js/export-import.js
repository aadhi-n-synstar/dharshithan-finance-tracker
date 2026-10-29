/**
 * Dharshithan Waterproofing - Finance Tracker
 * Export / Import Engine (Google Sheets CSV, JSON, Clipboard)
 */

class FinanceDataTransfer {
  /**
   * Export transactions to CSV matching Google Sheets format
   */
  static exportToCSV(transactions) {
    const headers = [
      'Sl No.',
      'Date',
      'Paid / Received',
      'Party Name',
      'Description',
      'Amount',
      'Mode ',
      'Ref Number / Remarks',
      'Quarter',
      'Profit Value'
    ];

    const rows = transactions.map((t, idx) => {
      const slNo = t.slNo || (idx + 1);
      const dateDisplay = FinanceAnalytics.formatDateDisplay(t.date);
      const type = t.type;
      const party = (t.partyName || '').replace(/"/g, '""');
      const desc = (t.description || '').replace(/"/g, '""');
      const amount = (Number(t.amount) || 0).toFixed(2);
      const mode = t.mode || 'CASH';
      const ref = (t.refNumber || '').replace(/"/g, '""');
      const quarter = t.quarter || 'Q3';
      const profit = (Number(t.profitValue) || (t.type.includes('Received') ? Number(t.amount) : -Number(t.amount))).toFixed(2);

      return [
        slNo,
        `"${dateDisplay}"`,
        `"${type}"`,
        `"${party}"`,
        `"${desc}"`,
        amount,
        `"${mode}"`,
        `"${ref}"`,
        `"${quarter}"`,
        profit
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Dharshithan_Waterproofing_Finance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Copy Tab-Delimited text to clipboard for direct pasting into Google Sheets
   */
  static async copyForGoogleSheets(transactions) {
    const headers = [
      'Sl No.',
      'Date',
      'Paid / Received',
      'Party Name',
      'Description',
      'Amount',
      'Mode ',
      'Ref Number / Remarks',
      'Quarter',
      'Profit Value'
    ];

    const rows = transactions.map((t, idx) => {
      const slNo = t.slNo || (idx + 1);
      const dateDisplay = FinanceAnalytics.formatDateDisplay(t.date);
      const type = t.type;
      const party = t.partyName || '';
      const desc = t.description || '';
      const amount = Number(t.amount) || 0;
      const mode = t.mode || 'CASH';
      const ref = t.refNumber || '';
      const quarter = t.quarter || '';
      const profit = Number(t.profitValue) || (t.type.includes('Received') ? amount : -amount);

      return [
        slNo,
        dateDisplay,
        type,
        party,
        desc,
        amount,
        mode,
        ref,
        quarter,
        profit
      ].join('\t');
    });

    const tsvContent = [headers.join('\t'), ...rows].join('\n');
    await navigator.clipboard.writeText(tsvContent);
  }

  /**
   * Export entire DB to JSON backup
   */
  static exportToJSON(transactions) {
    const payload = {
      appName: 'Dharshithan Waterproofing - Finance Tracker',
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      totalRecords: transactions.length,
      transactions: transactions
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Dharshithan_Finance_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Parse CSV content into transaction objects
   */
  static parseCSV(text) {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    // Simple regex CSV splitter handling quotes
    const splitCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map(s => s.replace(/^["']|["']$/g, '').trim());
    };

    const rawHeaders = splitCSVLine(lines[0]);
    const headers = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    const parsedTransactions = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i]);
      if (cols.length < 3) continue;

      const rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] !== undefined ? cols[idx] : '';
      });

      // Parse fields
      const party = rowObj['partyname'] || rowObj['party'] || rowObj['name'] || 'Unknown Party';
      const desc = rowObj['description'] || rowObj['desc'] || rowObj['details'] || '';
      const rawAmt = (rowObj['amount'] || rowObj['profitvalue'] || '0').replace(/[₹,\s]/g, '');
      const amount = Math.abs(parseFloat(rawAmt) || 0);

      const rawType = (rowObj['paidreceived'] || rowObj['type'] || '').toLowerCase();
      let type = 'Received / Income';
      if (rawType.includes('paid') || rawType.includes('expense') || rawAmt.startsWith('-')) {
        type = 'Paid / Expense';
      }

      // Date parsing: e.g. 1-Nov-2026, 2026-11-01, or 01/11/2026
      let date = new Date().toISOString().slice(0, 10);
      const rawDate = rowObj['date'] || '';
      if (rawDate) {
        const parsedDate = new Date(rawDate);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString().slice(0, 10);
        } else {
          // Attempt DD-MMM-YYYY or DD/MM/YYYY
          const parts = rawDate.split(/[-/]/);
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const yr = parseInt(parts[2], 10);
            const mStr = parts[1].toLowerCase();
            const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
            const m = months[mStr.slice(0, 3)] !== undefined ? months[mStr.slice(0, 3)] : (parseInt(mStr, 10) - 1);
            if (!isNaN(day) && !isNaN(yr) && !isNaN(m)) {
              const d = new Date(yr, m, day);
              if (!isNaN(d.getTime())) {
                date = d.toISOString().slice(0, 10);
              }
            }
          }
        }
      }

      const mode = (rowObj['mode'] || 'CASH').toUpperCase();
      const ref = rowObj['refnumberremarks'] || rowObj['refnumber'] || rowObj['remarks'] || rowObj['ref'] || '';

      const meta = FinanceDB.getFinancialMetadata(date);

      parsedTransactions.push({
        date,
        type,
        partyName: party,
        category: type.includes('Received') ? 'Client Waterproofing' : 'Operating Expense',
        description: desc,
        amount,
        mode,
        refNumber: ref,
        quarter: rowObj['quarter'] || meta.quarter,
        financialYear: meta.financialYear
      });
    }

    return parsedTransactions;
  }
}

window.FinanceDataTransfer = FinanceDataTransfer;
