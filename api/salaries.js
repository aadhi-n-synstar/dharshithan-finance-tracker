const { getSql } = require('../lib/db');
const { numberToWordsINR } = require('../lib/inr-words');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Role, X-User-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getSql();
  const userRole = req.headers['x-user-role'] || 'SUPER_ADMIN';
  const userId = req.headers['x-user-id'] || null;

  try {
    // ----------------------------------------------------
    // GET: List or fetch salary disbursements
    // ----------------------------------------------------
    if (req.method === 'GET') {
      const { id, month, search } = req.query || {};

      if (id) {
        const rows = await sql.query('SELECT * FROM salary_disbursements WHERE id = $1', [id]);
        if (!rows || rows.length === 0) {
          return res.status(404).json({ error: 'Salary disbursement record not found' });
        }
        return res.status(200).json({ salary: rows[0] });
      }

      let query = 'SELECT * FROM salary_disbursements WHERE 1=1';
      const params = [];

      if (month) {
        params.push(month);
        query += ` AND disbursement_month = $${params.length}`;
      }
      if (search) {
        params.push(`%${search}%`);
        query += ` AND (employee_name ILIKE $${params.length} OR employee_id ILIKE $${params.length} OR disbursement_no ILIKE $${params.length} OR designation ILIKE $${params.length})`;
      }

      query += ' ORDER BY disbursement_date DESC, created_at DESC';
      const rows = await sql.query(query, params);
      return res.status(200).json({ salaries: rows });
    }

    // ----------------------------------------------------
    // POST: Create Salary Disbursement + Linked Payment Voucher
    // ----------------------------------------------------
    if (req.method === 'POST') {
      if (userRole === 'AUDITOR') {
        return res.status(403).json({ error: 'Auditors have read-only permissions.' });
      }

      const body = req.body || {};
      const {
        disbursement_month,
        disbursement_date = new Date().toISOString().split('T')[0],
        employee_name,
        employee_id = '',
        designation = 'Waterproofing Applicator',
        bank_account_no = '',
        ifsc_code = '',
        basic_pay = 0,
        hra = 0,
        special_allowance = 0,
        pf_deduction = 0,
        esi_deduction = 0,
        tds_deduction = 0,
        advance_adjustment = 0,
        payment_mode = 'Bank Transfer',
        transaction_ref = ''
      } = body;

      if (!employee_name || !disbursement_month) {
        return res.status(400).json({ error: 'Employee Name and Disbursement Month are required' });
      }

      const numBasic = parseFloat(basic_pay) || 0;
      const numHra = parseFloat(hra) || 0;
      const numSpecial = parseFloat(special_allowance) || 0;
      const total_earnings = Math.round((numBasic + numHra + numSpecial) * 100) / 100;

      const numPf = parseFloat(pf_deduction) || 0;
      const numEsi = parseFloat(esi_deduction) || 0;
      const numTds = parseFloat(tds_deduction) || 0;
      const numAdv = parseFloat(advance_adjustment) || 0;
      const total_deductions = Math.round((numPf + numEsi + numTds + numAdv) * 100) / 100;

      const net_salary = Math.round((total_earnings - total_deductions) * 100) / 100;
      const net_salary_words = numberToWordsINR(net_salary);

      // Auto-generate disbursement_no: DWCS/SAL/YYYY/XXX
      let disbursement_no = body.disbursement_no;
      if (!disbursement_no) {
        const year = new Date(disbursement_date).getFullYear() || 2026;
        const countRes = await sql.query('SELECT count(*)::int as count FROM salary_disbursements');
        const nextNum = String(countRes[0].count + 1).padStart(3, '0');
        disbursement_no = `DWCS/SAL/${year}/${nextNum}`;
      }

      // 1. Auto-register corresponding debit in financial_vouchers
      const vCount = await sql.query('SELECT count(*)::int as count FROM financial_vouchers');
      const vouYear = new Date(disbursement_date).getFullYear() || 2026;
      const vouNum = `DWCS/VOU/${vouYear}/${String(vCount[0].count + 1).padStart(3, '0')}`;

      const voucherRes = await sql.query(`
        INSERT INTO financial_vouchers (
          voucher_no, voucher_type, category, voucher_date, paid_to_or_received_from,
          amount, amount_in_words, payment_mode, reference_number, narration, prepared_by, status
        ) VALUES (
          $1, 'PAYMENT', 'Salary Disbursement', $2, $3, $4, $5, $6, $7, $8, $9, 'CONFIRMED'
        ) RETURNING id
      `, [
        vouNum, disbursement_date, employee_name, net_salary, net_salary_words,
        payment_mode, transaction_ref,
        `Salary Disbursement for ${disbursement_month} - ${employee_name} (${designation})`,
        userId
      ]);

      const linked_voucher_id = voucherRes[0].id;

      // 2. Insert into salary_disbursements
      const insertRes = await sql.query(`
        INSERT INTO salary_disbursements (
          disbursement_no, disbursement_month, disbursement_date, employee_name, employee_id,
          designation, bank_account_no, ifsc_code, basic_pay, hra, special_allowance,
          total_earnings, pf_deduction, esi_deduction, tds_deduction, advance_adjustment,
          total_deductions, net_salary, net_salary_words, payment_mode, transaction_ref,
          linked_voucher_id, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        ) RETURNING *
      `, [
        disbursement_no, disbursement_month, disbursement_date, employee_name, employee_id,
        designation, bank_account_no, ifsc_code, numBasic, numHra, numSpecial,
        total_earnings, numPf, numEsi, numTds, numAdv,
        total_deductions, net_salary, net_salary_words, payment_mode, transaction_ref,
        linked_voucher_id, userId
      ]);

      const createdSalary = insertRes[0];

      // Audit Log
      await sql.query(`
        INSERT INTO finance_audit_logs (table_name, record_id, action, performed_by, reason, new_state)
        VALUES ('salary_disbursements', $1, 'INSERT', $2, 'Salary disbursed and voucher linked', $3)
      `, [createdSalary.id, userId, JSON.stringify(createdSalary)]);

      return res.status(201).json({ success: true, salary: createdSalary, linked_voucher_no: vouNum });
    }

    // ----------------------------------------------------
    // PUT: Update Salary Disbursement
    // ----------------------------------------------------
    if (req.method === 'PUT') {
      if (userRole === 'AUDITOR') {
        return res.status(403).json({ error: 'Auditors have read-only permissions.' });
      }

      const body = req.body || {};
      const { id, audit_reason = 'Salary details adjusted' } = body;
      if (!id) return res.status(400).json({ error: 'Salary ID is required' });

      const prevRows = await sql.query('SELECT * FROM salary_disbursements WHERE id = $1', [id]);
      if (!prevRows.length) return res.status(404).json({ error: 'Salary record not found' });
      const previousState = prevRows[0];

      const numBasic = body.basic_pay !== undefined ? parseFloat(body.basic_pay) : parseFloat(previousState.basic_pay);
      const numHra = body.hra !== undefined ? parseFloat(body.hra) : parseFloat(previousState.hra);
      const numSpecial = body.special_allowance !== undefined ? parseFloat(body.special_allowance) : parseFloat(previousState.special_allowance);
      const total_earnings = Math.round((numBasic + numHra + numSpecial) * 100) / 100;

      const numPf = body.pf_deduction !== undefined ? parseFloat(body.pf_deduction) : parseFloat(previousState.pf_deduction);
      const numEsi = body.esi_deduction !== undefined ? parseFloat(body.esi_deduction) : parseFloat(previousState.esi_deduction);
      const numTds = body.tds_deduction !== undefined ? parseFloat(body.tds_deduction) : parseFloat(previousState.tds_deduction);
      const numAdv = body.advance_adjustment !== undefined ? parseFloat(body.advance_adjustment) : parseFloat(previousState.advance_adjustment);
      const total_deductions = Math.round((numPf + numEsi + numTds + numAdv) * 100) / 100;

      const net_salary = Math.round((total_earnings - total_deductions) * 100) / 100;
      const net_salary_words = numberToWordsINR(net_salary);

      const updated = await sql.query(`
        UPDATE salary_disbursements SET
          disbursement_month = COALESCE($1, disbursement_month),
          disbursement_date = COALESCE($2, disbursement_date),
          employee_name = COALESCE($3, employee_name),
          employee_id = COALESCE($4, employee_id),
          designation = COALESCE($5, designation),
          bank_account_no = COALESCE($6, bank_account_no),
          ifsc_code = COALESCE($7, ifsc_code),
          basic_pay = $8,
          hra = $9,
          special_allowance = $10,
          total_earnings = $11,
          pf_deduction = $12,
          esi_deduction = $13,
          tds_deduction = $14,
          advance_adjustment = $15,
          total_deductions = $16,
          net_salary = $17,
          net_salary_words = $18,
          payment_mode = COALESCE($19, payment_mode),
          transaction_ref = COALESCE($20, transaction_ref)
        WHERE id = $21
        RETURNING *
      `, [
        body.disbursement_month, body.disbursement_date, body.employee_name, body.employee_id,
        body.designation, body.bank_account_no, body.ifsc_code, numBasic, numHra, numSpecial,
        total_earnings, numPf, numEsi, numTds, numAdv,
        total_deductions, net_salary, net_salary_words, body.payment_mode, body.transaction_ref, id
      ]);

      // Also update linked voucher amount if present
      if (previousState.linked_voucher_id) {
        await sql.query(`
          UPDATE financial_vouchers SET
            amount = $1,
            amount_in_words = $2,
            paid_to_or_received_from = COALESCE($3, paid_to_or_received_from)
          WHERE id = $4
        `, [net_salary, net_salary_words, body.employee_name, previousState.linked_voucher_id]);
      }

      // Audit Log
      await sql.query(`
        INSERT INTO finance_audit_logs (table_name, record_id, action, performed_by, reason, previous_state, new_state)
        VALUES ('salary_disbursements', $1, 'UPDATE', $2, $3, $4, $5)
      `, [id, userId, audit_reason, JSON.stringify(previousState), JSON.stringify(updated[0])]);

      return res.status(200).json({ success: true, salary: updated[0] });
    }

    // ----------------------------------------------------
    // DELETE: Delete Salary Disbursement + Linked Voucher
    // ----------------------------------------------------
    if (req.method === 'DELETE') {
      if (userRole === 'AUDITOR') {
        return res.status(403).json({ error: 'Auditors have read-only permissions.' });
      }

      const { id, reason = 'Salary record cancelled' } = req.body || req.query || {};
      if (!id) return res.status(400).json({ error: 'Salary ID is required' });

      const prevRows = await sql.query('SELECT * FROM salary_disbursements WHERE id = $1', [id]);
      if (!prevRows.length) return res.status(404).json({ error: 'Salary record not found' });
      const previousState = prevRows[0];

      // Void/delete linked voucher
      if (previousState.linked_voucher_id) {
        await sql.query(`UPDATE financial_vouchers SET status = 'CANCELLED' WHERE id = $1`, [previousState.linked_voucher_id]);
      }

      await sql.query('DELETE FROM salary_disbursements WHERE id = $1', [id]);

      // Audit Log
      await sql.query(`
        INSERT INTO finance_audit_logs (table_name, record_id, action, performed_by, reason, previous_state)
        VALUES ('salary_disbursements', $1, 'DELETE', $2, $3, $4)
      `, [id, userId, reason, JSON.stringify(previousState)]);

      return res.status(200).json({ success: true, message: 'Salary record removed and voucher voided' });
    }

    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Salaries API error:', err);
    res.status(500).json({ error: err.message });
  }
};
