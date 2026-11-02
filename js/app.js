/* =========================================================
   نظامي — المحرك الرئيسي: التنقل، الأحداث، النماذج، الإشعارات
   ========================================================= */
'use strict';

const dom = {
  loading: document.getElementById('app-loading'),
  shell: document.getElementById('app-shell'),
  nav: document.getElementById('main-nav'),
  view: document.getElementById('view'),
  title: document.getElementById('page-title'),
  subtitle: document.getElementById('page-subtitle'),
  topbarDate: document.getElementById('topbar-date-text'),
  topbarBell: document.getElementById('topbar-bell'),
  remindersBadge: document.getElementById('reminders-badge'),
  storagePill: document.getElementById('storage-pill'),
  storageText: document.getElementById('storage-text'),
  sidebar: document.getElementById('sidebar'),
  backdrop: document.getElementById('sidebar-backdrop'),
  modalRoot: document.getElementById('modal-root'),
  toastRoot: document.getElementById('toast-root'),
  quickRoot: document.getElementById('quick-add-root')
};

const PAGE_INFO = {
  dashboard: { title: 'الرئيسية', subtitle: 'نظرة سريعة على يومك' },
  habits: { title: 'العادات', subtitle: 'بناء عادات صغيرة بتأثير كبير' },
  tasks: { title: 'المهام', subtitle: 'تنظيم أولوياتك وإتمامها' },
  goals: { title: 'الأهداف', subtitle: 'تحويل الأحلام إلى خطوات قابلة للقياس' },
  calendar: { title: 'التقويم', subtitle: 'كل شيء في مكان واحد حسب التاريخ' },
  sleep: { title: 'النوم', subtitle: 'متابعة وإحصائيات دقيقة لراحة أفضل' },
  reminders: { title: 'التذكيرات', subtitle: 'لا تفوت أي شيء مع التنبيهات' },
  activity: { title: 'سجل النشاط', subtitle: 'تاريخ كامل لعملياتك محفوظ حتى بعد الحذف' },
  settings: { title: 'الإعدادات', subtitle: 'ضبط التطبيق ونسخ احتياطي' }
};

const REMINDER_SNOOZE_OPTIONS = [5, 10, 15, 30, 60];
let reminderTimer = null;
let pendingImport = null;

/* ---------------- الإشعارات ---------------- */
async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') {
    await saveSettings({ notificationsAsked: true, notificationsEnabled: true });
    return 'granted';
  }
  if (Notification.permission === 'denied') return 'denied';
  try {
    const permission = await Notification.requestPermission();
    await saveSettings({ notificationsAsked: true, notificationsEnabled: permission === 'granted' });
    return permission;
  } catch (error) {
    console.error('[نظامي] تعذر طلب إذن الإشعارات', error);
    await saveSettings({ notificationsAsked: true });
    return 'denied';
  }
}

function showBrowserNotification(title, body, options = {}) {
  if (!('Notification' in window)) {
    showToast({ type: 'warning', title, message: body });
    return null;
  }
  if (Notification.permission !== 'granted') return null;
  if (document.visibilityState === 'visible' && !options.force) {
    return showToast({ type: 'info', title, message: body, duration: 9000 });
  }
  try {
    const { force, action, renotify, ...rest } = options;
    const notification = new Notification(title, {
      body,
      dir: 'rtl',
      lang: 'ar',
      icon: 'assets/icon.svg',
      badge: 'assets/icon.svg',
      tag: options.tag || 'nizami',
      renotify: Boolean(renotify),
      ...rest
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
      if (action) action();
    };
    return notification;
  } catch (error) {
    console.error('[نظامي] تعذر عرض إشعار المتصفح', error);
    return null;
  }
}

function startReminderChecker() {
  if (reminderTimer) clearInterval(reminderTimer);
  const check = async () => {
    try {
      const now = Date.now();
      for (const item of upcomingReminders(now)) {
        const { reminder, info } = item;
        if (!info) continue;
        if (info.epoch > now + 60000) continue;
        // التذكير المؤجل يُطلق حتى لو تأخر فتح التطبيق، أما العادي فله نافذة سماح 5 دقائق.
        if (!info.snoozed && info.epoch < now - 300000) continue;
        const key = info.key || `main:${reminder.id}:${info.date}:${info.time}`;
        if ((reminder.notifiedKeys || []).includes(key)) continue;
        await markReminderNotified(reminder.id, key);
        showBrowserNotification(
          `تذكير: ${reminder.title}`,
          reminder.description || `${relativeDateLabel(info.date)} · ${formatTimeHM(info.time)}`,
          {
            tag: `reminder-${reminder.id}`,
            force: true,
            action: () => navigate('reminders')
          }
        );
        showToast({
          type: 'warning',
          title: reminder.title,
          message: reminder.description || 'حان وقت التذكير',
          duration: 12000,
          actions: [
            { label: 'إكمال', action: () => completeReminder(reminder.id).then(() => { refreshUI(); showToast({ title: 'تم إكمال التذكير' }); }) },
            { label: 'تأجيل', action: () => openSnooze(reminder.id) },
            { label: 'عرض', action: () => navigate('reminders') }
          ]
        });
        updateNav();
      }
    } catch (error) {
      console.error('[نظامي] خطأ في فحص التذكيرات', error);
    }
  };
  check();
  reminderTimer = setInterval(check, 30000);
}

/* ---------------- التنبيهات ---------------- */
function showToast({ type = 'success', title = 'تم بنجاح', message = '', duration = 3600, actions = [] } = {}) {
  const toastEl = document.createElement('div');
  toastEl.className = `toast ${type}`;
  const iconName = type === 'error' ? 'alert' : type === 'warning' ? 'bell' : type === 'info' ? 'info' : 'check';
  toastEl.innerHTML = `
    <div class="toast-icon">${icon(iconName, 14)}</div>
    <div style="min-width:0;flex:1">
      <strong>${escapeHtml(title)}</strong>
      ${message ? `<p>${escapeHtml(message)}</p>` : ''}
      ${actions.length ? `<div class="row wrap" style="margin-top:6px">${actions.map((a, i) => `<button class="soft-btn small" data-toast-action="${i}">${escapeHtml(a.label)}</button>`).join('')}</div>` : ''}
    </div>
    <button class="toast-close" data-toast-close>${icon('x', 14)}</button>
  `;
  dom.toastRoot.appendChild(toastEl);
  const removeToast = () => {
    if (!toastEl.parentElement) return;
    toastEl.classList.add('leaving');
    setTimeout(() => toastEl.remove(), 220);
  };
  actions.forEach((a, i) => {
    toastEl.querySelector(`[data-toast-action="${i}"]`)?.addEventListener('click', () => {
      try { a.action(); } catch (error) { console.error(error); }
      removeToast();
    });
  });
  toastEl.querySelector('[data-toast-close]')?.addEventListener('click', removeToast);
  if (duration > 0) setTimeout(removeToast, duration);
  return toastEl;
}
const toast = showToast;

/* ---------------- التنقل والواجهة ---------------- */
function setSidebar(open) {
  state.ui.sidebarOpen = Boolean(open);
  dom.sidebar.classList.toggle('open', state.ui.sidebarOpen);
  dom.backdrop.classList.toggle('show', state.ui.sidebarOpen);
}

function updateNav() {
  dom.nav.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.nav === state.view);
  });
  const upcoming = upcomingReminders();
  if (dom.remindersBadge) {
    if (upcoming.length) {
      dom.remindersBadge.textContent = upcoming.length > 9 ? '9+' : String(upcoming.length);
      dom.remindersBadge.hidden = false;
    } else {
      dom.remindersBadge.hidden = true;
    }
  }
}

function updatePageHeader() {
  const info = PAGE_INFO[state.view] || { title: state.view, subtitle: '' };
  dom.title.textContent = info.title;
  dom.subtitle.textContent = info.subtitle;
  dom.topbarDate.textContent = formatDateLong(todayISO());
}

function navigate(view) {
  if (!PAGE_INFO[view]) view = 'dashboard';
  state.view = view;
  setSidebar(false);
  updateNav();
  updatePageHeader();
  renderCurrentView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCurrentView() {
  const fn = window[`render${capitalize(state.view)}`];
  if (typeof fn === 'function') {
    fn();
    updateNav();
  } else {
    dom.view.innerHTML = `<div class="card pad text-center"><h4>القسم غير متاح</h4></div>`;
  }
}

function refreshUI() {
  updateNav();
  updatePageHeader();
  renderCurrentView();
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function updateStorageUI() {
  if (!dom.storagePill) return;
  if (state.dbMode === 'fallback') {
    dom.storagePill.classList.add('warn');
    dom.storageText.textContent = 'تخزين بديل (localStorage)';
  } else if (state.dbError) {
    dom.storagePill.classList.add('warn');
    dom.storageText.textContent = 'تحذير في التخزين';
  } else {
    dom.storagePill.classList.remove('warn');
    dom.storageText.textContent = 'تخزين محلي آمن (IndexedDB)';
  }
}

/* ---------------- النوافذ ---------------- */
function openModal({ title, subtitle = '', size = 'md', content, footer = null }) {
  closeAllModals();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal ${size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : ''}" role="dialog" aria-modal="true">
      <div class="modal-head">
        <div>
          <h3>${escapeHtml(title)}</h3>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
        </div>
        <button class="modal-close" data-modal-close aria-label="إغلاق">${icon('x', 18)}</button>
      </div>
      <div class="modal-body">${content}</div>
      ${footer === null ? '' : `<div class="modal-foot">${footer}</div>`}
    </div>
  `;
  const close = () => {
    overlay.remove();
    document.body.classList.remove('modal-open');
  };
  overlay.querySelectorAll('[data-modal-close]').forEach((btn) => btn.addEventListener('click', close));
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
  document.body.classList.add('modal-open');
  dom.modalRoot.appendChild(overlay);
  return close;
}

function closeAllModals() {
  dom.modalRoot.innerHTML = '';
  document.body.classList.remove('modal-open');
}

function confirmAction({ title, message, detail = '', confirmText = 'تأكيد', cancelText = 'إلغاء', danger = false } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal modal-sm" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="modal-icon ${danger ? 'danger' : 'warning'}" style="margin:0">${icon(danger ? 'alert' : 'info', 20)}</div>
            <div>
              <h3>${escapeHtml(title)}</h3>
              <p>${escapeHtml(message)}</p>
            </div>
          </div>
          <button class="modal-close" data-confirm-close aria-label="إغلاق">${icon('x', 16)}</button>
        </div>
        <div class="modal-body">
          ${detail ? `<div class="confirm-text">${nl2br(detail)}</div>` : ''}
          ${danger ? `<div class="confirm-warning">هذه العملية لا يمكن التراجع عنها، ولا يتم حذف سجل النشاط المرتبط بالعناصر المحذوفة.</div>` : ''}
        </div>
        <div class="modal-foot">
          <button class="soft-btn" data-confirm-cancel>${escapeHtml(cancelText)}</button>
          <div class="spacer"></div>
          <button class="${danger ? 'danger-btn' : 'primary-btn'}" data-confirm-ok>${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;
    const finish = (result) => {
      overlay.remove();
      document.body.classList.remove('modal-open');
      resolve(result);
    };
    overlay.querySelector('[data-confirm-ok]').addEventListener('click', () => finish(true));
    overlay.querySelector('[data-confirm-cancel]').addEventListener('click', () => finish(false));
    overlay.querySelector('[data-confirm-close]').addEventListener('click', () => finish(false));
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) finish(false);
    });
    document.body.classList.add('modal-open');
    dom.modalRoot.appendChild(overlay);
  });
}

function openQuickAdd() {
  dom.quickRoot.innerHTML = '';
  const overlay = document.createElement('div');
  overlay.className = 'quick-menu';
  overlay.innerHTML = `
    <div class="quick-menu-panel">
      <div class="quick-menu-title">إضافة سريعة</div>
      <button class="quick-menu-item" data-qa="habit"><div class="quick-menu-icon green">${icon('check-circle', 16)}</div><span>إضافة عادة جديدة</span><div class="spacer"></div>${icon('arrow-right', 14)}</button>
      <button class="quick-menu-item" data-qa="task"><div class="quick-menu-icon blue">${icon('list-check', 16)}</div><span>إضافة مهمة جديدة</span><div class="spacer"></div>${icon('arrow-right', 14)}</button>
      <button class="quick-menu-item" data-qa="goal"><div class="quick-menu-icon purple">${icon('target', 16)}</div><span>إضافة هدف جديد</span><div class="spacer"></div>${icon('arrow-right', 14)}</button>
      <button class="quick-menu-item" data-qa="sleep"><div class="quick-menu-icon purple">${icon('moon', 16)}</div><span>تسجيل نوم / قيلولة</span><div class="spacer"></div>${icon('arrow-right', 14)}</button>
      <button class="quick-menu-item" data-qa="reminder"><div class="quick-menu-icon warning">${icon('bell', 16)}</div><span>إضافة تذكير</span><div class="spacer"></div>${icon('arrow-right', 14)}</button>
    </div>
  `;
  const close = () => overlay.remove();
  overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
  overlay.querySelectorAll('[data-qa]').forEach((btn) => {
    btn.addEventListener('click', () => {
      close();
      const action = btn.dataset.qa;
      if (action === 'habit') openHabitModal();
      if (action === 'task') openTaskModal();
      if (action === 'goal') openGoalModal();
      if (action === 'sleep') openSleepModal();
      if (action === 'reminder') openReminderModal();
    });
  });
  dom.quickRoot.appendChild(overlay);
}

/* ---------------- النسخ الاحتياطي ---------------- */
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportBackup() {
  try {
    const data = await DB.exportData();
    data.exportedFrom = window.location.origin;
    downloadJSON(data, `nizami-backup-${todayISO()}-${Date.now()}.json`);
    showToast({ title: 'تم تصدير النسخة الاحتياطية', message: 'تم حفظ ملف JSON على جهازك' });
  } catch (error) {
    console.error('[نظامي] فشل التصدير', error);
    showToast({ type: 'error', title: 'فشل التصدير', message: error.message });
  }
}

function openImportBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      pendingImport = payload;
      openModal({
        title: 'استيراد نسخة احتياطية',
        subtitle: file.name,
        size: 'sm',
        content: `
          <div class="confirm-text">
            تمت قراءة الملف بنجاح. اختر طريقة الاستيراد:
            <br><br>
            <strong>الاستبدال:</strong> يحذف البيانات الحالية ويستورد محتوى الملف فقط.<br>
            <strong>الدمج:</strong> يحتفظ بالبيانات الحالية ويضيف العناصر الجديدة أو يحدّث المتشابهة بالمعرّف.
          </div>
          <div class="confirm-warning" style="margin-top:14px">يُفضل تصدير نسخة احتياطية من بياناتك الحالية قبل الاستيراد.</div>
        `,
        footer: `
          <button class="ghost-btn" data-modal-close>إلغاء</button>
          <div class="spacer"></div>
          <button class="soft-btn" data-action="import-mode" data-mode="merge">${icon('plus', 13)} دمج</button>
          <button class="primary-btn" data-action="import-mode" data-mode="replace">${icon('upload', 13)} استبدال</button>
        `
      });
    } catch (error) {
      console.error('[نظامي] فشل قراءة الملف', error);
      showToast({ type: 'error', title: 'ملف غير صالح', message: error.message });
    }
    input.value = '';
  };
  input.click();
}

async function performImport(mode) {
  if (!pendingImport) return;
  try {
    await DB.importData(pendingImport, { replace: mode === 'replace' });
    pendingImport = null;
    closeAllModals();
    await reloadEverything();
    refreshUI();
    showToast({
      title: 'تم الاستيراد بنجاح',
      message: mode === 'replace' ? 'تم استبدال البيانات بالكامل' : 'تم دمج البيانات مع الموجود'
    });
  } catch (error) {
    console.error('[نظامي] فشل الاستيراد', error);
    showToast({ type: 'error', title: 'فشل الاستيراد', message: error.message });
  }
}

/* ---------------- معالجات الإجراءات ---------------- */
async function handleDelete(type, id) {
  const config = {
    habit: {
      title: 'حذف العادة؟',
      message: 'سيتم حذف العادة وجميع سجلات إنجازها.',
      detail: 'لن يُحذف سجل النشاط الخاص بها، وستبقى العمليات السابقة محفوظة في السجل.',
      name: state.data.habits.find((item) => item.id === id)?.name,
      action: () => deleteHabit(id),
      success: 'تم حذف العادة'
    },
    task: {
      title: 'حذف المهمة؟',
      message: 'سيتم حذف المهمة وخطواتها الفرعية.',
      detail: 'لن يُحذف سجل النشاط، وسيتم فك ربط أي تذكيرات مرتبطة بها.',
      name: state.data.tasks.find((item) => item.id === id)?.title,
      action: () => deleteTask(id),
      success: 'تم حذف المهمة'
    },
    goal: {
      title: 'حذف الهدف؟',
      message: 'سيتم حذف الهدف ومراحله وفك ربط المهام والتذكيرات المرتبطة.',
      detail: 'لن تُحذف المهام نفسها، ولن يُحذف سجل النشاط.',
      name: state.data.goals.find((item) => item.id === id)?.title,
      action: () => deleteGoal(id),
      success: 'تم حذف الهدف'
    },
    sleep: {
      title: 'حذف سجل النوم؟',
      message: 'سيتم حذف هذا السجل وإعادة حساب الإحصاءات.',
      detail: 'لا يمكن التراجع، لكن سجل النشاط سيبقى محفوظًا.',
      name: state.data.sleep.find((item) => item.id === id) ? sleepRecordName(state.data.sleep.find((item) => item.id === id)) : '',
      action: () => deleteSleep(id),
      success: 'تم حذف سجل النوم'
    },
    reminder: {
      title: 'حذف التذكير؟',
      message: 'سيتم حذف التذكير نهائيًا.',
      detail: 'لن يُحذف سجل النشاط الخاص به.',
      name: state.data.reminders.find((item) => item.id === id)?.title,
      action: () => deleteReminder(id),
      success: 'تم حذف التذكير'
    },
    milestone: {
      title: 'حذف المرحلة؟',
      message: 'سيتم حذف هذه المرحلة من الهدف.',
      detail: '',
      name: state.data.milestones.find((item) => item.id === id)?.title,
      action: () => deleteMilestone(id),
      success: 'تم حذف المرحلة'
    }
  }[type];
  if (!config) return;
  const ok = await confirmAction({
    title: config.title,
    message: config.message,
    detail: [config.name ? `العنصر: ${config.name}` : '', config.detail].filter(Boolean).join('\n'),
    confirmText: 'حذف نهائي',
    cancelText: 'إلغاء',
    danger: true
  });
  if (!ok) return;
  closeAllModals();
  try {
    await config.action();
    refreshUI();
    showToast({ title: config.success });
  } catch (error) {
    console.error(error);
    showToast({ type: 'error', title: 'فشل الحذف', message: error.message });
  }
}

function goToSleepChart(days) {
  state.ui.sleepChartDays = days === 30 ? 30 : 7;
  renderCurrentView();
}

function openDayDelete(type, id) {
  handleDelete(type, id);
}

/* ---------------- الأحداث العامة ---------------- */
function bindGlobalEvents() {
  dom.topbarBell?.addEventListener('click', () => navigate('reminders'));
  dom.backdrop?.addEventListener('click', () => setSidebar(false));

  dom.nav.addEventListener('click', (event) => {
    const item = event.target.closest('.nav-item');
    if (item?.dataset.nav) navigate(item.dataset.nav);
  });

  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const id = target.dataset.id;
    const date = target.dataset.date;

    // لا نعالج النقر على زر الإغلاق مرتين
    if (target.hasAttribute('data-modal-close')) return;

    const closeAnd = (fn) => { closeAllModals(); fn(); };
    try {
      switch (action) {
        case 'open-sidebar': setSidebar(true); break;
        case 'close-sidebar': setSidebar(false); break;
        case 'quick-add': openQuickAdd(); break;
        case 'go-view':
          event.preventDefault();
          navigate(target.dataset.view);
          break;
        case 'go-reminders': navigate('reminders'); break;
        case 'export-backup': await exportBackup(); break;
        case 'import-backup': openImportBackup(); break;
        case 'import-mode': await performImport(target.dataset.mode); break;
        case 'reset-all': await handleResetAll(); break;
        case 'request-notifications': {
          const permission = await requestNotificationPermission();
          if (permission === 'granted') {
            showToast({ title: 'تم تفعيل الإشعارات', message: 'سيتم تنبيهك أثناء فتح التطبيق' });
          } else if (permission === 'denied') {
            showToast({ type: 'error', title: 'الإشعارات غير مفعّلة', message: 'يمكنك تفعيلها من إعدادات المتصفح' });
          } else if (permission === 'unsupported') {
            showToast({ type: 'warning', title: 'غير مدعوم', message: 'هذا المتصفح لا يدعم إشعارات النظام' });
          }
          refreshUI();
          break;
        }
        case 'test-notification': {
          const permission = await requestNotificationPermission();
          if (permission === 'granted') {
            showBrowserNotification('نظامي', 'هذا إشعار تجريبي — كل شيء يعمل!', { force: true });
            showToast({ type: 'info', title: 'تم إرسال إشعار تجريبي' });
          } else {
            showToast({ type: 'warning', title: 'لم يتم تفعيل الإشعارات' });
          }
          break;
        }

        case 'open-habit-modal': openHabitModal(); break;
        case 'edit-habit': closeAnd(() => openHabitModal(id)); break;
        case 'habit-detail': closeAnd(() => openHabitDetail(id)); break;
        case 'delete-habit': await handleDelete('habit', id); break;
        case 'toggle-habit':
          await toggleHabitCompletion(id, date || todayISO());
          refreshUI();
          break;
        case 'habit-filter':
          state.ui.habitFilter = target.dataset.filter;
          renderHabits();
          break;

        case 'open-task-modal': openTaskModal(null, { dueDate: date || todayISO() }); break;
        case 'edit-task': closeAnd(() => openTaskModal(id)); break;
        case 'delete-task': await handleDelete('task', id); break;
        case 'toggle-task':
          await toggleTaskCompletion(id);
          refreshUI();
          break;
        case 'task-reminder': {
          const task = state.data.tasks.find((item) => item.id === id);
          if (!task) break;
          openReminderModal(null, {
            linkType: 'task',
            linkId: task.id,
            date: task.dueDate || todayISO(),
            time: task.dueTime || '09:00'
          });
          break;
        }
        case 'task-quick':
          state.ui.taskQuick = target.dataset.filter;
          renderTasks();
          break;
        case 'task-clear-filters':
          state.ui.taskQuick = 'all';
          state.ui.taskStatus = 'all';
          state.ui.taskPriority = 'all';
          state.ui.taskCategory = 'all';
          state.ui.taskQuery = '';
          renderTasks();
          break;
        case 'add-subtask-row': {
          const editor = document.querySelector('[data-subtasks]');
          if (editor) {
            editor.insertAdjacentHTML('beforeend', subtaskRowHtml());
            const rows = editor.querySelectorAll('[data-subtask-row]');
            rows[rows.length - 1]?.querySelector('input[type="text"]')?.focus();
          }
          break;
        }
        case 'remove-subtask-row': {
          const row = target.closest('[data-subtask-row]');
          if (row) row.remove();
          break;
        }

        case 'open-goal-modal': openGoalModal(); break;
        case 'edit-goal': closeAnd(() => openGoalModal(id)); break;
        case 'delete-goal': await handleDelete('goal', id); break;
        case 'goal-detail': closeAnd(() => openGoalDetail(id)); break;
        case 'goal-progress': closeAnd(() => openGoalProgress(id)); break;
        case 'goal-task-add': closeAnd(() => openTaskModal(null, { goalId: id })); break;
        case 'goal-increment': {
          const input = document.getElementById(target.dataset.target || 'progress-value');
          if (input) input.value = Math.max(0, Number(input.value || 0) + Number(target.dataset.step || 0));
          break;
        }
        case 'toggle-milestone':
          await toggleMilestone(id);
          closeAllModals();
          openGoalDetail(target.dataset.goalId || state.data.milestones.find((m) => m.id === id)?.goalId);
          break;
        case 'delete-milestone': {
          const milestone = state.data.milestones.find((m) => m.id === id);
          const goalId = milestone?.goalId;
          await handleDelete('milestone', id);
          if (goalId) { closeAllModals(); openGoalDetail(goalId); }
          break;
        }

        case 'open-sleep-modal': openSleepModal(); break;
        case 'edit-sleep': closeAnd(() => openSleepModal(id)); break;
        case 'delete-sleep': await handleDelete('sleep', id); break;
        case 'sleep-chart': goToSleepChart(Number(target.dataset.days)); break;
        case 'sleep-filter':
          state.ui.sleepFilter = target.dataset.filter;
          renderSleep();
          break;

        case 'open-reminder-modal': openReminderModal(null, { date }); break;
        case 'edit-reminder': closeAnd(() => openReminderModal(id)); break;
        case 'delete-reminder': await handleDelete('reminder', id); break;
        case 'snooze-reminder': openSnooze(id); break;
        case 'do-snooze':
          await snoozeReminder(id, Number(target.dataset.minutes) || 10);
          closeAllModals();
          refreshUI();
          showToast({ title: 'تم تأجيل التذكير', message: `سيعود بعد ${target.dataset.minutes} دقيقة` });
          break;
        case 'complete-reminder':
          await completeReminder(id);
          refreshUI();
          showToast({ title: 'تم إكمال التذكير', message: 'سيظهر الموعد القادم إن كان متكررًا' });
          break;
        case 'pause-reminder':
          await pauseReminder(id);
          refreshUI();
          showToast({ title: 'تم إيقاف التذكير مؤقتًا' });
          break;
        case 'resume-reminder':
          await resumeReminder(id);
          refreshUI();
          showToast({ title: 'تم استئناف التذكير' });
          break;
        case 'reminder-tab':
          state.ui.reminderTab = target.dataset.tab;
          renderReminders();
          break;

        case 'calendar-mode':
          state.ui.calendarMode = target.dataset.mode;
          renderCalendar();
          break;
        case 'calendar-prev': {
          const mode = state.ui.calendarMode;
          state.ui.calendarCursor = mode === 'month'
            ? addMonthsToMonth(state.ui.calendarCursor, -1)
            : addDaysISO(state.ui.calendarCursor, mode === 'week' ? -7 : -1);
          renderCalendar();
          break;
        }
        case 'calendar-next': {
          const mode = state.ui.calendarMode;
          state.ui.calendarCursor = mode === 'month'
            ? addMonthsToMonth(state.ui.calendarCursor, 1)
            : addDaysISO(state.ui.calendarCursor, mode === 'week' ? 7 : 1);
          renderCalendar();
          break;
        }
        case 'calendar-today':
          state.ui.calendarCursor = todayISO();
          renderCalendar();
          break;
        case 'calendar-filter': {
          const filter = target.dataset.filter;
          if (state.ui.calendarFilters.has(filter)) state.ui.calendarFilters.delete(filter);
          else state.ui.calendarFilters.add(filter);
          renderCalendar();
          break;
        }
        case 'calendar-all-filters':
          state.ui.calendarFilters = new Set(['tasks', 'habits', 'reminders', 'sleep']);
          renderCalendar();
          break;
        case 'calendar-day': openDayDetails(date); break;
        case 'calendar-goto-day':
          closeAllModals();
          state.ui.calendarMode = 'day';
          state.ui.calendarCursor = date;
          navigate('calendar');
          break;
        case 'day-add-task':
          closeAllModals();
          openTaskModal(null, { dueDate: date });
          break;
        case 'day-add-reminder':
          closeAllModals();
          openReminderModal(null, { date });
          break;
        case 'day-delete':
          openDayDelete(target.dataset.type, id);
          break;

        case 'activity-detail': openActivityDetail(id); break;
        case 'activity-more':
          state.ui.activityLimit = (state.ui.activityLimit || 80) + 80;
          renderActivity();
          break;
        case 'activity-clear':
          state.ui.activityQuery = '';
          state.ui.activityAction = 'all';
          state.ui.activityEntity = 'all';
          state.ui.activityPeriod = 'all';
          state.ui.activityFrom = '';
          state.ui.activityTo = '';
          state.ui.activityLimit = 80;
          renderActivity();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('[نظامي] خطأ في الإجراء:', action, error);
      showToast({ type: 'error', title: 'حدث خطأ', message: error.message });
    }
  });

  /* -------- تغييرات الحقول -------- */
  document.addEventListener('change', async (event) => {
    const target = event.target;

    if (target.matches('[data-subtask-toggle]')) {
      try {
        await toggleSubtask(target.dataset.taskId, target.dataset.subtaskId);
        renderCurrentView();
      } catch (error) {
        showToast({ type: 'error', title: 'تعذر تحديث الخطوة', message: error.message });
      }
      return;
    }

    if (target.matches('[data-task-status]')) {
      state.ui.taskStatus = target.value;
      renderTasks();
    }
    if (target.matches('[data-task-priority]')) {
      state.ui.taskPriority = target.value;
      renderTasks();
    }
    if (target.matches('[data-task-category]')) {
      state.ui.taskCategory = target.value;
      renderTasks();
    }
    if (target.matches('[data-activity-action]')) {
      state.ui.activityAction = target.value;
      renderActivity();
    }
    if (target.matches('[data-activity-entity]')) {
      state.ui.activityEntity = target.value;
      renderActivity();
    }
    if (target.matches('[data-activity-period]')) {
      state.ui.activityPeriod = target.value;
      state.ui.activityLimit = 80;
      renderActivity();
    }
    if (target.matches('[data-activity-from]')) {
      state.ui.activityFrom = target.value;
      state.ui.activityLimit = 80;
      renderActivity();
    }
    if (target.matches('[data-activity-to]')) {
      state.ui.activityTo = target.value;
      state.ui.activityLimit = 80;
      renderActivity();
    }

    if (target.matches('input[name="repeat"]')) {
      const form = target.closest('form');
      if (form) {
        form.querySelectorAll('[data-repeat-panel]').forEach((panel) => {
          panel.hidden = panel.dataset.repeatPanel !== target.value;
        });
      }
    }
  });

  /* -------- الإدخال المباشر -------- */
  document.addEventListener('input', (event) => {
    const target = event.target;
    if (target.matches('[data-task-search]')) {
      state.ui.taskQuery = target.value;
      debounceRender(() => renderTasks(), 'task-search', target);
    }
    if (target.matches('[data-activity-search]')) {
      state.ui.activityQuery = target.value;
      debounceRender(() => renderActivity(), 'activity-search', target);
    }
    if (target.matches('[data-sleep-field]')) {
      const form = target.closest('form');
      if (!form) return;
      const start = form.querySelector('#sleep-start')?.value;
      const end = form.querySelector('#sleep-end')?.value;
      const preview = form.querySelector('[data-sleep-duration] strong');
      if (preview) preview.textContent = sleepDurationPreview(start, end);
    }
  });

  /* -------- إرسال النماذج -------- */
  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('form[data-form]');
    if (!form) return;
    event.preventDefault();
    if (form.dataset.submitting === '1') return;
    form.dataset.submitting = '1';
    const submitButtons = form.closest('.modal')?.querySelectorAll('button[type="submit"]') || [];
    submitButtons.forEach((btn) => { btn.disabled = true; });
    try {
      await handleFormSubmit(form);
    } catch (error) {
      console.error('[نظامي] خطأ في النموذج', error);
      showToast({ type: 'error', title: 'تعذر الحفظ', message: error.message });
    } finally {
      delete form.dataset.submitting;
      submitButtons.forEach((btn) => { btn.disabled = false; });
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllModals();
      dom.quickRoot.innerHTML = '';
      setSidebar(false);
    }
  });

  // إغلاق القوائم السريعة بالنقر خارجها
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('quick-menu')) {
      dom.quickRoot.innerHTML = '';
    }
  });
}

let searchTimer = null;
function debounceRender(fn, type, input) {
  const value = input.value;
  const selection = input.selectionStart;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    fn();
    const selector = type === 'task-search' ? '[data-task-search]' : '[data-activity-search]';
    const next = document.querySelector(selector);
    if (next) {
      next.focus();
      const pos = Math.min(selection ?? value.length, next.value.length);
      try { next.setSelectionRange(pos, pos); } catch {}
    }
  }, 240);
}

/* ---------------- معالجة النماذج ---------------- */
async function handleFormSubmit(form) {
  const type = form.dataset.form;
  const id = form.dataset.id;
  const fd = new FormData(form);

  if (type === 'habit') {
    const days = fd.getAll('days').map(Number);
    if (!days.length) throw new Error('اختر يومًا واحدًا على الأقل لتنفيذ العادة');
    const input = {
      name: fd.get('name'),
      description: fd.get('description'),
      color: fd.get('color'),
      days,
      weeklyGoal: Number(fd.get('weeklyGoal')) || days.length
    };
    if (id) await updateHabit(id, input);
    else await createHabit(input);
    closeAllModals();
    refreshUI();
    showToast({ title: id ? 'تم تحديث العادة' : 'تمت إضافة العادة', message: 'تُحفظ البيانات تلقائيًا على جهازك' });
    return;
  }

  if (type === 'task') {
    const rows = [...form.querySelectorAll('[data-subtask-row]')];
    const subtasks = rows.map((row) => ({
      id: row.querySelector('[name="subtask_id"]')?.value || '',
      title: row.querySelector('[name="subtask_title"]')?.value || '',
      done: Boolean(row.querySelector('[name="subtask_done"]')?.checked)
    })).filter((subtask) => subtask.title.trim());
    const input = {
      title: fd.get('title'),
      description: fd.get('description'),
      priority: fd.get('priority'),
      status: fd.get('status'),
      category: fd.get('category'),
      dueDate: fd.get('dueDate'),
      dueTime: fd.get('dueTime'),
      goalId: fd.get('goalId'),
      subtasks
    };
    const saved = id ? await updateTask(id, input) : await createTask(input);
    if (fd.get('createReminder') === 'on' && saved.dueDate) {
      const existing = state.data.reminders.find((reminder) => reminder.linkType === 'task' && reminder.linkId === saved.id && reminder.status !== 'completed');
      if (!existing) {
        await createReminder({
          title: saved.title,
          description: 'تذكير مرتبط بالمهمة',
          date: saved.dueDate,
          time: saved.dueTime || '09:00',
          repeat: 'once',
          linkType: 'task',
          linkId: saved.id
        });
      }
    }
    closeAllModals();
    refreshUI();
    showToast({ title: id ? 'تم تحديث المهمة' : 'تمت إضافة المهمة' });
    return;
  }

  if (type === 'goal') {
    const input = {
      title: fd.get('title'),
      description: fd.get('description'),
      startDate: fd.get('startDate'),
      endDate: fd.get('endDate'),
      targetValue: Number(fd.get('targetValue')),
      currentValue: Number(fd.get('currentValue')),
      unit: fd.get('unit'),
      color: fd.get('color'),
      status: fd.get('status')
    };
    if (input.endDate < input.startDate) throw new Error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
    if (id) await updateGoal(id, input);
    else await createGoal(input);
    closeAllModals();
    refreshUI();
    showToast({ title: id ? 'تم تحديث الهدف' : 'تم إنشاء الهدف' });
    return;
  }

  if (type === 'goal-progress') {
    await addGoalProgress(id, Number(fd.get('value')), fd.get('note'));
    closeAllModals();
    refreshUI();
    showToast({ title: 'تم تحديث تقدم الهدف' });
    return;
  }

  if (type === 'milestone') {
    const goalId = form.dataset.goalId;
    await addMilestone(goalId, fd.get('title'));
    closeAllModals();
    openGoalDetail(goalId);
    refreshUI();
    showToast({ title: 'تمت إضافة المرحلة' });
    return;
  }

  if (type === 'sleep') {
    const start = splitDatetimeLocal(fd.get('start'));
    const end = splitDatetimeLocal(fd.get('end'));
    const input = {
      type: fd.get('type') === 'nap' ? 'nap' : 'night',
      startDate: start.date,
      startTime: start.time,
      endDate: end.date,
      endTime: end.time,
      notes: fd.get('notes')
    };
    if (diffWallMinutes(start.date, start.time, end.date, end.time) <= 0) {
      throw new Error('وقت الاستيقاظ يجب أن يكون بعد وقت النوم');
    }
    if (id) await updateSleep(id, input);
    else await createSleep(input);
    closeAllModals();
    refreshUI();
    showToast({ title: id ? 'تم تحديث سجل النوم' : 'تم حفظ سجل النوم' });
    return;
  }

  if (type === 'reminder') {
    const linkValue = fd.get('link') || '';
    const [linkType, linkId] = linkValue ? linkValue.split(':') : ['', ''];
    const repeat = fd.get('repeat');
    const weekdays = fd.getAll('weekdays').map(Number);
    if (repeat === 'weekdays' && !weekdays.length) throw new Error('اختر يومًا واحدًا على الأقل للتذكير');
    const input = {
      title: fd.get('title'),
      description: fd.get('description'),
      date: fd.get('date'),
      time: fd.get('time'),
      repeat,
      weekdays,
      customInterval: Number(fd.get('customInterval')) || 2,
      linkType,
      linkId
    };
    if (id) await updateReminder(id, input);
    else await createReminder(input);
    closeAllModals();
    refreshUI();
    showToast({ title: id ? 'تم تحديث التذكير' : 'تمت إضافة التذكير' });
    return;
  }

  if (type === 'snooze-custom') {
    const minutes = Number(fd.get('minutes'));
    if (!minutes || minutes < 1) throw new Error('أدخل مدة صحيحة');
    await snoozeReminder(id, minutes);
    closeAllModals();
    refreshUI();
    showToast({ title: 'تم تأجيل التذكير', message: `سيعود بعد ${minutes} دقيقة` });
    return;
  }

  if (type === 'sleep-goal' || type === 'settings-sleep-goal') {
    const goal = Number(fd.get('goal'));
    if (!goal || goal < 4 || goal > 14) throw new Error('هدف النوم يجب أن يكون بين 4 و14 ساعة');
    await saveSettings({ sleepGoalHours: goal });
    refreshUI();
    showToast({ title: 'تم حفظ هدف النوم', message: `${goal} ساعات يوميًا` });
    return;
  }

  if (type === 'settings-name') {
    await saveSettings({ userName: String(fd.get('userName') || '').trim() });
    refreshUI();
    showToast({ title: 'تم حفظ الاسم' });
    return;
  }
}

/* ---------------- التهيئة ---------------- */
function hydrateStaticIcons() {
  document.querySelectorAll('[data-icon]').forEach((placeholder) => {
    const name = placeholder.dataset.icon;
    let size = 18;
    if (placeholder.closest('.primary-btn')) size = 16;
    else if (placeholder.closest('.ghost-btn')) size = 15;
    placeholder.innerHTML = icon(name, size);
    placeholder.removeAttribute('data-icon');
  });
}

async function initApp() {
  try {
    hydrateStaticIcons();
    const status = await DB.open();
    state.dbMode = status.mode;
    state.dbError = status.error;
    await loadAllData();
    await migrateLegacyBackupIfNeeded();
    await loadAllData();
    updateStorageUI();

    bindGlobalEvents();
    updateNav();
    updatePageHeader();
    startReminderChecker();

    dom.shell.hidden = false;
    navigate('dashboard');
    setTimeout(() => dom.loading.classList.add('is-done'), 300);

    if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
      const hadController = Boolean(navigator.serviceWorker.controller);
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController || refreshing) return;
        refreshing = true;
        window.location.reload();
      });
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((registration) => {
        registration.update().catch(() => {});
        console.info('[نظامي] Service Worker جاهز');
      }).catch((error) => {
        console.warn('[نظامي] تعذر تسجيل Service Worker', error);
      });
    }
  } catch (error) {
    console.error('[نظامي] فشل تهيئة التطبيق', error);
    dom.loading.innerHTML = `
      <div class="loading-mark">ن</div>
      <div class="loading-title">نظامي</div>
      <p style="color: var(--danger); text-align: center; padding: 0 20px">فشل التحميل: ${escapeHtml(error.message)}</p>
      <button class="soft-btn" onclick="location.reload()">إعادة المحاولة</button>
    `;
  }
}

async function handleResetAll() {
  const ok = await confirmAction({
    title: 'مسح جميع البيانات',
    message: 'سيتم حذف جميع العادات والمهام والأهداف والنوم والتذكيرات وسجل النشاط والإعدادات.',
    detail: 'هذا إجراء نهائي ولا يمكن التراجع عنه. يُفضل تصدير نسخة احتياطية أولاً.',
    confirmText: 'مسح كل شيء',
    cancelText: 'إلغاء',
    danger: true
  });
  if (!ok) return;
  try {
    await resetAllData();
    await reloadEverything();
    closeAllModals();
    refreshUI();
    showToast({ title: 'تم مسح جميع البيانات', message: 'تمت إعادة التطبيق إلى الحالة الأولية' });
  } catch (error) {
    showToast({ type: 'error', title: 'فشل المسح', message: error.message });
  }
}

document.addEventListener('DOMContentLoaded', initApp);
