# Dharshithan Waterproofing - Finance ERP Pro

<p align="center">
  <img src="assets/logo.webp" alt="Dharshithan Waterproofing Logo" width="130" style="border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
  <br>
  <strong>Enterprise Financial Governance, Multi-Cloud Database & Zoho ERP Billing Suite</strong><br>
  <em>Built for Dharshithan Waterproofing & Concrete Solutions</em>
</p>

---

## 🌟 Key Highlights & Architecture

### 1. ☁️ Multi-Cloud Free Database Engine (Supabase / MongoDB Atlas / Neon)
The platform is powered by an automated, multi-cloud database architecture designed for permanent free-tier hosting:
- **Supabase (Recommended - 100% Free Forever Tier)**:
  - 500 MB hosted PostgreSQL instance with Row Level Security (RLS).
  - PostgREST instant REST API and 50,000 monthly active users.
  - Native PostgreSQL schema with UUID primary keys, financial ENUMs, and performance indexes.
  - Complete `supabase-schema.sql` included.
- **MongoDB Atlas (Free M0 Sandbox)**:
  - 512 MB document storage with automatic indexing.
  - Native `mongodb` driver connection pooling.
- **Neon Cloud Database (PostgreSQL)**:
  - Fully maintained as a live connected source with bidirectional data transfer.
- **High-Reliability Local/Offline Engine**:
  - Automatically caches in IndexedDB and LocalStorage.
  - Zero-downtime fallback: if cloud credentials are being updated or network is offline, the site continues functioning seamlessly without 500 errors!

---

### 2. ⚡ Automated Cloud Data Transfer Pipeline
Transfer data seamlessly between Neon, Supabase, and MongoDB:
- **In-App One-Click Migration**: From the **Database Hub** in the executive sidebar, Super Admins can click **"Transfer to Supabase (Free)"** or **"Transfer to MongoDB Atlas"** to migrate all live transactions, user roles, opening float, and tax vouchers in seconds.
- **CLI Transfer Script**: Run `npm run transfer` anytime to execute automated migration:
  ```bash
  npm run transfer
  ```
- **Export Formats**: One-click export for Supabase SQL (`.sql`), MongoDB Documents (`.json`), Neon PostgreSQL (`.sql`), Excel (`.xlsx`), and CSV.

---

### 3. 🏢 Complete Zoho ERP Corporate Financial Portal
- **Dashboard & Executive KPIs**: Real-time Total Revenue, Total Expenses, Net Profit/Loss, Margin %, Cash Float, and Bank Book position.
- **GST Tax Invoicing (Sales)**: Multi-line invoice generator with HSN/SAC 9954 (Waterproofing Services), CGST 9% + SGST 9% or IGST 18%, automated amount-in-words conversion (Indian numbering format: *"Rupees One Lakh Twenty Thousand Only"*), and printable commercial vouchers.
- **Purchases & Expense Book**: Track site labor wages, chemical materials, equipment, and travel with cash/UPI/netbanking voucher generation.
- **Master Ledger & Party Statements**: Real-time double-entry party ledger with running balances, column sorting, search, and bulk operations.
- **Banking & Float Reconciliation**: Liquidity settings for bank accounts and daily physical cash float with audit alerts.
- **Reports & P&L Analytics**: Period filters (Today, This Month, Q1-Q4, Full Year), interactive Chart.js revenue vs. expense timelines, and comprehensive financial reports.

---

### 4. 🔐 Enterprise Role-Based Access Control (RBAC)
- **Super Administrator (`admin`)**:
  - Full system control, Database Console, User Governance, permanent transaction deletion, and cloud data transfer.
  - Default Credentials: `admin` / `admin@2026`
- **Owner (`owner`)**: Executive oversight, P&L visibility, balance adjustments, and audit reports.
- **Admin (`admin`)**: Operational accounting, invoice generation, voucher issue, and customer statements.
- **Developer (`developer`)**: Cloud connectivity, telemetry, schema inspection, and API testing.
- **Employee (`employee`)**: Site expense logging, receipt upload, and field transaction view.
- **Stakeholder (`stakeholder`)**: Read-only investor view with financial statement exports.

---

## 🚀 Quick Start & Development

### 1. Install & Run Locally
```bash
# Start local server
npm start
# Server runs at http://localhost:3000
```

### 2. Test Cloud Services & Handlers
```bash
# Verify Multi-Cloud Database Engine (Supabase / MongoDB / Neon)
npm test

# Run Comprehensive Zoho ERP Workflow Test
npm run test:e2e
```

### 3. Build for Production / Vercel
```bash
npm run build
```

---

## 🌐 Deploy to Vercel

1. Push to your GitHub repository:
   ```bash
   git add .
   git commit -m "Fresh enterprise release with Supabase free tier & Vercel deployment"
   git push origin main
   ```
2. In your Vercel Project Settings, add optional database environment variables:
   - `DB_PROVIDER`: `supabase` (or `mongodb` / `neon`)
   - `SUPABASE_DATABASE_URL`: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - `SUPABASE_URL`: `https://[PROJECT-REF].supabase.co`
   - `SUPABASE_ANON_KEY`: `your-supabase-anon-key`
   - *(Optional for MongoDB)* `MONGODB_URI`: `mongodb+srv://...`
   - *(Optional for Neon)* `DATABASE_URL`: `postgresql://...`
3. Click **Deploy**. Vercel will automatically build from `public/` with serverless API routes in `api/`.

---

<p align="center">
  <em>Developed for Dharshithan Waterproofing & Concrete Solutions • Powered by Synstar360 Enterprise ERP</em>
</p>
