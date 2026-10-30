const { transferData } = require('../scripts/transfer-data');
const { db } = require('./db-adapter');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const targetProvider = body.targetProvider || 'supabase';

      console.log(`[API /api/transfer] Initiating automated data transfer to ${targetProvider}...`);
      await transferData();

      return res.status(200).json({
        success: true,
        message: `Automated data transfer to ${targetProvider} completed successfully!`,
        activeProvider: db.getProvider(),
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'GET') {
      const health = await db.getHealth();
      return res.status(200).json({
        success: true,
        activeProvider: db.getProvider(),
        health
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Transfer Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
