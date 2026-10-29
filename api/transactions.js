const { neon } = require('@neondatabase/serverless');

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is missing');
  return neon(url);
}

module.exports = async function handler(req, res) {
  // CORS & Content Type
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const sql = getDb();

    // 1. GET - Fetch all transactions
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT 
          id,
          sl_no as "slNo",
          to_char(date, 'YYYY-MM-DD') as "date",
          type,
          party_name as "partyName",
          category,
          description,
          amount::float as "amount",
          mode,
          ref_number as "refNumber",
          quarter,
          financial_year as "financialYear",
          profit_value::float as "profitValue",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM transactions
        ORDER BY sl_no ASC
      `;
      return res.status(200).json({ success: true, count: rows.length, data: rows });
    }

    // 2. POST - Insert new transaction
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        date, type, partyName, category, description,
        amount, mode, refNumber, quarter, financialYear
      } = body;

      const numAmount = Math.abs(parseFloat(amount) || 0);
      const isIncome = (type || '').includes('Received') || (type || '').includes('Income');
      const profitValue = isIncome ? numAmount : -numAmount;

      // Get next sl_no
      const maxRes = await sql`SELECT COALESCE(MAX(sl_no), 0) + 1 as next_sl FROM transactions`;
      const nextSl = maxRes[0].next_sl;

      const inserted = await sql`
        INSERT INTO transactions (
          sl_no, date, type, party_name, category, description,
          amount, mode, ref_number, quarter, financial_year, profit_value
        ) VALUES (
          ${nextSl}, ${date || new Date().toISOString().slice(0, 10)}, ${type || 'Received / Income'},
          ${partyName || 'General Party'}, ${category || 'General'}, ${description || ''},
          ${numAmount}, ${mode || 'CASH'}, ${refNumber || ''},
          ${quarter || 'Q3'}, ${financialYear || 'F.Y. 2026-27'}, ${profitValue}
        )
        RETURNING 
          id, sl_no as "slNo", to_char(date, 'YYYY-MM-DD') as "date", type,
          party_name as "partyName", category, description, amount::float as "amount",
          mode, ref_number as "refNumber", quarter, financial_year as "financialYear",
          profit_value::float as "profitValue", created_at as "createdAt"
      `;

      return res.status(201).json({ success: true, data: inserted[0] });
    }

    // 3. PUT - Update transaction
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        id, slNo, date, type, partyName, category, description,
        amount, mode, refNumber, quarter, financialYear
      } = body;

      const numAmount = Math.abs(parseFloat(amount) || 0);
      const isIncome = (type || '').includes('Received') || (type || '').includes('Income');
      const profitValue = isIncome ? numAmount : -numAmount;

      let updated;
      if (id) {
        updated = await sql`
          UPDATE transactions SET
            date = ${date},
            type = ${type},
            party_name = ${partyName},
            category = ${category},
            description = ${description},
            amount = ${numAmount},
            mode = ${mode},
            ref_number = ${refNumber},
            quarter = ${quarter},
            financial_year = ${financialYear},
            profit_value = ${profitValue},
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, sl_no as "slNo", to_char(date, 'YYYY-MM-DD') as "date", type, party_name as "partyName"
        `;
      } else if (slNo) {
        updated = await sql`
          UPDATE transactions SET
            date = ${date},
            type = ${type},
            party_name = ${partyName},
            category = ${category},
            description = ${description},
            amount = ${numAmount},
            mode = ${mode},
            ref_number = ${refNumber},
            quarter = ${quarter},
            financial_year = ${financialYear},
            profit_value = ${profitValue},
            updated_at = NOW()
          WHERE sl_no = ${slNo}
          RETURNING id, sl_no as "slNo", to_char(date, 'YYYY-MM-DD') as "date", type, party_name as "partyName"
        `;
      }

      return res.status(200).json({ success: true, data: updated ? updated[0] : null });
    }

    // 4. DELETE - Delete transaction
    if (req.method === 'DELETE') {
      const id = req.query.id || (req.body && req.body.id);
      const slNo = req.query.slNo || (req.body && req.body.slNo);

      if (id) {
        await sql`DELETE FROM transactions WHERE id = ${id}`;
      } else if (slNo) {
        await sql`DELETE FROM transactions WHERE sl_no = ${slNo}`;
      } else {
        return res.status(400).json({ success: false, error: 'Missing id or slNo parameter' });
      }

      return res.status(200).json({ success: true, message: 'Transaction deleted from Neon DB' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
