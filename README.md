# Dharshithan Waterproofing - Finance Tracker Pro

<p align="center">
  <img src="assets/logo.webp" alt="Dharshithan Waterproofing Logo" width="120" style="border-radius: 16px;" />
  <br>
  <strong>High-End Finance & Cashflow Tracking Software</strong><br>
  <em>Designed for Dharshithan Waterproofing & Complete Solutions</em>
</p>

A high-end, responsive, enterprise-grade financial management software designed specifically for **Dharshithan Waterproofing**, modeled directly on the company's master Google Spreadsheet:
> [Master Google Spreadsheet Source](https://docs.google.com/spreadsheets/d/1WWhXiHHrlUohpJUWhpKXfvqVSR_JUJJDGHFvOFk_Ltc/edit?usp=sharing)

---

## 🌟 Key Features

1. **Executive Financial Dashboard**:
   - **Total Income / Turnover**: Sum of all client billings and incoming cashflow.
   - **Total Expenses**: Disbursements for labor, materials/chemicals, subcontractors, and operations.
   - **Net Income in Stands**: Net profit and profit margin percentage.
   - **Bank vs Cash In Hand Liquidity**: Real-time reconciliation of bank channels (`UPI`, `NETBANKING`, `CARDS`, `CHEQUE`) vs physical `CASH`.
   - **Mode-wise Breakdown**: Visual progress bars and breakdown matching the Google Sheet Dashboard.
   - **Interactive Visualizations**: Monthly revenue vs expense trend line/bar charts and channel distribution doughnut charts (Chart.js).

2. **Full Transaction Ledger**:
   - Matches Google Sheet `Sheet1` schema:
     - `Sl No.`, `Date`, `Paid / Received`, `Party Name`, `Description`, `Amount (₹)`, `Mode`, `Ref Number / Remarks`, `Quarter`, `Profit Value`.
   - Search by party, invoice number, or description.
   - Instant filtering by **Financial Year**, **Quarter (Q1-Q4)**, **Type (Income/Expense)**, and **Payment Mode**.
   - One-click Edit, Delete, and Add Transaction with auto-calculated Indian Financial Year (`F.Y. 2026-27`) and Quarters.

3. **Parties & Clients Directory**:
   - Automatic vendor and client balance tracking.
   - Summaries of total received, total paid, and net balance standing.
   - Click any party to open a full **Party Statement & Ledger** modal.

4. **Profit & Loss (P&L) and Quarterly Reports**:
   - Dynamic pivot reporting mirroring the spreadsheet right-side pivot tables.
   - Quarterly breakdown (Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar).
   - Month-by-month trajectory (e.g. `2026-Nov`).
   - Print-ready format (`Ctrl + P`) with dedicated print styles for physical records and audits.

5. **Google Sheets Sync & Data Transfer**:
   - **Copy for Sheets**: One-click copies tab-delimited records ready to paste (`Ctrl + V`) directly into Google Sheets without formatting loss.
   - **Export CSV**: Downloads formatted CSV matching the sheet headers.
   - **Import CSV**: Bulk import from CSV files or pasted text.
   - **Full JSON Backup**: Instant backup and restore.

6. **Offline-First & Persistent Storage**:
   - Uses browser **IndexedDB** with **LocalStorage** fallback.
   - No external server or database installation required to run.
   - Works 100% offline on any PC, laptop, or mobile device.

---

## 🚀 How to Push to GitHub

Git has already been initialized in this folder with all files committed on the `main` branch.

### Option 1: Using the 1-Click Script
1. Create a new empty repository on [GitHub](https://github.com/new) (e.g., named `dharshithan-finance-tracker`).
2. Double-click `push-to-github.bat` in this folder.
3. Paste your GitHub repo URL (e.g. `https://github.com/<your-username>/dharshithan-finance-tracker.git`) and press Enter!

### Option 2: Using the Command Line
```powershell
# Set your remote origin (replace with your repo URL)
git remote add origin https://github.com/<your-username>/dharshithan-finance-tracker.git
git branch -M main
git push -u origin main
```

---

## ⚡ How to Deploy to Vercel (Instant Live Website)

Once your code is pushed to GitHub, you can run this as a live web application in seconds:

1. **Sign in to Vercel**:
   Go to [vercel.com](https://vercel.com) and log in (or sign up using your GitHub account).
2. **Add New Project**:
   Click **"Add New..."** → **"Project"**.
3. **Import from GitHub**:
   Select your repository `dharshithan-finance-tracker` from the list and click **"Import"**.
4. **Deploy**:
   - Framework Preset: **Other** (detected automatically)
   - Root Directory: `./` (default)
   - Configuration is already pre-set in `vercel.json`!
   - Click **"Deploy"**!
5. **Access Your Live App**:
   In ~10–15 seconds, Vercel will give you a live production URL:  
   `https://dharshithan-finance-tracker.vercel.app`

You and your team can now access and use the finance tracker anytime from:
- Any desktop or laptop browser
- Any smartphone (Android/iPhone) with full responsive touch support!

---

## 📁 File Structure

```
Dharshithan Finance Tracker/
├── index.html            # Main single-page application interface
├── vercel.json           # Vercel deployment configuration & caching rules
├── start-app.bat         # 1-click Windows launcher (opens locally)
├── push-to-github.bat    # 1-click GitHub push assistant
├── README.md             # Documentation and developer guide
├── assets/
│   ├── logo.webp         # Official Dharshithan Waterproofing logo
│   └── favicon.webp      # Official branded browser favicon
├── css/
│   └── styles.css        # Enterprise styling, custom badges, print stylesheet
└── js/
    ├── app.js            # Main application controller, view switching, modal logic
    ├── db.js             # IndexedDB & LocalStorage persistent storage engine
    ├── analytics.js      # Indian FY calculation, INR currency formatters, aggregations
    ├── charts.js         # Interactive Chart.js visualizations
    └── export-import.js  # CSV/TSV Google Sheets exporter and importer
```
