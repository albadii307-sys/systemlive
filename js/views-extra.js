/* =========================================================
   نظامي — واجهات: التقويم، النوم، التذكيرات، السجل، الإعدادات
   ========================================================= */
'use strict';

/* =========================================================
   التقويم
   ========================================================= */
function calendarRange() {
  const mode = state.ui.calendarMode;
  const cursor = state.ui.calendarCursor || todayISO();
  if (mode === 'week') {
    return { start: startOfWeekISO(cursor), end: endOfWeekISO(cursor) };
  }
  if (mode === 'day') {
    return { start: cursor, end: cursor };
  }
  return {
    start: startOfWeekISO(startOfMonthISO(cursor)),
    end: endOfWeekISO(endOfMonthISO(cursor))
  };
}

function calendarEventsBetween(startDate, endDate) {
  const events = [];
  const filters = state.ui.calendarFilters;

  if (filters.has('tasks')) {
    for (const task of state.data.tasks) {
      if (task.dueDate && task.dueDate >= startDate && task.dueDate <= endDate) {
        events.push({
          key: `task-${task.id}-${task.dueDate}`,
          type: 'task',
          id: task.id,
          date: task.dueDate,
          time: task.dueTime || '',
          title: task.title,
          meta: PRIORITY_LABELS[task.priority] || '',
          done: task.status === 'done',
          status: task.status
        });
      }
    }
  }

  if (filters.has('habits')) {
    for (const log of state.data.habitLogs) {
      if (log.date < startDate || log.date > endDate) continue;
      const habit = state.data.habits.find((h) => h.id === log.habitId);
      if (!habit) continue;
      events.push({
        key: `habit-${habit.id}-${log.date}`,
        type: 'habit',
        id: habit.id,
        date: log.date,
        time: '',
        title: habit.name,
        meta: 'إنجاز عادة',
        done: true,
        color: habit.color
      });
    }
  }

  if (filters.has('reminders')) {
    for (const reminder of state.data.reminders) {
      const occurrences = occurrencesBetween(reminder, startDate, endDate, 150);
      for (const occurrence of occurrences) {
        events.push({
          key: `reminder-${reminder.id}-${occurrence.date}-${occurrence.time}`,
          type: 'reminder',
          id: reminder.id,
          date: occurrence.date,
          time: occurrence.time,
          title: reminder.title,
          meta: REPEAT_LABELS[reminder.repeat] || 'تذكير',
          done: reminder.status === 'completed',
          status: reminder.status
        });
      }
    }
  }

  if (filters.has('prayer') && typeof prayerCalendarEvents === 'function') {
    events.push(...prayerCalendarEvents(startDate, endDate));
  }

  if (filters.has('finance') && typeof financeCalendarEvents === 'function' && !financeIsLocked()) {
    events.push(...financeCalendarEvents(startDate, endDate));
  }

  if (filters.has('sleep')) {
    for (const record of state.data.sleep) {
      if (record.startDate >= startDate && record.startDate <= endDate) {
        events.push({
          key: `sleep-start-${record.id}-${record.startDate}`,
          type: 'sleep',
          id: record.id,
          date: record.startDate,
          time: record.startTime,
          title: record.type === 'nap' ? `قيلولة` : `نوم`,
          meta: `${formatDuration(record.durationMin, 'compact')}${record.notes ? ' · ' + record.notes : ''}`,
          done: false,
          kind: 'start'
        });
      }
      if (record.type !== 'nap' && record.endDate >= startDate && record.endDate <= endDate) {
        events.push({
          key: `sleep-end-${record.id}-${record.endDate}`,
          type: 'sleep',
          id: record.id,
          date: record.endDate,
          time: record.endTime,
          title: 'استيقاظ',
          meta: `مدة النوم ${formatDuration(record.durationMin, 'compact')}`,
          done: false,
          kind: 'end'
        });
      }
    }
  }

  return events;
}

function eventsGroupedByDate(startDate, endDate) {
  const map = new Map();
  for (const event of calendarEventsBetween(startDate, endDate)) {
    if (!map.has(event.date)) map.set(event.date, []);
    map.get(event.date).push(event);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  }
  return map;
}

function calEventChip(event, extraClass = '') {
  return `<span class="cal-event ${event.type} ${event.done ? 'done' : ''} ${extraClass}" title="${escapeAttr(event.title)} · ${escapeAttr(event.meta)}">
    ${event.time ? `<span style="opacity:.7">${formatTimeHM(event.time)}</span>` : ''} ${escapeHtml(event.title)}
  </span>`;
}

function renderCalendar() {
  const mode = state.ui.calendarMode;
  const cursor = state.ui.calendarCursor || todayISO();
  const range = calendarRange();
  const grouped = eventsGroupedByDate(range.start, range.end);
  const filters = state.ui.calendarFilters;
  let periodLabel = '';
  if (mode === 'month') periodLabel = formatMonthYear(cursor);
  if (mode === 'week') periodLabel = `${formatDateShort(range.start)} — ${formatDateShort(range.end)} ${yearOfISO(range.end)}`;
  if (mode === 'day') periodLabel = formatDateMedium(cursor);

  let content = '';
  if (mode === 'month') {
    content = renderCalendarMonth(cursor, grouped);
  } else if (mode === 'week') {
    content = renderCalendarWeek(range, grouped);
  } else {
    content = renderCalendarDay(cursor, grouped);
  }

  const modeLabels = [['month', 'شهري'], ['week', 'أسبوعي'], ['day', 'يومي']];
  const filterLabels = [['tasks', 'المهام'], ['prayer', 'الصلاة'], ['habits', 'العادات'], ['reminders', 'التذكيرات'], ['sleep', 'النوم'], ['finance', 'ماليّاتي']];

  dom.view.innerHTML = `
    <div class="view-fade">
      ${pageHead('تقويمك الشامل', 'أحداثك مرتبطة مباشرة ببياناتك الأصلية — بلا نسخ مكررة', `
        <button class="soft-btn" data-action="open-reminder-modal" data-date="${cursor}">${icon('bell', 14)} تذكير</button>
        <button class="primary-btn" data-action="open-task-modal" data-date="${cursor}">${icon('plus', 15)} مهمة</button>
      `)}

      <div class="calendar-toolbar">
        <div class="row wrap">
          <div class="segmented">
            ${modeLabels.map(([key, label]) => `<button class="${mode === key ? 'active' : ''}" data-action="calendar-mode" data-mode="${key}">${label}</button>`).join('')}
          </div>
          <div class="cal-nav">
            <button class="icon-btn" data-action="calendar-prev" aria-label="السابق">${icon('chevron-right', 16)}</button>
            <span class="cal-period">${periodLabel}</span>
            <button class="icon-btn" data-action="calendar-next" aria-label="التالي">${icon('chevron-left', 16)}</button>
            <button class="ghost-btn small" data-action="calendar-today">${icon('calendar', 13)} اليوم</button>
          </div>
        </div>
        <div class="cal-filters">
          ${filterLabels.map(([key, label]) => `
            <button class="chip-btn ${key} ${filters.has(key) ? 'active' : ''}" data-action="calendar-filter" data-filter="${key}">
              <span class="chip-dot"></span>${label}
            </button>
          `).join('')}
          <button class="ghost-btn small" data-action="calendar-all-filters">${icon('refresh', 12)} الكل</button>
        </div>
      </div>

      ${content}

      <div class="cal-legend">
        <span><i style="background:var(--blue)"></i> مهام</span>
        <span><i style="background:var(--teal)"></i> صلوات</span>
        <span><i style="background:var(--accent)"></i> إنجازات عادات</span>
        <span><i style="background:var(--warning)"></i> تذكيرات</span>
        <span><i style="background:var(--purple)"></i> نوم واستيقاظ</span>
        <span><i style="background:var(--green)"></i> التزامات مالية</span>
        <span class="spacer"></span>
        <span>اضغط على أي يوم لعرض التفاصيل والإضافة</span>
      </div>
    </div>
  `;
}

function renderCalendarMonth(cursor, grouped) {
  const days = getMonthCalendarDays(cursor);
  const currentMonth = monthOfISO(cursor);
  const today = todayISO();
  const header = WEEKDAYS_AR.map((day) => `<span>${day}</span>`).join('');
  const cells = days.map((date) => {
    const events = grouped.get(date) || [];
    const visible = events.slice(0, 3);
    return `
      <div class="cal-day ${monthOfISO(date) !== currentMonth ? 'other-month' : ''} ${date === today ? 'today' : ''}"
           data-action="calendar-day" data-date="${date}" role="button" tabindex="0" aria-label="${formatDateLong(date)}">
        <span class="cal-date">${dayOfMonth(date)}</span>
        <div class="cal-events">
          ${visible.map((event) => calEventChip(event)).join('')}
          ${events.length > 3 ? `<span class="cal-more">+${events.length - 3} أخرى</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
  return `
    <div class="cal-month">
      <div class="cal-weekdays">${header}</div>
      <div class="cal-grid">${cells}</div>
    </div>
  `;
}

function renderCalendarWeek(range, grouped) {
  const today = todayISO();
  const days = getWeekDates(range.start);
  const cols = days.map((date) => {
    const events = grouped.get(date) || [];
    return `
      <div class="cal-week-col">
        <button class="cal-week-head ${date === today ? 'today' : ''}" data-action="calendar-day" data-date="${date}">
          <div class="day-name">${dayName(date)}</div>
          <div class="day-num">${dayOfMonth(date)}</div>
        </button>
        <div class="cal-week-body">
          ${events.length ? events.slice(0, 8).map((event) => `
            <button class="cal-week-event ${event.type} ${event.done ? 'done' : ''}" data-action="calendar-day" data-date="${date}">
              ${event.time ? `<span style="opacity:.7">${formatTimeHM(event.time)} · </span>` : ''}${escapeHtml(event.title)}
            </button>
          `).join('') : `<div class="cal-week-empty">لا أحداث</div>`}
          ${events.length > 8 ? `<div class="cal-week-empty">+${events.length - 8} أخرى</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
  return `<div class="cal-week">${cols}</div>`;
}

function renderCalendarDay(cursor, grouped) {
  const events = grouped.get(cursor) || [];
  const allDay = events.filter((event) => !event.time);
  const timed = events.filter((event) => event.time);
  const hours = Array.from({ length: 24 }, (_, i) => `${pad2(i)}:00`);
  const rows = hours.map((hour) => {
    const hourNum = Number(hour.slice(0, 2));
    const slotEvents = timed.filter((event) => Number((event.time || '00:00').slice(0, 2)) === hourNum);
    return `
      <div class="cal-hour-label">${formatTimeHM(hour)}</div>
      <div class="cal-slot">
        ${slotEvents.map((event) => `
          <button class="cal-slot-event ${event.type} ${event.done ? 'done' : ''}" data-action="calendar-day" data-date="${cursor}">
            ${formatTimeHM(event.time)} · ${escapeHtml(event.title)}
          </button>
        `).join('')}
      </div>
    `;
  }).join('');
  return `
    <div class="card pad mb-2">
      <div class="row wrap" style="justify-content:space-between">
        <div>
          <div class="section-title">${formatDateLong(cursor)}</div>
          <div class="section-sub">${events.length} حدث في هذا اليوم</div>
        </div>
        <div class="row wrap">
          <button class="soft-btn small" data-action="open-reminder-modal" data-date="${cursor}">${icon('bell', 13)} تذكير</button>
          <button class="primary-btn small" data-action="open-task-modal" data-date="${cursor}">${icon('plus', 13)} مهمة</button>
          <button class="ghost-btn small" data-action="calendar-day" data-date="${cursor}">${icon('list-check', 13)} كل التفاصيل</button>
        </div>
      </div>
      ${allDay.length ? `<div class="row wrap mt-2">${allDay.map((event) => `<span class="cal-event ${event.type}">${escapeHtml(event.title)}</span>`).join('')}</div>` : ''}
    </div>
    <div class="cal-day-view">
      <div class="cal-hours">${hours.map((hour) => `<div class="cal-hour-label">${formatTimeHM(hour)}</div>`).join('')}</div>
      <div class="cal-day-slots">${Array.from({ length: 24 }, (_, i) => {
        const hourNum = i;
        const slotEvents = timed.filter((event) => Number((event.time || '00:00').slice(0, 2)) === hourNum);
        return `<div class="cal-slot">${slotEvents.map((event) => `
          <button class="cal-slot-event ${event.type}" data-action="calendar-day" data-date="${cursor}">
            ${formatTimeHM(event.time)} · ${escapeHtml(event.title)}
          </button>
        `).join('')}</div>`;
      }).join('')}</div>
    </div>
  `;
}

/* =========================================================
   النوم
   ========================================================= */
function renderSleep() {
  const today = todayISO();
  const goalMinutes = Math.round((Number(state.settings.sleepGoalHours) || 8) * 60);
  const todayRecords = sleepForDate(today);
  const todayTotal = sum(todayRecords, (r) => r.durationMin);
  const weekStats = sleepStats(7);
  const monthStats = sleepStats(30);
  const latestRecord = sortBy(state.data.sleep, (record) => wallEpoch(record.endDate, record.endTime), 'desc')[0] || null;
  const comparison = todayTotal - goalMinutes;
  const chartDays = state.ui.sleepChartDays;
  const chartSeries = sleepDailySeries(chartDays);
  const maxValue = Math.max(goalMinutes, ...chartSeries.map((day) => day.total), 60);
  const goalPct = (goalMinutes / maxValue) * 100;

  const bars = chartSeries.map((day) => {
    const height = day.total > 0 ? Math.max(3, Math.round((day.total / maxValue) * 100)) : 1;
    const showLabel = chartDays <= 7 || day.date === today || diffDaysISO(day.date, today) % 5 === 0;
    return `
      <div class="chart-bar-col">
        <div class="chart-bar ${day.total >= goalMinutes && day.total > 0 ? 'goal-met' : ''}" style="height:${height}%">
          <span class="bar-tooltip">${formatDateShort(day.date)} · ${formatDuration(day.total, 'compact')}</span>
        </div>
        <span class="chart-label">${showLabel ? formatDateShort(day.date) : ''}</span>
      </div>
    `;
  }).join('');

  const filter = state.ui.sleepFilter || 'all';
  let records = [...state.data.sleep];
  if (filter === 'night') records = records.filter((record) => record.type === 'night');
  if (filter === 'nap') records = records.filter((record) => record.type === 'nap');
  records = sortBy(records, (record) => wallEpoch(record.endDate, record.endTime), 'desc');

  const recordRows = records.slice(0, 50).map((record) => `
    <div class="sleep-record">
      <div class="sleep-record-icon ${record.type === 'nap' ? 'nap' : ''}">${icon(record.type === 'nap' ? 'coffee' : 'moon', 16)}</div>
      <div class="sleep-record-main">
        <div class="sleep-record-title">${record.type === 'nap' ? 'قيلولة' : 'نوم ليلي'} · ${formatDateMedium(record.date)}</div>
        <div class="sleep-record-meta">
          <span>${icon('bed', 11)} ${formatTimeHM(record.startTime)}</span>
          <span>${icon('sunrise', 11)} ${formatTimeHM(record.endTime)}</span>
          ${record.notes ? `<span>${icon('book', 11)} ${escapeHtml(record.notes)}</span>` : ''}
        </div>
      </div>
      <div class="sleep-record-duration">${formatDuration(record.durationMin, 'compact')}</div>
      <div class="sleep-record-actions">
        <button class="icon-btn" data-action="edit-sleep" data-id="${record.id}" title="تعديل">${icon('edit', 14)}</button>
        <button class="icon-btn danger" data-action="delete-sleep" data-id="${record.id}" title="حذف">${icon('trash', 14)}</button>
      </div>
    </div>
  `).join('');

  const comparisonText = todayRecords.length
    ? comparison >= 0
      ? `أفضل من الهدف بـ ${formatDuration(comparison, 'compact')}`
      : `أقل من الهدف بـ ${formatDuration(Math.abs(comparison), 'compact')}`
    : 'لا يوجد سجل لليوم حتى الآن';

  dom.view.innerHTML = `
    <div class="view-fade">
      ${pageHead('راحتك تبدأ من هنا', 'تتبع النوم الليلي والقيلولات بدقة تامة', `
        <button class="primary-btn" data-action="open-sleep-modal">${icon('plus', 15)} تسجيل نوم</button>
      `)}
      <div class="stat-grid">
        ${statCard({ label: 'نوم اليوم', value: todayTotal ? formatHours(todayTotal) : '—', unit: todayTotal ? 'ساعة' : '', iconName: 'moon', tone: 'purple', meta: comparisonText })}
        ${statCard({ label: 'متوسط الأسبوع', value: weekStats.avg ? formatHours(weekStats.avg) : '—', unit: weekStats.avg ? 'ساعة' : '', iconName: 'chart', meta: `${weekStats.withData.length} ليال مسجلة خلال 7 أيام` })}
        ${statCard({ label: 'متوسط الشهر', value: monthStats.avg ? formatHours(monthStats.avg) : '—', unit: monthStats.avg ? 'ساعة' : '', iconName: 'trending', tone: 'blue', meta: `${monthStats.withData.length} ليال مسجلة خلال 30 يومًا` })}
        ${statCard({ label: 'أفضل يوم نوم', value: monthStats.best ? formatDuration(monthStats.best.total, 'compact') : '—', iconName: 'award', tone: 'warning', meta: monthStats.best ? formatDateMedium(monthStats.best.date) : 'لا توجد بيانات' })}
      </div>

      <div class="sleep-layout">
        <div class="stack">
          <div class="card chart-panel">
            <div class="chart-head">
              <div>
                <div class="card-title">${icon('chart', 16)} ساعات النوم</div>
                <div class="section-sub">${chartDays === 7 ? 'آخر 7 أيام' : 'آخر 30 يومًا'} · هدفك ${state.settings.sleepGoalHours} ساعات</div>
              </div>
              <div class="segmented">
                <button class="${chartDays === 7 ? 'active' : ''}" data-action="sleep-chart" data-days="7">7 أيام</button>
                <button class="${chartDays === 30 ? 'active' : ''}" data-action="sleep-chart" data-days="30">30 يومًا</button>
              </div>
            </div>
            <div class="chart-wrap">
              <div class="goal-line" style="bottom:${goalPct}%"><span>الهدف ${state.settings.sleepGoalHours}س</span></div>
              ${bars}
            </div>
            <div class="chart-labels">
              ${chartSeries.map((day) => `<span class="chart-label">${chartDays <= 7 || day.date === today || diffDaysISO(day.date, today) % 5 === 0 ? formatDateShort(day.date) : ''}</span>`).join('')}
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <h3 class="card-title"><span class="icon-wrap" style="color:var(--purple)">${icon('bed', 17)}</span> سجلات النوم</h3>
              <div class="tabs">
                ${[['all', 'الكل'], ['night', 'ليلي'], ['nap', 'قيلولة']].map(([key, label]) => `<button class="${filter === key ? 'active' : ''}" data-action="sleep-filter" data-filter="${key}">${label}</button>`).join('')}
              </div>
            </div>
            <div class="card-body">
              ${records.length ? `<div class="sleep-records">${recordRows}</div>${records.length > 50 ? `<p class="text-muted small-text text-center mt-2">يتم عرض أحدث 50 سجلًا</p>` : ''}` : emptyState('moon', 'لا توجد سجلات نوم', 'أضف أول سجل ليبدأ التطبيق بحساب إحصاءاتك.', `<button class="soft-btn small" data-action="open-sleep-modal">${icon('plus', 14)} تسجيل نوم</button>`)}
            </div>
          </div>
        </div>

        <div class="stack">
          <div class="card pad">
            <div class="card-title mb-2">${icon('target', 16)} هدف النوم اليومي</div>
            <div class="row" style="justify-content:space-between;align-items:flex-end">
              <div class="sleep-stat-value">${state.settings.sleepGoalHours}<small> ساعة</small></div>
              <span class="pill ${todayTotal >= goalMinutes ? 'green' : 'warning'}">${todayRecords.length ? (todayTotal >= goalMinutes ? 'على المسار' : 'يحتاج تحسينًا') : 'بدون بيانات'}</span>
            </div>
            <div class="progress purple mt-2"><span style="width:${clamp(Math.round((todayTotal / Math.max(1, goalMinutes)) * 100), 0, 100)}%"></span></div>
            <form data-form="sleep-goal" class="row mt-3" style="gap:7px">
              <input type="number" min="4" max="14" step="0.5" name="goal" value="${state.settings.sleepGoalHours}" aria-label="هدف النوم بالساعات" style="width:110px">
              <button class="soft-btn small" type="submit">${icon('check', 12)} حفظ الهدف</button>
            </form>
            <p class="text-muted small-text mt-2">الهدف يُستخدم في المقارنة والرسم البياني ولوحة الإنجاز.</p>
          </div>

          <div class="card pad">
            <div class="card-title mb-2">${icon('sparkles', 16)} قراءة سريعة</div>
            <div class="sleep-insight">
              <div class="insight-box">
                <div class="insight-label">${icon('clock', 11)} انتظام مواعيد النوم</div>
                <div class="insight-value">${monthStats.consistency.score}%</div>
                <div class="small-text text-muted">${monthStats.consistency.count >= 2 ? `اختلاف ±${monthStats.consistency.variation} دقيقة` : 'تحتاج ليلتين على الأقل'}</div>
              </div>
              <div class="insight-box">
                <div class="insight-label">${icon('bed', 11)} متوسط وقت النوم</div>
                <div class="insight-value">${monthStats.consistency.avgBedTime ? formatTimeHM(monthStats.consistency.avgBedTime) : '—'}</div>
                <div class="small-text text-muted">خلال آخر 14 يومًا</div>
              </div>
              <div class="insight-box">
                <div class="insight-label">${icon('coffee', 11)} القيلولات</div>
                <div class="insight-value">${state.data.sleep.filter((r) => r.type === 'nap').length}</div>
                <div class="small-text text-muted">إجمالي السجلات</div>
              </div>
              <div class="insight-box">
                <div class="insight-label">${icon('sunrise', 11)} آخر استيقاظ</div>
                <div class="insight-value">${latestRecord ? formatTimeHM(latestRecord.endTime) : '—'}</div>
                <div class="small-text text-muted">${latestRecord ? formatDateMedium(latestRecord.date) : 'لا يوجد سجل'}</div>
              </div>
            </div>
          </div>

          <div class="banner">
            <span class="banner-icon">${icon('info', 16)}</span>
            <div>
              <strong>كيف نحسب النوم؟</strong>
              <p>تُحسب المدة من وقت النوم حتى الاستيقاظ، مع دعم النوم الذي يعبر منتصف الليل. القيلولات تُسجل منفصلة وتُضاف إلى إجمالي اليوم.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* =========================================================
   التذكيرات
   ========================================================= */
function notificationPermissionState() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function renderReminders() {
  const tab = state.ui.reminderTab || 'upcoming';
  const now = Date.now();
  const upcoming = upcomingReminders(now);
  const past = pastReminders(now);
  const paused = state.data.reminders
    .filter((reminder) => reminder.status === 'paused')
    .map((reminder) => ({ reminder, info: nextReminderInfo(reminder, now) }));
  const permission = notificationPermissionState();
  const activeCount = state.data.reminders.filter((r) => r.status === 'active').length;
  const pausedCount = paused.length;

  const permissionBanner = permission === 'granted'
    ? `<div class="banner"><span class="banner-icon" style="color:var(--accent)">${icon('check-circle', 16)}</span><div><strong>الإشعارات مفعّلة</strong><p>ستظهر التنبيهات أثناء فتح التطبيق. الإشعارات بعد إغلاق المتصفح تتطلب خادم Web Push — راجع ملاحظة الحدود أدناه.</p></div><div class="banner-actions"><button class="ghost-btn small" data-action="test-notification">${icon('bell', 12)} تجربة</button></div></div>`
    : permission === 'denied'
      ? `<div class="banner danger"><span class="banner-icon">${icon('alert', 16)}</span><div><strong>الإشعارات محظورة في المتصفح</strong><p>يمكنك إعادة تفعيلها من إعدادات الموقع في المتصفح. التذكيرات ستظل ظاهرة داخل التطبيق.</p></div></div>`
      : permission === 'unsupported'
        ? `<div class="banner warning"><span class="banner-icon">${icon('info', 16)}</span><div><strong>هذا المتصفح لا يدعم إشعارات النظام</strong><p>ستظهر التذكيرات داخل التطبيق فقط.</p></div></div>`
        : `<div class="banner warning"><span class="banner-icon">${icon('bell', 16)}</span><div><strong>فعّل إشعارات المتصفح</strong><p>للسماح للتطبيق بتنبیهك في الوقت المحدد. سنطلب الإذن مرة واحدة فقط.</p></div><div class="banner-actions"><button class="primary-btn small" data-action="request-notifications">${icon('bell', 13)} تفعيل الإشعارات</button></div></div>`;

  const upcomingRows = upcoming.map(({ reminder, info }) => reminderCard(reminder, info, false)).join('');
  const pastRows = past.map(({ reminder, info }) => reminderCard(reminder, info, true)).join('');
  const pausedRows = paused.map(({ reminder, info }) => reminderCard(reminder, info, false)).join('');

  dom.view.innerHTML = `
    <div class="view-fade">
      ${pageHead('تذكيراتك', `${activeCount} نشط · ${pausedCount} موقوف · ${upcoming.length} موعد قادم`, `
        <button class="primary-btn" data-action="open-reminder-modal">${icon('plus', 15)} تذكير جديد</button>
      `)}
      ${permissionBanner}

      <div class="stat-grid">
        ${statCard({ label: 'تذكيرات نشطة', value: activeCount, iconName: 'bell', tone: 'warning', meta: 'تعمل في الخلفية أثناء فتح التطبيق' })}
        ${statCard({ label: 'المواعيد القادمة', value: upcoming.length, iconName: 'clock', tone: 'blue', meta: upcoming[0] ? `التالي ${relativeDateLabel(upcoming[0].info.date)} · ${formatTimeHM(upcoming[0].info.time)}` : 'لا مواعيد قادمة' })}
        ${statCard({ label: 'موقوفة مؤقتًا', value: pausedCount, iconName: 'pause', meta: 'يمكنك استئنافها متى شئت' })}
        ${statCard({ label: 'تذكيرات مكتملة', value: state.data.reminders.filter((r) => r.status === 'completed').length, iconName: 'check-circle', tone: 'purple', meta: 'من إجمالي تذكيراتك' })}
      </div>

      <div class="tabs mb-2">
        <button class="${tab === 'upcoming' ? 'active' : ''}" data-action="reminder-tab" data-tab="upcoming">القادمة (${upcoming.length})</button>
        <button class="${tab === 'past' ? 'active' : ''}" data-action="reminder-tab" data-tab="past">السابقة (${past.length})</button>
        <button class="${tab === 'paused' ? 'active' : ''}" data-action="reminder-tab" data-tab="paused">الموقوفة (${paused.length})</button>
      </div>

      ${tab === 'upcoming'
        ? (upcoming.length ? `<div class="reminder-list">${upcomingRows}</div>` : emptyState('bell', 'لا تذكيرات قادمة', 'أضف تذكيرًا وحدد موعده وتكراره، وسنُذكّرك به.', `<button class="primary-btn" data-action="open-reminder-modal">${icon('plus', 15)} إضافة تذكير</button>`))
        : tab === 'paused'
          ? (paused.length ? `<div class="reminder-list">${pausedRows}</div>` : emptyState('pause', 'لا تذكيرات موقوفة', 'عند إيقاف تذكير مؤقتًا سيظهر هنا مع زر الاستئناف.'))
          : (past.length ? `<div class="reminder-list">${pastRows}</div>` : emptyState('history', 'لا تذكيرات سابقة', 'ستظهر هنا المواعيد التي مرت أو تم إكمالها.'))}

      <div class="banner mt-3">
        <span class="banner-icon">${icon('info', 16)}</span>
        <div>
          <strong>حدود الإشعارات في النسخة المحلية</strong>
          <p>التنبيهات الحالية تعمل عبر Web Notifications أثناء فتح التطبيق أو التبويب (مع فحص كل 30 ثانية). لا يمكنها العمل بعد إغلاق المتصفح بالكامل. بنية الدعم المستقبلي لـ Web Push عبر خادم وService Worker جاهزة مبدئيًا في ملف <code>sw.js</code>، لكنها تحتاج خادمًا حقيقيًا ومفاتيح VAPID لتشغيلها.</p>
        </div>
      </div>
    </div>
  `;
}

function reminderCard(reminder, info, isPast) {
  const linkedLabel = reminder.linkType ? entityLabel(reminder.linkType, reminder.linkId) : '';
  const linkedIcon = entityIcon(reminder.linkType);
  const statusPillHtml = reminder.status === 'paused'
    ? '<span class="pill warning">موقوف</span>'
    : reminder.status === 'completed'
      ? '<span class="pill green">مكتمل</span>'
      : '<span class="pill green">نشط</span>';
  const showSnooze = reminder.status !== 'completed' && !isPast;
  return `
    <div class="reminder-card ${reminder.status === 'paused' ? 'paused' : ''} ${reminder.status === 'completed' ? 'completed' : ''}">
      <div class="reminder-icon ${reminder.status === 'paused' ? 'paused' : reminder.status === 'completed' ? 'completed' : ''}">${icon(reminder.status === 'paused' ? 'pause' : reminder.status === 'completed' ? 'check' : 'bell', 17)}</div>
      <div class="reminder-main">
        <div class="task-title-row">
          <span class="reminder-title">${escapeHtml(reminder.title)}</span>
          ${statusPillHtml}
          ${info?.snoozed ? '<span class="pill warning">مؤجل</span>' : ''}
        </div>
        ${reminder.description ? `<div class="reminder-desc">${escapeHtml(reminder.description)}</div>` : ''}
        <div class="reminder-meta">
          <span class="meta-item">${icon('repeat', 11)} ${reminder.repeat === 'weekdays' ? `أيام: ${(reminder.weekdays || []).map((d) => WEEKDAYS_SHORT[d]).join('، ') || 'غير محدد'}` : reminder.repeat === 'custom' ? `كل ${reminder.customInterval} أيام` : REPEAT_LABELS[reminder.repeat]}</span>
          ${linkedLabel ? `<span class="meta-item">${icon(linkedIcon, 11)} ${escapeHtml(linkedLabel)}</span>` : ''}
          ${info ? `<span class="meta-item">${icon('calendar', 11)} ${relativeDateLabel(info.date)} · ${formatTimeHM(info.time)}</span>` : ''}
          ${info && typeof prayerConflictChip === 'function' ? prayerConflictChip(info.date, info.time) : ''}
        </div>
      </div>
      <div class="next-time-box">
        <div class="next-time-label">${isPast ? 'آخر موعد' : info?.snoozed ? 'مؤجل إلى' : 'الموعد القادم'}</div>
        <div class="next-time-value ${!isPast && info && info.epoch - Date.now() < 3600000 ? 'soon' : ''}">
          ${info ? `${relativeDateLabel(info.date)} · ${formatTimeHM(info.time)}` : '—'}
        </div>
      </div>
      <div class="reminder-side">
        ${showSnooze ? `<button class="icon-btn" data-action="snooze-reminder" data-id="${reminder.id}" title="تأجيل">${icon('alarm', 15)}</button>` : ''}
        ${reminder.status !== 'completed' ? `<button class="icon-btn" data-action="complete-reminder" data-id="${reminder.id}" title="إكمال">${icon('check', 15)}</button>` : ''}
        ${reminder.status === 'paused'
          ? `<button class="icon-btn" data-action="resume-reminder" data-id="${reminder.id}" title="استئناف">${icon('play', 15)}</button>`
          : reminder.status !== 'completed' ? `<button class="icon-btn" data-action="pause-reminder" data-id="${reminder.id}" title="إيقاف مؤقت">${icon('pause', 15)}</button>` : ''}
        <button class="icon-btn" data-action="edit-reminder" data-id="${reminder.id}" title="تعديل">${icon('edit', 15)}</button>
        <button class="icon-btn danger" data-action="delete-reminder" data-id="${reminder.id}" title="حذف">${icon('trash', 15)}</button>
      </div>
    </div>
  `;
}

/* =========================================================
   سجل النشاط
   ========================================================= */
function filteredActivity() {
  const query = (state.ui.activityQuery || '').trim().toLowerCase();
  const action = state.ui.activityAction;
  const entity = state.ui.activityEntity;
  const period = state.ui.activityPeriod;
  const today = todayISO();
  const startOfMonth = startOfMonthISO(today);

  return state.data.activity.filter((log) => {
    if (action !== 'all' && log.action !== action) return false;
    if (entity !== 'all' && log.entityType !== entity) return false;
    if (query) {
      const haystack = `${log.entityName} ${log.entityType} ${log.action} ${log.entityId} ${ACTION_LABELS[log.action] || ''} ${ENTITY_LABELS[log.entityType] || ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    const logDate = tsToDateISO(log.timestamp);
    if (period === 'today' && logDate !== today) return false;
    if (period === 'week' && logDate < startOfWeekISO(today)) return false;
    if (period === 'month' && logDate < startOfMonth) return false;
    if (period === 'custom') {
      if (state.ui.activityFrom && logDate < state.ui.activityFrom) return false;
      if (state.ui.activityTo && logDate > state.ui.activityTo) return false;
    }
    return true;
  });
}

function renderActivity() {
  const all = filteredActivity();
  const limit = state.ui.activityLimit || 80;
  const logs = all.slice(0, limit);
  const periodOptions = [['all', 'كل الفترات'], ['today', 'اليوم'], ['week', 'هذا الأسبوع'], ['month', 'هذا الشهر'], ['custom', 'فترة مخصصة']];

  const items = logs.map((log) => `
    <div class="tl-item">
      <div class="tl-dot ${log.action}">${icon(ACTION_LABELS[log.action] === 'حذف' ? 'trash' : log.action === 'complete' ? 'check' : log.action === 'snooze' ? 'alarm' : log.action === 'progress' ? 'trending' : log.action === 'create' ? 'plus' : 'edit', 10)}</div>
      <div class="tl-card">
        <div class="tl-head">
          <div class="tl-title">${ACTION_LABELS[log.action] || log.action} <strong>${escapeHtml(log.entityName)}</strong></div>
          <span class="tl-time">${formatTimestamp(log.timestamp)} · ${timeAgo(log.timestamp)}</span>
        </div>
        <div class="tl-sub">
          <span class="pill ${ACTIVITY_COLORS[log.action] || 'muted'}">${ACTION_LABELS[log.action] || log.action}</span>
          <span class="pill muted">${ENTITY_LABELS[log.entityType] || log.entityType}</span>
          <span style="color:var(--muted-2)">المعرف: <code style="direction:ltr;display:inline-block">${escapeHtml(log.entityId)}</code></span>
          ${log.details && log.details.removedLogs ? `<span>سجلات محذوفة: ${log.details.removedLogs}</span>` : ''}
        </div>
        <div class="tl-actions">
          <button class="ghost-btn small" data-action="activity-detail" data-id="${log.id}">${icon('eye', 12)} عرض التفاصيل</button>
        </div>
      </div>
    </div>
  `).join('');

  dom.view.innerHTML = `
    <div class="view-fade">
      ${pageHead('سجل نشاطك', `${state.data.activity.length} عملية محفوظة — يبقى التاريخ حتى بعد حذف العناصر`, `
        <button class="ghost-btn" data-action="export-backup">${icon('download', 14)} تصدير</button>
      `)}

      <div class="banner">
        <span class="banner-icon">${icon('database', 16)}</span>
        <div>
          <strong>سجل دائم</strong>
          <p>عند حذف مهمة أو عادة أو هدف، لا يُحذف سجل النشاط المرتبط بها. يمكنك دائمًا معرفة ماذا حدث ومتى.</p>
        </div>
      </div>

      <div class="activity-filters">
        <div class="search-box">
          ${icon('search', 15)}
          <input type="search" placeholder="ابحث باسم العنصر أو المعرف..." value="${escapeAttr(state.ui.activityQuery || '')}" data-activity-search>
        </div>
        <select data-activity-action>
          <option value="all">كل العمليات</option>
          ${Object.entries(ACTION_LABELS).map(([key, label]) => `<option value="${key}" ${state.ui.activityAction === key ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
        <select data-activity-entity>
          <option value="all">كل العناصر</option>
          ${Object.entries(ENTITY_LABELS).map(([key, label]) => `<option value="${key}" ${state.ui.activityEntity === key ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
        <select data-activity-period>
          ${periodOptions.map(([key, label]) => `<option value="${key}" ${state.ui.activityPeriod === key ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
        ${state.ui.activityPeriod === 'custom' ? `
          <input type="date" value="${escapeAttr(state.ui.activityFrom)}" data-activity-from aria-label="من تاريخ">
          <input type="date" value="${escapeAttr(state.ui.activityTo)}" data-activity-to aria-label="إلى تاريخ">
        ` : ''}
        <button class="ghost-btn small" data-action="activity-clear">${icon('refresh', 12)} إعادة تعيين</button>
        <span class="spacer"></span>
        <span class="pill muted">${all.length} نتيجة</span>
      </div>

      ${logs.length ? `
        <div class="timeline">${items}</div>
        ${all.length > limit ? `<div class="text-center mt-2"><button class="soft-btn" data-action="activity-more">${icon('chevron-down', 14)} عرض المزيد (${all.length - limit})</button></div>` : ''}
      ` : emptyState('history', state.data.activity.length ? 'لا نتائج مطابقة' : 'سجل النشاط فارغ', state.data.activity.length ? 'جرّب تغيير الفلاتر أو البحث بكلمات أخرى.' : 'ستظهر هنا جميع عمليات الإضافة والتعديل والحذف والإكمال تلقائيًا.', state.data.activity.length ? `<button class="soft-btn" data-action="activity-clear">${icon('refresh', 14)} إعادة تعيين الفلاتر</button>` : '')}
    </div>
  `;
}

/* =========================================================
   الإعدادات
   ========================================================= */
function renderSettings() {
  const permission = notificationPermissionState();
  const dbEstimate = state.dbMode === 'fallback' ? 'تخزين بديل محلي' : 'IndexedDB';
  const swReady = 'serviceWorker' in navigator
    ? (navigator.serviceWorker.controller ? 'يعمل ويسيطر على الصفحة' : 'مسجل عند الفتح عبر http/https')
    : 'غير مدعوم';
  const counts = {
    habits: state.data.habits.length,
    tasks: state.data.tasks.length,
    goals: state.data.goals.length,
    sleep: state.data.sleep.length,
    reminders: state.data.reminders.length,
    prayerLogs: (state.data.prayerLogs || []).length,
    activity: state.data.activity.length
  };

  dom.view.innerHTML = `
    <div class="view-fade">
      ${pageHead('إعدادات نظامي', 'كل الإعدادات تُحفظ على جهازك مباشرة', `
        <button class="soft-btn" data-action="export-backup">${icon('download', 14)} نسخة احتياطية</button>
        <button class="primary-btn" data-action="import-backup">${icon('upload', 14)} استيراد</button>
      `)}

      <div class="settings-grid">
        <div class="stack">
          <section class="card settings-section">
            <h3>${icon('sparkles', 17)} الملف الشخصي</h3>
            <p>يظهر اسمك في رسالة الترحيب بالصفحة الرئيسية.</p>
            <form data-form="settings-name">
              <div class="field">
                <label for="settings-name">الاسم</label>
                <input id="settings-name" name="userName" type="text" maxlength="40" placeholder="اكتب اسمك" value="${escapeAttr(state.settings.userName || '')}">
              </div>
              <button class="primary-btn small mt-2" type="submit">${icon('check', 13)} حفظ الاسم</button>
            </form>
          </section>

          <section class="card settings-section">
            <h3>${icon('moon', 17)} النوم</h3>
            <p>هدف النوم اليومي المستخدم في الإحصاءات والتنبيهات.</p>
            <form data-form="settings-sleep-goal" class="row wrap">
              <input type="number" min="4" max="14" step="0.5" name="goal" value="${state.settings.sleepGoalHours}" style="width:120px" aria-label="هدف النوم">
              <span class="text-muted small-text">ساعات يوميًا</span>
              <button class="soft-btn small" type="submit">${icon('check', 13)} حفظ</button>
            </form>
          </section>

          <section class="card settings-section">
            <h3>${icon('bell', 17)} الإشعارات</h3>
            <p>استخدم Web Notifications API لإظهار التذكيرات.</p>
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-title">حالة الإذن</div>
                <div class="setting-desc">${permission === 'granted' ? 'مسموح — ستصلك التنبيهات داخل التطبيق' : permission === 'denied' ? 'محظور — فعّله من إعدادات المتصفح' : permission === 'unsupported' ? 'غير مدعوم في هذا المتصفح' : 'لم يتم طلب الإذن بعد'}</div>
              </div>
              <div class="setting-control">
                ${permission === 'default' ? `<button class="primary-btn small" data-action="request-notifications">${icon('bell', 13)} تفعيل</button>` : permission === 'granted' ? `<button class="ghost-btn small" data-action="test-notification">${icon('bell', 13)} تجربة</button>` : ''}
              </div>
            </div>
            <div class="banner mt-2">
              <span class="banner-icon">${icon('info', 15)}</span>
              <div>
                <strong>ملاحظة مهمة</strong>
                <p>هذه النسخة محلية بالكامل. التنبيهات تعمل أثناء فتح التطبيق فقط. الإشعارات بعد إغلاق المتصفح تحتاج Web Push عبر خادم وService Worker، وقد تجهّز هيكلها الأساسي في <code>sw.js</code> دون تفعيل خدمة مدفوعة.</p>
              </div>
            </div>
          </section>
        </div>

        <div class="stack">
          <section class="card settings-section">
            <h3>${icon('database', 17)} البيانات والتخزين</h3>
            <p>حفظ محلي آمن مع دعم التصدير والاستيراد والترحيل.</p>
            <div class="kv"><span>قاعدة البيانات</span><span>${dbEstimate}</span></div>
            <div class="kv"><span>إصدار الهيكل</span><span>v${SCHEMA_VERSION}</span></div>
            <div class="kv"><span>المنطقة الزمنية</span><span>Asia/Muscat (UTC+4)</span></div>
            <div class="kv"><span>Service Worker</span><span>${swReady}</span></div>
            <div class="tag-list mt-2">
              <span class="pill muted">${counts.habits} عادة</span>
              <span class="pill muted">${counts.tasks} مهمة</span>
              <span class="pill muted">${counts.goals} هدف</span>
              <span class="pill muted">${counts.sleep} نوم</span>
              <span class="pill muted">${counts.reminders} تذكير</span>
              <span class="pill muted">${counts.prayerLogs} تسجيل صلاة</span>
              <span class="pill muted">${counts.activity} نشاط</span>
            </div>
            <div class="row wrap mt-3">
              <button class="soft-btn small" data-action="export-backup">${icon('download', 13)} تصدير JSON</button>
              <button class="soft-btn small" data-action="import-backup">${icon('upload', 13)} استيراد JSON</button>
            </div>
            <p class="help mt-2" style="color:var(--muted-2);font-size:10.5px">النسخ الاحتياطي يشمل جميع المخازن: العادات، سجلاتها، المهام، الأهداف، المراحل، النوم، التذكيرات، سجلات الصلاة، سجل النشاط، والإعدادات.</p>
          </section>

          <section class="card settings-section">
            <h3>${icon('mosque', 17)} الصلاة والأذان</h3>
            <p>الموقع وطريقة الحساب والتنبيهات. تعمل المواقيت من إحداثياتك فقط.</p>
            <div class="kv"><span>الموقع</span><span>${getPrayerSettings().location ? escapeHtml(prayerLocationLabel(getPrayerSettings().location)) : 'غير محدد'}</span></div>
            <div class="kv"><span>المنطقة الزمنية</span><span>${escapeHtml(getPrayerSettings().location?.timezone || '—')}</span></div>
            <div class="kv"><span>طريقة الحساب</span><span>${escapeHtml(prayerMethodInfo(getPrayerSettings()).label)}</span></div>
            <div class="kv"><span>سجلات الصلاة</span><span>${counts.prayerLogs}</span></div>
            <div class="row wrap mt-3">
              <button class="soft-btn small" data-action="prayer-open-location">${icon('map-pin', 13)} الموقع</button>
              <button class="soft-btn small" data-action="prayer-open-settings">${icon('sliders', 13)} طريقة الحساب</button>
              <button class="ghost-btn small" data-action="prayer-open-adhan">${icon('volume', 13)} الأذان</button>
            </div>
            <p class="help mt-2">الأذان والتنبيهات تعمل أثناء فتح التطبيق فقط. لا يُشغّل الأذان بعد إغلاق المتصفح بالكامل في هذه النسخة المحلية.</p>
          </section>

          <section class="card settings-section">
            <h3>${icon('zap', 17)} التطبيق</h3>
            <p>معلومات النظام وإمكانيات المستقبل.</p>
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-title">تثبيت التطبيق (PWA)</div>
                <div class="setting-desc">عند فتحه عبر خادم محلي أو استضافة HTTPS يمكن تثبيته كتطبيق مستقل. من ملف مباشر لا يعمل التثبيت.</div>
              </div>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-title">مدير الخدمة</div>
                <div class="setting-desc">جاهز للتحويل إلى Web Push عند إضافة خادم ومفاتيح VAPID.</div>
              </div>
              <span class="pill ${navigator.serviceWorker && navigator.serviceWorker.controller ? 'green' : 'muted'}">${navigator.serviceWorker && navigator.serviceWorker.controller ? 'نشط' : 'استعداد'}</span>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-title">المزامنة السحابية</div>
                <div class="setting-desc">البنية جاهزة لإضافة مزود مزامنة لاحقًا دون تغيير واجهات البيانات.</div>
              </div>
              <span class="pill muted">غير مفعلة</span>
            </div>
          </section>

          <section class="card settings-section danger-zone">
            <h3>${icon('alert', 17)} منطقة الخطر</h3>
            <p>إجراءات لا يمكن التراجع عنها. صدّر نسخة احتياطية قبل المتابعة.</p>
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-title">مسح جميع البيانات</div>
                <div class="setting-desc">حذف كل العادات والمهام والأهداف والنوم والتذكيرات وسجل النشاط.</div>
              </div>
              <button class="danger-btn small" data-action="reset-all">${icon('trash', 13)} مسح</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  `;
}
