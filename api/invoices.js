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
    // GET: List or fetch specific invoice
    // ----------------------------------------------------
    if (req.method === 'GET') {
      const { id, search, status, from_date, to_date, client } = req.query || {};

      if (id) {
        const invRows = await sql.query('SELECT * FROM invoices_receipts WHERE id = $1', [id]);
        if (!invRows || invRows.length === 0) {
          return res.status(404).json({ error: 'Invoice not found' });
        }
        const items = await sql.query('SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY id ASC', [id]);
        return res.status(200).json({ invoice: invRows[0], items });
      }

      let query = `
        SELECT i.*, 
          (SELECT count(*)::int FROM invoice_line_items WHERE invoice_id = i.id) as item_count
        FROM invoices_receipts i
        WHERE 1=1
      `;
      const params = [];

      if (search) {
        params.push(`%${search}%`);
        query += ` AND (i.receipt_no ILIKE $${params.length} OR i.client_name ILIKE $${params.length} OR i.site_location ILIKE $${params.length} OR i.client_gstin ILIKE $${params.length})`;
      }
      if (status) {
        params.push(status);
        query += ` AND i.status = $${params.length}`;
      }
      if (client) {
        params.push(`%${client}%`);
        query += ` AND i.client_name ILIKE $${params.length}`;
      }
      if (from_date) {
        params.push(from_date);
        query += ` AND i.date >= $${params.length}`;
      }
      if (to_date) {
        params.push(to_date);
        query += ` AND i.date <= $${params.length}`;
      }

      query += ' ORDER BY i.date DESC, i.created_at DESC';
      const rows = await sql.query(query, params);
      return res.status(200).json({ invoices: rows });
    }

    // ----------------------------------------------------
    // POST: Create new Tax Invoice & Receipt
    // ----------------------------------------------------
    if (req.method === 'POST') {
      if (userRole === 'AUDITOR') {
        return res.status(403).json({ error: 'Auditors have read-only permissions.' });
      }

      const body = req.body || {};
      const {
        date = new Date().toISOString().split('T')[0],
        client_name,
        client_address = '',
        client_gstin = '',
        site_location = '',
        work_description = '',
        is_interstate = false,
        payment_mode = 'Bank Transfer',
        transaction_ref = '',
        signing_authority = 'Authorized Signatory',
        status = 'PAID',
        items = []
      } = body;

      if (!client_name) {
        return res.status(400).json({ error: 'Client Name is required' });
      }

      // Compute Subtotal from Line Items
      let sub_total = 0;
      const parsedItems = items.map(item => {
        const qty = parseFloat(item.quantity) || 1;
        const rate = parseFloat(item.rate) || 0;
        const total = parseFloat(item.total_amount) || (qty * rate);
        sub_total += total;
        return {
          description: item.description || 'Waterproofing Services',
          hsn_sac_code: item.hsn_sac_code || '9954',
          quantity: qty,
          unit: item.unit || 'Sq.Ft',
          rate: rate,
          total_amount: total
        };
      });

      if (parsedItems.length === 0 && body.sub_total) {
        sub_total = parseFloat(body.sub_total) || 0;
      }

      // Tax Calculations
      let cgst_rate = 0, cgst_amount = 0;
      let sgst_rate = 0, sgst_amount = 0;
      let igst_rate = 0, igst_amount = 0;

      if (is_interstate) {
        igst_rate = 18.00;
        igst_amount = Math.round((sub_total * 0.18) * 100) / 100;
      } else {
        cgst_rate = 9.00;
        cgst_amount = Math.round((sub_total * 0.09) * 100) / 100;
        sgst_rate = 9.00;
        sgst_amount = Math.round((sub_total * 0.09) * 100) / 100;
      }

      const grand_total = Math.round((sub_total + cgst_amount + sgst_amount + igst_amount) * 100) / 100;
      const grand_total_words = numberToWordsINR(grand_total);

      // Auto-generate receipt_no if not supplied: DWCS/REC/YYYY/XXX
      let receipt_no = body.receipt_no;
      if (!receipt_no) {
        const year = new Date(date).getFullYear() || 2026;
        const countRes = await sql.query('SELECT count(*)::int as count FROM invoices_receipts');
        const nextNum = String(countRes[0].count + 1).padStart(3, '0');
        receipt_no = `DWCS/REC/${year}/${nextNum}`;
      }

      const insertRes = await sql.query(`
        INSERT INTO invoices_receipts (
          receipt_no, date, client_name, client_address, client_gstin, site_location,
          work_description, sub_total, is_interstate, cgst_rate, cgst_amount,
          sgst_rate, sgst_amount, igst_rate, igst_amount, grand_total, grand_total_words,
          payment_mode, transaction_ref, signing_authority, status, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
        ) RETURNING *
      `, [
        receipt_no, date, client_name, client_address, client_gstin, site_location,
        work_description, sub_total, is_interstate, cgst_rate, cgst_amount,
        sgst_rate, sgst_amount, igst_rate, igst_amount, grand_total, grand_total_words,
        payment_mode, transaction_ref, signing_authority, status, userId
      ]);

      const createdInvoice = insertRes[0];

      // Insert line items
      for (const item of parsedItems) {
        await sql.query(`
          INSERT INTO invoice_line_items (
            invoice_id, description, hsn_sac_code, quantity, unit, rate, total_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          createdInvoice.id, item.description, item.hsn_sac_code, item.quantity, item.unit, item.rate, item.total_amount
        ]);
      }

      // Log Audit
      await sql.query(`
        INSERT INTO finance_audit_logs (table_name, record_id, action, performed_by, reason, new_state)
        VALUES ('invoices_receipts', $1, 'INSERT', $2, 'Invoice created', $3)
      `, [createdInvoice.id, userId, JSON.stringify(createdInvoice)]);

      return res.status(201).json({ success: true, invoice: createdInvoice });
    }

    // ----------------------------------------------------
    // PUT: Update Tax Invoice
    // ----------------------------------------------------
    if (req.method === 'PUT') {
      if (userRole === 'AUDITOR') {
        return res.status(403).json({ error: 'Auditors have read-only permissions.' });
      }

      const body = req.body || {};
      const { id, items = [], audit_reason = 'Invoice details updated' } = body;
      if (!id) return res.status(400).json({ error: 'Invoice ID is required' });

      const prevRows = await sql.query('SELECT * FROM invoices_receipts WHERE id = $1', [id]);
      if (!prevRows.length) return res.status(404).json({ error: 'Invoice not found' });
      const previousState = prevRows[0];

      // Recalculate
      let sub_total = 0;
      const parsedItems = items.map(item => {
        const qty = parseFloat(item.quantity) || 1;
        const rate = parseFloat(item.rate) || 0;
        const total = parseFloat(item.total_amount) || (qty * rate);
        sub_total += total;
        return {
          description: item.description || 'Waterproofing Services',
          hsn_sac_code: item.hsn_sac_code || '9954',
          quantity: qty,
          unit: item.unit || 'Sq.Ft',
          rate: rate,
          total_amount: total
        };
      });

      if (parsedItems.length === 0 && body.sub_total !== undefined) {
        sub_total = parseFloat(body.sub_total) || 0;
      }

      const is_interstate = body.is_interstate !== undefined ? body.is_interstate : previousState.is_interstate;
      let cgst_rate = 0, cgst_amount = 0;
      let sgst_rate = 0, sgst_amount = 0;
      let igst_rate = 0, igst_amount = 0;

      if (is_interstate) {
        igst_rate = 18.00;
        igst_amount = Math.round((sub_total * 0.18) * 100) / 100;
      } else {
        cgst_rate = 9.00;
        cgst_amount = Math.round((sub_total * 0.09) * 100) / 100;
        sgst_rate = 9.00;
        sgst_amount = Math.round((sub_total * 0.09) * 100) / 100;
      }

      const grand_total = Math.round((sub_total + cgst_amount + sgst_amount + igst_amount) * 100) / 100;
      const grand_total_words = numberToWordsINR(grand_total);

      const updated = await sql.query(`
        UPDATE invoices_receipts SET
          date = COALESCE($1, date),
          client_name = COALESCE($2, client_name),
          client_address = COALESCE($3, client_address),
          client_gstin = COALESCE($4, client_gstin),
          site_location = COALESCE($5, site_location),
          work_description = COALESCE($6, work_description),
          sub_total = $7,
          is_interstate = $8,
          cgst_rate = $9,
          cgst_amount = $10,
          sgst_rate = $11,
          sgst_amount = $12,
          igst_rate = $13,
          igst_amount = $14,
          grand_total = $15,
          grand_total_words = $16,
          payment_mode = COALESCE($17, payment_mode),
          transaction_ref = COALESCE($18, transaction_ref),
          status = COALESCE($19, status)
        WHERE id = $20
        RETURNING *
      `, [
        body.date, body.client_name, body.client_address, body.client_gstin, body.site_location,
        body.work_description, sub_total, is_interstate, cgst_rate, cgst_amount,
        sgst_rate, sgst_amount, igst_rate, igst_amount, grand_total, grand_total_words,
        body.payment_mode, body.transaction_ref, body.status, id
      ]);

      if (parsedItems.length > 0) {
        await sql.query('DELETE FROM invoice_line_items WHERE invoice_id = $1', [id]);
        for (const item of parsedItems) {
          await sql.query(`
            INSERT INTO invoice_line_items (invoice_id, description, hsn_sac_code, quantity, unit, rate, total_amount)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [id, item.description, item.hsn_sac_code, item.quantity, item.unit, item.rate, item.total_amount]);
        }
      }

      // Log Audit
      await sql.query(`
        INSERT INTO finance_audit_logs (table_name, record_id, action, performed_by, reason, previous_state, new_state)
        VALUES ('invoices_receipts', $1, 'UPDATE', $2, $3, $4, $5)
      `, [id, userId, audit_reason, JSON.stringify(previousState), JSON.stringify(updated[0])]);

      return res.status(200).json({ success: true, invoice: updated[0] });
    }

    // ----------------------------------------------------
    // DELETE / VOID: Void or Delete Invoice
    // ----------------------------------------------------
    if (req.method === 'DELETE') {
      if (userRole === 'AUDITOR') {
        return res.status(403).json({ error: 'Auditors have read-only permissions.' });
      }

      const { id, reason = 'Voided by authorized user', hard_delete = false } = req.body || req.query || {};
      if (!id) return res.status(400).json({ error: 'Invoice ID is required' });

      const prevRows = await sql.query('SELECT * FROM invoices_receipts WHERE id = $1', [id]);
      if (!prevRows.length) return res.status(404).json({ error: 'Invoice not found' });
      const previousState = prevRows[0];

      if (hard_delete && userRole === 'SUPER_ADMIN') {
        await sql.query('DELETE FROM invoices_receipts WHERE id = $1', [id]);
        await sql.query(`
          INSERT INTO finance_audit_logs (table_name, record_id, action, performed_by, reason, previous_state)
          VALUES ('invoices_receipts', $1, 'DELETE', $2, $3, $4)
        `, [id, userId, reason, JSON.stringify(previousState)]);
        return res.status(200).json({ success: true, message: 'Invoice permanently removed' });
      } else {
        const voided = await sql.query(`
          UPDATE invoices_receipts SET status = 'CANCELLED' WHERE id = $1 RETURNING *
        `, [id]);
        await sql.query(`
          INSERT INTO finance_audit_logs (table_name, record_id, action, performed_by, reason, previous_state, new_state)
          VALUES ('invoices_receipts', $1, 'VOID', $2, $3, $4, $5)
        `, [id, userId, reason, JSON.stringify(previousState), JSON.stringify(voided[0])]);
        return res.status(200).json({ success: true, message: 'Invoice marked CANCELLED / VOID', invoice: voided[0] });
      }
    }

    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Invoices API error:', err);
    res.status(500).json({ error: err.message });
  }
};
