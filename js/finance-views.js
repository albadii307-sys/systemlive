/* =========================================================
   نظامي — ماليّاتي: الواجهة والتعامل مع النماذج
   ========================================================= */
'use strict';

/* ---------------- أدوات الواجهة ---------------- */
function financeHidden() {
  return financeSettings().hideBalances ? '••••' : '';
}

function financeVal(value) {
  if (!financeSettings().hideBalances) return money(value);
  return '•••• ' + financeCurrency();
}

function financeMoneyHidden(value) {
  if (financeSettings().hideBalances) return '•••• ' + financeCurrency();
  return money(value);
}

function financeIsMasked() {
  return financeSettings().hideBalances;
}

function financeToggleBalanceLabel() {
  return financeSettings().hideBalances ? 'إظهار الأرصدة' : 'إخفاء الأرصدة';
}

function financeAccountSelect(idName = 'accountId', selected = '', allowAll = false, scope = 'all', fieldName = idName) {
  const options = allowAll ? [{ id: '', name: 'كل الحسابات' }, ...financeAccounts(scope, true)] : financeAccounts(scope);
  return `<select class="input" id="${idName}" name="${fieldName}">
    ${allowAll ? options.map((account) => `<option value="${account.id}" ${selected === account.id ? 'selected' : ''}>${account.id === '' ? account.name : `${financeAccountName(account.id)} (${FINANCE_ACCOUNT_TYPE_LABELS[account.type]})`}</option>`).join('') : options.map((account) => `<option value="${account.id}" ${selected === account.id ? 'selected' : ''}>${account.name} (${FINANCE_ACCOUNT_TYPE_LABELS[account.type]})</option>`).join('')}
  </select>`;
}

function financeCategorySelect(idName = 'categoryId', type = 'expense', selected = '', includeEmpty = true, fieldName = idName) {
  const categories = financeCategories(type);
  const options = includeEmpty ? [{ id: '', name: 'بدون تصنيف' }, ...categories] : categories;
  return `<select class="input" id="${idName}" name="${fieldName}">
    ${options.map((category) => `<option value="${category.id}" ${selected === category.id ? 'selected' : ''}>${category.parentId ? '— ' : ''}${escapeHtml(category.name)}</option>`).join('')}
  </select>`;
}

function financeRow({ iconName = 'wallet', title, meta = '', value, tone = '', action = '', id = '' }) {
  return `
    <div class="finance-row">
      <div class="finance-row-icon ${tone}">${icon(iconName, 16)}</div>
      <div class="finance-row-main">
        <div class="finance-row-title">${escapeHtml(title)}</div>
        ${meta ? `<div class="finance-row-meta">${meta}</div>` : ''}
      </div>
      <div class="finance-row-value">${value}</div>
      ${action ? `<button class="icon-btn" data-action="${action}" ${id ? `data-id="${id}"` : ''}>${icon('chevron-left', 16)}</button>` : ''}
    </div>
  `;
}

/* ---------------- قفل مالي ---------------- */
function renderFinanceLock() {
  const settings = financeSettings();
  if (!settings.pinEnabled) {
    state.ui.financeLocked = false;
  }
  if (!financeIsLocked()) return '';

  dom.view.innerHTML = `
    <div class="view-fade">
      ${pageHead('ماليّاتي مقفل', 'هذا القسم محمي برمز PIN مستقل')}
      <div class="card pad" style="max-width:420px;margin:20px auto;text-align:center">
        <div class="modal-icon accent" style="margin:0 auto 14px">${icon('lock', 24)}</div>
        <h3 style="margin-bottom:6px">أدخل رمز PIN للفتح</h3>
        <p class="text-muted mb-3">رمز قفل مستقل، لا يؤثر على باقي أقسام التطبيق.</p>
        <form id="finance-unlock-form" class="form-grid" style="grid-template-columns:1fr">
          <div class="field">
            <input class="input" name="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off" required />
          </div>
          <button class="primary-btn" type="submit">فتح</button>
        </form>
        <p class="help mt-2">هذا قفل واجهة فقط، ولا يعني تشفير البيانات على الجهاز.</p>
      </div>
    </div>
  `;

  document.getElementById('finance-unlock-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const pin = new FormData(form).get('pin');
    try {
      const ok = await unlockFinance(pin);
      if (!ok) throw new Error('رمز PIN غير صحيح');
      showToast({ title: 'تم فتح ماليّاتي' });
      renderFinance();
    } catch (error) {
      showToast({ type: 'error', title: 'فشل الفتح', message: error.message });
      form.querySelector('input').value = '';
      form.querySelector('input').focus();
    }
  }, { once: false });
}

/* ---------------- لوحة التحكم ---------------- */
function renderFinanceDashboard(data) {
  const settings = financeSettings();
  const scope = ['all', 'personal', 'family'].includes(state.ui.financeScope) ? state.ui.financeScope : 'all';
  const ds = data || financeDashboardData(scope);

  const expenseCats = ds.totals.expenses > 0 ? financeTopCategories(scope, ds.monthStart, ds.monthEnd, 4) : [];
  const incomeDist = ds.incomeDistribution;
  const alerts = financeAlerts(scope).slice(0, 4);
  const nextIncome = ds.nextIncome;

  const scopeBar = `
    <div class="finance-scope-bar">
      <div class="segmented">
        <button class="${scope === 'all' ? 'active' : ''}" data-action="finance-set-scope" data-scope="all">موحّد</button>
        <button class="${scope === 'personal' ? 'active' : ''}" data-action="finance-set-scope" data-scope="personal">شخصي</button>
        <button class="${scope === 'family' ? 'active' : ''}" data-action="finance-set-scope" data-scope="family">عائلي</button>
      </div>
      <span class="help">${scope === 'all' ? 'كل الحسابات في عرض واحد' : `عرض حساب ${financeScopeLabel(scope)} فقط`}</span>
    </div>
  `;

  const statGrid = `
    <div class="stat-grid finance-grid">
      ${statCard({ label: 'الرصيد الفعلي', value: financeIsMasked() ? '••••' : moneyCompact(ds.cash), unit: '', meta: financeScopeLabel(scope), iconName: 'wallet' })}
      ${statCard({ label: 'الدخل المستلم', value: financeIsMasked() ? '••••' : moneyCompact(ds.totals.income), meta: ds.monthLabel, iconName: 'arrow-down-left' })}
      ${statCard({ label: 'المصروفات', value: financeIsMasked() ? '••••' : moneyCompact(ds.totals.expenses), meta: ds.comparison.expenseChangePct >= 0 ? `+${ds.comparison.expenseChangePct}% عن الشهر السابق` : `${ds.comparison.expenseChangePct}% عن الشهر السابق`, iconName: 'receipt', tone: ds.totals.expenses > ds.totals.income ? 'warning' : '' })}
      ${statCard({ label: 'الادخار/الديون', value: financeIsMasked() ? `ادخار ${'••••'}` : `ادخار ${moneyCompact(ds.savings)} / دين ${moneyCompact(ds.debts)}`, meta: `صافي الثروة ${financeIsMasked() ? '••••' : moneyCompact(ds.netWorth)}`, iconName: 'scale' })}
    </div>
  `;

  const alertsHtml = alerts.length ? `
    <div class="card">
      <div class="card-head">
        <div><div class="card-title">تنبيهات مالية</div><div class="card-sub">التزامات وميزانيات</div></div>
      </div>
      <div class="card-body">
        ${alerts.map((alert) => `
          <div class="finance-alert ${alert.type}">
            <div class="finance-alert-icon">${icon(alert.type === 'danger' ? 'alert' : 'bell', 16)}</div>
            <div class="finance-alert-main">
              <div class="finance-alert-title">${escapeHtml(alert.title)}</div>
              <div class="finance-alert-meta">${escapeHtml(alert.message)}</div>
            </div>
            ${alert.action === 'finance-obligation-detail' && alert.id ? `<button class="icon-btn" data-action="finance-obligation-detail" data-id="${alert.id}">${icon('chevron-left', 16)}</button>` : alert.action === 'finance-budgets' ? `<button class="icon-btn" data-action="finance-go-tab" data-tab="budgets">${icon('chevron-left', 16)}</button>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const safeHtml = `
    <div class="card">
      <div class="card-head">
        <div><div class="card-title">المبلغ الآمن للصرف</div><div class="card-sub">حتى ${nextIncome ? formatDateLong(nextIncome.date) : '30 يومًا'} (${ds.safe.days} يومًا)</div></div>
        <button class="ghost-btn small" data-action="finance-go-tab" data-tab="reports">${icon('info', 13)} الافتراضات</button>
      </div>
      <div class="card-body">
        <div class="finance-safe">
          <div>
            <div class="finance-safe-amount">${financeIsMasked() ? '••••' : moneyCompact(ds.safe.safe)}</div>
            <div class="finance-safe-meta">متوسط ${financeIsMasked() ? '••••' : moneyCompact(ds.safe.daily)} يوميًا · متبقي فعلي ${financeIsMasked() ? '••••' : moneyCompact(ds.safe.raw)}</div>
          </div>
          <div class="finance-safe-pill ${ds.safe.raw < 0 ? 'danger' : 'green'}">${ds.safe.raw < 0 ? 'عجز متوقع' : 'كفاية متوقعة'}</div>
        </div>
        ${ds.upcoming.length ? `<div class="finance-subtitle mt-3">الالتزامات القادمة</div><div class="finance-list">${ds.upcoming.map(({ obligation, info }) => financeRow({ iconName: 'bell', title: obligation.name, meta: `${relativeDateLabel(info.dueDate)} · ${info.statusLabel}`, value: financeIsMasked() ? '••••' : money(info.remainingDue), tone: info.tone === 'danger' ? 'danger' : info.tone === 'warning' ? 'warning' : '', action: 'finance-obligation-detail', id: obligation.id })).join('')}</div>` : ''}
        ${ds.safe.overdueObligations.length ? `<div class="finance-subtitle mt-3" style="color:var(--danger)">الالتزامات المتأخرة (تُحسب في المبلغ الآمن)</div><div class="finance-list">${ds.safe.overdueObligations.map(({ obligation, info }) => financeRow({ iconName: 'alert', title: obligation.name, meta: `متأخر منذ ${Math.abs(info.days)} يومًا`, value: financeIsMasked() ? '••••' : money(info.remainingDue), tone: 'danger', action: 'finance-obligation-detail', id: obligation.id })).join('')}</div>` : ''}
      </div>
    </div>
  `;

  const personal = ds.personal;
  const family = ds.family;

  const summaryHtml = `
    <div class="grid grid-2">
      <div class="card">
        <div class="card-head"><div><div class="card-title">ملخص شخصي</div></div></div>
        <div class="card-body">
          <div class="finance-kv"><span>الرصيد</span><strong>${financeIsMasked() ? '••••' : moneyCompact(personal.cash)}</strong></div>
          <div class="finance-kv"><span>دخل الشهر</span><span>${financeIsMasked() ? '••••' : moneyCompact(personal.income)}</span></div>
          <div class="finance-kv"><span>مصروف الشهر</span><span>${financeIsMasked() ? '••••' : moneyCompact(personal.expenses)}</span></div>
          <div class="finance-kv"><span>ادخار</span><span>${financeIsMasked() ? '••••' : moneyCompact(personal.savings)}</span></div>
          <div class="finance-kv"><span>ديون متبقية</span><span>${financeIsMasked() ? '••••' : moneyCompact(personal.debts)}</span></div>
          <div class="finance-kv total"><span>صافي الثروة</span><strong>${financeIsMasked() ? '••••' : moneyCompact(personal.netWorth)}</strong></div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><div><div class="card-title">ملخص عائلي</div></div></div>
        <div class="card-body">
          <div class="finance-kv"><span>الرصيد</span><strong>${financeIsMasked() ? '••••' : moneyCompact(family.cash)}</strong></div>
          <div class="finance-kv"><span>دخل الشهر</span><span>${financeIsMasked() ? '••••' : moneyCompact(family.income)}</span></div>
          <div class="finance-kv"><span>مصروف الشهر</span><span>${financeIsMasked() ? '••••' : moneyCompact(family.expenses)}</span></div>
          <div class="finance-kv"><span>ادخار</span><span>${financeIsMasked() ? '••••' : moneyCompact(family.savings)}</span></div>
          <div class="finance-kv"><span>ديون متبقية</span><span>${financeIsMasked() ? '••••' : moneyCompact(family.debts)}</span></div>
          <div class="finance-kv total"><span>صافي الثروة</span><strong>${financeIsMasked() ? '••••' : moneyCompact(family.netWorth)}</strong></div>
        </div>
      </div>
    </div>
  `;

  const recentHtml = `
    <div class="card">
      <div class="card-head"><div><div class="card-title">آخر المعاملات</div><div class="card-sub">أحدث الحركات</div></div><button class="ghost-btn small" data-action="finance-go-tab" data-tab="transactions">${icon('list-check', 13)} عرض الكل</button></div>
      <div class="card-body">
        ${ds.recent.length ? ds.recent.map((tx) => {
          const account = financeAccountName(tx.accountId);
          const isPositive = tx.type === 'income' || tx.type === 'debt_borrow' || (tx.type === 'transfer' && tx.direction === 'in') || (tx.type === 'savings_withdraw');
          const isNegative = tx.type === 'expense' || tx.type === 'debt_payment' || (tx.type === 'transfer' && tx.direction === 'out') || (tx.type === 'savings_deposit');
          const val = isNegative ? -Math.abs(tx.amount) : Math.abs(tx.amount);
          return financeRow({
            iconName: FINANCE_TX_ICONS[tx.type] || 'circle',
            title: financeTransactionTitle(tx),
            meta: `${formatDateShort(tx.date)} · ${account}`,
            value: financeIsMasked() ? '••••' : money(val),
            action: 'finance-tx-detail',
            id: tx.id
          });
        }).join('') : '<div class="empty-state"><div class="empty-icon">'+icon('receipt', 18)+'</div><h4>لا توجد معاملات بعد</h4><p>ابدأ بتسجيل مصروف أو دخل سريعًا</p></div>'}
      </div>
    </div>
  `;

  return `
    <div class="view-fade">
      ${pageHead('لوحة التحكم المالية', `${ds.monthLabel} · ${financeScopeLabel(scope)}`, `
        <button class="ghost-btn" data-action="finance-toggle-balance">${icon('eye', 14)} ${financeToggleBalanceLabel()}</button>
        <button class="soft-btn" data-action="finance-lock" ${financeSettings().pinEnabled ? '' : 'style="display:none"'}>${icon('lock', 14)} قفل</button>
        <button class="primary-btn" data-action="finance-quick-expense">${icon('plus', 15)} تسجيل سريع</button>
      `)}
      ${scopeBar}
      ${statGrid}
      <div class="grid grid-2">
        ${safeHtml}
        ${alertsHtml || '<div class="card"><div class="card-body empty-state"><div class="empty-icon">'+icon('check-circle', 18)+'</div><h4>لا توجد تنبيهات</h4><p>كل شيء تحت السيطرة</p></div></div>'}
      </div>
      ${summaryHtml}
      <div class="grid grid-2">
        ${recentHtml}
        <div class="card">
          <div class="card-head"><div><div class="card-title">توزيع الدخل</div><div class="card-sub">حسب المصدر لهذا الشهر</div></div></div>
          <div class="card-body">
            ${incomeDist.length ? incomeDist.map((item) => `
              <div style="margin-bottom:10px">
                <div class="row" style="justify-content:space-between;font-size:12px"><span>${escapeHtml(item.label)}</span><span>${financeIsMasked() ? '••••' : moneyCompact(item.total)} · ${item.percent}%</span></div>
                <div class="progress blue" style="margin-top:5px"><span style="width:${item.percent}%"></span></div>
              </div>
            `).join('') : '<div class="empty-state"><div class="empty-icon">'+icon('trending', 18)+'</div><h4>لا يوجد دخل مسجل</h4><p>سجّل الراتب أو الدخل لرؤية التوزيع</p></div>'}
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ---------------- تبويب المعاملات ---------------- */
function renderFinanceTransactions() {
  const scope = 'all';
  let list = financeTransactionsIn(scope);
  const q = (state.ui.financeQuery || '').toLowerCase();
  if (q) {
    list = list.filter((tx) => financeTransactionTitle(tx).toLowerCase().includes(q)
      || financeAccountName(tx.accountId).toLowerCase().includes(q)
      || (tx.merchant || '').toLowerCase().includes(q)
      || (tx.notes || '').toLowerCase().includes(q));
  }
  if (state.ui.financeType !== 'all') {
    if (state.ui.financeType === 'transfer') list = list.filter((tx) => tx.type === 'transfer');
    else if (state.ui.financeType === 'debt') list = list.filter((tx) => tx.type === 'debt_borrow' || tx.type === 'debt_payment');
    else if (state.ui.financeType === 'savings') list = list.filter((tx) => tx.type === 'savings_deposit' || tx.type === 'savings_withdraw');
    else list = list.filter((tx) => tx.type === state.ui.financeType);
  }
  list = sortBy(list, (tx) => tx.datetime || wallEpoch(tx.date, tx.time || '00:00'), 'desc');

  const filters = `
    <div class="calendar-toolbar">
      <div class="row wrap">
        <div class="segmented">
          <button class="${state.ui.financeType === 'all' ? 'active' : ''}" data-action="finance-tx-filter" data-type="all">الكل</button>
          <button class="${state.ui.financeType === 'income' ? 'active' : ''}" data-action="finance-tx-filter" data-type="income">الدخل</button>
          <button class="${state.ui.financeType === 'expense' ? 'active' : ''}" data-action="finance-tx-filter" data-type="expense">المصروف</button>
          <button class="${state.ui.financeType === 'transfer' ? 'active' : ''}" data-action="finance-tx-filter" data-type="transfer">تحويل</button>
          <button class="${state.ui.financeType === 'debt' ? 'active' : ''}" data-action="finance-tx-filter" data-type="debt">ديون</button>
          <button class="${state.ui.financeType === 'savings' ? 'active' : ''}" data-action="finance-tx-filter" data-type="savings">ادخار</button>
        </div>
      </div>
      <div class="row wrap mt-2">
        <input class="input" style="max-width:320px" placeholder="بحث في المعاملات..." data-finance-search value="${escapeAttr(state.ui.financeQuery || '')}" />
        <div class="spacer"></div>
        <button class="soft-btn" data-action="finance-quick-expense">${icon('plus', 14)} مصروف</button>
        <button class="soft-btn" data-action="finance-quick-income">${icon('plus', 14)} دخل</button>
        <button class="soft-btn" data-action="finance-quick-transfer">${icon('repeat', 14)} تحويل</button>
      </div>
    </div>
  `;

  const rows = list.length ? list.map((tx) => {
    const isNegative = tx.type === 'expense' || tx.type === 'debt_payment' || (tx.type === 'transfer' && tx.direction === 'out') || (tx.type === 'savings_deposit');
    const val = isNegative ? -Math.abs(tx.amount) : Math.abs(tx.amount);
    return financeRow({
      iconName: FINANCE_TX_ICONS[tx.type] || 'circle',
      title: financeTransactionTitle(tx),
      meta: `${formatDateShort(tx.date)} · ${financeAccountName(tx.accountId)}${tx.paymentMethod ? ' · ' + (FINANCE_PAYMENT_METHODS[tx.paymentMethod] || tx.paymentMethod) : ''}`,
      value: financeIsMasked() ? '••••' : money(val),
      action: 'finance-tx-detail',
      id: tx.id
    });
  }).join('') : '<div class="empty-state"><div class="empty-icon">'+icon('receipt', 18)+'</div><h4>لا توجد معاملات</h4><p>جرب تغيير الفلتر أو أضف معاملة جديدة</p></div>';

  return `
    <div class="view-fade">
      ${pageHead('المعاملات', 'سجل واضح مع تمييز التحويلات والعمليات المرتبطة', '')}
      ${filters}
      <div class="card"><div class="card-body">${rows}</div></div>
    </div>
  `;
}

/* ---------------- تبويب الالتزامات ---------------- */
function renderFinanceObligations() {
  const scope = 'all';
  const obligations = sortBy(financeObligations(scope, true), (ob) => ob.dueDate, 'asc');
  const rows = obligations.length ? obligations.map((obligation) => {
    const info = financeObligationInfo(obligation);
    const meta = `${FINANCE_OBLIGATION_TYPES[obligation.type] || obligation.type} · ${relativeDateLabel(info.dueDate)} · ${info.statusLabel}`;
    return financeRow({
      iconName: 'bell',
      title: obligation.name,
      meta,
      value: financeIsMasked() ? '••••' : money(info.remainingDue || obligation.expectedAmount),
      tone: info.tone === 'danger' ? 'danger' : info.tone === 'warning' ? 'warning' : '',
      action: 'finance-obligation-detail',
      id: obligation.id
    });
  }).join('') : '<div class="empty-state"><div class="empty-icon">'+icon('bell', 18)+'</div><h4>لا توجد التزامات</h4><p>أضف إيجارًا أو فاتورة أو قسطًا لمتابعته</p></div>';

  return `
    <div class="view-fade">
      ${pageHead('الالتزامات والأقساط', 'تنبيهات قبل الاستحقاق ومتابعة السداد', `<button class="primary-btn" data-action="finance-add-obligation">${icon('plus', 15)} إضافة التزام</button>`)}
      <div class="card"><div class="card-body">${rows}</div></div>
    </div>
  `;
}

/* ---------------- تبويب الديون ---------------- */
function renderFinanceDebts() {
  const scope = 'all';
  const debts = state.data.financeDebts.filter((debt) => debt.status !== 'archived').sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  const rows = debts.length ? debts.map((debt) => {
    const remaining = financeDebtRemaining(debt);
    const paid = financeDebtPaid(debt);
    const meta = `أصل ${financeIsMasked() ? '••••' : moneyCompact(debt.principal)} · مدفوع ${financeIsMasked() ? '••••' : moneyCompact(paid)} · متبقي ${financeIsMasked() ? '••••' : moneyCompact(remaining)}`;
    return financeRow({
      iconName: 'scale',
      title: debt.creditor,
      meta: `${meta}${debt.dueDate ? ' · ' + formatDateShort(debt.dueDate) : ''}`,
      value: financeIsMasked() ? '••••' : money(remaining),
      action: 'finance-debt-detail',
      id: debt.id
    });
  }).join('') : '<div class="empty-state"><div class="empty-icon">'+icon('scale', 18)+'</div><h4>لا توجد ديون مسجلة</h4><p>سجّل الديون المستحقة عليك فقط</p></div>';

  return `
    <div class="view-fade">
      ${pageHead('الديون التي عليّ', 'متابعة أصل الدين والدفعات والرصيد المتبقي', `<button class="primary-btn" data-action="finance-add-debt">${icon('plus', 15)} إضافة دين</button>`)}
      <div class="card"><div class="card-body">${rows}</div></div>
    </div>
  `;
}

/* ---------------- تبويب الادخار ---------------- */
function renderFinanceSavings() {
  const scope = 'all';
  const goals = financeSavingsGoals(scope).sort((a, b) => a.createdAt - b.createdAt);
  const rows = goals.length ? goals.map((goal) => {
    const prog = financeGoalProgress(goal);
    const meta = `${financeIsMasked() ? '••••' : moneyCompact(prog.saved)} / ${financeIsMasked() ? '••••' : moneyCompact(prog.target)} · ${prog.percent}%${goal.targetDate ? ' · ' + formatDateShort(goal.targetDate) : ''}`;
    return `
      <div class="finance-goal-card" data-action="finance-goal-detail" data-id="${goal.id}">
        <div class="finance-goal-head">
          <div><div class="finance-goal-title">${escapeHtml(goal.name)}</div><div class="finance-goal-meta">${meta}</div></div>
          <span class="pill ${prog.percent >= 100 ? 'green' : 'blue'}">${prog.percent}%</span>
        </div>
        <div class="progress blue" style="margin-top:10px"><span style="width:${prog.percent}%"></span></div>
      </div>
    `;
  }).join('') : '<div class="empty-state"><div class="empty-icon">'+icon('piggy-bank', 18)+'</div><h4>لا توجد أهداف ادخار</h4><p>أنشئ هدفًا وابدأ بإيداع الأموال</p></div>';

  return `
    <div class="view-fade">
      ${pageHead('الادخار والأهداف', 'التمييز بين الأموال المدخرة والأموال المتاحة', `<button class="primary-btn" data-action="finance-add-goal">${icon('plus', 15)} إضافة هدف</button>`)}
      <div class="finance-goals">${rows}</div>
    </div>
  `;
}

/* ---------------- تبويب الميزانيات ---------------- */
function renderFinanceBudgets() {
  const month = financeMonthKey();
  const items = financeBudgetAnalysis(month, 'all');
  const rows = items.length ? items.map((item) => `
    <div class="finance-budget">
      <div class="finance-budget-head">
        <div><div class="finance-budget-title">${escapeHtml(item.label)}</div><div class="finance-budget-meta">حد ${financeIsMasked() ? '••••' : moneyCompact(item.limit)} · متبقي ${financeIsMasked() ? '••••' : moneyCompact(item.remaining)}</div></div>
        <span class="pill ${item.status === 'over' ? 'danger' : item.status === 'near' ? 'warning' : 'green'}">${item.pct}%</span>
      </div>
      <div class="progress ${item.status === 'over' ? 'warning' : 'blue'}" style="margin-top:8px"><span style="width:${Math.min(100, item.pct)}%"></span></div>
      <div class="finance-budget-foot"><span>أُنفق ${financeIsMasked() ? '••••' : moneyCompact(item.spent)}</span><button class="ghost-btn small" data-action="finance-delete-budget" data-id="${item.budget.id}">${icon('trash', 12)} حذف</button></div>
    </div>
  `).join('') : '<div class="empty-state"><div class="empty-icon">'+icon('chart', 18)+'</div><h4>لا توجد ميزانيات لهذا الشهر</h4><p>أضف ميزانية عامة أو حسب تصنيف</p></div>';

  return `
    <div class="view-fade">
      ${pageHead('الميزانيات', `شهر ${financeMonthLabel(todayISO())} · تنبيهات عند الاقتراب من الحد`, `<button class="primary-btn" data-action="finance-add-budget">${icon('plus', 15)} إضافة ميزانية</button>`)}
      <div class="card"><div class="card-body">${rows}</div></div>
    </div>
  `;
}

/* ---------------- تبويب مصادر الدخل ---------------- */
function renderFinanceIncomeSources() {
  const schedules = financeSchedules('all').sort((a, b) => a.createdAt - b.createdAt);
  const today = todayISO();

  const rows = schedules.length ? schedules.map((schedule) => {
    const nextDate = financeScheduleNextDate(schedule, today);
    const isDue = nextDate <= today;
    const lastReceived = schedule.lastReceivedAt ? formatDateShort(schedule.lastReceivedAt) : 'لم يستلم بعد';
    return `
      <div class="finance-row compact">
        <div class="finance-row-icon ${isDue ? 'warning' : 'blue'}">${icon('arrow-down-left', 14)}</div>
        <div class="finance-row-main">
          <div class="finance-row-title">${escapeHtml(schedule.name)} ${!schedule.enabled ? ' <span class="pill muted">متوقف</span>' : ''}</div>
          <div class="finance-row-meta">${FINANCE_INCOME_KINDS[schedule.incomeKind || 'salary'] || 'راتب'} · ${FINANCE_RECURRENCE[schedule.recurrence || 'monthly'] || 'شهريًا'} ·次日 الاستحقاق: ${formatDateShort(nextDate)}${isDue ? ' · مستحق' : ''}</div>
        </div>
        <div class="finance-row-value">${financeIsMasked() ? '••••' : money(schedule.amount)}</div>
        <div class="finance-row-actions">
          <button class="soft-btn small" data-action="finance-receive-income" data-id="${schedule.id}" ${!schedule.enabled ? 'disabled' : ''}>${icon('check', 12)} استلام</button>
          <button class="ghost-btn small" data-action="finance-edit-income-source" data-id="${schedule.id}">${icon('edit', 12)}</button>
          <button class="${schedule.enabled ? 'soft-btn' : 'ghost-btn'} small" data-action="finance-toggle-income-source" data-id="${schedule.id}">${schedule.enabled ? icon('pause', 12) : icon('play', 12)}</button>
          <button class="danger-btn small" data-action="finance-delete-income-source" data-id="${schedule.id}">${icon('trash', 12)}</button>
        </div>
      </div>
    `;
  }).join('') : '<div class="empty-state"><div class="empty-icon">'+icon('arrow-down-left', 20)+'</div><h4>لا توجد مصادر دخل</h4><p>أضف راتبًا أو مصدر دخل لتتبع الاستحقاقات القادمة</p></div>';

  return `
    <div class="view-fade">
      ${pageHead('مصادر الدخل', 'الرواتب والدخل المتكرر والمتوقع', `<button class="primary-btn" data-action="finance-add-income-source">${icon('plus', 15)} إضافة مصدر دخل</button>`)}
      <div class="card"><div class="card-body">${rows}</div></div>
      <div class="help mt-3">الدخل المتوقع لا يُحتسب كرصيد فعلي حتى يتم تسجيل استلامه. كل استلام يُنشئ معاملة دخل مستقلة.</div>
    </div>
  `;
}

function openFinanceIncomeSourceModal(id = null) {
  const schedule = id ? state.data.financeIncomeSchedules.find((item) => item.id === id) : null;
  const data = schedule || {
    name: '',
    amount: '',
    accountId: financeSettings().defaultAccountId,
    dayOfMonth: 1,
    categoryId: 'cat_inc_salary',
    incomeKind: 'salary',
    source: '',
    enabled: true,
    lastReceivedAt: ''
  };
  const content = `
    <form id="finance-income-source-form" data-fin-form="income-source" data-id="${schedule?.id || ''}">
      <div class="form-grid">
        <div class="field full">
          <label for="fin-is-name">اسم مصدر الدخل <span class="req">*</span></label>
          <input id="fin-is-name" name="name" type="text" maxlength="120" value="${escapeAttr(data.name)}" placeholder="راتب شهري، عمل حر، إيجارات..." required>
        </div>
        <div class="field">
          <label for="fin-is-type">نوع الدخل</label>
          <select id="fin-is-type" name="incomeKind">
            ${Object.entries(FINANCE_INCOME_KINDS).map(([k, l]) => `<option value="${k}" ${data.incomeKind === k ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="fin-is-amount">المبلغ المتوقع <span class="req">*</span></label>
          <input id="fin-is-amount" name="amount" type="number" min="0.001" step="0.001" value="${escapeAttr(data.amount || '')}" required>
        </div>
        <div class="field">
          <label for="fin-is-account">الحساب المستلم</label>
          ${financeAccountSelect('fin-is-account', data.accountId, false, 'all', 'accountId')}
        </div>
        <div class="field">
          <label for="fin-is-day">يوم الاستحقاق (1–28)</label>
          <input id="fin-is-day" name="dayOfMonth" type="number" min="1" max="28" value="${escapeAttr(data.dayOfMonth || 1)}">
          <span class="help">يتم حساب تاريخ الاستحقاق تلقائيًا كل دورة</span>
        </div>
        <div class="field">
          <label for="fin-is-recurrence">الدورية</label>
          <select id="fin-is-recurrence" name="recurrence">
            ${Object.entries(FINANCE_RECURRENCE).map(([k, l]) => `<option value="${k}" ${data.recurrence === k ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="fin-is-category">تصنيف الدخل</label>
          ${financeCategorySelect('fin-is-category', 'income', data.categoryId, true, 'categoryId')}
        </div>
        <div class="field full">
          <label for="fin-is-source">المصدر / الجهة</label>
          <input id="fin-is-source" name="source" type="text" maxlength="120" value="${escapeAttr(data.source || '')}" placeholder="اسم الشركة أو العميل">
        </div>
        ${schedule ? `
        <div class="field full">
          <label class="row" style="cursor:pointer;font-size:12px">
            <input type="checkbox" name="enabled" ${data.enabled !== false ? 'checked' : ''}>
            <span>${data.enabled ? 'إيقاف مؤقتًا' : 'تفعيل المصدر'}</span>
          </label>
          <span class="help">آخر استلام: ${schedule.lastReceivedAt ? formatDateLong(schedule.lastReceivedAt) : 'لم يتم الاستلام بعد'}</span>
        </div>
        ` : ''}
        <div class="field full">
          <label for="fin-is-notes">ملاحظات</label>
          <textarea id="fin-is-notes" name="notes" maxlength="500">${escapeHtml(data.notes || '')}</textarea>
        </div>
      </div>
    </form>
  `;
  openModal({
    title: schedule ? 'تعديل مصدر دخل' : 'مصدر دخل جديد',
    subtitle: 'حدد المبلغ والدورية والحساب الذي يستلم الدخل',
    size: 'lg',
    content,
    footer: `
      <button class="ghost-btn" data-modal-close>إلغاء</button>
      <div class="spacer"></div>
      <button class="primary-btn" type="submit" form="finance-income-source-form">${icon('check', 15)} ${schedule ? 'حفظ' : 'إضافة المصدر'}</button>
    `
  });
}

function openReceiveIncomeModal(scheduleId) {
  const schedule = state.data.financeIncomeSchedules.find((item) => item.id === scheduleId);
  if (!schedule) return;
  const nextDate = financeScheduleNextDate(schedule, todayISO());
  const content = `
    <form id="finance-receive-income-form" data-fin-form="receive-income" data-id="${schedule.id}">
      <div class="banner"><span class="banner-icon">${icon('arrow-down-left', 16)}</span><div><strong>${escapeHtml(schedule.name)}</strong><p>المبلغ المتوقع: ${money(schedule.amount)} · تاريخ الاستحقاق المتوقع: ${formatDateLong(nextDate)}</p></div></div>
      <div class="form-grid mt-2">
        <div class="field full">
          <label for="fin-recv-amount">المبلغ المستلم <span class="req">*</span></label>
          <input id="fin-recv-amount" name="amount" type="number" min="0.001" step="0.001" value="${schedule.amount}" required autofocus>
        </div>
        <div class="field">
          <label for="fin-recv-account">الحساب <span class="req">*</span></label>
          ${financeAccountSelect('fin-recv-account', schedule.accountId, false, 'all', 'accountId')}
        </div>
        <div class="field">
          <label for="fin-recv-date">تاريخ الاستلام <span class="req">*</span></label>
          <input id="fin-recv-date" name="date" type="date" value="${nextDate}" required>
        </div>
        <div class="field">
          <label for="fin-recv-time">الوقت</label>
          <input id="fin-recv-time" name="time" type="time" value="${nowHHMM()}">
        </div>
        <div class="field full">
          <label for="fin-recv-notes">ملاحظات</label>
          <textarea id="fin-recv-notes" name="notes" maxlength="500"></textarea>
        </div>
      </div>
    </form>
  `;
  openModal({
    title: `تسجيل استلام: ${schedule.name}`,
    subtitle: 'سيُنشأ معاملة دخل فعلية ويُحدّث آخر استلام للمصدر',
    size: 'lg',
    content,
    footer: `
      <button class="ghost-btn" data-modal-close>إلغاء</button>
      <div class="spacer"></div>
      <button class="primary-btn" type="submit" form="finance-receive-income-form">${icon('check', 15)} تسجيل الاستلام</button>
    `
  });
}

/* ---------------- تبويب التقارير ---------------- */
function renderFinanceReports() {
  const scope = 'all';
  const today = todayISO();
  const monthStart = startOfMonthISO(today);
  const monthEnd = endOfMonthISO(today);
  const cats = financeTopCategories(scope, monthStart, monthEnd, 6);
  const monthly = financeMonthlySeries(scope, 6);
  const safe = financeSafeToSpend(scope);
  const comparison = financeMonthComparison(scope);
  const dist = financeIncomeDistribution(scope, monthStart, monthEnd);

  return `
    <div class="view-fade">
      ${pageHead('التقارير والتحليلات', 'تحليلات ذكية مع افتراضات واضحة', '')}
      <div class="grid grid-2">
        <div class="card">
          <div class="card-head"><div><div class="card-title">أكثر التصنيفات استهلاكًا</div><div class="card-sub">هذا الشهر</div></div></div>
          <div class="card-body">
            ${cats.length ? cats.map((cat) => `
              <div style="margin-bottom:10px">
                <div class="row" style="justify-content:space-between;font-size:12px"><span>${escapeHtml(cat.name)}</span><span>${financeIsMasked() ? '••••' : moneyCompact(cat.total)} · ${cat.percent}%</span></div>
                <div class="progress warning" style="margin-top:5px"><span style="width:${cat.percent}%"></span></div>
              </div>
            `).join('') : '<div class="empty-state"><p>لا توجد مصروفات</p></div>'}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div><div class="card-title">مقارنة شهرية</div><div class="card-sub">الحالي مقابل السابق</div></div></div>
          <div class="card-body">
            <div class="finance-kv"><span>مصروفات الشهر الحالي</span><strong>${financeIsMasked() ? '••••' : moneyCompact(comparison.current.expenses)}</strong></div>
            <div class="finance-kv"><span>مصروفات ${comparison.previousLabel}</span><span>${financeIsMasked() ? '••••' : moneyCompact(comparison.previous.expenses)}</span></div>
            <div class="finance-kv total"><span>التغير</span><strong class="${comparison.expenseChangePct > 0 ? 'text-danger' : comparison.expenseChangePct < 0 ? 'text-success' : ''}">${comparison.expenseChangePct > 0 ? '+' : ''}${comparison.expenseChangePct}%</strong></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><div><div class="card-title">سلسلة الأشهر الأخيرة</div></div></div>
        <div class="card-body">
          <div class="finance-month-bars">
            ${monthly.map((m) => {
              const max = Math.max(1, ...monthly.map((x) => x.expenses));
              const h = Math.round((m.expenses / max) * 100);
              return `<div class="finance-month-bar"><div class="finance-month-bar-fill" style="height:${h}%"></div><div class="finance-month-bar-label">${m.shortLabel}</div><div class="finance-month-bar-meta">${financeIsMasked() ? '••' : Math.round(m.expenses)}</div></div>`;
            }).join('')}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><div><div class="card-title">المبلغ الآمن للصرف — الافتراضات</div></div></div>
        <div class="card-body">
          <div class="finance-kv"><span>الرصيد الفعلي</span><strong>${financeIsMasked() ? '••••' : moneyCompact(safe.cash)}</strong></div>
          <div class="finance-kv"><span>الالتزامات خلال الفترة</span><span>${financeIsMasked() ? '••••' : moneyCompact(safe.obligationsTotal)}</span></div>
          <div class="finance-kv"><span>ادخار مخطط</span><span>${financeIsMasked() ? '••••' : moneyCompact(safe.plannedSavings)}</span></div>
          <div class="finance-kv total"><span>صافي آمن</span><strong>${financeIsMasked() ? '••••' : moneyCompact(safe.safe)}</strong></div>
          <ul class="finance-assumptions">${safe.assumptions.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><div><div class="card-title">توزيع الدخل</div></div></div>
        <div class="card-body">
          ${dist.length ? dist.map((item) => `
            <div style="margin-bottom:10px">
              <div class="row" style="justify-content:space-between;font-size:12px"><span>${escapeHtml(item.label)}</span><span>${financeIsMasked() ? '••••' : moneyCompact(item.total)} · ${item.percent}%</span></div>
              <div class="progress blue" style="margin-top:5px"><span style="width:${item.percent}%"></span></div>
            </div>
          `).join('') : '<div class="empty-state"><p>لا يوجد دخل</p></div>'}
        </div>
      </div>
    </div>
  `;
}

/* ---------------- تبويب الإعدادات ---------------- */
function renderFinanceSettings() {
  const settings = financeSettings();
  return `
    <div class="view-fade">
      ${pageHead('إعدادات مالية', 'قفل، عملة، تنبيهات، نسخ احتياطي مالي', '')}
      <div class="grid grid-2">
        <div class="card">
          <div class="card-head"><div><div class="card-title">الحماية والخصوصية</div></div></div>
          <div class="card-body">
            <div class="finance-kv"><span>قفل مالي بـPIN</span><span>${settings.pinEnabled ? 'مفعّل' : 'معطّل'}</span></div>
            <div class="row wrap mt-2">
              ${settings.pinEnabled ? `<button class="soft-btn" data-action="finance-change-pin">${icon('lock', 14)} تغيير PIN</button><button class="soft-btn" data-action="finance-disable-pin">${icon('unlock', 14)} تعطيل القفل</button>` : `<button class="primary-btn" data-action="finance-set-pin">${icon('lock', 14)} تفعيل قفل PIN</button>`}
            </div>
            <div class="finance-kv mt-2"><span>إخفاء الأرصدة في العرض</span><span>${settings.hideBalances ? 'نعم' : 'لا'}</span></div>
            <div class="row wrap mt-2"><button class="soft-btn" data-action="finance-toggle-balance">${icon('eye', 14)} ${financeToggleBalanceLabel()}</button></div>
            <div class="finance-kv mt-2"><span>إظهار في الإشعارات</span><span>${settings.showInNotifications ? 'مفعّل' : 'معطّل'}</span></div>
            <div class="row wrap mt-2"><button class="soft-btn" data-action="finance-toggle-notify">${icon('bell', 14)} ${settings.showInNotifications ? 'إيقاف' : 'تفعيل'}</button></div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div><div class="card-title">مصادر الدخل</div></div></div>
          <div class="card-body">
            ${state.data.financeIncomeSchedules.length ? state.data.financeIncomeSchedules.map((s) => `
              <div class="finance-kv"><span>${escapeHtml(s.name)}</span><span>${money(s.amount)} · ${FINANCE_RECURRENCE[s.recurrence || 'monthly']}</span></div>
            `).join('') : '<p class="text-muted small-text">لا توجد مصادر دخل محددة.</p>'}
            <div class="row wrap mt-2"><button class="soft-btn" data-action="finance-add-income-source">${icon('plus', 13)} إضافة مصدر</button></div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div><div class="card-title">عام</div></div></div>
          <div class="card-body">
            <div class="finance-kv"><span>العملة</span><strong>${settings.currency}</strong></div>
            <div class="finance-kv"><span>مزامنة مع التذكيرات والتقويم</span><span>${settings.reminderSync ? 'نعم' : 'لا'}</span></div>
            <div class="row wrap mt-2">
              <button class="soft-btn" data-action="finance-sync-reminders">${icon('refresh', 14)} مزامنة الآن</button>
            </div>
            <div class="finance-kv mt-2"><span>هدف ادخار شهري مخطط</span><span>${money(settings.plannedSavingsMonthly)}</span></div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div><div class="card-title">الحسابات</div></div></div>
          <div class="card-body">
            ${financeAccounts('all', true).map((account) => `
              <div class="finance-kv"><span>${escapeHtml(account.name)} (${FINANCE_ACCOUNT_TYPE_LABELS[account.type]})</span><span>${account.archived ? 'مؤرشف' : account.isDefault ? 'افتراضي' : ''}</span></div>
            `).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div><div class="card-title">تنبيهات</div></div></div>
          <div class="card-body">
            <p class="text-muted">يتم فحص الالتزامات والميزانيات تلقائيًا وعرض التنبيهات في لوحة التحكم.</p>
          </div>
        </div>
      </div>
      <p class="help mt-3">تنبيه: قفل PIN هو قفل واجهة فقط، وليس تشفيرًا كاملًا للبيانات. المرفقات محفوظة محليًا. يتم تضمين جميع الملفات (بما في ذلك صور الفواتير وأصوات الأذان) في النسخة الاحتياطية الآن.</p>
    </div>
  `;
}

/* ---------------- بطاقة الرئيسية ---------------- */
function financeDashboardCard() {
  if (typeof financeSettings !== 'function' || !financeSettings().enabled) return '';
  if (financeIsLocked()) {
    return `
      <div class="card finance-home-card">
        <div class="card-head">
          <h3 class="card-title"><span class="icon-wrap" style="color:var(--accent)">${icon('wallet', 17)}</span> ماليّاتي</h3>
          <button class="card-link" data-action="go-view" data-view="finance">فتح ${icon('arrow-left', 12)}</button>
        </div>
        <div class="card-body">
          <div class="empty-state" style="padding:16px 8px">
            <div class="empty-icon">${icon('lock', 18)}</div>
            <h4>ماليّاتي مقفل</h4>
            <p>هذا القسم محمي برمز PIN مستقل، ولا تُعرض أرقامه هنا.</p>
            <button class="soft-btn small" data-action="go-view" data-view="finance">${icon('unlock', 14)} إدخال الرمز</button>
          </div>
        </div>
      </div>
    `;
  }
  const ds = financeDashboardData('all');
  const masked = financeIsMasked();
  const next = ds.nextIncome;
  const upcoming = ds.upcoming.slice(0, 3);
  return `
    <div class="card finance-home-card">
      <div class="card-head">
        <h3 class="card-title"><span class="icon-wrap" style="color:var(--accent)">${icon('wallet', 17)}</span> ماليّاتي</h3>
        <button class="card-link" data-action="go-view" data-view="finance">التفاصيل ${icon('arrow-left', 12)}</button>
      </div>
      <div class="card-body">
        <div class="finance-home-grid">
          <div class="finance-home-stat">
            <span>المتاح فعليًا</span>
            <strong>${masked ? '••••' : moneyCompact(ds.cash)}</strong>
          </div>
          <div class="finance-home-stat">
            <span>دخل الشهر</span>
            <strong class="text-success">${masked ? '••••' : moneyCompact(ds.totals.income)}</strong>
          </div>
          <div class="finance-home-stat">
            <span>مصروف الشهر</span>
            <strong class="text-warning">${masked ? '••••' : moneyCompact(ds.totals.expenses)}</strong>
          </div>
          <div class="finance-home-stat">
            <span>التزامات قريبة</span>
            <strong class="${ds.overdueObligations.length ? 'text-danger' : ''}">${masked ? '••••' : moneyCompact(ds.dueObligations)}</strong>
          </div>
        </div>
        ${upcoming.length ? `
          <div class="finance-list mt-3">
            ${upcoming.map(({ obligation, info }) => `
              <div class="finance-row compact">
                <div class="finance-row-icon ${info.tone === 'danger' ? 'danger' : info.tone === 'warning' ? 'warning' : ''}">${icon('bell', 14)}</div>
                <div class="finance-row-main">
                  <div class="finance-row-title">${escapeHtml(obligation.name)}</div>
                  <div class="finance-row-meta">${relativeDateLabel(info.dueDate)} · ${info.statusLabel}</div>
                </div>
                <div class="finance-row-value">${masked ? '••••' : money(info.remainingDue)}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <div class="row wrap mt-3" style="gap:8px">
          <button class="primary-btn small" data-action="finance-quick-expense">${icon('plus', 14)} مصروف سريع</button>
          <button class="soft-btn small" data-action="finance-quick-income">${icon('arrow-down-left', 13)} دخل</button>
          ${next ? `<span class="help" style="margin-inline-start:auto">الدخل القادم: ${formatDateShort(next.date)}${masked ? '' : ' · ' + moneyCompact(next.schedule.amount)}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

/* ---------------- العرض الرئيسي ---------------- */
function renderFinance() {
  try { checkFinanceNotifications(); } catch (e) { console.warn(e); }

  if (financeIsLocked()) {
    renderFinanceLock();
    return;
  }

  const tab = state.ui.financeTab || 'dashboard';
  if (tab === 'dashboard') dom.view.innerHTML = renderFinanceDashboard();
  else if (tab === 'transactions') dom.view.innerHTML = renderFinanceTransactions();
  else if (tab === 'obligations') dom.view.innerHTML = renderFinanceObligations();
  else if (tab === 'debts') dom.view.innerHTML = renderFinanceDebts();
  else if (tab === 'savings') dom.view.innerHTML = renderFinanceSavings();
  else if (tab === 'budgets') dom.view.innerHTML = renderFinanceBudgets();
  else if (tab === 'reports') dom.view.innerHTML = renderFinanceReports();
  else if (tab === 'income-sources') dom.view.innerHTML = renderFinanceIncomeSources();
  else if (tab === 'settings') dom.view.innerHTML = renderFinanceSettings();
  else dom.view.innerHTML = renderFinanceDashboard();

  // إضافة شريط التبويب
  const tabBar = document.createElement('div');
  tabBar.className = 'finance-tabbar';
  tabBar.innerHTML = `
    <button class="finance-tab ${tab === 'dashboard' ? 'active' : ''}" data-action="finance-tab" data-tab="dashboard">${icon('home', 14)} لوحة</button>
    <button class="finance-tab ${tab === 'transactions' ? 'active' : ''}" data-action="finance-tab" data-tab="transactions">${icon('receipt', 14)} معاملات</button>
    <button class="finance-tab ${tab === 'obligations' ? 'active' : ''}" data-action="finance-tab" data-tab="obligations">${icon('bell', 14)} التزامات</button>
    <button class="finance-tab ${tab === 'debts' ? 'active' : ''}" data-action="finance-tab" data-tab="debts">${icon('scale', 14)} ديون</button>
    <button class="finance-tab ${tab === 'savings' ? 'active' : ''}" data-action="finance-tab" data-tab="savings">${icon('piggy-bank', 14)} ادخار</button>
    <button class="finance-tab ${tab === 'budgets' ? 'active' : ''}" data-action="finance-tab" data-tab="budgets">${icon('chart', 14)} ميزانيات</button>
    <button class="finance-tab ${tab === 'reports' ? 'active' : ''}" data-action="finance-tab" data-tab="reports">${icon('file-text', 14)} تقارير</button>
    <button class="finance-tab ${tab === 'income-sources' ? 'active' : ''}" data-action="finance-tab" data-tab="income-sources">${icon('arrow-down-left', 14)} مصادر دخل</button>
    <button class="finance-tab ${tab === 'settings' ? 'active' : ''}" data-action="finance-tab" data-tab="settings">${icon('sliders', 14)} إعدادات</button>
  `;
  const view = dom.view;
  const header = view.querySelector('.page-header');
  if (header && header.parentNode) header.insertAdjacentElement('afterend', tabBar);
  else view.insertBefore(tabBar, view.firstChild || null);
}

/* ---------------- معالجات الأحداث المالية ---------------- */
function bindFinanceEvents() {
  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    if (action === 'finance-tab') {
      state.ui.financeTab = target.dataset.tab;
      renderFinance();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (action === 'finance-go-tab') {
      state.ui.financeTab = target.dataset.tab;
      renderFinance();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (action === 'finance-toggle-balance') {
      await saveFinanceSettings({ hideBalances: !financeSettings().hideBalances });
      renderFinance();
      showToast({ title: financeSettings().hideBalances ? 'تم إخفاء الأرصدة' : 'تم إظهار الأرصدة' });
      return;
    }
    if (action === 'finance-set-scope') {
      state.ui.financeScope = ['all', 'personal', 'family'].includes(target.dataset.scope) ? target.dataset.scope : 'all';
      renderFinance();
      return;
    }
    if (action === 'finance-lock') {
      lockFinance();
      renderFinance();
      showToast({ title: 'تم قفل ماليّاتي' });
      return;
    }
    if (action === 'finance-sync-reminders') {
      try { await syncFinanceReminders(); showToast({ title: 'تمت المزامنة' }); } catch (e) { showToast({ type: 'error', title: 'فشل', message: e.message }); }
      return;
    }
    if (action === 'finance-toggle-notify') {
      await saveFinanceSettings({ showInNotifications: !financeSettings().showInNotifications });
      renderFinance();
      showToast({ title: financeSettings().showInNotifications ? 'تم تفعيل الإشعارات' : 'تم إيقاف الإشعارات' });
      return;
    }
    if (action === 'finance-quick-expense') { openFinanceExpenseModal(); return; }
    if (action === 'finance-quick-income') { openFinanceIncomeModal(); return; }
    if (action === 'finance-quick-transfer') { openFinanceTransferModal(); return; }
    if (action === 'finance-add-obligation') { openFinanceObligationModal(); return; }
    if (action === 'finance-add-debt') { openFinanceDebtModal(); return; }
    if (action === 'finance-add-goal') { openFinanceSavingsGoalModal(); return; }
    if (action === 'finance-add-budget') { openFinanceBudgetModal(); return; }
    if (action === 'finance-add-income-source') { openFinanceIncomeSourceModal(); return; }
    if (action === 'finance-edit-income-source') { closeAllModals(); openFinanceIncomeSourceModal(id); return; }
    if (action === 'finance-toggle-income-source') {
      const schedule = state.data.financeIncomeSchedules.find((item) => item.id === id);
      if (schedule) {
        saveFinanceIncomeSource({ ...schedule, enabled: !schedule.enabled });
        renderFinance();
        showToast({ title: schedule.enabled ? 'تم إيقاف مصدر الدخل' : 'تم تفعيل مصدر الدخل' });
      }
      return;
    }
    if (action === 'finance-delete-income-source') {
      const ok = await confirmAction({ title: 'حذف مصدر الدخل؟', message: 'سيُحذف هذا المصدر وجدوله المتوقع.', confirmText: 'حذف', danger: true });
      if (ok) { await deleteFinanceIncomeSchedule(id); renderFinance(); showToast({ title: 'تم الحذف' }); }
      return;
    }
    if (action === 'finance-receive-income') { closeAllModals(); openReceiveIncomeModal(id); return; }
    if (action === 'finance-set-pin') { openFinanceSetPinModal(); return; }
    if (action === 'finance-change-pin') { openFinanceSetPinModal({ change: true }); return; }
    if (action === 'finance-disable-pin') { openFinanceDisablePinModal(); return; }
    if (action === 'finance-obligation-detail') { openFinanceObligationDetail(target.dataset.id); return; }
    if (action === 'finance-debt-detail') { openFinanceDebtDetail(target.dataset.id); return; }
    if (action === 'finance-goal-detail') { openFinanceSavingsGoalDetail(target.dataset.id); return; }
    if (action === 'finance-tx-detail') { openFinanceTransactionDetail(target.dataset.id); return; }
    if (action === 'finance-delete-budget') {
      const ok = await confirmAction({ title: 'حذف الميزانية؟', message: 'سيتم حذف هذه الميزانية.', confirmText: 'حذف', danger: true });
      if (ok) { await deleteFinanceBudget(target.dataset.id); renderFinance(); showToast({ title: 'تم الحذف' }); }
      return;
    }
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (target.matches('[data-finance-search]')) {
      state.ui.financeQuery = target.value;
      if (state.ui.financeTab === 'transactions') renderFinance();
    }
  });
}

bindFinanceEvents();

/* ---------------- استيراد / تصدير في إعدادات النظام ---------------- */
function financeBackupStores() {
  return ['finance_accounts', 'finance_categories', 'finance_transactions',
    'finance_obligations', 'finance_obligation_payments', 'finance_debts',
    'finance_debt_payments', 'finance_savings_goals', 'finance_savings_entries',
    'finance_budgets', 'finance_income_schedules'];
}

/* ---------------- نماذج الإضافة والتعديل ---------------- */
function financeDetailKv(label, value, strong = false) {
  return `<div class="finance-kv ${strong ? 'total' : ''}"><span>${escapeHtml(label)}</span>${strong ? `<strong>${value}</strong>` : `<span>${value}</span>`}</div>`;
}

function openFinanceExpenseModal(id = null, defaults = {}) {
  const tx = id ? state.data.financeTransactions.find((item) => item.id === id) : null;
  const data = tx || {
    amount: defaults.amount || '',
    accountId: defaults.accountId || financeSettings().defaultAccountId,
    categoryId: defaults.categoryId || 'cat_exp_food',
    date: defaults.date || todayISO(),
    time: defaults.time || nowHHMM(),
    paymentMethod: 'cash',
    merchant: '',
    notes: ''
  };
  const content = `
    <form id="finance-expense-form" data-fin-form="expense" data-id="${tx?.id || ''}">
      <div class="form-grid">
        <div class="field full">
          <label for="fin-exp-amount">المبلغ <span class="req">*</span></label>
          <input id="fin-exp-amount" name="amount" type="number" min="0.001" step="0.001" value="${escapeAttr(data.amount ?? '')}" required autofocus>
        </div>
        <div class="field">
          <label for="fin-exp-account">الحساب <span class="req">*</span></label>
          ${financeAccountSelect('fin-exp-account', data.accountId, false, 'all', 'accountId')}
        </div>
        <div class="field">
          <label for="fin-exp-category">التصنيف</label>
          ${financeCategorySelect('fin-exp-category', 'expense', data.categoryId, true, 'categoryId')}
        </div>
        <div class="field">
          <label for="fin-exp-date">التاريخ <span class="req">*</span></label>
          <input id="fin-exp-date" name="date" type="date" value="${escapeAttr(data.date || todayISO())}" required>
        </div>
        <div class="field">
          <label for="fin-exp-time">الوقت</label>
          <input id="fin-exp-time" name="time" type="time" value="${escapeAttr(data.time || nowHHMM())}">
        </div>
        <div class="field">
          <label for="fin-exp-method">طريقة الدفع</label>
          <select id="fin-exp-method" name="paymentMethod">
            ${Object.entries(FINANCE_PAYMENT_METHODS).map(([key, label]) => `<option value="${key}" ${data.paymentMethod === key ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="fin-exp-merchant">المتجر أو الجهة</label>
          <input id="fin-exp-merchant" name="merchant" type="text" maxlength="120" value="${escapeAttr(data.merchant || '')}" placeholder="اسم المتجر">
        </div>
        <div class="field full">
          <label for="fin-exp-notes">ملاحظات</label>
          <textarea id="fin-exp-notes" name="notes" maxlength="500" placeholder="تفاصيل إضافية...">${escapeHtml(data.notes || '')}</textarea>
        </div>
        <div class="field full">
          <label for="fin-exp-attachment">صورة الفاتورة (اختياري)</label>
          <input id="fin-exp-attachment" name="attachment" type="file" accept="image/*" capture="environment">
          <span class="help">تُحفظ محليًا فقط، ولا تُضمّن في النسخة الاحتياطية النصية. الحد 3 ميجابايت.</span>
          ${tx?.attachmentId ? `<span class="help">توجد صورة مرفقة حاليًا. رفع صورة جديدة سيستبدلها.</span>` : ''}
        </div>
      </div>
    </form>
  `;
  openModal({
    title: tx ? 'تعديل المصروف' : 'تسجيل مصروف',
    subtitle: tx ? 'سيُعاد حساب الأرصدة والتقارير بعد الحفظ' : 'سجّل المبلغ والتصنيف والحساب',
    content,
    footer: `<button class="ghost-btn" data-modal-close>إلغاء</button><div class="spacer"></div><button class="primary-btn" type="submit" form="finance-expense-form">${icon('check', 15)} ${tx ? 'حفظ' : 'إضافة المصروف'}</button>`
  });
}

function openFinanceIncomeModal(id = null, defaults = {}) {
  const tx = id ? state.data.financeTransactions.find((item) => item.id === id) : null;
  const data = tx || {
    amount: defaults.amount || '',
    accountId: defaults.accountId || financeSettings().defaultAccountId,
    categoryId: defaults.categoryId || 'cat_inc_salary',
    incomeKind: defaults.incomeKind || 'salary',
    date: defaults.date || todayISO(),
    time: defaults.time || nowHHMM(),
    merchant: '',
    counterparty: defaults.counterparty || '',
    notes: '',
    scheduleId: defaults.scheduleId || ''
  };
  const schedules = state.data.financeIncomeSchedules.map((schedule) => `<option value="${schedule.id}" ${data.scheduleId === schedule.id ? 'selected' : ''}>${escapeHtml(schedule.name)} · ${money(schedule.amount)}</option>`).join('');
  const content = `
    <form id="finance-income-form" data-fin-form="income" data-id="${tx?.id || ''}">
      <div class="form-grid">
        <div class="field full">
          <label for="fin-inc-amount">المبلغ المستلم <span class="req">*</span></label>
          <input id="fin-inc-amount" name="amount" type="number" min="0.001" step="0.001" value="${escapeAttr(data.amount ?? '')}" required autofocus>
        </div>
        <div class="field">
          <label for="fin-inc-account">الحساب <span class="req">*</span></label>
          ${financeAccountSelect('fin-inc-account', data.accountId, false, 'all', 'accountId')}
        </div>
        <div class="field">
          <label for="fin-inc-category">تصنيف الدخل</label>
          ${financeCategorySelect('fin-inc-category', 'income', data.categoryId, true, 'categoryId')}
        </div>
        <div class="field">
          <label for="fin-inc-kind">نوع الدخل</label>
          <select id="fin-inc-kind" name="incomeKind">
            ${Object.entries(FINANCE_INCOME_KINDS).map(([key, label]) => `<option value="${key}" ${data.incomeKind === key ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="fin-inc-source">المصدر / الجهة</label>
          <input id="fin-inc-source" name="counterparty" type="text" maxlength="120" value="${escapeAttr(data.counterparty || '')}" placeholder="جهة العمل أو العميل">
        </div>
        <div class="field">
          <label for="fin-inc-date">تاريخ الاستلام <span class="req">*</span></label>
          <input id="fin-inc-date" name="date" type="date" value="${escapeAttr(data.date || todayISO())}" required>
        </div>
        <div class="field">
          <label for="fin-inc-time">الوقت</label>
          <input id="fin-inc-time" name="time" type="time" value="${escapeAttr(data.time || nowHHMM())}">
        </div>
        <div class="field full">
          <label for="fin-inc-schedule">ربط بجدول راتب</label>
          <select id="fin-inc-schedule" name="scheduleId">
            <option value="">بدون ربط</option>
            ${schedules}
          </select>
          <span class="help">الربط يحدّث آخر استلام فقط، ولا يسجل دخلًا مستقبليًا.</span>
        </div>
        <div class="field full">
          <label for="fin-inc-notes">ملاحظات</label>
          <textarea id="fin-inc-notes" name="notes" maxlength="500">${escapeHtml(data.notes || '')}</textarea>
        </div>
      </div>
    </form>
  `;
  openModal({
    title: tx ? 'تعديل الدخل' : 'تسجيل دخل / راتب',
    subtitle: 'لا يُسجل أي دخل مستقبلي كأنه مستلم',
    size: 'lg',
    content,
    footer: `<button class="ghost-btn" data-modal-close>إلغاء</button><div class="spacer"></div><button class="primary-btn" type="submit" form="finance-income-form">${icon('check', 15)} ${tx ? 'حفظ' : 'تسجيل الدخل'}</button>`
  });
}

function openFinanceTransferModal(id = null, defaults = {}) {
  const tx = id ? state.data.financeTransactions.find((item) => item.id === id) : null;
  const legs = tx ? state.data.financeTransactions.filter((item) => item.linkedGroupId && item.linkedGroupId === tx.linkedGroupId) : [];
  const outLeg = legs.find((item) => item.direction === 'out') || tx;
  const inLeg = legs.find((item) => item.direction === 'in');
  const data = outLeg || {
    amount: defaults.amount || '',
    accountId: defaults.accountId || 'acc_personal',
    date: defaults.date || todayISO(),
    time: defaults.time || nowHHMM(),
    notes: ''
  };
  const toId = inLeg?.accountId || defaults.toAccountId || 'acc_family';
  const content = `
    <form id="finance-transfer-form" data-fin-form="transfer" data-id="${tx?.id || ''}">
      <div class="banner"><span class="banner-icon">${icon('info', 16)}</span><div><strong>تحويل داخلي</strong><p>لا يُحتسب دخلًا أو مصروفًا في الإجمالي الموحد. يُنشأ طرفان مرتبطان.</p></div></div>
      <div class="form-grid mt-2">
        <div class="field full">
          <label for="fin-trf-amount">المبلغ <span class="req">*</span></label>
          <input id="fin-trf-amount" name="amount" type="number" min="0.001" step="0.001" value="${escapeAttr(data.amount ?? '')}" required>
        </div>
        <div class="field">
          <label for="fin-trf-from">من حساب <span class="req">*</span></label>
          ${financeAccountSelect('fin-trf-from', data.accountId, false, 'all', 'fromAccountId')}
        </div>
        <div class="field">
          <label for="fin-trf-to">إلى حساب <span class="req">*</span></label>
          ${financeAccountSelect('fin-trf-to', toId, false, 'all', 'toAccountId')}
        </div>
        <div class="field">
          <label for="fin-trf-date">التاريخ</label>
          <input id="fin-trf-date" name="date" type="date" value="${escapeAttr(data.date || todayISO())}">
        </div>
        <div class="field">
          <label for="fin-trf-time">الوقت</label>
          <input id="fin-trf-time" name="time" type="time" value="${escapeAttr(data.time || nowHHMM())}">
        </div>
        <div class="field full">
          <label for="fin-trf-notes">ملاحظات</label>
          <textarea id="fin-trf-notes" name="notes" maxlength="500">${escapeHtml(data.notes || '')}</textarea>
        </div>
      </div>
    </form>
  `;
  openModal({
    title: tx ? 'تعديل التحويل' : 'تحويل بين الحسابات',
    subtitle: 'حركة مالية لا تغيّر صافي الثروة',
    content,
    footer: `<button class="ghost-btn" data-modal-close>إلغاء</button><div class="spacer"></div><button class="primary-btn" type="submit" form="finance-transfer-form">${icon('repeat', 15)} ${tx ? 'حفظ' : 'تنفيذ التحويل'}</button>`
  });
}

function openFinanceObligationModal(id = null) {
  const obligation = id ? state.data.financeObligations.find((item) => item.id === id) : null;
  const data = obligation || {
    name: '',
    accountId: financeSettings().defaultAccountId,
    expectedAmount: '',
    dueDate: todayISO(),
    recurrence: 'monthly',
    type: 'bill',
    categoryId: 'cat_exp_other',
    reminderEnabled: true,
    reminderTime: '09:00',
    notes: '',
    status: 'active'
  };
  const content = `
    <form id="finance-obligation-form" data-fin-form="obligation" data-id="${obligation?.id || ''}">
      <div class="form-grid">
        <div class="field full">
          <label for="fin-ob-name">اسم الالتزام <span class="req">*</span></label>
          <input id="fin-ob-name" name="name" type="text" maxlength="120" value="${escapeAttr(data.name)}" placeholder="إيجار، فاتورة كهرباء، قسط سيارة..." required>
        </div>
        <div class="field">
          <label for="fin-ob-account">الحساب</label>
          ${financeAccountSelect('fin-ob-account', data.accountId, false, 'all', 'accountId')}
        </div>
        <div class="field">
          <label for="fin-ob-amount">المبلغ المتوقع <span class="req">*</span></label>
          <input id="fin-ob-amount" name="expectedAmount" type="number" min="0.001" step="0.001" value="${escapeAttr(data.expectedAmount ?? '')}" required>
        </div>
        <div class="field">
          <label for="fin-ob-due">تاريخ الاستحقاق</label>
          <input id="fin-ob-due" name="dueDate" type="date" value="${escapeAttr(data.dueDate || todayISO())}">
        </div>
        <div class="field">
          <label for="fin-ob-recurrence">التكرار</label>
          <select id="fin-ob-recurrence" name="recurrence">
            ${Object.entries(FINANCE_RECURRENCE).map(([key, label]) => `<option value="${key}" ${data.recurrence === key ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="fin-ob-type">النوع</label>
          <select id="fin-ob-type" name="type">
            ${Object.entries(FINANCE_OBLIGATION_TYPES).map(([key, label]) => `<option value="${key}" ${data.type === key ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="fin-ob-category">تصنيف المصروف</label>
          ${financeCategorySelect('fin-ob-category', 'expense', data.categoryId, true, 'categoryId')}
        </div>
        ${obligation ? `<div class="field"><label for="fin-ob-status">الحالة</label><select id="fin-ob-status" name="status"><option value="active" ${data.status === 'active' ? 'selected' : ''}>نشط</option><option value="paused" ${data.status === 'paused' ? 'selected' : ''}>موقوف</option><option value="ended" ${data.status === 'ended' ? 'selected' : ''}>منتهي</option></select></div>` : ''}
        <div class="field">
          <label for="fin-ob-reminder-time">وقت التذكير</label>
          <input id="fin-ob-reminder-time" name="reminderTime" type="time" value="${escapeAttr(data.reminderTime || '09:00')}">
        </div>
        <div class="field full">
          <label class="row" style="cursor:pointer;font-size:12px">
            <input type="checkbox" name="reminderEnabled" ${data.reminderEnabled ? 'checked' : ''}>
            <span>إنشاء/مزامنة تذكير تلقائي قبل الاستحقاق</span>
          </label>
        </div>
        <div class="field full">
          <label for="fin-ob-notes">ملاحظات</label>
          <textarea id="fin-ob-notes" name="notes" maxlength="500">${escapeHtml(data.notes || '')}</textarea>
        </div>
      </div>
    </form>
  `;
  openModal({
    title: obligation ? 'تعديل الالتزام' : 'التزام / قسط جديد',
    subtitle: 'تابع الإيجار والفواتير والاشتراكات والأقساط',
    size: 'lg',
    content,
    footer: `<button class="ghost-btn" data-modal-close>إلغاء</button><div class="spacer"></div><button class="primary-btn" type="submit" form="finance-obligation-form">${icon('check', 15)} حفظ</button>`
  });
}

function openFinanceDebtModal(id = null) {
  const debt = id ? state.data.financeDebts.find((item) => item.id === id) : null;
  const data = debt || {
    creditor: '',
    principal: '',
    accountId: financeSettings().defaultAccountId,
    date: todayISO(),
    dueDate: '',
    notes: '',
    reminderEnabled: true
  };
  const content = `
    <form id="finance-debt-form" data-fin-form="debt" data-id="${debt?.id || ''}">
      <div class="form-grid">
        <div class="field full">
          <label for="fin-debt-creditor">اسم الدائن <span class="req">*</span></label>
          <input id="fin-debt-creditor" name="creditor" type="text" maxlength="120" value="${escapeAttr(data.creditor)}" required>
        </div>
        <div class="field">
          <label for="fin-debt-principal">أصل الدين <span class="req">*</span></label>
          <input id="fin-debt-principal" name="principal" type="number" min="0.001" step="0.001" value="${escapeAttr(data.principal ?? '')}" required>
        </div>
        <div class="field">
          <label for="fin-debt-account">حساب الاستلام/السداد</label>
          ${financeAccountSelect('fin-debt-account', data.accountId, false, 'all', 'accountId')}
        </div>
        <div class="field">
          <label for="fin-debt-date">تاريخ الدين</label>
          <input id="fin-debt-date" name="date" type="date" value="${escapeAttr(data.date || todayISO())}">
        </div>
        <div class="field">
          <label for="fin-debt-due">تاريخ السداد المتوقع</label>
          <input id="fin-debt-due" name="dueDate" type="date" value="${escapeAttr(data.dueDate || '')}">
        </div>
        <div class="field full">
          <label class="row" style="cursor:pointer;font-size:12px"><input type="checkbox" name="reminderEnabled" ${data.reminderEnabled ? 'checked' : ''}> <span>تذكير بتاريخ السداد المتوقع</span></label>
        </div>
        <div class="field full">
          <label for="fin-debt-notes">ملاحظات</label>
          <textarea id="fin-debt-notes" name="notes" maxlength="500">${escapeHtml(data.notes || '')}</textarea>
        </div>
        ${debt ? `<div class="field full"><span class="help">المدفوع حتى الآن: ${financeVal(financeDebtPaid(debt))} · المتبقي: ${financeVal(financeDebtRemaining(debt))}</span></div>` : ''}
      </div>
    </form>
  `;
  openModal({
    title: debt ? 'تعديل الدين' : 'إضافة دين عليّ',
    subtitle: 'استلام الدين ليس دخلًا، وسداده ليس مصروفًا استهلاكيًا',
    size: 'lg',
    content,
    footer: `<button class="ghost-btn" data-modal-close>إلغاء</button><div class="spacer"></div><button class="primary-btn" type="submit" form="finance-debt-form">${icon('check', 15)} حفظ</button>`
  });
}

function openFinanceSavingsGoalModal(id = null) {
  const goal = id ? state.data.financeSavingsGoals.find((item) => item.id === id) : null;
  const data = goal || {
    name: '',
    targetAmount: '',
    accountId: financeSettings().defaultAccountId,
    startDate: todayISO(),
    targetDate: addMonthsISO(todayISO(), 6),
    notes: ''
  };
  const content = `
    <form id="finance-goal-form" data-fin-form="savings-goal" data-id="${goal?.id || ''}">
      <div class="form-grid">
        <div class="field full">
          <label for="fin-goal-name">اسم هدف الادخار <span class="req">*</span></label>
          <input id="fin-goal-name" name="name" type="text" maxlength="120" value="${escapeAttr(data.name)}" required>
        </div>
        <div class="field">
          <label for="fin-goal-target">المبلغ المستهدف <span class="req">*</span></label>
          <input id="fin-goal-target" name="targetAmount" type="number" min="0.001" step="0.001" value="${escapeAttr(data.targetAmount ?? '')}" required>
        </div>
        <div class="field">
          <label for="fin-goal-account">الحساب المرتبط</label>
          ${financeAccountSelect('fin-goal-account', data.accountId, false, 'all', 'accountId')}
        </div>
        <div class="field">
          <label for="fin-goal-start">تاريخ البداية</label>
          <input id="fin-goal-start" name="startDate" type="date" value="${escapeAttr(data.startDate || todayISO())}">
        </div>
        <div class="field">
          <label for="fin-goal-date">الموعد المستهدف</label>
          <input id="fin-goal-date" name="targetDate" type="date" value="${escapeAttr(data.targetDate || addMonthsISO(todayISO(), 6))}">
        </div>
        ${!goal ? `<div class="field full"><label class="row" style="cursor:pointer;font-size:12px"><input type="checkbox" name="createLinkedGoal" checked> <span>إنشاء هدف عام مرتبط في قسم الأهداف</span></label><span class="help">سيتحدّث تقدم الهدف العام تلقائيًا مع الإيداع والسحب.</span></div>` : ''}
        <div class="field full">
          <label for="fin-goal-notes">ملاحظات</label>
          <textarea id="fin-goal-notes" name="notes" maxlength="500">${escapeHtml(data.notes || '')}</textarea>
        </div>
        ${goal ? `<div class="field full"><span class="help">المدخر حاليًا: ${financeVal(financeGoalSaved(goal.id))} · ${financeGoalProgress(goal).percent}%</span></div>` : ''}
      </div>
    </form>
  `;
  openModal({
    title: goal ? 'تعديل هدف الادخار' : 'هدف ادخار جديد',
    subtitle: 'الادخار ليس مصروفًا استهلاكيًا، ويُحتسب ضمن صافي الثروة',
    content,
    footer: `<button class="ghost-btn" data-modal-close>إلغاء</button><div class="spacer"></div><button class="primary-btn" type="submit" form="finance-goal-form">${icon('check', 15)} حفظ</button>`
  });
}

function openFinanceBudgetModal(id = null) {
  const budget = id ? state.data.financeBudgets.find((item) => item.id === id) : null;
  const data = budget || {
    period: financeMonthKey(),
    scope: 'overall',
    accountType: 'all',
    categoryId: 'cat_exp_food',
    limit: ''
  };
  const content = `
    <form id="finance-budget-form" data-fin-form="budget" data-id="${budget?.id || ''}">
      <div class="form-grid">
        <div class="field">
          <label for="fin-budget-month">الشهر</label>
          <input id="fin-budget-month" name="period" type="month" value="${escapeAttr(data.period)}">
        </div>
        <div class="field">
          <label for="fin-budget-scope">النطاق</label>
          <select id="fin-budget-scope" name="scope" data-fin-budget-scope>
            <option value="overall" ${data.scope === 'overall' ? 'selected' : ''}>ميزانية عامة</option>
            <option value="category" ${data.scope === 'category' ? 'selected' : ''}>حسب تصنيف</option>
          </select>
        </div>
        <div class="field" data-fin-budget-category ${data.scope === 'category' ? '' : 'hidden'}>
          <label for="fin-budget-category">التصنيف</label>
          ${financeCategorySelect('fin-budget-category', 'expense', data.categoryId, true, 'categoryId')}
        </div>
        <div class="field">
          <label for="fin-budget-account-type">نطاق الحساب</label>
          <select id="fin-budget-account-type" name="accountType">
            <option value="all" ${data.accountType === 'all' ? 'selected' : ''}>موحّد</option>
            <option value="personal" ${data.accountType === 'personal' ? 'selected' : ''}>شخصي</option>
            <option value="family" ${data.accountType === 'family' ? 'selected' : ''}>عائلي</option>
          </select>
        </div>
        <div class="field full">
          <label for="fin-budget-limit">حد الإنفاق <span class="req">*</span></label>
          <input id="fin-budget-limit" name="limit" type="number" min="0.001" step="0.001" value="${escapeAttr(data.limit ?? '')}" required>
        </div>
      </div>
    </form>
  `;
  openModal({
    title: budget ? 'تعديل الميزانية' : 'ميزانية جديدة',
    subtitle: 'حدود شهرية عامة أو حسب التصنيف',
    content,
    footer: `<button class="ghost-btn" data-modal-close>إلغاء</button><div class="spacer"></div><button class="primary-btn" type="submit" form="finance-budget-form">${icon('check', 15)} حفظ</button>`
  });
}

function openFinanceSetPinModal({ change = false } = {}) {
  const content = `
    <form id="finance-pin-form" data-fin-form="pin" data-change="${change ? '1' : '0'}">
      <div class="form-grid">
        ${change ? `<div class="field full"><label for="fin-pin-current">رمز PIN الحالي</label><input id="fin-pin-current" name="currentPin" type="password" inputmode="numeric" maxlength="8" required></div>` : ''}
        <div class="field full">
          <label for="fin-pin-new">رمز PIN الجديد (4–8 أرقام)</label>
          <input id="fin-pin-new" name="pin" type="password" inputmode="numeric" maxlength="8" pattern="[0-9]{4,8}" required>
        </div>
        <div class="field full">
          <label for="fin-pin-confirm">تأكيد الرمز</label>
          <input id="fin-pin-confirm" name="confirmPin" type="password" inputmode="numeric" maxlength="8" pattern="[0-9]{4,8}" required>
        </div>
        <div class="field full"><span class="help">هذا قفل واجهة لحماية الخصوصية أثناء استخدام الجهاز، وليس تشفيرًا للبيانات.</span></div>
      </div>
    </form>
  `;
  openModal({
    title: change ? 'تغيير رمز PIN' : 'تفعيل قفل ماليّاتي',
    subtitle: 'قفل مستقل لقسم الماليات فقط',
    content,
    footer: `<button class="ghost-btn" data-modal-close>إلغاء</button><div class="spacer"></div><button class="primary-btn" type="submit" form="finance-pin-form">${icon('lock', 15)} حفظ</button>`
  });
}

function openFinanceDisablePinModal() {
  const content = `
    <form id="finance-pin-disable-form" data-fin-form="pin-disable">
      <div class="form-grid">
        <div class="field full">
          <label for="fin-pin-disable">رمز PIN الحالي</label>
          <input id="fin-pin-disable" name="pin" type="password" inputmode="numeric" maxlength="8" required>
        </div>
      </div>
    </form>
  `;
  openModal({
    title: 'تعطيل قفل ماليّاتي',
    subtitle: 'أدخل الرمز للتأكيد',
    content,
    footer: `<button class="ghost-btn" data-modal-close>إلغاء</button><div class="spacer"></div><button class="danger-btn" type="submit" form="finance-pin-disable-form">تعطيل</button>`
  });
}

/* ---------------- الدفع والإيداع ---------------- */
function openFinanceObligationPaymentModal(id) {
  const obligation = state.data.financeObligations.find((item) => item.id === id);
  if (!obligation) return;
  const info = financeObligationInfo(obligation);
  const content = `
    <form id="finance-ob-pay-form" data-fin-form="obligation-payment" data-id="${obligation.id}">
      <div class="banner"><span class="banner-icon">${icon('info', 16)}</span><div><strong>${escapeHtml(obligation.name)}</strong><p>المتبقي لهذه الدورة: ${money(info.remainingDue)} · ${info.statusLabel}</p></div></div>
      <div class="form-grid mt-2">
        <div class="field full">
          <label for="fin-obp-amount">مبلغ السداد <span class="req">*</span></label>
          <input id="fin-obp-amount" name="amount" type="number" min="0.001" step="0.001" max="${info.remainingDue}" value="${info.remainingDue}" required>
        </div>
        <div class="field">
          <label for="fin-obp-account">حساب الدفع</label>
          ${financeAccountSelect('fin-obp-account', obligation.accountId, false, 'all', 'accountId')}
        </div>
        <div class="field">
          <label for="fin-obp-date">التاريخ</label>
          <input id="fin-obp-date" name="date" type="date" value="${todayISO()}">
        </div>
        <div class="field">
          <label for="fin-obp-time">الوقت</label>
          <input id="fin-obp-time" name="time" type="time" value="${nowHHMM()}">
        </div>
        <div class="field">
          <label for="fin-obp-method">طريقة الدفع</label>
          <select id="fin-obp-method" name="paymentMethod">
            ${Object.entries(FINANCE_PAYMENT_METHODS).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}
          </select>
        </div>
        <div class="field full">
          <label for="fin-obp-notes">ملاحظات</label>
          <textarea id="fin-obp-notes" name="notes" maxlength="500"></textarea>
        </div>
      </div>
    </form>
  `;
  openModal({
    title: 'سداد التزام',
    subtitle: 'سيُسجّل كمصروف واحد فقط، ويُحدّث سجل السداد',
    content,
    footer: `<button class="ghost-btn" data-modal-close>إلغاء</button><div class="spacer"></div><button class="primary-btn" type="submit" form="finance-ob-pay-form">${icon('check', 15)} تسجيل السداد</button>`
  });
}

function openFinanceDebtPaymentModal(id) {
  const debt = state.data.financeDebts.find((item) => item.id === id);
  if (!debt) return;
  const remaining = financeDebtRemaining(debt);
  const content = `
    <form id="finance-debt-pay-form" data-fin-form="debt-payment" data-id="${debt.id}">
      <div class="banner"><span class="banner-icon">${icon('scale', 16)}</span><div><strong>${escapeHtml(debt.creditor)}</strong><p>أصل الدين ${money(debt.principal)} · المتبقي ${money(remaining)}</p></div></div>
      <div class="form-grid mt-2">
        <div class="field full">
          <label for="fin-dp-amount">مبلغ الدفعة <span class="req">*</span></label>
          <input id="fin-dp-amount" name="amount" type="number" min="0.001" step="0.001" max="${remaining}" value="${remaining}" required>
        </div>
        <div class="field">
          <label for="fin-dp-account">حساب الدفع</label>
          ${financeAccountSelect('fin-dp-account', debt.accountId || financeSettings().defaultAccountId, false, 'all', 'accountId')}
        </div>
        <div class="field">
          <label for="fin-dp-date">التاريخ</label>
          <input id="fin-dp-date" name="date" type="date" value="${todayISO()}">
        </div>
        <div class="field">
          <label for="fin-dp-time">الوقت</label>
          <input id="fin-dp-time" name="time" type="time" value="${nowHHMM()}">
        </div>
        <div class="field full">
          <label for="fin-dp-notes">ملاحظات</label>
          <textarea id="fin-dp-notes" name="notes" maxlength="500"></textarea>
        </div>
      </div>
    </form>
  `;
  openModal({
    title: 'سداد دفعة دين',
    subtitle: 'تُحدّث الرصيد المتبقي ولا تُحتسب مصروفًا مرتين',
    content,
    footer: `<button class="ghost-btn" data-modal-close>إلغاء</button><div class="spacer"></div><button class="primary-btn" type="submit" form="finance-debt-pay-form">${icon('check', 15)} تسجيل الدفعة</button>`
  });
}

function openFinanceSavingsEntryModal(goalId, entryId = null) {
  const goal = state.data.financeSavingsGoals.find((item) => item.id === goalId);
  if (!goal) return;
  const entry = entryId ? state.data.financeSavingsEntries.find((item) => item.id === entryId) : null;
  const saved = financeGoalSaved(goal.id);
  const content = `
    <form id="finance-savings-entry-form" data-fin-form="savings-entry" data-id="${entry?.id || ''}" data-goal-id="${goal.id}">
      <div class="banner"><span class="banner-icon">${icon('piggy-bank', 16)}</span><div><strong>${escapeHtml(goal.name)}</strong><p>المدخر ${money(saved)} من ${money(goal.targetAmount)}</p></div></div>
      <div class="form-grid mt-2">
        <div class="field">
          <label for="fin-se-type">نوع الحركة</label>
          <select id="fin-se-type" name="type" ${entry ? 'disabled' : ''}>
            <option value="deposit" ${entry?.type !== 'withdraw' ? 'selected' : ''}>إيداع ادخار</option>
            <option value="withdraw" ${entry?.type === 'withdraw' ? 'selected' : ''}>سحب من الادخار</option>
          </select>
        </div>
        <div class="field">
          <label for="fin-se-amount">المبلغ <span class="req">*</span></label>
          <input id="fin-se-amount" name="amount" type="number" min="0.001" step="0.001" value="${escapeAttr(entry?.amount ?? '')}" required>
        </div>
        <div class="field">
          <label for="fin-se-date">التاريخ</label>
          <input id="fin-se-date" name="date" type="date" value="${escapeAttr(entry?.date || todayISO())}">
        </div>
        <div class="field">
          <label for="fin-se-time">الوقت</label>
          <input id="fin-se-time" name="time" type="time" value="${nowHHMM()}">
        </div>
        <div class="field full">
          <label for="fin-se-notes">ملاحظات</label>
          <textarea id="fin-se-notes" name="notes" maxlength="500">${escapeHtml(entry?.note || '')}</textarea>
        </div>
      </div>
    </form>
  `;
  openModal({
    title: entry ? 'تعديل حركة ادخار' : 'حركة ادخار',
    subtitle: 'الإيداع يقلل المتاح للصرف ويظل ضمن صافي الثروة',
    content,
    footer: `<button class="ghost-btn" data-modal-close>إلغاء</button><div class="spacer"></div><button class="primary-btn" type="submit" form="finance-savings-entry-form">${icon('check', 15)} حفظ</button>`
  });
}

/* ---------------- التفاصيل ---------------- */
function openFinanceObligationDetail(id) {
  const obligation = state.data.financeObligations.find((item) => item.id === id);
  if (!obligation) return;
  const info = financeObligationInfo(obligation);
  const payments = financeObligationPayments(id).slice().reverse();
  const content = `
    <div class="stat-grid finance-grid">
      ${statCard({ label: 'المتبقي للدورة', value: financeVal(info.remainingDue), iconName: 'bell' })}
      ${statCard({ label: 'إجمالي المسدد', value: financeVal(info.paidTotal), iconName: 'check-circle' })}
      ${statCard({ label: 'الاستحقاق', value: relativeDateLabel(info.dueDate), meta: formatDateLong(info.dueDate), iconName: 'calendar' })}
      ${statCard({ label: 'الحالة', value: info.statusLabel, iconName: 'info' })}
    </div>
    <div class="finance-kv"><span>الحساب</span><span>${financeAccountName(obligation.accountId)}</span></div>
    <div class="finance-kv"><span>النوع</span><span>${FINANCE_OBLIGATION_TYPES[obligation.type] || obligation.type}</span></div>
    <div class="finance-kv"><span>التكرار</span><span>${FINANCE_RECURRENCE[obligation.recurrence] || obligation.recurrence}</span></div>
    ${obligation.notes ? `<div class="finance-kv"><span>ملاحظات</span><span>${escapeHtml(obligation.notes)}</span></div>` : ''}
    <div class="section-title mt-3">سجل السداد</div>
    <div class="finance-list mt-2">
      ${payments.length ? payments.map((payment) => financeRow({ iconName: 'check', title: formatDateLong(payment.date), meta: payment.note || '', value: financeVal(payment.amount), action: 'finance-tx-detail', id: payment.transactionId })).join('') : '<div class="empty-state"><p>لا توجد دفعات بعد</p></div>'}
    </div>
  `;
  openModal({
    title: obligation.name,
    subtitle: `${FINANCE_OBLIGATION_TYPES[obligation.type] || ''} · ${FINANCE_RECURRENCE[obligation.recurrence] || ''}`,
    size: 'lg',
    content,
    footer: `
      <button class="danger-btn small" data-action="finance-delete-obligation" data-id="${obligation.id}">${icon('trash', 13)} حذف</button>
      <button class="ghost-btn" data-action="finance-edit-obligation" data-id="${obligation.id}">${icon('edit', 13)} تعديل</button>
      <div class="spacer"></div>
      <button class="primary-btn" data-action="finance-pay-obligation" data-id="${obligation.id}">${icon('check', 14)} تسجيل سداد</button>
    `
  });
}

function openFinanceDebtDetail(id) {
  const debt = state.data.financeDebts.find((item) => item.id === id);
  if (!debt) return;
  const remaining = financeDebtRemaining(debt);
  const paid = financeDebtPaid(debt);
  const pct = debt.principal > 0 ? clamp(Math.round((paid / debt.principal) * 100), 0, 100) : 0;
  const payments = financeDebtPayments(id).slice().reverse();
  const content = `
    <div class="stat-grid finance-grid">
      ${statCard({ label: 'أصل الدين', value: financeVal(debt.principal), iconName: 'scale' })}
      ${statCard({ label: 'المسدد', value: financeVal(paid), iconName: 'check-circle' })}
      ${statCard({ label: 'المتبقي', value: financeVal(remaining), iconName: 'wallet', tone: remaining > 0 ? 'warning' : '' })}
      ${statCard({ label: 'السداد المتوقع', value: debt.dueDate ? relativeDateLabel(debt.dueDate) : '—', iconName: 'calendar' })}
    </div>
    <div class="progress ${pct >= 100 ? '' : 'warning'}" style="margin-bottom:14px"><span style="width:${pct}%"></span></div>
    <div class="finance-kv"><span>تاريخ الدين</span><span>${formatDateLong(debt.date)}</span></div>
    <div class="finance-kv"><span>الحساب</span><span>${financeAccountName(debt.accountId)}</span></div>
    ${debt.notes ? `<div class="finance-kv"><span>ملاحظات</span><span>${escapeHtml(debt.notes)}</span></div>` : ''}
    <div class="section-title mt-3">سجل الدفعات</div>
    <div class="finance-list mt-2">
      ${payments.length ? payments.map((payment) => financeRow({ iconName: 'check', title: formatDateLong(payment.date), meta: payment.note || '', value: financeVal(payment.amount), action: 'finance-tx-detail', id: payment.transactionId })).join('') : '<div class="empty-state"><p>لا توجد دفعات بعد</p></div>'}
    </div>
  `;
  openModal({
    title: `دين: ${debt.creditor}`,
    subtitle: remaining > 0 ? `المتبقي ${financeVal(remaining)}` : 'مسدّد بالكامل',
    size: 'lg',
    content,
    footer: `
      <button class="danger-btn small" data-action="finance-delete-debt" data-id="${debt.id}">${icon('trash', 13)} حذف الدين</button>
      <button class="ghost-btn" data-action="finance-edit-debt" data-id="${debt.id}">${icon('edit', 13)} تعديل</button>
      <div class="spacer"></div>
      ${remaining > 0 ? `<button class="primary-btn" data-action="finance-pay-debt" data-id="${debt.id}">${icon('check', 14)} تسجيل دفعة</button>` : ''}
    `
  });
}

function openFinanceSavingsGoalDetail(id) {
  const goal = state.data.financeSavingsGoals.find((item) => item.id === id);
  if (!goal) return;
  const prog = financeGoalProgress(goal);
  const entries = financeSavingsEntries(id).slice().reverse();
  const content = `
    <div class="stat-grid finance-grid">
      ${statCard({ label: 'المدخر', value: financeVal(prog.saved), iconName: 'piggy-bank' })}
      ${statCard({ label: 'المستهدف', value: financeVal(prog.target), iconName: 'target' })}
      ${statCard({ label: 'المتبقي', value: financeVal(prog.remaining), iconName: 'wallet' })}
      ${statCard({ label: 'الإنجاز', value: `${prog.percent}%`, iconName: 'chart' })}
    </div>
    <div class="progress blue" style="margin-bottom:14px"><span style="width:${prog.percent}%"></span></div>
    <div class="finance-kv"><span>الحساب المرتبط</span><span>${financeAccountName(goal.accountId)}</span></div>
    <div class="finance-kv"><span>الفترة</span><span>${formatDateShort(goal.startDate)} — ${formatDateShort(goal.targetDate)}</span></div>
    ${goal.notes ? `<div class="finance-kv"><span>ملاحظات</span><span>${escapeHtml(goal.notes)}</span></div>` : ''}
    <div class="section-title mt-3">سجل الإيداعات والسحوبات</div>
    <div class="finance-list mt-2">
      ${entries.length ? entries.map((entry) => financeRow({ iconName: entry.type === 'withdraw' ? 'arrow-up-right' : 'arrow-down-left', title: entry.type === 'withdraw' ? 'سحب من الادخار' : 'إيداع ادخار', meta: `${formatDateShort(entry.date)}${entry.note ? ' · ' + escapeHtml(entry.note) : ''}`, value: financeVal(entry.type === 'withdraw' ? -entry.amount : entry.amount), action: 'finance-tx-detail', id: entry.transactionId })).join('') : '<div class="empty-state"><p>لا توجد حركات بعد</p></div>'}
    </div>
  `;
  openModal({
    title: goal.name,
    subtitle: 'هدف ادخار',
    size: 'lg',
    content,
    footer: `
      <button class="danger-btn small" data-action="finance-delete-goal" data-id="${goal.id}">${icon('trash', 13)} حذف</button>
      <button class="ghost-btn" data-action="finance-edit-goal" data-id="${goal.id}">${icon('edit', 13)} تعديل</button>
      <div class="spacer"></div>
      <button class="soft-btn" data-action="finance-withdraw-goal" data-id="${goal.id}">${icon('arrow-up-right', 14)} سحب</button>
      <button class="primary-btn" data-action="finance-deposit-goal" data-id="${goal.id}">${icon('arrow-down-left', 14)} إيداع</button>
    `
  });
}

function openFinanceTransactionDetail(id) {
  const tx = state.data.financeTransactions.find((item) => item.id === id);
  if (!tx) return;
  const attachment = tx.attachmentId ? state.data.financeAttachments.find((item) => item.id === tx.attachmentId) : null;
  const attachmentUrl = attachment ? financeAttachmentUrl(attachment) : '';
  const content = `
    <div class="stat-grid finance-grid">
      ${statCard({ label: 'المبلغ', value: financeVal(tx.amount), iconName: FINANCE_TX_ICONS[tx.type] || 'wallet' })}
      ${statCard({ label: 'النوع', value: FINANCE_TX_LABELS[tx.type] || tx.type, iconName: 'info' })}
      ${statCard({ label: 'التاريخ', value: formatDateShort(tx.date), meta: formatTimeHM(tx.time), iconName: 'calendar' })}
      ${statCard({ label: 'الحساب', value: financeAccountName(tx.accountId), iconName: 'wallet' })}
    </div>
    ${tx.type === 'transfer' ? `<div class="finance-kv"><span>إلى حساب</span><span>${financeAccountName(tx.toAccountId)}</span></div>` : ''}
    <div class="finance-kv"><span>التصنيف</span><span>${tx.categoryId ? escapeHtml(financeCategoryName(tx.categoryId)) : '—'}</span></div>
    ${tx.merchant ? `<div class="finance-kv"><span>المتجر/الجهة</span><span>${escapeHtml(tx.merchant)}</span></div>` : ''}
    ${tx.counterparty ? `<div class="finance-kv"><span>الطرف الآخر</span><span>${escapeHtml(tx.counterparty)}</span></div>` : ''}
    ${tx.paymentMethod ? `<div class="finance-kv"><span>طريقة الدفع</span><span>${FINANCE_PAYMENT_METHODS[tx.paymentMethod] || tx.paymentMethod}</span></div>` : ''}
    ${tx.notes ? `<div class="finance-kv"><span>ملاحظات</span><span>${escapeHtml(tx.notes)}</span></div>` : ''}
    ${tx.linkedGroupId ? `<div class="finance-kv"><span>حركة مرتبطة</span><span>طرف تحويل آخر</span></div>` : ''}
    ${tx.obligationId ? `<div class="finance-kv"><span>مرتبط بـ</span><span>${escapeHtml(financeObligationName(tx.obligationId))}</span></div>` : ''}
    ${tx.debtId ? `<div class="finance-kv"><span>مرتبط بـ</span><span>${escapeHtml(financeDebtName(tx.debtId))}</span></div>` : ''}
    ${tx.savingsGoalId ? `<div class="finance-kv"><span>مرتبط بـ</span><span>${escapeHtml(financeGoalName(tx.savingsGoalId))}</span></div>` : ''}
    ${attachmentUrl ? `<div class="field full mt-3"><label>صورة الفاتورة</label><a class="soft-btn" style="width:fit-content" href="${escapeAttr(attachmentUrl)}" target="_blank" rel="noopener">${icon('file-text', 14)} فتح المرفق</a></div>` : ''}
  `;
  const canEdit = ['expense', 'income', 'transfer'].includes(tx.type);
  openModal({
    title: 'تفاصيل المعاملة',
    subtitle: financeTransactionTitle(tx),
    size: 'lg',
    content,
    footer: `
      <button class="danger-btn small" data-action="finance-delete-tx" data-id="${tx.id}">${icon('trash', 13)} حذف</button>
      ${canEdit ? `<button class="ghost-btn" data-action="finance-edit-tx" data-id="${tx.id}">${icon('edit', 13)} تعديل</button>` : ''}
      <div class="spacer"></div>
      <button class="ghost-btn" data-modal-close>إغلاق</button>
    `
  });
}

/* ---------------- إرسال النماذج المالية ---------------- */
async function handleFinanceFormSubmit(form) {
  const type = form.dataset.finForm;
  const id = form.dataset.id;
  const fd = new FormData(form);
  const file = fd.get('attachment');

  if (type === 'expense') {
    const input = {
      amount: fd.get('amount'),
      accountId: fd.get('accountId'),
      categoryId: fd.get('categoryId'),
      date: fd.get('date'),
      time: fd.get('time'),
      paymentMethod: fd.get('paymentMethod'),
      merchant: fd.get('merchant'),
      notes: fd.get('notes')
    };
    const saved = id ? await updateFinanceExpense(id, input) : await createFinanceExpense(input);
    if (file && file.size) {
      const previousAttachmentId = saved.attachmentId || '';
      const attachment = await saveFinanceAttachment(saved.id, file);
      if (attachment) {
        await saveFinanceAttachmentToTransaction(saved.id, attachment.id);
        if (previousAttachmentId && previousAttachmentId !== attachment.id) {
          await deleteFinanceAttachment(previousAttachmentId);
        }
      }
    }
    closeAllModals();
    renderFinance();
    showToast({ title: id ? 'تم تحديث المصروف' : 'تم تسجيل المصروف', message: 'أُعيد حساب الأرصدة والتقارير' });
    return;
  }

  if (type === 'income') {
    const input = {
      amount: fd.get('amount'),
      accountId: fd.get('accountId'),
      categoryId: fd.get('categoryId'),
      incomeKind: fd.get('incomeKind'),
      date: fd.get('date'),
      time: fd.get('time'),
      counterparty: fd.get('counterparty'),
      notes: fd.get('notes'),
      scheduleId: fd.get('scheduleId')
    };
    if (id) await updateFinanceIncome(id, input);
    else await createFinanceIncome(input);
    closeAllModals();
    renderFinance();
    showToast({ title: id ? 'تم تحديث الدخل' : 'تم تسجيل الدخل', message: 'الدخل المستقبلي لا يُحتسب حتى تسجيل الاستلام' });
    return;
  }

  if (type === 'income-source') {
    const input = {
      id: id || undefined,
      name: fd.get('name'),
      amount: fd.get('amount'),
      accountId: fd.get('accountId'),
      dayOfMonth: fd.get('dayOfMonth'),
      categoryId: fd.get('categoryId'),
      incomeKind: fd.get('incomeKind'),
      source: fd.get('source'),
      recurrence: fd.get('recurrence'),
      enabled: fd.get('enabled') !== 'off',
      notes: fd.get('notes')
    };
    if (id) await saveFinanceIncomeSchedule(input);
    else await saveFinanceIncomeSchedule(input);
    closeAllModals();
    renderFinance();
    showToast({ title: id ? 'تم تحديث مصدر الدخل' : 'تمت إضافة مصدر الدخل' });
    return;
  }

  if (type === 'receive-income') {
    const scheduleId = form.dataset.id;
    const input = {
      amount: fd.get('amount'),
      accountId: fd.get('accountId'),
      categoryId: fd.get('categoryId') || 'cat_inc_salary',
      incomeKind: 'salary',
      date: fd.get('date'),
      time: fd.get('time'),
      counterparty: fd.get('counterparty') || '',
      notes: fd.get('notes'),
      scheduleId: scheduleId || ''
    };
    await createFinanceIncome(input);
    // تحديث آخر استلام للجدول
    const schedule = state.data.financeIncomeSchedules.find((item) => item.id === scheduleId);
    if (schedule) {
      await saveFinanceIncomeSchedule({ ...schedule, lastReceivedAt: fd.get('date') });
    }
    closeAllModals();
    renderFinance();
    showToast({ title: 'تم تسجيل الاستلام', message: 'تم إنشاء معاملة دخل فعالة وتحديث جدول المصدر' });
    return;
  }

  if (type === 'transfer') {
    const input = {
      amount: fd.get('amount'),
      fromAccountId: fd.get('fromAccountId'),
      toAccountId: fd.get('toAccountId'),
      date: fd.get('date'),
      time: fd.get('time'),
      notes: fd.get('notes')
    };
    if (id) await updateFinanceTransfer(id, input);
    else await createFinanceTransfer(input);
    closeAllModals();
    renderFinance();
    showToast({ title: id ? 'تم تحديث التحويل' : 'تم تنفيذ التحويل', message: 'طرفا الحركة مرتبطان ولا يؤثران في صافي الإجمالي' });
    return;
  }

  if (type === 'obligation') {
    const input = {
      name: fd.get('name'),
      accountId: fd.get('accountId'),
      expectedAmount: fd.get('expectedAmount'),
      dueDate: fd.get('dueDate'),
      recurrence: fd.get('recurrence'),
      type: fd.get('type'),
      categoryId: fd.get('categoryId'),
      status: fd.get('status') || 'active',
      reminderEnabled: fd.get('reminderEnabled') === 'on',
      reminderTime: fd.get('reminderTime'),
      notes: fd.get('notes')
    };
    if (id) await updateFinanceObligation(id, input);
    else await createFinanceObligation(input);
    closeAllModals();
    renderFinance();
    showToast({ title: id ? 'تم تحديث الالتزام' : 'تمت إضافة الالتزام', message: 'تمت مزامنة التذكير والتقويم' });
    return;
  }

  if (type === 'debt') {
    const input = {
      creditor: fd.get('creditor'),
      principal: fd.get('principal'),
      accountId: fd.get('accountId'),
      date: fd.get('date'),
      dueDate: fd.get('dueDate'),
      notes: fd.get('notes'),
      reminderEnabled: fd.get('reminderEnabled') === 'on'
    };
    if (id) await updateFinanceDebt(id, input);
    else await createFinanceDebt(input);
    closeAllModals();
    renderFinance();
    showToast({ title: id ? 'تم تحديث الدين' : 'تم تسجيل الدين', message: 'أصل الدين ليس دخلًا، والمتبقي يُحسب ضمن الالتزامات' });
    return;
  }

  if (type === 'savings-goal') {
    const input = {
      name: fd.get('name'),
      targetAmount: fd.get('targetAmount'),
      accountId: fd.get('accountId'),
      startDate: fd.get('startDate'),
      targetDate: fd.get('targetDate'),
      notes: fd.get('notes'),
      createLinkedGoal: fd.get('createLinkedGoal') === 'on'
    };
    if (id) await updateFinanceSavingsGoal(id, input);
    else await createFinanceSavingsGoal(input);
    closeAllModals();
    renderFinance();
    showToast({ title: id ? 'تم تحديث هدف الادخار' : 'تم إنشاء هدف الادخار' });
    return;
  }

  if (type === 'savings-entry') {
    const goalId = form.dataset.goalId;
    const input = {
      goalId,
      type: fd.get('type') || 'deposit',
      amount: fd.get('amount'),
      date: fd.get('date'),
      time: fd.get('time'),
      notes: fd.get('notes')
    };
    if (id) await updateFinanceSavingsEntry(id, input);
    else await createFinanceSavingsEntry(input);
    closeAllModals();
    renderFinance();
    showToast({ title: id ? 'تم تحديث حركة الادخار' : 'تم تسجيل حركة الادخار' });
    return;
  }

  if (type === 'budget') {
    await saveFinanceBudget({
      period: fd.get('period'),
      scope: fd.get('scope'),
      accountType: fd.get('accountType'),
      categoryId: fd.get('categoryId'),
      limit: fd.get('limit')
    });
    closeAllModals();
    renderFinance();
    showToast({ title: 'تم حفظ الميزانية' });
    return;
  }

  if (type === 'obligation-payment') {
    await createFinanceObligationPayment({
      obligationId: id,
      amount: fd.get('amount'),
      accountId: fd.get('accountId'),
      date: fd.get('date'),
      time: fd.get('time'),
      paymentMethod: fd.get('paymentMethod'),
      notes: fd.get('notes')
    });
    closeAllModals();
    renderFinance();
    showToast({ title: 'تم تسجيل السداد', message: 'أُضيف المصروف مرة واحدة وتم تحديث سجل الالتزام' });
    return;
  }

  if (type === 'debt-payment') {
    await createFinanceDebtPayment({
      debtId: id,
      amount: fd.get('amount'),
      accountId: fd.get('accountId'),
      date: fd.get('date'),
      time: fd.get('time'),
      notes: fd.get('notes')
    });
    closeAllModals();
    renderFinance();
    showToast({ title: 'تم تسجيل دفعة الدين', message: 'تم تحديث الرصيد المتبقي' });
    return;
  }

  if (type === 'pin') {
    const pin = String(fd.get('pin') || '');
    const confirm = String(fd.get('confirmPin') || '');
    if (pin !== confirm) throw new Error('الرمزان غير متطابقين');
    if (form.dataset.change === '1') {
      const current = String(fd.get('currentPin') || '');
      const ok = await verifyFinancePin(current);
      if (!ok) throw new Error('رمز PIN الحالي غير صحيح');
    }
    await setFinancePin(pin);
    closeAllModals();
    renderFinance();
    showToast({ title: 'تم تفعيل قفل ماليّاتي', message: 'قفل واجهة فقط، وليس تشفيرًا للبيانات' });
    return;
  }

  if (type === 'pin-disable') {
    await disableFinancePin(fd.get('pin'));
    closeAllModals();
    renderFinance();
    showToast({ title: 'تم تعطيل القفل' });
    return;
  }

  throw new Error('نوع النموذج المالي غير معروف');
}

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('form[data-fin-form]');
  if (!form) return;
  event.preventDefault();
  if (form.dataset.submitting === '1') return;
  form.dataset.submitting = '1';
  try {
    await handleFinanceFormSubmit(form);
  } catch (error) {
    console.error('[نظامي] خطأ في النموذج المالي', error);
    showToast({ type: 'error', title: 'تعذر الحفظ', message: error.message });
  } finally {
    delete form.dataset.submitting;
  }
});

document.addEventListener('change', (event) => {
  const target = event.target;
  if (target.matches('[data-fin-budget-scope]')) {
    const form = target.closest('form');
    const field = form?.querySelector('[data-fin-budget-category]');
    if (field) field.hidden = target.value !== 'category';
  }
});

/* ---------------- إجراءات التفاصيل الإضافية ---------------- */
document.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id;

  if (action === 'finance-pay-obligation') {
    closeAllModals();
    openFinanceObligationPaymentModal(id);
    return;
  }
  if (action === 'finance-edit-obligation') {
    closeAllModals();
    openFinanceObligationModal(id);
    return;
  }
  if (action === 'finance-delete-obligation') {
    const ok = await confirmAction({
      title: 'حذف الالتزام؟',
      message: 'سيُحذف الالتزام وسجل دفعاته المرتبطة.',
      detail: 'ستُحذف معاملات المصروف المرتبطة بدفعاته أيضًا، وسيُعاد حساب الأرصدة.',
      confirmText: 'حذف', danger: true
    });
    if (!ok) return;
    try {
      await deleteFinanceObligation(id);
      closeAllModals();
      renderFinance();
      showToast({ title: 'تم حذف الالتزام' });
    } catch (error) { showToast({ type: 'error', title: 'فشل الحذف', message: error.message }); }
    return;
  }

  if (action === 'finance-pay-debt') {
    closeAllModals();
    openFinanceDebtPaymentModal(id);
    return;
  }
  if (action === 'finance-edit-debt') {
    closeAllModals();
    openFinanceDebtModal(id);
    return;
  }
  if (action === 'finance-delete-debt') {
    const ok = await confirmAction({
      title: 'حذف الدين؟',
      message: 'سيُحذف الدين وكل دفعاته ومعاملة استلام الدين.',
      confirmText: 'حذف الدين', danger: true
    });
    if (!ok) return;
    try {
      await deleteFinanceDebt(id);
      closeAllModals();
      renderFinance();
      showToast({ title: 'تم حذف الدين' });
    } catch (error) { showToast({ type: 'error', title: 'فشل الحذف', message: error.message }); }
    return;
  }

  if (action === 'finance-deposit-goal') {
    closeAllModals();
    openFinanceSavingsEntryModal(id);
    return;
  }
  if (action === 'finance-withdraw-goal') {
    closeAllModals();
    openFinanceSavingsEntryModal(id);
    setTimeout(() => {
      const select = document.getElementById('fin-se-type');
      if (select) select.value = 'withdraw';
    }, 60);
    return;
  }
  if (action === 'finance-edit-goal') {
    closeAllModals();
    openFinanceSavingsGoalModal(id);
    return;
  }
  if (action === 'finance-delete-goal') {
    const ok = await confirmAction({
      title: 'حذف هدف الادخار؟',
      message: 'سيُحذف الهدف وكل حركات الادخار المرتبطة.',
      detail: 'ستُحذف المعاملات المرتبطة ويُعاد حساب الأرصدة.',
      confirmText: 'حذف', danger: true
    });
    if (!ok) return;
    try {
      await deleteFinanceSavingsGoal(id);
      closeAllModals();
      renderFinance();
      showToast({ title: 'تم حذف هدف الادخار' });
    } catch (error) { showToast({ type: 'error', title: 'فشل الحذف', message: error.message }); }
    return;
  }

  if (action === 'finance-edit-tx') {
    const tx = state.data.financeTransactions.find((item) => item.id === id);
    if (!tx) return;
    closeAllModals();
    if (tx.type === 'expense') openFinanceExpenseModal(id);
    else if (tx.type === 'income') openFinanceIncomeModal(id);
    else if (tx.type === 'transfer') openFinanceTransferModal(id);
    return;
  }
  if (action === 'finance-delete-tx') {
    const tx = state.data.financeTransactions.find((item) => item.id === id);
    if (!tx) return;
    const linked = Boolean(tx.linkedGroupId || tx.obligationId || tx.debtId || tx.savingsGoalId);
    const ok = await confirmAction({
      title: 'حذف المعاملة؟',
      message: linked ? 'هذه المعاملة مرتبطة بحركات مالية أخرى.' : 'سيتم حذف المعاملة من السجل.',
      detail: linked
        ? (tx.linkedGroupId ? 'سيُحذف طرفا التحويل معًا للحفاظ على التوازن.' : 'سيُحذف السجل المالي المرتبط ويُعاد حساب الأرصدة والتقارير.')
        : 'سيُسجّل الحذف في سجل النشاط، ولا يمكن التراجع.',
      confirmText: 'حذف', danger: true
    });
    if (!ok) return;
    try {
      await deleteFinanceTransaction(id);
      closeAllModals();
      renderFinance();
      showToast({ title: 'تم حذف المعاملة', message: 'أُعيد حساب الأرصدة والتقارير' });
    } catch (error) {
      showToast({ type: 'error', title: 'تعذر الحذف', message: error.message });
    }
    return;
  }
});

