/**
 * Dharshithan Waterproofing - Finance Tracker
 * Storage Engine (IndexedDB + LocalStorage Fallback)
 */

const DB_NAME = 'DharshithanFinanceDB';
const DB_VERSION = 1;
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

  // Calculate Indian Financial Year & Quarter from date string YYYY-MM-DD
  static getFinancialMetadata(dateStr) {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1 to 12

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

  getInitialSeed() {
    return [
      {
        id: 'seed-1',
        slNo: 1,
        date: '2026-11-01',
        type: 'Paid / Expense',
        partyName: 'Synstar Staffing & Software Solutions',
        category: 'Labor & Staffing',
        description: 'Payment for Business Provided',
        amount: 20000.0,
        mode: 'NETBANKING',
        refNumber: 'Paid Against Inv No: 001 from Synstar',
        quarter: 'Q3',
        financialYear: 'F.Y. 2026-27',
        profitValue: -20000.0,
        createdAt: new Date('2026-11-01T10:00:00Z').toISOString(),
        updatedAt: new Date('2026-11-01T10:00:00Z').toISOString(),
      },
      {
        id: 'seed-2',
        slNo: 2,
        date: '2026-11-01',
        type: 'Received / Income',
        partyName: 'Raj Enterprises',
        category: 'Client Waterproofing Project',
        description: 'Received for Client Tracking',
        amount: 40000.0,
        mode: 'CASH',
        refNumber: 'Received against Inv No:001 Generated',
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
        // Sort by date ascending, then slNo ascending
        list.sort((a, b) => {
          const dateDiff = new Date(a.date) - new Date(b.date);
          return dateDiff !== 0 ? dateDiff : (a.slNo || 0) - (b.slNo || 0);
        });
        resolve(list);
      };

      request.onerror = (e) => reject(e.target.error);
    });
  }

  async getById(id) {
    if (!this.db) {
      const all = await this.getAll();
      return all.find(item => item.id === id);
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async add(item, skipNotify = false) {
    const meta = FinanceDB.getFinancialMetadata(item.date);
    const amount = Math.abs(parseFloat(item.amount) || 0);
    const isIncome = item.type.includes('Received') || item.type.includes('Income');
    
    // Auto calculate sequential slNo if not provided
    const existing = await this.getAll();
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

    if (!this.db) {
      const all = await this.getAll();
      all.push(record);
      localStorage.setItem('dharshithan_transactions', JSON.stringify(all));
      if (!skipNotify) this.notify();
      return record;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);

      req.onsuccess = () => {
        if (!skipNotify) this.notify();
        resolve(record);
      };
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

    if (!this.db) {
      const all = await this.getAll();
      const idx = all.findIndex(x => x.id === id);
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
    if (!this.db) {
      const all = await this.getAll();
      const filtered = all.filter(x => x.id !== id);
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
