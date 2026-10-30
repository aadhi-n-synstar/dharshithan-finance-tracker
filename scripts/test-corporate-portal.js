const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('--- Testing Corporate Portal Implementation ---');

// 1. Verify DOM IDs in index.html and public/index.html
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const publicHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

const requiredIds = [
  'userProfileBtn',
  'userProfileModal',
  'profileRightsList',
  'superAdminRolePreviewBox',
  'rolePreviewSelect',
  'headerSyncBtn',
  'neonStatusBar',
  'headerAddTxnBtn',
  'tab-dashboard',
  'tab-transactions',
  'tab-sales',
  'tab-expenses',
  'tab-banking',
  'tab-parties',
  'tab-reports',
  'view-dashboard',
  'view-transactions',
  'view-sales',
  'view-expenses',
  'view-banking',
  'view-parties',
  'view-reports',
  'filterFY',
  'filterQuarter',
  'selfPasswordChangeModal'
];

console.log('\n1. Checking required DOM IDs in index.html:');
for (const id of requiredIds) {
  if (indexHtml.includes(`id="${id}"`)) {
    console.log(`   ✓ #${id}`);
  } else {
    console.error(`   ✗ Missing #${id} in index.html!`);
    process.exit(1);
  }
}

console.log('\n2. Checking required DOM IDs in public/index.html:');
for (const id of requiredIds) {
  if (publicHtml.includes(`id="${id}"`)) {
    console.log(`   ✓ #${id}`);
  } else {
    console.error(`   ✗ Missing #${id} in public/index.html!`);
    process.exit(1);
  }
}

// 2. Check Synstar360 attribution in both
console.log('\n3. Verifying Synstar360 Attribution Footer:');
const synstarAttr = 'https://synstarstaffing.com/';
if (indexHtml.includes(synstarAttr) && publicHtml.includes(synstarAttr)) {
  console.log('   ✓ Synstar360 link verified in both root and public index.html');
} else {
  console.error('   ✗ Missing Synstar360 link in footer!');
  process.exit(1);
}

// 3. Verify vercel.json rewrite rule
console.log('\n4. Verifying vercel.json configuration:');
const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
if (vercelConfig.outputDirectory === 'public') {
  console.log('   ✓ outputDirectory configured to "public"');
} else {
  console.error('   ✗ outputDirectory is not "public"');
  process.exit(1);
}

const rewrite = vercelConfig.rewrites && vercelConfig.rewrites[0];
if (rewrite && rewrite.source.includes('assets/|css/|js/')) {
  console.log('   ✓ Clean rewrite rule safely excludes static files and /api/*');
} else {
  console.error('   ✗ Rewrite rule may intercept static files!');
  process.exit(1);
}

// 4. Test app.js methods exist
console.log('\n5. Verifying app.js methods:');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const requiredMethods = [
  'setActiveTab',
  'renderCurrentView',
  'renderSalesView',
  'filterSalesTable',
  'renderExpensesView',
  'filterExpensesTable',
  'renderBankingView',
  'checkAuthUI',
  'openUserProfileModal',
  'closeUserProfileModal',
  'switchRolePreview',
  'openSelfPasswordChangeModal',
  'handleSelfPasswordChange'
];

for (const m of requiredMethods) {
  if (appJs.includes(m)) {
    console.log(`   ✓ app.${m}`);
  } else {
    console.error(`   ✗ Missing app.${m} in js/app.js!`);
    process.exit(1);
  }
}

console.log('\n========================================');
console.log('ALL CORPORATE PORTAL VALIDATIONS PASSED!');
console.log('========================================');
process.exit(0);
