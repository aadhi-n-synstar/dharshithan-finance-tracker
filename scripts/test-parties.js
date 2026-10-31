const path = require('path');
const partiesHandler = require(path.resolve(__dirname, '../api/parties'));

async function run() {
  await partiesHandler({ method: 'GET', query: {} }, {
    setHeader: () => {},
    status: (c) => ({
      json: (d) => {
        console.log('✓ Parties API Status:', c, '| Count:', d.count);
        if (d.data && d.data.length > 0) {
          console.log('✓ First Party:', d.data[0].name, '| Balance:', d.data[0].runningBalance);
        }
      }
    })
  });
}

run();
