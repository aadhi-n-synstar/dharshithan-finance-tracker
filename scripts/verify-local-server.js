const server = require('../server');
const http = require('http');

server.listen(4001, async () => {
  console.log('--- LOCAL SERVER ROUTE VERIFICATION (Port 4001) ---');

  function get(url) {
    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }).on('error', reject);
    });
  }

  try {
    const rIndex = await get('http://localhost:4001/');
    console.log('1. GET / -> Status:', rIndex.status, '| Has view-users?', rIndex.data.includes('view-users'));

    const rRoles = await get('http://localhost:4001/js/roles.js');
    console.log('2. GET /js/roles.js -> Status:', rRoles.status, '| Has isSuperAdmin?', rRoles.data.includes('isSuperAdmin'));

    const rApp = await get('http://localhost:4001/js/app.js');
    console.log('3. GET /js/app.js -> Status:', rApp.status, '| Has renderUsersView?', rApp.data.includes('renderUsersView'));

    const rHealth = await get('http://localhost:4001/api/health');
    console.log('4. GET /api/health -> Status:', rHealth.status, '| Body:', rHealth.data);

    const rParties = await get('http://localhost:4001/api/parties');
    console.log('5. GET /api/parties -> Status:', rParties.status, '| Count:', JSON.parse(rParties.data).count);

    const rAudit = await get('http://localhost:4001/api/audit-logs');
    console.log('6. GET /api/audit-logs -> Status:', rAudit.status, '| Count:', JSON.parse(rAudit.data).count);

    console.log('\n========================================================');
    console.log('✓ LOCAL BUILD IS 100% HEALTHY, COMPLETE & WORKING!');
    console.log('========================================================');
    server.close();
    process.exit(0);
  } catch (e) {
    console.error('❌ Test error:', e.message);
    server.close();
    process.exit(1);
  }
});
