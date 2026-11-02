/* =========================================================
   نظامي — واجهات: الرئيسية، العادات، المهام، الأهداف
   ========================================================= */
'use strict';

/* ---------------- عناصر مشتركة ---------------- */
function pageHead(headline, subline, actions = '') {
  return `
    <div class="page-header">
      <div>
        <h2>${headline}</h2>
        <p>${subline}</p>
      </div>
      <div class="page-actions">${actions}</div>
    </div>
  `;
}

function statCard({ label, value, unit = '', meta = '', iconName = 'chart', tone = '' }) {
  return `
    <div class="stat-card ${tone}">
      <div class="stat-top">
        <span class="stat-label">${label}</span>
        <span class="stat-icon ${tone}">${icon(iconName, 15)}</span>
      </div>
      <div class="stat-value">${value}${unit ? `<small>${unit}</small>` : ''}</div>
      ${meta ? `<div class="stat-meta">${meta}</div>` : ''}
    </div>
  `;
}

function emptyState(iconName, title, text, actionHtml = '') {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon(iconName, 23)}</div>
      <h4>${title}</h4>
      <p>${text}</p>
      ${actionHtml}
    </div>
  `;
}

function priorityPill(priority) {
  const cls = priority === 'urgent' ? 'danger' : priority === 'high' ? 'orange' : priority === 'medium' ? 'warning' : 'blue';
  return `<span class="pill ${cls}">${PRIORITY_LABELS[priority] || 'متوسطة'}</span>`;
}

function statusPill(status) {
  const cls = status === 'done' ? 'green' : status === 'progress' ? 'blue' : status === 'postponed' ? 'warning' : 'muted';
  return `<span class="pill ${cls}">${TASK_STATUS_LABELS[status] || 'جديدة'}</span>`;
}

function goalForId(id) {
  return state.data.goals.find((goal) => goal.id === id) || null;
}

function entityLabel(type, id) {
  if (!type || !id) return '';
  if (type === 'task') return state.data.tasks.find((t) => t.id === id)?.title || 'مهمة محذوفة';
  if (type === 'habit') return state.data.habits.find((h) => h.id === id)?.name || 'عادة محذوفة';
  if (type === 'goal') return state.data.goals.find((g) => g.id === id)?.title || 'هدف محذوف';
  return '';
}

function entityIcon(type) {
  if (type === 'task') return 'list-check';
  if (type === 'habit') return 'check-circle';
  if (type === 'goal') return 'target';
  if (type === 'sleep') return 'moon';
  if (type === 'reminder') return 'bell';
  if (type === 'milestone') return 'flag';
  if (type === 'adhan_audio') return 'volume';
  return 'circle';
}

function priorityBar(priority) {
  return `<div class="priority-bar ${priority}" title="${PRIORITY_LABELS[priority] || ''}"></div>`;
}

function reminderActionLabel(reminder) {
  return `${REPEAT_LABELS[reminder.repeat] || 'مرة واحدة'}`;
}

/* =========================================================
   الرئيسية
   ========================================================= */
function renderDashboard() {
  const today = todayISO();
  const overview = dayCompletion(today);
  const habits = todayHabits();
  const tasks = sortBy(todayTasks(), (task) => (task.status === 'done' ? 1 : 0));
  const overdue = state.data.tasks.filter(isTaskOverdue);
  const upcoming = upcomingReminders().slice(0, 4);
  const goals = activeGoals();
  const latestSleep = sortBy(state.data.sleep, (record) => wallEpoch(record.endDate, record.endTime), 'desc')[0] || null;
  const week = weekActivitySeries(7);
  const weekHabitTotal = sum(week, (d) => d.habits);
  const weekTaskTotal = sum(week, (d) => d.tasks);
  const sleepWeek = sleepStats(7);
  const activity = state.data.activity.slice(0, 5);
  const name = state.settings.userName ? escapeHtml(state.settings.userName) : 'صديقي';
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - overview.rate / 100);

  const habitRows = habits.slice(0, 5).map(({ habit, done }) => `
    <div class="today-item ${done ? 'completed' : ''}">
      <button class="check-btn ${done ? 'done' : ''}" data-action="toggle-habit" data-id="${habit.id}" data-date="${today}" title="${done ? 'إلغاء الإنجاز' : 'تسجيل الإنجاز'}">
        ${done ? icon('check', 13) : ''}
      </button>
      <div class="today-item-main">
        <div class="today-item-title">${escapeHtml(habit.name)}</div>
        <div class="today-item-meta">
          <span class="habit-dot" style="background:${habit.color}"></span>
          <span>${habitStreak(habit)} يوم استمرارية</span>
        </div>
      </div>
      <div class="today-item-side">${habitWeekProgress(habit).completed}/${habitWeekProgress(habit).goal}</div>
    </div>
  `).join('');

  const taskRows = tasks.slice(0, 5).map((task) => `
    <div class="today-item ${task.status === 'done' ? 'completed' : ''}">
      <button class="check-btn ${task.status === 'done' ? 'done' : ''}" data-action="toggle-task" data-id="${task.id}" title="${task.status === 'done' ? 'إعادة فتح المهمة' : 'إكمال المهمة'}">
        ${task.status === 'done' ? icon('check', 13) : ''}
      </button>
      <div class="today-item-main">
        <div class="today-item-title">${escapeHtml(task.title)}</div>
        <div class="today-item-meta">
          ${priorityPill(task.priority)}
          ${task.dueTime ? `<span>${formatTimeHM(task.dueTime)}</span>` : ''}
          ${task.dueDate && task.dueTime && typeof prayerConflictChip === 'function' ? prayerConflictChip(task.dueDate, task.dueTime) : ''}
          ${isTaskOverdue(task) ? '<span class="text-danger">متأخرة</span>' : ''}
        </div>
      </div>
      <div class="today-item-side">${task.category ? escapeHtml(task.category) : ''}</div>
    </div>
  `).join('');

  const reminderRows = upcoming.map(({ reminder, info }) => `
    <div class="today-item">
      <div class="reminder-icon" style="width:30px;height:30px;border-radius:9px">${icon('bell', 14)}</div>
      <div class="today-item-main">
        <div class="today-item-title">${escapeHtml(reminder.title)}</div>
        <div class="today-item-meta">
          <span>${relativeDateLabel(info.date)} · ${formatTimeHM(info.time)}</span>
          ${info.snoozed ? '<span class="pill warning">مؤجل</span>' : ''}
        </div>
      </div>
      <button class="icon-btn" data-action="complete-reminder" data-id="${reminder.id}" title="إكمال">${icon('check', 14)}</button>
    </div>
  `).join('');

  const goalRows = goals.slice(0, 3).map((goal) => {
    const pct = goalPercent(goal);
    return `
      <div style="padding:9px 0;border-bottom:1px solid var(--border)">
        <div class="row" style="gap:8px">
          <span style="color:${goal.color}">${icon('target', 15)}</span>
          <span style="font-size:12px;font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(goal.title)}</span>
          <span style="font-size:11px;color:var(--muted)">${pct}%</span>
        </div>
        <div class="progress purple" style="margin-top:6px"><span style="width:${pct}%"></span></div>
      </div>
    `;
  }).join('');

  const activityRows = activity.slice(0, 5).map((log) => `
    <div class="mini-activity-item">
      <span class="activity-dot ${ACTIVITY_COLORS[log.action] || ''}"></span>
      <div class="mini-activity-body">
        <div class="mini-activity-text"><strong>${ACTION_LABELS[log.action] || log.action}</strong> · ${escapeHtml(log.entityName || '')}</div>
        <div class="mini-activity-time">${timeAgo(log.timestamp)}</div>
      </div>
    </div>
  `).join('');

  const weekBars = week.map((day) => {
    const max = Math.max(1, ...week.map((d) => d.total));
    const height = day.total === 0 ? 3 : Math.max(5, Math.round((day.total / max) * 100));
    return `
      <div class="week-bar-col ${day.date === today ? 'today' : ''}" title="${formatDateLong(day.date)} — ${day.total} إنجاز">
        <div class="week-bar-track"><div class="week-bar-fill" style="height:${height}%"></div></div>
        <span class="week-bar-label">${WEEKDAYS_SHORT[dayOfWeek(day.date)]}</span>
      </div>
    `;
  }).join('');

  const sleepLine = latestSleep ? `
    <div class="row" style="align-items:flex-start">
      <div class="reminder-icon" style="background:var(--purple-soft);color:var(--purple)">${icon(latestSleep.type === 'nap' ? 'coffee' : 'moon', 17)}</div>
      <div style="flex:1">
        <div class="sleep-stat-value" style="font-size:24px">${formatDuration(latestSleep.durationMin, 'compact')}</div>
        <div class="text-muted small-text">${formatWallRange(latestSleep.startDate, latestSleep.startTime, latestSleep.endDate, latestSleep.endTime)}</div>
      </div>
      <span class="pill ${latestSleep.durationMin >= (state.settings.sleepGoalHours * 60) ? 'green' : 'warning'}">${latestSleep.durationMin >= state.settings.sleepGoalHours * 60 ? 'أفضل من الهدف' : 'أقل من الهدف'}</span>
    </div>
    <div class="progress purple mt-3"><span style="width:${clamp(Math.round((latestSleep.durationMin / Math.max(1, state.settings.sleepGoalHours * 60)) * 100), 0, 100)}%"></span></div>
    <div class="row" style="justify-content:space-between;margin-top:6px">
      <span class="small-text text-muted">هدف النوم ${state.settings.sleepGoalHours} ساعات</span>
      <a href="#" class="card-link" data-action="go-view" data-view="sleep">تفاصيل النوم ${icon('arrow-left', 12)}</a>
    </div>
  ` : emptyState('moon', 'لا يوجد سجل نوم', 'سجّل نومك لتحصل على إحصاءات دقيقة', `<button class="soft-btn small" data-action="open-sleep-modal">${icon('plus', 14)} تسجيل النوم</button>`);

  dom.view.innerHTML = `
    <div class="view-fade">
      <section class="hero">
        <div class="hero-content">
          <div class="hero-kicker"><span class="dot"></span> ${greeting()}، ${name}</div>
          <h2>${greetingMessage()}<br><span>${formatDateLong(today)}</span></h2>
          <p>${overview.total ? `لديك ${overview.total} عنصرًا مطلوبًا اليوم، أنجزت منها ${overview.done}. كل خطوة صغيرة تُحدث فرقًا.` : 'يومك خالٍ من الالتزامات المسجلة. أضف عادة أو مهمة لتبدأ بناء نظامك.'}</p>
          <div class="hero-actions">
            <button class="primary-btn" data-action="open-task-modal">${icon('plus', 15)} مهمة جديدة</button>
            <button class="soft-btn" data-action="open-habit-modal">${icon('check-circle', 15)} عادة جديدة</button>
            <button class="ghost-btn" data-action="quick-add">${icon('sparkles', 15)} إضافة أخرى</button>
          </div>
        </div>
        <div class="hero-ring">
          <div class="ring">
            <svg viewBox="0 0 128 128">
              <defs>
                <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#35e0b5"/>
                  <stop offset="100%" stop-color="#6c8cff"/>
                </linearGradient>
              </defs>
              <circle class="ring-track" cx="64" cy="64" r="${radius}"/>
              <circle class="ring-fill" cx="64" cy="64" r="${radius}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
            </svg>
            <div class="ring-label">
              <strong>${overview.rate}%</strong>
              <span>إنجاز اليوم</span>
            </div>
          </div>
          <div class="ring-caption">${overview.done} من ${overview.total || 0}</div>
        </div>
      </section>

      <div class="stat-grid">
        ${statCard({ label: 'عادات اليوم', value: `${overview.doneHabits}/${overview.habits}`, iconName: 'check-circle', tone: '', meta: overview.habits ? `أنجزت ${overview.doneHabits} من ${overview.habits}` : 'لا توجد عادات مجدولة اليوم' })}
        ${statCard({ label: 'مهام اليوم', value: `${overview.doneTasks}/${overview.tasks}`, iconName: 'list-check', tone: 'blue', meta: overdue.length ? `<span class="text-danger">${overdue.length} مهمة متأخرة</span>` : 'لا مهام متأخرة' })}
        ${statCard({ label: 'تذكيرات قادمة', value: upcomingReminders().length, iconName: 'bell', tone: 'warning', meta: upcoming[0] ? `التالي: ${relativeDateLabel(upcoming[0].info.date)} · ${formatTimeHM(upcoming[0].info.time)}` : 'لا تذكيرات قادمة' })}
        ${statCard({ label: 'آخر نوم', value: latestSleep ? formatHours(latestSleep.durationMin) : '—', unit: latestSleep ? 'ساعة' : '', iconName: 'moon', tone: 'purple', meta: latestSleep ? `${latestSleep.type === 'nap' ? 'قيلولة' : 'نوم'} · ${formatDateShort(latestSleep.date)}` : 'لم تسجّل نومًا بعد' })}
      </div>

      <div class="dash-grid">
        <div class="stack">
          ${typeof prayerDashboardCard === 'function' ? prayerDashboardCard() : ''}
          ${typeof financeDashboardCard === 'function' ? financeDashboardCard() : ''}

          <div class="card">
            <div class="card-head">
              <h3 class="card-title"><span class="icon-wrap">${icon('check-circle', 17)}</span> عادات اليوم</h3>
              <button class="card-link" data-action="go-view" data-view="habits">عرض الكل ${icon('arrow-left', 12)}</button>
            </div>
            <div class="card-body">
              ${habits.length ? `<div class="today-list">${habitRows}</div>` : emptyState('check-circle', 'لا توجد عادات اليوم', 'أضف عادة وحدد أيام تنفيذها', `<button class="soft-btn small" data-action="open-habit-modal">${icon('plus', 14)} إضافة عادة</button>`)}
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <h3 class="card-title"><span class="icon-wrap" style="color:var(--blue)">${icon('list-check', 17)}</span> مهام اليوم</h3>
              <button class="card-link" data-action="go-view" data-view="tasks">عرض الكل ${icon('arrow-left', 12)}</button>
            </div>
            <div class="card-body">
              ${tasks.length ? `<div class="today-list">${taskRows}</div>` : emptyState('list-check', 'لا توجد مهام لهذا اليوم', 'ابدأ بإضافة مهمة أو حدد موعدًا لمهامك القادمة', `<button class="soft-btn small" data-action="open-task-modal">${icon('plus', 14)} إضافة مهمة</button>`)}
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <h3 class="card-title"><span class="icon-wrap" style="color:var(--purple)">${icon('chart', 17)}</span> إحصائيات الأسبوع</h3>
              <span class="pill muted">آخر 7 أيام</span>
            </div>
            <div class="card-body">
              <div class="week-bars">${weekBars}</div>
              <div class="row" style="justify-content:space-between;margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
                <div class="row" style="gap:16px">
                  <div><span class="tiny-label text-muted" style="font-size:10px">عادات</span><div style="font-weight:600;color:var(--accent)">${weekHabitTotal}</div></div>
                  <div><span class="text-muted" style="font-size:10px">مهام</span><div style="font-weight:600;color:var(--blue)">${weekTaskTotal}</div></div>
                  <div><span class="text-muted" style="font-size:10px">متوسط النوم</span><div style="font-weight:600;color:var(--purple)">${formatDuration(Math.round(sleepWeek.avg), 'compact')}</div></div>
                </div>
                <button class="card-link" data-action="go-view" data-view="activity">سجل النشاط ${icon('arrow-left', 12)}</button>
              </div>
            </div>
          </div>
        </div>

        <div class="stack">
          <div class="card">
            <div class="card-head">
              <h3 class="card-title"><span class="icon-wrap" style="color:var(--warning)">${icon('bell', 17)}</span> التذكيرات القادمة</h3>
              <button class="card-link" data-action="go-view" data-view="reminders">الكل ${icon('arrow-left', 12)}</button>
            </div>
            <div class="card-body">
              ${upcoming.length ? `<div class="today-list">${reminderRows}</div>` : emptyState('bell', 'لا تذكيرات قادمة', 'أضف تذكيرًا لتبقى على المسار', `<button class="soft-btn small" data-action="open-reminder-modal">${icon('plus', 14)} إضافة تذكير</button>`)}
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <h3 class="card-title"><span class="icon-wrap" style="color:var(--purple)">${icon('moon', 17)}</span> ملخص النوم</h3>
              <button class="card-link" data-action="go-view" data-view="sleep">التفاصيل ${icon('arrow-left', 12)}</button>
            </div>
            <div class="card-body">${sleepLine}</div>
          </div>

          <div class="card">
            <div class="card-head">
              <h3 class="card-title"><span class="icon-wrap" style="color:var(--purple)">${icon('target', 17)}</span> الأهداف الحالية</h3>
              <button class="card-link" data-action="go-view" data-view="goals">الكل ${icon('arrow-left', 12)}</button>
            </div>
            <div class="card-body">
              ${goals.length ? `<div>${goalRows}</div>` : emptyState('target', 'لا أهداف نشطة', 'حدد هدفًا وقسّم تقدمك إلى خطوات', `<button class="soft-btn small" data-action="open-goal-modal">${icon('plus', 14)} إضافة هدف</button>`)}
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <h3 class="card-title"><span class="icon-wrap" style="color:var(--blue)">${icon('history', 17)}</span> آخر الأنشطة</h3>
              <button class="card-link" data-action="go-view" data-view="activity">السجل الكامل ${icon('arrow-left', 12)}</button>
            </div>
            <div class="card-body">
              ${activity.length ? `<div class="mini-activity">${activityRows}</div>` : `<p class="text-muted small-text">ستظهر هنا آخر العمليات التي تقوم بها.</p>`}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function greetingMessage() {
  const hour = Number(nowWallParts().time.split(':')[0]);
  if (hour < 5) return 'لنصنع يومًا هادئًا ومثمرًا';
  if (hour < 12) return 'صباح مليء بالإنجاز';
  if (hour < 17) return 'واصل تقدمك بثبات';
  if (hour < 20) return 'مساء الخير، أنجز ما تبقى';
  return 'أنهِ يومك بهدوء';
}

/* =========================================================
   العادات
   ========================================================= */
function renderHabits() {
  const today = todayISO();
  const filter = state.ui.habitFilter || 'all';
  let habits = [...state.data.habits];
  if (filter === 'today') habits = habits.filter((habit) => isHabitScheduledOn(habit, today));
  if (filter === 'pending') habits = habits.filter((habit) => isHabitScheduledOn(habit, today) && !habitLog(habit.id, today));
  if (filter === 'done') habits = habits.filter((habit) => Boolean(habitLog(habit.id, today)));

  const dueToday = state.data.habits.filter((habit) => isHabitScheduledOn(habit, today));
  const doneToday = dueToday.filter((habit) => habitLog(habit.id, today));
  const commitments = state.data.habits.map((habit) => habitCommitment(habit).rate);
  const avgCommitment = state.data.habits.length ? Math.round(average(commitments)) : 0;
  const bestStreak = state.data.habits.length ? Math.max(...state.data.habits.map(habitStreak)) : 0;

  const weekdays = WEEKDAYS_SHORT;
  const cards = habits.map((habit) => {
    const week = getWeekDates(today);
    const streak = habitStreak(habit);
    const commitment = habitCommitment(habit);
    const weekProgress = habitWeekProgress(habit);
    const dayButtons = week.map((date) => {
      const scheduled = isHabitScheduledOn(habit, date);
      const done = Boolean(habitLog(habit.id, date));
      const isToday = date === today;
      return `
        <div class="week-day">
          <span class="week-day-label">${weekdays[dayOfWeek(date)]}</span>
          <button class="day-dot ${scheduled ? 'scheduled' : 'off'} ${done ? 'done' : ''} ${isToday ? 'today' : ''}"
            data-action="toggle-habit" data-id="${habit.id}" data-date="${date}"
            title="${done ? 'إلغاء إنجاز' : 'تسجيل إنجاز'} ${formatDateMedium(date)}"
            ${scheduled ? '' : 'aria-disabled="true"'}>
            ${done ? icon('check', 12) : (scheduled ? icon('circle', 10) : icon('minus', 10))}
          </button>
        </div>
      `;
    }).join('');
    return `
      <div class="card habit-card" style="--habit-color:${habit.color}">
        <div class="habit-top">
          <div class="habit-icon">${icon('sparkles', 19)}</div>
          <div class="habit-title-wrap">
            <div class="habit-title">${escapeHtml(habit.name)}</div>
            <div class="habit-desc">${habit.description ? escapeHtml(habit.description) : 'عادة يومية'}</div>
          </div>
          <div class="habit-actions">
            <button class="icon-btn" data-action="habit-detail" data-id="${habit.id}" title="الإحصائيات">${icon('chart', 15)}</button>
            <button class="icon-btn" data-action="edit-habit" data-id="${habit.id}" title="تعديل">${icon('edit', 15)}</button>
            <button class="icon-btn danger" data-action="delete-habit" data-id="${habit.id}" title="حذف">${icon('trash', 15)}</button>
          </div>
        </div>
        <div class="habit-metrics">
          <div class="metric"><span class="flame">${icon('flame', 13)}</span><strong>${streak}</strong> استمرارية</div>
          <div class="metric"><span>${icon('chart', 12)}</span><strong>${commitment.rate}%</strong> التزام</div>
          <div class="metric"><span>${icon('check-circle', 12)}</span><strong>${weekProgress.completed}/${weekProgress.goal}</strong> هذا الأسبوع</div>
        </div>
        <div class="week-row">${dayButtons}</div>
        <div class="habit-foot">
          <span class="habit-goal">أيام التنفيذ: <strong>${formatHabitDays(habit.days)}</strong></span>
          <button class="card-link" data-action="habit-detail" data-id="${habit.id}">التفاصيل ${icon('arrow-left', 11)}</button>
        </div>
      </div>
    `;
  }).join('');

  dom.view.innerHTML = `
    <div class="view-fade">
      ${pageHead('عاداتك اليومية', `${state.data.habits.length} عادة · ${doneToday.length} من ${dueToday.length} مكتملة اليوم`, `
        <button class="primary-btn" data-action="open-habit-modal">${icon('plus', 15)} عادة جديدة</button>
      `)}
      <div class="stat-grid">
        ${statCard({ label: 'إنجاز اليوم', value: `${percent(doneToday.length, dueToday.length)}%`, iconName: 'check-circle', meta: `${doneToday.length} من ${dueToday.length} عادة` })}
        ${statCard({ label: 'متوسط الالتزام', value: `${avgCommitment}%`, iconName: 'chart', tone: 'blue', meta: 'خلال آخر 30 يومًا' })}
        ${statCard({ label: 'أطول استمرارية', value: bestStreak, unit: 'يوم', iconName: 'flame', tone: 'warning', meta: 'أفضل سلسلة حالية' })}
        ${statCard({ label: 'إجمالي الإنجازات', value: state.data.habitLogs.length, iconName: 'award', tone: 'purple', meta: 'إنجاز مسجل' })}
      </div>

      <div class="tabs tab-scroll mb-2">
        ${[['all', 'الكل'], ['today', 'اليوم'], ['pending', 'غير مكتملة'], ['done', 'مكتملة اليوم']].map(([key, label]) => `
          <button class="${filter === key ? 'active' : ''}" data-action="habit-filter" data-filter="${key}">${label}</button>
        `).join('')}
      </div>

      ${habits.length ? `<div class="habit-grid">${cards}</div>` : emptyState('check-circle', filter === 'all' ? 'ابدأ بعادتك الأولى' : 'لا توجد عادات مطابقة', filter === 'all' ? 'اختر عادة صغيرة وسهلة التكرار، وحدد أيام التنفيذ وهدفك الأسبوعي.' : 'جرّب تغيير التصفية أو أضف عادة جديدة.', `<button class="primary-btn" data-action="open-habit-modal">${icon('plus', 15)} إضافة عادة</button>`)}
    </div>
  `;
}

function formatHabitDays(days) {
  if (!days || days.length === 0 || days.length === 7) return 'كل يوم';
  return days.map((d) => WEEKDAYS_SHORT[d]).join('، ');
}

/* =========================================================
   المهام
   ========================================================= */
function renderTasks() {
  const today = todayISO();
  const quick = state.ui.taskQuick || 'all';
  const query = (state.ui.taskQuery || '').trim().toLowerCase();
  const categories = [...new Set(state.data.tasks.map((task) => task.category).filter(Boolean))].sort();

  let tasks = [...state.data.tasks];
  if (state.ui.taskStatus !== 'all') tasks = tasks.filter((task) => task.status === state.ui.taskStatus);
  if (state.ui.taskPriority !== 'all') tasks = tasks.filter((task) => task.priority === state.ui.taskPriority);
  if (state.ui.taskCategory !== 'all') tasks = tasks.filter((task) => task.category === state.ui.taskCategory);
  if (quick === 'overdue') tasks = tasks.filter(isTaskOverdue);
  if (quick === 'today') tasks = tasks.filter((task) => task.dueDate === today);
  if (quick === 'upcoming') tasks = tasks.filter((task) => task.dueDate && task.dueDate > today && task.status !== 'done');
  if (quick === 'done') tasks = tasks.filter((task) => task.status === 'done');
  if (quick === 'progress') tasks = tasks.filter((task) => task.status === 'progress');
  if (query) {
    tasks = tasks.filter((task) => `${task.title} ${task.description} ${task.category}`.toLowerCase().includes(query));
  }
  tasks = sortBy(tasks, (task) => {
    const statusRank = task.status === 'done' ? 1 : 0;
    const overdueRank = isTaskOverdue(task) ? 0 : 1;
    return statusRank * 1000 + overdueRank * 100 + (task.dueDate || '9999-12-31');
  });

  const overdue = state.data.tasks.filter(isTaskOverdue);
  const dueToday = state.data.tasks.filter((task) => task.dueDate === today && task.status !== 'done');
  const inProgress = state.data.tasks.filter((task) => task.status === 'progress');
  const weekStart = startOfWeekISO(today);
  const completedWeek = state.data.tasks.filter((task) => task.completedAt && tsToDateISO(task.completedAt) >= weekStart).length;

  const taskCards = tasks.map((task) => {
    const goal = task.goalId ? goalForId(task.goalId) : null;
    const subtasks = task.subtasks || [];
    const doneSubs = subtasks.filter((sub) => sub.done).length;
    const late = isTaskOverdue(task);
    const subtasksHtml = subtasks.length ? `
      <div class="subtasks">
        ${subtasks.map((sub) => `
          <label class="subtask ${sub.done ? 'is-done' : ''}">
            <input type="checkbox" ${sub.done ? 'checked' : ''} data-subtask-toggle="1" data-task-id="${task.id}" data-subtask-id="${sub.id}">
            <span>${escapeHtml(sub.title)}</span>
          </label>
        `).join('')}
        <span class="subtask-count">${doneSubs} من ${subtasks.length} خطوات فرعية</span>
      </div>
    ` : '';
    return `
      <div class="task-card ${task.status === 'done' ? 'done' : ''} ${late ? 'overdue' : ''}">
        ${priorityBar(task.priority)}
        <button class="task-check ${task.status === 'done' ? 'done' : ''}" data-action="toggle-task" data-id="${task.id}" title="${task.status === 'done' ? 'إعادة فتح' : 'إكمال'}">
          ${task.status === 'done' ? icon('check', 13) : ''}
        </button>
        <div class="task-main">
          <div class="task-title-row">
            <span class="task-title">${escapeHtml(task.title)}</span>
            ${priorityPill(task.priority)}
            ${statusPill(task.status)}
            ${late ? '<span class="pill danger">متأخرة</span>' : ''}
            ${task.category ? `<span class="pill muted">${icon('folder', 10)} ${escapeHtml(task.category)}</span>` : ''}
          </div>
          ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
          <div class="task-meta">
            ${task.dueDate ? `<span class="meta-item ${late ? 'late' : ''}">${icon('calendar', 11)} ${relativeDateLabel(task.dueDate)}${task.dueTime ? ` · ${formatTimeHM(task.dueTime)}` : ''}</span>` : '<span class="meta-item">بدون موعد</span>'}
            ${task.dueDate && task.dueTime && typeof prayerConflictChip === 'function' ? prayerConflictChip(task.dueDate, task.dueTime) : ''}
            ${goal ? `<span class="meta-item">${icon('target', 11)} ${escapeHtml(goal.title)}</span>` : ''}
            ${subtasks.length ? `<span class="meta-item">${icon('list-check', 11)} ${doneSubs}/${subtasks.length}</span>` : ''}
            ${task.completedAt ? `<span class="meta-item">${icon('check', 11)} ${formatTimestamp(task.completedAt, { day: 'numeric', month: 'short' })}</span>` : ''}
          </div>
          ${subtasksHtml}
        </div>
        <div class="task-side">
          <button class="icon-btn" data-action="task-reminder" data-id="${task.id}" title="إضافة تذكير">${icon('bell', 15)}</button>
          <button class="icon-btn" data-action="edit-task" data-id="${task.id}" title="تعديل">${icon('edit', 15)}</button>
          <button class="icon-btn danger" data-action="delete-task" data-id="${task.id}" title="حذف">${icon('trash', 15)}</button>
        </div>
      </div>
    `;
  }).join('');

  dom.view.innerHTML = `
    <div class="view-fade">
      ${pageHead('مهامك وأولوياتك', `${state.data.tasks.length} مهمة · ${overdue.length} متأخرة · ${dueToday.length} مستحقة اليوم`, `
        <button class="primary-btn" data-action="open-task-modal">${icon('plus', 15)} مهمة جديدة</button>
      `)}
      <div class="stat-grid">
        ${statCard({ label: 'متأخرة', value: overdue.length, iconName: 'alert', tone: 'warning', meta: overdue.length ? 'تحتاج انتباهك الآن' : 'لا مهام متأخرة' })}
        ${statCard({ label: 'مستحقة اليوم', value: dueToday.length, iconName: 'calendar', tone: 'blue', meta: todayTasks().length ? `${todayTasks().filter((t) => t.status === 'done').length} مكتملة اليوم` : 'لا مهام لهذا اليوم' })}
        ${statCard({ label: 'قيد التنفيذ', value: inProgress.length, iconName: 'clock', tone: '', meta: 'مهام تعمل عليها حاليًا' })}
        ${statCard({ label: 'مكتملة هذا الأسبوع', value: completedWeek, iconName: 'award', tone: 'purple', meta: 'منذ بداية الأسبوع' })}
      </div>

      <div class="tabs tab-scroll mb-2">
        ${[['all', 'الكل'], ['today', 'اليوم'], ['overdue', 'متأخرة'], ['upcoming', 'قادمة'], ['progress', 'قيد التنفيذ'], ['done', 'مكتملة']].map(([key, label]) => `
          <button class="${quick === key ? 'active' : ''}" data-action="task-quick" data-filter="${key}">${label}</button>
        `).join('')}
      </div>

      <div class="filter-bar">
        <div class="search-box">
          ${icon('search', 15)}
          <input type="search" placeholder="ابحث في المهام..." value="${escapeAttr(state.ui.taskQuery || '')}" data-task-search>
        </div>
        <select data-task-status aria-label="تصفية حسب الحالة">
          <option value="all">كل الحالات</option>
          ${Object.entries(TASK_STATUS_LABELS).map(([key, label]) => `<option value="${key}" ${state.ui.taskStatus === key ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
        <select data-task-priority aria-label="تصفية حسب الأولوية">
          <option value="all">كل الأولويات</option>
          ${Object.entries(PRIORITY_LABELS).map(([key, label]) => `<option value="${key}" ${state.ui.taskPriority === key ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
        <select data-task-category aria-label="تصفية حسب التصنيف">
          <option value="all">كل التصنيفات</option>
          ${categories.map((category) => `<option value="${escapeAttr(category)}" ${state.ui.taskCategory === category ? 'selected' : ''}>${escapeHtml(category)}</option>`).join('')}
        </select>
        ${(query || state.ui.taskStatus !== 'all' || state.ui.taskPriority !== 'all' || state.ui.taskCategory !== 'all' || quick !== 'all') ? `<button class="ghost-btn small" data-action="task-clear-filters">${icon('x', 12)} مسح التصفية</button>` : ''}
      </div>

      ${tasks.length ? `<div class="task-list">${taskCards}</div>` : emptyState('list-check', state.data.tasks.length ? 'لا توجد مهام مطابقة' : 'أضف مهمتك الأولى', state.data.tasks.length ? 'جرّب تغيير التصفية أو البحث بكلمات أخرى.' : 'ابدأ بمهمة واحدة واضحة، حدد أولويتها وموعدها.', `<button class="primary-btn" data-action="open-task-modal">${icon('plus', 15)} إضافة مهمة</button>`)}
    </div>
  `;
}

/* =========================================================
   الأهداف
   ========================================================= */
function renderGoals() {
  const goals = sortBy(state.data.goals, (goal) => {
    if (goal.status === 'active') return 0;
    if (goal.status === 'completed') return 1;
    return 2;
  });
  const active = state.data.goals.filter((goal) => goal.status === 'active');
  const completed = state.data.goals.filter((goal) => goal.status === 'completed');
  const avgProgress = goals.length ? Math.round(average(goals, (goal) => goalPercent(goal))) : 0;
  const linkedTasksCount = state.data.tasks.filter((task) => task.goalId).length;

  const cards = goals.map((goal) => {
    const pct = goalPercent(goal);
    const milestones = state.data.milestones.filter((ms) => ms.goalId === goal.id);
    const doneMilestones = milestones.filter((ms) => ms.done).length;
    const linkedTasks = tasksForGoal(goal.id);
    const doneTasks = linkedTasks.filter((task) => task.status === 'done').length;
    const daysLeft = diffDaysISO(todayISO(), goal.endDate);
    return `
      <div class="card goal-card" style="--goal-color:${goal.color}">
        <div class="goal-top">
          <div class="goal-icon">${icon('target', 19)}</div>
          <div style="min-width:0;flex:1">
            <div class="goal-title">${escapeHtml(goal.title)}</div>
            <div class="goal-desc">${goal.description ? escapeHtml(goal.description) : 'هدف بدون وصف'}</div>
          </div>
          <div class="goal-actions">
            <button class="icon-btn" data-action="goal-detail" data-id="${goal.id}" title="التفاصيل">${icon('eye', 15)}</button>
            <button class="icon-btn" data-action="edit-goal" data-id="${goal.id}" title="تعديل">${icon('edit', 15)}</button>
            <button class="icon-btn danger" data-action="delete-goal" data-id="${goal.id}" title="حذف">${icon('trash', 15)}</button>
          </div>
        </div>
        <div class="goal-progress-row">
          <div class="goal-percent">${pct}<small>%</small></div>
          <div class="goal-values"><strong>${goal.currentValue}${goal.unit ? ` ${escapeHtml(goal.unit)}` : ''}</strong> من ${goal.targetValue}${goal.unit ? ` ${escapeHtml(goal.unit)}` : ''}</div>
        </div>
        <div class="progress ${goal.status === 'completed' ? '' : 'purple'}" style="margin-top:8px"><span style="width:${pct}%"></span></div>
        <div class="goal-meta">
          <span class="pill ${goal.status === 'active' ? 'purple' : goal.status === 'completed' ? 'green' : 'muted'}">${goal.status === 'active' ? 'نشط' : goal.status === 'completed' ? 'مكتمل' : 'مؤرشف'}</span>
          <span>${icon('calendar', 11)} ${formatDateShort(goal.startDate)} — ${formatDateShort(goal.endDate)}</span>
          ${goal.status === 'active' ? `<span class="${daysLeft < 0 ? 'text-danger' : ''}">${daysLeft < 0 ? `تجاوز الموعد ${Math.abs(daysLeft)} يوم` : daysLeft === 0 ? 'ينتهي اليوم' : `متبقي ${daysLeft} يوم`}</span>` : ''}
        </div>
        <div class="goal-foot">
          <div class="row" style="gap:12px">
            <span class="metric">${icon('flag', 12)} ${doneMilestones}/${milestones.length} مراحل</span>
            <span class="metric">${icon('list-check', 12)} ${doneTasks}/${linkedTasks.length} مهام</span>
          </div>
          <button class="soft-btn small" data-action="goal-progress" data-id="${goal.id}">${icon('trending', 13)} تحديث التقدم</button>
        </div>
      </div>
    `;
  }).join('');

  dom.view.innerHTML = `
    <div class="view-fade">
      ${pageHead('أهدافك وخطتك', `${active.length} هدف نشط · ${completed.length} مكتمل`, `
        <button class="primary-btn" data-action="open-goal-modal">${icon('plus', 15)} هدف جديد</button>
      `)}
      <div class="stat-grid">
        ${statCard({ label: 'أهداف نشطة', value: active.length, iconName: 'target', meta: 'تعمل عليها حاليًا' })}
        ${statCard({ label: 'متوسط الإنجاز', value: `${avgProgress}%`, iconName: 'trending', tone: 'purple', meta: 'لكل الأهداف' })}
        ${statCard({ label: 'أهداف مكتملة', value: completed.length, iconName: 'award', tone: 'warning', meta: 'إنجاز يستحق الاحتفال' })}
        ${statCard({ label: 'مهام مرتبطة', value: linkedTasksCount, iconName: 'link', tone: 'blue', meta: 'ضمن أهدافك' })}
      </div>

      ${goals.length ? `<div class="goal-grid">${cards}</div>` : emptyState('target', 'لم تضف أي هدف بعد', 'حدد هدفًا واضحًا وقابلًا للقياس، ثم قسّمه إلى مراحل ومهام.', `<button class="primary-btn" data-action="open-goal-modal">${icon('plus', 15)} إضافة هدف</button>`)}
    </div>
  `;
}
