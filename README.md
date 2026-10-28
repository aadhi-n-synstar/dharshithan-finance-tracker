# Dharshithan Waterproofing - Finance Tracker Pro

<p align="center">
  <img src="assets/logo.webp" alt="Dharshithan Waterproofing Logo" width="130" style="border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
  <br>
  <strong>Enterprise Financial Management & Live Cashflow Software</strong><br>
  <em>Built for Dharshithan Waterproofing & Complete Solutions</em>
</p>

---

## 🌟 What's New: Real-Time Google Sheets Sync & Android App Mode

### 1. 🔄 Immediate 2-Way Google Sheets Sync
- **Instant Reflection**: Any transaction you **Add**, **Edit**, or **Delete** inside the software is immediately updated in your [Google Sheet](https://docs.google.com/spreadsheets/d/1WWhXiHHrlUohpJUWhpKXfvqVSR_JUJJDGHFvOFk_Ltc/edit?usp=sharing) in real time!
- **Dashboard & Formulas Updated**: Updates `Sheet1` rows and recalculates the `Dashboard` sheet metrics (Turnover, Expenses, Net Standing, Payment Modes, Bank Balance, Cash in Hand).
- **Offline Resilient Queue**: If internet drops on a mobile site, changes are queued locally in IndexedDB and automatically synced as soon as internet is restored.
- **Pull & Push Controls**: One-click buttons to pull remote changes from Google Sheets or push your entire local database.

### 2. 📱 Native Android App Experience
- **PWA (Progressive Web App)**: Installable directly on any Android phone without needing Google Play Store!
- **Android Bottom Navigation Bar**: Quick navigation for Home, Ledger, Parties, P&L Reports, and Sync.
- **Android Floating Action Button (FAB)**: Quick-entry `+` button anchored at the bottom-right for rapid on-site receipt/voucher entry.
- **Touch-Friendly Mobile Cards**: Responsive transaction feed with colorful party avatars, bold INR amounts, and quick touch actions (Edit/Delete).
- **Mobile Bottom Sheets**: Modals glide up smoothly from the bottom with native Android drag handles.

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
   - That's it! Every change you make in the software will now immediately reflect in your Google Sheet!

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
├── index.html            # Light theme, mobile-first Android app UI
├── manifest.json         # Android PWA Web App Manifest
├── sw.js                 # Service worker for offline caching & Android installability
├── google-apps-script.js # Google Sheets Webhook Backend for real-time 2-way sync
├── vercel.json           # Vercel deployment configuration & caching rules
├── start-app.bat         # 1-click Windows launcher
├── push-to-github.bat    # 1-click GitHub push script
├── README.md             # Documentation
├── assets/
│   ├── logo.webp         # Official company logo
│   └── favicon.webp      # Branded browser favicon & app icon
├── css/
│   └── styles.css        # Material Design 3 inspired Android UI & Light Theme
└── js/
    ├── app.js            # Main application controller & Android view orchestrator
    ├── google-sync.js    # Real-time Google Sheets Live Sync engine
    ├── db.js             # IndexedDB & LocalStorage persistent storage
    ├── analytics.js      # Indian FY, Quarters, and INR calculations
    ├── charts.js         # Interactive Chart.js visualizations
    └── export-import.js  # CSV/TSV Google Sheets exporter & importer
```
