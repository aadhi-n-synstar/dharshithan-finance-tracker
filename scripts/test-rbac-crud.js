const handler = require('../api/users.js');

async function runTest() {
  console.log('--- Testing API Users CRUD ---');

  let resData = null;
  let statusCode = null;

  const createMockRes = () => ({
    setHeader: () => {},
    status: (code) => {
      statusCode = code;
      return {
        json: (d) => { resData = d; },
        end: () => {}
      };
    }
  });

  // 1. GET
  await handler({ method: 'GET' }, createMockRes());
  console.log(`1. GET /api/users: status=${statusCode}, count=${resData?.count}`);
  if (statusCode !== 200) throw new Error('GET failed');

  // 2. POST create user
  await handler({
    method: 'POST',
    body: {
      userId: 'test_tech_1',
      fullName: 'Test Technician',
      email: 'tech1@dharshithan.com',
      role: 'employee',
      category: 'Field'
    }
  }, createMockRes());
  console.log(`2. POST /api/users: status=${statusCode}, user=${resData?.data?.userId || resData?.data?.user_id}`);
  if (statusCode !== 201) throw new Error('POST failed');

  // 3. PUT update user
  await handler({
    method: 'PUT',
    body: {
      userId: 'test_tech_1',
      fullName: 'Test Technician Updated',
      role: 'admin',
      category: 'Management'
    }
  }, createMockRes());
  console.log(`3. PUT /api/users: status=${statusCode}, updated name=${resData?.data?.fullName || resData?.data?.full_name}, role=${resData?.data?.role}`);
  if (statusCode !== 200) throw new Error('PUT failed');

  // 4. Protection test: try to delete admin
  await handler({ method: 'DELETE', query: { userId: 'admin' } }, createMockRes());
  console.log(`4. DELETE admin protection: status=${statusCode}, error=${resData?.error}`);
  if (statusCode !== 403) throw new Error('Admin deletion should have failed with 403');

  // 5. DELETE test user
  await handler({ method: 'DELETE', query: { userId: 'test_tech_1' } }, createMockRes());
  console.log(`5. DELETE test user: status=${statusCode}, message=${resData?.message}`);
  if (statusCode !== 200) throw new Error('DELETE failed');

  console.log('>>> ALL RBAC CRUD TESTS PASSED SUCCESSFULLY! <<<');
}

runTest().catch(err => {
  console.error('RBAC Test Error:', err);
  process.exit(1);
});
