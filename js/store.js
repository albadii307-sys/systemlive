/* =========================================================
   نظامي — الحالة المركزية وعمليات البيانات
   كل عملية تُحفظ فورًا، وتُسجّل في سجل النشاط، وتُعيد تحميل المخزن
   ========================================================= */
'use strict';

const DEFAULT_SETTINGS = {
  userName: '',
  sleepGoalHours: 8,
  weekStartsOn: 0,
  notificationsAsked: false,
  notificationsEnabled: false,
  prayer: null,
  finance: null,
  createdAt: Date.now(),
  schemaVersion: SCHEMA_VERSION
};

const state = {
  ready: false,
  view: 'dashboard',
  dbMode: 'idle',
  dbError: null,
  data: {
    habits: [],
    habitLogs: [],
    tasks: [],
    goals: [],
    milestones: [],
    sleep: [],
    reminders: [],
    prayerLogs: [],
    adhanLibrary: [],
    activity: [],
    financeAccounts: [],
    financeCategories: [],
    financeTransactions: [],
    financeObligations: [],
    financeObligationPayments: [],
    financeDebts: [],
    financeDebtPayments: [],
    financeSavingsGoals: [],
    financeSavingsEntries: [],
    financeBudgets: [],
    financeIncomeSchedules: [],
    financeAttachments: []
  },
  settings: { ...DEFAULT_SETTINGS },
  ui: {
    calendarMode: 'month',
    calendarCursor: todayISO(),
    calendarFilters: new Set(['tasks', 'habits', 'reminders', 'sleep', 'prayer', 'finance']),
    prayerDate: null,
    prayerStatsDays: 7,
    sleepChartDays: 7,
    sleepFilter: 'all',
    reminderTab: 'upcoming',
    taskStatus: 'all',
    taskPriority: 'all',
    taskCategory: 'all',
    taskQuery: '',
    habitFilter: 'all',
    activityQuery: '',
    activityAction: 'all',
    activityEntity: 'all',
    activityPeriod: 'all',
    activityFrom: '',
    activityTo: '',
    activityLimit: 80,
    financeTab: 'dashboard',
    financeAccount: 'all',
    financeScope: 'all',
    financePeriod: 'month',
    financeFrom: '',
    financeTo: '',
    financeQuery: '',
    financeType: 'all',
    financeCategoryFilter: 'all',
    financePaymentFilter: 'all',
    financeLocked: true,
    financeCursor: todayISO(),
    financeReportTab: 'overview',
    sidebarOpen: false
  }
};

const STORE_PROP = {
  habits: 'habits',
  habit_logs: 'habitLogs',
  tasks: 'tasks',
  goals: 'goals',
  goal_milestones: 'milestones',
  sleep_records: 'sleep',
  reminders: 'reminders',
  prayer_logs: 'prayerLogs',
  adhan_library: 'adhanLibrary',
  activity_logs: 'activity',
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
  settings: 'settings'
};

/* ---------------- تحميل البيانات ---------------- */
function tsToDateISO(ts) {
  if (!ts) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(Number(ts)));
}

function wallPartsFromEpoch(epoch) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  }).formatToParts(new Date(Number(epoch)));
  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`
  };
}

async function loadStore(storeName) {
  const records = await DB.getAll(storeName);
  const prop = STORE_PROP[storeName];
  if (!prop) return records;
  state.data[prop] = records;
  return records;
}

async function loadAllData() {
  const [
    habits, habitLogs, tasks, goals, milestones, sleep, reminders, prayerLogs, adhanLibrary, activity,
    financeAccounts, financeCategories, financeTransactions, financeObligations, financeObligationPayments,
    financeDebts, financeDebtPayments, financeSavingsGoals, financeSavingsEntries, financeBudgets,
    financeIncomeSchedules, financeAttachments, settingsRecord
  ] = await Promise.all([
    DB.getAll('habits'),
    DB.getAll('habit_logs'),
    DB.getAll('tasks'),
    DB.getAll('goals'),
    DB.getAll('goal_milestones'),
    DB.getAll('sleep_records'),
    DB.getAll('reminders'),
    DB.getAll('prayer_logs'),
    DB.getAll('adhan_library'),
    DB.getAll('activity_logs'),
    DB.getAll('finance_accounts'),
    DB.getAll('finance_categories'),
    DB.getAll('finance_transactions'),
    DB.getAll('finance_obligations'),
    DB.getAll('finance_obligation_payments'),
    DB.getAll('finance_debts'),
    DB.getAll('finance_debt_payments'),
    DB.getAll('finance_savings_goals'),
    DB.getAll('finance_savings_entries'),
    DB.getAll('finance_budgets'),
    DB.getAll('finance_income_schedules'),
    DB.getAll('finance_attachments'),
    DB.get('settings', 'general')
  ]);

  state.data.habits = habits;
  state.data.habitLogs = habitLogs;
  state.data.tasks = tasks;
  state.data.goals = goals;
  state.data.milestones = milestones;
  state.data.sleep = sleep;
  state.data.reminders = reminders;
  state.data.prayerLogs = prayerLogs;
  state.data.adhanLibrary = adhanLibrary;
  state.data.activity = sortBy(activity, (a) => a.timestamp, 'desc');
  state.data.financeAccounts = financeAccounts;
  state.data.financeCategories = financeCategories;
  state.data.financeTransactions = financeTransactions;
  state.data.financeObligations = financeObligations;
  state.data.financeObligationPayments = financeObligationPayments;
  state.data.financeDebts = financeDebts;
  state.data.financeDebtPayments = financeDebtPayments;
  state.data.financeSavingsGoals = financeSavingsGoals;
  state.data.financeSavingsEntries = financeSavingsEntries;
  state.data.financeBudgets = financeBudgets;
  state.data.financeIncomeSchedules = financeIncomeSchedules;
  state.data.financeAttachments = financeAttachments;

  if (settingsRecord && settingsRecord.value && typeof settingsRecord.value === 'object') {
    state.settings = { ...DEFAULT_SETTINGS, ...settingsRecord.value };
  } else {
    state.settings = { ...DEFAULT_SETTINGS };
    await DB.put('settings', { key: 'general', value: { ...DEFAULT_SETTINGS } });
  }
  if (typeof normalizePrayerSettings === 'function') {
    state.settings.prayer = normalizePrayerSettings(state.settings.prayer);
  }
  if (typeof normalizeFinanceSettings === 'function') {
    state.settings.finance = normalizeFinanceSettings(state.settings.finance);
  }
  state.settings.schemaVersion = SCHEMA_VERSION;
  state.dbMode = DB.mode();
  state.dbError = DB.error();
}

async function saveSettings(patch) {
  state.settings = { ...state.settings, ...patch, schemaVersion: SCHEMA_VERSION };
  await DB.put('settings', { key: 'general', value: { ...state.settings } });
  return state.settings;
}

/* ---------------- أدوات داخلية ---------------- */
function cloneData(value) {
  if (value === undefined || value === null) return null;
  try { return JSON.parse(JSON.stringify(value)); } catch { return null; }
}

function byId(list, id) {
  return list.find((item) => item.id === id) || null;
}

function normalizeSubtask(subtask) {
  return {
    id: subtask.id || uid('sub'),
    title: String(subtask.title || '').trim(),
    done: Boolean(subtask.done)
  };
}

function normalizeHabit(input, existing = {}) {
  const days = Array.isArray(input.days)
    ? input.days.map((d) => Number(d)).filter((d) => d >= 0 && d <= 6)
    : (existing.days || [0, 1, 2, 3, 4, 5, 6]);
  return {
    id: existing.id || input.id || uid('hb'),
    name: String(input.name ?? existing.name ?? '').trim(),
    description: String(input.description ?? existing.description ?? '').trim(),
    color: input.color || existing.color || HABIT_COLORS[0],
    icon: input.icon || existing.icon || 'sparkles',
    days: [...new Set(days)].sort((a, b) => a - b),
    weeklyGoal: clamp(Number(input.weeklyGoal ?? existing.weeklyGoal ?? days.length), 1, 7),
    createdAt: existing.createdAt || input.createdAt || Date.now(),
    updatedAt: Date.now()
  };
}

function normalizeTask(input, existing = {}) {
  const statusRaw = input.status ?? existing.status ?? 'new';
  const statusMap = {
    in_progress: 'progress', inprogress: 'progress', pending: 'new',
    completed: 'done', postponed: 'postponed',
    'قيد التنفيذ': 'progress', 'جديدة': 'new', 'مكتملة': 'done', 'مؤجلة': 'postponed'
  };
  const status = statusMap[statusRaw] || statusRaw;
  const subtasks = Array.isArray(input.subtasks)
    ? input.subtasks.map(normalizeSubtask).filter((s) => s.title)
    : (existing.subtasks || []);
  return {
    id: existing.id || input.id || uid('tsk'),
    title: String(input.title ?? existing.title ?? '').trim(),
    description: String(input.description ?? existing.description ?? '').trim(),
    priority: ['low', 'medium', 'high', 'urgent'].includes(input.priority ?? existing.priority)
      ? (input.priority ?? existing.priority) : 'medium',
    status: ['new', 'progress', 'done', 'postponed'].includes(status) ? status : 'new',
    category: String(input.category ?? existing.category ?? '').trim(),
    dueDate: input.dueDate ?? existing.dueDate ?? '',
    dueTime: input.dueTime ?? existing.dueTime ?? '',
    goalId: input.goalId ?? existing.goalId ?? '',
    subtasks,
    createdAt: existing.createdAt || input.createdAt || Date.now(),
    updatedAt: Date.now(),
    completedAt: status === 'done'
      ? (existing.completedAt || input.completedAt || Date.now())
      : null
  };
}

function normalizeGoal(input, existing = {}) {
  const targetValue = Math.max(0, Number(input.targetValue ?? existing.targetValue ?? 100) || 0);
  const currentValue = Math.max(0, Number(input.currentValue ?? existing.currentValue ?? 0) || 0);
  return {
    id: existing.id || input.id || uid('goal'),
    title: String(input.title ?? existing.title ?? '').trim(),
    description: String(input.description ?? existing.description ?? '').trim(),
    startDate: input.startDate ?? existing.startDate ?? todayISO(),
    endDate: input.endDate ?? existing.endDate ?? addDaysISO(todayISO(), 30),
    targetValue,
    currentValue,
    unit: String(input.unit ?? existing.unit ?? '').trim(),
    color: input.color || existing.color || GOAL_COLORS[0],
    status: ['active', 'completed', 'archived'].includes(input.status ?? existing.status)
      ? (input.status ?? existing.status) : 'active',
    progressHistory: Array.isArray(input.progressHistory) ? input.progressHistory : (existing.progressHistory || []),
    createdAt: existing.createdAt || input.createdAt || Date.now(),
    updatedAt: Date.now()
  };
}

function normalizeSleep(input, existing = {}) {
  const startDate = input.startDate || existing.startDate || todayISO();
  const startTime = input.startTime || existing.startTime || '22:00';
  const endDate = input.endDate || existing.endDate || addDaysISO(todayISO(), 1);
  const endTime = input.endTime || existing.endTime || '07:00';
  const durationMin = Math.max(0, diffWallMinutes(startDate, startTime, endDate, endTime));
  return {
    id: existing.id || input.id || uid('slp'),
    type: input.type === 'nap' ? 'nap' : (existing.type === 'nap' ? 'nap' : 'night'),
    startDate,
    startTime,
    endDate,
    endTime,
    date: input.date || endDate,
    durationMin,
    notes: String(input.notes ?? existing.notes ?? '').trim(),
    createdAt: existing.createdAt || input.createdAt || Date.now(),
    updatedAt: Date.now()
  };
}

function normalizeReminder(input, existing = {}) {
  let repeat = input.repeat ?? existing.repeat ?? 'once';
  const repeatMap = { 'once': 'once', 'daily': 'daily', 'weekly': 'weekly', 'monthly': 'monthly', 'weekdays': 'weekdays', 'custom': 'custom', 'مرة واحدة': 'once', 'يوميًا': 'daily', 'أسبوعيًا': 'weekly', 'شهريًا': 'monthly' };
  repeat = repeatMap[repeat] || 'once';
  const weekdays = Array.isArray(input.weekdays)
    ? input.weekdays.map(Number).filter((d) => d >= 0 && d <= 6)
    : (existing.weekdays || []);
  return {
    id: existing.id || input.id || uid('rmd'),
    title: String(input.title ?? existing.title ?? '').trim(),
    description: String(input.description ?? existing.description ?? '').trim(),
    date: input.date ?? existing.date ?? todayISO(),
    time: input.time ?? existing.time ?? '09:00',
    repeat,
    weekdays: [...new Set(weekdays)].sort((a, b) => a - b),
    customInterval: Math.max(1, Number(input.customInterval ?? existing.customInterval ?? 2) || 2),
    status: ['active', 'paused', 'completed'].includes(input.status ?? existing.status)
      ? (input.status ?? existing.status) : 'active',
    linkType: input.linkType ?? existing.linkType ?? '',
    linkId: input.linkId ?? existing.linkId ?? '',
    snoozeUntil: input.snoozeUntil ?? existing.snoozeUntil ?? null,
    lastCompletedAt: input.lastCompletedAt ?? existing.lastCompletedAt ?? null,
    notifiedKeys: Array.isArray(input.notifiedKeys) ? input.notifiedKeys : (existing.notifiedKeys || []),
    createdAt: existing.createdAt || input.createdAt || Date.now(),
    updatedAt: Date.now(),
    completedAt: input.completedAt ?? existing.completedAt ?? null
  };
}

/* ---------------- سجل النشاط ---------------- */
async function logActivity(action, entityType, entityId, entityName, oldData = null, newData = null, details = null) {
  const record = {
    id: uid('log'),
    action,
    entityType,
    entityId: entityId || '',
    entityName: entityName || '—',
    timestamp: Date.now(),
    oldData: cloneData(oldData),
    newData: cloneData(newData),
    details: details || null
  };
  try {
    await DB.put('activity_logs', record);
    state.data.activity.unshift(record);
  } catch (error) {
    console.error('[نظامي] تعذر حفظ سجل النشاط', error);
  }
  return record;
}

/* ---------------- العادات ---------------- */
async function createHabit(input) {
  const habit = normalizeHabit(input);
  if (!habit.name) throw new Error('اسم العادة مطلوب');
  await DB.put('habits', habit);
  await logActivity('create', 'habit', habit.id, habit.name, null, habit);
  await loadStore('habits');
  return habit;
}

async function updateHabit(id, input) {
  const old = byId(state.data.habits, id);
  if (!old) throw new Error('العادة غير موجودة');
  const updated = normalizeHabit(input, old);
  if (!updated.name) throw new Error('اسم العادة مطلوب');
  await DB.put('habits', updated);
  await logActivity('update', 'habit', updated.id, updated.name, old, updated);
  await loadStore('habits');
  return updated;
}

async function deleteHabit(id) {
  const old = byId(state.data.habits, id);
  if (!old) throw new Error('العادة غير موجودة');
  const logs = state.data.habitLogs.filter((log) => log.habitId === id);
  await DB.bulkRemove('habit_logs', logs.map((log) => log.id));
  await DB.remove('habits', id);

  const linked = state.data.reminders.filter((r) => r.linkType === 'habit' && r.linkId === id);
  for (const reminder of linked) {
    await DB.put('reminders', { ...reminder, linkType: '', linkId: '', updatedAt: Date.now() });
  }
  await logActivity('delete', 'habit', old.id, old.name, old, null, {
    removedLogs: logs.length,
    unlinkedReminders: linked.length
  });
  await Promise.all([loadStore('habits'), loadStore('habit_logs'), loadStore('reminders')]);
}

async function toggleHabitCompletion(habitId, date = todayISO()) {
  const habit = byId(state.data.habits, habitId);
  if (!habit) throw new Error('العادة غير موجودة');
  const existing = state.data.habitLogs.find((log) => log.habitId === habitId && log.date === date);
  if (existing) {
    await DB.remove('habit_logs', existing.id);
    await logActivity('uncomplete', 'habit', habit.id, habit.name, existing, null, { date });
  } else {
    const log = {
      id: uid('hlog'),
      habitId,
      date,
      completedAt: Date.now()
    };
    try {
      await DB.put('habit_logs', log);
    } catch (error) {
      if (String(error?.name || '').includes('Constraint') || String(error?.message || '').includes('constraint')) {
        throw new Error('تم تسجيل هذه العادة مسبقًا في هذا اليوم');
      }
      throw error;
    }
    await logActivity('complete', 'habit', habit.id, habit.name, null, log, { date });
  }
  await loadStore('habit_logs');
}

function habitLog(habitId, date) {
  return state.data.habitLogs.find((log) => log.habitId === habitId && log.date === date) || null;
}

function isHabitScheduledOn(habit, date) {
  if (!habit) return false;
  if (!Array.isArray(habit.days) || habit.days.length === 0) return true;
  return habit.days.includes(dayOfWeek(date));
}

function habitStreak(habit) {
  if (!habit) return 0;
  const createdDate = tsToDateISO(habit.createdAt) || todayISO();
  let cursor = todayISO();
  let streak = 0;
  let graceForToday = true;
  for (let i = 0; i < 730; i++) {
    if (cursor < createdDate) break;
    if (isHabitScheduledOn(habit, cursor)) {
      const done = Boolean(habitLog(habit.id, cursor));
      if (done) {
        streak++;
      } else if (graceForToday && cursor === todayISO()) {
        // لا نكسر السلسلة بسبب اليوم الحالي قبل انتهائه
      } else {
        break;
      }
    }
    graceForToday = false;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

function habitCommitment(habit, days = 30) {
  if (!habit) return { rate: 0, scheduled: 0, completed: 0 };
  const createdDate = tsToDateISO(habit.createdAt) || todayISO();
  let start = addDaysISO(todayISO(), -(days - 1));
  if (start < createdDate) start = createdDate;
  let scheduled = 0;
  let completed = 0;
  let cursor = start;
  while (cursor <= todayISO()) {
    if (isHabitScheduledOn(habit, cursor)) {
      scheduled++;
      if (habitLog(habit.id, cursor)) completed++;
    }
    cursor = addDaysISO(cursor, 1);
  }
  return { rate: percent(completed, scheduled), scheduled, completed };
}

function habitWeekProgress(habit) {
  if (!habit) return { completed: 0, goal: 0 };
  const week = getWeekDates(todayISO());
  let completed = 0;
  for (const date of week) {
    if (habitLog(habit.id, date) && isHabitScheduledOn(habit, date)) completed++;
  }
  return { completed, goal: Number(habit.weeklyGoal) || habit.days?.length || 7 };
}

function habitDoneDates(habitId, limit = 120) {
  return sortBy(
    state.data.habitLogs.filter((log) => log.habitId === habitId),
    (log) => log.date,
    'desc'
  ).slice(0, limit);
}

/* ---------------- المهام ---------------- */
async function createTask(input) {
  const task = normalizeTask(input);
  if (!task.title) throw new Error('عنوان المهمة مطلوب');
  await DB.put('tasks', task);
  await logActivity('create', 'task', task.id, task.title, null, task);
  await loadStore('tasks');
  return task;
}

async function updateTask(id, input) {
  const old = byId(state.data.tasks, id);
  if (!old) throw new Error('المهمة غير موجودة');
  const updated = normalizeTask(input, old);
  if (!updated.title) throw new Error('عنوان المهمة مطلوب');
  await DB.put('tasks', updated);
  const becameDone = old.status !== 'done' && updated.status === 'done';
  const becameUndone = old.status === 'done' && updated.status !== 'done';
  if (becameDone) {
    await logActivity('complete', 'task', updated.id, updated.title, old, updated);
  } else {
    await logActivity('update', 'task', updated.id, updated.title, old, updated, {
      statusChanged: old.status !== updated.status,
      becameUndone
    });
  }
  await loadStore('tasks');
  return updated;
}

async function toggleTaskCompletion(id) {
  const task = byId(state.data.tasks, id);
  if (!task) throw new Error('المهمة غير موجودة');
  const updated = {
    ...task,
    status: task.status === 'done' ? 'new' : 'done',
    completedAt: task.status === 'done' ? null : Date.now(),
    updatedAt: Date.now()
  };
  await DB.put('tasks', updated);
  await logActivity(updated.status === 'done' ? 'complete' : 'uncomplete', 'task', task.id, task.title, task, updated);
  await loadStore('tasks');
  return updated;
}

async function toggleSubtask(taskId, subtaskId) {
  const task = byId(state.data.tasks, taskId);
  if (!task) throw new Error('المهمة غير موجودة');
  const subtasks = (task.subtasks || []).map((subtask) => (
    subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask
  ));
  const updated = { ...task, subtasks, updatedAt: Date.now() };
  await DB.put('tasks', updated);
  await logActivity('update', 'task', task.id, task.title, task, updated, { subtaskToggled: subtaskId });
  await loadStore('tasks');
  return updated;
}

async function deleteTask(id) {
  const old = byId(state.data.tasks, id);
  if (!old) throw new Error('المهمة غير موجودة');
  await DB.remove('tasks', id);
  const linked = state.data.reminders.filter((r) => r.linkType === 'task' && r.linkId === id);
  for (const reminder of linked) {
    await DB.put('reminders', { ...reminder, linkType: '', linkId: '', updatedAt: Date.now() });
  }
  await logActivity('delete', 'task', old.id, old.title, old, null, { unlinkedReminders: linked.length });
  await Promise.all([loadStore('tasks'), loadStore('reminders')]);
}

function isTaskOverdue(task) {
  if (!task || task.status === 'done' || !task.dueDate) return false;
  if (task.dueDate < todayISO()) return true;
  if (task.dueDate === todayISO() && task.dueTime) {
    return wallEpoch(task.dueDate, task.dueTime) < Date.now();
  }
  return false;
}

function tasksForGoal(goalId) {
  return state.data.tasks.filter((task) => task.goalId === goalId);
}

/* ---------------- الأهداف ---------------- */
async function createGoal(input) {
  const goal = normalizeGoal(input);
  if (!goal.title) throw new Error('عنوان الهدف مطلوب');
  if (goal.targetValue <= 0) throw new Error('القيمة المستهدفة يجب أن تكون أكبر من صفر');
  if (goal.currentValue > 0) {
    goal.progressHistory = [{
      id: uid('prg'),
      value: goal.currentValue,
      note: 'القيمة الابتدائية',
      timestamp: Date.now()
    }];
  }
  await DB.put('goals', goal);
  await logActivity('create', 'goal', goal.id, goal.title, null, goal);
  await loadStore('goals');
  return goal;
}

async function updateGoal(id, input) {
  const old = byId(state.data.goals, id);
  if (!old) throw new Error('الهدف غير موجود');
  const updated = normalizeGoal(input, old);
  if (!updated.title) throw new Error('عنوان الهدف مطلوب');
  if (updated.targetValue <= 0) throw new Error('القيمة المستهدفة يجب أن تكون أكبر من صفر');
  if (Number(updated.currentValue) !== Number(old.currentValue)) {
    updated.progressHistory = [
      ...(old.progressHistory || []),
      { id: uid('prg'), value: updated.currentValue, note: input.progressNote || 'تعديل التقدم', timestamp: Date.now() }
    ];
    if (updated.currentValue >= updated.targetValue) updated.status = 'completed';
  }
  await DB.put('goals', updated);
  const action = Number(updated.currentValue) !== Number(old.currentValue) ? 'progress' : 'update';
  await logActivity(action, 'goal', updated.id, updated.title, old, updated);
  await loadStore('goals');
  return updated;
}

async function addGoalProgress(id, value, note = '') {
  const goal = byId(state.data.goals, id);
  if (!goal) throw new Error('الهدف غير موجود');
  const newValue = Math.max(0, Number(value) || 0);
  const updated = {
    ...goal,
    currentValue: newValue,
    status: newValue >= goal.targetValue ? 'completed' : (goal.status === 'completed' ? 'active' : goal.status),
    progressHistory: [
      ...(goal.progressHistory || []),
      { id: uid('prg'), value: newValue, note: String(note || '').trim(), timestamp: Date.now() }
    ],
    updatedAt: Date.now()
  };
  await DB.put('goals', updated);
  await logActivity('progress', 'goal', goal.id, goal.title, goal, updated, {
    from: goal.currentValue,
    to: newValue,
    unit: goal.unit
  });
  await loadStore('goals');
  return updated;
}

async function deleteGoal(id) {
  const old = byId(state.data.goals, id);
  if (!old) throw new Error('الهدف غير موجود');
  const milestones = state.data.milestones.filter((m) => m.goalId === id);
  await DB.bulkRemove('goal_milestones', milestones.map((m) => m.id));
  const linkedTasks = state.data.tasks.filter((task) => task.goalId === id);
  for (const task of linkedTasks) {
    await DB.put('tasks', { ...task, goalId: '', updatedAt: Date.now() });
  }
  const linkedReminders = state.data.reminders.filter((r) => r.linkType === 'goal' && r.linkId === id);
  for (const reminder of linkedReminders) {
    await DB.put('reminders', { ...reminder, linkType: '', linkId: '', updatedAt: Date.now() });
  }
  await DB.remove('goals', id);
  await logActivity('delete', 'goal', old.id, old.title, old, null, {
    removedMilestones: milestones.length,
    unlinkedTasks: linkedTasks.length
  });
  await Promise.all([loadStore('goals'), loadStore('goal_milestones'), loadStore('tasks'), loadStore('reminders')]);
}

function goalPercent(goal) {
  if (!goal || !goal.targetValue) return 0;
  return clamp(Math.round((Number(goal.currentValue) / Number(goal.targetValue)) * 100), 0, 100);
}

async function addMilestone(goalId, title, dueDate = '') {
  const goal = byId(state.data.goals, goalId);
  if (!goal) throw new Error('الهدف غير موجود');
  const titleClean = String(title || '').trim();
  if (!titleClean) throw new Error('عنوان المرحلة مطلوب');
  const milestone = {
    id: uid('ms'),
    goalId,
    title: titleClean,
    dueDate: dueDate || '',
    done: false,
    order: state.data.milestones.filter((m) => m.goalId === goalId).length,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await DB.put('goal_milestones', milestone);
  await logActivity('create', 'milestone', milestone.id, milestone.title, null, milestone, { goalId, goalName: goal.title });
  await loadStore('goal_milestones');
  return milestone;
}

async function toggleMilestone(id) {
  const milestone = byId(state.data.milestones, id);
  if (!milestone) throw new Error('المرحلة غير موجودة');
  const updated = { ...milestone, done: !milestone.done, updatedAt: Date.now() };
  await DB.put('goal_milestones', updated);
  await logActivity(updated.done ? 'complete' : 'uncomplete', 'milestone', id, milestone.title, milestone, updated);
  await loadStore('goal_milestones');
  return updated;
}

async function deleteMilestone(id) {
  const milestone = byId(state.data.milestones, id);
  if (!milestone) throw new Error('المرحلة غير موجودة');
  await DB.remove('goal_milestones', id);
  await logActivity('delete', 'milestone', id, milestone.title, milestone, null, { goalId: milestone.goalId });
  await loadStore('goal_milestones');
}

/* ---------------- النوم ---------------- */
async function createSleep(input) {
  const record = normalizeSleep(input);
  if (record.durationMin <= 0) throw new Error('وقت الاستيقاظ يجب أن يكون بعد وقت النوم');
  await DB.put('sleep_records', record);
  await logActivity('create', 'sleep', record.id, sleepRecordName(record), null, record);
  await loadStore('sleep_records');
  return record;
}

async function updateSleep(id, input) {
  const old = state.data.sleep.find((record) => record.id === id);
  if (!old) throw new Error('سجل النوم غير موجود');
  const updated = normalizeSleep(input, old);
  if (updated.durationMin <= 0) throw new Error('وقت الاستيقاظ يجب أن يكون بعد وقت النوم');
  await DB.put('sleep_records', updated);
  await logActivity('update', 'sleep', id, sleepRecordName(updated), old, updated);
  await loadStore('sleep_records');
  return updated;
}

async function deleteSleep(id) {
  const old = state.data.sleep.find((record) => record.id === id);
  if (!old) throw new Error('سجل النوم غير موجود');
  await DB.remove('sleep_records', id);
  await logActivity('delete', 'sleep', id, sleepRecordName(old), old, null);
  await loadStore('sleep_records');
}

function sleepRecordName(record) {
  if (!record) return 'سجل نوم';
  return `${record.type === 'nap' ? 'قيلولة' : 'نوم ليلي'} ${formatDateShort(record.date)}`;
}

/* ---------------- التذكيرات ---------------- */
async function createReminder(input) {
  const reminder = normalizeReminder(input);
  if (!reminder.title) throw new Error('عنوان التذكير مطلوب');
  await DB.put('reminders', reminder);
  await logActivity('create', 'reminder', reminder.id, reminder.title, null, reminder);
  await loadStore('reminders');
  return reminder;
}

async function updateReminder(id, input) {
  const old = byId(state.data.reminders, id);
  if (!old) throw new Error('التذكير غير موجود');
  const updated = normalizeReminder(input, old);
  if (!updated.title) throw new Error('عنوان التذكير مطلوب');
  updated.notifiedKeys = [];
  updated.snoozeUntil = null;
  await DB.put('reminders', updated);
  await logActivity('update', 'reminder', updated.id, updated.title, old, updated);
  await loadStore('reminders');
  return updated;
}

async function deleteReminder(id) {
  const old = byId(state.data.reminders, id);
  if (!old) throw new Error('التذكير غير موجود');
  await DB.remove('reminders', id);
  await logActivity('delete', 'reminder', id, old.title, old, null);
  await loadStore('reminders');
}

async function snoozeReminder(id, minutes = 10) {
  const reminder = byId(state.data.reminders, id);
  if (!reminder) throw new Error('التذكير غير موجود');
  const until = Date.now() + minutes * 60000;
  const updated = {
    ...reminder,
    snoozeUntil: until,
    status: 'active',
    notifiedKeys: (reminder.notifiedKeys || []).filter((key) => !key.startsWith('snooze:')),
    updatedAt: Date.now()
  };
  await DB.put('reminders', updated);
  await logActivity('snooze', 'reminder', id, reminder.title, reminder, updated, { minutes, until });
  await loadStore('reminders');
  return updated;
}

async function completeReminder(id) {
  const reminder = byId(state.data.reminders, id);
  if (!reminder) throw new Error('التذكير غير موجود');
  const info = nextReminderInfo(reminder, Date.now(), { ignoreSnooze: true });
  const isOnce = reminder.repeat === 'once';
  const now = Date.now();
  const updated = {
    ...reminder,
    status: isOnce ? 'completed' : 'active',
    completedAt: now,
    lastCompletedAt: isOnce ? now : now,
    snoozeUntil: null,
    updatedAt: now
  };
  await DB.put('reminders', updated);
  await logActivity('complete', 'reminder', id, reminder.title, reminder, updated, {
    occurrence: info ? `${info.date} ${info.time}` : null,
    stoppedRepeating: isOnce
  });
  await loadStore('reminders');
  return updated;
}

async function pauseReminder(id) {
  const reminder = byId(state.data.reminders, id);
  if (!reminder) throw new Error('التذكير غير موجود');
  const updated = { ...reminder, status: 'paused', snoozeUntil: null, updatedAt: Date.now() };
  await DB.put('reminders', updated);
  await logActivity('pause', 'reminder', id, reminder.title, reminder, updated);
  await loadStore('reminders');
}

async function resumeReminder(id) {
  const reminder = byId(state.data.reminders, id);
  if (!reminder) throw new Error('التذكير غير موجود');
  const updated = { ...reminder, status: 'active', updatedAt: Date.now() };
  await DB.put('reminders', updated);
  await logActivity('resume', 'reminder', id, reminder.title, reminder, updated);
  await loadStore('reminders');
}

async function markReminderNotified(id, key) {
  const reminder = byId(state.data.reminders, id);
  if (!reminder) return;
  const keys = [...(reminder.notifiedKeys || []), key].slice(-40);
  const updated = { ...reminder, notifiedKeys: keys };
  try {
    await DB.put('reminders', updated);
    const index = state.data.reminders.findIndex((r) => r.id === id);
    if (index >= 0) state.data.reminders[index] = updated;
  } catch (error) {
    console.error('[نظامي] تعذر تحديث حالة الإشعار', error);
  }
}

/* ---------------- منطق تكرار التذكيرات ---------------- */
function daysInMonthOf(iso) {
  const y = yearOfISO(iso);
  const m = monthOfISO(iso);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function reminderMatchesDate(reminder, date) {
  if (!reminder || !reminder.date || date < reminder.date) return false;
  const interval = Math.max(1, Number(reminder.customInterval) || 1);
  const baseDay = dayOfMonth(reminder.date);
  switch (reminder.repeat) {
    case 'once':
      return date === reminder.date;
    case 'daily':
      return true;
    case 'weekly':
      return dayOfWeek(date) === dayOfWeek(reminder.date);
    case 'monthly':
      return dayOfMonth(date) === Math.min(baseDay, daysInMonthOf(date));
    case 'weekdays':
      return (reminder.weekdays || []).includes(dayOfWeek(date));
    case 'custom':
      return diffDaysISO(reminder.date, date) % interval === 0;
    default:
      return date === reminder.date;
  }
}

function occurrencesBetween(reminder, startDate, endDate, max = 400) {
  const results = [];
  if (!reminder || !reminder.date) return results;
  let cursor = startDate > reminder.date ? startDate : reminder.date;
  let guard = 0;
  while (cursor <= endDate && guard < max) {
    if (reminderMatchesDate(reminder, cursor)) {
      results.push({ date: cursor, time: reminder.time || '09:00', epoch: wallEpoch(cursor, reminder.time || '09:00') });
    }
    cursor = addDaysISO(cursor, 1);
    guard++;
  }
  return results;
}

function nextRegularOccurrence(reminder, afterEpoch = Date.now()) {
  if (!reminder) return null;
  const floorEpoch = Math.max(afterEpoch, Number(reminder.lastCompletedAt) || 0);
  const startWall = wallPartsFromEpoch(floorEpoch).date;
  let cursor = startWall < reminder.date ? reminder.date : startWall;
  for (let i = 0; i < 400; i++) {
    if (reminderMatchesDate(reminder, cursor)) {
      const time = reminder.time || '09:00';
      const epoch = wallEpoch(cursor, time);
      if (epoch > floorEpoch) {
        return { date: cursor, time, epoch, snoozed: false };
      }
    }
    cursor = addDaysISO(cursor, 1);
  }
  return null;
}

function nextReminderInfo(reminder, now = Date.now(), options = {}) {
  if (!reminder || reminder.status === 'completed') return null;
  if (!options.ignoreSnooze && reminder.snoozeUntil) {
    const key = `snooze:${reminder.snoozeUntil}`;
    // يبقى التأجيل معلّقًا حتى يُعرض إشعاره، حتى لو فات وقته والتطبيق مغلق.
    if (!(reminder.notifiedKeys || []).includes(key)) {
      const parts = wallPartsFromEpoch(reminder.snoozeUntil);
      return { date: parts.date, time: parts.time, epoch: reminder.snoozeUntil, snoozed: true, key };
    }
  }
  return nextRegularOccurrence(reminder, now);
}

function previousReminderInfo(reminder, beforeEpoch = Date.now()) {
  if (!reminder) return null;
  if (reminder.status === 'completed' && reminder.completedAt) {
    const parts = wallPartsFromEpoch(reminder.completedAt);
    return { date: parts.date, time: parts.time, epoch: reminder.completedAt, completed: true };
  }
  const beforeWall = wallPartsFromEpoch(beforeEpoch).date;
  let cursor = beforeWall > todayISO() ? todayISO() : beforeWall;
  for (let i = 0; i < 400; i++) {
    if (cursor < reminder.date) break;
    if (reminderMatchesDate(reminder, cursor)) {
      const epoch = wallEpoch(cursor, reminder.time || '09:00');
      if (epoch <= beforeEpoch) {
        return { date: cursor, time: reminder.time || '09:00', epoch, completed: false };
      }
    }
    cursor = addDaysISO(cursor, -1);
  }
  return null;
}

function upcomingReminders(now = Date.now()) {
  return state.data.reminders
    .filter((reminder) => reminder.status === 'active')
    .map((reminder) => ({ reminder, info: nextReminderInfo(reminder, now) }))
    .filter((item) => item.info)
    .sort((a, b) => a.info.epoch - b.info.epoch);
}

function pastReminders(now = Date.now()) {
  return state.data.reminders
    .map((reminder) => ({ reminder, info: previousReminderInfo(reminder, now) }))
    .filter((item) => item.info && (item.info.epoch < now || item.reminder.status === 'completed'))
    .sort((a, b) => b.info.epoch - a.info.epoch);
}

function reminderNextOccurrenceText(reminder) {
  const info = nextReminderInfo(reminder);
  if (!info) return 'لا يوجد موعد قادم';
  return `${relativeDateLabel(info.date)} · ${formatTimeHM(info.time)}`;
}

/* ---------------- إحصاءات مساعدة ---------------- */
function todayHabits() {
  const today = todayISO();
  return state.data.habits
    .filter((habit) => isHabitScheduledOn(habit, today))
    .map((habit) => ({ habit, done: Boolean(habitLog(habit.id, today)) }));
}

function todayTasks() {
  const today = todayISO();
  return state.data.tasks.filter((task) => task.dueDate === today);
}

function dayCompletion(date) {
  const habits = state.data.habits.filter((habit) => isHabitScheduledOn(habit, date));
  const tasks = state.data.tasks.filter((task) => task.dueDate === date);
  const doneHabits = habits.filter((habit) => habitLog(habit.id, date)).length;
  const doneTasks = tasks.filter((task) => task.status === 'done').length;
  const total = habits.length + tasks.length;
  return {
    total,
    done: doneHabits + doneTasks,
    habits: habits.length,
    doneHabits,
    tasks: tasks.length,
    doneTasks,
    rate: percent(doneHabits + doneTasks, total)
  };
}

function weekActivitySeries(days = 7) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDaysISO(todayISO(), -i);
    const habitsDone = state.data.habitLogs.filter((log) => log.date === date).length;
    const tasksDone = state.data.tasks.filter((task) => task.completedAt && tsToDateISO(task.completedAt) === date).length;
    result.push({ date, habits: habitsDone, tasks: tasksDone, total: habitsDone + tasksDone });
  }
  return result;
}

function sleepDailySeries(periodDays = 7, endDate = todayISO()) {
  const start = addDaysISO(endDate, -(periodDays - 1));
  const map = new Map();
  for (let i = 0; i < periodDays; i++) {
    const date = addDaysISO(start, i);
    map.set(date, { date, total: 0, night: 0, nap: 0, records: [] });
  }
  for (const record of state.data.sleep) {
    if (!map.has(record.date)) continue;
    const entry = map.get(record.date);
    entry.records.push(record);
    entry.total += record.durationMin;
    if (record.type === 'nap') entry.nap += record.durationMin;
    else entry.night += record.durationMin;
  }
  return Array.from(map.values());
}

function sleepStats(periodDays = 7) {
  const series = sleepDailySeries(periodDays);
  const withData = series.filter((day) => day.total > 0);
  const total = sum(series, (day) => day.total);
  const avg = withData.length ? total / withData.length : 0;
  const best = withData.length ? sortBy(withData, (day) => day.total, 'desc')[0] : null;
  const goalMinutes = (Number(state.settings.sleepGoalHours) || 8) * 60;
  const consistency = sleepConsistency(Math.min(14, periodDays));
  return { series, withData, total, avg, best, goalMinutes, consistency };
}

function sleepConsistency(periodDays = 14) {
  const start = addDaysISO(todayISO(), -(periodDays - 1));
  const nights = state.data.sleep.filter((record) => record.type === 'night' && record.date >= start && record.date <= todayISO());
  if (nights.length < 2) {
    return { score: nights.length ? 100 : 0, variation: 0, avgBedTime: nights[0]?.startTime || '', count: nights.length };
  }
  const minutes = nights.map((record) => {
    const base = timeToMinutes(record.startTime);
    return record.startTime && Number(record.startTime.slice(0, 2)) < 12 ? base + 1440 : base;
  });
  const avg = average(minutes);
  const variance = average(minutes.map((m) => Math.pow(m - avg, 2)));
  const std = Math.sqrt(variance);
  const score = clamp(Math.round(100 - (std / 120) * 100), 0, 100);
  return {
    score,
    variation: Math.round(std),
    avgBedTime: minutesToTime(avg),
    count: nights.length
  };
}

function sleepForDate(date) {
  return state.data.sleep.filter((record) => record.date === date);
}

function activeGoals() {
  return state.data.goals.filter((goal) => goal.status === 'active');
}

/* ---------------- إعادة الضبط / الاستيراد ---------------- */
async function resetAllData() {
  await DB.clearAll();
  state.data = {
    habits: [], habitLogs: [], tasks: [], goals: [], milestones: [],
    sleep: [], reminders: [], prayerLogs: [], adhanLibrary: [], activity: [],
    financeAccounts: [], financeCategories: [], financeTransactions: [],
    financeObligations: [], financeObligationPayments: [], financeDebts: [],
    financeDebtPayments: [], financeSavingsGoals: [], financeSavingsEntries: [],
    financeBudgets: [], financeIncomeSchedules: [], financeAttachments: []
  };
  state.settings = { ...DEFAULT_SETTINGS };
  if (typeof normalizePrayerSettings === 'function') {
    state.settings.prayer = normalizePrayerSettings(null);
  }
  if (typeof normalizeFinanceSettings === 'function') {
    state.settings.finance = normalizeFinanceSettings(null);
  }
  await DB.put('settings', { key: 'general', value: { ...state.settings } });
  if (typeof ensureFinanceSeed === 'function') {
    await ensureFinanceSeed();
  }
}

async function reloadEverything() {
  await loadAllData();
  state.ui.calendarCursor = todayISO();
}
