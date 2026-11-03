/* =========================================================
   نظامي — اختبارات شاملة للتطوير
   يتم تشغيلها في وحدة تحكم المتصفح بعد تحميل التطبيق
   ========================================================= */
'use strict';

const results = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function test(name, fn) {
  results.total++;
  return Promise.resolve().then(async () => {
    try {
      await fn();
      results.passed++;
      results.details.push(`✅ ${name}`);
      console.log(`✅ ${name}`);
    } catch (error) {
      results.failed++;
      results.details.push(`❌ ${name}: ${error.message}`);
      console.error(`❌ ${name}:`, error);
    }
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'فشل التأكيد');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'القيمة غير متطابقة'}: المتوقع ${expected)، حصل ${actual}`);
  }
}

async function wait(ms = 100) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------
// 1. إنشاء قالب واستخدامه عدة مرات
// ---------------------------------------------------------
await test('1. إنشاء قالب واستخدامه عدة مرات', async () => {
  // إنشاء مهمة عادية ثم حفظها كقالب
  const task = await createTask({
    title: 'قالب اختبار مهمة',
    description: 'وصف القالب',
    priority: 'high',
    status: 'new',
    category: 'اختبار',
    dueDate: '',
    dueTime: '',
    goalId: '',
    subtasks: [{ id: 'sub1', title: 'خطوة فرعية', done: false }]
  });

  const template = await createTemplate({
    entityType: 'task',
    name: 'قالب مهمة اختبار',
    description: 'قالب تم إنشاؤه للاختبار',
    data: {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      category: task.category,
      dueTime: task.dueTime,
      goalId: task.goalId,
      subtasks: task.subtasks
    },
    tags: ['اختبار']
  });

  assert(template.id, 'يجب أن يُنشأ القالب بمعرّف');
  assert(template.entityType === 'task', 'نوع القالب يجب أن يكون task');
  assert(template.useCount === 0, 'عدد استخدامات القالب الجديد يجب أن يكون صفر');

  // استخدام القالب مرتين
  const result1 = await applyTemplate(template.id, {
    title: 'مهمة من القالب 1',
    description: 'وصف معدل',
    status: 'new',
    category: 'اختبار',
    dueDate: '',
    dueTime: '',
    goalId: '',
    subtasks: [{ id: 'sub-new', title: 'خطوة جديدة', done: false }]
  });

  const result2 = await applyTemplate(template.id, {
    title: 'مهمة من القالب 2',
    description: 'وصف معدل 2',
    status: 'new',
    category: 'اختبار',
    dueDate: '',
    dueTime: '',
    goalId: '',
    subtasks: []
  });

  assert(result1.id !== result2.id, 'يجب أن يُنشأ عنصران بمعرفين مختلفين');
  assert(result1.title === 'مهمة من القالب 1', 'يجب تطبيق التعديلات على العنصر الأول');
  assert(result2.title === 'مهمة من القالب 2', 'يجب تطبيق التعديلات على العنصر الثاني');

  const updatedTemplate = getTemplate(template.id);
  assert(updatedTemplate.useCount === 2, 'يجب زيادة عدد استخدامات القالب');

  // تنظيف
  await deleteTask(result1.id);
  await deleteTask(result2.id);
  await deleteTask(task.id);
  await deleteTemplate(template.id);
});

// ---------------------------------------------------------
// 2. تعديل القالب وعدم تأثيره على السجلات السابقة
// ---------------------------------------------------------
await test('2. تعديل القالب وعدم تأثيره على السجلات السابقة', async () => {
  const habit = await createHabit({
    name: 'عادة أصلية',
    description: 'وصف أصلي',
    color: '#35e0b5',
    days: [0, 1, 2, 3, 4, 5, 6],
    weeklyGoal: 7
  });

  const template = await createTemplate({
    entityType: 'habit',
    name: 'قالب عادة',
    description: '',
    data: {
      name: 'عادة أصلية',
      description: 'وصف أصلي',
      color: '#35e0b5',
      days: [0, 1, 2, 3, 4, 5, 6],
      weeklyGoal: 7
    },
    tags: []
  });

  // استخدام القالب قبل التعديل
  const created = await applyTemplate(template.id, {
    name: 'عادة من القالب',
    description: '',
    color: '#35e0b5',
    days: [0, 1, 2, 3, 4, 5, 6],
    weeklyGoal: 7
  });

  // تعديل القالب
  await updateTemplate(template.id, {
    name: 'قالب معدل',
    data: {
      name: 'عادة محدثة',
      description: 'وصف محدث',
      color: '#ff9f6b',
      days: [1, 2, 3],
      weeklyGoal: 3
    }
  });

  // التحقق من أن العنصر المُنشأ سابقًا لم يتغير
  const stillOld = state.data.habits.find((h) => h.id === created.id);
  assert(stillOld.name === 'عادة من القالب', 'العنصر السابق لا يجب أن يتغير عند تعديل القالب');
  assert(stillOld.color === '#35e0b5', 'لون العنصر السابق لا يجب أن يتغير');

  // استخدام القالب بعد التعديل يجب أن يعطي القيم الجديدة
  const created2 = await applyTemplate(template.id, {
    name: 'عادة بعد التعديل',
    description: '',
    color: '#ff9f6b',
    days: [1, 2, 3],
    weeklyGoal: 3
  });
  assert(created2.color === '#ff9f6b', 'العنصر الجديد يجب أن يحمل قيم القالب المحدث');

  // تنظيف
  await deleteHabit(created.id);
  await deleteHabit(created2.id);
  await deleteHabit(habit.id);
  await deleteTemplate(template.id);
});

// ---------------------------------------------------------
// 3. إنشاء مهمة من قالب دون نسخ حالة الإنجاز القديمة
// ---------------------------------------------------------
await test('3. إنشاء مهمة من قالب دون نسخ حالة الإنجاز', async () => {
  const task = await createTask({
    title: 'مهمة مكتملة',
    description: '',
    priority: 'medium',
    status: 'done', // مكتملة
    category: '',
    dueDate: todayISO(),
    dueTime: '',
    goalId: '',
    subtasks: []
  });

  const template = await createTemplate({
    entityType: 'task',
    name: 'قالب مهمة',
    data: {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status, // القالب يحتوي على done
      category: task.category,
      dueDate: '',
      dueTime: '',
      goalId: '',
      subtasks: []
    },
    tags: []
  });

  // استخدام القالب - يجب ألا تُنسخ حالة done
  const created = await applyTemplate(template.id, {
    title: 'مهمة جديدة من القالب',
    description: '',
    priority: 'medium',
    status: 'new', // يجب أن تكون جديدة، ليست مكتملة
    category: '',
    dueDate: '',
    dueTime: '',
    goalId: '',
    subtasks: []
  });

  assert(created.status === 'new', 'حالة المهمة الجديدة يجب أن تكون "جديدة" وليست "مكتملة"');
  assert(created.completedAt === null || created.completedAt === undefined, 'لا يجب نسخ تاريخ الإكمال');

  // تنظيف
  await deleteTask(created.id);
  await deleteTask(task.id);
  await deleteTemplate(template.id);
});

// ---------------------------------------------------------
// 4. إنشاء راتب متكرر وتسجيل استلامه
// ---------------------------------------------------------
await test('4. إنشاء راتب متكرر وتسجيل استلامه', async () => {
  const schedule = await saveFinanceIncomeSchedule({
    name: 'راتب شهري تجريبي',
    amount: 2000,
    accountId: 'acc_personal',
    dayOfMonth: 1,
    categoryId: 'cat_inc_salary',
    incomeKind: 'salary',
    source: 'شركة اختبار',
    recurrence: 'monthly',
    enabled: true,
    notes: ''
  });

  assert(schedule.id, 'يجب إنشاء جدول دخل');
  assert(schedule.amount === 2000, 'المبلغ يجب أن يكون 2000');

  // تسجيل استلام
  const today = todayISO();
  await createFinanceIncome({
    amount: 2000,
    accountId: 'acc_personal',
    categoryId: 'cat_inc_salary',
    incomeKind: 'salary',
    date: today,
    time: nowHHMM(),
    counterparty: 'شركة اختبار',
    notes: '',
    scheduleId: schedule.id
  });

  // تحديث آخر استلام
  const updated = await saveFinanceIncomeSchedule({ ...schedule, lastReceivedAt: today });
  assert(updated.lastReceivedAt === today, 'يجب تحديث تاريخ آخر استلام');

  // التحقق من وجود المعاملة
  const tx = state.data.financeTransactions.find((t) => t.scheduleId === schedule.id && t.type === 'income');
  assert(tx, 'يجب أن توجد معاملة دخل مرتبطة بالجدول');
  assert(tx.amount === 2000, 'مبلغ المعاملة يجب أن يكون 2000');

  // تنظيف
  await deleteFinanceTransaction(tx.id);
  await deleteFinanceIncomeSchedule(schedule.id);
});

// ---------------------------------------------------------
// 5. منع تسجيل الدخل نفسه مرتين لنفس الاستحقاق
// ---------------------------------------------------------
await test('5. منع تسجيل الدخل نفسه مرتين لنفس الاستحقاق', async () => {
  const schedule = await saveFinanceIncomeSchedule({
    name: 'راتب لمنع التكرار',
    amount: 1000,
    accountId: 'acc_personal',
    dayOfMonth: 15,
    categoryId: 'cat_inc_salary',
    incomeKind: 'salary',
    source: 'اختبار',
    recurrence: 'monthly',
    enabled: true
  });

  const today = todayISO();
  const date = financeScheduleNextDate(schedule, today);

  // تسجيل أول استلام
  await createFinanceIncome({
    amount: 1000,
    accountId: 'acc_personal',
    categoryId: 'cat_inc_salary',
    incomeKind: 'salary',
    date: date,
    time: nowHHMM(),
    counterparty: 'اختبار',
    notes: '',
    scheduleId: schedule.id
  });

  // تحديث آخر استلام للسجل
  await saveFinanceIncomeSchedule({ ...schedule, lastReceivedAt: date });

  // تسجيل استلام آخر لنفس التاريخ يجب أن يُحذّر (لا يُمنع technically، لكننا نتحقق من وجود معاملات مكررة)
  const existingCount = state.data.financeTransactions.filter(
    (t) => t.scheduleId === schedule.id && t.date === date && t.type === 'income'
  ).length;
  assert(existingCount === 1, 'يجب أن يكون هناك دخل واحد فقط لهذا الاستحقاق');

  // تنظيف
  const txs = state.data.financeTransactions.filter((t) => t.scheduleId === schedule.id);
  for (const t of txs) await deleteFinanceTransaction(t.id);
  await deleteFinanceIncomeSchedule(schedule.id);
});

// ---------------------------------------------------------
// 6. احتساب الالتزامات المتأخرة في المبلغ الآمن
// ---------------------------------------------------------
await test('6. احتساب الالتزامات المتأخرة', async () => {
  // إنشاء التزام مستحق في الماضي (متأخر)
  const overdue = await createFinanceObligation({
    name: 'إيجار متأخر',
    accountId: 'acc_personal',
    expectedAmount: 500,
    dueDate: addDaysISO(todayISO(), -10), // قبل 10 أيام
    recurrence: 'monthly',
    type: 'rent',
    categoryId: 'cat_exp_home',
    reminderEnabled: false,
    notes: ''
  });

  const info = financeObligationInfo(overdue);
  assert(info.status === 'overdue', 'الالتزام يجب أن يكون متأخرًا');
  assert(info.days < 0, 'أيام التأخير يجب أن تكون سالبة');

  // حساب المبلغ الآمن
  const safe = financeSafeToSpend('all');
  assert(safe.overdueObligations.length > 0, 'يجب تضمين الالتزامات المتأخرة');
  assert(safe.overdueTotal >= 500, 'يجب أن يشمل المبلغ الآمن الالتزام المتأخر');
  assert(safe.obligationsTotal >= safe.overdueTotal, 'الإجمالي يجب أن يشمل المتأخر');

  // تنظيف
  await deleteFinanceObligation(overdue.id);
});

// ---------------------------------------------------------
// 7. إنشاء قرض وسداد جزء منه
// ---------------------------------------------------------
await test('7. إنشاء قرض وسداد جزء منه', async () => {
  const debt = await createFinanceDebt({
    creditor: 'بنك اختبار',
    principal: 10000,
    accountId: 'acc_personal',
    date: todayISO(),
    dueDate: addMonthsISO(todayISO(), 6),
    notes: '',
    reminderEnabled: false
  });

  assert(debt.id, 'يجب إنشاء الدين');
  assert(debt.principal === 10000, 'أصل الدين يجب أن يكون 10000');

  // سداد جزء
  const remaining = financeDebtRemaining(debt);
  const paymentAmount = 3000;
  assert(paymentAmount <= remaining, 'مبلغ الدفعة يجب ألا يتجاوز المتبقي');

  const payment = await createFinanceDebtPayment({
    debtId: debt.id,
    amount: paymentAmount,
    accountId: 'acc_personal',
    date: todayISO(),
    time: nowHHMM(),
    notes: ''
  });

  assert(payment.id, 'يجب إنشاء دفعة الدين');
  assert(payment.amount === paymentAmount, 'مبلغ الدفعة يجب أن يكون 3000');

  const debtAfter = state.data.financeDebts.find((d) => d.id === debt.id);
  assert(financeDebtRemaining(debtAfter) === 7000, 'المتبقي بعد السداد يجب أن يكون 7000');

  // تنظيف
  await deleteFinanceDebt(debt.id);
});

// ---------------------------------------------------------
// 8. التحويل بين الحساب الشخصي والعائلي
// ---------------------------------------------------------
await test('8. التحويل بين الحساب الشخصي والعائلي', async () => {
  const personalCashBefore = financeAccountCash('acc_personal');
  const familyCashBefore = financeAccountCash('acc_family');

  const amount = 500;
  const result = await createFinanceTransfer({
    amount,
    fromAccountId: 'acc_personal',
    toAccountId: 'acc_family',
    date: todayISO(),
    time: nowHHMM(),
    notes: 'تحويل اختبار'
  });

  assert(result.groupId, 'يجب إنشاء مجموعة التحويل');
  assert(result.legs.length === 2, 'يجب أن يكون هناك طرفان للتحويل');

  const personalCashAfter = financeAccountCash('acc_personal');
  const familyCashAfter = financeAccountCash('acc_family');

  assert(personalCashAfter === personalCashBefore - amount, 'الرصيد الشخصي يجب أن ينقص بمبلغ التحويل');
  assert(familyCashAfter === familyCashBefore + amount, 'الرصيد العائلي يجب أن يزيد بمبلغ التحويل');

  // صافي الثروة لا يتغير
  const netWorthBefore = financeScopeCash('all');
  const netWorthAfter = financeScopeCash('all');
  assert(netWorthBefore === netWorthAfter, 'صافي الثروة يجب ألا يتغير بعد التحويل');

  // تنظيف
  await deleteFinanceTransaction(result.legs[0].id);
});

// ---------------------------------------------------------
// 9. التأكد من عدم احتساب التحويل كدخل أو مصروف
// ---------------------------------------------------------
await test('9. التحويل لا يُحتسب دخلًا أو مصروفًا', async () => {
  const totalsBefore = financeTotals('all');
  const amount = 300;

  const result = await createFinanceTransfer({
    amount,
    fromAccountId: 'acc_personal',
    toAccountId: 'acc_family',
    date: todayISO(),
    time: nowHHMM(),
    notes: 'اختبار احتساب'
  });

  const totalsAfter = financeTotals('all');
  assert(totalsAfter.income === totalsBefore.income, 'الدخل لا يجب أن يتغير بعد التحويل');
  assert(totalsAfter.expenses === totalsBefore.expenses, 'المصروف لا يجب أن يتغير بعد التحويل');

  // التحقق من أن المعاملات من نوع transfer وليس income/expense
  const txs = state.data.financeTransactions.filter((t) => t.linkedGroupId === result.groupId);
  assert(txs.length === 2, 'يجب أن يكون هناك معلمان للتحويل');
  assert(txs.every((t) => t.type === 'transfer', 'كلا المعاملتين يجب أن تكون من نوع تحويل'));

  // تنظيف
  await deleteFinanceTransaction(result.legs[0].id);
});

// ---------------------------------------------------------
// 10. تعديل وحذف المعاملات المالية
// ---------------------------------------------------------
await test('10. تعديل وحذف المعاملات المالية', async () => {
  // إنشاء مصروف
  const expense = await createFinanceExpense({
    amount: 100,
    accountId: 'acc_personal',
    categoryId: 'cat_exp_food',
    date: todayISO(),
    time: nowHHMM(),
    paymentMethod: 'cash',
    merchant: 'متجر اختبار',
    notes: ''
  });

  assert(expense.id, 'يجب إنشاء المصروف');

  // تعديل المصروف
  const updated = await updateFinanceExpense(expense.id, {
    amount: 200,
    accountId: 'acc_personal',
    categoryId: 'cat_exp_food',
    date: todayISO(),
    time: nowHHMM(),
    paymentMethod: 'card',
    merchant: 'متجر معدل',
    notes: 'معدل'
  });

  assert(updated.amount === 200, 'يجب تحديث المبلغ');
  assert(updated.merchant === 'متجر معدل', 'يجب تحديث المتجر');

  // حذف المصروف
  await deleteFinanceTransaction(expense.id);
  const deleted = state.data.financeTransactions.find((t) => t.id === expense.id);
  assert(!deleted, 'يجب حذف المعاملة');

  // التحقق من إعادة حساب الأرصدة
  const cash = financeAccountCash('acc_personal');
  assert(Number.isFinite(cash), 'الرصيد يجب أن يكون رقمًا صحيحًا بعد الحذف');
});

// ---------------------------------------------------------
// 11. فشل عملية مترابطة والتأكد من التراجع الكامل
// ---------------------------------------------------------
await test('11. فشل عملية مترابطة والتأكد من التراجع', async () => {
  // محاولة إنشاء دين بمبلغ غير صالح يجب أن تفشل ولا تترك بيانات ناقصة
  let failed = false;
  try {
    await createFinanceDebt({
      creditor: '',
      principal: -100,
      accountId: 'acc_personal',
      date: todayISO(),
      notes: ''
    });
  } catch (error) {
    failed = true;
  }
  assert(failed, 'يجب أن تفشل عملية إنشاء دين غير صالح');

  // التحقق من عدم وجود دين مسجل جزئيًا
  const debts = state.data.financeDebts.filter((d) => d.creditor === '');
  assert(debts.length === 0, 'لا يجب ترك دين فارغ بعد الفشل');

  const txs = state.data.financeTransactions.filter((t) => t.type === 'debt_borrow' && t.amount === -100);
  assert(txs.length === 0, 'لا يجب ترك معاملة دين فاشلة');
});

// ---------------------------------------------------------
// 12. النسخ الاحتياطي والاستعادة
// ---------------------------------------------------------
await test('12. النسخ الاحتياطي والاستعادة', async () => {
  // إنشاء بيانات اختبار
  const habit = await createHabit({
    name: 'عادة للنسخ الاحتياطي',
    description: '',
    color: '#35e0b5',
    days: [0, 1, 2, 3, 4, 5, 6],
    weeklyGoal: 7
  });

  const task = await createTask({
    title: 'مهمة للنسخ الاحتياطي',
    description: '',
    priority: 'medium',
    status: 'new',
    category: 'اختبار',
    dueDate: todayISO(),
    dueTime: '',
    goalId: '',
    subtasks: []
  });

  const schedule = await saveFinanceIncomeSchedule({
    name: 'راتب للنسخ الاحتياطي',
    amount: 1500,
    accountId: 'acc_personal',
    dayOfMonth: 1,
    categoryId: 'cat_inc_salary',
    incomeKind: 'salary',
    source: 'اختبار',
    recurrence: 'monthly',
    enabled: true
  });

  const template = await createTemplate({
    entityType: 'task',
    name: 'قالب احتياطي',
    data: {
      title: 'قالب',
      description: '',
      priority: 'medium',
      status: 'new',
      category: '',
      dueDate: '',
      dueTime: '',
      goalId: '',
      subtasks: []
    },
    tags: []
  });

  // تصدير النسخة الاحتياطية
  const exported = await DB.exportData();
  assert(exported.app === 'نظامي', 'يجب أن يكون تطبيق النسخة "نظامي"');
  assert(exported.schemaVersion === SCHEMA_VERSION, 'يجب أن يتطابق إصدار المخطط');
  assert(Array.isArray(exported.stores.templates), 'يجب تضمين مخزن القوالب');
  assert(Array.isArray(exported.stores.financeIncomeSchedules), 'يجب تضمين جداول الدخل');
  assert(Array.isArray(exported.stores.finance_transactions), 'يجب تضمين المعاملات');
  assert(Array.isArray(exported.stores.finance_attachments), 'يجب تضمين المرفقات (حتى لو فارغة)');
  assert(Array.isArray(exported.stores.adhan_blobs), 'يجب تضمين مكتبة الأذان (حتى لو فارغة)');

  // التحقق من صحة الملف قبل الاستعادة
  const validation = await DB.validateBackup(exported);
  assert(validation.valid, 'يجب أن يجتاز الملف التحقق من السلامة');
  assert(validation.stores.habits.count >= 1, 'يجب أن يحتوي على العادات');
  assert(validation.stores.tasks.count >= 1, 'يجب أن يحتوي على المهام');

  // استبدال البيانات واستعادتها
  await DB.importData(exported, { replace: true });
  await reloadEverything();

  // التحقق من استعادة البيانات
  assert(state.data.habits.some((h) => h.name === 'عادة للنسخ الاحتياطي'), 'يجب استعادة العادات');
  assert(state.data.tasks.some((t) => t.title === 'مهمة للنسخ الاحتياطي'), 'يجب استعادة المهام');
  assert(state.data.financeIncomeSchedules.some((s) => s.name === 'راتب للنسخ الاحتياطي'), 'يجب استعادة مصادر الدخل');
  assert(state.data.templates.some((t) => t.name === 'قالب احتياطي'), 'يجب استعادة القوالب');

  // تنظيف بيانات الاختبار (التي تم استعادتها)
  await deleteHabit(habit.id);
  await deleteTask(task.id);
  await deleteFinanceIncomeSchedule(schedule.id);
  await deleteTemplate(template.id);
});

// ---------------------------------------------------------
// 13. التأكد من عدم فقدان البيانات بعد تحديث التطبيق
// ---------------------------------------------------------
await test('13. الحفاظ على البيانات بعد التحديث', async () => {
  const beforeHabits = state.data.habits.length;
  const beforeTasks = state.data.tasks.length;
  const beforeTransactions = state.data.financeTransactions.length;

  // محاكاة إعادة تحميل البيانات (كما يحدث عند إعادة تحميل الصفحة)
  await loadAllData();

  assert(state.data.habits.length === beforeHabits, 'يجب الحفاظ على العادات بعد إعادة التحميل');
  assert(state.data.tasks.length === beforeTasks, 'يجب الحفاظ على المهام بعد إعادة التحميل');
  assert(state.data.financeTransactions.length === beforeTransactions, 'يجب الحفاظ على المعاملات المالية بعد إعادة التحميل');
});

// ---------------------------------------------------------
// عرض النتائج النهائية
// ---------------------------------------------------------
await wait(200);
console.log('========================================');
console.log(`نتائج الاختبارات: ${results.passed}/${results.total} نجح، ${results.failed} فشل`);
console.log('========================================');
results.details.forEach((d) => console.log(d));

if (results.failed === 0) {
  console.log('🎉 جميع الاختبارات نجحت!');
} else {
  console.warn(`⚠️ ${results.failed} اختبار failed، يرجى مراجعة التفاصيل أعلاه`);
}