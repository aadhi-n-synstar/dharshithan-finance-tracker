const { neon } = require('@neondatabase/serverless');

const DEFAULT_DATABASE_URL = "postgresql://neondb_owner:npg_Lt1UVxrTkp2q@ep-late-art-b5308bnc-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

function getDb() {
  const url = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
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
          amount::numeric as amount,
          mode,
          ref_number as "refNumber",
          quarter,
          financial_year as "financialYear",
          profit_value::numeric as "profitValue",
          created_at as "createdAt"
        FROM transactions
        ORDER BY sl_no ASC, date ASC
      `;

      return res.status(200).json({
        success: true,
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

      const numAmount = parseFloat(amount);
      const isIncome = type.toLowerCase().includes('received') || type.toLowerCase().includes('income');
      const calcProfitValue = profitValue !== undefined ? parseFloat(profitValue) : (isIncome ? numAmount : -numAmount);

      // Get next sl_no
      const maxSlRes = await sql`SELECT COALESCE(MAX(sl_no), 0) + 1 as "nextSl" FROM transactions`;
      const nextSl = maxSlRes[0].nextSl;

      const inserted = await sql`
        INSERT INTO transactions (
          sl_no, date, type, party_name, category, description,
          amount, mode, ref_number, quarter, financial_year, profit_value
        ) VALUES (
          ${nextSl}, ${date}, ${type}, ${partyName}, ${category || 'General'}, ${description || ''},
          ${numAmount}, ${mode || 'CASH'}, ${refNumber || ''}, ${quarter || 'Q1'}, 
          ${financialYear || 'F.Y. 2026-27'}, ${calcProfitValue}
        )
        RETURNING 
          id,
          sl_no as "slNo",
          to_char(date, 'YYYY-MM-DD') as "date",
          type,
          party_name as "partyName",
          category,
          description,
          amount::numeric as amount,
          mode,
          ref_number as "refNumber",
          quarter,
          financial_year as "financialYear",
          profit_value::numeric as "profitValue"
      `;

      return res.status(201).json({ success: true, data: inserted[0] });
    }

    // 3. PUT - Update existing transaction
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        id, slNo, date, type, partyName, category, description,
        amount, mode, refNumber, quarter, financialYear, profitValue
      } = body;

      if (!id && !slNo) {
        return res.status(400).json({ success: false, error: 'Transaction id or slNo is required for update' });
      }

      const numAmount = parseFloat(amount);

      let updated;
      const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));

      if (isUuid) {
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
      } else {
        const targetSl = slNo || id;
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
          WHERE sl_no = ${Number(targetSl)}
          RETURNING id, sl_no as "slNo", to_char(date, 'YYYY-MM-DD') as "date", type, party_name as "partyName"
        `;
      }

      return res.status(200).json({ success: true, data: updated ? updated[0] : null });
    }

    // 4. DELETE - Delete transaction permanently from Neon DB
    if (req.method === 'DELETE') {
      const id = req.query.id || (req.body && req.body.id);
      const slNo = req.query.slNo || (req.body && req.body.slNo);

      if (id) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
        if (isUuid) {
          await sql`DELETE FROM transactions WHERE id = ${id}`;
        } else if (!isNaN(Number(id))) {
          await sql`DELETE FROM transactions WHERE sl_no = ${Number(id)}`;
        } else {
          await sql`DELETE FROM transactions WHERE id = ${id}`;
        }
      } else if (slNo) {
        await sql`DELETE FROM transactions WHERE sl_no = ${Number(slNo)}`;
      } else {
        return res.status(400).json({ success: false, error: 'Missing id or slNo parameter' });
      }

      return res.status(200).json({ success: true, message: 'Transaction permanently deleted from Neon DB' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
