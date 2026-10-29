/**
 * Dharshithan Waterproofing - Finance Tracker
 * Storage Engine (IndexedDB + LocalStorage Fallback)
 * Synced with Master Google Spreadsheet: 1WWhXiHHrlUohpJUWhpKXfvqVSR_JUJJDGHFvOFk_Ltc
 */

const DB_NAME = 'DharshithanFinanceDB';
const DB_VERSION = 2;
const STORE_NAME = 'transactions';

class FinanceDB {
  constructor() {
    this.db = null;
    this.isReady = false;
    this.listeners = [];
  }

  async init() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, falling back to LocalStorage');
        this.isReady = true;
        this.ensureInitialDataLocalStorage();
        resolve(this);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('partyName', 'partyName', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('mode', 'mode', { unique: false });
          store.createIndex('quarter', 'quarter', { unique: false });
          store.createIndex('financialYear', 'financialYear', { unique: false });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        this.isReady = true;
        await this.ensureInitialSeedData();
        resolve(this);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        this.isReady = true;
        this.ensureInitialDataLocalStorage();
        resolve(this);
      };
    });
  }

  static getFinancialMetadata(dateStr) {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;

    let fyStart, fyEnd, quarter;
    if (month >= 4) {
      fyStart = year;
      fyEnd = (year + 1).toString().slice(-2);
      if (month <= 6) quarter = 'Q1';
      else if (month <= 9) quarter = 'Q2';
      else quarter = 'Q3';
    } else {
      fyStart = year - 1;
      fyEnd = year.toString().slice(-2);
      quarter = 'Q4';
    }

    const financialYear = `F.Y. ${fyStart}-${fyEnd}`;
    return { financialYear, quarter };
  }

  /**
   * Matches exact live rows from Dharshithan Waterproofing Google Sheet:
   * 1. David | Given Weekly Salary | ₹ 1,200.00 | CASH | PYSL-001 | Q3 | -₹ 1,200.00
   * 2. Synstar | Paid for Client Tracking | ₹ 20,000.00 | CASH | - | Q3 | -₹ 20,000.00
   * 3. Raj Enterprises | Received for Client Work | ₹ 40,000.00 | NETBANKING | Q3 | ₹ 40,000.00
   */
  getInitialSeed() {
    return [
      {
        id: 'txn-seed-1',
        slNo: 1,
        date: '2026-11-01',
        type: 'Paid / Expense',
        partyName: 'David',
        category: 'Staff & Salary',
        description: 'Given Weekly Salary',
        amount: 1200.0,
        mode: 'CASH',
        refNumber: 'PYSL-001',
        quarter: 'Q3',
        financialYear: 'F.Y. 2026-27',
        profitValue: -1200.0,
        createdAt: new Date('2026-11-01T09:00:00Z').toISOString(),
        updatedAt: new Date('2026-11-01T09:00:00Z').toISOString(),
      },
      {
        id: 'txn-seed-2',
        slNo: 2,
        date: '2026-11-01',
        type: 'Paid / Expense',
        partyName: 'Synstar',
        category: 'Software & Tracking',
        description: 'Paid for Client Tracking',
        amount: 20000.0,
        mode: 'CASH',
        refNumber: '-',
        quarter: 'Q3',
        financialYear: 'F.Y. 2026-27',
        profitValue: -20000.0,
        createdAt: new Date('2026-11-01T10:00:00Z').toISOString(),
        updatedAt: new Date('2026-11-01T10:00:00Z').toISOString(),
      },
      {
        id: 'txn-seed-3',
        slNo: 3,
        date: '2026-11-01',
        type: 'Received / Income',
        partyName: 'Raj Enterprises',
        category: 'Client Waterproofing',
        description: 'Received for Client Work',
        amount: 40000.0,
        mode: 'NETBANKING',
        refNumber: '',
        quarter: 'Q3',
        financialYear: 'F.Y. 2026-27',
        profitValue: 40000.0,
        createdAt: new Date('2026-11-01T11:30:00Z').toISOString(),
        updatedAt: new Date('2026-11-01T11:30:00Z').toISOString(),
      }
    ];
  }

  async ensureInitialSeedData() {
    const all = await this.getAll();
    if (!all || all.length === 0) {
      const initial = this.getInitialSeed();
      for (const item of initial) {
        await this.add(item, true);
      }
    }
  }

  ensureInitialDataLocalStorage() {
    const raw = localStorage.getItem('dharshithan_transactions');
    if (!raw) {
      localStorage.setItem('dharshithan_transactions', JSON.stringify(this.getInitialSeed()));
    }
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }

  async getAll() {
    // 1. First try Neon Cloud Database via /api/transactions
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const body = await res.json();
        if (body.success && Array.isArray(body.data)) {
          // Cache locally in IndexedDB/LocalStorage for offline reliability
          this.syncLocalCache(body.data);
          return body.data;
        }
      }
    } catch (err) {
      console.warn('Neon Cloud API offline or unreachable, serving from local cache:', err);
    }

    // 2. Fallback to Local IndexedDB or LocalStorage
    return this.getLocalAll();
  }

  async getLocalAll() {
    if (!this.db) {
      try {
        const raw = localStorage.getItem('dharshithan_transactions');
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const list = request.result || [];
        list.sort((a, b) => {
          const dateDiff = new Date(a.date) - new Date(b.date);
          return dateDiff !== 0 ? dateDiff : (a.slNo || 0) - (b.slNo || 0);
        });
        resolve(list);
      };

      request.onerror = (e) => reject(e.target.error);
    });
  }

  async syncLocalCache(records) {
    if (!this.db) {
      localStorage.setItem('dharshithan_transactions', JSON.stringify(records));
      return;
    }
    try {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      await store.clear();
      for (const r of records) {
        store.put(r);
      }
    } catch (e) {
      localStorage.setItem('dharshithan_transactions', JSON.stringify(records));
    }
  }

  async getById(id) {
    const all = await this.getAll();
    return all.find(item => String(item.id) === String(id) || String(item.slNo) === String(id));
  }

  async add(item, skipNotify = false) {
    const meta = FinanceDB.getFinancialMetadata(item.date);
    const amount = Math.abs(parseFloat(item.amount) || 0);
    const isIncome = item.type.includes('Received') || item.type.includes('Income');
    
    const existing = await this.getLocalAll();
    const nextSlNo = item.slNo || (existing.length > 0 ? Math.max(...existing.map(x => x.slNo || 0)) + 1 : 1);

    const record = {
      ...item,
      id: item.id || 'txn-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      slNo: nextSlNo,
      amount: amount,
      quarter: item.quarter || meta.quarter,
      financialYear: item.financialYear || meta.financialYear,
      profitValue: isIncome ? amount : -amount,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Commit directly to Neon Cloud Database
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success && body.data) {
          record.id = body.data.id;
          record.slNo = body.data.slNo;
        }
      }
    } catch (err) {
      console.warn('Neon Cloud API POST offline, committing locally:', err);
    }

    // 2. Commit to Local Storage / IndexedDB
    await this.addLocal(record);
    if (!skipNotify) this.notify();
    return record;
  }

  async addLocal(record) {
    if (!this.db) {
      const all = await this.getLocalAll();
      all.push(record);
      localStorage.setItem('dharshithan_transactions', JSON.stringify(all));
      return record;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async update(id, updates) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Transaction not found');

    const meta = FinanceDB.getFinancialMetadata(updates.date || existing.date);
    const amount = updates.amount !== undefined ? Math.abs(parseFloat(updates.amount) || 0) : existing.amount;
    const type = updates.type || existing.type;
    const isIncome = type.includes('Received') || type.includes('Income');

    const updated = {
      ...existing,
      ...updates,
      amount,
      type,
      quarter: updates.quarter || meta.quarter,
      financialYear: updates.financialYear || meta.financialYear,
      profitValue: isIncome ? amount : -amount,
      updatedAt: new Date().toISOString()
    };

    // 1. Commit update to Neon Cloud Database
    try {
      await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Neon Cloud API PUT offline, updating locally:', err);
    }

    // 2. Commit update to local storage
    if (!this.db) {
      const all = await this.getLocalAll();
      const idx = all.findIndex(x => String(x.id) === String(id) || String(x.slNo) === String(id));
      if (idx !== -1) {
        all[idx] = updated;
        localStorage.setItem('dharshithan_transactions', JSON.stringify(all));
      }
      this.notify();
      return updated;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(updated);

      req.onsuccess = () => {
        this.notify();
        resolve(updated);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async delete(id) {
    // 1. Commit delete to Neon Cloud Database
    try {
      await fetch(`/api/transactions?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Neon Cloud API DELETE offline, deleting locally:', err);
    }

    // 2. Commit delete to local storage
    if (!this.db) {
      const all = await this.getLocalAll();
      const filtered = all.filter(x => String(x.id) !== String(id) && String(x.slNo) !== String(id));
      localStorage.setItem('dharshithan_transactions', JSON.stringify(filtered));
      this.notify();
      return true;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => {
        this.notify();
        resolve(true);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async clearAll() {
    if (!this.db) {
      localStorage.removeItem('dharshithan_transactions');
      this.notify();
      return true;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => {
        this.notify();
        resolve(true);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async resetToSample() {
    await this.clearAll();
    const seed = this.getInitialSeed();
    for (const s of seed) {
      await this.add(s, true);
    }
    this.notify();
  }
}

window.financeDB = new FinanceDB();
