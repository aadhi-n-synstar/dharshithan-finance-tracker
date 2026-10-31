const path = require('path');
const auditHandler = require(path.resolve(__dirname, '../api/audit-logs'));

async function run() {
  await auditHandler({ method: 'GET', query: {} }, {
    setHeader: () => {},
    status: (c) => ({
      json: (d) => {
        console.log('✓ Audit Logs API Status:', c, '| Count:', d.count);
        if (d.data && d.data.length > 0) {
          console.log('✓ First Log Action:', d.data[0].action, '| User:', d.data[0].userId || d.data[0].user_id);
        }
      }
    })
  });
}

run();
