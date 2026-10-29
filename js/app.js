/**
 * ==============================================================================
 * DHARSHITHAN WATERPROOFING AND CONCRETE SOLUTIONS
 * Enterprise Financial Ledger, Billing, Tax, Voucher & Salary Engine
 * Master Application Controller (Neon PostgreSQL Native Engine)
 * ==============================================================================
 */

// Global State
const State = {
  currentUser: {
    id: null,
    full_name: 'Dharshithan Partiban',
    email: 'dharshithanpartiban@gmail.com',
    role: 'SUPER_ADMIN'
  },
  activeTab: 'overview',
  invoices: [],
  vouchers: [],
  salaries: [],
  auditLogs: [],
  metrics: null
};

// ==============================================================================
// INITIALIZATION
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadStoredSession();
  updateUserBadge();
  loadAllData();
});

function loadStoredSession() {
  try {
    const stored = localStorage.getItem('dwcs_session');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.user) {
        State.currentUser = parsed.user;
      }
    }
  } catch (e) {
    console.error('Session load error:', e);
  }
}

function saveSession() {
  localStorage.setItem('dwcs_session', JSON.stringify({ user: State.currentUser }));
}

// ==============================================================================
// RBAC & ACTIVE ROLE BADGE
// ==============================================================================
function updateUserBadge() {
  const nameEl = document.getElementById('headerUserName');
  const roleEl = document.getElementById('headerUserRole');
  const dropNameEl = document.getElementById('dropdownUserName');
  const dropEmailEl = document.getElementById('dropdownUserEmail');
  const auditTab = document.getElementById('auditTabBtn');

  const roleLabels = {
    'SUPER_ADMIN': 'Super Admin',
    'OWNER': 'Owner / Partner',
    'FINANCE': 'Finance Team',
    'AUDITOR': 'GST Auditor'
  };

  const roleText = roleLabels[State.currentUser.role] || State.currentUser.role;

  if (nameEl) nameEl.textContent = State.currentUser.full_name;
  if (roleEl) roleEl.textContent = roleText;
  if (dropNameEl) dropNameEl.textContent = State.currentUser.full_name;
  if (dropEmailEl) dropEmailEl.textContent = State.currentUser.email;

  // Toggle Audit Logs Tab visibility for Super Admin & Owner
  if (auditTab) {
    if (State.currentUser.role === 'SUPER_ADMIN' || State.currentUser.role === 'OWNER') {
      auditTab.style.display = 'flex';
    } else {
      auditTab.style.display = 'none';
      if (State.activeTab === 'audit') switchTab('overview');
    }
  }

  // Update button visibility based on role
  applyRolePermissions();
}

function applyRolePermissions() {
  const isAuditor = State.currentUser.role === 'AUDITOR';
  
  // Disable or hide mutation buttons for Auditor
  document.querySelectorAll('.btn-emerald, #saveInvoiceBtn').forEach(btn => {
    btn.disabled = isAuditor;
    if (isAuditor) btn.title = 'Auditors have read-only permissions';
  });
}

function toggleUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
window.addEventListener('click', (e) => {
  const container = document.querySelector('.user-badge-container');
  if (container && !container.contains(e.target)) {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.remove('show');
  }
});

function switchActiveRole(newRole) {
  State.currentUser.role = newRole;
  saveSession();
  updateUserBadge();
  toggleUserDropdown();
  showToast(`Switched active role to: ${newRole}`);
}

function signOutUser() {
  localStorage.removeItem('dwcs_session');
  State.currentUser = {
    id: null,
    full_name: 'Guest User',
    email: '',
    role: 'AUDITOR'
  };
  updateUserBadge();
  toggleUserDropdown();
  openLoginModal();
}

// ==============================================================================
// NAVIGATION TABS
// ==============================================================================
function switchTab(tabId) {
  State.activeTab = tabId;

  document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

  const activeBtn = Array.from(document.querySelectorAll('.nav-tab-btn'))
    .find(b => b.getAttribute('onclick')?.includes(`'${tabId}'`));
  if (activeBtn) activeBtn.classList.add('active');

  const targetPane = document.getElementById(`tab-${tabId}`);
  if (targetPane) targetPane.classList.add('active');

  if (tabId === 'overview') loadMetrics();
  if (tabId === 'invoices') loadInvoices();
  if (tabId === 'vouchers') loadVouchers();
  if (tabId === 'salaries') loadSalaries();
  if (tabId === 'tax') renderTaxLedger();
  if (tabId === 'audit') loadAuditLogs();
}

// ==============================================================================
// DATA FETCHING & API CALLS (NEON POSTGRESQL NATIVE)
// ==============================================================================
function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-User-Role': State.currentUser.role,
    'X-User-Id': State.currentUser.id || ''
  };
}

async function loadAllData() {
  await Promise.all([
    loadMetrics(),
    loadInvoices(),
    loadVouchers(),
    loadSalaries()
  ]);
}

async function loadMetrics() {
  try {
    const res = await fetch('/api/dashboard-metrics', { credentials: 'omit' });
    const data = await res.json();
    if (data.metrics) {
      State.metrics = data.metrics;
      renderMetricsUI(data.metrics);
    }
  } catch (err) {
    console.error('Failed to load metrics:', err);
  }
}

function renderMetricsUI(m) {
  const formatINR = (val) => '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  document.getElementById('kpiTotalBilled').textContent = formatINR(m.invoices.total_billed);
  document.getElementById('kpiInvoiceCount').textContent = `${m.invoices.count} Invoices Issued`;

  document.getElementById('kpiTotalReceived').textContent = formatINR(m.invoices.total_received);
  document.getElementById('kpiPendingReceivable').textContent = `${formatINR(m.invoices.total_pending)} Pending`;

  document.getElementById('kpiTotalExpenses').textContent = formatINR(m.expenses.total_expenses);
  document.getElementById('kpiVoucherCount').textContent = `${m.expenses.count} Expense Vouchers`;

  document.getElementById('kpiSalariesDisbursed').textContent = formatINR(m.salaries.net_disbursed);
  document.getElementById('kpiSalaryCount').textContent = `${m.salaries.count} Pure Finance Records`;

  document.getElementById('kpiTotalTax').textContent = formatINR(m.invoices.total_tax);
  document.getElementById('kpiTaxSplit').textContent = `CGST: ${formatINR(m.invoices.cgst)} | SGST: ${formatINR(m.invoices.sgst)}`;

  document.getElementById('kpiNetSurplus').textContent = formatINR(m.net_cash_surplus);

  // Render recent ledgers
  const invBody = document.getElementById('overviewRecentInvoicesBody');
  if (invBody && m.recent_invoices) {
    if (m.recent_invoices.length === 0) {
      invBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-dim);">No recent invoices</td></tr>';
    } else {
      invBody.innerHTML = m.recent_invoices.map(i => `
        <tr>
          <td><strong style="color: #60a5fa;">${i.receipt_no}</strong></td>
          <td>${escapeHtml(i.client_name)}</td>
          <td><strong>${formatINR(i.grand_total)}</strong></td>
          <td><span class="status-badge status-${(i.status || 'paid').toLowerCase()}">${i.status}</span></td>
        </tr>
      `).join('');
    }
  }

  const vouBody = document.getElementById('overviewRecentVouchersBody');
  if (vouBody && m.recent_vouchers) {
    if (m.recent_vouchers.length === 0) {
      vouBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-dim);">No recent vouchers</td></tr>';
    } else {
      vouBody.innerHTML = m.recent_vouchers.map(v => `
        <tr>
          <td><strong style="color: #a78bfa;">${v.voucher_no}</strong></td>
          <td>${v.category}</td>
          <td>${escapeHtml(v.paid_to_or_received_from)}</td>
          <td><strong style="color: var(--rose);">${formatINR(v.amount)}</strong></td>
        </tr>
      `).join('');
    }
  }
}

// ==============================================================================
// INVOICES & RECEIPTS CONTROLLER
// ==============================================================================
async function loadInvoices() {
  try {
    const res = await fetch('/api/invoices', { credentials: 'omit' });
    const data = await res.json();
    State.invoices = data.invoices || [];
    renderInvoicesTable(State.invoices);
    renderTaxLedger();
  } catch (err) {
    console.error('Failed to load invoices:', err);
  }
}

function renderInvoicesTable(invoices) {
  const tbody = document.getElementById('invoicesTableBody');
  if (!tbody) return;

  if (invoices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: var(--text-dim); padding: 2rem;">No Tax Invoices found in Neon DB.</td></tr>';
    return;
  }

  const formatINR = (val) => '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  tbody.innerHTML = invoices.map(i => {
    const totalTax = Number(i.cgst_amount || 0) + Number(i.sgst_amount || 0) + Number(i.igst_amount || 0);
    return `
      <tr>
        <td><strong style="color: #60a5fa;">${i.receipt_no}</strong></td>
        <td>${i.date}</td>
        <td><strong>${escapeHtml(i.client_name)}</strong></td>
        <td>${escapeHtml(i.site_location || '-')}</td>
        <td>${formatINR(i.sub_total)}</td>
        <td>${formatINR(totalTax)}</td>
        <td><strong style="color: var(--emerald);">${formatINR(i.grand_total)}</strong></td>
        <td>${i.payment_mode || 'Bank'}</td>
        <td><span class="status-badge status-${(i.status || 'paid').toLowerCase()}">${i.status}</span></td>
        <td>
          <div class="row-actions">
            <button class="btn btn-secondary btn-sm" onclick="viewDocument('invoice', '${i.id}')" title="Print / PDF">👁️ View</button>
            <button class="btn btn-secondary btn-sm" onclick="editInvoice('${i.id}')" ${State.currentUser.role === 'AUDITOR' ? 'disabled' : ''}>✏️</button>
            <button class="btn btn-danger btn-sm" onclick="openVoidModal('invoice', '${i.id}')" ${State.currentUser.role === 'AUDITOR' ? 'disabled' : ''}>🚫</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterInvoices() {
  const q = (document.getElementById('invoiceSearchInput')?.value || '').toLowerCase();
  const status = document.getElementById('invoiceStatusFilter')?.value || '';

  const filtered = State.invoices.filter(i => {
    const matchQ = (i.client_name || '').toLowerCase().includes(q) ||
      (i.receipt_no || '').toLowerCase().includes(q) ||
      (i.site_location || '').toLowerCase().includes(q);
    const matchStatus = !status || i.status === status;
    return matchQ && matchStatus;
  });

  renderInvoicesTable(filtered);
}

function openNewInvoiceForm() {
  document.getElementById('invoiceFormTitle').textContent = 'Generate Tax Receipt / Invoice';
  document.getElementById('invoiceForm').reset();
  document.getElementById('invoiceId').value = '';
  document.getElementById('invDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('lineItemsBody').innerHTML = '';
  addLineItem('Polyurethane Injection Grouting & Membrane Waterproofing', '9954', 1000, 'Sq.Ft', 50);
  recalculateInvoiceTotals();

  document.getElementById('invoiceFormCard').style.display = 'block';
  document.getElementById('invoiceFormCard').scrollIntoView({ behavior: 'smooth' });
}

function closeInvoiceForm() {
  document.getElementById('invoiceFormCard').style.display = 'none';
}

function addLineItem(desc = '', hsn = '9954', qty = 1, unit = 'Sq.Ft', rate = 0) {
  const tbody = document.getElementById('lineItemsBody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="item-desc" value="${escapeHtml(desc)}" placeholder="Item / Service description" required></td>
    <td><input type="text" class="item-hsn" value="${hsn}" placeholder="9954"></td>
    <td><input type="number" step="0.01" class="item-qty" value="${qty}" oninput="recalculateInvoiceTotals()" required></td>
    <td><input type="text" class="item-unit" value="${unit}" placeholder="Sq.Ft"></td>
    <td><input type="number" step="0.01" class="item-rate" value="${rate}" oninput="recalculateInvoiceTotals()" required></td>
    <td><input type="number" step="0.01" class="item-total" value="${qty * rate}" readonly style="background: rgba(255,255,255,0.05);"></td>
    <td><button type="button" class="btn btn-secondary btn-sm" onclick="this.closest('tr').remove(); recalculateInvoiceTotals();" style="color: var(--rose);">✕</button></td>
  `;
  tbody.appendChild(tr);
  recalculateInvoiceTotals();
}

function recalculateInvoiceTotals() {
  const rows = document.querySelectorAll('#lineItemsBody tr');
  let subtotal = 0;

  rows.forEach(tr => {
    const qty = parseFloat(tr.querySelector('.item-qty').value) || 0;
    const rate = parseFloat(tr.querySelector('.item-rate').value) || 0;
    const lineTotal = Math.round(qty * rate * 100) / 100;
    tr.querySelector('.item-total').value = lineTotal.toFixed(2);
    subtotal += lineTotal;
  });

  const isInter = document.querySelector('input[name="taxStructure"]:checked')?.value === 'inter';
  let cgst = 0, sgst = 0, igst = 0;

  if (isInter) {
    igst = Math.round(subtotal * 0.18 * 100) / 100;
  } else {
    cgst = Math.round(subtotal * 0.09 * 100) / 100;
    sgst = Math.round(subtotal * 0.09 * 100) / 100;
  }

  const grandTotal = Math.round((subtotal + cgst + sgst + igst) * 100) / 100;
  const words = convertINRToWords(grandTotal);

  document.getElementById('invDisplaySubTotal').textContent = '₹' + subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  if (isInter) {
    document.getElementById('invDisplayTax').textContent = `IGST (18%): ₹${igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  } else {
    document.getElementById('invDisplayTax').textContent = `CGST (9%): ₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })} | SGST (9%): ₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }
  document.getElementById('invDisplayGrandTotal').textContent = '₹' + grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  document.getElementById('invGrandTotalWords').value = words;
}

async function handleSaveInvoice(e) {
  e.preventDefault();
  if (State.currentUser.role === 'AUDITOR') {
    alert('Auditors have read-only access.');
    return;
  }

  const id = document.getElementById('invoiceId').value;
  const isInter = document.querySelector('input[name="taxStructure"]:checked')?.value === 'inter';

  const items = Array.from(document.querySelectorAll('#lineItemsBody tr')).map(tr => ({
    description: tr.querySelector('.item-desc').value,
    hsn_sac_code: tr.querySelector('.item-hsn').value || '9954',
    quantity: parseFloat(tr.querySelector('.item-qty').value) || 1,
    unit: tr.querySelector('.item-unit').value || 'Sq.Ft',
    rate: parseFloat(tr.querySelector('.item-rate').value) || 0,
    total_amount: parseFloat(tr.querySelector('.item-total').value) || 0
  }));

  const payload = {
    id: id || undefined,
    receipt_no: document.getElementById('invReceiptNo').value || undefined,
    date: document.getElementById('invDate').value,
    client_name: document.getElementById('invClientName').value,
    client_address: document.getElementById('invClientAddress').value,
    client_gstin: document.getElementById('invClientGstin').value,
    site_location: document.getElementById('invSiteLocation').value,
    is_interstate: isInter,
    payment_mode: document.getElementById('invPaymentMode').value,
    transaction_ref: document.getElementById('invTxRef').value,
    items: items,
    status: 'PAID'
  };

  try {
    const res = await fetch('/api/invoices', {
      method: id ? 'PUT' : 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showToast(id ? 'Invoice updated successfully' : 'New invoice saved to Neon DB');
      closeInvoiceForm();
      loadInvoices();
      loadMetrics();
    } else {
      alert('Error: ' + (result.error || 'Failed to save invoice'));
    }
  } catch (err) {
    console.error('Invoice save error:', err);
    alert('Network error while saving invoice');
  }
}

async function editInvoice(id) {
  try {
    const res = await fetch(`/api/invoices?id=${id}`);
    const data = await res.json();
    if (!data.invoice) return;

    const inv = data.invoice;
    document.getElementById('invoiceFormTitle').textContent = `Edit Invoice: ${inv.receipt_no}`;
    document.getElementById('invoiceId').value = inv.id;
    document.getElementById('invReceiptNo').value = inv.receipt_no;
    document.getElementById('invDate').value = inv.date;
    document.getElementById('invClientName').value = inv.client_name;
    document.getElementById('invClientAddress').value = inv.client_address || '';
    document.getElementById('invClientGstin').value = inv.client_gstin || '';
    document.getElementById('invSiteLocation').value = inv.site_location || '';
    document.getElementById('invPaymentMode').value = inv.payment_mode || 'Bank Transfer';
    document.getElementById('invTxRef').value = inv.transaction_ref || '';

    const isInter = inv.is_interstate;
    const radio = document.querySelector(`input[name="taxStructure"][value="${isInter ? 'inter' : 'intra'}"]`);
    if (radio) radio.checked = true;

    const tbody = document.getElementById('lineItemsBody');
    tbody.innerHTML = '';
    (data.items || []).forEach(item => {
      addLineItem(item.description, item.hsn_sac_code, item.quantity, item.unit, item.rate);
    });

    document.getElementById('invoiceFormCard').style.display = 'block';
    document.getElementById('invoiceFormCard').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    console.error('Failed to load invoice for editing:', err);
  }
}

// ==============================================================================
// VOUCHERS CONTROLLER
// ==============================================================================
async function loadVouchers() {
  try {
    const res = await fetch('/api/vouchers', { credentials: 'omit' });
    const data = await res.json();
    State.vouchers = data.vouchers || [];
    renderVouchersTable(State.vouchers);
  } catch (err) {
    console.error('Failed to load vouchers:', err);
  }
}

function renderVouchersTable(vouchers) {
  const tbody = document.getElementById('vouchersTableBody');
  if (!tbody) return;

  if (vouchers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: var(--text-dim); padding: 2rem;">No Financial Vouchers found in Neon DB.</td></tr>';
    return;
  }

  const formatINR = (val) => '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  tbody.innerHTML = vouchers.map(v => `
    <tr>
      <td><strong style="color: #a78bfa;">${v.voucher_no}</strong></td>
      <td>${v.voucher_date}</td>
      <td><span class="status-badge" style="background: rgba(59, 130, 246, 0.15); color: #93c5fd;">${v.voucher_type}</span></td>
      <td>${v.category}</td>
      <td><strong>${escapeHtml(v.paid_to_or_received_from)}</strong></td>
      <td><strong style="color: var(--rose);">${formatINR(v.amount)}</strong></td>
      <td>${v.payment_mode || 'Bank'}</td>
      <td>${escapeHtml(v.reference_number || '-')}</td>
      <td><span class="status-badge status-${(v.status || 'confirmed').toLowerCase()}">${v.status}</span></td>
      <td>
        <div class="row-actions">
          <button class="btn btn-secondary btn-sm" onclick="viewDocument('voucher', '${v.id}')" title="Print / PDF">👁️ View</button>
          <button class="btn btn-secondary btn-sm" onclick="editVoucher('${v.id}')" ${State.currentUser.role === 'AUDITOR' ? 'disabled' : ''}>✏️</button>
          <button class="btn btn-danger btn-sm" onclick="openVoidModal('voucher', '${v.id}')" ${State.currentUser.role === 'AUDITOR' ? 'disabled' : ''}>🚫</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterVouchers() {
  const q = (document.getElementById('voucherSearchInput')?.value || '').toLowerCase();
  const category = document.getElementById('voucherCategoryFilter')?.value || '';

  const filtered = State.vouchers.filter(v => {
    const matchQ = (v.paid_to_or_received_from || '').toLowerCase().includes(q) ||
      (v.voucher_no || '').toLowerCase().includes(q) ||
      (v.narration || '').toLowerCase().includes(q);
    const matchCat = !category || v.category === category;
    return matchQ && matchCat;
  });

  renderVouchersTable(filtered);
}

function openNewVoucherForm() {
  document.getElementById('voucherFormTitle').textContent = 'Generate Financial Voucher';
  document.getElementById('voucherForm').reset();
  document.getElementById('voucherId').value = '';
  document.getElementById('vouDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('vouAmountWords').value = '';
  document.getElementById('voucherFormCard').style.display = 'block';
  document.getElementById('voucherFormCard').scrollIntoView({ behavior: 'smooth' });
}

function closeVoucherForm() {
  document.getElementById('voucherFormCard').style.display = 'none';
}

function updateVoucherWords() {
  const amount = parseFloat(document.getElementById('vouAmount').value) || 0;
  document.getElementById('vouAmountWords').value = convertINRToWords(amount);
}

async function handleSaveVoucher(e) {
  e.preventDefault();
  if (State.currentUser.role === 'AUDITOR') {
    alert('Auditors have read-only access.');
    return;
  }

  const id = document.getElementById('voucherId').value;
  const payload = {
    id: id || undefined,
    voucher_no: document.getElementById('vouNumber').value || undefined,
    voucher_type: document.getElementById('vouType').value,
    category: document.getElementById('vouCategory').value,
    voucher_date: document.getElementById('vouDate').value,
    paid_to_or_received_from: document.getElementById('vouParty').value,
    amount: parseFloat(document.getElementById('vouAmount').value) || 0,
    amount_in_words: document.getElementById('vouAmountWords').value,
    payment_mode: document.getElementById('vouPaymentMode').value,
    reference_number: document.getElementById('vouRefNo').value,
    narration: document.getElementById('vouNarration').value,
    approved_by: document.getElementById('vouApprovedBy').value,
    status: 'CONFIRMED'
  };

  try {
    const res = await fetch('/api/vouchers', {
      method: id ? 'PUT' : 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showToast(id ? 'Voucher updated successfully' : 'New voucher saved to Neon DB');
      closeVoucherForm();
      loadVouchers();
      loadMetrics();
    } else {
      alert('Error: ' + (result.error || 'Failed to save voucher'));
    }
  } catch (err) {
    console.error('Voucher save error:', err);
    alert('Network error while saving voucher');
  }
}

async function editVoucher(id) {
  try {
    const res = await fetch(`/api/vouchers?id=${id}`);
    const data = await res.json();
    if (!data.voucher) return;

    const v = data.voucher;
    document.getElementById('voucherFormTitle').textContent = `Edit Voucher: ${v.voucher_no}`;
    document.getElementById('voucherId').value = v.id;
    document.getElementById('vouNumber').value = v.voucher_no;
    document.getElementById('vouType').value = v.voucher_type;
    document.getElementById('vouCategory').value = v.category;
    document.getElementById('vouDate').value = v.voucher_date;
    document.getElementById('vouParty').value = v.paid_to_or_received_from;
    document.getElementById('vouAmount').value = v.amount;
    document.getElementById('vouAmountWords').value = v.amount_in_words;
    document.getElementById('vouPaymentMode').value = v.payment_mode || 'Bank Transfer';
    document.getElementById('vouRefNo').value = v.reference_number || '';
    document.getElementById('vouNarration').value = v.narration || '';
    document.getElementById('vouApprovedBy').value = v.approved_by || '';

    document.getElementById('voucherFormCard').style.display = 'block';
    document.getElementById('voucherFormCard').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    console.error('Failed to load voucher:', err);
  }
}

// ==============================================================================
// SALARY DISBURSEMENTS & PAYSLIP CONTROLLER
// ==============================================================================
async function loadSalaries() {
  try {
    const res = await fetch('/api/salaries', { credentials: 'omit' });
    const data = await res.json();
    State.salaries = data.salaries || [];
    renderSalariesTable(State.salaries);
  } catch (err) {
    console.error('Failed to load salaries:', err);
  }
}

function renderSalariesTable(salaries) {
  const tbody = document.getElementById('salariesTableBody');
  if (!tbody) return;

  if (salaries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-dim); padding: 2rem;">No Salary Disbursements found in Neon DB.</td></tr>';
    return;
  }

  const formatINR = (val) => '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  tbody.innerHTML = salaries.map(s => `
    <tr>
      <td><strong style="color: #60a5fa;">${s.disbursement_no}</strong></td>
      <td><strong>${escapeHtml(s.disbursement_month)}</strong></td>
      <td><strong>${escapeHtml(s.employee_name)}</strong> <span style="font-size: 0.75rem; color: var(--text-dim);">(${s.employee_id || '-'})</span></td>
      <td>${escapeHtml(s.designation)}</td>
      <td>${formatINR(s.total_earnings)}</td>
      <td><span style="color: var(--rose);">${formatINR(s.total_deductions)}</span></td>
      <td><strong style="color: var(--emerald);">${formatINR(s.net_salary)}</strong></td>
      <td>${s.payment_mode || 'Bank'}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-secondary btn-sm" onclick="viewDocument('payslip', '${s.id}')" title="Print Payslip">📜 Payslip</button>
          <button class="btn btn-secondary btn-sm" onclick="editSalary('${s.id}')" ${State.currentUser.role === 'AUDITOR' ? 'disabled' : ''}>✏️</button>
          <button class="btn btn-danger btn-sm" onclick="openVoidModal('salary', '${s.id}')" ${State.currentUser.role === 'AUDITOR' ? 'disabled' : ''}>🚫</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterSalaries() {
  const q = (document.getElementById('salarySearchInput')?.value || '').toLowerCase();
  const filtered = State.salaries.filter(s =>
    (s.employee_name || '').toLowerCase().includes(q) ||
    (s.disbursement_no || '').toLowerCase().includes(q) ||
    (s.designation || '').toLowerCase().includes(q)
  );
  renderSalariesTable(filtered);
}

function openNewSalaryForm() {
  document.getElementById('salaryFormTitle').textContent = 'Process Salary Disbursement & Generate Payslip';
  document.getElementById('salaryForm').reset();
  document.getElementById('salaryId').value = '';
  document.getElementById('salDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('salMonth').value = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  recalcSalaryTotals();

  document.getElementById('salaryFormCard').style.display = 'block';
  document.getElementById('salaryFormCard').scrollIntoView({ behavior: 'smooth' });
}

function closeSalaryForm() {
  document.getElementById('salaryFormCard').style.display = 'none';
}

function recalcSalaryTotals() {
  const basic = parseFloat(document.getElementById('salBasicPay').value) || 0;
  const hra = parseFloat(document.getElementById('salHra').value) || 0;
  const special = parseFloat(document.getElementById('salSpecialAllowance').value) || 0;
  const totalEarnings = Math.round((basic + hra + special) * 100) / 100;

  const pf = parseFloat(document.getElementById('salPf').value) || 0;
  const esi = parseFloat(document.getElementById('salEsi').value) || 0;
  const tds = parseFloat(document.getElementById('salTds').value) || 0;
  const adv = parseFloat(document.getElementById('salAdvance').value) || 0;
  const totalDeductions = Math.round((pf + esi + tds + adv) * 100) / 100;

  const netSalary = Math.round((totalEarnings - totalDeductions) * 100) / 100;
  const words = convertINRToWords(netSalary);

  document.getElementById('salDisplayTotalEarnings').textContent = '₹' + totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  document.getElementById('salDisplayTotalDeductions').textContent = '₹' + totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  document.getElementById('salDisplayNetSalary').textContent = '₹' + netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  document.getElementById('salDisplayNetSalaryWords').textContent = words;
}

async function handleSaveSalary(e) {
  e.preventDefault();
  if (State.currentUser.role === 'AUDITOR') {
    alert('Auditors have read-only access.');
    return;
  }

  const id = document.getElementById('salaryId').value;
  const payload = {
    id: id || undefined,
    disbursement_month: document.getElementById('salMonth').value,
    disbursement_date: document.getElementById('salDate').value,
    employee_id: document.getElementById('salEmpId').value,
    employee_name: document.getElementById('salEmpName').value,
    designation: document.getElementById('salDesignation').value,
    bank_account_no: document.getElementById('salBankAcc').value,
    ifsc_code: document.getElementById('salIfsc').value,
    payment_mode: document.getElementById('salPaymentMode').value,
    basic_pay: parseFloat(document.getElementById('salBasicPay').value) || 0,
    hra: parseFloat(document.getElementById('salHra').value) || 0,
    special_allowance: parseFloat(document.getElementById('salSpecialAllowance').value) || 0,
    pf_deduction: parseFloat(document.getElementById('salPf').value) || 0,
    esi_deduction: parseFloat(document.getElementById('salEsi').value) || 0,
    tds_deduction: parseFloat(document.getElementById('salTds').value) || 0,
    advance_adjustment: parseFloat(document.getElementById('salAdvance').value) || 0
  };

  try {
    const res = await fetch('/api/salaries', {
      method: id ? 'PUT' : 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showToast(id ? 'Salary adjusted successfully' : 'Salary disbursed & debit voucher linked');
      closeSalaryForm();
      loadSalaries();
      loadVouchers();
      loadMetrics();
    } else {
      alert('Error: ' + (result.error || 'Failed to disburse salary'));
    }
  } catch (err) {
    console.error('Salary save error:', err);
    alert('Network error while saving salary');
  }
}

async function editSalary(id) {
  try {
    const res = await fetch(`/api/salaries?id=${id}`);
    const data = await res.json();
    if (!data.salary) return;

    const s = data.salary;
    document.getElementById('salaryFormTitle').textContent = `Adjust Salary: ${s.disbursement_no}`;
    document.getElementById('salaryId').value = s.id;
    document.getElementById('salMonth').value = s.disbursement_month;
    document.getElementById('salDate').value = s.disbursement_date;
    document.getElementById('salEmpId').value = s.employee_id || '';
    document.getElementById('salEmpName').value = s.employee_name;
    document.getElementById('salDesignation').value = s.designation;
    document.getElementById('salBankAcc').value = s.bank_account_no || '';
    document.getElementById('salIfsc').value = s.ifsc_code || '';
    document.getElementById('salPaymentMode').value = s.payment_mode || 'Bank Transfer';

    document.getElementById('salBasicPay').value = s.basic_pay;
    document.getElementById('salHra').value = s.hra || 0;
    document.getElementById('salSpecialAllowance').value = s.special_allowance || 0;
    document.getElementById('salPf').value = s.pf_deduction || 0;
    document.getElementById('salEsi').value = s.esi_deduction || 0;
    document.getElementById('salTds').value = s.tds_deduction || 0;
    document.getElementById('salAdvance').value = s.advance_adjustment || 0;

    recalcSalaryTotals();
    document.getElementById('salaryFormCard').style.display = 'block';
    document.getElementById('salaryFormCard').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    console.error('Failed to load salary:', err);
  }
}

// ==============================================================================
// GST & TAX SUMMARY CONTROLLER
// ==============================================================================
function renderTaxLedger() {
  const tbody = document.getElementById('taxLedgerTableBody');
  if (!tbody) return;

  const invoices = State.invoices || [];
  let totalCgst = 0, totalSgst = 0, totalIgst = 0, grandTax = 0;

  const formatINR = (val) => '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  if (invoices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: var(--text-dim); padding: 2rem;">No Tax Invoices found for GST ledger.</td></tr>';
    return;
  }

  tbody.innerHTML = invoices.map(i => {
    const cgst = Number(i.cgst_amount || 0);
    const sgst = Number(i.sgst_amount || 0);
    const igst = Number(i.igst_amount || 0);
    const taxSum = cgst + sgst + igst;

    totalCgst += cgst;
    totalSgst += sgst;
    totalIgst += igst;
    grandTax += taxSum;

    return `
      <tr>
        <td><strong style="color: #60a5fa;">${i.receipt_no}</strong></td>
        <td>${i.date}</td>
        <td><strong>${escapeHtml(i.client_name)}</strong></td>
        <td><code>${escapeHtml(i.client_gstin || 'B2C / Unregistered')}</code></td>
        <td>${formatINR(i.sub_total)}</td>
        <td>${formatINR(cgst)}</td>
        <td>${formatINR(sgst)}</td>
        <td>${formatINR(igst)}</td>
        <td><strong style="color: #fbbf24;">${formatINR(taxSum)}</strong></td>
        <td><strong style="color: var(--emerald);">${formatINR(i.grand_total)}</strong></td>
      </tr>
    `;
  }).join('');

  document.getElementById('taxCgstTotal').textContent = formatINR(totalCgst);
  document.getElementById('taxSgstTotal').textContent = formatINR(totalSgst);
  document.getElementById('taxIgstTotal').textContent = formatINR(totalIgst);
  document.getElementById('taxGrandTotal').textContent = formatINR(grandTax);
}

// ==============================================================================
// AUDIT LOGS CONTROLLER
// ==============================================================================
async function loadAuditLogs() {
  if (State.currentUser.role !== 'SUPER_ADMIN' && State.currentUser.role !== 'OWNER') {
    return;
  }
  try {
    const res = await fetch('/api/audit-logs', { headers: getAuthHeaders() });
    const data = await res.json();
    State.auditLogs = data.audit_logs || [];
    renderAuditLogsTable(State.auditLogs);
  } catch (err) {
    console.error('Failed to load audit logs:', err);
  }
}

function renderAuditLogsTable(logs) {
  const tbody = document.getElementById('auditLogsTableBody');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 2rem;">No audit logs recorded yet.</td></tr>';
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const time = new Date(l.created_at).toLocaleString('en-IN');
    const actionColor = l.action === 'INSERT' ? '#34d399' : (l.action === 'UPDATE' ? '#60a5fa' : '#fb7185');
    return `
      <tr>
        <td style="font-family: monospace; font-size: 0.75rem;">${time}</td>
        <td><code>${l.table_name}</code></td>
        <td><span class="status-badge" style="background: rgba(255,255,255,0.06); color: ${actionColor}; font-weight: 700;">${l.action}</span></td>
        <td>${escapeHtml(l.user_name || 'System Admin')}</td>
        <td>${escapeHtml(l.reason || '-')}</td>
        <td style="font-family: monospace; font-size: 0.72rem; color: var(--text-dim);">${l.record_id}</td>
      </tr>
    `;
  }).join('');
}

// ==============================================================================
// DOCUMENT GENERATION SPECIFICATIONS (RECEIPTS, VOUCHERS, PAYSLIPS)
// ==============================================================================
async function viewDocument(type, id) {
  const modal = document.getElementById('docViewerModal');
  const title = document.getElementById('docViewerTitle');
  const content = document.getElementById('docViewerContent');

  content.innerHTML = '<div style="text-align: center; padding: 3rem; color: #334155;">Rendering document from Neon DB...</div>';
  modal.classList.add('show');

  const formatINR = (val) => '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const companyHeaderHTML = `
    <div class="doc-company-header">
      <div class="doc-company-title">Dharshithan Waterproofing and Concrete Solutions</div>
      <div class="doc-company-address">69/8, First Floor, Karuneegar Street, Adambakkam, Chennai - 600088.</div>
      <div class="doc-company-contact">Email: dharshithanpartiban@gmail.com | Phone: +91 9944139663</div>
      <div class="doc-company-gstin">GST No: 33CEQPP3071Q1ZR</div>
    </div>
  `;

  // 1. INVOICE / RECEIPT DOCUMENT
  if (type === 'invoice') {
    title.textContent = 'Official Tax Invoice / Receipt';
    const res = await fetch(`/api/invoices?id=${id}`);
    const data = await res.json();
    const inv = data.invoice;
    const items = data.items || [];

    const isInter = inv.is_interstate;
    const totalTax = Number(inv.cgst_amount || 0) + Number(inv.sgst_amount || 0) + Number(inv.igst_amount || 0);

    content.innerHTML = `
      <div class="printable-document">
        ${companyHeaderHTML}

        <div class="doc-title-bar">
          <span class="doc-name">TAX INVOICE / RECEIPT</span>
          <span class="doc-number">Invoice No: ${inv.receipt_no}</span>
        </div>

        <div class="doc-meta-grid">
          <div class="doc-meta-box">
            <div><strong>Client Name:</strong> ${escapeHtml(inv.client_name)}</div>
            <div><strong>Billing Address:</strong> ${escapeHtml(inv.client_address || '-')}</div>
            <div><strong>Client GSTIN:</strong> ${escapeHtml(inv.client_gstin || 'Unregistered')}</div>
            <div><strong>Site Location:</strong> ${escapeHtml(inv.site_location || '-')}</div>
          </div>
          <div class="doc-meta-box">
            <div><strong>Invoice Date:</strong> ${inv.date}</div>
            <div><strong>Payment Mode:</strong> ${inv.payment_mode || 'Bank Transfer'}</div>
            <div><strong>Reference / UTR:</strong> ${escapeHtml(inv.transaction_ref || '-')}</div>
            <div><strong>Status:</strong> <span style="font-weight: 700; color: #059669;">${inv.status}</span></div>
          </div>
        </div>

        <table class="doc-table">
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 45%;">Service / Description</th>
              <th style="width: 12%;">HSN/SAC</th>
              <th style="width: 12%;">Quantity</th>
              <th style="width: 12%;">Rate (₹)</th>
              <th style="width: 14%;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${escapeHtml(it.description)}</strong></td>
                <td>${it.hsn_sac_code || '9954'}</td>
                <td>${it.quantity} ${it.unit}</td>
                <td>${formatINR(it.rate)}</td>
                <td>${formatINR(it.total_amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="doc-totals-box">
          <div class="doc-total-row">
            <span>Taxable Subtotal:</span>
            <strong>${formatINR(inv.sub_total)}</strong>
          </div>
          ${isInter ? `
            <div class="doc-total-row">
              <span>IGST (18%):</span>
              <strong>${formatINR(inv.igst_amount)}</strong>
            </div>
          ` : `
            <div class="doc-total-row">
              <span>CGST (9%):</span>
              <strong>${formatINR(inv.cgst_amount)}</strong>
            </div>
            <div class="doc-total-row">
              <span>SGST (9%):</span>
              <strong>${formatINR(inv.sgst_amount)}</strong>
            </div>
          `}
          <div class="doc-total-row doc-grand-total">
            <span>Grand Total:</span>
            <span>${formatINR(inv.grand_total)}</span>
          </div>
        </div>

        <div class="doc-words-box">
          <strong>Amount in Words:</strong> ${inv.grand_total_words}
        </div>

        <div class="doc-signature-grid">
          <div>
            <div style="height: 45px;"></div>
            <div class="signature-box">Client Signature / Seal</div>
          </div>
          <div>
            <div style="height: 45px;"></div>
            <div class="signature-box">For Dharshithan Waterproofing and Concrete Solutions<br><small style="color: #64748b;">(Authorized Signatory)</small></div>
          </div>
        </div>
      </div>
    `;
  }

  // 2. FINANCIAL VOUCHER DOCUMENT
  else if (type === 'voucher') {
    title.textContent = 'Official Financial Voucher';
    const res = await fetch(`/api/vouchers?id=${id}`);
    const data = await res.json();
    const v = data.voucher;

    content.innerHTML = `
      <div class="printable-document">
        ${companyHeaderHTML}

        <div class="doc-title-bar">
          <span class="doc-name">${v.voucher_type} VOUCHER</span>
          <span class="doc-number">Voucher No: ${v.voucher_no}</span>
        </div>

        <div class="doc-meta-grid">
          <div class="doc-meta-box">
            <div><strong>Paid To / Party:</strong> ${escapeHtml(v.paid_to_or_received_from)}</div>
            <div><strong>Category:</strong> ${v.category}</div>
            <div><strong>Payment Mode:</strong> ${v.payment_mode}</div>
          </div>
          <div class="doc-meta-box">
            <div><strong>Date:</strong> ${v.voucher_date}</div>
            <div><strong>Reference / Bill No:</strong> ${escapeHtml(v.reference_number || '-')}</div>
            <div><strong>Status:</strong> ${v.status}</div>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 4px; margin-bottom: 16px;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Particulars & Narration</div>
          <div style="font-size: 13px; color: #0f172a; line-height: 1.5;">${escapeHtml(v.narration)}</div>
        </div>

        <div class="doc-totals-box" style="align-items: stretch;">
          <div style="display: flex; justify-content: space-between; background: #f1f5f9; padding: 10px; border-radius: 4px; border: 1px solid #cbd5e1;">
            <strong style="font-size: 14px; text-transform: uppercase;">Total Voucher Amount:</strong>
            <strong style="font-size: 16px; color: #0f172a;">${formatINR(v.amount)}</strong>
          </div>
        </div>

        <div class="doc-words-box" style="margin-top: 14px;">
          <strong>Amount in Words:</strong> ${v.amount_in_words}
        </div>

        <div class="doc-signature-grid">
          <div>
            <div style="height: 45px;"></div>
            <div class="signature-box">Prepared By<br><small style="color: #64748b;">(Accounts / Finance)</small></div>
          </div>
          <div>
            <div style="height: 45px;"></div>
            <div class="signature-box">Authorized Signatory<br><small style="color: #64748b;">(Dharshithan Waterproofing and Concrete Solutions)</small></div>
          </div>
        </div>
      </div>
    `;
  }

  // 3. SALARY PAYSLIP DOCUMENT
  else if (type === 'payslip') {
    title.textContent = 'Official Salary Payslip';
    const res = await fetch(`/api/salaries?id=${id}`);
    const data = await res.json();
    const s = data.salary;

    content.innerHTML = `
      <div class="printable-document">
        ${companyHeaderHTML}

        <div class="doc-title-bar">
          <span class="doc-name">PAYSLIP FOR THE MONTH OF ${s.disbursement_month.toUpperCase()}</span>
          <span class="doc-number">Ref: ${s.disbursement_no}</span>
        </div>

        <div class="doc-meta-grid">
          <div class="doc-meta-box">
            <div><strong>Employee Name:</strong> ${escapeHtml(s.employee_name)}</div>
            <div><strong>Employee ID:</strong> ${escapeHtml(s.employee_id || '-')}</div>
            <div><strong>Designation:</strong> ${escapeHtml(s.designation)}</div>
          </div>
          <div class="doc-meta-box">
            <div><strong>Disbursement Date:</strong> ${s.disbursement_date}</div>
            <div><strong>Bank Account No:</strong> ${escapeHtml(s.bank_account_no || '-')}</div>
            <div><strong>IFSC Code:</strong> ${escapeHtml(s.ifsc_code || '-')}</div>
          </div>
        </div>

        <table class="doc-table">
          <thead>
            <tr>
              <th style="width: 50%;">Earnings</th>
              <th style="width: 50%;">Deductions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                  <span>Basic Pay:</span> <strong>${formatINR(s.basic_pay)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                  <span>HRA:</span> <strong>${formatINR(s.hra)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                  <span>Special Allowance:</span> <strong>${formatINR(s.special_allowance)}</strong>
                </div>
              </td>
              <td>
                <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                  <span>Provident Fund (PF):</span> <strong>${formatINR(s.pf_deduction)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                  <span>ESI Deduction:</span> <strong>${formatINR(s.esi_deduction)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                  <span>TDS Deduction:</span> <strong>${formatINR(s.tds_deduction)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                  <span>Advance Recovery:</span> <strong>${formatINR(s.advance_adjustment)}</strong>
                </div>
              </td>
            </tr>
            <tr style="background: #f8fafc; font-weight: 700;">
              <td>
                <div style="display: flex; justify-content: space-between;">
                  <span>Gross Earnings:</span> <span>${formatINR(s.total_earnings)}</span>
                </div>
              </td>
              <td>
                <div style="display: flex; justify-content: space-between;">
                  <span>Total Deductions:</span> <span style="color: #e11d48;">${formatINR(s.total_deductions)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Highlighted Net Payable Box -->
        <div style="background: #ecfdf5; border: 2px solid #059669; padding: 12px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #065f46;">Net Payable Salary</span>
            <div style="font-size: 11px; color: #1e3a8a;">Mode: ${s.payment_mode || 'Bank Transfer'}</div>
          </div>
          <div style="font-size: 18px; font-weight: 800; color: #065f46; font-family: monospace;">
            ${formatINR(s.net_salary)}
          </div>
        </div>

        <div class="doc-words-box">
          <strong>Net Amount in Words:</strong> ${s.net_salary_words}
        </div>

        <div class="doc-signature-grid">
          <div>
            <div style="height: 45px;"></div>
            <div class="signature-box">Employee Signature / Acknowledgment</div>
          </div>
          <div>
            <div style="height: 45px;"></div>
            <div class="signature-box">Authorized Signatory<br><small style="color: #64748b;">(Dharshithan Waterproofing and Concrete Solutions)</small></div>
          </div>
        </div>
      </div>
    `;
  }
}

function closeDocViewer() {
  document.getElementById('docViewerModal').classList.remove('show');
}

// ==============================================================================
// VOID / DELETE ACTIONS WITH MANDATORY AUDIT REASON
// ==============================================================================
function openVoidModal(type, id) {
  if (State.currentUser.role === 'AUDITOR') {
    alert('Auditors cannot delete or void transactions.');
    return;
  }
  document.getElementById('voidTargetType').value = type;
  document.getElementById('voidTargetId').value = id;
  document.getElementById('voidReasonInput').value = '';
  document.getElementById('voidModal').classList.add('show');
}

function closeVoidModal() {
  document.getElementById('voidModal').classList.remove('show');
}

async function submitVoidAction() {
  const type = document.getElementById('voidTargetType').value;
  const id = document.getElementById('voidTargetId').value;
  const reason = document.getElementById('voidReasonInput').value.trim();

  if (!reason) {
    alert('Please enter a mandatory audit reason before voiding this record.');
    return;
  }

  const endpointMap = {
    'invoice': '/api/invoices',
    'voucher': '/api/vouchers',
    'salary': '/api/salaries'
  };

  try {
    const res = await fetch(endpointMap[type], {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ id, reason })
    });
    const result = await res.json();
    if (result.success) {
      showToast('Record voided and audit event recorded');
      closeVoidModal();
      loadAllData();
    } else {
      alert('Error: ' + (result.error || 'Failed to void record'));
    }
  } catch (err) {
    console.error('Void error:', err);
    alert('Network error while processing void action');
  }
}

// ==============================================================================
// AUTHENTICATION & LOGIN MODAL
// ==============================================================================
function openLoginModal() {
  document.getElementById('loginModal').classList.add('show');
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('show');
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password })
    });
    const data = await res.json();
    if (data.success && data.user) {
      State.currentUser = data.user;
      saveSession();
      updateUserBadge();
      closeLoginModal();
      showToast(`Welcome back, ${data.user.full_name}! Connected to Neon DB.`);
      loadAllData();
    } else {
      alert(data.error || 'Authentication failed');
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Failed to connect to authentication server');
  }
}

// ==============================================================================
// PURE CLIENT-SIDE DATA EXPORT (ZERO GOOGLE SHEETS)
// ==============================================================================
function exportDataCopy(format = 'xlsx') {
  if (typeof XLSX === 'undefined') {
    alert('Spreadsheet export engine loading, please try again in a moment...');
    return;
  }

  const wb = XLSX.utils.book_new();

  // 1. Invoices Sheet
  const invData = State.invoices.map(i => ({
    'Receipt No': i.receipt_no,
    'Date': i.date,
    'Client Name': i.client_name,
    'GSTIN': i.client_gstin || '',
    'Site Location': i.site_location || '',
    'Sub Total (₹)': Number(i.sub_total || 0),
    'CGST (₹)': Number(i.cgst_amount || 0),
    'SGST (₹)': Number(i.sgst_amount || 0),
    'IGST (₹)': Number(i.igst_amount || 0),
    'Grand Total (₹)': Number(i.grand_total || 0),
    'Payment Mode': i.payment_mode || '',
    'Status': i.status || ''
  }));
  const wsInv = XLSX.utils.json_to_sheet(invData);
  XLSX.utils.book_append_sheet(wb, wsInv, 'Tax Invoices');

  // 2. Vouchers Sheet
  const vouData = State.vouchers.map(v => ({
    'Voucher No': v.voucher_no,
    'Date': v.voucher_date,
    'Type': v.voucher_type,
    'Category': v.category,
    'Paid To / From': v.paid_to_or_received_from,
    'Amount (₹)': Number(v.amount || 0),
    'Payment Mode': v.payment_mode || '',
    'Reference': v.reference_number || '',
    'Narration': v.narration || '',
    'Status': v.status || ''
  }));
  const wsVou = XLSX.utils.json_to_sheet(vouData);
  XLSX.utils.book_append_sheet(wb, wsVou, 'Financial Vouchers');

  // 3. Salaries Sheet
  const salData = State.salaries.map(s => ({
    'Disbursement No': s.disbursement_no,
    'Month': s.disbursement_month,
    'Employee Name': s.employee_name,
    'Employee ID': s.employee_id || '',
    'Designation': s.designation,
    'Basic Pay (₹)': Number(s.basic_pay || 0),
    'HRA (₹)': Number(s.hra || 0),
    'Total Earnings (₹)': Number(s.total_earnings || 0),
    'Total Deductions (₹)': Number(s.total_deductions || 0),
    'Net Salary (₹)': Number(s.net_salary || 0),
    'Payment Mode': s.payment_mode || ''
  }));
  const wsSal = XLSX.utils.json_to_sheet(salData);
  XLSX.utils.book_append_sheet(wb, wsSal, 'Salary Disbursements');

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Dharshithan_Waterproofing_Ledgers_${timestamp}.${format}`;

  if (format === 'csv') {
    XLSX.writeFile(wb, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, filename, { bookType: 'xlsx' });
  }

  showToast(`Downloaded ${filename} directly from Neon data.`);
}

// ==============================================================================
// INDIAN RUPEE CURRENCY TO WORDS HELPER
// ==============================================================================
function convertINRToWords(amount) {
  if (amount === 0 || amount === '0') return 'Zero Rupees Only';
  if (!amount) return '';

  const num = Math.floor(Math.abs(Number(amount)));
  const decimal = Math.round((Math.abs(Number(amount)) - num) * 100);

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function twoDigits(n) {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
  }

  function threeDigits(n) {
    if (n === 0) return '';
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 0) str += twoDigits(n);
    return str.trim();
  }

  let crore = Math.floor(num / 10000000);
  let rem = num % 10000000;
  let lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  let thousand = Math.floor(rem / 1000);
  let hundred = rem % 1000;

  let words = '';
  if (crore > 0) words += threeDigits(crore) + ' Crore ';
  if (lakh > 0) words += twoDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += twoDigits(thousand) + ' Thousand ';
  if (hundred > 0) words += threeDigits(hundred) + ' ';

  words = words.trim();
  if (!words) words = 'Zero';

  let result = words + ' Rupees';
  if (decimal > 0) result += ' and ' + twoDigits(decimal) + ' Paise';
  result += ' Only';

  return result;
}

// Utility Helpers
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(msg) {
  const existing = document.getElementById('toastNotice');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toastNotice';
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #1e293b;
    border: 1px solid #3b82f6;
    color: #ffffff;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 0.85rem;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: fadeIn 0.3s ease;
  `;
  toast.innerHTML = `<span>✨</span><span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
