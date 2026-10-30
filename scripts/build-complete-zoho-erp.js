const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');

console.log('--- Generating Complete Enterprise Zoho ERP Platform ---');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dharshithan Finance ERP - Enterprise Financial Governance</title>
  <link rel="icon" type="image/webp" href="assets/favicon.webp">
  <link rel="apple-touch-icon" href="assets/logo.webp">
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#161e2e">

  <!-- Inter & JetBrains Mono Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#f0f9ff',
              100: '#e0f2fe',
              500: '#0284c7',
              600: '#0369a1',
              700: '#075985',
              800: '#0c4a6e',
              900: '#082f49',
            },
            zoho: {
              blue: '#0284c7',
              dark: '#161e2e',
              sidebar: '#161e2e',
              surface: '#ffffff',
              canvas: '#f4f6f8',
              border: '#e2e8f0'
            }
          },
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          }
        }
      }
    }
  </script>

  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>

  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <!-- Custom Zoho ERP Corporate Styles -->
  <link rel="stylesheet" href="css/styles.css">
</head>
<body class="bg-[#f4f6f8] text-slate-800 antialiased font-sans flex h-screen overflow-hidden selection:bg-sky-500 selection:text-white">

  <!-- =========================================================================
       1. ZOHO ACCOUNTS STYLE LOGIN GATEWAY (UNAUTHENTICATED)
       ========================================================================= -->
  <div id="loginOverlay" class="fixed inset-0 z-50 bg-[#0f172a]/80 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xl relative my-auto">
      
      <!-- Brand Header -->
      <div class="text-center space-y-2">
        <div class="w-16 h-16 mx-auto rounded-xl bg-white p-2 shadow-sm border border-slate-200 overflow-hidden flex items-center justify-center">
          <img src="assets/logo.webp" alt="Dharshithan Waterproofing Logo" class="w-full h-full object-contain">
        </div>
        <div>
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">Dharshithan ERP</h2>
          <p class="text-xs text-slate-500 font-medium">Enterprise Financial & Billing Portal</p>
        </div>
      </div>

      <!-- Login Form -->
      <form id="loginForm" onsubmit="app.handleLogin(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">User ID / Username</label>
          <div class="relative">
            <i data-lucide="user" class="w-4 h-4 text-slate-400 absolute left-3 top-3"></i>
            <input type="text" id="loginUserId" required autocomplete="username" placeholder="e.g. admin" class="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 transition">
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-semibold text-slate-700">Password</label>
            <button type="button" onclick="app.openForgotPasswordModal()" class="text-[11px] text-sky-600 hover:text-sky-700 font-semibold underline">Forgot Password?</button>
          </div>
          <div class="relative">
            <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3 top-3"></i>
            <input type="password" id="loginPassword" required autocomplete="current-password" placeholder="••••••••" class="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 transition">
            <button type="button" onclick="app.toggleLoginPasswordVisibility()" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5">
              <i data-lucide="eye" id="loginPassEyeIcon" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <button type="submit" id="loginSubmitBtn" class="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer">
          <i data-lucide="log-in" class="w-4 h-4"></i>
          <span>Sign In to ERP</span>
        </button>
      </form>

      <!-- Enterprise Security Assurance Badge -->
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3 text-slate-600 text-xs">
        <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-700">
          <i data-lucide="shield-check" class="w-5 h-5"></i>
        </div>
        <div>
          <span class="font-bold text-slate-800 text-[11px] block">256-Bit SSL Encrypted Enterprise Portal</span>
          <p class="text-[10px] text-slate-500">GSTIN: 33CEQPP3071Q1ZR • Protected under Financial Data Privacy.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- FIRST-TIME LOGIN PASSWORD CHANGE MODAL -->
  <div id="firstLoginModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden">
    <div class="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
      <div class="flex items-center space-x-3 text-amber-600">
        <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <i data-lucide="shield-alert" class="w-5 h-5 text-amber-700"></i>
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-900">Change Temporary Password</h3>
          <p class="text-xs text-slate-500">First-time login security requirement</p>
        </div>
      </div>

      <div class="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
        <p>Hello <strong id="firstLoginTargetName">User</strong>! Your account was initialized with a temporary password. You must set a new secure personal password to activate your account.</p>
      </div>

      <form id="firstLoginForm" onsubmit="app.handleFirstLoginPasswordChange(event)" class="space-y-3 text-xs">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Current / Temporary Password</label>
          <input type="password" id="firstLoginCurrentPass" required class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">New Secure Password (min 6 characters)</label>
          <input type="password" id="firstLoginNewPass" minlength="6" required class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Confirm New Password</label>
          <input type="password" id="firstLoginConfirmPass" minlength="6" required class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500">
        </div>

        <button type="submit" class="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2">
          <i data-lucide="check" class="w-4 h-4"></i>
          <span>Save Password & Access ERP</span>
        </button>
      </form>
    </div>
  </div>

  <!-- FORGOT PASSWORD MODAL (OTP FLOW) -->
  <div id="forgotPasswordModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden">
    <div class="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
            <i data-lucide="key" class="w-4 h-4"></i>
          </div>
          <h3 class="text-base font-bold text-slate-900">Reset Account Password</h3>
        </div>
        <button onclick="app.closeForgotPasswordModal()" class="text-slate-400 hover:text-slate-600 p-1">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Step 1: Request OTP -->
      <div id="forgotStep1" class="space-y-3.5 text-xs">
        <p class="text-slate-500">Enter your registered User ID or Email to receive an OTP code.</p>
        <div>
          <label class="block font-medium text-slate-700 mb-1">User ID or Email</label>
          <input type="text" id="forgotTargetId" placeholder="e.g. admin or employee@dharshithan.com" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500">
        </div>
        <div class="flex space-x-2 pt-1">
          <button onclick="app.handleRequestOTP()" id="forgotRequestBtn" class="flex-1 py-2 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center space-x-1.5">
            <i data-lucide="send" class="w-4 h-4"></i>
            <span>Send OTP</span>
          </button>
          <button onclick="app.closeForgotPasswordModal()" class="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">
            Cancel
          </button>
        </div>
      </div>

      <!-- Step 2: Verify OTP & Enter New Password -->
      <div id="forgotStep2" class="space-y-3.5 text-xs hidden">
        <div class="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
          <span class="font-bold text-emerald-900 flex items-center space-x-1">
            <i data-lucide="mail-check" class="w-4 h-4 text-emerald-600"></i>
            <span>Verification OTP Dispatched!</span>
          </span>
          <p class="text-[11px] text-emerald-800">OTP code sent to: <strong id="forgotDispatchedEmail"></strong></p>
          <div class="flex items-center justify-between pt-1 font-mono text-[11px]">
            <span>Test OTP: <strong id="forgotTestingOTP" class="text-emerald-950 font-bold bg-white px-2 py-0.5 rounded border border-emerald-300"></strong></span>
            <button onclick="app.autofillOTP()" class="text-[10px] text-emerald-700 underline font-semibold">Autofill OTP</button>
          </div>
        </div>

        <div>
          <label class="block font-medium text-slate-700 mb-1">Enter 6-Digit OTP Code</label>
          <input type="text" id="forgotOTPCode" maxlength="6" placeholder="123456" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-center text-lg font-mono tracking-widest text-slate-900 focus:outline-none focus:border-sky-500">
        </div>

        <div>
          <label class="block font-medium text-slate-700 mb-1">Set New Password</label>
          <input type="password" id="forgotNewPass" minlength="6" placeholder="At least 6 characters" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-sky-500">
        </div>

        <div class="flex space-x-2 pt-1">
          <button onclick="app.handleVerifyOTPAndReset()" class="flex-1 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center space-x-1.5">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>Verify & Update Password</span>
          </button>
          <button onclick="app.closeForgotPasswordModal()" class="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>


  <!-- =========================================================================
       2. ZOHO ERP MAIN APPLICATION CONTAINER (AUTHENTICATED)
       ========================================================================= -->
  <div id="erpAppWrapper" class="flex w-full h-full overflow-hidden relative">

    <!-- Mobile Sidebar Backdrop -->
    <div id="sidebarBackdrop" onclick="app.closeSidebar()" class="fixed inset-0 bg-slate-900/50 z-40 lg:hidden hidden transition-opacity"></div>

    <!-- =========================================================================
         LEFT SIDEBAR NAVIGATION (AUTHENTIC ZOHO ERP STANDARD)
         ========================================================================= -->
    <aside id="erpSidebar" class="w-64 bg-[#161e2e] text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 fixed lg:static inset-y-0 left-0 z-50 transform -translate-x-full lg:translate-x-0 transition-transform duration-200">
      
      <!-- Brand & Organization Context -->
      <div class="p-4 border-b border-slate-800 flex items-center space-x-3">
        <div class="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
          <img src="assets/logo.webp" alt="Dharshithan Logo" class="w-full h-full object-contain">
        </div>
        <div class="min-w-0 flex-1">
          <h1 class="text-sm font-bold text-white tracking-tight truncate leading-tight">Dharshithan ERP</h1>
          <p class="text-[10px] text-slate-400 truncate">Finance & Accounts Engine</p>
        </div>
        <button onclick="app.closeSidebar()" class="text-slate-400 hover:text-white lg:hidden p-1">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Organization Context Pill -->
      <div class="px-3 py-2.5 border-b border-slate-800/80 bg-slate-900/50">
        <button onclick="app.openOrgDetailsModal()" class="w-full text-left group">
          <div class="text-[11px] font-semibold text-slate-200 group-hover:text-sky-400 transition truncate flex items-center justify-between">
            <span>Dharshithan Waterproofing</span>
            <i data-lucide="info" class="w-3 h-3 text-slate-500 group-hover:text-sky-400"></i>
          </div>
          <div class="text-[9px] text-slate-400 flex items-center space-x-1 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span class="truncate">Chennai HQ • GSTIN: 33CEQPP3071Q1ZR</span>
          </div>
        </button>
      </div>

      <!-- Navigation Modules (Zoho Books Anatomy) -->
      <nav class="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
        <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 py-1">Core Modules</div>
        
        <button onclick="app.setActiveTab('dashboard')" id="side-tab-dashboard" class="erp-sidebar-item w-full active">
          <i data-lucide="layout-dashboard" class="w-4 h-4 text-sky-400"></i>
          <span>Dashboard</span>
        </button>

        <button onclick="app.setActiveTab('transactions')" id="side-tab-transactions" class="erp-sidebar-item w-full">
          <i data-lucide="receipt" class="w-4 h-4 text-slate-400"></i>
          <span>General Ledger</span>
        </button>

        <button onclick="app.setActiveTab('sales')" id="side-tab-sales" class="erp-sidebar-item w-full">
          <i data-lucide="badge-dollar-sign" class="w-4 h-4 text-emerald-400"></i>
          <span>Sales & Invoices</span>
        </button>

        <button onclick="app.setActiveTab('expenses')" id="side-tab-expenses" class="erp-sidebar-item w-full">
          <i data-lucide="shopping-cart" class="w-4 h-4 text-rose-400"></i>
          <span>Purchases & Expenses</span>
        </button>

        <button onclick="app.setActiveTab('banking')" id="side-tab-banking" class="erp-sidebar-item w-full">
          <i data-lucide="landmark" class="w-4 h-4 text-amber-400"></i>
          <span>Banking & Cash</span>
        </button>

        <button onclick="app.setActiveTab('parties')" id="side-tab-parties" class="erp-sidebar-item w-full">
          <i data-lucide="users" class="w-4 h-4 text-indigo-400"></i>
          <span>Parties & Contacts</span>
        </button>

        <button onclick="app.setActiveTab('reports')" id="side-tab-reports" class="erp-sidebar-item w-full">
          <i data-lucide="pie-chart" class="w-4 h-4 text-teal-400"></i>
          <span>P&L Reports</span>
        </button>

        <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 pt-3 pb-1">Governance</div>

        <!-- User Management (Visible to Super Admin, Developer, Admin, Owner) -->
        <button onclick="app.openUserManagementModal()" id="side-tab-users" class="erp-sidebar-item w-full">
          <i data-lucide="user-cog" class="w-4 h-4 text-purple-400"></i>
          <span>Staff Directory</span>
        </button>

        <!-- Database Console (Strictly Super Admin Only) -->
        <button onclick="app.openDatabaseHubModal()" id="side-tab-database" class="erp-sidebar-item w-full hidden">
          <i data-lucide="database" class="w-4 h-4 text-sky-400"></i>
          <span>Database Console</span>
        </button>
      </nav>

      <!-- Sidebar Footer User Card -->
      <div class="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <button onclick="app.openUserProfileModal()" class="flex items-center space-x-2.5 text-left min-w-0 flex-1 hover:opacity-80 transition cursor-pointer">
          <div id="sideProfileAvatar" class="w-8 h-8 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
            SA
          </div>
          <div class="min-w-0 flex-1">
            <div id="sideProfileName" class="text-xs font-semibold text-white truncate leading-tight">Super Administrator</div>
            <div id="sideProfileRole" class="text-[10px] text-slate-400 truncate">Super Admin</div>
          </div>
        </button>
        <button onclick="app.handleLogout()" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition" title="Sign Out">
          <i data-lucide="log-out" class="w-4 h-4"></i>
        </button>
      </div>
    </aside>


    <!-- =========================================================================
         RIGHT MAIN WORKSPACE
         ========================================================================= -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#f4f6f8]">
      
      <!-- TOP EXECUTIVE APPLICATION BAR (ZOHO BOOKS STYLE) -->
      <header id="erpTopBar" class="h-14 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between flex-shrink-0 z-20 shadow-xs">
        
        <!-- Left: Hamburger & Breadcrumb -->
        <div class="flex items-center space-x-3">
          <button onclick="app.toggleSidebar()" class="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer">
            <i data-lucide="menu" class="w-5 h-5"></i>
          </button>
          <div class="flex items-center space-x-1.5 text-xs">
            <span class="text-slate-400 font-medium">Finance</span>
            <span class="text-slate-300">/</span>
            <span id="topBarBreadcrumb" class="font-bold text-slate-800">Executive Dashboard</span>
          </div>
        </div>

        <!-- Center: Global Search Bar -->
        <div class="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div class="relative w-full">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
            <input type="text" id="globalSearchInput" oninput="app.handleGlobalSearch(this.value)" placeholder="Search clients, bills, vouchers... (Ctrl+K)" class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 transition">
          </div>
        </div>

        <!-- Right: Period Filter, Quick Create Dropdown & Profile -->
        <div class="flex items-center space-x-2 sm:space-x-2.5">
          
          <!-- Period Selector -->
          <div class="hidden sm:flex items-center space-x-1 text-xs">
            <select id="filterFY" onchange="app.handleFilterChange()" class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none">
              <option value="ALL">All FY</option>
              <option value="F.Y. 2026-27" selected>F.Y. 2026-27</option>
              <option value="F.Y. 2025-26">F.Y. 2025-26</option>
            </select>
            <select id="filterQuarter" onchange="app.handleFilterChange()" class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none">
              <option value="ALL">All Quarters</option>
              <option value="Q1">Q1 (Apr-Jun)</option>
              <option value="Q2">Q2 (Jul-Sep)</option>
              <option value="Q3">Q3 (Oct-Dec)</option>
              <option value="Q4">Q4 (Jan-Mar)</option>
            </select>
          </div>

          <!-- Quick Create '+ New' Dropdown (Zoho Books Standard) -->
          <div class="relative">
            <button onclick="app.toggleQuickCreateMenu()" id="quickCreateBtn" class="flex px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs items-center space-x-1.5 transition cursor-pointer" title="Quick Create New Document">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span class="hidden sm:inline">New</span>
              <i data-lucide="chevron-down" class="w-3 h-3 text-sky-200"></i>
            </button>
            <button onclick="app.openTransactionModal()" id="headerAddTxnBtn" class="hidden">Record</button>
            
            <!-- Quick Create Menu -->
            <div id="quickCreateMenu" class="absolute right-0 mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 text-xs hidden animate-fade-in">
              <div class="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sales (Receivables)</div>
              <button onclick="app.openTransactionModal(null, 'Received / Income'); app.closeQuickCreateMenu();" class="w-full text-left px-3.5 py-2 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 flex items-center space-x-2 font-medium cursor-pointer">
                <i data-lucide="receipt" class="w-4 h-4 text-emerald-600"></i>
                <span>Tax Invoice / Receipt</span>
              </button>
              <div class="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 mt-1">Purchases (Payables)</div>
              <button onclick="app.openTransactionModal(null, 'Paid / Expense'); app.closeQuickCreateMenu();" class="w-full text-left px-3.5 py-2 hover:bg-rose-50 hover:text-rose-700 text-slate-700 flex items-center space-x-2 font-medium cursor-pointer">
                <i data-lucide="shopping-cart" class="w-4 h-4 text-rose-600"></i>
                <span>Expense Voucher / Bill</span>
              </button>
              <div class="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 mt-1">Cash & Banking</div>
              <button onclick="app.openFloatModal(); app.closeQuickCreateMenu();" class="w-full text-left px-3.5 py-2 hover:bg-amber-50 hover:text-amber-700 text-slate-700 flex items-center space-x-2 font-medium cursor-pointer">
                <i data-lucide="sliders" class="w-4 h-4 text-amber-600"></i>
                <span>Adjust Cash / Bank Float</span>
              </button>
            </div>
          </div>

          <!-- Super Admin Neon Sync Button (Strictly Super Admin Only) -->
          <button onclick="app.refreshFromNeon()" id="headerSyncBtn" class="hidden px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold items-center space-x-1 transition cursor-pointer" title="Synchronize with Neon DB">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5" id="headerSyncIcon"></i>
            <span class="hidden md:inline">Sync DB</span>
          </button>

          <!-- User Profile & Powers Pill (Zoho Books Style) -->
          <button onclick="app.openUserProfileModal()" id="userProfileBtn" class="flex items-center space-x-2 p-1 md:px-2 md:py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition shadow-2xs cursor-pointer group" title="User Profile & Rights to Use">
            <div id="headerProfileAvatar" class="w-7 h-7 rounded-md bg-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">SA</div>
            <div class="text-left hidden sm:block leading-none">
              <div id="headerProfileName" class="text-xs font-bold text-slate-800 truncate max-w-[110px]">Super Admin</div>
              <div id="headerProfileBadge" class="text-[9px] font-semibold text-purple-700 mt-0.5">Super Admin</div>
            </div>
            <i data-lucide="chevron-down" class="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition"></i>
          </button>
        </div>
      </header>

      <!-- SUPER ADMIN NEON DB STATUS BAR (STRICTLY HIDDEN FOR NON-SUPER-ADMINS) -->
      <div id="neonStatusBar" class="hidden bg-sky-50 border-b border-sky-200 px-4 py-1.5 items-center justify-between text-xs text-sky-950 flex-shrink-0">
        <div class="flex items-center space-x-2">
          <span class="flex h-2 w-2 relative">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span class="font-bold text-sky-950">Neon Cloud PostgreSQL Active</span>
          <span class="text-sky-700 text-[11px] hidden md:inline">• 100% Native Serverless Engine (Zero Google Sheets Dependency)</span>
        </div>
        <div class="flex items-center space-x-3 text-[11px]">
          <span id="lastSyncBannerText" class="text-sky-800 font-mono">Neon DB Live Connected</span>
          <button onclick="app.refreshFromNeon()" class="font-bold text-sky-800 hover:text-sky-950 underline flex items-center space-x-1 cursor-pointer">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            <span>Refresh Now</span>
          </button>
        </div>
      </div>

      <!-- =========================================================================
           SCROLLABLE WORKSPACE AREA
           ========================================================================= -->
      <main id="erpMainScroll" class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 flex flex-col justify-between">
        
        <div class="space-y-6">

          <!-- =========================================================================
               VIEW 1: EXECUTIVE FINANCIAL DASHBOARD
               ========================================================================= -->
          <div id="view-dashboard" class="space-y-5">
            <!-- 4 Top KPI Cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div class="erp-card p-4 bg-white">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Gross Inflow (Revenue)</span>
                <p id="kpi-total-revenue" class="font-mono text-lg sm:text-2xl font-bold text-emerald-600">₹ 0.00</p>
                <span class="text-[10px] text-slate-400 mt-1 block">Total client receipts in period</span>
              </div>
              <div class="erp-card p-4 bg-white">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Gross Outflow (Expenses)</span>
                <p id="kpi-total-expenses" class="font-mono text-lg sm:text-2xl font-bold text-rose-600">₹ 0.00</p>
                <span class="text-[10px] text-slate-400 mt-1 block">Material, labor & overhead payouts</span>
              </div>
              <div class="erp-card p-4 bg-white">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Net Operating Balance</span>
                <p id="kpi-net-profit" class="font-mono text-lg sm:text-2xl font-bold text-slate-900">₹ 0.00</p>
                <span class="text-[10px] text-slate-400 mt-1 block">Inflows minus total outflows</span>
              </div>
              <div class="erp-card p-4 bg-white">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Operating Liquidity</span>
                <p id="kpi-total-liquidity" class="font-mono text-lg sm:text-2xl font-bold text-sky-600">₹ 0.00</p>
                <span class="text-[10px] text-slate-400 mt-1 block">Bank Accounts + Petty Cash Float</span>
              </div>
            </div>

            <!-- Cash Flow Chart & Liquidity Panel -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div class="erp-card p-5 lg:col-span-2 space-y-3">
                <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 class="text-sm font-bold text-slate-900">Cash Flow Dynamics (Inflow vs Outflow)</h3>
                  <span class="text-xs text-slate-400 font-medium">Fiscal Year Comparison</span>
                </div>
                <div class="h-64 relative">
                  <canvas id="cashflowChart"></canvas>
                </div>
              </div>

              <div class="erp-card p-5 space-y-4">
                <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 class="text-sm font-bold text-slate-900">Liquidity Distribution</h3>
                  <button onclick="app.openFloatModal()" class="text-xs text-sky-600 hover:text-sky-700 font-semibold underline cursor-pointer">Adjust Float</button>
                </div>
                <div class="space-y-3">
                  <div class="p-3 rounded-lg bg-sky-50 border border-sky-100">
                    <span class="text-[11px] font-semibold text-sky-900 block">Bank Accounts Reserve</span>
                    <span id="cardBankBalance" class="text-base font-bold font-mono text-sky-700">₹ 0.00</span>
                    <span class="text-[10px] text-slate-500 block mt-0.5">NEFT, RTGS, UPI & Cheques</span>
                  </div>
                  <div class="p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <span class="text-[11px] font-semibold text-amber-900 block">Petty Cash In Hand</span>
                    <span id="cardCashBalance" class="text-base font-bold font-mono text-amber-700">₹ 0.00</span>
                    <span class="text-[10px] text-slate-500 block mt-0.5">Physical On-Site Cash Float</span>
                  </div>
                  <div class="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span class="text-[11px] font-semibold text-emerald-900 block">Net Liquid Capital</span>
                    <span id="cardTotalLiquidity" class="text-base font-bold font-mono text-emerald-700">₹ 0.00</span>
                    <span class="text-[10px] text-slate-500 block mt-0.5">Total Liquid Reserves Available</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Activity Table on Dashboard -->
            <div class="erp-card overflow-hidden">
              <div class="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-bold text-slate-900">Recent Financial Transactions</h3>
                  <p class="text-xs text-slate-500">Live entries recorded in Neon PostgreSQL</p>
                </div>
                <button onclick="app.setActiveTab('transactions')" class="text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer">View Full Ledger →</button>
              </div>
              <div class="overflow-x-auto">
                <table class="erp-table">
                  <thead>
                    <tr>
                      <th>Sl #</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Party Name</th>
                      <th>Category</th>
                      <th>Mode</th>
                      <th>Ref #</th>
                      <th class="text-right">Amount</th>
                      <th class="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody id="dashboardRecentTableBody">
                    <!-- Populated dynamically -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>


          <!-- =========================================================================
               VIEW 2: GENERAL LEDGER (MASTER ACCOUNTING JOURNAL)
               ========================================================================= -->
          <div id="view-transactions" class="space-y-4 hidden">
            <!-- Table Toolbar -->
            <div class="erp-card p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center space-x-2 flex-1 min-w-[200px]">
                <div class="relative w-full max-w-xs">
                  <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
                  <input type="text" id="txnSearch" oninput="app.handleFilterChange()" placeholder="Search transactions..." class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500">
                </div>
                <select id="txnTypeFilter" onchange="app.handleFilterChange()" class="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none">
                  <option value="ALL">All Types</option>
                  <option value="Received / Income">Income Only</option>
                  <option value="Paid / Expense">Expenses Only</option>
                </select>
                <select id="txnModeFilter" onchange="app.handleFilterChange()" class="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none">
                  <option value="ALL">All Modes</option>
                  <option value="CASH">Cash</option>
                  <option value="NETBANKING">Netbanking</option>
                  <option value="UPI">UPI</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div class="flex items-center space-x-2">
                <button onclick="app.exportCSV()" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 shadow-2xs cursor-pointer">
                  <i data-lucide="download" class="w-3.5 h-3.5 text-slate-500"></i>
                  <span>Export CSV</span>
                </button>
                <button onclick="app.openTransactionModal()" class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  <span>New Entry</span>
                </button>
              </div>
            </div>

            <!-- Sticky Bulk Actions Bar (Appears when checkboxes are selected) -->
            <div id="bulkActionBar" class="p-2.5 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs hidden animate-fade-in shadow-lg">
              <div class="flex items-center space-x-3">
                <span class="w-2 h-2 rounded-full bg-sky-400"></span>
                <span id="bulkSelectedCount" class="font-bold">0 transactions selected</span>
              </div>
              <div class="flex items-center space-x-2">
                <button onclick="app.bulkExportCSV()" class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer">
                  Export Selected
                </button>
                <button onclick="app.bulkDeleteSelected()" id="bulkDeleteBtn" class="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer">
                  Delete Selected
                </button>
                <button onclick="app.clearRowSelection()" class="px-2 py-1 text-slate-400 hover:text-white text-xs cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>

            <!-- Master Ledger Table with Column Sorting & Checkboxes -->
            <div class="erp-card overflow-hidden">
              <div class="overflow-x-auto">
                <table class="erp-table">
                  <thead>
                    <tr>
                      <th class="w-10 text-center">
                        <input type="checkbox" id="selectAllTxns" onchange="app.toggleSelectAll(this.checked)" class="rounded text-sky-600 focus:ring-sky-500 cursor-pointer">
                      </th>
                      <th onclick="app.sortByColumn('slNo')" class="cursor-pointer hover:bg-slate-100 transition">
                        <div class="flex items-center space-x-1">
                          <span>Sl #</span>
                          <span id="sort-icon-slNo" class="text-slate-400">⇅</span>
                        </div>
                      </th>
                      <th onclick="app.sortByColumn('date')" class="cursor-pointer hover:bg-slate-100 transition">
                        <div class="flex items-center space-x-1">
                          <span>Date</span>
                          <span id="sort-icon-date" class="text-slate-400">⇅</span>
                        </div>
                      </th>
                      <th>Type</th>
                      <th onclick="app.sortByColumn('partyName')" class="cursor-pointer hover:bg-slate-100 transition">
                        <div class="flex items-center space-x-1">
                          <span>Party Name</span>
                          <span id="sort-icon-partyName" class="text-slate-400">⇅</span>
                        </div>
                      </th>
                      <th>Category</th>
                      <th>Mode</th>
                      <th>Ref Number</th>
                      <th onclick="app.sortByColumn('amount')" class="text-right cursor-pointer hover:bg-slate-100 transition">
                        <div class="flex items-center justify-end space-x-1">
                          <span>Debit / Credit</span>
                          <span id="sort-icon-amount" class="text-slate-400">⇅</span>
                        </div>
                      </th>
                      <th class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="txnTableBody">
                    <!-- Populated dynamically via renderTransactionsTable -->
                  </tbody>
                </table>
              </div>
              <div id="txnEmptyState" class="p-8 text-center hidden">
                <p class="text-sm font-semibold text-slate-600">No Transactions Found</p>
                <p class="text-xs text-slate-400 mt-1">Click "New Entry" to post a new invoice or expense entry to Neon DB.</p>
              </div>

              <!-- Table Footer & Pagination Bar -->
              <div class="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 font-medium gap-3">
                <div class="flex items-center space-x-3">
                  <div>Showing <span id="txnFilteredCount" class="font-bold text-slate-900 font-mono">0</span> transactions</div>
                  <div class="flex items-center space-x-1">
                    <span class="text-slate-400">Per page:</span>
                    <select id="pageSizeSelect" onchange="app.setPageSize(this.value)" class="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700">
                      <option value="15" selected>15</option>
                      <option value="30">30</option>
                      <option value="50">50</option>
                      <option value="ALL">All</option>
                    </select>
                  </div>
                </div>

                <div class="flex items-center space-x-4 font-mono">
                  <span>Inflows: <strong id="txnFooterInflow" class="text-emerald-700">₹ 0.00</strong></span>
                  <span>Outflows: <strong id="txnFooterOutflow" class="text-rose-700">₹ 0.00</strong></span>
                  <span>Net: <strong id="txnFooterNet" class="text-slate-900 font-bold">₹ 0.00</strong></span>
                </div>

                <!-- Pagination Buttons -->
                <div id="paginationControls" class="flex items-center space-x-1 text-xs">
                  <button onclick="app.prevPage()" id="btnPrevPage" class="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer">Previous</button>
                  <span id="pageIndicator" class="px-2 text-slate-600 font-medium font-mono">Page 1 of 1</span>
                  <button onclick="app.nextPage()" id="btnNextPage" class="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer">Next</button>
                </div>
              </div>
            </div>
          </div>


          <!-- =========================================================================
               VIEW 3: SALES & CUSTOMER INVOICES
               ========================================================================= -->
          <div id="view-sales" class="space-y-4 hidden">
            <!-- Sales Header & KPI Cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div class="erp-card p-4">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Total Sales Revenue</span>
                <p id="salesTotalRevenue" class="font-mono text-lg sm:text-2xl font-bold text-emerald-600">₹ 0.00</p>
                <span class="text-[10px] text-slate-400 mt-1 block">Gross contract inflows</span>
              </div>
              <div class="erp-card p-4">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Receipts Issued</span>
                <p id="salesTotalReceiptsCount" class="font-mono text-lg sm:text-2xl font-bold text-slate-800">0</p>
                <span class="text-[10px] text-slate-400 mt-1 block">Invoiced transaction entries</span>
              </div>
              <div class="erp-card p-4">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Peak Contract Value</span>
                <p id="salesHighestReceipt" class="font-mono text-lg sm:text-2xl font-bold text-sky-600">₹ 0.00</p>
                <span class="text-[10px] text-slate-400 mt-1 block">Highest single invoice</span>
              </div>
              <div class="erp-card p-4">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Active Client Accounts</span>
                <p id="salesActiveClientsCount" class="font-mono text-lg sm:text-2xl font-bold text-purple-600">0</p>
                <span class="text-[10px] text-slate-400 mt-1 block">Unique paying parties</span>
              </div>
            </div>

            <!-- Sales Toolbar -->
            <div class="erp-card p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div class="relative flex-1 min-w-[200px]">
                <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
                <input type="text" id="salesSearchInput" oninput="app.filterSalesTable()" placeholder="Search clients, invoice #, or description..." class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500">
              </div>
              <div class="flex items-center space-x-2 text-xs">
                <select id="salesModeFilter" onchange="app.filterSalesTable()" class="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none">
                  <option value="ALL">All Payment Modes</option>
                  <option value="NETBANKING">Netbanking</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
                <button onclick="app.openTransactionModal(null, 'Received / Income')" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  <span>Record Client Payment</span>
                </button>
              </div>
            </div>

            <!-- Sales Table -->
            <div class="erp-card overflow-hidden">
              <div class="overflow-x-auto">
                <table class="erp-table">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Date</th>
                      <th>Client / Customer Name</th>
                      <th>Category</th>
                      <th>Mode</th>
                      <th>Reference / Bill #</th>
                      <th class="text-right">Received Amount</th>
                      <th class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="salesTableBody">
                    <!-- Populated dynamically via renderSalesView -->
                  </tbody>
                </table>
              </div>
              <div id="salesEmptyState" class="p-8 text-center hidden">
                <p class="text-sm font-semibold text-slate-600">No Sales or Client Receipts Recorded</p>
                <p class="text-xs text-slate-400 mt-1">Click "Record Client Payment" to add invoice revenue to Neon DB.</p>
              </div>
            </div>
          </div>


          <!-- =========================================================================
               VIEW 4: PURCHASES & OPERATING EXPENSES
               ========================================================================= -->
          <div id="view-expenses" class="space-y-4 hidden">
            <!-- Expense Header & KPI Cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div class="erp-card p-4">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Total Operating Expenses</span>
                <p id="expenseTotalAmount" class="font-mono text-lg sm:text-2xl font-bold text-rose-600">₹ 0.00</p>
                <span class="text-[10px] text-slate-400 mt-1 block">All material & labor disbursements</span>
              </div>
              <div class="erp-card p-4">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Vouchers Disbursed</span>
                <p id="expenseTotalVouchersCount" class="font-mono text-lg sm:text-2xl font-bold text-slate-800">0</p>
                <span class="text-[10px] text-slate-400 mt-1 block">Expense vouchers paid</span>
              </div>
              <div class="erp-card p-4">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Top Cost Category</span>
                <p id="expenseTopCategory" class="text-sm sm:text-base font-bold text-amber-700 truncate">None</p>
                <span class="text-[10px] text-slate-400 mt-1 block">Largest expenditure source</span>
              </div>
              <div class="erp-card p-4">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Average Voucher Size</span>
                <p id="expenseAverageSize" class="font-mono text-lg sm:text-2xl font-bold text-slate-700">₹ 0.00</p>
                <span class="text-[10px] text-slate-400 mt-1 block">Average per payment</span>
              </div>
            </div>

            <!-- Expense Toolbar -->
            <div class="erp-card p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div class="relative flex-1 min-w-[200px]">
                <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
                <input type="text" id="expenseSearchInput" oninput="app.filterExpensesTable()" placeholder="Search vendors, category, or voucher #..." class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500">
              </div>
              <div class="flex items-center space-x-2 text-xs">
                <select id="expenseCategoryFilter" onchange="app.filterExpensesTable()" class="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none">
                  <option value="ALL">All Categories</option>
                  <option value="Chemical Material">Chemical Material</option>
                  <option value="Labour Wages">Labour Wages</option>
                  <option value="Equipment & Tools">Equipment & Tools</option>
                  <option value="Site Overhead">Site Overhead</option>
                  <option value="Subcontractor">Subcontractor</option>
                </select>
                <button onclick="app.openTransactionModal(null, 'Paid / Expense')" class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  <span>Record Expense Voucher</span>
                </button>
              </div>
            </div>

            <!-- Expense Table -->
            <div class="erp-card overflow-hidden">
              <div class="overflow-x-auto">
                <table class="erp-table">
                  <thead>
                    <tr>
                      <th>Voucher #</th>
                      <th>Date</th>
                      <th>Vendor / Payee Name</th>
                      <th>Category</th>
                      <th>Mode</th>
                      <th>Reference / Voucher #</th>
                      <th class="text-right">Disbursed Amount</th>
                      <th class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="expenseTableBody">
                    <!-- Populated dynamically via renderExpensesView -->
                  </tbody>
                </table>
              </div>
              <div id="expenseEmptyState" class="p-8 text-center hidden">
                <p class="text-sm font-semibold text-slate-600">No Expenses or Disbursals Recorded</p>
                <p class="text-xs text-slate-400 mt-1">Click "Record Expense Voucher" to post operational expenses to Neon DB.</p>
              </div>
            </div>
          </div>


          <!-- =========================================================================
               VIEW 5: BANKING & CASH FLOAT RECONCILIATION
               ========================================================================= -->
          <div id="view-banking" class="space-y-4 hidden">
            <!-- Liquidity Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div class="erp-card p-5 bg-gradient-to-br from-sky-50 to-white border-sky-100">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold text-sky-900 uppercase tracking-wider">Total Bank Reserves</span>
                  <i data-lucide="landmark" class="w-4 h-4 text-sky-700"></i>
                </div>
                <p id="bankFloatAmount" class="font-mono text-xl sm:text-2xl font-bold text-sky-700">₹ 0.00</p>
                <p class="text-[10px] text-slate-500 mt-1">Netbanking, UPI, Card & Cheques</p>
              </div>

              <div class="erp-card p-5 bg-gradient-to-br from-amber-50 to-white border-amber-100">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold text-amber-900 uppercase tracking-wider">Petty Cash In Hand</span>
                  <i data-lucide="wallet" class="w-4 h-4 text-amber-700"></i>
                </div>
                <p id="cashFloatAmount" class="font-mono text-xl sm:text-2xl font-bold text-amber-700">₹ 0.00</p>
                <p class="text-[10px] text-slate-500 mt-1">Physical On-Site Floating Cash</p>
              </div>

              <div class="erp-card p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold text-emerald-900 uppercase tracking-wider">Net Operating Liquidity</span>
                  <i data-lucide="badge-percent" class="w-4 h-4 text-emerald-700"></i>
                </div>
                <p id="totalLiquidityAmount" class="font-mono text-xl sm:text-2xl font-bold text-emerald-700">₹ 0.00</p>
                <p class="text-[10px] text-slate-500 mt-1">Total Liquid Financial Reserves</p>
              </div>
            </div>

            <!-- Payment Channels Breakdown -->
            <div class="erp-card p-5 space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-bold text-slate-900">Capital Flow by Payment Channels</h3>
                  <p class="text-xs text-slate-500">Net banking and cash distribution</p>
                </div>
                <button onclick="app.openFloatModal()" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer">
                  Adjust Opening Reserves
                </button>
              </div>
              <div id="bankingChannelGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <!-- Populated via renderBankingView -->
              </div>
            </div>
          </div>


          <!-- =========================================================================
               VIEW 6: PARTIES & CONTACTS DIRECTORY
               ========================================================================= -->
          <div id="view-parties" class="space-y-4 hidden">
            <!-- Toolbar & Segmentation Tabs -->
            <div class="erp-card p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-bold text-slate-900">Clients & Vendors Master Directory</h2>
                <p class="text-xs text-slate-500">Party ledgers, running balances and statement reports</p>
              </div>
              <div class="flex items-center space-x-2">
                <div class="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
                  <button onclick="app.filterPartySegment('ALL')" id="party-seg-all" class="px-2.5 py-1 rounded-md bg-white shadow-xs text-slate-900">All Contacts</button>
                  <button onclick="app.filterPartySegment('CUSTOMER')" id="party-seg-customer" class="px-2.5 py-1 rounded-md hover:text-slate-900">Customers</button>
                  <button onclick="app.filterPartySegment('VENDOR')" id="party-seg-vendor" class="px-2.5 py-1 rounded-md hover:text-slate-900">Vendors</button>
                </div>
              </div>
            </div>

            <!-- Parties Grid -->
            <div id="parties-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"></div>
          </div>


          <!-- =========================================================================
               VIEW 7: PROFIT & LOSS & GST TAX REPORTS
               ========================================================================= -->
          <div id="view-reports" class="space-y-4 hidden">
            <!-- Reports Header -->
            <div class="erp-card p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-bold text-slate-900">Executive Financial & Tax Audit Reports</h2>
                <p class="text-xs text-slate-500">Profit & Loss summary, monthly cash dynamics and GST tax liability</p>
              </div>
              <div class="flex items-center space-x-2">
                <button onclick="app.exportComprehensiveReportCSV()" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 shadow-2xs cursor-pointer">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Export Report (CSV)</span>
                </button>
                <button onclick="window.print()" class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer">
                  <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                  <span>Print Statement</span>
                </button>
              </div>
            </div>

            <!-- GST Tax Summary Card -->
            <div class="erp-card p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white space-y-3">
              <div class="flex items-center justify-between border-b border-slate-700 pb-2.5">
                <div>
                  <h3 class="text-sm font-bold text-white flex items-center space-x-2">
                    <i data-lucide="calculator" class="w-4 h-4 text-sky-400"></i>
                    <span>GST Tax Position Summary (SAC 9954)</span>
                  </h3>
                  <p class="text-[11px] text-slate-300">Waterproofing & Construction Specialized Services (18% GST)</p>
                </div>
                <span class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-mono font-bold">GSTIN: 33CEQPP3071Q1ZR</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span class="text-slate-400 block text-[10px] uppercase font-semibold">Taxable Sales Turnover</span>
                  <span id="gstTaxableTurnover" class="font-mono text-base font-bold text-emerald-400">₹ 0.00</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px] uppercase font-semibold">Output GST Collected (18%)</span>
                  <span id="gstOutputTax" class="font-mono text-base font-bold text-sky-400">₹ 0.00</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px] uppercase font-semibold">Input Tax Credit (ITC)</span>
                  <span id="gstInputCredit" class="font-mono text-base font-bold text-amber-400">₹ 0.00</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px] uppercase font-semibold">Net GST Tax Payable</span>
                  <span id="gstNetPayable" class="font-mono text-base font-bold text-white">₹ 0.00</span>
                </div>
              </div>
            </div>

            <div id="fy-summary-container" class="space-y-4"></div>
          </div>

        </div>

        <!-- =========================================================================
             CORPORATE STICKY FOOTER WITH SYNSTAR360 ATTRIBUTION
             ========================================================================= -->
        <footer class="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 flex-shrink-0">
          <div class="flex items-center space-x-2 text-slate-600">
            <div class="w-4 h-4 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-center">
              <img src="assets/logo.webp" alt="Logo" class="w-full h-full object-contain">
            </div>
            <span class="font-medium text-[11px] sm:text-xs">© 2026 Dharshithan Waterproofing and Concrete Solutions. Enterprise Financial Governance.</span>
          </div>
          <div class="text-[11px] sm:text-xs text-slate-500">
            It is designed and developed by <a href="https://synstarstaffing.com/" target="_blank" rel="noopener noreferrer" class="font-semibold text-sky-600 hover:text-sky-700 underline decoration-sky-300 underline-offset-2 transition">Synstar360 Staffing and Software Solutions Pvt Ltd</a>
          </div>
        </footer>

      </main>
    </div>
  </div>


  <!-- =========================================================================
       3. ENTERPRISE MODALS & TRANSACTION ENTRY DIALOGS
       ========================================================================= -->

  <!-- RECORD / EDIT TRANSACTION MODAL WITH MULTI-LINE ITEMS -->
  <div id="txnModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden">
    <div class="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[92vh]">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 id="modalTitle" class="text-base font-bold text-slate-900 flex items-center space-x-2">
          <i data-lucide="plus-circle" class="w-5 h-5 text-sky-600"></i>
          <span>Record Financial Document</span>
        </h3>
        <button onclick="app.closeTransactionModal()" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <form id="txnForm" onsubmit="app.saveTransaction(event)" class="space-y-3.5 text-xs">
        <input type="hidden" id="txnId">

        <!-- Type Toggle (Income / Tax Invoice vs Expense / Payment Voucher) -->
        <div>
          <label class="block font-semibold text-slate-700 mb-1.5">Document Type</label>
          <div class="grid grid-cols-2 gap-2">
            <label class="flex items-center justify-center p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-300 has-[:checked]:text-emerald-800 transition font-semibold">
              <input type="radio" name="modalType" value="Received / Income" onchange="app.handleDocTypeChange('income')" class="mr-2 text-emerald-600 focus:ring-emerald-500" checked>
              <span>Tax Invoice / Client Receipt</span>
            </label>
            <label class="flex items-center justify-center p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 has-[:checked]:bg-rose-50 has-[:checked]:border-rose-300 has-[:checked]:text-rose-800 transition font-semibold">
              <input type="radio" name="modalType" value="Paid / Expense" onchange="app.handleDocTypeChange('expense')" class="mr-2 text-rose-600 focus:ring-rose-500">
              <span>Payment Voucher / Vendor Bill</span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Invoice / Voucher #</label>
            <input type="text" id="modalRef" placeholder="DWCS/REC/26-27/001" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:bg-white focus:outline-none focus:border-sky-500">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Date</label>
            <input type="date" id="modalDate" required class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 font-mono">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Place of Supply / Tax</label>
            <select id="modalTaxType" onchange="app.recalculateLineItems()" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 font-medium">
              <option value="INTRA_18" selected>Intra-State (TN): 18% (CGST 9% + SGST 9%)</option>
              <option value="INTER_18">Inter-State: 18% (IGST 18%)</option>
              <option value="EXEMPT">Exempt / Zero Rated (0%)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Party / Client / Vendor Name</label>
            <input type="text" id="modalParty" required placeholder="e.g. AYYAN HOMES or Asian Paints Ltd" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 font-semibold">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Category / Head of Account</label>
            <input type="text" id="modalCategory" placeholder="e.g. Waterproofing Services or Chemical Purchase" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500">
          </div>
        </div>

        <!-- MULTI-LINE ITEMS SECTION -->
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800 text-xs">Work Scope / Line Items Breakdown</span>
            <button type="button" onclick="app.addLineItemRow()" class="px-2 py-1 bg-white hover:bg-slate-100 text-sky-700 border border-slate-200 rounded text-[11px] font-bold flex items-center space-x-1 cursor-pointer">
              <i data-lucide="plus" class="w-3 h-3"></i>
              <span>Add Item</span>
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th class="py-1">Description / Item</th>
                  <th class="py-1 w-20">SAC/HSN</th>
                  <th class="py-1 w-16">Qty</th>
                  <th class="py-1 w-16">Unit</th>
                  <th class="py-1 w-24">Rate (₹)</th>
                  <th class="py-1 w-24 text-right">Amount (₹)</th>
                  <th class="py-1 w-8 text-center"></th>
                </tr>
              </thead>
              <tbody id="lineItemsTableBody" class="space-y-1">
                <!-- Dynamically populated via line item rows -->
              </tbody>
            </table>
          </div>

          <!-- Totals & Amount in Words Card -->
          <div class="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="space-y-1">
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Amount in Words</span>
              <p id="modalAmountInWords" class="text-slate-800 font-bold italic leading-tight">Zero Rupees Only</p>
            </div>
            <div class="space-y-1 font-mono text-right">
              <div class="flex justify-between text-slate-500">
                <span>Subtotal (Taxable):</span>
                <span id="modalSubtotalDisplay" class="font-semibold">₹ 0.00</span>
              </div>
              <div class="flex justify-between text-slate-500">
                <span id="modalTaxLabel">GST (18%):</span>
                <span id="modalTaxDisplay" class="font-semibold">₹ 0.00</span>
              </div>
              <div class="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1 text-sm">
                <span>Grand Total:</span>
                <span id="modalGrandTotalDisplay" class="text-sky-700">₹ 0.00</span>
              </div>
            </div>
          </div>
        </div>

        <input type="hidden" id="modalAmount" value="0.00">

        <!-- Payment Mode & Reference -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Payment Mode</label>
            <select id="modalMode" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500">
              <option value="NETBANKING">NETBANKING (NEFT / RTGS)</option>
              <option value="UPI">UPI (Google Pay / PhonePe)</option>
              <option value="CASH">CASH</option>
              <option value="CHEQUE">CHEQUE</option>
              <option value="DEBIT CARD / CREDIT CARD">DEBIT / CREDIT CARD</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Site Location / Narration</label>
            <input type="text" id="modalDesc" placeholder="e.g. Adambakkam Site Phase 1" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500">
          </div>
        </div>

        <div class="flex space-x-2 pt-2 border-t border-slate-100">
          <button type="submit" id="saveTxnBtn" class="flex-1 py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>Commit to Neon Database</span>
          </button>
          <button type="button" onclick="app.closeTransactionModal()" class="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>


  <!-- COMMERCIAL TAX INVOICE & VOUCHER PRINT VIEWER MODAL -->
  <div id="invoicePrintModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden">
    <div class="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 sm:p-8 space-y-5 shadow-2xl overflow-y-auto max-h-[95vh]">
      <!-- Printable Sheet Area -->
      <div id="printableInvoiceSheet" class="space-y-5 text-xs text-slate-800">
        
        <!-- Invoice Letterhead -->
        <div class="flex justify-between items-start border-b border-slate-300 pb-4">
          <div class="flex items-center space-x-3">
            <div class="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src="assets/logo.webp" alt="Dharshithan Logo" class="w-full h-full object-contain">
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900 tracking-tight">DHARSHITHAN WATERPROOFING & CONCRETE SOLUTIONS</h2>
              <p class="text-[11px] text-slate-600">69/8, First Floor, Karuneegar Street, Adambakkam, Chennai - 600088.</p>
              <p class="text-[11px] text-slate-600">Email: dharshithanpartiban@gmail.com | Phone: +91 9944139663</p>
              <p class="text-[11px] font-bold text-slate-900 mt-0.5">GSTIN: 33CEQPP3071Q1ZR | State: Tamil Nadu (33)</p>
            </div>
          </div>
          <div class="text-right">
            <span id="printDocBadge" class="px-3 py-1 rounded bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px] inline-block mb-1">TAX INVOICE</span>
            <p id="printDocNumber" class="font-mono font-bold text-sm text-slate-900">DWCS/REC/26-27/001</p>
            <p id="printDocDate" class="text-slate-500 font-mono text-xs">Date: 01-Nov-2026</p>
          </div>
        </div>

        <!-- Bill To / Party Details -->
        <div class="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <div>
            <span class="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Billed To (Party Details)</span>
            <p id="printPartyName" class="font-bold text-slate-900 text-sm">AYYAN HOMES</p>
            <p id="printPartyLocation" class="text-slate-600">Site Location: Chennai Project</p>
          </div>
          <div class="text-right space-y-0.5">
            <p><span class="text-slate-500">Place of Supply:</span> <strong id="printPlaceOfSupply">Tamil Nadu (33)</strong></p>
            <p><span class="text-slate-500">Payment Mode:</span> <strong id="printPaymentMode">NETBANKING</strong></p>
            <p><span class="text-slate-500">Ref / UTR Number:</span> <strong id="printRefNumber" class="font-mono">-</strong></p>
          </div>
        </div>

        <!-- Printable Line Items Table -->
        <table class="w-full border border-slate-300 border-collapse text-xs">
          <thead class="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
            <tr>
              <th class="p-2 border border-slate-300 w-8 text-center">#</th>
              <th class="p-2 border border-slate-300 text-left">Description of Goods / Services</th>
              <th class="p-2 border border-slate-300 w-20 text-center">HSN/SAC</th>
              <th class="p-2 border border-slate-300 w-16 text-right">Qty</th>
              <th class="p-2 border border-slate-300 w-16 text-center">Unit</th>
              <th class="p-2 border border-slate-300 w-24 text-right">Rate (₹)</th>
              <th class="p-2 border border-slate-300 w-28 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody id="printLineItemsBody">
            <!-- Dynamically populated -->
          </tbody>
        </table>

        <!-- Tax Computation Grid -->
        <div class="grid grid-cols-2 gap-4 pt-1">
          <div class="space-y-2">
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Total Amount in Words</span>
              <p id="printAmountWords" class="font-bold text-slate-900 italic">One Lakh Twenty Thousand Rupees Only</p>
            </div>
            
            <!-- Remittance Bank Details -->
            <div class="p-2.5 border border-slate-200 rounded bg-slate-50 text-[11px] space-y-0.5">
              <span class="font-bold text-slate-800 block text-[10px] uppercase">Bank Details for RTGS / NEFT / IMPS</span>
              <p>Account Name: <strong>Dharshithan Waterproofing and Concrete Solutions</strong></p>
              <p>Bank: <strong>HDFC Bank</strong> | A/C No: <strong class="font-mono">50200089214532</strong></p>
              <p>IFSC Code: <strong class="font-mono">HDFC0001245</strong> | Branch: <strong>Adambakkam, Chennai</strong></p>
            </div>
          </div>

          <div class="space-y-1 font-mono text-xs">
            <div class="flex justify-between py-1 border-b border-slate-200">
              <span class="text-slate-600">Sub Total (Taxable Value):</span>
              <span id="printSubTotal" class="font-bold">₹ 0.00</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-200">
              <span id="printCgstLabel" class="text-slate-600">CGST (9%):</span>
              <span id="printCgstAmount">₹ 0.00</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-200">
              <span id="printSgstLabel" class="text-slate-600">SGST (9%):</span>
              <span id="printSgstAmount">₹ 0.00</span>
            </div>
            <div class="flex justify-between py-1.5 border-t-2 border-slate-900 font-bold text-sm text-slate-900">
              <span>Grand Total:</span>
              <span id="printGrandTotal" class="text-sky-700">₹ 0.00</span>
            </div>
          </div>
        </div>

        <!-- Signature Block -->
        <div class="flex justify-between items-end pt-6 border-t border-slate-200">
          <div class="text-[10px] text-slate-500 max-w-sm space-y-0.5">
            <p>1. Certified that the particulars given above are true and correct.</p>
            <p>2. Subject to Chennai jurisdiction. Standard waterproofing warranty applies.</p>
          </div>
          <div class="text-center">
            <p class="font-bold text-xs text-slate-900">For DHARSHITHAN WATERPROOFING AND CONCRETE SOLUTIONS</p>
            <div class="h-14"></div>
            <p class="text-xs font-semibold text-slate-700 border-t border-slate-300 pt-1">Authorized Signatory</p>
          </div>
        </div>

      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-2 pt-3 border-t border-slate-200 no-print">
        <button onclick="window.print()" class="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer">
          <i data-lucide="printer" class="w-4 h-4"></i>
          <span>Print / Save as PDF</span>
        </button>
        <button onclick="app.closeInvoicePrintModal()" class="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer">
          Close
        </button>
      </div>
    </div>
  </div>


  <!-- ORGANIZATION MASTER DETAILS MODAL -->
  <div id="orgDetailsModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden">
    <div class="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center">
            <img src="assets/logo.webp" alt="Logo" class="w-full h-full object-contain">
          </div>
          <h3 class="text-sm font-bold text-slate-900">Company Master Profile</h3>
        </div>
        <button onclick="app.closeOrgDetailsModal()" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="space-y-2 text-xs">
        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
          <span class="text-[10px] uppercase font-bold text-slate-400">Legal Business Name</span>
          <p class="font-bold text-slate-900">Dharshithan Waterproofing and Concrete Solutions</p>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
          <span class="text-[10px] uppercase font-bold text-slate-400">Registered Office Address</span>
          <p class="text-slate-700">69/8, First Floor, Karuneegar Street, Adambakkam, Chennai - 600088.</p>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
            <span class="text-[10px] uppercase font-bold text-slate-400">GSTIN</span>
            <p class="font-mono font-bold text-slate-900">33CEQPP3071Q1ZR</p>
          </div>
          <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
            <span class="text-[10px] uppercase font-bold text-slate-400">State / Code</span>
            <p class="font-bold text-slate-900">Tamil Nadu (33)</p>
          </div>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
          <span class="text-[10px] uppercase font-bold text-slate-400">Official Contact</span>
          <p class="text-slate-700">dharshithanpartiban@gmail.com | +91 9944139663</p>
        </div>
      </div>

      <div class="pt-2 border-t border-slate-100 flex justify-end">
        <button onclick="app.closeOrgDetailsModal()" class="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-semibold cursor-pointer">Close</button>
      </div>
    </div>
  </div>


  <!-- USER PROFILE & "RIGHTS TO USE" DRAWER / MODAL -->
  <div id="userProfileModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden">
    <div class="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[92vh]">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div class="flex items-center space-x-3">
          <div id="modalProfileAvatar" class="w-11 h-11 rounded-lg bg-purple-600 text-white font-bold text-base flex items-center justify-center shadow-sm">
            SA
          </div>
          <div>
            <h3 id="modalProfileFullName" class="text-base font-bold text-slate-900 leading-tight">Super Administrator</h3>
            <p id="modalProfileUserId" class="text-xs text-slate-500 font-mono">ID: admin • admin@dharshithan.com</p>
          </div>
        </div>
        <button onclick="app.closeUserProfileModal()" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Account Badge & Category -->
      <div class="grid grid-cols-2 gap-2.5 text-xs">
        <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Assigned Role & Level</span>
          <div id="modalProfileRoleBadge" class="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Super Administrator
          </div>
        </div>
        <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Department / Category</span>
          <span id="modalProfileCategory" class="font-bold text-slate-800 text-xs">Executive Administration</span>
        </div>
      </div>

      <!-- Rights to Use Section -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
            <i data-lucide="shield-check" class="w-4 h-4 text-sky-600"></i>
            <span>Rights to Use (Assigned Powers)</span>
          </h4>
          <span class="text-[10px] text-slate-400 font-medium">Enterprise RBAC Controlled</span>
        </div>

        <div id="profileRightsList" class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          <!-- Dynamically populated from window.roleManager.getRightsMatrix() -->
        </div>
      </div>

      <!-- Super Admin Quick Role Preview Switcher (ONLY for Super Admin) -->
      <div id="superAdminRolePreviewBox" class="p-3 rounded-lg bg-purple-50/70 border border-purple-200 space-y-2 hidden">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-purple-900 flex items-center space-x-1.5">
            <i data-lucide="sliders" class="w-3.5 h-3.5 text-purple-700"></i>
            <span>Super Admin Role Preview Switcher</span>
          </span>
          <span class="text-[10px] text-purple-600 font-medium">Testing Mode</span>
        </div>
        <p class="text-[11px] text-purple-700 leading-tight">Switch your active perspective to verify what Employees, Admins, or Owners see in real time.</p>
        <select id="rolePreviewSelect" onchange="app.switchRolePreview(this.value)" class="w-full bg-white border border-purple-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-purple-950 focus:outline-none focus:border-purple-500">
          <option value="super_admin">Super Admin (Full Master Access)</option>
          <option value="owner">Company Owner (Executive Full CRUD)</option>
          <option value="admin">Finance Admin (Controller & Vouchers)</option>
          <option value="developer">Lead Developer (APIs & System)</option>
          <option value="employee">Site Employee (Field Entry Only)</option>
          <option value="stakeholder">Stakeholder (Read-Only Executive)</option>
        </select>
      </div>

      <!-- Footer Quick Action Buttons -->
      <div class="pt-2 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center text-xs">
        <div class="flex items-center space-x-2">
          <button onclick="app.openUserManagementModal(); app.closeUserProfileModal();" id="modalUserMgmtBtn" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold flex items-center space-x-1.5 transition cursor-pointer">
            <i data-lucide="user-cog" class="w-3.5 h-3.5 text-purple-600"></i>
            <span>Staff Directory</span>
          </button>
          <button onclick="app.openSelfPasswordChangeModal()" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold flex items-center space-x-1.5 transition cursor-pointer">
            <i data-lucide="key" class="w-3.5 h-3.5 text-slate-600"></i>
            <span>Change Password</span>
          </button>
        </div>

        <button onclick="app.closeUserProfileModal(); app.handleLogout();" class="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 flex items-center space-x-1.5 transition cursor-pointer">
          <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  </div>


  <!-- TRANSACTION DETAIL MODAL (Read-Only Viewer & Print) -->
  <div id="txnDetailModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden">
    <div class="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2.5">
          <div id="detailTypeBadge" class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-emerald-100 text-emerald-800">IN</div>
          <div>
            <h3 id="detailPartyName" class="text-base font-bold text-slate-900 leading-tight">Party Name</h3>
            <p id="detailSlNoDate" class="text-xs text-slate-500">Sl No #1 • 01-Nov-2026</p>
          </div>
        </div>
        <button onclick="app.closeTransactionDetailModal()" class="text-slate-400 hover:text-slate-600 p-1">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Transaction Amount</p>
          <p id="detailAmount" class="font-mono font-bold text-xl text-slate-900">₹ 0.00</p>
        </div>
        <div class="text-right">
          <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Operating Balance Impact</p>
          <p id="detailProfit" class="font-mono font-bold text-lg text-emerald-600">+₹ 0.00</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2.5 text-xs">
        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span class="text-slate-400 text-[10px] block font-medium uppercase">Payment Mode</span>
          <span id="detailMode" class="font-semibold text-slate-800">CASH</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span class="text-slate-400 text-[10px] block font-medium uppercase">Reference / Bill #</span>
          <span id="detailRefNumber" class="font-mono font-semibold text-slate-800">-</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span class="text-slate-400 text-[10px] block font-medium uppercase">Quarter / FY</span>
          <span id="detailQuarterFY" class="font-semibold text-slate-800">Q3 • F.Y. 2026-27</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span class="text-slate-400 text-[10px] block font-medium uppercase">Category</span>
          <span id="detailCategory" class="font-semibold text-slate-800">General</span>
        </div>
      </div>

      <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
        <span class="text-slate-400 text-[10px] block font-medium uppercase mb-0.5">Narration / Details</span>
        <p id="detailDescription" class="text-slate-700 italic font-mono">-</p>
      </div>

      <div class="pt-2 border-t border-slate-100 flex justify-end space-x-2">
        <button onclick="app.printCurrentDetailInvoice()" class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs text-white font-bold flex items-center space-x-1.5 cursor-pointer">
          <i data-lucide="printer" class="w-3.5 h-3.5"></i>
          <span>View / Print Tax Invoice</span>
        </button>
        <button onclick="app.closeTransactionDetailModal()" class="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-medium">Close</button>
      </div>
    </div>
  </div>


  <!-- PARTY ACCOUNT STATEMENT MODAL WITH DATE FILTER & RUNNING BALANCE -->
  <div id="partyModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden">
    <div class="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-5 sm:p-6 space-y-4 shadow-2xl flex flex-col max-h-[92vh]">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 id="partyModalTitle" class="text-base font-bold text-slate-900">Party Account Ledger Statement</h3>
          <p class="text-xs text-slate-500">Comprehensive chronological transaction history & running balance</p>
        </div>
        <button onclick="app.closePartyModal()" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Summary KPI Row -->
      <div class="grid grid-cols-3 gap-2.5 text-xs">
        <div class="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
          <span class="text-emerald-800 block mb-0.5 text-[10px] font-bold uppercase">Total Received</span>
          <span id="partyModalReceived" class="font-mono text-emerald-700 font-bold text-sm sm:text-base">₹ 0.00</span>
        </div>
        <div class="p-2.5 rounded-lg bg-rose-50 border border-rose-100">
          <span class="text-rose-800 block mb-0.5 text-[10px] font-bold uppercase">Total Paid</span>
          <span id="partyModalPaid" class="font-mono text-rose-700 font-bold text-sm sm:text-base">₹ 0.00</span>
        </div>
        <div class="p-2.5 rounded-lg bg-sky-50 border border-sky-100">
          <span class="text-sky-800 block mb-0.5 text-[10px] font-bold uppercase">Net Outstanding Balance</span>
          <span id="partyModalNet" class="font-mono font-bold text-sm sm:text-base text-slate-900">₹ 0.00</span>
        </div>
      </div>

      <!-- Statement Table with Running Balance -->
      <div class="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Voucher / Ref #</th>
              <th>Category</th>
              <th>Mode</th>
              <th class="text-right">Debit (Paid)</th>
              <th class="text-right">Credit (Recd)</th>
              <th class="text-right">Balance</th>
            </tr>
          </thead>
          <tbody id="partyModalTable" class="divide-y divide-slate-100 font-mono"></tbody>
        </table>
      </div>

      <div class="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
        <button onclick="window.print()" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center space-x-1.5 cursor-pointer">
          <i data-lucide="printer" class="w-3.5 h-3.5"></i>
          <span>Print Statement</span>
        </button>
        <button onclick="app.closePartyModal()" class="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer">Close</button>
      </div>
    </div>
  </div>


  <!-- LIQUIDITY & FLOAT ADJUSTMENT MODAL -->
  <div id="floatModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden">
    <div class="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-5 sm:p-6 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
            <i data-lucide="sliders" class="w-4 h-4"></i>
          </div>
          <h3 class="text-sm font-bold text-slate-900">Adjust Float Reserves</h3>
        </div>
        <button onclick="app.closeFloatModal()" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <form id="floatForm" onsubmit="app.saveFloatAdjustments(event)" class="space-y-3 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Opening Bank Float (₹)</label>
          <input type="number" step="0.01" id="inputBankFloat" required class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Opening Cash in Hand Float (₹)</label>
          <input type="number" step="0.01" id="inputCashFloat" required class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold">
        </div>

        <div class="flex space-x-2 pt-2">
          <button type="submit" class="flex-1 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-xs cursor-pointer">
            Save Reserves
          </button>
          <button type="button" onclick="app.closeFloatModal()" class="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>


  <!-- USER MANAGEMENT & STAFF DIRECTORY MODAL -->
  <div id="userManagementModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden">
    <div class="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[92vh]">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2.5">
          <div class="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
            <i data-lucide="user-cog" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900">Staff Directory & User Management</h3>
            <p class="text-xs text-slate-500">Role-Based Access Control (RBAC) powered by Neon PostgreSQL</p>
          </div>
        </div>
        <button onclick="app.closeUserManagementModal()" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Add New User Form -->
      <form id="addUserForm" onsubmit="app.handleAddUser(event)" class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
        <h4 class="font-bold text-slate-900 text-xs">Provision New Staff Account</h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label class="block font-medium text-slate-700 mb-0.5">Full Name</label>
            <input type="text" id="newFullName" required placeholder="e.g. Ramesh K" class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800">
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-0.5">User ID / Username</label>
            <input type="text" id="newUserId" required placeholder="e.g. ramesh" class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono">
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-0.5">Email Address</label>
            <input type="email" id="newEmail" required placeholder="ramesh@dharshithan.com" class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800">
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label class="block font-medium text-slate-700 mb-0.5">Role Permission</label>
            <select id="newRole" class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold">
              <option value="employee">Site Employee (Field Entry Only)</option>
              <option value="admin">Finance Admin (Controller & Vouchers)</option>
              <option value="owner">Company Owner (Full Access)</option>
              <option value="stakeholder">Stakeholder (Read-Only)</option>
              <option value="developer">Lead Developer (APIs & System)</option>
              <option value="super_admin">Super Admin (System Admin)</option>
            </select>
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-0.5">Department / Category</label>
            <input type="text" id="newCategory" placeholder="Site Operations" class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800">
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-0.5">Temporary Password</label>
            <input type="text" id="newPassword" value="Dhar@2026" class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono">
          </div>
        </div>
        <div class="flex justify-end pt-1">
          <button type="submit" class="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition cursor-pointer">
            Create User Account
          </button>
        </div>
      </form>

      <!-- Users Table -->
      <div class="overflow-x-auto border border-slate-200 rounded-xl">
        <table class="erp-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th class="text-center">Action</th>
            </tr>
          </thead>
          <tbody id="usersTableBody">
            <!-- Rendered via authManager -->
          </tbody>
        </table>
      </div>
    </div>
  </div>


  <!-- CLOUD DATABASE HUB MODAL (SUPER ADMIN ONLY) -->
  <div id="databaseHubModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden">
    <div class="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[92vh]">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2.5">
          <div class="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
            <i data-lucide="database" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900">Neon Cloud PostgreSQL Console</h3>
            <p class="text-xs text-slate-500">Live serverless telemetry and backup console</p>
          </div>
        </div>
        <button onclick="app.closeDatabaseHubModal()" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="space-y-3 text-xs">
        <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-700">Database Engine</span>
            <span class="font-mono text-emerald-700 font-bold">Neon Serverless PostgreSQL 16</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-700">Connection Pooling</span>
            <span class="font-mono text-slate-600">AWS us-east-2 (ep-late-art-b5308bnc-pooler)</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-700">Driver Architecture</span>
            <span class="font-mono text-slate-600">@neondatabase/serverless</span>
          </div>
        </div>

        <div class="flex space-x-2">
          <button onclick="app.refreshFromNeon()" class="flex-1 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            <span>Refresh Cloud State</span>
          </button>
          <button onclick="app.downloadMigrationSQL()" class="py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 shadow-2xs cursor-pointer">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>Export .SQL Backup</span>
          </button>
        </div>
      </div>
    </div>
  </div>


  <!-- AUTHENTICATED USER PASSWORD CHANGE MODAL -->
  <div id="selfPasswordChangeModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden">
    <div class="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-5 sm:p-6 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
            <i data-lucide="key" class="w-4 h-4"></i>
          </div>
          <h3 class="text-sm font-bold text-slate-900">Change Account Password</h3>
        </div>
        <button onclick="app.closeSelfPasswordChangeModal()" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <form id="selfPasswordChangeForm" onsubmit="app.handleSelfPasswordChange(event)" class="space-y-3 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">New Password</label>
          <input type="password" id="selfNewPass" required minlength="6" placeholder="At least 6 characters" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
          <input type="password" id="selfConfirmPass" required minlength="6" placeholder="Re-enter new password" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500">
        </div>

        <div class="flex space-x-2 pt-2">
          <button type="submit" class="flex-1 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-xs cursor-pointer">
            Update Password
          </button>
          <button type="button" onclick="app.closeSelfPasswordChangeModal()" class="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>


  <!-- Notification Toast Container -->
  <div id="toastContainer" class="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none"></div>

  <!-- Scripts -->
  <script src="js/roles.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/database-hub.js"></script>
  <script src="js/db.js"></script>
  <script src="js/analytics.js"></script>
  <script src="js/charts.js"></script>
  <script src="js/export-import.js"></script>
  <script src="js/app.js"></script>
  
  <!-- PWA Service Worker Registration -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration note:', err));
      });
    }
  </script>
</body>
</html>`;

fs.writeFileSync(indexPath, htmlContent, 'utf8');
console.log('✓ Successfully wrote complete enterprise index.html');
