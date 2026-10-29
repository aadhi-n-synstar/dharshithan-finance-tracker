# Dharshithan Waterproofing - Finance Tracker Pro

<p align="center">
  <img src="assets/logo.webp" alt="Dharshithan Waterproofing Logo" width="130" style="border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
  <br>
  <strong>Enterprise Financial Management, Live Sheet Sync & Cloud Database Software</strong><br>
  <em>Built for Dharshithan Waterproofing & Complete Solutions</em>
</p>

---

## 🌟 Key Architecture & Capabilities

### 1. 📊 Complete Google Sheets "Dashboard" Worksheet Mirroring
The system accurately computes and displays all executive KPI cards and operational panels directly modeled after the master Google Spreadsheet (`Dashboard` worksheet):
- **Top 5 KPI Metrics**: Total Revenue, Total Expenses, Net Profit/Loss, Profit Margin % (with healthy/alert badges), and Total Available Liquidity.
- **Financial Summary & Liquidity Split**: Clear breakdown of Bank balance vs. Physical Cash in Hand.
- **Income & Expense by Mode**: Netbanking vs. Cash vs. Cheque vs. UPI breakdown.
- **Bank Position Panel**: Inflows, Outflows, Net Movement, Opening Balance, Current Bank Balance, and Auto-Reconciliation health badge (`Reconciled` / `Deficit`).
- **Cash Position & Float Panel**: Physical Cash Receipts, Cash Expenses, Net Cash Movement, Opening Float (editable directly on screen), Available Physical Cash, and Cash Health alert (`Healthy` or `Replenish Cash`).

### 2. 👥 Multi-Role Access Control (RBAC)
Enterprise user governance with quick-switch role simulation and permission gating:
- **👑 Super Admin**: Full control (Add, Edit, Delete, Float Adjustment, DB Migration & Backups, Full Audit Access).
- **👔 Owner**: Strategic & operational control (Add, Edit, Delete, Float Adjustment, Reports & Export, DB Setup).
- **🛡️ Admin**: Daily management (Add, Edit, Delete, Adjust Opening Balances, View Reports).
- **💻 Developer**: System maintenance, API endpoints, migration testing, schema DDL generation.
- **👷 Employee**: Field & site entry mode (Add transactions, view records — Edit/Delete/Config locked).
- **📈 Stakeholder**: Read-only oversight (View KPIs, charts, and export summary reports — modification locked).

### 3. ☁️ Enterprise Cloud Database Hub (Vercel / Supabase / Neon PostgreSQL Ready)
Seamlessly scale from Google Sheets to a production cloud database:
- **`schema.sql` Included**: Production PostgreSQL DDL schema with typed ENUMs (`user_role`), tables (`users`, `transactions`, `liquidity_settings`, `audit_logs`), performance indexes, and Row-Level Security (RLS) policies.
- **1-Click SQL Migration**: Export all live transactions as PostgreSQL-ready `INSERT` statements with a single click in the Database Hub.
- **Provider Switching**: Toggle effortlessly between **Google Sheets Master** mode and **PostgreSQL (Supabase/Neon/Vercel)** with connection health verification.

### 4. 🔄 Immediate 2-Way Google Sheets Sync
- **Strict Real-Time Reflection**: Any entry added, edited, or deleted inside the application is immediately synced with the master Google Sheet.
- **Offline Resilient Queue**: If internet drops on-site, changes are queued locally in IndexedDB and automatically synced as soon as internet connectivity returns.
- **Bidirectional Pull & Push**: Synchronize existing spreadsheet rows or push full local state to remote sheets on demand.

### 5. 📱 Native Android App Experience (PWA)
- **Installable PWA**: Runs full-screen as an app on any Android device via Google Chrome.
- **Android Bottom Navigation Bar**: Quick navigation for Home, Ledger, Parties, P&L Reports, and Sync.
- **Android Floating Action Button (FAB)**: Rapid entry button anchored at bottom-right for instant voucher recording on-site.
- **Touch-Optimized Cards & Bottom Sheets**: Modern Material Design 3 inspired touch controls with crisp White/Light aesthetics.

---

## ⚡ How to Connect Real-Time Google Sheets Sync (3 Simple Steps)

1. **Open your Google Sheet**:  
   [Dharshithan Waterproofing - Finance Tracker](https://docs.google.com/spreadsheets/d/1WWhXiHHrlUohpJUWhpKXfvqVSR_JUJJDGHFvOFk_Ltc/edit?usp=sharing)
2. **Open Apps Script**:  
   Click `Extensions > Apps Script`. Replace any code with the contents of [`google-apps-script.js`](./google-apps-script.js) from this repository.
3. **Deploy as Web App**:
   - Click the blue **Deploy** button at the top right → **New deployment**.
   - Click the gear icon next to "Select type" → Choose **Web app**.
   - Set **Execute as**: `Me`.
   - Set **Who has access**: `Anyone` *(required for mobile & web access)*.
   - Click **Deploy** and copy your Web App URL (e.g. `https://script.google.com/macros/s/.../exec`).
4. **Connect in App**:
   - Open your Finance Tracker app.
   - Click the **"Sheets Sync"** button in the top bar.
   - Paste the Web App URL and click **"Save Webhook URL"**!
   - Every transaction will now immediately reflect in your Google Sheet!

---

## 🗄️ Migrating to Cloud Database (Supabase / Neon / Vercel Postgres)

When you're ready to migrate from Google Sheets to a dedicated cloud database:
1. Create a free PostgreSQL project on [Supabase](https://supabase.com), [Neon](https://neon.tech), or Vercel Postgres.
2. In the Supabase/Neon SQL Editor, run the contents of [`schema.sql`](./schema.sql) to create the schema and security policies.
3. In the Dharshithan Finance Tracker app, click **"Cloud DB"** in the top navigation bar.
4. Click **"Generate PostgreSQL SQL Migration Script"** to download all existing data as ready-to-run `INSERT` queries.
5. Paste the generated SQL into your database SQL Editor to complete data migration!

---

## 📲 How to Install as an Android App on Your Phone

1. Open your live app URL on your Android phone using **Google Chrome**.
2. Tap the three dots menu (⋮) in the top-right corner of Chrome.
3. Tap **"Install app"** (or **"Add to Home screen"**).
4. The **Dharshithan Finance Tracker** icon will now appear on your home screen and app drawer just like a native Android APK!
5. Tap it to launch full-screen with no browser address bars!

---

## 💻 Tech Stack & Architecture

```
Dharshithan Finance Tracker/
├── index.html            # Crisp White Light theme, mobile-first Android app UI
├── manifest.json         # Android PWA Web App Manifest
├── sw.js                 # Service worker for offline caching & Android installability
├── google-apps-script.js # Google Sheets Webhook Backend for real-time 2-way sync
├── schema.sql            # Enterprise PostgreSQL DDL schema with RBAC and RLS
├── vercel.json           # Vercel deployment configuration & caching rules
├── start-app.bat         # 1-click Windows launcher
├── push-to-github.bat    # 1-click GitHub push script
├── README.md             # Complete project documentation
├── assets/
│   ├── logo.webp         # Official company logo
│   └── favicon.webp      # Branded browser favicon & app icon
├── css/
│   └── styles.css        # Material Design 3 inspired Android UI & Light Theme
└── js/
    ├── app.js            # Main application controller & Android view orchestrator
    ├── roles.js          # Role-Based Access Control (RBAC) governance system
    ├── database-hub.js   # Cloud database provider abstraction & SQL migration engine
    ├── google-sync.js    # Real-time Google Sheets Live Sync engine
    ├── db.js             # IndexedDB & LocalStorage persistent storage
    ├── analytics.js      # Indian FY, Quarters, and INR calculations mirroring Dashboard sheet
    ├── charts.js         # Interactive Chart.js visualizations
    └── export-import.js  # CSV/TSV Google Sheets exporter & importer
```
