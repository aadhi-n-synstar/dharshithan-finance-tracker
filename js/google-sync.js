/**
 * Dharshithan Waterproofing - Finance Tracker
 * Real-Time Google Sheets Live Sync Engine
 * Strictly synchronized with master Google Spreadsheet:
 * Sheet: https://docs.google.com/spreadsheets/d/1WWhXiHHrlUohpJUWhpKXfvqVSR_JUJJDGHFvOFk_Ltc/edit?usp=sharing
 * Web App: https://script.google.com/macros/s/AKfycbyqdg6OETWiEEc2r_aWvXPJ68CkMbGoPVwcbCCG1yYmSWyrFmRAfIDW2aVPufsiDFn7YQ/exec
 */

const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyqdg6OETWiEEc2r_aWvXPJ68CkMbGoPVwcbCCG1yYmSWyrFmRAfIDW2aVPufsiDFn7YQ/exec';
const MASTER_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1WWhXiHHrlUohpJUWhpKXfvqVSR_JUJJDGHFvOFk_Ltc/edit?usp=sharing';

class GoogleSheetsSync {
  constructor() {
    this.storageKey = 'dharshithan_gsheet_webhook';
    this.queueKey = 'dharshithan_sync_queue';
    this.sheetUrl = MASTER_SHEET_URL;
    
    // Always pre-populate the verified Web App URL
    const stored = localStorage.getItem(this.storageKey);
    this.syncUrl = stored ? stored.trim() : DEFAULT_WEBHOOK_URL;
    if (!stored) {
      localStorage.setItem(this.storageKey, this.syncUrl);
    }

    this.isSyncing = false;
    this.statusListeners = [];
    this.lastSyncTimestamp = null;
    this.lastRowCount = 0;

    // Auto-retry when connection comes back online
    window.addEventListener('online', () => {
      this.processQueue();
    });
  }

  getWebhookUrl() {
    return this.syncUrl || DEFAULT_WEBHOOK_URL;
  }

  getSheetUrl() {
    return this.sheetUrl;
  }

  setWebhookUrl(url) {
    this.syncUrl = (url || DEFAULT_WEBHOOK_URL).trim();
    localStorage.setItem(this.storageKey, this.syncUrl);
    this.notifyStatus(this.isConfigured() ? 'connected' : 'unconfigured');
  }

  isConfigured() {
    return !!this.syncUrl && this.syncUrl.startsWith('https://script.google.com/');
  }

  onStatusChange(fn) {
    this.statusListeners.push(fn);
  }

  notifyStatus(status, detail = '') {
    this.statusListeners.forEach(fn => fn(status, detail));
  }

  /**
   * Queue action if offline or webhook not yet responding
   */
  enqueue(action, data) {
    try {
      const q = JSON.parse(localStorage.getItem(this.queueKey) || '[]');
      q.push({ action, data, timestamp: Date.now() });
      localStorage.setItem(this.queueKey, JSON.stringify(q));
    } catch (e) {
      console.warn('Sync queue error:', e);
    }
  }

  async processQueue() {
    if (!this.isConfigured() || this.isSyncing) return;
    const qRaw = localStorage.getItem(this.queueKey);
    if (!qRaw) return;

    try {
      const q = JSON.parse(qRaw);
      if (!q.length) return;

      this.isSyncing = true;
      this.notifyStatus('syncing', `Processing ${q.length} queued items...`);

      const remaining = [];
      for (const item of q) {
        try {
          await this.sendRequest(item.action, item.data);
        } catch (err) {
          remaining.push(item);
        }
      }

      localStorage.setItem(this.queueKey, JSON.stringify(remaining));
      this.isSyncing = false;
      this.notifyStatus(remaining.length === 0 ? 'connected' : 'error', remaining.length ? `${remaining.length} items pending` : 'All synced');
    } catch (err) {
      this.isSyncing = false;
    }
  }

  async sendRequest(action, payload) {
    if (!this.isConfigured()) return { success: false, reason: 'unconfigured' };

    const body = {
      action: action,
      ...payload
    };

    // Google Apps Script requires text/plain or redirects handling for CORS
    const response = await fetch(this.syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return data;
  }

  /**
   * Live Sync: Add Transaction
   */
  async add(transaction) {
    if (!this.isConfigured()) return;
    this.notifyStatus('syncing', 'Syncing new entry to Google Sheet...');
    try {
      const res = await this.sendRequest('add', { transaction });
      this.notifyStatus('connected', 'Synced with Google Sheet');
      return res;
    } catch (err) {
      console.warn('Live sync add failed, queued for retry:', err);
      this.enqueue('add', { transaction });
      this.notifyStatus('offline', 'Queued for Google Sheet sync');
    }
  }

  /**
   * Live Sync: Update Transaction
   */
  async update(transaction) {
    if (!this.isConfigured()) return;
    this.notifyStatus('syncing', `Syncing update #${transaction.slNo}...`);
    try {
      const res = await this.sendRequest('update', { transaction });
      this.notifyStatus('connected', 'Synced with Google Sheet');
      return res;
    } catch (err) {
      console.warn('Live sync update failed, queued for retry:', err);
      this.enqueue('update', { transaction });
      this.notifyStatus('offline', 'Queued for Google Sheet sync');
    }
  }

  /**
   * Live Sync: Delete Transaction
   */
  async delete(slNo) {
    if (!this.isConfigured()) return;
    this.notifyStatus('syncing', `Deleting #${slNo} from Google Sheet...`);
    try {
      const res = await this.sendRequest('delete', { slNo });
      this.notifyStatus('connected', 'Deleted from Google Sheet');
      return res;
    } catch (err) {
      console.warn('Live sync delete failed, queued for retry:', err);
      this.enqueue('delete', { slNo });
      this.notifyStatus('offline', 'Queued for Google Sheet delete');
    }
  }

  /**
   * Live Sync: Full Sync All
   */
  async syncAll(transactions) {
    if (!this.isConfigured()) return;
    this.notifyStatus('syncing', 'Syncing entire ledger to Google Sheet...');
    try {
      const res = await this.sendRequest('syncAll', { transactions });
      this.notifyStatus('connected', `Synced ${transactions.length} items`);
      return res;
    } catch (err) {
      console.warn('Live syncAll failed:', err);
      this.notifyStatus('error', 'Google Sheet sync failed');
      throw err;
    }
  }

  /**
   * Pull latest rows directly from Google Sheets Web App
   */
  async fetchFromSheet() {
    if (!this.isConfigured()) return null;
    this.notifyStatus('syncing', 'Fetching live from Google Sheet...');
    try {
      const sep = this.syncUrl.includes('?') ? '&' : '?';
      const endpoint = `${this.syncUrl}${sep}action=getAll&t=${Date.now()}`;
      
      const res = await fetch(endpoint, {
        method: 'GET',
        redirect: 'follow',
        headers: { 'Accept': 'application/json' }
      });

      const data = await res.json();
      if (data && data.success && Array.isArray(data.transactions)) {
        this.lastSyncTimestamp = new Date();
        this.lastRowCount = data.transactions.length;
        this.notifyStatus('connected', `Synced ${data.transactions.length} entries`);
        return data.transactions;
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch from Google Sheet Web App:', err);
      this.notifyStatus('error', 'Failed to fetch from Google Sheet');
      return null;
    }
  }
}

window.googleSync = new GoogleSheetsSync();
