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
    // GET: List or fetch vouchers
    // ----------------------------------------------------
    if (req.method === 'GET') {
      const { id, type, category, from_date, to_date, search, status } = req.query || {};

      if (id) {
        const rows = await sql.query('SELECT * FROM financial_vouchers WHERE id = $1', [id]);
        if (!rows || rows.length === 0) {
          return res.status(404).json({ error: 'Voucher not found' });
        }
        return res.status(200).json({ voucher: rows[0] });
      }

      let query = 'SELECT * FROM financial_vouchers WHERE 1=1';
      const params = [];

      if (type) {
        params.push(type);
        query += ` AND voucher_type = $${params.length}`;
      }
      if (category) {
        params.push(category);
        query += ` AND category = $${params.length}`;
      }
      if (status) {
        params.push(status);
        query += ` AND status = $${params.length}`;
      }
      if (search) {
        params.push(`%${search}%`);
        query += ` AND (voucher_no ILIKE $${params.length} OR paid_to_or_received_from ILIKE $${params.length} OR narration ILIKE $${params.length} OR reference_number ILIKE $${params.length})`;
      }
      if (from_date) {
        params.push(from_date);
        query += ` AND voucher_date >= $${params.length}`;
      }
      if (to_date) {
        params.push(to_date);
        query += ` AND voucher_date <= $${params.length}`;
      }

      query += ' ORDER BY voucher_date DESC, created_at DESC';
      const rows = await sql.query(query, params);
      return res.status(200).json({ vouchers: rows });
    }

    // ----------------------------------------------------
    // POST: Create new Financial Voucher
    // ----------------------------------------------------
    if (req.method === 'POST') {
      if (userRole === 'AUDITOR') {
        return res.status(403).json({ error: 'Auditors have read-only permissions.' });
      }

      const body = req.body || {};
      const {
        voucher_type = 'PAYMENT',
        category = 'Material Cost',
        voucher_date = new Date().toISOString().split('T')[0],
        paid_to_or_received_from,
        amount,
        payment_mode = 'Bank Transfer',
        reference_number = '',
        narration = '',
        approved_by = 'Partner / Managing Director',
        status = 'CONFIRMED'
      } = body;

      if (!paid_to_or_received_from || amount === undefined) {
        return res.status(400).json({ error: 'Payee/Party and Amount are required' });
      }

      const parsedAmount = Math.round(parseFloat(amount) * 100) / 100;
      const amount_in_words = body.amount_in_words || numberToWordsINR(parsedAmount);

      // Auto-generate voucher_no: DWCS/VOU/YYYY/XXX
      let voucher_no = body.voucher_no;
      if (!voucher_no) {
        const year = new Date(voucher_date).getFullYear() || 2026;
        const countRes = await sql.query('SELECT count(*)::int as count FROM financial_vouchers');
        const nextNum = String(countRes[0].count + 1).padStart(3, '0');
        voucher_no = `DWCS/VOU/${year}/${nextNum}`;
      }

      const insertRes = await sql.query(`
        INSERT INTO financial_vouchers (
          voucher_no, voucher_type, category, voucher_date, paid_to_or_received_from,
          amount, amount_in_words, payment_mode, reference_number, narration, prepared_by, approved_by, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        ) RETURNING *
      `, [
        voucher_no, voucher_type, category, voucher_date, paid_to_or_received_from,
        parsedAmount, amount_in_words, payment_mode, reference_number, narration,
        userId, approved_by, status
      ]);

      const createdVoucher = insertRes[0];

      // Audit log
      await sql.query(`
        INSERT INTO finance_audit_logs (table_name, record_id, action, performed_by, reason, new_state)
        VALUES ('financial_vouchers', $1, 'INSERT', $2, 'Financial Voucher created', $3)
      `, [createdVoucher.id, userId, JSON.stringify(createdVoucher)]);

      return res.status(201).json({ success: true, voucher: createdVoucher });
    }

    // ----------------------------------------------------
    // PUT: Update Financial Voucher
    // ----------------------------------------------------
    if (req.method === 'PUT') {
      if (userRole === 'AUDITOR') {
        return res.status(403).json({ error: 'Auditors have read-only permissions.' });
      }

      const body = req.body || {};
      const { id, audit_reason = 'Voucher details updated' } = body;
      if (!id) return res.status(400).json({ error: 'Voucher ID is required' });

      const prevRows = await sql.query('SELECT * FROM financial_vouchers WHERE id = $1', [id]);
      if (!prevRows.length) return res.status(404).json({ error: 'Voucher not found' });
      const previousState = prevRows[0];

      let parsedAmount = body.amount !== undefined ? Math.round(parseFloat(body.amount) * 100) / 100 : previousState.amount;
      let amount_in_words = body.amount !== undefined ? numberToWordsINR(parsedAmount) : previousState.amount_in_words;

      const updated = await sql.query(`
        UPDATE financial_vouchers SET
          voucher_type = COALESCE($1, voucher_type),
          category = COALESCE($2, category),
          voucher_date = COALESCE($3, voucher_date),
          paid_to_or_received_from = COALESCE($4, paid_to_or_received_from),
          amount = $5,
          amount_in_words = $6,
          payment_mode = COALESCE($7, payment_mode),
          reference_number = COALESCE($8, reference_number),
          narration = COALESCE($9, narration),
          approved_by = COALESCE($10, approved_by),
          status = COALESCE($11, status)
        WHERE id = $12
        RETURNING *
      `, [
        body.voucher_type, body.category, body.voucher_date, body.paid_to_or_received_from,
        parsedAmount, amount_in_words, body.payment_mode, body.reference_number,
        body.narration, body.approved_by, body.status, id
      ]);

      // Audit log
      await sql.query(`
        INSERT INTO finance_audit_logs (table_name, record_id, action, performed_by, reason, previous_state, new_state)
        VALUES ('financial_vouchers', $1, 'UPDATE', $2, $3, $4, $5)
      `, [id, userId, audit_reason, JSON.stringify(previousState), JSON.stringify(updated[0])]);

      return res.status(200).json({ success: true, voucher: updated[0] });
    }

    // ----------------------------------------------------
    // DELETE / VOID: Void or Delete Voucher
    // ----------------------------------------------------
    if (req.method === 'DELETE') {
      if (userRole === 'AUDITOR') {
        return res.status(403).json({ error: 'Auditors have read-only permissions.' });
      }

      const { id, reason = 'Voided by authorized user', hard_delete = false } = req.body || req.query || {};
      if (!id) return res.status(400).json({ error: 'Voucher ID is required' });

      const prevRows = await sql.query('SELECT * FROM financial_vouchers WHERE id = $1', [id]);
      if (!prevRows.length) return res.status(404).json({ error: 'Voucher not found' });
      const previousState = prevRows[0];

      if (hard_delete && userRole === 'SUPER_ADMIN') {
        await sql.query('DELETE FROM financial_vouchers WHERE id = $1', [id]);
        await sql.query(`
          INSERT INTO finance_audit_logs (table_name, record_id, action, performed_by, reason, previous_state)
          VALUES ('financial_vouchers', $1, 'DELETE', $2, $3, $4)
        `, [id, userId, reason, JSON.stringify(previousState)]);
        return res.status(200).json({ success: true, message: 'Voucher permanently deleted' });
      } else {
        const voided = await sql.query(`
          UPDATE financial_vouchers SET status = 'CANCELLED' WHERE id = $1 RETURNING *
        `, [id]);
        await sql.query(`
          INSERT INTO finance_audit_logs (table_name, record_id, action, performed_by, reason, previous_state, new_state)
          VALUES ('financial_vouchers', $1, 'VOID', $2, $3, $4, $5)
        `, [id, userId, reason, JSON.stringify(previousState), JSON.stringify(voided[0])]);
        return res.status(200).json({ success: true, message: 'Voucher marked CANCELLED / VOID', voucher: voided[0] });
      }
    }

    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Vouchers API error:', err);
    res.status(500).json({ error: err.message });
  }
};
