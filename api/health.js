const { db } = require('./db-adapter');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const health = await db.getHealth();
    return res.status(200).json(health);
  } catch (err) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
};
