/* =========================================================
   نظامي — ماليّاتي: المحرك المحاسبي والبيانات
   فصل كامل بين الحساب الشخصي والعائلي، مع معاملات مرتبطة
   ========================================================= */
'use strict';

/* ---------------- ثوابت ---------------- */
const FINANCE_TX_LABELS = {
  income: 'دخل',
  expense: 'مصروف',
  transfer: 'تحويل داخلي',
  debt_borrow: 'استلام دين',
  debt_payment: 'سداد دين',
  savings_deposit: 'إيداع ادخار',
  savings_withdraw: 'سحب ادخار'
};

const FINANCE_TX_ICONS = {
  income: 'arrow-down-left',
  expense: 'receipt',
  transfer: 'repeat',
  debt_borrow: 'scale',
  debt_payment: 'check-circle',
  savings_deposit: 'piggy-bank',
  savings_withdraw: 'bank'
};

const FINANCE_PAYMENT_METHODS = {
  cash: 'نقدًا',
  card: 'بطاقة',
  bank: 'تحويل بنكي',
  wallet: 'محفظة إلكترونية',
  cheque: 'شيك',
  other: 'أخرى'
};

const FINANCE_INCOME_KINDS = {
  salary: 'راتب شهري',
  allowance: 'بدل',
  bonus: 'مكافأة',
  extra: 'دخل إضافي',
  irregular: 'دخل غير منتظم',
  other: 'أخرى'
};

const FINANCE_OBLIGATION_TYPES = {
  rent: 'إيجار',
  bill: 'فاتورة',
  subscription: 'اشتراك',
  installment: 'قسط سيارة',
  loan: 'قرض',
  insurance: 'تأمين',
  other: 'أخرى'
};

const FINANCE_RECURRENCE = {
  once: 'مرة واحدة',
  weekly: 'أسبوعيًا',
  monthly: 'شهريًا',
  quarterly: 'كل 3 أشهر',
  yearly: 'سنويًا'
};

const FINANCE_ACCOUNT_TYPE_LABELS = {
  personal: 'شخصي',
  family: 'عائلي'
};

const FINANCE_DEBT_STATUS = {
  active: 'قائم',
  paid: 'مسدّد',
  archived: 'مؤرشف'
};

const FINANCE_GOAL_STATUS = {
  active: 'قيد الادخار',
  completed: 'مكتمل',
  archived: 'مؤرشف'
};

const FINANCE_OBLIGATION_STATUS = {
  active: 'نشط',
  paused: 'موقوف',
  ended: 'منتهي',
  paid: 'مسدّد'
};

const FINANCE_DEFAULT_ACCOUNTS = [
  {
    id: 'acc_personal',
    name: 'الحساب الشخصي',
    type: 'personal',
    color: '#6c8cff',
    icon: 'wallet',
    openingBalance: 0
  },
  {
    id: 'acc_family',
    name: 'الحساب العائلي',
    type: 'family',
    color: '#35e0b5',
    icon: 'home',
    openingBalance: 0
  }
];

const FINANCE_DEFAULT_CATEGORIES = [
  // مصروفات رئيسية
  { id: 'cat_exp_food', type: 'expense', name: 'الطعام', icon: 'coffee', color: '#ff9f6b' },
  { id: 'cat_exp_restaurants', type: 'expense', name: 'المطاعم', icon: 'coffee', color: '#ffc857' },
  { id: 'cat_exp_coffee', type: 'expense', name: 'القهوة', icon: 'coffee', color: '#b58cff' },
  { id: 'cat_exp_fuel', type: 'expense', name: 'الوقود', icon: 'droplet', color: '#6c8cff' },
  { id: 'cat_exp_car', type: 'expense', name: 'السيارة', icon: 'zap', color: '#45d6df' },
  { id: 'cat_exp_shopping', type: 'expense', name: 'التسوق', icon: 'folder', color: '#ff8fc7' },
  { id: 'cat_exp_home', type: 'expense', name: 'المنزل', icon: 'home', color: '#35e0b5' },
  { id: 'cat_exp_health', type: 'expense', name: 'الصحة', icon: 'heart', color: '#ff717f' },
  { id: 'cat_exp_education', type: 'expense', name: 'التعليم', icon: 'book', color: '#8ed081' },
  { id: 'cat_exp_entertainment', type: 'expense', name: 'الترفيه', icon: 'star', color: '#b58cff' },
  { id: 'cat_exp_travel', type: 'expense', name: 'السفر', icon: 'compass', color: '#45d6df' },
  { id: 'cat_exp_telecom', type: 'expense', name: 'الاتصالات', icon: 'zap', color: '#6c8cff' },
  { id: 'cat_exp_other', type: 'expense', name: 'أخرى', icon: 'more', color: '#94a3b8' },
  // تصنيفات فرعية
  { id: 'cat_exp_food_grocery', type: 'expense', parentId: 'cat_exp_food', name: 'بقالة', icon: 'folder', color: '#ff9f6b' },
  { id: 'cat_exp_food_veg', type: 'expense', parentId: 'cat_exp_food', name: 'خضار وفواكه', icon: 'leaf', color: '#8ed081' },
  { id: 'cat_exp_car_maintenance', type: 'expense', parentId: 'cat_exp_car', name: 'صيانة', icon: 'sliders', color: '#45d6df' },
  { id: 'cat_exp_car_insurance', type: 'expense', parentId: 'cat_exp_car', name: 'تأمين', icon: 'shield', color: '#6c8cff' },
  { id: 'cat_exp_home_furniture', type: 'expense', parentId: 'cat_exp_home', name: 'أثاث', icon: 'home', color: '#35e0b5' },
  { id: 'cat_exp_home_repairs', type: 'expense', parentId: 'cat_exp_home', name: 'صيانة منزلية', icon: 'sliders', color: '#8ed081' },
  { id: 'cat_exp_health_pharmacy', type: 'expense', parentId: 'cat_exp_health', name: 'أدوية', icon: 'heart', color: '#ff717f' },
  { id: 'cat_exp_health_clinic', type: 'expense', parentId: 'cat_exp_health', name: 'عيادات', icon: 'heart', color: '#ff8fc7' },
  { id: 'cat_exp_education_fees', type: 'expense', parentId: 'cat_exp_education', name: 'رسوم دراسية', icon: 'book', color: '#8ed081' },
  { id: 'cat_exp_education_books', type: 'expense', parentId: 'cat_exp_education', name: 'كتب', icon: 'book', color: '#35e0b5' },
  { id: 'cat_exp_entertainment_subs', type: 'expense', parentId: 'cat_exp_entertainment', name: 'اشتراكات ترفيه', icon: 'star', color: '#b58cff' },
  { id: 'cat_exp_entertainment_outings', type: 'expense', parentId: 'cat_exp_entertainment', name: 'خروجات', icon: 'coffee', color: '#ffc857' },
  { id: 'cat_exp_shopping_clothes', type: 'expense', parentId: 'cat_exp_shopping', name: 'ملابس', icon: 'folder', color: '#ff8fc7' },
  { id: 'cat_exp_shopping_electronics', type: 'expense', parentId: 'cat_exp_shopping', name: 'إلكترونيات', icon: 'zap', color: '#6c8cff' },
  { id: 'cat_exp_telecom_mobile', type: 'expense', parentId: 'cat_exp_telecom', name: 'هاتف', icon: 'zap', color: '#6c8cff' },
  { id: 'cat_exp_telecom_internet', type: 'expense', parentId: 'cat_exp_telecom', name: 'إنترنت', icon: 'zap', color: '#45d6df' },
  { id: 'cat_exp_travel_flights', type: 'expense', parentId: 'cat_exp_travel', name: 'طيران', icon: 'compass', color: '#45d6df' },
  { id: 'cat_exp_travel_hotels', type: 'expense', parentId: 'cat_exp_travel', name: 'إقامة', icon: 'home', color: '#6c8cff' },
  // دخل
  { id: 'cat_inc_salary', type: 'income', name: 'راتب', icon: 'wallet', color: '#35e0b5' },
  { id: 'cat_inc_allowance', type: 'income', name: 'بدلات', icon: 'plus', color: '#6c8cff' },
  { id: 'cat_inc_bonus', type: 'income', name: 'مكافآت', icon: 'award', color: '#ffc857' },
  { id: 'cat_inc_extra', type: 'income', name: 'دخل إضافي', icon: 'trending', color: '#45d6df' },
  { id: 'cat_inc_irregular', type: 'income', name: 'دخل غير منتظم', icon: 'sparkles', color: '#b58cff' },
  { id: 'cat_inc_other', type: 'income', name: 'أخرى', icon: 'more', color: '#94a3b8' }
];

const FINANCE_SETTINGS_DEFAULTS = {
  enabled: true,
  currency: 'ر.ع.',
  currencyCode: 'OMR',
  decimals: 3,
  pinEnabled: false,
  pinHash: null,
  pinSalt: null,
  pinSetAt: 0,
  hideBalances: true,
  showInNotifications: false,
  reminderSync: true,
  budgetAlertThreshold: 80,
  upcomingDays: 7,
  defaultAccountId: 'acc_personal',
  plannedSavingsMonthly: 0
};

/* ---------------- الإعدادات ---------------- */
function normalizeFinanceSettings(input) {
  const base = { ...FINANCE_SETTINGS_DEFAULTS };
  if (!input || typeof input !== 'object') return base;
  return {
    ...base,
    ...input,
    enabled: input.enabled !== false,
    currency: String(input.currency || base.currency),
    currencyCode: String(input.currencyCode || base.currencyCode),
    decimals: clamp(Number(input.decimals ?? base.decimals), 0, 3),
    pinEnabled: Boolean(input.pinEnabled && input.pinHash && input.pinSalt),
    pinHash: input.pinHash || null,
    pinSalt: input.pinSalt || null,
    pinSetAt: Number(input.pinSetAt) || 0,
    hideBalances: input.hideBalances !== false,
    showInNotifications: Boolean(input.showInNotifications),
    reminderSync: input.reminderSync !== false,
    budgetAlertThreshold: clamp(Number(input.budgetAlertThreshold ?? base.budgetAlertThreshold), 50, 100),
    upcomingDays: clamp(Number(input.upcomingDays ?? base.upcomingDays), 1, 60),
    defaultAccountId: String(input.defaultAccountId || base.defaultAccountId),
    plannedSavingsMonthly: Math.max(0, Number(input.plannedSavingsMonthly) || 0)
  };
}

function financeSettings() {
  if (!state.settings.finance) state.settings.finance = normalizeFinanceSettings(null);
  return state.settings.finance;
}

async function saveFinanceSettings(patch) {
  const next = normalizeFinanceSettings({ ...financeSettings(), ...patch });
  await saveSettings({ finance: next });
  return next;
}

/* ---------------- التهيئة والبيانات الافتراضية ---------------- */
async function ensureFinanceSeed() {
  const settings = await saveFinanceSettings({});
  let accountsChanged = false;
  let categoriesChanged = false;

  for (const def of FINANCE_DEFAULT_ACCOUNTS) {
    if (!state.data.financeAccounts.some((account) => account.id === def.id)) {
      const account = {
        id: def.id,
        name: def.name,
        type: def.type,
        color: def.color,
        icon: def.icon,
        openingBalance: financeRound(def.openingBalance),
        archived: false,
        isDefault: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await DB.put('finance_accounts', account);
      state.data.financeAccounts.push(account);
      accountsChanged = true;
    }
  }

  for (const def of FINANCE_DEFAULT_CATEGORIES) {
    if (!state.data.financeCategories.some((category) => category.id === def.id)) {
      const category = {
        id: def.id,
        type: def.type,
        name: def.name,
        parentId: def.parentId || '',
        icon: def.icon || 'folder',
        color: def.color || '#94a3b8',
        isDefault: true,
        archived: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await DB.put('finance_categories', category);
      state.data.financeCategories.push(category);
      categoriesChanged = true;
    }
  }

  // تصحيح أي إعدادات قديمة أو حساب افتراضي غير موجود
  if (!state.data.financeAccounts.some((account) => account.id === settings.defaultAccountId)) {
    settings.defaultAccountId = FINANCE_DEFAULT_ACCOUNTS[0].id;
    await saveSettings({ finance: settings });
  }
  if (accountsChanged) await loadStore('finance_accounts');
  if (categoriesChanged) await loadStore('finance_categories');
  return { accountsChanged, categoriesChanged };
}

async function initFinance() {
  await ensureFinanceSeed();
  const settings = financeSettings();
  state.ui.financeLocked = Boolean(settings.pinEnabled);
  if (typeof syncFinanceReminders === 'function') await syncFinanceReminders();
  if (settings.pinEnabled) {
    // القفل يعمل خلال الجلسة فقط، وليس تشفيرًا للبيانات.
    state.ui.financeLocked = true;
  }
}

/* ---------------- أدوات مالية ---------------- */
function financeRound(value) {
  return round(Number(value) || 0, 3);
}

function financeCurrency() {
  return financeSettings().currency || 'ر.ع.';
}

function money(value, options = {}) {
  const settings = financeSettings();
  const digits = clamp(Number(settings.decimals ?? 3), 0, 3);
  const number = Number(value) || 0;
  const absolute = Math.abs(number).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
  const sign = options.sign && number > 0 ? '+' : '';
  const negative = number < 0 && !options.abs ? '-' : '';
  return `${sign}${negative}${absolute} ${options.symbol === false ? '' : financeCurrency()}`.trim();
}

function moneyCompact(value) {
  const settings = financeSettings();
  const digits = clamp(Number(settings.decimals ?? 3), 0, 3);
  return `${(Number(value) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  })} ${financeCurrency()}`;
}

function financeAccount(id) {
  return state.data.financeAccounts.find((account) => account.id === id) || null;
}

function financeAccountName(id) {
  return financeAccount(id)?.name || 'حساب محذوف';
}

function financeCategory(id) {
  return state.data.financeCategories.find((category) => category.id === id) || null;
}

function financeCategoryName(id) {
  return financeCategory(id)?.name || 'غير مصنف';
}

function financeCategories(type = 'expense', includeArchived = false) {
  return state.data.financeCategories
    .filter((category) => category.type === type && (includeArchived || !category.archived))
    .sort((a, b) => String(a.parentId || '').localeCompare(String(b.parentId || '')) || a.name.localeCompare(b.name, 'ar'));
}

function financeExpenseCategories() {
  return financeCategories('expense');
}

function financeIncomeCategories() {
  return financeCategories('income');
}

function financeAccounts(type = 'all', includeArchived = false) {
  return state.data.financeAccounts
    .filter((account) => (includeArchived || !account.archived) && (type === 'all' || account.type === type))
    .sort((a, b) => (a.type === b.type ? a.createdAt - b.createdAt : a.type === 'personal' ? -1 : 1));
}

function financeScopeLabel(scope) {
  if (scope === 'personal') return 'الشخصي';
  if (scope === 'family') return 'العائلي';
  return 'الموحّد';
}

function financeMonthLabel(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('ar-OM-u-nu-latn', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(parseISODate(iso));
  } catch {
    return String(iso).slice(0, 7);
  }
}

function financeScopeIds(scope) {
  if (Array.isArray(scope)) return scope;
  if (scope === 'personal' || scope === 'family') {
    return financeAccounts(scope, true).map((account) => account.id);
  }
  return state.data.financeAccounts.map((account) => account.id);
}

function financeTxEffect(tx) {
  const amount = Number(tx.amount) || 0;
  switch (tx.type) {
    case 'income':
    case 'debt_borrow':
    case 'savings_withdraw':
      return amount;
    case 'expense':
    case 'debt_payment':
    case 'savings_deposit':
      return -amount;
    case 'transfer':
      return tx.direction === 'in' ? amount : -amount;
    default:
      return 0;
  }
}

function financeAccountCash(accountId) {
  const account = financeAccount(accountId);
  if (!account) return 0;
  return financeRound(account.openingBalance + sum(
    state.data.financeTransactions.filter((tx) => tx.accountId === accountId),
    (tx) => financeTxEffect(tx)
  ));
}

function financeScopeCash(scope = 'all') {
  const ids = new Set(financeScopeIds(scope));
  return financeRound(sum(
    state.data.financeAccounts.filter((account) => ids.has(account.id)),
    (account) => financeAccountCash(account.id)
  ));
}

function financeTransactionsIn(scope = 'all', start = '', end = '') {
  const ids = new Set(financeScopeIds(scope));
  return state.data.financeTransactions.filter((tx) => ids.has(tx.accountId)
    && (!start || tx.date >= start)
    && (!end || tx.date <= end));
}

function financeTotals(scope = 'all', start = '', end = '') {
  const list = financeTransactionsIn(scope, start, end);
  const totals = {
    income: 0,
    expenses: 0,
    transfers: 0,
    debtBorrow: 0,
    debtPayments: 0,
    savingsDeposits: 0,
    savingsWithdrawals: 0
  };
  for (const tx of list) {
    const amount = Number(tx.amount) || 0;
    if (tx.type === 'income') totals.income += amount;
    else if (tx.type === 'expense') totals.expenses += amount;
    else if (tx.type === 'transfer' && tx.direction === 'out') totals.transfers += amount;
    else if (tx.type === 'debt_borrow') totals.debtBorrow += amount;
    else if (tx.type === 'debt_payment') totals.debtPayments += amount;
    else if (tx.type === 'savings_deposit') totals.savingsDeposits += amount;
    else if (tx.type === 'savings_withdraw') totals.savingsWithdrawals += amount;
  }
  for (const key of Object.keys(totals)) totals[key] = financeRound(totals[key]);
  return totals;
}

function financePeriodRange(period = 'month', cursor = todayISO(), from = '', to = '') {
  if (period === 'all') return { start: '', end: '', label: 'كل الفترات' };
  if (period === 'custom') {
    const start = from || startOfMonthISO(cursor);
    const end = to || todayISO();
    return { start, end, label: `${formatDateShort(start)} — ${formatDateShort(end)}` };
  }
  if (period === 'lastMonth') {
    const start = startOfMonthISO(addMonthsISO(cursor, -1));
    const end = endOfMonthISO(start);
    return { start, end, label: financeMonthLabel(start) };
  }
  if (period === 'quarter') {
    const start = startOfMonthISO(addMonthsISO(cursor, -2));
    const end = endOfMonthISO(cursor);
    return { start, end, label: `آخر 3 أشهر` };
  }
  if (period === 'year') {
    const start = `${yearOfISO(cursor)}-01-01`;
    const end = `${yearOfISO(cursor)}-12-31`;
    return { start, end, label: `سنة ${yearOfISO(cursor)}` };
  }
  if (period === 'week') {
    const start = startOfWeekISO(cursor);
    const end = endOfWeekISO(cursor);
    return { start, end, label: `${formatDateShort(start)} — ${formatDateShort(end)}` };
  }
  const start = startOfMonthISO(cursor);
  const end = endOfMonthISO(cursor);
  return { start, end, label: financeMonthLabel(start) };
}

/* ---------------- الديون ---------------- */
function financeDebtPayments(debtId) {
  return state.data.financeDebtPayments
    .filter((payment) => payment.debtId === debtId)
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || 0) - (b.createdAt || 0));
}

function financeDebtPaid(debt) {
  return financeRound(sum(financeDebtPayments(debt.id), (payment) => payment.amount));
}

function financeDebtRemaining(debt) {
  return financeRound(Math.max(0, (Number(debt.principal) || 0) - financeDebtPaid(debt)));
}

function financeActiveDebts(scope = 'all') {
  const ids = new Set(financeScopeIds(scope));
  return state.data.financeDebts.filter((debt) => debt.status !== 'archived'
    && (!debt.accountId || ids.has(debt.accountId)));
}

function financeDebtsRemaining(scope = 'all') {
  return financeRound(sum(financeActiveDebts(scope), (debt) => financeDebtRemaining(debt)));
}

/* ---------------- الادخار ---------------- */
function financeSavingsEntries(goalId) {
  return state.data.financeSavingsEntries
    .filter((entry) => entry.goalId === goalId)
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || 0) - (b.createdAt || 0));
}

function financeGoalSaved(goalId) {
  return financeRound(sum(
    financeSavingsEntries(goalId),
    (entry) => (entry.type === 'withdraw' ? -1 : 1) * (Number(entry.amount) || 0)
  ));
}

function financeSavingsGoals(scope = 'all') {
  const ids = new Set(financeScopeIds(scope));
  return state.data.financeSavingsGoals.filter((goal) => goal.status !== 'archived'
    && (!goal.accountId || ids.has(goal.accountId)));
}

function financeSavingsTotal(scope = 'all') {
  return financeRound(sum(financeSavingsGoals(scope), (goal) => Math.max(0, financeGoalSaved(goal.id))));
}

function financeGoalProgress(goal) {
  const target = Number(goal.targetAmount) || 0;
  const saved = Math.max(0, financeGoalSaved(goal.id));
  return {
    saved,
    target,
    percent: target > 0 ? clamp(Math.round((saved / target) * 100), 0, 100) : 0,
    remaining: Math.max(0, target - saved)
  };
}

/* ---------------- الالتزامات ---------------- */
function financeObligationPayments(obligationId) {
  return state.data.financeObligationPayments
    .filter((payment) => payment.obligationId === obligationId)
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || 0) - (b.createdAt || 0));
}

function financeObligationPaid(obligationId) {
  return financeRound(sum(financeObligationPayments(obligationId), (payment) => payment.amount));
}

function financeNextRecurrence(date, recurrence) {
  if (!date) return date;
  if (recurrence === 'weekly') return addDaysISO(date, 7);
  if (recurrence === 'monthly') return addMonthsISO(date, 1);
  if (recurrence === 'quarterly') return addMonthsISO(date, 3);
  if (recurrence === 'yearly') return addMonthsISO(date, 12);
  return date;
}

function financeObligationInfo(obligation) {
  const today = todayISO();
  const dueDate = obligation.dueDate || today;
  const days = diffDaysISO(today, dueDate);
  const expected = Number(obligation.expectedAmount) || 0;
  const cyclePaid = Number(obligation.cyclePaid) || 0;
  const remainingDue = financeRound(Math.max(0, expected - cyclePaid));
  let status = 'active';
  if (obligation.status === 'ended' || obligation.status === 'paused') status = obligation.status;
  else if (obligation.recurrence !== 'once' && obligation.status === 'paid') status = 'active';
  else if (obligation.recurrence === 'once' && obligation.status === 'paid') status = 'paid';
  else if (days < 0) status = 'overdue';
  else if (days <= financeSettings().upcomingDays) status = 'soon';
  return {
    days,
    dueDate,
    expected,
    cyclePaid: financeRound(cyclePaid),
    remainingDue,
    paidTotal: financeObligationPaid(obligation.id),
    status,
    statusLabel: status === 'overdue' ? 'متأخر'
      : status === 'soon' ? 'قريب'
      : status === 'paid' ? 'مسدّد'
      : status === 'ended' ? 'منتهي'
      : status === 'paused' ? 'موقوف'
      : 'نشط',
    tone: status === 'overdue' ? 'danger' : status === 'soon' ? 'warning' : status === 'paid' ? 'green' : 'muted'
  };
}

function financeObligations(scope = 'all', includeEnded = false) {
  const ids = new Set(financeScopeIds(scope));
  return state.data.financeObligations.filter((obligation) => ids.has(obligation.accountId)
    && (includeEnded || !['ended', 'paid'].includes(obligation.status) || obligation.recurrence !== 'once'));
}

function financeUpcomingObligations(scope = 'all', days = null) {
  const limit = days ?? financeSettings().upcomingDays;
  const today = todayISO();
  return sortBy(
    financeObligations(scope).filter((obligation) => {
      const info = financeObligationInfo(obligation);
      return info.status !== 'paid' && info.status !== 'ended'
        && info.days <= limit;
    }),
    (obligation) => obligation.dueDate,
    'asc'
  ).map((obligation) => ({ obligation, info: financeObligationInfo(obligation) }));
}

function financeOverdueObligations(scope = 'all') {
  return financeUpcomingObligations(scope, 0).filter(({ info }) => info.days < 0);
}

/* ---------------- رواتب وجداول الدخل ---------------- */
function financeScheduleNextDate(schedule, from = todayISO()) {
  const day = clamp(Number(schedule.dayOfMonth) || 1, 1, 28);
  const monthStart = startOfMonthISO(from);
  let candidate = `${monthStart.slice(0, 7)}-${pad2(day)}`;
  if (candidate < from) {
    candidate = `${addMonthsISO(monthStart, 1).slice(0, 7)}-${pad2(day)}`;
  }
  if (schedule.lastReceivedAt) {
    const lastMonth = String(schedule.lastReceivedAt).slice(0, 7);
    if (lastMonth === candidate.slice(0, 7)) {
      candidate = `${addMonthsISO(candidate, 1).slice(0, 7)}-${pad2(day)}`;
    }
  }
  return candidate;
}

function financeSchedules(scope = 'all') {
  const ids = new Set(financeScopeIds(scope));
  return state.data.financeIncomeSchedules.filter((schedule) => schedule.enabled !== false && ids.has(schedule.accountId));
}

function financeNextIncome(scope = 'all') {
  const today = todayISO();
  const candidates = financeSchedules(scope).map((schedule) => ({
    schedule,
    date: financeScheduleNextDate(schedule, today)
  }));
  if (!candidates.length) return null;
  return sortBy(candidates, (item) => item.date, 'asc')[0];
}

/* ---------------- الميزانيات ---------------- */
function financeMonthKey(iso = todayISO()) {
  return String(iso).slice(0, 7);
}

function financeBudgetSpent(budget) {
  const ids = new Set(financeScopeIds(budget.accountType === 'all' ? 'all' : budget.accountType));
  const start = `${budget.period}-01`;
  const end = endOfMonthISO(start);
  return financeRound(sum(
    state.data.financeTransactions.filter((tx) => tx.type === 'expense'
      && ids.has(tx.accountId)
      && tx.date >= start && tx.date <= end
      && (budget.scope !== 'category' || tx.categoryId === budget.categoryId)),
    (tx) => tx.amount
  ));
}

function financeBudgetAnalysis(period = financeMonthKey(), accountType = 'all') {
  const threshold = financeSettings().budgetAlertThreshold;
  const budgets = state.data.financeBudgets.filter((budget) => budget.period === period
    && (accountType === 'all' || budget.accountType === 'all' || budget.accountType === accountType));
  return budgets.map((budget) => {
    const spent = financeBudgetSpent(budget);
    const limit = Number(budget.limit) || 0;
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    return {
      budget,
      spent,
      limit,
      pct,
      remaining: financeRound(Math.max(0, limit - spent)),
      status: pct >= 100 ? 'over' : pct >= threshold ? 'near' : 'ok',
      label: budget.scope === 'overall' ? 'الميزانية العامة' : financeCategoryName(budget.categoryId)
    };
  }).sort((a, b) => b.pct - a.pct);
}

/* ---------------- التقارير والملخصات ---------------- */
function financeExpenseByCategory(scope = 'all', start = '', end = '') {
  const groups = new Map();
  for (const tx of financeTransactionsIn(scope, start, end)) {
    if (tx.type !== 'expense') continue;
    const key = tx.categoryId || '';
    const current = groups.get(key) || { categoryId: key, name: key ? financeCategoryName(key) : 'غير مصنف', total: 0, count: 0 };
    current.total = financeRound(current.total + (Number(tx.amount) || 0));
    current.count += 1;
    groups.set(key, current);
  }
  const total = sum([...groups.values()], (group) => group.total);
  return sortBy([...groups.values()], (group) => group.total, 'desc').map((group) => ({
    ...group,
    percent: total > 0 ? Math.round((group.total / total) * 100) : 0
  }));
}

function financeMonthlySeries(scope = 'all', months = 6) {
  const result = [];
  const today = todayISO();
  for (let i = months - 1; i >= 0; i -= 1) {
    const monthStart = startOfMonthISO(addMonthsISO(today, -i));
    const monthEnd = endOfMonthISO(monthStart);
    const totals = financeTotals(scope, monthStart, monthEnd);
    result.push({
      month: monthKeyFromISO(monthStart),
      label: financeMonthLabel(monthStart),
      shortLabel: formatDate(monthStart, { month: 'short' }),
      income: totals.income,
      expenses: totals.expenses,
      savings: totals.savingsDeposits - totals.savingsWithdrawals,
      debtPayments: totals.debtPayments
    });
  }
  return result;
}

function monthKeyFromISO(iso) {
  return String(iso).slice(0, 7);
}

function financeMonthComparison(scope = 'all') {
  const today = todayISO();
  const currentStart = startOfMonthISO(today);
  const currentEnd = endOfMonthISO(today);
  const previousStart = startOfMonthISO(addMonthsISO(today, -1));
  const previousEnd = endOfMonthISO(previousStart);
  const current = financeTotals(scope, currentStart, currentEnd);
  const previous = financeTotals(scope, previousStart, previousEnd);
  const change = previous.expenses > 0
    ? Math.round(((current.expenses - previous.expenses) / previous.expenses) * 100)
    : (current.expenses > 0 ? 100 : 0);
  return {
    current,
    previous,
    previousLabel: financeMonthLabel(previousStart),
    expenseChangePct: change
  };
}

function financeTopCategories(scope = 'all', start = '', end = '', limit = 5) {
  return financeExpenseByCategory(scope, start, end).slice(0, limit);
}

function financeIncomeDistribution(scope = 'all', start = '', end = '') {
  const groups = new Map();
  for (const tx of financeTransactionsIn(scope, start, end)) {
    if (tx.type !== 'income') continue;
    const key = tx.incomeKind || 'other';
    const current = groups.get(key) || { key, label: FINANCE_INCOME_KINDS[key] || 'أخرى', total: 0 };
    current.total = financeRound(current.total + (Number(tx.amount) || 0));
    groups.set(key, current);
  }
  const total = sum([...groups.values()], (group) => group.total);
  return sortBy([...groups.values()], (group) => group.total, 'desc').map((group) => ({
    ...group,
    percent: total > 0 ? Math.round((group.total / total) * 100) : 0
  }));
}

function financeSafeToSpend(scope = 'all') {
  const settings = financeSettings();
  const today = todayISO();
  const cash = financeScopeCash(scope);
  const nextIncome = financeNextIncome(scope);
  const horizon = nextIncome ? nextIncome.date : addDaysISO(today, 30);
  const days = Math.max(1, diffDaysISO(today, horizon));

  const obligations = financeObligations(scope)
    .filter((obligation) => {
      const info = financeObligationInfo(obligation);
      return info.status !== 'paid' && info.status !== 'ended'
        && obligation.dueDate >= today && obligation.dueDate <= horizon;
    })
    .map((obligation) => ({ obligation, info: financeObligationInfo(obligation) }));
  const obligationsTotal = financeRound(sum(obligations, ({ info }) => info.remainingDue));

  const monthlySavings = Math.max(0, Number(settings.plannedSavingsMonthly) || 0);
  const plannedSavings = financeRound(monthlySavings * (days / 30));

  const raw = financeRound(cash - obligationsTotal - plannedSavings);
  const safe = Math.max(0, raw);

  return {
    cash,
    nextIncome,
    horizon,
    days,
    obligationsTotal,
    obligations,
    plannedSavings,
    monthlySavings,
    raw,
    safe,
    daily: financeRound(safe / days),
    deficit: raw < 0 ? Math.abs(raw) : 0,
    assumptions: [
      `الرصيد الفعلي المتاح الآن: ${money(cash)} (بعد استبعاد المبالغ المدخرة)`,
      nextIncome
        ? `الدخل القادم المتوقع في ${formatDateLong(nextIncome.date)} (${days} يومًا)`
        : `لا يوجد جدول دخل قادم، لذلك استُخدمت نافذة 30 يومًا`,
      `الالتزامات المستحقة خلال الفترة: ${money(obligationsTotal)}`,
      `الادخار المخطط للفترة: ${money(plannedSavings)}${monthlySavings ? ` (${money(monthlySavings)} شهريًا)` : ''}`,
      'هذا تقدير تخطيطي وليس رصيدًا مؤكدًا؛ لا يشمل المصروفات اليومية الاختيارية.'
    ]
  };
}

function financeAccountSummary(type, start, end) {
  const accounts = financeAccounts(type, true);
  const ids = new Set(accounts.map((account) => account.id));
  const scope = ids.size ? [...ids] : [];
  const totals = financeTotals(scope, start, end);
  const cash = financeRound(sum(accounts, (account) => financeAccountCash(account.id)));
  const savings = financeRound(sum(
    financeSavingsGoals(type),
    (goal) => Math.max(0, financeGoalSaved(goal.id))
  ));
  const debts = financeRound(sum(
    financeActiveDebts(type),
    (debt) => financeDebtRemaining(debt)
  ));
  return {
    type,
    label: FINANCE_ACCOUNT_TYPE_LABELS[type],
    cash,
    income: totals.income,
    expenses: totals.expenses,
    savings,
    debts,
    netWorth: financeRound(cash + savings - debts)
  };
}

function financeDashboardData(scope = 'all') {
  const today = todayISO();
  const monthStart = startOfMonthISO(today);
  const monthEnd = endOfMonthISO(today);
  const totals = financeTotals(scope, monthStart, monthEnd);
  const allTotals = financeTotals(scope);
  const cash = financeScopeCash(scope);
  const savings = financeSavingsTotal(scope);
  const debts = financeDebtsRemaining(scope);
  const obligations = financeObligations(scope).map((obligation) => ({
    obligation,
    info: financeObligationInfo(obligation)
  }));
  const dueObligations = financeRound(sum(
    obligations.filter(({ info }) => ['overdue', 'soon', 'active'].includes(info.status) && info.days <= financeSettings().upcomingDays),
    ({ info }) => info.remainingDue
  ));
  const overdueObligations = obligations.filter(({ info }) => info.status === 'overdue');
  const safe = financeSafeToSpend(scope);
  return {
    scope,
    today,
    monthStart,
    monthEnd,
    monthLabel: financeMonthLabel(monthStart),
    totals,
    allTotals,
    cash,
    savings,
    debts,
    netWorth: financeRound(cash + savings - debts),
    dueObligations,
    overdueObligations,
    upcoming: financeUpcomingObligations(scope, financeSettings().upcomingDays).slice(0, 6),
    incomeDistribution: financeIncomeDistribution(scope, monthStart, monthEnd),
    monthly: financeMonthlySeries(scope, 6),
    recent: financeRecentTransactions(scope, 8),
    comparison: financeMonthComparison(scope),
    safe,
    budgets: financeBudgetAnalysis(financeMonthKey(today), scope),
    personal: financeAccountSummary('personal', monthStart, monthEnd),
    family: financeAccountSummary('family', monthStart, monthEnd),
    nextIncome: financeNextIncome(scope)
  };
}

function financeRecentTransactions(scope = 'all', limit = 10) {
  return sortBy(
    financeTransactionsIn(scope),
    (tx) => tx.datetime || wallEpoch(tx.date, tx.time || '00:00'),
    'desc'
  ).slice(0, limit);
}

function financeTransactionTitle(tx) {
  if (tx.type === 'transfer') {
    return tx.direction === 'in'
      ? `تحويل وارد من ${financeAccountName(tx.toAccountId)}`
      : `تحويل صادر إلى ${financeAccountName(tx.toAccountId)}`;
  }
  if (tx.type === 'debt_borrow') {
    return `استلام دين من ${tx.counterparty || financeDebtName(tx.debtId)}`;
  }
  if (tx.type === 'debt_payment') {
    return `سداد دين ${tx.counterparty || financeDebtName(tx.debtId)}`;
  }
  if (tx.type === 'savings_deposit') return `إيداع ادخار — ${financeGoalName(tx.savingsGoalId)}`;
  if (tx.type === 'savings_withdraw') return `سحب ادخار — ${financeGoalName(tx.savingsGoalId)}`;
  if (tx.type === 'income') return tx.merchant || tx.counterparty || financeCategoryName(tx.categoryId);
  if (tx.type === 'expense') return tx.merchant || (tx.obligationId ? financeObligationName(tx.obligationId) : financeCategoryName(tx.categoryId));
  return FINANCE_TX_LABELS[tx.type] || 'معاملة';
}

function financeDebtName(id) {
  return state.data.financeDebts.find((debt) => debt.id === id)?.creditor || 'دين';
}

function financeGoalName(id) {
  return state.data.financeSavingsGoals.find((goal) => goal.id === id)?.name || 'هدف ادخار';
}

function financeObligationName(id) {
  return state.data.financeObligations.find((obligation) => obligation.id === id)?.name || 'التزام';
}

/* ---------------- التنبيهات والتذكيرات ---------------- */
function financeAlerts(scope = 'all') {
  const alerts = [];
  const settings = financeSettings();
  for (const { obligation, info } of financeUpcomingObligations(scope, settings.upcomingDays)) {
    if (info.status === 'overdue') {
      alerts.push({
        type: 'danger',
        title: `التزام متأخر: ${obligation.name}`,
        message: `متأخر ${Math.abs(info.days)} يومًا · المتبقي ${money(info.remainingDue)}`,
        action: 'finance-obligation-detail',
        id: obligation.id
      });
    } else if (info.status === 'soon') {
      alerts.push({
        type: 'warning',
        title: `التزام قريب: ${obligation.name}`,
        message: `يستحق ${relativeDateLabel(obligation.dueDate)} · ${money(info.remainingDue)}`,
        action: 'finance-obligation-detail',
        id: obligation.id
      });
    }
  }
  for (const item of financeBudgetAnalysis(financeMonthKey(), scope)) {
    if (item.status === 'over') {
      alerts.push({
        type: 'danger',
        title: `تجاوز الميزانية: ${item.label}`,
        message: `أُنفق ${money(item.spent)} من ${money(item.limit)} (${item.pct}%)`,
        action: 'finance-budgets'
      });
    } else if (item.status === 'near') {
      alerts.push({
        type: 'warning',
        title: `اقتراب الحد: ${item.label}`,
        message: `استُهلك ${item.pct}% من الميزانية`,
        action: 'finance-budgets'
      });
    }
  }
  return alerts;
}

function financeNotificationAllowed() {
  return Boolean(financeSettings().showInNotifications) && !financeIsLocked();
}

function checkFinanceNotifications() {
  if (!financeNotificationAllowed()) return;
  const alerts = financeAlerts();
  if (!alerts.length) return;
  const key = 'nizami_fin_alert_' + todayISO();
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {}
  const first = alerts[0];
  showToast({
    type: first.type,
    title: first.title,
    message: `${first.message}${alerts.length > 1 ? ` · و${alerts.length - 1} تنبيه آخر` : ''}`,
    duration: 9000
  });
}

async function syncFinanceReminders() {
  if (!financeSettings().reminderSync || typeof createReminder !== 'function') return;
  const desired = [];
  for (const obligation of state.data.financeObligations) {
    if (obligation.status === 'ended' || obligation.status === 'paid' || !obligation.reminderEnabled) continue;
    desired.push({
      linkType: 'finance_obligation',
      linkId: obligation.id,
      title: `سداد: ${obligation.name}`,
      description: 'التزام مالي مستحق',
      date: obligation.dueDate,
      time: obligation.reminderTime || '09:00',
      repeat: 'once'
    });
  }
  for (const debt of state.data.financeDebts) {
    if (debt.status === 'paid' || debt.status === 'archived' || !debt.reminderEnabled || !debt.dueDate) continue;
    desired.push({
      linkType: 'finance_debt',
      linkId: debt.id,
      title: `سداد دين: ${debt.creditor}`,
      description: 'دين مستحق السداد',
      date: debt.dueDate,
      time: '09:00',
      repeat: 'once'
    });
  }
  const existing = state.data.reminders.filter((reminder) => ['finance_obligation', 'finance_debt'].includes(reminder.linkType));
  for (const reminder of existing) {
    const match = desired.find((item) => item.linkType === reminder.linkType && item.linkId === reminder.linkId);
    if (!match) {
      try { await deleteReminder(reminder.id); } catch (error) { console.warn('[نظامي] تعذر حذف تذكير مالي', error); }
    }
  }
  for (const item of desired) {
    const reminder = state.data.reminders.find((entry) => entry.linkType === item.linkType && entry.linkId === item.linkId);
    if (!reminder) {
      try { await createReminder(item); } catch (error) { console.warn('[نظامي] تعذر إنشاء تذكير مالي', error); }
    } else if (reminder.date !== item.date || reminder.title !== item.title || reminder.status === 'completed') {
      try {
        await updateReminder(reminder.id, {
          title: item.title,
          description: item.description,
          date: item.date,
          time: item.time,
          repeat: 'once',
          linkType: item.linkType,
          linkId: item.linkId,
          status: 'active'
        });
      } catch (error) { console.warn('[نظامي] تعذر تحديث تذكير مالي', error); }
    }
  }
}

/* ---------------- التقويم ---------------- */
function financeCalendarEvents(startDate, endDate) {
  const events = [];
  for (const obligation of state.data.financeObligations) {
    if (obligation.status === 'ended' || obligation.status === 'paid') continue;
    if (obligation.dueDate >= startDate && obligation.dueDate <= endDate) {
      events.push({
        key: `finance-obligation-${obligation.id}-${obligation.dueDate}`,
        type: 'finance',
        id: obligation.id,
        date: obligation.dueDate,
        time: '',
        title: obligation.name,
        meta: `التزام · ${money(obligation.expectedAmount)}`,
        done: false
      });
    }
  }
  for (const debt of state.data.financeDebts) {
    if (debt.status === 'paid' || debt.status === 'archived' || !debt.dueDate) continue;
    if (debt.dueDate >= startDate && debt.dueDate <= endDate) {
      events.push({
        key: `finance-debt-${debt.id}-${debt.dueDate}`,
        type: 'finance',
        id: debt.id,
        date: debt.dueDate,
        time: '',
        title: `دين: ${debt.creditor}`,
        meta: `سداد دين · ${money(financeDebtRemaining(debt))}`,
        done: false
      });
    }
  }
  for (const goal of state.data.financeSavingsGoals) {
    if (goal.status === 'archived' || !goal.targetDate) continue;
    if (goal.targetDate >= startDate && goal.targetDate <= endDate) {
      events.push({
        key: `finance-goal-${goal.id}-${goal.targetDate}`,
        type: 'finance',
        id: goal.id,
        date: goal.targetDate,
        time: '',
        title: goal.name,
        meta: `هدف ادخار · ${financeGoalProgress(goal).percent}%`,
        done: financeGoalProgress(goal).percent >= 100
      });
    }
  }
  // مواعيد الرواتب المتوقعة داخل نطاق التقويم
  for (const schedule of financeSchedules()) {
    let date = startOfMonthISO(startDate);
    let guard = 0;
    while (date <= endDate && guard < 24) {
      const day = clamp(Number(schedule.dayOfMonth) || 1, 1, 28);
      const occurrence = `${date.slice(0, 7)}-${pad2(day)}`;
      if (occurrence >= startDate && occurrence <= endDate) {
        events.push({
          key: `finance-income-${schedule.id}-${occurrence}`,
          type: 'finance',
          id: schedule.id,
          date: occurrence,
          time: '',
          title: `راتب متوقع: ${schedule.name}`,
          meta: `دخل متوقع · ${money(schedule.amount)}`,
          done: false
        });
      }
      date = addMonthsISO(date, 1);
      guard += 1;
    }
  }
  return events;
}

/* ---------------- قفل PIN ---------------- */
function financeRandomSalt() {
  const bytes = new Uint8Array(16);
  if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function financeSha256(text) {
  if (window.crypto && window.crypto.subtle && window.TextEncoder) {
    const data = new TextEncoder().encode(text);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  // بديل غير تشفيري عند غياب Web Crypto — للاستخدام المحلي فقط.
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < text.length; i += 1) {
    h1 ^= text.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= text.charCodeAt(i) * 31;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return `fallback${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

async function financeHashPin(pin, salt) {
  return financeSha256(`${salt}:${String(pin)}`);
}

async function setFinancePin(pin) {
  const clean = String(pin || '').trim();
  if (!/^\d{4,8}$/.test(clean)) throw new Error('رمز PIN يجب أن يكون من 4 إلى 8 أرقام');
  const salt = financeRandomSalt();
  const hash = await financeHashPin(clean, salt);
  await saveFinanceSettings({ pinEnabled: true, pinSalt: salt, pinHash: hash, pinSetAt: Date.now() });
  state.ui.financeLocked = false;
  await logActivity('lock', 'finance_settings', 'finance', 'تفعيل قفل ماليّاتي', null, { pinEnabled: true });
}

async function verifyFinancePin(pin) {
  const settings = financeSettings();
  if (!settings.pinEnabled || !settings.pinHash || !settings.pinSalt) return true;
  const hash = await financeHashPin(pin, settings.pinSalt);
  return hash === settings.pinHash;
}

async function unlockFinance(pin) {
  const ok = await verifyFinancePin(pin);
  if (!ok) return false;
  state.ui.financeLocked = false;
  return true;
}

function lockFinance() {
  if (financeSettings().pinEnabled) state.ui.financeLocked = true;
}

async function disableFinancePin(pin) {
  const settings = financeSettings();
  if (settings.pinEnabled) {
    const ok = await verifyFinancePin(pin);
    if (!ok) throw new Error('رمز PIN غير صحيح');
  }
  await saveFinanceSettings({ pinEnabled: false, pinHash: null, pinSalt: null, pinSetAt: 0 });
  state.ui.financeLocked = false;
  await logActivity('update', 'finance_settings', 'finance', 'تعطيل قفل ماليّاتي');
}

function financeIsLocked() {
  return Boolean(financeSettings().pinEnabled && state.ui.financeLocked);
}

/* ---------------- الحسابات والتصنيفات ---------------- */
function normalizeFinanceAccount(input, existing = {}) {
  return {
    id: existing.id || input.id || uid('fac'),
    name: String(input.name ?? existing.name ?? '').trim(),
    type: ['personal', 'family'].includes(input.type ?? existing.type) ? (input.type ?? existing.type) : 'personal',
    color: input.color || existing.color || '#6c8cff',
    icon: input.icon || existing.icon || 'wallet',
    openingBalance: financeRound(input.openingBalance ?? existing.openingBalance ?? 0),
    archived: input.archived ?? existing.archived ?? false,
    isDefault: existing.isDefault || input.isDefault || false,
    createdAt: existing.createdAt || input.createdAt || Date.now(),
    updatedAt: Date.now()
  };
}

async function saveFinanceAccount(input = {}, id = '') {
  const existing = id ? financeAccount(id) : null;
  const account = normalizeFinanceAccount(input, existing || {});
  if (!account.name) throw new Error('اسم الحساب مطلوب');
  if (!existing && state.data.financeAccounts.some((item) => item.name === account.name && item.type === account.type)) {
    throw new Error('يوجد حساب بنفس الاسم والنوع');
  }
  await DB.put('finance_accounts', account);
  await logActivity(existing ? 'update' : 'create', 'finance_account', account.id, account.name, existing, account);
  await loadStore('finance_accounts');
  return account;
}

async function archiveFinanceAccount(id) {
  const account = financeAccount(id);
  if (!account) throw new Error('الحساب غير موجود');
  if (account.isDefault) throw new Error('لا يمكن أرشفة الحسابات الافتراضية');
  const used = state.data.financeTransactions.some((tx) => tx.accountId === id || tx.toAccountId === id);
  if (used) throw new Error('لا يمكن أرشفة حساب له معاملات. يمكنك أرشفته فقط بعد إفراغه.');
  const next = { ...account, archived: true, updatedAt: Date.now() };
  await DB.put('finance_accounts', next);
  await logActivity('delete', 'finance_account', id, account.name, account, next);
  await loadStore('finance_accounts');
}

function normalizeFinanceCategory(input, existing = {}) {
  return {
    id: existing.id || input.id || uid('fct'),
    type: input.type === 'income' ? 'income' : (existing.type === 'income' ? 'income' : 'expense'),
    name: String(input.name ?? existing.name ?? '').trim(),
    parentId: String(input.parentId ?? existing.parentId ?? ''),
    icon: input.icon || existing.icon || 'folder',
    color: input.color || existing.color || '#94a3b8',
    isDefault: existing.isDefault || input.isDefault || false,
    archived: input.archived ?? existing.archived ?? false,
    createdAt: existing.createdAt || input.createdAt || Date.now(),
    updatedAt: Date.now()
  };
}

async function saveFinanceCategory(input = {}, id = '') {
  const existing = id ? financeCategory(id) : null;
  const category = normalizeFinanceCategory(input, existing || {});
  if (!category.name) throw new Error('اسم التصنيف مطلوب');
  if (category.parentId === category.id) throw new Error('لا يمكن ربط التصنيف بنفسه');
  if (!existing && state.data.financeCategories.some((item) => item.type === category.type && item.name === category.name && (item.parentId || '') === category.parentId)) {
    throw new Error('يوجد تصنيف بنفس الاسم');
  }
  await DB.put('finance_categories', category);
  await logActivity(existing ? 'update' : 'create', 'finance_category', category.id, category.name, existing, category);
  await loadStore('finance_categories');
  return category;
}

async function archiveFinanceCategory(id) {
  const category = financeCategory(id);
  if (!category) throw new Error('التصنيف غير موجود');
  const used = state.data.financeTransactions.some((tx) => tx.categoryId === id)
    || state.data.financeBudgets.some((budget) => budget.categoryId === id);
  if (used) {
    const next = { ...category, archived: true, updatedAt: Date.now() };
    await DB.put('finance_categories', next);
    await logActivity('delete', 'finance_category', id, category.name, category, next, 'تمت أرشفته لوجود معاملات مرتبطة');
    await loadStore('finance_categories');
    return;
  }
  await DB.remove('finance_categories', id);
  await logActivity('delete', 'finance_category', id, category.name, category, null);
  await loadStore('finance_categories');
}

/* ---------------- المعاملات ---------------- */
function financeTransactionDateTime(date, time) {
  return wallEpoch(date || todayISO(), time || nowHHMM());
}

function financeTransactionBase(input, existing = {}) {
  const type = FINANCE_TX_LABELS[input.type] ? input.type : existing.type;
  if (!type) throw new Error('نوع المعاملة غير صالح');
  const date = input.date || existing.date || todayISO();
  const time = input.time || existing.time || nowHHMM();
  const amount = financeRound(input.amount ?? existing.amount ?? 0);
  if (!(amount > 0)) throw new Error('المبلغ يجب أن يكون أكبر من صفر');
  const accountId = input.accountId || existing.accountId || '';
  if (!financeAccount(accountId)) throw new Error('اختر حسابًا صحيحًا');
  return {
    id: existing.id || input.id || uid('ftx'),
    type,
    amount,
    accountId,
    toAccountId: input.toAccountId ?? existing.toAccountId ?? '',
    direction: input.direction ?? existing.direction ?? '',
    categoryId: input.categoryId ?? existing.categoryId ?? '',
    date,
    time,
    datetime: financeTransactionDateTime(date, time),
    paymentMethod: FINANCE_PAYMENT_METHODS[input.paymentMethod] ? input.paymentMethod : (existing.paymentMethod || 'cash'),
    merchant: String(input.merchant ?? existing.merchant ?? '').trim(),
    notes: String(input.notes ?? existing.notes ?? '').trim(),
    counterparty: String(input.counterparty ?? existing.counterparty ?? '').trim(),
    incomeKind: input.incomeKind ?? existing.incomeKind ?? 'other',
    scheduleId: input.scheduleId ?? existing.scheduleId ?? '',
    obligationId: input.obligationId ?? existing.obligationId ?? '',
    debtId: input.debtId ?? existing.debtId ?? '',
    savingsGoalId: input.savingsGoalId ?? existing.savingsGoalId ?? '',
    linkedGroupId: input.linkedGroupId ?? existing.linkedGroupId ?? '',
    linkedTransactionId: input.linkedTransactionId ?? existing.linkedTransactionId ?? '',
    attachmentId: input.attachmentId ?? existing.attachmentId ?? '',
    createdAt: existing.createdAt || input.createdAt || Date.now(),
    updatedAt: Date.now()
  };
}

function validateExpenseCategory(categoryId) {
  if (!categoryId) return '';
  const category = financeCategory(categoryId);
  if (!category || category.type !== 'expense' || category.archived) throw new Error('تصنيف المصروف غير صالح');
  return categoryId;
}

function validateIncomeCategory(categoryId) {
  if (!categoryId) return '';
  const category = financeCategory(categoryId);
  if (!category || category.type !== 'income' || category.archived) throw new Error('تصنيف الدخل غير صالح');
  return categoryId;
}

async function createFinanceExpense(input) {
  const tx = financeTransactionBase({ ...input, type: 'expense' });
  tx.categoryId = validateExpenseCategory(input.categoryId || 'cat_exp_other');
  if (tx.obligationId) throw new Error('سداد الالتزامات يُسجل من صفحة الالتزامات');
  if (tx.debtId || tx.savingsGoalId) throw new Error('اربط هذه الحركة من قسمها المخصص');
  await DB.put('finance_transactions', tx);
  await logActivity('create', 'finance_transaction', tx.id, `${financeCategoryName(tx.categoryId)} · ${money(tx.amount)}`, null, tx);
  await loadStore('finance_transactions');
  return tx;
}

async function createFinanceIncome(input) {
  const tx = financeTransactionBase({ ...input, type: 'income' });
  tx.categoryId = validateIncomeCategory(input.categoryId || 'cat_inc_other');
  tx.incomeKind = FINANCE_INCOME_KINDS[tx.incomeKind] ? tx.incomeKind : 'other';
  if (tx.scheduleId) {
    const schedule = state.data.financeIncomeSchedules.find((item) => item.id === tx.scheduleId);
    if (schedule) {
      await DB.put('finance_income_schedules', { ...schedule, lastReceivedAt: tx.date, updatedAt: Date.now() });
      await loadStore('finance_income_schedules');
    }
  }
  await DB.put('finance_transactions', tx);
  await logActivity('receive', 'finance_transaction', tx.id, `${FINANCE_INCOME_KINDS[tx.incomeKind]} · ${money(tx.amount)}`, null, tx);
  await loadStore('finance_transactions');
  return tx;
}

async function createFinanceTransfer(input) {
  if (!financeAccount(input.fromAccountId)) throw new Error('اختر الحساب المُحوّل منه');
  if (!financeAccount(input.toAccountId)) throw new Error('اختر الحساب المُحوّل إليه');
  if (input.fromAccountId === input.toAccountId) throw new Error('لا يمكن التحويل إلى نفس الحساب');
  const base = financeTransactionBase({
    ...input,
    accountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    type: 'transfer',
    categoryId: '',
    direction: 'out'
  });
  const groupId = uid('fgrp');
  const outLeg = { ...base, id: uid('ftx'), linkedGroupId: groupId, direction: 'out' };
  const inLeg = {
    ...base,
    id: uid('ftx'),
    accountId: input.toAccountId,
    toAccountId: input.fromAccountId,
    direction: 'in',
    linkedGroupId: groupId,
    linkedTransactionId: outLeg.id
  };
  outLeg.linkedTransactionId = inLeg.id;
  await DB.bulkPut('finance_transactions', [outLeg, inLeg]);
  await logActivity('transfer', 'finance_transaction', groupId,
    `تحويل ${money(base.amount)} من ${financeAccountName(outLeg.accountId)} إلى ${financeAccountName(inLeg.accountId)}`,
    null, { amount: base.amount, fromAccountId: outLeg.accountId, toAccountId: inLeg.accountId, groupId });
  await loadStore('finance_transactions');
  return { groupId, legs: [outLeg, inLeg] };
}

async function updateFinanceTransfer(id, input) {
  const tx = state.data.financeTransactions.find((item) => item.id === id);
  if (!tx || tx.type !== 'transfer') throw new Error('التحويل غير موجود');
  const group = state.data.financeTransactions.filter((item) => item.linkedGroupId && item.linkedGroupId === tx.linkedGroupId);
  const outLeg = group.find((item) => item.direction === 'out') || tx;
  const inLeg = group.find((item) => item.direction === 'in')
    || group.find((item) => item.id !== outLeg.id);
  if (!outLeg || !inLeg) throw new Error('طرفا التحويل غير موجودين');
  const fromAccountId = input.fromAccountId || outLeg.accountId;
  const toAccountId = input.toAccountId || inLeg.accountId;
  if (!financeAccount(fromAccountId) || !financeAccount(toAccountId)) throw new Error('حساب التحويل غير صالح');
  if (fromAccountId === toAccountId) throw new Error('لا يمكن التحويل إلى نفس الحساب');
  const date = input.date || outLeg.date;
  const time = input.time || outLeg.time;
  const amount = financeRound(input.amount ?? outLeg.amount);
  if (!(amount > 0)) throw new Error('المبلغ يجب أن يكون أكبر من صفر');
  const common = {
    amount,
    date,
    time,
    datetime: financeTransactionDateTime(date, time),
    notes: String(input.notes ?? outLeg.notes ?? '').trim(),
    merchant: String(input.merchant ?? outLeg.merchant ?? '').trim(),
    updatedAt: Date.now()
  };
  const nextOut = { ...outLeg, ...common, accountId: fromAccountId, toAccountId, direction: 'out' };
  const nextIn = { ...inLeg, ...common, accountId: toAccountId, toAccountId: fromAccountId, direction: 'in' };
  await DB.bulkPut('finance_transactions', [nextOut, nextIn]);
  await logActivity('update', 'finance_transaction', outLeg.linkedGroupId, 'تعديل تحويل داخلي', { outLeg, inLeg }, { outLeg: nextOut, inLeg: nextIn });
  await loadStore('finance_transactions');
}

async function updateFinanceExpense(id, input) {
  const existing = state.data.financeTransactions.find((item) => item.id === id);
  if (!existing || existing.type !== 'expense') throw new Error('المصروف غير موجود');
  if (input.obligationId && input.obligationId !== existing.obligationId) throw new Error('لا يمكن تغيير ربط سداد الالتزام من هنا');
  const next = financeTransactionBase({ ...existing, ...input, type: 'expense', id }, existing);
  next.categoryId = validateExpenseCategory(next.categoryId || 'cat_exp_other');
  if (existing.obligationId) {
    const payment = state.data.financeObligationPayments.find((item) => item.transactionId === id);
    if (payment) {
      const nextPayment = { ...payment, amount: next.amount, date: next.date, updatedAt: Date.now() };
      await DB.put('finance_obligation_payments', nextPayment);
      await loadStore('finance_obligation_payments');
    }
  }
  await DB.put('finance_transactions', next);
  await logActivity('update', 'finance_transaction', id, `${financeCategoryName(next.categoryId)} · ${money(next.amount)}`, existing, next);
  await loadStore('finance_transactions');
  if (existing.obligationId) await recalcFinanceObligation(existing.obligationId);
  return next;
}

async function updateFinanceIncome(id, input) {
  const existing = state.data.financeTransactions.find((item) => item.id === id);
  if (!existing || existing.type !== 'income') throw new Error('الدخل غير موجود');
  const next = financeTransactionBase({ ...existing, ...input, type: 'income', id }, existing);
  next.categoryId = validateIncomeCategory(next.categoryId || 'cat_inc_other');
  await DB.put('finance_transactions', next);
  await logActivity('update', 'finance_transaction', id, `${FINANCE_INCOME_KINDS[next.incomeKind]} · ${money(next.amount)}`, existing, next);
  await loadStore('finance_transactions');
  return next;
}

/* ---------------- الديون: عمليات ---------------- */
async function createFinanceDebt(input) {
  const principal = financeRound(input.principal);
  if (!(principal > 0)) throw new Error('أصل الدين يجب أن يكون أكبر من صفر');
  if (!String(input.creditor || '').trim()) throw new Error('اسم الدائن مطلوب');
  const accountId = input.accountId || financeSettings().defaultAccountId;
  if (!financeAccount(accountId)) throw new Error('اختر حسابًا صحيحًا');
  const debt = {
    id: uid('fdb'),
    creditor: String(input.creditor).trim(),
    principal,
    accountId,
    date: input.date || todayISO(),
    dueDate: input.dueDate || '',
    notes: String(input.notes || '').trim(),
    reminderEnabled: Boolean(input.reminderEnabled),
    linkedGoalId: '',
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  const tx = financeTransactionBase({
    type: 'debt_borrow',
    amount: principal,
    accountId,
    date: debt.date,
    time: input.time || nowHHMM(),
    counterparty: debt.creditor,
    debtId: debt.id,
    notes: debt.notes
  });
  debt.originalTransactionId = tx.id;
  await DB.put('finance_debts', debt);
  await DB.put('finance_transactions', tx);
  await loadStore('finance_debts');
  await loadStore('finance_transactions');
  await logActivity('create', 'finance_debt', debt.id, `${debt.creditor} · ${money(principal)}`, null, debt);
  if (debt.reminderEnabled) await syncFinanceReminders();
  return debt;
}

async function updateFinanceDebt(id, input) {
  const existing = state.data.financeDebts.find((item) => item.id === id);
  if (!existing) throw new Error('الدين غير موجود');
  const paid = financeDebtPaid(existing);
  const principal = financeRound(input.principal ?? existing.principal);
  if (!(principal > 0)) throw new Error('أصل الدين يجب أن يكون أكبر من صفر');
  if (principal < paid) throw new Error('لا يمكن أن يكون أصل الدين أقل من مجموع الدفعات المسجلة');
  const next = {
    ...existing,
    creditor: String(input.creditor ?? existing.creditor).trim(),
    principal,
    accountId: input.accountId || existing.accountId,
    date: input.date || existing.date,
    dueDate: input.dueDate ?? existing.dueDate,
    notes: String(input.notes ?? existing.notes).trim(),
    reminderEnabled: input.reminderEnabled ?? existing.reminderEnabled,
    updatedAt: Date.now()
  };
  if (!next.creditor) throw new Error('اسم الدائن مطلوب');
  next.status = financeRound(principal - paid) <= 0 ? 'paid' : 'active';
  await DB.put('finance_debts', next);
  const borrow = state.data.financeTransactions.find((tx) => tx.debtId === id && tx.type === 'debt_borrow');
  if (borrow) {
    await DB.put('finance_transactions', {
      ...borrow,
      amount: principal,
      accountId: next.accountId,
      date: next.date,
      datetime: financeTransactionDateTime(next.date, borrow.time),
      counterparty: next.creditor,
      notes: next.notes,
      updatedAt: Date.now()
    });
    await loadStore('finance_transactions');
  }
  await logActivity('update', 'finance_debt', id, next.creditor, existing, next);
  await loadStore('finance_debts');
  await syncFinanceReminders();
  return next;
}

async function createFinanceDebtPayment(input) {
  const debt = state.data.financeDebts.find((item) => item.id === input.debtId);
  if (!debt) throw new Error('الدين غير موجود');
  const remaining = financeDebtRemaining(debt);
  const amount = financeRound(input.amount);
  if (!(amount > 0)) throw new Error('مبلغ الدفعة يجب أن يكون أكبر من صفر');
  if (amount > remaining + 0.0005) throw new Error(`المبلغ أكبر من المتبقي (${money(remaining)})`);
  const accountId = input.accountId || debt.accountId || financeSettings().defaultAccountId;
  if (!financeAccount(accountId)) throw new Error('اختر حساب الدفع');
  const tx = financeTransactionBase({
    type: 'debt_payment',
    amount,
    accountId,
    date: input.date || todayISO(),
    time: input.time || nowHHMM(),
    debtId: debt.id,
    counterparty: debt.creditor,
    notes: input.notes || ''
  });
  const payment = {
    id: uid('fdp'),
    debtId: debt.id,
    transactionId: tx.id,
    amount,
    date: tx.date,
    note: String(input.notes || '').trim(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await DB.put('finance_transactions', tx);
  await DB.put('finance_debt_payments', payment);
  await loadStore('finance_transactions');
  await loadStore('finance_debt_payments');
  await recalcFinanceDebt(debt.id);
  await logActivity('pay', 'finance_debt_payment', payment.id, `${debt.creditor} · ${money(amount)}`, null, payment);
  return payment;
}

async function updateFinanceDebtPayment(paymentId, input) {
  const payment = state.data.financeDebtPayments.find((item) => item.id === paymentId);
  if (!payment) throw new Error('الدفعة غير موجودة');
  const debt = state.data.financeDebts.find((item) => item.id === payment.debtId);
  if (!debt) throw new Error('الدين غير موجود');
  const others = financeRound(sum(financeDebtPayments(debt.id).filter((item) => item.id !== paymentId), (item) => item.amount));
  const max = Math.max(0, financeRound(debt.principal - others));
  const amount = financeRound(input.amount ?? payment.amount);
  if (!(amount > 0) || amount > max + 0.0005) throw new Error(`المبلغ يجب أن يكون بين 0 و${money(max)}`);
  const tx = state.data.financeTransactions.find((item) => item.id === payment.transactionId);
  const date = input.date || payment.date;
  const time = input.time || (tx?.time || nowHHMM());
  const nextPayment = { ...payment, amount, date, note: String(input.notes ?? payment.note ?? '').trim(), updatedAt: Date.now() };
  await DB.put('finance_debt_payments', nextPayment);
  if (tx) {
    const nextTx = {
      ...tx,
      amount,
      date,
      time,
      datetime: financeTransactionDateTime(date, time),
      notes: nextPayment.note,
      updatedAt: Date.now()
    };
    await DB.put('finance_transactions', nextTx);
    await loadStore('finance_transactions');
  }
  await loadStore('finance_debt_payments');
  await recalcFinanceDebt(debt.id);
  await logActivity('update', 'finance_debt_payment', paymentId, `${debt.creditor} · ${money(amount)}`, payment, nextPayment);
  return nextPayment;
}

async function deleteFinanceDebt(id) {
  const debt = state.data.financeDebts.find((item) => item.id === id);
  if (!debt) return;
  const payments = financeDebtPayments(id);
  const txIds = payments.map((payment) => payment.transactionId).filter(Boolean);
  const borrow = state.data.financeTransactions.find((tx) => tx.debtId === id && tx.type === 'debt_borrow');
  if (borrow) txIds.push(borrow.id);
  await removeFinanceAttachmentsForTransactions(txIds);
  if (txIds.length) await DB.bulkRemove('finance_transactions', txIds);
  if (payments.length) await DB.bulkRemove('finance_debt_payments', payments.map((payment) => payment.id));
  await DB.remove('finance_debts', id);
  await loadStore('finance_transactions');
  await loadStore('finance_debt_payments');
  await loadStore('finance_debts');
  await logActivity('delete', 'finance_debt', id, debt.creditor, debt, null);
  await syncFinanceReminders();
}

async function recalcFinanceDebt(id) {
  const debt = state.data.financeDebts.find((item) => item.id === id);
  if (!debt) return;
  const remaining = financeDebtRemaining(debt);
  const status = debt.status === 'archived' ? 'archived' : (remaining <= 0.0005 ? 'paid' : 'active');
  if (debt.remaining !== remaining || debt.status !== status) {
    const next = { ...debt, remaining, status, updatedAt: Date.now() };
    await DB.put('finance_debts', next);
    await loadStore('finance_debts');
  }
  if (status === 'paid') await syncFinanceReminders();
}

/* ---------------- الادخار: عمليات ---------------- */
async function createFinanceSavingsGoal(input) {
  const target = financeRound(input.targetAmount);
  if (!(target > 0)) throw new Error('المبلغ المستهدف يجب أن يكون أكبر من صفر');
  if (!String(input.name || '').trim()) throw new Error('اسم هدف الادخار مطلوب');
  const accountId = input.accountId || financeSettings().defaultAccountId;
  if (!financeAccount(accountId)) throw new Error('اختر حسابًا صحيحًا');
  const goal = {
    id: uid('fsg'),
    name: String(input.name).trim(),
    targetAmount: target,
    accountId,
    startDate: input.startDate || todayISO(),
    targetDate: input.targetDate || addMonthsISO(todayISO(), 6),
    notes: String(input.notes || '').trim(),
    linkedGoalId: String(input.linkedGoalId || ''),
    status: 'active',
    color: input.color || '#35e0b5',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  if (input.createLinkedGoal && !goal.linkedGoalId && typeof createGoal === 'function') {
    const linked = await createGoal({
      title: goal.name,
      description: 'هدف ادخار مرتبط بماليّاتي',
      startDate: goal.startDate,
      endDate: goal.targetDate,
      targetValue: goal.targetAmount,
      currentValue: 0,
      unit: financeCurrency(),
      color: goal.color,
      status: 'active'
    });
    goal.linkedGoalId = linked.id;
  }
  await DB.put('finance_savings_goals', goal);
  await loadStore('finance_savings_goals');
  await logActivity('create', 'finance_savings_goal', goal.id, `${goal.name} · ${money(target)}`, null, goal);
  return goal;
}

async function updateFinanceSavingsGoal(id, input) {
  const existing = state.data.financeSavingsGoals.find((item) => item.id === id);
  if (!existing) throw new Error('هدف الادخار غير موجود');
  const saved = financeGoalSaved(id);
  const target = financeRound(input.targetAmount ?? existing.targetAmount);
  if (!(target > 0)) throw new Error('المبلغ المستهدف يجب أن يكون أكبر من صفر');
  if (target < saved) throw new Error('لا يمكن أن يكون الهدف أقل من المبلغ المدخر الحالي');
  const next = {
    ...existing,
    name: String(input.name ?? existing.name).trim(),
    targetAmount: target,
    accountId: input.accountId || existing.accountId,
    startDate: input.startDate || existing.startDate,
    targetDate: input.targetDate || existing.targetDate,
    notes: String(input.notes ?? existing.notes).trim(),
    status: saved >= target ? 'completed' : (input.status || existing.status || 'active'),
    updatedAt: Date.now()
  };
  if (!next.name) throw new Error('اسم هدف الادخار مطلوب');
  if (next.status !== 'completed' && saved < target) next.status = input.status === 'archived' ? 'archived' : 'active';
  await DB.put('finance_savings_goals', next);
  await loadStore('finance_savings_goals');
  await syncSavingsLinkedGoal(next);
  await logActivity('update', 'finance_savings_goal', id, next.name, existing, next);
  return next;
}

async function createFinanceSavingsEntry(input) {
  const goal = state.data.financeSavingsGoals.find((item) => item.id === input.goalId);
  if (!goal) throw new Error('هدف الادخار غير موجود');
  const type = input.type === 'withdraw' ? 'withdraw' : 'deposit';
  const amount = financeRound(input.amount);
  if (!(amount > 0)) throw new Error('المبلغ يجب أن يكون أكبر من صفر');
  const saved = financeGoalSaved(goal.id);
  if (type === 'withdraw' && amount > saved + 0.0005) throw new Error(`لا يمكن سحب أكثر من المدخر (${money(saved)})`);
  const tx = financeTransactionBase({
    type: type === 'deposit' ? 'savings_deposit' : 'savings_withdraw',
    amount,
    accountId: goal.accountId,
    date: input.date || todayISO(),
    time: input.time || nowHHMM(),
    savingsGoalId: goal.id,
    notes: input.notes || ''
  });
  const entry = {
    id: uid('fse'),
    goalId: goal.id,
    transactionId: tx.id,
    amount,
    type,
    date: tx.date,
    note: String(input.notes || '').trim(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await DB.put('finance_transactions', tx);
  await DB.put('finance_savings_entries', entry);
  await loadStore('finance_transactions');
  await loadStore('finance_savings_entries');
  await recalcFinanceSavingsGoal(goal.id);
  await logActivity(type === 'deposit' ? 'progress' : 'update', 'finance_savings_entry', entry.id,
    `${goal.name} · ${money(amount)}`, null, entry);
  return entry;
}

async function updateFinanceSavingsEntry(entryId, input) {
  const entry = state.data.financeSavingsEntries.find((item) => item.id === entryId);
  if (!entry) throw new Error('حركة الادخار غير موجودة');
  const goal = state.data.financeSavingsGoals.find((item) => item.id === entry.goalId);
  if (!goal) throw new Error('هدف الادخار غير موجود');
  const amount = financeRound(input.amount ?? entry.amount);
  if (!(amount > 0)) throw new Error('المبلغ يجب أن يكون أكبر من صفر');
  const savedWithout = financeRound(sum(financeSavingsEntries(goal.id).filter((item) => item.id !== entryId),
    (item) => (item.type === 'withdraw' ? -1 : 1) * (Number(item.amount) || 0)));
  if (entry.type === 'withdraw' && amount > savedWithout + 0.0005) throw new Error(`لا يمكن سحب أكثر من المدخر (${money(savedWithout)})`);
  const date = input.date || entry.date;
  const tx = state.data.financeTransactions.find((item) => item.id === entry.transactionId);
  const time = input.time || (tx?.time || nowHHMM());
  const nextEntry = { ...entry, amount, date, note: String(input.notes ?? entry.note ?? '').trim(), updatedAt: Date.now() };
  await DB.put('finance_savings_entries', nextEntry);
  if (tx) {
    await DB.put('finance_transactions', {
      ...tx,
      amount,
      date,
      time,
      datetime: financeTransactionDateTime(date, time),
      notes: nextEntry.note,
      updatedAt: Date.now()
    });
    await loadStore('finance_transactions');
  }
  await loadStore('finance_savings_entries');
  await recalcFinanceSavingsGoal(goal.id);
  await logActivity('update', 'finance_savings_entry', entryId, `${goal.name} · ${money(amount)}`, entry, nextEntry);
  return nextEntry;
}

async function deleteFinanceSavingsGoal(id) {
  const goal = state.data.financeSavingsGoals.find((item) => item.id === id);
  if (!goal) return;
  const entries = financeSavingsEntries(id);
  const txIds = entries.map((entry) => entry.transactionId).filter(Boolean);
  await removeFinanceAttachmentsForTransactions(txIds);
  if (txIds.length) await DB.bulkRemove('finance_transactions', txIds);
  if (entries.length) await DB.bulkRemove('finance_savings_entries', entries.map((entry) => entry.id));
  await DB.remove('finance_savings_goals', id);
  await loadStore('finance_transactions');
  await loadStore('finance_savings_entries');
  await loadStore('finance_savings_goals');
  await logActivity('delete', 'finance_savings_goal', id, goal.name, goal, null);
  if (goal.linkedGoalId && typeof deleteGoal === 'function') {
    try { await deleteGoal(goal.linkedGoalId); } catch (error) { console.warn('[نظامي] تعذر حذف الهدف المرتبط', error); }
  }
}

async function recalcFinanceSavingsGoal(id) {
  const goal = state.data.financeSavingsGoals.find((item) => item.id === id);
  if (!goal) return;
  const saved = Math.max(0, financeGoalSaved(id));
  const status = goal.status === 'archived' ? 'archived'
    : saved >= Number(goal.targetAmount) ? 'completed' : 'active';
  if (goal.savedAmount !== saved || goal.status !== status) {
    const next = { ...goal, savedAmount: saved, status, updatedAt: Date.now() };
    await DB.put('finance_savings_goals', next);
    await loadStore('finance_savings_goals');
  }
  await syncSavingsLinkedGoal(goal);
}

async function syncSavingsLinkedGoal(goal) {
  if (!goal?.linkedGoalId || typeof updateGoal !== 'function') return;
  const linked = state.data.goals.find((item) => item.id === goal.linkedGoalId);
  if (!linked) return;
  const saved = Math.max(0, financeGoalSaved(goal.id));
  if (Math.abs((Number(linked.currentValue) || 0) - saved) < 0.0005) return;
  try {
    await updateGoal(linked.id, {
      ...linked,
      currentValue: saved,
      status: saved >= Number(goal.targetAmount) ? 'completed' : 'active'
    });
  } catch (error) {
    console.warn('[نظامي] تعذر تحديث الهدف العام المرتبط', error);
  }
}

/* ---------------- الالتزامات: عمليات ---------------- */
async function createFinanceObligation(input) {
  const amount = financeRound(input.expectedAmount);
  if (!(amount > 0)) throw new Error('المبلغ المتوقع يجب أن يكون أكبر من صفر');
  if (!String(input.name || '').trim()) throw new Error('اسم الالتزام مطلوب');
  const accountId = input.accountId || financeSettings().defaultAccountId;
  if (!financeAccount(accountId)) throw new Error('اختر حسابًا صحيحًا');
  const recurrence = FINANCE_RECURRENCE[input.recurrence] ? input.recurrence : 'monthly';
  const dueDate = input.dueDate || todayISO();
  const obligation = {
    id: uid('fob'),
    name: String(input.name).trim(),
    accountId,
    expectedAmount: amount,
    dueDate,
    firstDueDate: dueDate,
    recurrence,
    type: FINANCE_OBLIGATION_TYPES[input.type] ? input.type : 'other',
    categoryId: validateExpenseCategory(input.categoryId || 'cat_exp_other'),
    status: 'active',
    cyclePaid: 0,
    reminderEnabled: Boolean(input.reminderEnabled),
    reminderTime: input.reminderTime || '09:00',
    notes: String(input.notes || '').trim(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await DB.put('finance_obligations', obligation);
  await loadStore('finance_obligations');
  await logActivity('create', 'finance_obligation', obligation.id, `${obligation.name} · ${money(amount)}`, null, obligation);
  await syncFinanceReminders();
  return obligation;
}

async function updateFinanceObligation(id, input) {
  const existing = state.data.financeObligations.find((item) => item.id === id);
  if (!existing) throw new Error('الالتزام غير موجود');
  const amount = financeRound(input.expectedAmount ?? existing.expectedAmount);
  if (!(amount > 0)) throw new Error('المبلغ المتوقع يجب أن يكون أكبر من صفر');
  const next = {
    ...existing,
    name: String(input.name ?? existing.name).trim(),
    accountId: input.accountId || existing.accountId,
    expectedAmount: amount,
    dueDate: input.dueDate || existing.dueDate,
    firstDueDate: input.dueDate || existing.firstDueDate || existing.dueDate,
    recurrence: FINANCE_RECURRENCE[input.recurrence] ? input.recurrence : existing.recurrence,
    type: FINANCE_OBLIGATION_TYPES[input.type] ? input.type : existing.type,
    categoryId: validateExpenseCategory(input.categoryId || existing.categoryId || 'cat_exp_other'),
    status: ['active', 'paused', 'ended'].includes(input.status) ? input.status : existing.status,
    reminderEnabled: input.reminderEnabled ?? existing.reminderEnabled,
    reminderTime: input.reminderTime || existing.reminderTime || '09:00',
    notes: String(input.notes ?? existing.notes).trim(),
    updatedAt: Date.now()
  };
  if (!next.name) throw new Error('اسم الالتزام مطلوب');
  await DB.put('finance_obligations', next);
  await loadStore('finance_obligations');
  await recalcFinanceObligation(id);
  await syncFinanceReminders();
  await logActivity('update', 'finance_obligation', id, next.name, existing, next);
  return next;
}

async function createFinanceObligationPayment(input) {
  const obligation = state.data.financeObligations.find((item) => item.id === input.obligationId);
  if (!obligation) throw new Error('الالتزام غير موجود');
  const info = financeObligationInfo(obligation);
  const amount = financeRound(input.amount ?? info.remainingDue);
  if (!(amount > 0)) throw new Error('مبلغ السداد يجب أن يكون أكبر من صفر');
  if (amount > info.remainingDue + 0.0005) throw new Error(`المبلغ أكبر من المتبقي لهذه الدورة (${money(info.remainingDue)})`);
  const accountId = input.accountId || obligation.accountId;
  if (!financeAccount(accountId)) throw new Error('اختر حساب الدفع');
  const tx = financeTransactionBase({
    type: 'expense',
    amount,
    accountId,
    date: input.date || todayISO(),
    time: input.time || nowHHMM(),
    obligationId: obligation.id,
    categoryId: validateExpenseCategory(input.categoryId || obligation.categoryId || 'cat_exp_other'),
    merchant: input.merchant || obligation.name,
    notes: input.notes || '',
    paymentMethod: input.paymentMethod || 'cash'
  });
  const payment = {
    id: uid('fop'),
    obligationId: obligation.id,
    transactionId: tx.id,
    amount,
    date: tx.date,
    note: String(input.notes || '').trim(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await DB.put('finance_transactions', tx);
  await DB.put('finance_obligation_payments', payment);
  await loadStore('finance_transactions');
  await loadStore('finance_obligation_payments');
  await recalcFinanceObligation(obligation.id);
  await logActivity('pay', 'finance_obligation_payment', payment.id, `${obligation.name} · ${money(amount)}`, null, payment);
  await syncFinanceReminders();
  return payment;
}

async function updateFinanceObligationPayment(paymentId, input) {
  const payment = state.data.financeObligationPayments.find((item) => item.id === paymentId);
  if (!payment) throw new Error('الدفعة غير موجودة');
  const obligation = state.data.financeObligations.find((item) => item.id === payment.obligationId);
  if (!obligation) throw new Error('الالتزام غير موجود');
  const info = financeObligationInfo(obligation);
  const max = financeRound(info.remainingDue + Number(payment.amount || 0));
  const amount = financeRound(input.amount ?? payment.amount);
  if (!(amount > 0) || amount > max + 0.0005) throw new Error(`المبلغ يجب أن يكون بين 0 و${money(max)}`);
  const tx = state.data.financeTransactions.find((item) => item.id === payment.transactionId);
  const date = input.date || payment.date;
  const time = input.time || (tx?.time || nowHHMM());
  const nextPayment = { ...payment, amount, date, note: String(input.notes ?? payment.note ?? '').trim(), updatedAt: Date.now() };
  await DB.put('finance_obligation_payments', nextPayment);
  if (tx) {
    await DB.put('finance_transactions', {
      ...tx,
      amount,
      date,
      time,
      datetime: financeTransactionDateTime(date, time),
      notes: nextPayment.note,
      updatedAt: Date.now()
    });
    await loadStore('finance_transactions');
  }
  await loadStore('finance_obligation_payments');
  await recalcFinanceObligation(obligation.id);
  await syncFinanceReminders();
  await logActivity('update', 'finance_obligation_payment', paymentId, `${obligation.name} · ${money(amount)}`, payment, nextPayment);
  return nextPayment;
}

async function deleteFinanceObligation(id) {
  const obligation = state.data.financeObligations.find((item) => item.id === id);
  if (!obligation) return;
  const payments = financeObligationPayments(id);
  const txIds = payments.map((payment) => payment.transactionId).filter(Boolean);
  await removeFinanceAttachmentsForTransactions(txIds);
  if (txIds.length) await DB.bulkRemove('finance_transactions', txIds);
  if (payments.length) await DB.bulkRemove('finance_obligation_payments', payments.map((payment) => payment.id));
  await DB.remove('finance_obligations', id);
  await loadStore('finance_transactions');
  await loadStore('finance_obligation_payments');
  await loadStore('finance_obligations');
  await logActivity('delete', 'finance_obligation', id, obligation.name, obligation, null);
  await syncFinanceReminders();
}

async function recalcFinanceObligation(id) {
  const obligation = state.data.financeObligations.find((item) => item.id === id);
  if (!obligation) return;
  const payments = financeObligationPayments(id);
  const totalPaid = financeRound(sum(payments, (payment) => payment.amount));
  const expected = Number(obligation.expectedAmount) || 0;
  const start = obligation.firstDueDate || obligation.dueDate || todayISO();
  let dueDate = start;
  let cyclePaid = totalPaid;
  let status = obligation.status;

  if (obligation.recurrence === 'once') {
    cyclePaid = Math.min(totalPaid, expected);
    status = totalPaid >= expected - 0.0005 ? 'paid' : (obligation.status === 'paused' || obligation.status === 'ended' ? obligation.status : 'active');
  } else {
    let guard = 0;
    while (cyclePaid >= expected - 0.0005 && expected > 0 && guard < 600) {
      cyclePaid = financeRound(cyclePaid - expected);
      dueDate = financeNextRecurrence(dueDate, obligation.recurrence);
      guard += 1;
    }
    if (obligation.status !== 'paused' && obligation.status !== 'ended') status = 'active';
  }

  const next = {
    ...obligation,
    dueDate,
    firstDueDate: start,
    cyclePaid,
    paidTotal: totalPaid,
    status,
    updatedAt: Date.now()
  };
  if (obligation.dueDate !== dueDate || obligation.cyclePaid !== cyclePaid
    || obligation.status !== status || obligation.paidTotal !== totalPaid) {
    await DB.put('finance_obligations', next);
    await loadStore('finance_obligations');
  }
}

/* ---------------- الميزانيات: عمليات ---------------- */
async function saveFinanceBudget(input) {
  const limit = financeRound(input.limit);
  if (!(limit > 0)) throw new Error('حد الميزانية يجب أن يكون أكبر من صفر');
  const scope = input.scope === 'category' ? 'category' : 'overall';
  const period = input.period || financeMonthKey();
  if (!/^\d{4}-\d{2}$/.test(period)) throw new Error('شهر الميزانية غير صالح');
  const accountType = ['all', 'personal', 'family'].includes(input.accountType) ? input.accountType : 'all';
  const categoryId = scope === 'category' ? validateExpenseCategory(input.categoryId) : '';
  if (scope === 'category' && !categoryId) throw new Error('اختر تصنيفًا للميزانية');
  const existing = state.data.financeBudgets.find((budget) => budget.period === period
    && budget.scope === scope
    && budget.accountType === accountType
    && (budget.categoryId || '') === (categoryId || ''));
  const budget = {
    id: existing?.id || uid('fbg'),
    scope,
    period,
    accountType,
    categoryId,
    limit,
    alertThreshold: clamp(Number(input.alertThreshold) || financeSettings().budgetAlertThreshold, 50, 100),
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now()
  };
  await DB.put('finance_budgets', budget);
  await loadStore('finance_budgets');
  await logActivity(existing ? 'update' : 'create', 'finance_budget', budget.id,
    `${budget.scope === 'overall' ? 'ميزانية عامة' : financeCategoryName(categoryId)} · ${period}`, existing || null, budget);
  return budget;
}

async function deleteFinanceBudget(id) {
  const budget = state.data.financeBudgets.find((item) => item.id === id);
  if (!budget) return;
  await DB.remove('finance_budgets', id);
  await loadStore('finance_budgets');
  await logActivity('delete', 'finance_budget', id,
    `${budget.scope === 'overall' ? 'ميزانية عامة' : financeCategoryName(budget.categoryId)} · ${budget.period}`, budget, null);
}

/* ---------------- جداول الدخل: عمليات ---------------- */
async function saveFinanceIncomeSchedule(input) {
  const amount = financeRound(input.amount);
  if (!(amount > 0)) throw new Error('مبلغ الدخل المتوقع يجب أن يكون أكبر من صفر');
  if (!String(input.name || '').trim()) throw new Error('اسم جدول الدخل مطلوب');
  const accountId = input.accountId || financeSettings().defaultAccountId;
  if (!financeAccount(accountId)) throw new Error('اختر حسابًا صحيحًا');
  const existing = input.id ? state.data.financeIncomeSchedules.find((item) => item.id === input.id) : null;
  const schedule = {
    id: existing?.id || uid('fsc'),
    name: String(input.name).trim(),
    accountId,
    amount,
    dayOfMonth: clamp(Number(input.dayOfMonth) || 1, 1, 28),
    categoryId: validateIncomeCategory(input.categoryId || 'cat_inc_salary'),
    source: String(input.source || '').trim(),
    enabled: input.enabled !== false,
    lastReceivedAt: existing?.lastReceivedAt || input.lastReceivedAt || '',
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now()
  };
  await DB.put('finance_income_schedules', schedule);
  await loadStore('finance_income_schedules');
  await logActivity(existing ? 'update' : 'create', 'finance_income_schedule', schedule.id, schedule.name, existing || null, schedule);
  return schedule;
}

async function deleteFinanceIncomeSchedule(id) {
  const schedule = state.data.financeIncomeSchedules.find((item) => item.id === id);
  if (!schedule) return;
  await DB.remove('finance_income_schedules', id);
  await loadStore('finance_income_schedules');
  await logActivity('delete', 'finance_income_schedule', id, schedule.name, schedule, null);
}

/* ---------------- حذف المعاملات المرتبطة ---------------- */
async function removeFinanceAttachmentsForTransactions(transactionIds) {
  const ids = new Set((transactionIds || []).filter(Boolean));
  if (!ids.size) return 0;
  const attachments = state.data.financeAttachments.filter((item) => ids.has(item.transactionId));
  if (!attachments.length) return 0;
  await DB.bulkRemove('finance_attachments', attachments.map((item) => item.id));
  await loadStore('finance_attachments');
  return attachments.length;
}

async function deleteFinanceTransaction(id) {
  const tx = state.data.financeTransactions.find((item) => item.id === id);
  if (!tx) return;

  // طرفا التحويل يُحذفان معًا حفاظًا على التوازن.
  if (tx.type === 'transfer' && tx.linkedGroupId) {
    const group = state.data.financeTransactions.filter((item) => item.linkedGroupId === tx.linkedGroupId);
    await removeFinanceAttachmentsForTransactions(group.map((item) => item.id));
    await DB.bulkRemove('finance_transactions', group.map((item) => item.id));
    await loadStore('finance_transactions');
    await logActivity('delete', 'finance_transaction', tx.linkedGroupId, 'حذف تحويل داخلي', group, null);
    return;
  }

  if (tx.type === 'debt_borrow') {
    const debt = state.data.financeDebts.find((item) => item.id === tx.debtId);
    if (debt && financeDebtPayments(debt.id).length) {
      throw new Error('لا يمكن حذف أصل الدين لوجود دفعات سداد مسجلة. احذف الدين كاملًا أو الدفعات أولًا.');
    }
    await removeFinanceAttachmentsForTransactions([id]);
    await DB.remove('finance_transactions', id);
    if (debt) await DB.remove('finance_debts', debt.id);
    await loadStore('finance_transactions');
    await loadStore('finance_debts');
    await logActivity('delete', 'finance_transaction', id, `أصل دين ${debt?.creditor || ''}`, tx, null);
    await syncFinanceReminders();
    return;
  }

  if (tx.type === 'debt_payment') {
    const payments = state.data.financeDebtPayments.filter((payment) => payment.transactionId === id);
    if (payments.length) await DB.bulkRemove('finance_debt_payments', payments.map((payment) => payment.id));
    await removeFinanceAttachmentsForTransactions([id]);
    await DB.remove('finance_transactions', id);
    await loadStore('finance_transactions');
    await loadStore('finance_debt_payments');
    if (tx.debtId) await recalcFinanceDebt(tx.debtId);
    await logActivity('delete', 'finance_transaction', id, 'حذف دفعة دين', tx, null);
    return;
  }

  if (tx.obligationId) {
    const payments = state.data.financeObligationPayments.filter((payment) => payment.transactionId === id);
    if (payments.length) await DB.bulkRemove('finance_obligation_payments', payments.map((payment) => payment.id));
    await removeFinanceAttachmentsForTransactions([id]);
    await DB.remove('finance_transactions', id);
    await loadStore('finance_transactions');
    await loadStore('finance_obligation_payments');
    await recalcFinanceObligation(tx.obligationId);
    await syncFinanceReminders();
    await logActivity('delete', 'finance_transaction', id, 'حذف سداد التزام', tx, null);
    return;
  }

  if (tx.savingsGoalId) {
    const entries = state.data.financeSavingsEntries.filter((entry) => entry.transactionId === id);
    if (entries.length) await DB.bulkRemove('finance_savings_entries', entries.map((entry) => entry.id));
    await removeFinanceAttachmentsForTransactions([id]);
    await DB.remove('finance_transactions', id);
    await loadStore('finance_transactions');
    await loadStore('finance_savings_entries');
    await recalcFinanceSavingsGoal(tx.savingsGoalId);
    await logActivity('delete', 'finance_transaction', id, 'حذف حركة ادخار', tx, null);
    return;
  }

  await removeFinanceAttachmentsForTransactions([id]);
  await DB.remove('finance_transactions', id);
  await loadStore('finance_transactions');
  await logActivity('delete', 'finance_transaction', id, financeTransactionTitle(tx), tx, null);
}

/* ---------------- المرفقات ---------------- */
function financeReadFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('تعذر قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

async function saveFinanceAttachment(transactionId, file) {
  if (!transactionId || !file) return null;
  if (file.size > 3 * 1024 * 1024) throw new Error('حجم صورة الفاتورة يجب ألا يتجاوز 3 ميجابايت');
  const record = {
    id: uid('fat'),
    transactionId,
    name: file.name || 'فاتورة',
    type: file.type || 'application/octet-stream',
    size: file.size || 0,
    addedAt: Date.now()
  };
  if (DB.isFallback()) {
    record.dataUrl = await financeReadFileAsDataURL(file);
  } else {
    record.blob = file;
  }
  await DB.put('finance_attachments', record);
  await loadStore('finance_attachments');
  return record;
}

function financeAttachmentUrl(attachment) {
  if (!attachment) return '';
  if (attachment.dataUrl) return attachment.dataUrl;
  if (attachment.blob && typeof URL !== 'undefined' && URL.createObjectURL) {
    return URL.createObjectURL(attachment.blob);
  }
  return '';
}

async function deleteFinanceAttachment(id) {
  const attachment = state.data.financeAttachments.find((item) => item.id === id);
  if (!attachment) return;
  await DB.remove('finance_attachments', id);
  await loadStore('finance_attachments');
}

async function saveFinanceAttachmentToTransaction(transactionId, attachmentId) {
  const tx = state.data.financeTransactions.find((item) => item.id === transactionId);
  if (!tx) return;
  await DB.put('finance_transactions', { ...tx, attachmentId, updatedAt: Date.now() });
  await loadStore('finance_transactions');
}

/* ---------------- إعادة تحميل دفعة ---------------- */
async function reloadFinanceStores(names = []) {
  for (const name of names) await loadStore(name);
}
