/* =========================================================
   نظامي — طبقة قاعدة البيانات
   IndexedDB منظمة + بديل تلقائي آمن عند تعذر التخزين
   ========================================================= */
'use strict';

const DB_NAME = 'nizami_db';
const DB_VERSION = 5;
const SCHEMA_VERSION = 5;
const FALLBACK_KEY = 'nizami_fallback_v1';

const STORE_DEFS = {
  habits: {
    keyPath: 'id',
    indexes: [
      ['createdAt', 'createdAt', {}]
    ]
  },
  habit_logs: {
    keyPath: 'id',
    indexes: [
      ['habitId', 'habitId', {}],
      ['date', 'date', {}],
      ['habit_date', ['habitId', 'date'], { unique: true }]
    ]
  },
  tasks: {
    keyPath: 'id',
    indexes: [
      ['dueDate', 'dueDate', {}],
      ['status', 'status', {}],
      ['goalId', 'goalId', {}],
      ['createdAt', 'createdAt', {}]
    ]
  },
  goals: {
    keyPath: 'id',
    indexes: [
      ['status', 'status', {}],
      ['createdAt', 'createdAt', {}]
    ]
  },
  goal_milestones: {
    keyPath: 'id',
    indexes: [
      ['goalId', 'goalId', {}],
      ['order', 'order', {}]
    ]
  },
  sleep_records: {
    keyPath: 'id',
    indexes: [
      ['date', 'date', {}],
      ['startDate', 'startDate', {}],
      ['type', 'type', {}]
    ]
  },
  reminders: {
    keyPath: 'id',
    indexes: [
      ['date', 'date', {}],
      ['status', 'status', {}],
      ['linkId', 'linkId', {}],
      ['createdAt', 'createdAt', {}]
    ]
  },
  prayer_logs: {
    keyPath: 'id',
    indexes: [
      ['date', 'date', {}],
      ['prayer', 'prayer', {}],
      ['date_prayer', ['date', 'prayer'], { unique: true }],
      ['updatedAt', 'updatedAt', {}]
    ]
  },
  adhan_library: {
    keyPath: 'id',
    indexes: [
      ['type', 'type', {}],
      ['sourceId', 'sourceId', {}],
      ['reciter', 'reciter', {}],
      ['addedAt', 'addedAt', {}]
    ]
  },
  adhan_blobs: {
    keyPath: 'id',
    indexes: [
      ['libraryId', 'libraryId', {}],
      ['addedAt', 'addedAt', {}]
    ]
  },
  activity_logs: {
    keyPath: 'id',
    indexes: [
      ['timestamp', 'timestamp', {}],
      ['action', 'action', {}],
      ['entityType', 'entityType', {}],
      ['entityId', 'entityId', {}]
    ]
  },
  settings: {
    keyPath: 'key',
    indexes: []
  },
  finance_accounts: {
    keyPath: 'id',
    indexes: [
      ['type', 'type', {}],
      ['archived', 'archived', {}],
      ['createdAt', 'createdAt', {}]
    ]
  },
  finance_categories: {
    keyPath: 'id',
    indexes: [
      ['type', 'type', {}],
      ['parentId', 'parentId', {}],
      ['createdAt', 'createdAt', {}]
    ]
  },
  finance_transactions: {
    keyPath: 'id',
    indexes: [
      ['accountId', 'accountId', {}],
      ['toAccountId', 'toAccountId', {}],
      ['type', 'type', {}],
      ['categoryId', 'categoryId', {}],
      ['date', 'date', {}],
      ['datetime', 'datetime', {}],
      ['obligationId', 'obligationId', {}],
      ['debtId', 'debtId', {}],
      ['savingsGoalId', 'savingsGoalId', {}],
      ['linkedGroupId', 'linkedGroupId', {}],
      ['createdAt', 'createdAt', {}]
    ]
  },
  finance_obligations: {
    keyPath: 'id',
    indexes: [
      ['accountId', 'accountId', {}],
      ['status', 'status', {}],
      ['dueDate', 'dueDate', {}],
      ['type', 'type', {}],
      ['createdAt', 'createdAt', {}]
    ]
  },
  finance_obligation_payments: {
    keyPath: 'id',
    indexes: [
      ['obligationId', 'obligationId', {}],
      ['transactionId', 'transactionId', {}],
      ['date', 'date', {}]
    ]
  },
  finance_debts: {
    keyPath: 'id',
    indexes: [
      ['status', 'status', {}],
      ['dueDate', 'dueDate', {}],
      ['createdAt', 'createdAt', {}]
    ]
  },
  finance_debt_payments: {
    keyPath: 'id',
    indexes: [
      ['debtId', 'debtId', {}],
      ['transactionId', 'transactionId', {}],
      ['date', 'date', {}]
    ]
  },
  finance_savings_goals: {
    keyPath: 'id',
    indexes: [
      ['accountId', 'accountId', {}],
      ['status', 'status', {}],
      ['targetDate', 'targetDate', {}],
      ['createdAt', 'createdAt', {}]
    ]
  },
  finance_savings_entries: {
    keyPath: 'id',
    indexes: [
      ['goalId', 'goalId', {}],
      ['transactionId', 'transactionId', {}],
      ['date', 'date', {}],
      ['type', 'type', {}]
    ]
  },
  finance_budgets: {
    keyPath: 'id',
    indexes: [
      ['scope', 'scope', {}],
      ['period', 'period', {}],
      ['accountType', 'accountType', {}],
      ['categoryId', 'categoryId', {}]
    ]
  },
  finance_income_schedules: {
    keyPath: 'id',
    indexes: [
      ['accountId', 'accountId', {}],
      ['enabled', 'enabled', {}],
      ['dayOfMonth', 'dayOfMonth', {}]
    ]
  },
  finance_attachments: {
    keyPath: 'id',
    indexes: [
      ['transactionId', 'transactionId', {}],
      ['addedAt', 'addedAt', {}]
    ]
  },
  templates: {
    keyPath: 'id',
    indexes: [
      ['entityType', 'entityType', {}],
      ['isFavorite', 'isFavorite', {}],
      ['createdAt', 'createdAt', {}],
      ['updatedAt', 'updatedAt', {}]
    ]
  }
};

const STORE_NAMES = Object.keys(STORE_DEFS);

const CAMEL_TO_STORE = {
  habitLogs: 'habit_logs',
  goalMilestones: 'goal_milestones',
  sleepRecords: 'sleep_records',
  activityLogs: 'activity_logs',
  prayerLogs: 'prayer_logs',
  adhanLibrary: 'adhan_library',
  financeAccounts: 'finance_accounts',
  financeCategories: 'finance_categories',
  financeTransactions: 'finance_transactions',
  financeObligations: 'finance_obligations',
  financeObligationPayments: 'finance_obligation_payments',
  financeDebts: 'finance_debts',
  financeDebtPayments: 'finance_debt_payments',
  financeSavingsGoals: 'finance_savings_goals',
  financeSavingsEntries: 'finance_savings_entries',
  financeBudgets: 'finance_budgets',
  financeIncomeSchedules: 'finance_income_schedules',
  financeAttachments: 'finance_attachments',
  templates: 'templates'
};
const STORE_TO_CAMEL = {
  habit_logs: 'habitLogs',
  goal_milestones: 'goalMilestones',
  sleep_records: 'sleepRecords',
  activity_logs: 'activityLogs',
  prayer_logs: 'prayerLogs',
  adhan_library: 'adhanLibrary',
  finance_accounts: 'financeAccounts',
  finance_categories: 'financeCategories',
  finance_transactions: 'financeTransactions',
  finance_obligations: 'financeObligations',
  finance_obligation_payments: 'financeObligationPayments',
  finance_debts: 'financeDebts',
  finance_debt_payments: 'financeDebtPayments',
  finance_savings_goals: 'financeSavingsGoals',
  finance_savings_entries: 'financeSavingsEntries',
  finance_budgets: 'financeBudgets',
  finance_income_schedules: 'financeIncomeSchedules',
  finance_attachments: 'financeAttachments',
  templates: 'templates'
};

const BACKUP_EXCLUDED_STORES = new Set([]);

/**
 * ترحيلات هيكل البيانات.
 * كل ترحيل يعمل مرة واحدة فقط عند رفع DB_VERSION.
 * لا نحذف أي مخزن أو بيانات موجودة، بل نضيف/نعدّل بأمان.
 */
const DB_MIGRATIONS = [
  {
    version: 1,
    name: 'البنية الأساسية المنظمة',
    migrate(db, transaction) {
      for (const [storeName, def] of Object.entries(STORE_DEFS)) {
        let store;
        if (!db.objectStoreNames.contains(storeName)) {
          store = db.createObjectStore(storeName, { keyPath: def.keyPath });
        } else {
          store = transaction.objectStore(storeName);
        }
        for (const [indexName, keyPath, options] of def.indexes) {
          if (!store.indexNames.contains(indexName)) {
            store.createIndex(indexName, keyPath, options);
          }
        }
      }
    }
  },
  {
    version: 2,
    name: 'سجلات الصلاة',
    migrate(db, transaction) {
      if (!db.objectStoreNames.contains('prayer_logs')) {
        const store = db.createObjectStore('prayer_logs', { keyPath: 'id' });
        for (const [indexName, keyPath, options] of STORE_DEFS.prayer_logs.indexes) {
          store.createIndex(indexName, keyPath, options);
        }
      }
    }
  },
  {
    version: 3,
    name: 'مكتبة الأذان المحلية',
    migrate(db, transaction) {
      for (const storeName of ['adhan_library', 'adhan_blobs']) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          for (const [indexName, keyPath, options] of STORE_DEFS[storeName].indexes) {
            store.createIndex(indexName, keyPath, options);
          }
        }
      }
    }
  },
  {
    version: 4,
    name: 'وحدة ماليّاتي',
    migrate(db, transaction) {
      const financeStores = [
        'finance_accounts', 'finance_categories', 'finance_transactions',
        'finance_obligations', 'finance_obligation_payments', 'finance_debts',
        'finance_debt_payments', 'finance_savings_goals', 'finance_savings_entries',
        'finance_budgets', 'finance_income_schedules', 'finance_attachments'
      ];
      for (const storeName of financeStores) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          for (const [indexName, keyPath, options] of STORE_DEFS[storeName].indexes) {
            store.createIndex(indexName, keyPath, options);
          }
        }
      }
    }
  },
  {
    version: 5,
    name: 'مكتبة القوالب والعناصر المحفوظة',
    migrate(db, transaction) {
      if (!db.objectStoreNames.contains('templates')) {
        const store = db.createObjectStore('templates', { keyPath: 'id' });
        for (const [indexName, keyPath, options] of STORE_DEFS.templates.indexes) {
          store.createIndex(indexName, keyPath, options);
        }
      }
    }
  }
  // ترحيلات مستقبلية تُضاف هنا: { version: 6, migrate(db, tx) { ... } }
];

let dbHandle = null;
let dbMode = 'idle'; // idle | indexeddb | fallback
let dbOpenError = null;
let fallbackData = null;

/* ---------------- التخزين البديل ---------------- */
function loadFallbackData() {
  if (fallbackData) return fallbackData;
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    fallbackData = raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('[نظامي] تعذر قراءة التخزين البديل', error);
    fallbackData = {};
  }
  if (!fallbackData || typeof fallbackData !== 'object') fallbackData = {};
  for (const name of STORE_NAMES) {
    if (!Array.isArray(fallbackData[name])) fallbackData[name] = [];
  }
  return fallbackData;
}

function persistFallback() {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(fallbackData));
  } catch (error) {
    const err = new Error('تعذر حفظ البيانات محليًا. قد تكون مساحة التخزين ممتلئة.');
    err.cause = error;
    throw err;
  }
}

function enableFallback(reason) {
  dbOpenError = reason || new Error('IndexedDB غير متاح');
  dbMode = 'fallback';
  loadFallbackData();
  console.warn('[نظامي] تم تفعيل التخزين البديل:', dbOpenError?.message);
}

/* ---------------- فتح قاعدة البيانات ---------------- */
function openWithTimeout() {
  return new Promise((resolve, reject) => {
    let settled = false;
    let request;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('انتهت مهلة فتح قاعدة البيانات'));
    }, 9000);

    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (error) {
      clearTimeout(timer);
      reject(error);
      return;
    }

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const transaction = request.transaction;
      const oldVersion = event.oldVersion || 0;
      try {
        for (const migration of DB_MIGRATIONS) {
          if (migration.version > oldVersion) {
            migration.migrate(db, transaction);
          }
        }
      } catch (error) {
        console.error('[نظامي] فشل ترحيل قاعدة البيانات', error);
        try { transaction.abort(); } catch {}
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(error);
        }
      }
    };

    request.onsuccess = () => {
      if (settled) {
        try { request.result.close(); } catch {}
        return;
      }
      settled = true;
      clearTimeout(timer);
      dbHandle = request.result;
      dbHandle.onversionchange = () => {
        try { dbHandle.close(); } catch {}
        dbHandle = null;
        dbMode = 'idle';
      };
      resolve();
    };

    request.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(request.error || new Error('تعذر فتح قاعدة البيانات'));
    };

    request.onblocked = () => {
      console.warn('[نظامي] قاعدة البيانات مفتوحة في تبويب آخر وتنتظر الإغلاق');
    };
  });
}

async function openDatabase() {
  if (dbMode === 'indexeddb' && dbHandle) return;
  if (dbMode === 'fallback') return;
  if (!('indexedDB' in window)) {
    enableFallback(new Error('المتصفح لا يدعم IndexedDB'));
    return;
  }
  try {
    await openWithTimeout();
    dbMode = 'indexeddb';
    dbOpenError = null;
  } catch (error) {
    enableFallback(error);
  }
}

/* ---------------- عمليات IndexedDB ---------------- */
function runTransaction(storeName, mode, action) {
  return new Promise((resolve, reject) => {
    if (!dbHandle) {
      reject(new Error('قاعدة البيانات غير مفتوحة'));
      return;
    }
    let transaction;
    let request = null;
    try {
      transaction = dbHandle.transaction(storeName, mode);
      request = action(transaction.objectStore(storeName));
    } catch (error) {
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve(request ? request.result : undefined);
    transaction.onerror = () => reject(transaction.error || new Error('خطأ في قاعدة البيانات'));
    transaction.onabort = () => reject(transaction.error || new Error('أُلغيت عملية قاعدة البيانات'));
  });
}

function runMultiTransaction(storeNames, mode, action) {
  return new Promise((resolve, reject) => {
    if (!dbHandle) {
      reject(new Error('قاعدة البيانات غير مفتوحة'));
      return;
    }
    let transaction;
    try {
      transaction = dbHandle.transaction(storeNames, mode);
      action(transaction);
    } catch (error) {
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('خطأ في قاعدة البيانات'));
    transaction.onabort = () => reject(transaction.error || new Error('أُلغيت عملية قاعدة البيانات'));
  });
}

const DB = {
  async open() {
    await openDatabase();
    return { mode: dbMode, error: dbOpenError };
  },

  mode() { return dbMode; },
  error() { return dbOpenError; },
  isFallback() { return dbMode === 'fallback'; },

  async getAll(storeName) {
    await openDatabase();
    if (dbMode === 'fallback') {
      return loadFallbackData()[storeName].map((record) => ({ ...record }));
    }
    return runTransaction(storeName, 'readonly', (store) => store.getAll());
  },

  async getAllByIndex(storeName, indexName, value) {
    await openDatabase();
    if (dbMode === 'fallback') {
      const result = loadFallbackData()[storeName].filter((record) => {
        const recordValue = record[indexName];
        if (Array.isArray(recordValue)) return recordValue.includes(value);
        return recordValue === value;
      });
      return result.map((record) => ({ ...record }));
    }
    return runTransaction(storeName, 'readonly', (store) => store.index(indexName).getAll(value));
  },

  async get(storeName, key) {
    await openDatabase();
    if (dbMode === 'fallback') {
      return loadFallbackData()[storeName].find((r) => r.id === key || r.key === key) || null;
    }
    const result = await runTransaction(storeName, 'readonly', (store) => store.get(key));
    return result || null;
  },

  async put(storeName, record) {
    await openDatabase();
    if (dbMode === 'fallback') {
      const data = loadFallbackData();
      const keyPath = STORE_DEFS[storeName].keyPath;
      const index = data[storeName].findIndex((r) => r[keyPath] === record[keyPath]);
      if (index >= 0) data[storeName][index] = { ...record };
      else data[storeName].push({ ...record });
      persistFallback();
      return record;
    }
    await runTransaction(storeName, 'readwrite', (store) => store.put(record));
    return record;
  },

  async bulkPut(storeName, records) {
    if (!records.length) return;
    await openDatabase();
    if (dbMode === 'fallback') {
      const data = loadFallbackData();
      const keyPath = STORE_DEFS[storeName].keyPath;
      for (const record of records) {
        const index = data[storeName].findIndex((r) => r[keyPath] === record[keyPath]);
        if (index >= 0) data[storeName][index] = { ...record };
        else data[storeName].push({ ...record });
      }
      persistFallback();
      return;
    }
    await runTransaction(storeName, 'readwrite', (store) => {
      for (const record of records) store.put(record);
      return null;
    });
  },

  async remove(storeName, key) {
    await openDatabase();
    if (dbMode === 'fallback') {
      const data = loadFallbackData();
      const keyPath = STORE_DEFS[storeName].keyPath;
      data[storeName] = data[storeName].filter((r) => r[keyPath] !== key);
      persistFallback();
      return;
    }
    await runTransaction(storeName, 'readwrite', (store) => store.delete(key));
  },

  async bulkRemove(storeName, keys) {
    if (!keys.length) return;
    await openDatabase();
    if (dbMode === 'fallback') {
      const data = loadFallbackData();
      const keyPath = STORE_DEFS[storeName].keyPath;
      const keySet = new Set(keys);
      data[storeName] = data[storeName].filter((r) => !keySet.has(r[keyPath]));
      persistFallback();
      return;
    }
    await runTransaction(storeName, 'readwrite', (store) => {
      for (const key of keys) store.delete(key);
      return null;
    });
  },

  async clear(storeName) {
    await openDatabase();
    if (dbMode === 'fallback') {
      loadFallbackData()[storeName] = [];
      persistFallback();
      return;
    }
    await runTransaction(storeName, 'readwrite', (store) => store.clear());
  },

  async count(storeName) {
    await openDatabase();
    if (dbMode === 'fallback') return loadFallbackData()[storeName].length;
    return runTransaction(storeName, 'readonly', (store) => store.count());
  },

  async clearAll() {
    await openDatabase();
    for (const name of STORE_NAMES) {
      await DB.clear(name);
    }
  },

  async exportData() {
    await openDatabase();
    const stores = {};
    for (const name of STORE_NAMES) {
      const records = await DB.getAll(name);
      // تحويل ملفات Blob إلى base64 للتضمين في النسخة الاحتياطية
      if (name === 'adhan_blobs' || name === 'finance_attachments') {
        stores[name] = await Promise.all(records.map(async (record) => {
          const serialized = { ...record };
          if (record.blob && typeof Blob !== 'undefined' && record.blob instanceof Blob) {
            serialized.blob = await blobToBase64(record.blob);
            serialized.blobType = 'base64';
          } else if (record.dataUrl) {
            serialized.dataUrl = record.dataUrl;
            serialized.blobType = 'dataurl';
          }
          delete serialized.blob;
          return serialized;
        }));
      } else {
        stores[name] = records;
      }
    }
    return {
      app: 'نظامي',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      timezone: TZ,
      stores
    };
  },

  /**
   * التحقق من سلامة ملف النسخة الاحتياطية قبل الاستيراد.
   * يعيد تقريرًا أوليًا عن المحتوى دون تعديل البيانات الحالية.
   */
  async validateBackup(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('ملف النسخة الاحتياطية غير صالح');
    }
    const source = payload.stores || payload.data || payload;
    const report = {
      valid: false,
      app: payload.app || '',
      schemaVersion: payload.schemaVersion || null,
      exportedAt: payload.exportedAt || null,
      stores: {},
      totalRecords: 0,
      errors: []
    };

    if (payload.app && payload.app !== 'نظامي') {
      report.errors.push('هذا الملف لا يبدو نسخة احتياطية من تطبيق نظامي');
      return report;
    }

    let foundAny = false;
    for (const name of STORE_NAMES) {
      const camel = STORE_TO_CAMEL[name];
      let records = source[name];
      if (!Array.isArray(records) && camel && Array.isArray(source[camel])) records = source[camel];
      if (Array.isArray(records)) {
        foundAny = true;
        const validRecords = records.filter((record) => record && typeof record === 'object');
        report.stores[name] = {
          count: validRecords.length,
          total: records.length
        };
        report.totalRecords += validRecords.length;
      }
    }

    if (!foundAny) {
      report.errors.push('لم يتم العثور على بيانات صالحة في الملف');
      return report;
    }

    report.valid = true;
    return report;
  },

  /**
   * استيراد نسخة احتياطية مع التحقق من سلامة الملف قبل حذف البيانات الحالية.
   * لا تُمسح البيانات الحالية إلا بعد التأكد من صلاحية النسخة الاحتياطية.
   */
  async importData(payload, { replace = true } = {}) {
    await openDatabase();
    if (!payload || typeof payload !== 'object') {
      throw new Error('ملف النسخة الاحتياطية غير صالح');
    }
    const source = payload.stores || payload.data || payload;

    // التحقق من التطبيق
    if (payload.app && payload.app !== 'نظامي') {
      throw new Error('هذا الملف لا يبدو نسخة احتياطية من تطبيق نظامي');
    }

    // التحقق من توافق الإصدار (نقبل الإصدارات نفسها أو الأقدم)
    if (payload.schemaVersion && payload.schemaVersion > SCHEMA_VERSION) {
      throw new Error(`إصدار النسخة الاحتياطية (${payload.schemaVersion}) أحدث من إصدار التطبيق الحالي (${SCHEMA_VERSION})`);
    }

    const toImport = {};
    let foundAny = false;

    for (const name of STORE_NAMES) {
      const camel = STORE_TO_CAMEL[name];
      let records = source[name];
      if (!Array.isArray(records) && camel && Array.isArray(source[camel])) records = source[camel];
      if (Array.isArray(records)) {
        foundAny = true;
        // تحويل base64 إلى Blob للمخازن الثنائية
        const processed = await Promise.all(records.filter((record) => record && typeof record === 'object').map(async (record) => {
          const r = { ...record };
          if ((name === 'adhan_blobs' || name === 'finance_attachments') && r.blobType === 'base64' && r.blob) {
            r.blob = await base64ToBlob(r.blob, r.type || 'application/octet-stream');
          }
          if (!r[STORE_DEFS[name].keyPath]) r[STORE_DEFS[name].keyPath] = uid(name.slice(0, 2));
          return r;
        }));
        toImport[name] = processed;
      }
    }

    if (!foundAny) throw new Error('لم يتم العثور على بيانات صالحة في الملف');

    if (dbMode === 'fallback') {
      const data = loadFallbackData();
      if (replace) {
        for (const name of STORE_NAMES) {
          data[name] = [];
        }
      }
      for (const [name, records] of Object.entries(toImport)) {
        const keyPath = STORE_DEFS[name].keyPath;
        for (const record of records) {
          const index = data[name].findIndex((r) => r[keyPath] === record[keyPath]);
          if (index >= 0) data[name][index] = record;
          else data[name].push(record);
        }
      }
      persistFallback();
      return { imported: Object.fromEntries(Object.entries(toImport).map(([k, v]) => [k, v.length])), report: await this.validateBackup(payload) };
    }

    // المعاملة الذرية: لا تُمسح البيانات الحالية إلا بعد التحقق من الصلاحية
    // يتم الحذف والإدخال ضمن معاملة واحدة لكل المخازن
    await runMultiTransaction(STORE_NAMES, 'readwrite', (transaction) => {
      if (replace) {
        for (const name of STORE_NAMES) {
          transaction.objectStore(name).clear();
        }
      }
      for (const [name, records] of Object.entries(toImport)) {
        const store = transaction.objectStore(name);
        const keyPath = STORE_DEFS[name].keyPath;
        for (const record of records) {
          if (!record[keyPath]) record[keyPath] = uid(name.slice(0, 2));
          store.put(record);
        }
      }
    });

    return { imported: Object.fromEntries(Object.entries(toImport).map(([k, v]) => [k, v.length])), report: await this.validateBackup(payload) };
  },

  async storageEstimate() {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        return await navigator.storage.estimate();
      }
    } catch {}
    return null;
  },

  /**
   * تنفيذ عمليات متعددة عبر مخازن مختلفة في معاملة واحدة (ذرة).
   * جميع العمليات تنجح معًا أو تُلغى معًا عند الفشل.
   * العمليات: { store, type: 'put'|'delete', record } أو { store, type: 'delete', key }
   */
  async multiTransaction(operations) {
    if (!operations.length) return;
    await openDatabase();
    if (dbMode === 'fallback') {
      // في التخزين البديل، نُنفذ 순차يًا (بدون تراجع حقيقي لكن البيانات آمنة)
      const data = loadFallbackData();
      for (const op of operations) {
        const keyPath = STORE_DEFS[op.store].keyPath;
        if (op.type === 'put') {
          const index = data[op.store].findIndex((r) => r[keyPath] === op.record[keyPath]);
          if (index >= 0) data[op.store][index] = { ...op.record };
          else data[op.store].push({ ...op.record });
        } else if (op.type === 'delete') {
          const key = op.key !== undefined ? op.key : op.record[keyPath];
          data[op.store] = data[op.store].filter((r) => r[keyPath] !== key);
        }
      }
      persistFallback();
      return;
    }
    const storeNames = [...new Set(operations.map((op) => op.store))];
    return runMultiTransaction(storeNames, 'readwrite', (transaction) => {
      for (const op of operations) {
        const store = transaction.objectStore(op.store);
        if (op.type === 'put') {
          store.put(op.record);
        } else if (op.type === 'delete') {
          const key = op.key !== undefined ? op.key : op.record[STORE_DEFS[op.store].keyPath];
          store.delete(key);
        }
      }
    });
  }
};

/* ---------------- تحويل الملفات الثنائية للنسخ الاحتياطي ---------------- */

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('تعذر قراءة الملف الثنائي'));
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(dataUrl, contentType = '') {
  const [header, data] = String(dataUrl).split(',');
  const byteString = atob(data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i += 1) ia[i] = byteString.charCodeAt(i);
  return new Blob([ab], { type: contentType });
}

/* ---------------- ترحيل بيانات قديمة (إن وُجدت) ---------------- */
/**
 * يحاول التقاط نسخة قديمة من localStorage عند أول تشغيل فقط.
 * لا يمس أي بيانات موجودة داخل IndexedDB.
 */
async function migrateLegacyBackupIfNeeded() {
  const keys = ['nizami_backup', 'nizami_data', 'nizamiData', 'nizami_state'];
  for (const key of keys) {
    let raw;
    try { raw = localStorage.getItem(key); } catch { continue; }
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const existingHabits = await DB.count('habits');
      const existingTasks = await DB.count('tasks');
      if (existingHabits > 0 || existingTasks > 0) return false;
      const stores = parsed.stores || parsed.data || parsed;
      const hasKnown = STORE_NAMES.some((name) => Array.isArray(stores[name]) || Array.isArray(stores[STORE_TO_CAMEL[name]]));
      if (!hasKnown) continue;
      await DB.importData({ app: 'نظامي', stores }, { replace: false });
      localStorage.setItem(`${key}_migrated`, String(Date.now()));
      console.info('[نظامي] تم ترحيل بيانات قديمة من', key);
      return true;
    } catch (error) {
      console.warn('[نظامي] تعذر ترحيل بيانات قديمة من', key, error);
    }
  }
  return false;
}
