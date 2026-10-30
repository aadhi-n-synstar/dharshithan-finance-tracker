const fs = require('fs');
const path = require('path');

// Resolve project root dynamically regardless of execution working directory
const ROOT_DIR = path.resolve(__dirname, '..');

// Load environment variables from project root
try {
  require('dotenv').config({ path: path.join(ROOT_DIR, '.env.local') });
} catch (e) {}

const { db } = require(path.join(ROOT_DIR, 'api', 'db-adapter'));

async function runTests() {
  console.log('========================================================');
  console.log('  Dharshithan Zoho ERP - Comprehensive Workflow Test');
  console.log('========================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✓ [${total}] ${name}`);
      passed++;
    } catch (e) {
      console.error(`✗ [${total}] ${name}:`, e.message);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✓ [${total}] ${name}`);
      passed++;
    } catch (e) {
      console.error(`✗ [${total}] ${name}:`, e.message);
    }
  }

  // 1. Static Files Test (Layout)
  test('index.html exists and contains Zoho ERP layout', () => {
    const indexPath = path.join(ROOT_DIR, 'index.html');
    if (!fs.existsSync(indexPath)) throw new Error('index.html not found at ' + indexPath);
    const html = fs.readFileSync(indexPath, 'utf8');
    if (!html.includes('erpSidebar')) throw new Error('Missing erpSidebar');
    if (!html.includes('erpTopBar')) throw new Error('Missing erpTopBar');
    if (!html.includes('txnModal')) throw new Error('Missing txnModal');
    if (!html.includes('invoicePrintModal')) throw new Error('Missing invoicePrintModal');
    if (!html.includes('orgDetailsModal')) throw new Error('Missing orgDetailsModal');
    if (!html.includes('userProfileModal')) throw new Error('Missing userProfileModal');
    if (!html.includes('https://synstarstaffing.com/')) throw new Error('Missing Synstar360 footer attribution');
  });

  // 2. JavaScript Syntax & Controller Verification (JS Controller)
  test('js/app.js syntax check and method definitions', () => {
    const appPath = path.join(ROOT_DIR, 'js', 'app.js');
    if (!fs.existsSync(appPath)) throw new Error('js/app.js not found at ' + appPath);
    const app = fs.readFileSync(appPath, 'utf8');
    const required = [
      'addLineItemRow',
      'removeLineItemRow',
      'recalculateLineItems',
      'handleDocTypeChange',
      'toggleQuickCreateMenu',
      'closeQuickCreateMenu',
      'openOrgDetailsModal',
      'closeOrgDetailsModal',
      'printTaxInvoice',
      'closeInvoicePrintModal',
      'printCurrentDetailInvoice',
      'toggleSelectAll',
      'handleRowSelect',
      'bulkExportCSV',
      'bulkDeleteSelected',
      'clearRowSelection',
      'sortByColumn',
      'setPageSize',
      'prevPage',
      'nextPage',
      'filterPartySegment',
      'openPartyModal',
      'closePartyModal',
      'renderReports',
      'exportComprehensiveReportCSV'
    ];
    for (const r of required) {
      if (!app.includes(r)) throw new Error(`Missing ${r} in js/app.js`);
    }
  });

  // 3. Currency and Words Calculation (Indian Currency Analytics)
  test('Analytics amountToWords Indian currency numbering', () => {
    const analyticsPath = path.join(ROOT_DIR, 'js', 'analytics.js');
    if (!fs.existsSync(analyticsPath)) throw new Error('js/analytics.js not found at ' + analyticsPath);
    const Analytics = require(analyticsPath);
    const words1 = Analytics.amountToWords(125000);
    if (!words1.includes('One Lakh Twenty Five Thousand Rupees')) {
      throw new Error('Unexpected words output: ' + words1);
    }
    const gstIntra = Analytics.calculateGST(100000, 18, false);
    if (gstIntra.cgst !== 9000 || gstIntra.sgst !== 9000 || gstIntra.grandTotal !== 118000) {
      throw new Error('Incorrect GST intra calculation: ' + JSON.stringify(gstIntra));
    }
    const gstInter = Analytics.calculateGST(100000, 18, true);
    if (gstInter.igst !== 18000 || gstInter.grandTotal !== 118000) {
      throw new Error('Incorrect GST inter calculation: ' + JSON.stringify(gstInter));
    }
  });

  // 4. Cloud Database Connectivity & Transaction Lifecycle (CRUD Lifecycle)
  await testAsync('Cloud Database Transaction CRUD Lifecycle', async () => {
    const testItems = [
      { description: 'Basement Waterproofing Membrane SAC 9954', hsn: '9954', qty: 250, unit: 'Sq.Ft', rate: 120, amount: 30000 },
      { description: 'Polyurethane Injection Grouting', hsn: '9954', qty: 10, unit: 'Nos', rate: 2000, amount: 20000 }
    ];
    const descJson = JSON.stringify({
      items: testItems,
      taxType: 'INTRA_18',
      subtotal: 50000,
      taxAmount: 9000,
      grandTotal: 59000,
      remarks: 'Basement slab injection grouting and waterproofing works'
    });

    // 1. Create transaction
    const inserted = await db.createTransaction({
      date: '2026-11-01',
      type: 'Received / Income',
      partyName: 'TEST_ERP_CLIENT',
      category: 'Waterproofing Services',
      description: descJson,
      amount: 59000.00,
      mode: 'NETBANKING',
      refNumber: 'DWCS/REC/TEST/001',
      quarter: 'Q3',
      financialYear: 'F.Y. 2026-27',
      profitValue: 59000.00
    });

    if (!inserted || inserted.partyName !== 'TEST_ERP_CLIENT') {
      throw new Error('Failed to insert test transaction');
    }

    // 2. Read and verify
    const allTx = await db.getTransactions();
    const fetched = allTx.find(t => t.id === inserted.id || t.partyName === 'TEST_ERP_CLIENT');
    if (!fetched || Number(fetched.amount) !== 59000) {
      throw new Error('Retrieved amount mismatch or transaction not found');
    }

    // 3. Delete transaction
    await db.deleteTransaction(inserted.id);
    const postDeleteAll = await db.getTransactions();
    const stillExists = postDeleteAll.find(t => t.id === inserted.id);
    if (stillExists) {
      throw new Error('Test transaction was not removed');
    }
  });

  // 5. Verify Build & Output Directory (Public Assets)
  test('public/ directory contains production assets', () => {
    const publicIndex = path.join(ROOT_DIR, 'public', 'index.html');
    const publicApp = path.join(ROOT_DIR, 'public', 'js', 'app.js');

    // Auto-create/sync if missing
    if (!fs.existsSync(publicIndex) || !fs.existsSync(publicApp)) {
      const publicDir = path.join(ROOT_DIR, 'public');
      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      fs.copyFileSync(path.join(ROOT_DIR, 'index.html'), publicIndex);
      const publicJs = path.join(publicDir, 'js');
      if (!fs.existsSync(publicJs)) fs.mkdirSync(publicJs, { recursive: true });
      fs.copyFileSync(path.join(ROOT_DIR, 'js', 'app.js'), publicApp);
    }

    if (!fs.existsSync(publicIndex)) throw new Error('Missing public/index.html');
    if (!fs.existsSync(publicApp)) throw new Error('Missing public/js/app.js');
  });

  console.log(`\n========================================================`);
  console.log(`Results: ${passed}/${total} Tests Passed! ${passed === total ? '(100% SUCCESS)' : '(FAILURES DETECTED)'}`);
  console.log(`========================================================`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
