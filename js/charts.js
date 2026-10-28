/**
 * Dharshithan Waterproofing - Finance Tracker
 * Interactive Financial Charts (Light Theme)
 */

class FinanceCharts {
  constructor() {
    this.trendChart = null;
    this.modeChart = null;
    this.partyChart = null;
  }

  destroyCharts() {
    if (this.trendChart) {
      this.trendChart.destroy();
      this.trendChart = null;
    }
    if (this.modeChart) {
      this.modeChart.destroy();
      this.modeChart = null;
    }
    if (this.partyChart) {
      this.partyChart.destroy();
      this.partyChart = null;
    }
  }

  render(transactions) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded, falling back to SVG charts');
      this.renderSvgFallbacks(transactions);
      return;
    }

    this.renderTrendChart(transactions);
    this.renderModeChart(transactions);
    this.renderPartyChart(transactions);
  }

  renderTrendChart(transactions) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    if (this.trendChart) this.trendChart.destroy();

    const trendData = FinanceAnalytics.getMonthlyTrend(transactions);
    const labels = trendData.length > 0 ? trendData.map(d => d.label) : ['No Data'];
    const incomeData = trendData.length > 0 ? trendData.map(d => d.income) : [0];
    const expenseData = trendData.length > 0 ? trendData.map(d => d.expense) : [0];
    const profitData = trendData.length > 0 ? trendData.map(d => d.profit) : [0];

    this.trendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Income / Turnover (₹)',
            data: incomeData,
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderColor: '#059669',
            borderWidth: 1.5,
            borderRadius: 6,
            order: 2
          },
          {
            label: 'Expenses (₹)',
            data: expenseData,
            backgroundColor: 'rgba(239, 68, 68, 0.85)',
            borderColor: '#dc2626',
            borderWidth: 1.5,
            borderRadius: 6,
            order: 2
          },
          {
            label: 'Net Profit (₹)',
            data: profitData,
            type: 'line',
            borderColor: '#0284c7',
            backgroundColor: 'rgba(2, 132, 199, 0.12)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#0284c7',
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 14,
              font: { family: "'Inter', sans-serif", size: 12, weight: '500' },
              color: '#334155'
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (item) => `${item.dataset.label}: ${FinanceAnalytics.formatINR(item.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: { color: '#64748b', font: { family: "'Inter', sans-serif" } }
          },
          y: {
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: {
              color: '#64748b',
              font: { family: "'Inter', sans-serif" },
              callback: (val) => '₹' + Number(val).toLocaleString('en-IN')
            }
          }
        }
      }
    });
  }

  renderModeChart(transactions) {
    const ctx = document.getElementById('modeChart');
    if (!ctx) return;

    if (this.modeChart) this.modeChart.destroy();

    const metrics = FinanceAnalytics.calculateDashboardMetrics(transactions);
    const modeLabels = ['Cash', 'Netbanking', 'UPI', 'Card', 'Cheque', 'Others'];
    const keys = ['CASH', 'NETBANKING', 'UPI', 'DEBIT CARD / CREDIT CARD', 'CHEQUE', 'OTHERS'];
    
    // Total volume per mode (Income + Expense)
    const values = keys.map(k => (metrics.incomeByMode[k] || 0) + (metrics.expensesByMode[k] || 0));
    const totalVolume = values.reduce((a, b) => a + b, 0);

    const colors = [
      '#10b981', // Cash - Emerald
      '#0284c7', // Netbanking - Sky
      '#8b5cf6', // UPI - Purple
      '#f59e0b', // Card - Amber
      '#06b6d4', // Cheque - Cyan
      '#94a3b8'  // Others - Slate
    ];

    this.modeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: modeLabels,
        datasets: [{
          data: totalVolume > 0 ? values : [1],
          backgroundColor: totalVolume > 0 ? colors : ['#e2e8f0'],
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { family: "'Inter', sans-serif", size: 11 },
              color: '#475569'
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (item) => {
                if (totalVolume === 0) return 'No transaction volume';
                const pct = ((item.raw / totalVolume) * 100).toFixed(1);
                return `${item.label}: ${FinanceAnalytics.formatINR(item.raw)} (${pct}%)`;
              }
            }
          }
        },
        cutout: '68%'
      }
    });
  }

  renderPartyChart(transactions) {
    const ctx = document.getElementById('partyChart');
    if (!ctx) return;

    if (this.partyChart) this.partyChart.destroy();

    const parties = FinanceAnalytics.getPartySummary(transactions).slice(0, 5);
    const labels = parties.length > 0 ? parties.map(p => p.name.length > 18 ? p.name.substring(0, 18) + '...' : p.name) : ['No Parties'];
    const incomeVals = parties.length > 0 ? parties.map(p => p.totalReceived) : [0];
    const expenseVals = parties.length > 0 ? parties.map(p => p.totalPaid) : [0];

    this.partyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Received (Client)',
            data: incomeVals,
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderRadius: 4
          },
          {
            label: 'Paid (Vendor)',
            data: expenseVals,
            backgroundColor: 'rgba(239, 68, 68, 0.85)',
            borderRadius: 4
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { family: "'Inter', sans-serif", size: 11 },
              color: '#475569'
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (item) => `${item.dataset.label}: ${FinanceAnalytics.formatINR(item.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: {
              color: '#64748b',
              font: { family: "'Inter', sans-serif", size: 10 },
              callback: (val) => '₹' + Number(val).toLocaleString('en-IN')
            }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#1e293b', font: { family: "'Inter', sans-serif", size: 11, weight: '500' } }
          }
        }
      }
    });
  }

  renderSvgFallbacks(transactions) {
    const trendElem = document.getElementById('trendChart');
    if (trendElem && trendElem.parentElement) {
      trendElem.parentElement.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
          <p class="font-medium text-slate-700">Financial Performance Overview</p>
          <p class="text-xs text-slate-400 mt-1">Live data ready. Chart.js loads automatically online.</p>
        </div>
      `;
    }
  }
}

window.financeCharts = new FinanceCharts();
