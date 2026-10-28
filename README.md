# Dharshithan Waterproofing - Finance Tracker Pro

A high-end, responsive, enterprise-grade financial management software designed specifically for **Dharshithan Waterproofing**, modeled directly on the company's master Google Spreadsheet:
> [Google Spreadsheet Source](https://docs.google.com/spreadsheets/d/1WWhXiHHrlUohpJUWhpKXfvqVSR_JUJJDGHFvOFk_Ltc/edit?usp=sharing)

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

## 🚀 Quick Start (Regular Use)

### Windows Users
Simply double-click `start-app.bat` or open `index.html` in Google Chrome, Microsoft Edge, or any modern web browser.

### Daily Workflow
1. **Record Daily Receipts & Expenses**:
   - Click the green **"Add Transaction"** button (or press `Ctrl + N`).
   - Fill in Date, Party Name, Amount (₹), Payment Mode, and Ref/Invoice details.
   - Quarter and Fiscal Year are auto-computed.
2. **Review Cash vs Bank**:
   - Check the **Bank Liquidity Position** widget on the dashboard to see if funds are in the bank or held as physical cash.
3. **Monthly / Quarterly Reporting**:
   - Go to the **P&L Reports** tab and click **"Print Statement"** for client or management reviews.
4. **Sync with Master Google Sheet**:
   - Click **"Copy for Sheets"** in the top bar, switch to your Google Sheet tab, and press `Ctrl + V` on row 2 of `Sheet1`.

---

## 📁 File Structure

```
Dharshithan Finance Tracker/
├── index.html            # Main single-page application interface
├── start-app.bat         # 1-click Windows launcher
├── README.md             # Documentation and developer guide
├── assets/
│   └── favicon.svg       # Custom branded logo
├── css/
│   └── styles.css        # Enterprise styling, custom scrollbars, print stylesheet
└── js/
    ├── app.js            # Main application controller, view switching, modal logic
    ├── db.js             # IndexedDB & LocalStorage persistent storage engine
    ├── analytics.js      # Indian FY calculation, INR currency formatters, aggregations
    ├── charts.js         # Interactive Chart.js visualizations
    └── export-import.js  # CSV/TSV Google Sheets exporter and importer
```

---

## 🛠️ Developer & Future Expansion Guide

### Packaging as a Desktop App
If you wish to wrap this into an installable desktop `.exe` in the future:
- **Tauri**: Fast and lightweight (~5MB executable using Windows WebView2).
- **Electron**: Standard cross-platform wrapper.

### Connecting Live Google Sheets API
If real-time bidirectional syncing directly via Google Cloud Service Accounts or OAuth2 is desired, `js/export-import.js` is structured so an authenticated REST fetch to `https://sheets.googleapis.com/v4/spreadsheets/...` can be dropped right in.
