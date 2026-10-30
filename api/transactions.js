const { db } = require('./db-adapter');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. GET - Fetch all transactions
    if (req.method === 'GET') {
      const rows = await db.getTransactions();
      return res.status(200).json({
        success: true,
        provider: db.getProvider(),
        count: rows.length,
        data: rows
      });
    }

    // 2. POST - Add new transaction
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        date, type, partyName, category, description,
        amount, mode, refNumber, quarter, financialYear, profitValue
      } = body;

      if (!date || !type || !partyName || amount === undefined) {
        return res.status(400).json({ success: false, error: 'Missing required transaction fields' });
      }

      const inserted = await db.createTransaction({
        date, type, partyName, category, description,
        amount, mode, refNumber, quarter, financialYear, profitValue
      });

      return res.status(201).json({
        success: true,
        provider: db.getProvider(),
        data: inserted
      });
    }

    // 3. PUT - Update existing transaction
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        id, slNo, date, type, partyName, category, description,
        amount, mode, refNumber, quarter, financialYear, profitValue
      } = body;

      const targetId = id || slNo;
      if (!targetId) {
        return res.status(400).json({ success: false, error: 'Transaction id or slNo is required for update' });
      }

      const updated = await db.updateTransaction(targetId, {
        date, type, partyName, category, description,
        amount, mode, refNumber, quarter, financialYear, profitValue
      });

      return res.status(200).json({
        success: true,
        provider: db.getProvider(),
        data: updated
      });
    }

    // 4. DELETE - Delete transaction permanently
    if (req.method === 'DELETE') {
      const id = req.query.id || (req.body && req.body.id);
      const slNo = req.query.slNo || (req.body && req.body.slNo);
      const targetId = id || slNo;

      if (!targetId) {
        return res.status(400).json({ success: false, error: 'Missing id or slNo parameter' });
      }

      await db.deleteTransaction(targetId);

      return res.status(200).json({
        success: true,
        provider: db.getProvider(),
        message: 'Transaction permanently deleted from active database'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Transactions Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
