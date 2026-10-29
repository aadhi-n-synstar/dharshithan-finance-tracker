const { getSql } = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Role, X-User-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getSql();

  try {
    // 1. Invoices & Tax Revenue Aggregation
    const invRes = await sql.query(`
      SELECT
        COUNT(*)::int as total_invoices,
        COALESCE(SUM(grand_total), 0)::numeric as total_billed,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN grand_total ELSE 0 END), 0)::numeric as total_received,
        COALESCE(SUM(CASE WHEN status != 'PAID' AND status != 'CANCELLED' THEN grand_total ELSE 0 END), 0)::numeric as total_pending,
        COALESCE(SUM(cgst_amount), 0)::numeric as total_cgst,
        COALESCE(SUM(sgst_amount), 0)::numeric as total_sgst,
        COALESCE(SUM(igst_amount), 0)::numeric as total_igst,
        COALESCE(SUM(cgst_amount + sgst_amount + igst_amount), 0)::numeric as total_tax_collected
      FROM invoices_receipts
      WHERE status != 'CANCELLED'
    `);

    // 2. Vouchers Expense Aggregation (Excluding Salary Disbursement if linked to avoid double-counting)
    const vouRes = await sql.query(`
      SELECT
        COUNT(*)::int as total_vouchers,
        COALESCE(SUM(amount), 0)::numeric as total_expenses,
        COALESCE(SUM(CASE WHEN category = 'Material Cost' THEN amount ELSE 0 END), 0)::numeric as material_cost,
        COALESCE(SUM(CASE WHEN category = 'Chemical Purchase' THEN amount ELSE 0 END), 0)::numeric as chemical_cost,
        COALESCE(SUM(CASE WHEN category = 'Subcontractor' THEN amount ELSE 0 END), 0)::numeric as subcontractor_cost,
        COALESCE(SUM(CASE WHEN category = 'Salary Disbursement' THEN amount ELSE 0 END), 0)::numeric as salary_vouchers_cost,
        COALESCE(SUM(CASE WHEN category NOT IN ('Material Cost', 'Chemical Purchase', 'Subcontractor', 'Salary Disbursement') THEN amount ELSE 0 END), 0)::numeric as overheads_cost
      FROM financial_vouchers
      WHERE status != 'CANCELLED' AND voucher_type = 'PAYMENT'
    `);

    // 3. Salary Disbursements Aggregation
    const salRes = await sql.query(`
      SELECT
        COUNT(*)::int as total_salaries_count,
        COALESCE(SUM(total_earnings), 0)::numeric as gross_salaries,
        COALESCE(SUM(total_deductions), 0)::numeric as total_statutory_deductions,
        COALESCE(SUM(net_salary), 0)::numeric as net_salaries_disbursed
      FROM salary_disbursements
    `);

    // 4. Recent Ledgers
    const recentInvoices = await sql.query(`
      SELECT id, receipt_no, date, client_name, grand_total, payment_mode, status
      FROM invoices_receipts
      ORDER BY date DESC, created_at DESC
      LIMIT 5
    `);

    const recentVouchers = await sql.query(`
      SELECT id, voucher_no, voucher_type, category, voucher_date, paid_to_or_received_from, amount, payment_mode, status
      FROM financial_vouchers
      ORDER BY voucher_date DESC, created_at DESC
      LIMIT 5
    `);

    const invoiceStats = invRes[0] || {};
    const voucherStats = vouRes[0] || {};
    const salaryStats = salRes[0] || {};

    const totalReceived = parseFloat(invoiceStats.total_received) || 0;
    const totalExpenses = parseFloat(voucherStats.total_expenses) || 0;
    const netCashSurplus = Math.round((totalReceived - totalExpenses) * 100) / 100;

    return res.status(200).json({
      metrics: {
        invoices: {
          count: invoiceStats.total_invoices || 0,
          total_billed: parseFloat(invoiceStats.total_billed) || 0,
          total_received: totalReceived,
          total_pending: parseFloat(invoiceStats.total_pending) || 0,
          cgst: parseFloat(invoiceStats.total_cgst) || 0,
          sgst: parseFloat(invoiceStats.total_sgst) || 0,
          igst: parseFloat(invoiceStats.total_igst) || 0,
          total_tax: parseFloat(invoiceStats.total_tax_collected) || 0
        },
        expenses: {
          count: voucherStats.total_vouchers || 0,
          total_expenses: totalExpenses,
          material: parseFloat(voucherStats.material_cost) || 0,
          chemical: parseFloat(voucherStats.chemical_cost) || 0,
          subcontractor: parseFloat(voucherStats.subcontractor_cost) || 0,
          salary_disbursements: parseFloat(voucherStats.salary_vouchers_cost) || 0,
          overheads: parseFloat(voucherStats.overheads_cost) || 0
        },
        salaries: {
          count: salaryStats.total_salaries_count || 0,
          gross: parseFloat(salaryStats.gross_salaries) || 0,
          deductions: parseFloat(salaryStats.total_statutory_deductions) || 0,
          net_disbursed: parseFloat(salaryStats.net_salaries_disbursed) || 0
        },
        net_cash_surplus: netCashSurplus,
        recent_invoices: recentInvoices,
        recent_vouchers: recentVouchers
      }
    });
  } catch (err) {
    console.error('Dashboard metrics error:', err);
    res.status(500).json({ error: err.message });
  }
};
