/* =========================================================
   نظامي — النوافذ والنماذج التفصيلية
   ========================================================= */
'use strict';

/* ---------------- العادات ---------------- */
function openHabitModal(id = null) {
  const habit = id ? state.data.habits.find((item) => item.id === id) : null;
  const selectedDays = habit ? habit.days : [0, 1, 2, 3, 4, 5, 6];
  const color = habit?.color || HABIT_COLORS[0];
  const colorSwatches = HABIT_COLORS.map((item) => `
    <label class="color-swatch" style="background:${item};color:${item};${item === color ? 'border-color:#fff;box-shadow:0 0 0 2px var(--surface), 0 0 0 3.5px #fff' : ''}">
      <input type="radio" name="color" value="${item}" ${item === color ? 'checked' : ''} style="opacity:0;position:absolute;inset:0;cursor:pointer">
    </label>
  `).join('');
  const days = WEEKDAYS_SHORT.map((label, day) => `
    <label class="day-toggle">
      <input type="checkbox" name="days" value="${day}" ${selectedDays.includes(day) ? 'checked' : ''}>
      <span>${label}</span>
    </label>
  `).join('');

  const content = `
    <form id="habit-form" data-form="habit" data-id="${habit?.id || ''}">
      <div class="form-grid">
        <div class="field full">
          <label for="habit-name">اسم العادة <span class="req">*</span></label>
          <input id="habit-name" name="name" type="text" maxlength="80" placeholder="مثال: القراءة 20 دقيقة" value="${escapeAttr(habit?.name || '')}" required>
        </div>
        <div class="field full">
          <label for="habit-description">وصف مختصر</label>
          <input id="habit-description" name="description" type="text" maxlength="160" placeholder="لماذا هذه العادة مهمة؟" value="${escapeAttr(habit?.description || '')}">
        </div>
        <div class="field full">
          <label>اللون</label>
          <div class="color-picker">${colorSwatches}</div>
        </div>
        <div class="field full">
          <label>أيام التنفيذ</label>
          <div class="days-picker">${days}</div>
          <span class="help">اختر الأيام التي تريد تنفيذ العادة فيها. تُحسب الاستمرارية والالتزام بناءً على هذه الأيام.</span>
        </div>
        <div class="field">
          <label for="habit-goal">الهدف الأسبوعي</label>
          <input id="habit-goal" name="weeklyGoal" type="number" min="1" max="7" value="${habit?.weeklyGoal || selectedDays.length || 7}">
          <span class="help">عدد المرات المستهدفة في الأسبوع</span>
        </div>
        <div class="field" style="justify-content:flex-end">
          <div class="form-note">${icon('info', 14)}<span>تعديل العادة لا يحذف سجل إنجازاتها السابق، وتُحفظ جميع السجلات مرتبطة بمعرّف العادة.</span></div>
        </div>
        ${habit ? '' : `
        <div class="field full" style="border-top:1px solid var(--border);padding-top:10px;margin-top:10px">
          <div class="row" style="justify-content:space-between;align-items:center">
            <span class="text-muted small-text">${icon('copy', 13)} قالب:</span>
            <button class="soft-btn small" data-action="tpl-choose-from" data-type="habit">${icon('folder', 13)} اختيار من القوالب</button>
          </div>
          <label class="row" style="cursor:pointer;font-size:12px;margin-top:6px">
            <input type="checkbox" name="saveAsTemplate">
            <span>حفظ هذه العادة كقالب لإعادة الاستخدام لاحقًا</span>
          </label>
        </div>
        `}
      </div>
    </form>
  `;
  openModal({
    title: habit ? 'تعديل العادة' : 'عادة جديدة',
    subtitle: habit ? 'سيتم الحفاظ على سجل الإنجازات السابق' : 'ابدأ صغيرًا، وكن منتظمًا',
    content,
    footer: `
      <button class="ghost-btn" data-modal-close>إلغاء</button>
      <div class="spacer"></div>
      <button class="primary-btn" type="submit" form="habit-form">${icon('check', 15)} ${habit ? 'حفظ التعديلات' : 'إضافة العادة'}</button>
    `
  });
  setTimeout(() => document.getElementById('habit-name')?.focus(), 80);
}

function openHabitDetail(id) {
  const habit = state.data.habits.find((item) => item.id === id);
  if (!habit) { toast({ type: 'error', title: 'العادة غير موجودة' }); return; }
  const streak = habitStreak(habit);
  const commitment = habitCommitment(habit, 30);
  const weekProgress = habitWeekProgress(habit);
  const totalDone = state.data.habitLogs.filter((log) => log.habitId === id).length;

  const start = addDaysISO(startOfWeekISO(todayISO()), -77);
  const cells = Array.from({ length: 84 }, (_, i) => {
    const date = addDaysISO(start, i);
    const done = Boolean(habitLog(id, date));
    const scheduled = isHabitScheduledOn(habit, date);
    return `<div class="heat-cell ${done ? 'done' : ''} ${date === todayISO() ? 'today' : ''}"
      style="${done ? `background:${habit.color}` : ''}${!scheduled && !done ? ';opacity:.25' : ''}"
      title="${formatDateLong(date)} — ${done ? 'مكتملة' : scheduled ? 'غير مكتملة' : 'غير مجدولة'}"></div>`;
  }).join('');

  const recent = sortBy(state.data.habitLogs.filter((log) => log.habitId === id), (log) => log.date, 'desc').slice(0, 12);
  const recentRows = recent.map((log) => `
    <div class="history-item">
      <span class="history-dot" style="background:${habit.color}"></span>
      <span style="flex:1">${formatDateMedium(log.date)}</span>
      <span class="pill green">${icon('check', 10)} مكتملة</span>
    </div>
  `).join('');

  openModal({
    title: habit.name,
    subtitle: habit.description || 'تفاصيل العادة والإنجازات',
    size: 'lg',
    content: `
      <div class="stat-grid" style="grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:16px">
        ${statCard({ label: 'الاستمرارية', value: streak, unit: 'يوم', iconName: 'flame', tone: 'warning' })}
        ${statCard({ label: 'الالتزام', value: `${commitment.rate}%`, iconName: 'chart', meta: 'آخر 30 يومًا' })}
        ${statCard({ label: 'هذا الأسبوع', value: `${weekProgress.completed}/${weekProgress.goal}`, iconName: 'check-circle' })}
        ${statCard({ label: 'إجمالي الإنجاز', value: totalDone, iconName: 'award', tone: 'purple' })}
      </div>
      <div class="row wrap mb-2" style="justify-content:space-between">
        <div>
          <div class="section-title">تقويم الإنجازات</div>
          <div class="section-sub">آخر 12 أسبوعًا</div>
        </div>
        <div class="heat-legend">أقل ${icon('arrow-left', 10)} <span class="heat-cell"></span><span class="heat-cell" style="background:${habit.color}"></span> أكثر</div>
      </div>
      <div class="heatmap">${cells}</div>
      <div class="grid grid-2 mt-3">
        <div class="card pad" style="box-shadow:none;background:rgba(148,163,184,.03)">
          <div class="section-title mb-2">معلومات العادة</div>
          <div class="kv"><span>أيام التنفيذ</span><span>${formatHabitDays(habit.days)}</span></div>
          <div class="kv"><span>الهدف الأسبوعي</span><span>${habit.weeklyGoal} أيام</span></div>
          <div class="kv"><span>تاريخ الإضافة</span><span>${formatDateMedium(tsToDateISO(habit.createdAt))}</span></div>
          <div class="progress mt-2" style="height:7px"><span style="width:${weekProgress.goal ? Math.min(100, Math.round((weekProgress.completed / weekProgress.goal) * 100)) : 0}%;background:${habit.color}"></span></div>
        </div>
        <div class="card pad" style="box-shadow:none;background:rgba(148,163,184,.03)">
          <div class="section-title mb-2">آخر الإنجازات</div>
          ${recentRows || '<p class="text-muted small-text">لا توجد إنجازات مسجلة بعد.</p>'}
        </div>
      </div>
    `,
    footer: `
      <button class="ghost-btn" data-modal-close>إغلاق</button>
      <div class="spacer"></div>
      <button class="soft-btn" data-action="edit-habit" data-id="${habit.id}">${icon('edit', 14)} تعديل</button>
      <button class="danger-btn" data-action="delete-habit" data-id="${habit.id}">${icon('trash', 14)} حذف</button>
    `
  });
}

/* ---------------- المهام ---------------- */
function subtaskRowHtml(subtask = {}) {
  return `
    <div class="subtask-row" data-subtask-row>
      <input type="checkbox" name="subtask_done" ${subtask.done ? 'checked' : ''} title="مكتملة؟" style="width:16px;min-height:16px">
      <input type="hidden" name="subtask_id" value="${escapeAttr(subtask.id || '')}">
      <input type="text" name="subtask_title" maxlength="120" placeholder="عنوان الخطوة الفرعية" value="${escapeAttr(subtask.title || '')}">
      <button type="button" class="icon-btn danger" data-action="remove-subtask-row" title="حذف">${icon('x', 14)}</button>
    </div>
  `;
}

function openTaskModal(id = null, defaults = {}) {
  const task = id ? state.data.tasks.find((item) => item.id === id) : null;
  const data = task || {
    title: '', description: '', priority: 'medium', status: 'new', category: '',
    dueDate: defaults.dueDate || todayISO(), dueTime: defaults.dueTime || '', goalId: defaults.goalId || '', subtasks: []
  };
  const categories = [...new Set(state.data.tasks.map((item) => item.category).filter(Boolean))].sort();
  const goalOptions = state.data.goals.map((goal) => `<option value="${goal.id}" ${data.goalId === goal.id ? 'selected' : ''}>${escapeHtml(goal.title)}</option>`).join('');
  const subtasks = (data.subtasks || []).map(subtaskRowHtml).join('') || subtaskRowHtml();

  const content = `
    <form id="task-form" data-form="task" data-id="${task?.id || ''}">
      <div class="form-grid">
        <div class="field full">
          <label for="task-title">عنوان المهمة <span class="req">*</span></label>
          <input id="task-title" name="title" type="text" maxlength="120" placeholder="ماذا تريد إنجازه؟" value="${escapeAttr(data.title)}" required>
        </div>
        <div class="field full">
          <label for="task-description">الوصف</label>
          <textarea id="task-description" name="description" maxlength="800" placeholder="تفاصيل إضافية...">${escapeHtml(data.description)}</textarea>
        </div>
        <div class="field">
          <label for="task-priority">الأولوية</label>
          <select id="task-priority" name="priority">
            ${Object.entries(PRIORITY_LABELS).map(([key, label]) => `<option value="${key}" ${data.priority === key ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="task-status">الحالة</label>
          <select id="task-status" name="status">
            ${Object.entries(TASK_STATUS_LABELS).map(([key, label]) => `<option value="${key}" ${data.status === key ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="task-due-date">تاريخ الاستحقاق</label>
          <input id="task-due-date" name="dueDate" type="date" value="${escapeAttr(data.dueDate || '')}">
        </div>
        <div class="field">
          <label for="task-due-time">وقت الاستحقاق</label>
          <input id="task-due-time" name="dueTime" type="time" value="${escapeAttr(data.dueTime || '')}">
        </div>
        <div class="field">
          <label for="task-category">التصنيف</label>
          <input id="task-category" name="category" type="text" maxlength="50" list="task-categories" placeholder="عمل، شخصي، صحة..." value="${escapeAttr(data.category)}">
          <datalist id="task-categories">${categories.map((cat) => `<option value="${escapeAttr(cat)}"></option>`).join('')}</datalist>
        </div>
        <div class="field">
          <label for="task-goal">ربط بهدف</label>
          <select id="task-goal" name="goalId">
            <option value="">بدون ربط</option>
            ${goalOptions}
          </select>
        </div>

        <div class="form-section-title">الخطوات الفرعية</div>
        <div class="field full">
          <div class="subtask-editor" data-subtasks>${subtasks}</div>
          <button type="button" class="ghost-btn small mt-2" style="width:fit-content" data-action="add-subtask-row">${icon('plus', 13)} إضافة خطوة</button>
        </div>

        <div class="form-section-title">التذكير</div>
        <div class="field full">
          <label class="row" style="cursor:pointer">
            <input type="checkbox" name="createReminder" ${defaults.createReminder ? 'checked' : ''}>
            <span>إنشاء تذكير مرتبط بهذه المهمة عند الحفظ</span>
          </label>
          <span class="help">سيُفتح تذكير في تاريخ ووقت الاستحقاق، ويمكن تعديله لاحقًا من قسم التذكيرات.</span>
        </div>
        ${task ? '' : `
        <div class="field full" style="border-top:1px solid var(--border);padding-top:10px;margin-top:10px">
          <div class="row" style="justify-content:space-between;align-items:center">
            <span class="text-muted small-text">${icon('copy', 13)} قالب:</span>
            <button class="soft-btn small" data-action="tpl-choose-from" data-type="task">${icon('folder', 13)} اختيار من القوالب</button>
          </div>
          <label class="row" style="cursor:pointer;font-size:12px;margin-top:6px">
            <input type="checkbox" name="saveAsTemplate">
            <span>حفظ هذه المهمة كقالب لإعادة الاستخدام لاحقًا</span>
          </label>
        </div>
        `}
      </div>
    </form>
  `;
  openModal({
    title: task ? 'تعديل المهمة' : 'مهمة جديدة',
    subtitle: task ? 'حدّث التفاصيل دون فقدان أي بيانات' : 'اكتب مهمة واضحة وقابلة للتنفيذ',
    size: 'lg',
    content,
    footer: `
      <button class="ghost-btn" data-modal-close>إلغاء</button>
      <div class="spacer"></div>
      <button class="primary-btn" type="submit" form="task-form">${icon('check', 15)} ${task ? 'حفظ التعديلات' : 'إضافة المهمة'}</button>
    `
  });
  setTimeout(() => document.getElementById('task-title')?.focus(), 80);
}

/* ---------------- الأهداف ---------------- */
function openGoalModal(id = null) {
  const goal = id ? state.data.goals.find((item) => item.id === id) : null;
  const color = goal?.color || GOAL_COLORS[0];
  const colorSwatches = GOAL_COLORS.map((item) => `
    <label class="color-swatch" style="background:${item};color:${item};${item === color ? 'border-color:#fff;box-shadow:0 0 0 2px var(--surface), 0 0 0 3.5px #fff' : ''}">
      <input type="radio" name="color" value="${item}" ${item === color ? 'checked' : ''} style="opacity:0;position:absolute;inset:0;cursor:pointer">
    </label>
  `).join('');
  const content = `
    <form id="goal-form" data-form="goal" data-id="${goal?.id || ''}">
      <div class="form-grid">
        <div class="field full">
          <label for="goal-title">عنوان الهدف <span class="req">*</span></label>
          <input id="goal-title" name="title" type="text" maxlength="120" placeholder="مثال: قراءة 12 كتابًا" value="${escapeAttr(goal?.title || '')}" required>
        </div>
        <div class="field full">
          <label for="goal-description">الوصف</label>
          <textarea id="goal-description" name="description" maxlength="800" placeholder="لماذا هذا الهدف مهم؟ وكيف ستقيس نجاحه؟">${escapeHtml(goal?.description || '')}</textarea>
        </div>
        <div class="field">
          <label for="goal-start">تاريخ البداية</label>
          <input id="goal-start" name="startDate" type="date" value="${escapeAttr(goal?.startDate || todayISO())}">
        </div>
        <div class="field">
          <label for="goal-end">تاريخ النهاية</label>
          <input id="goal-end" name="endDate" type="date" value="${escapeAttr(goal?.endDate || addDaysISO(todayISO(), 30))}">
        </div>
        <div class="field">
          <label for="goal-target">القيمة المستهدفة <span class="req">*</span></label>
          <input id="goal-target" name="targetValue" type="number" min="0.01" step="any" value="${goal?.targetValue ?? 100}" required>
        </div>
        <div class="field">
          <label for="goal-current">القيمة الحالية</label>
          <input id="goal-current" name="currentValue" type="number" min="0" step="any" value="${goal?.currentValue ?? 0}">
        </div>
        <div class="field">
          <label for="goal-unit">الوحدة</label>
          <input id="goal-unit" name="unit" type="text" maxlength="24" placeholder="كتاب، كيلومتر، ساعة..." value="${escapeAttr(goal?.unit || '')}">
        </div>
        <div class="field">
          <label for="goal-status">الحالة</label>
          <select id="goal-status" name="status">
            <option value="active" ${goal?.status === 'active' ? 'selected' : ''}>نشط</option>
            <option value="completed" ${goal?.status === 'completed' ? 'selected' : ''}>مكتمل</option>
            <option value="archived" ${goal?.status === 'archived' ? 'selected' : ''}>مؤرشف</option>
          </select>
        </div>
        <div class="field full">
          <label>اللون</label>
          <div class="color-picker">${colorSwatches}</div>
        </div>
        ${goal ? '' : `
        <div class="field full" style="border-top:1px solid var(--border);padding-top:10px;margin-top:10px">
          <div class="row" style="justify-content:space-between;align-items:center">
            <span class="text-muted small-text">${icon('copy', 13)} قالب:</span>
            <button class="soft-btn small" data-action="tpl-choose-from" data-type="goal">${icon('folder', 13)} اختيار من القوالب</button>
          </div>
          <label class="row" style="cursor:pointer;font-size:12px;margin-top:6px">
            <input type="checkbox" name="saveAsTemplate">
            <span>حفظ هذا الهدف كقالب لإعادة الاستخدام لاحقًا</span>
          </label>
        </div>
        `}
      </div>
    </form>
  `;
  openModal({
    title: goal ? 'تعديل الهدف' : 'هدف جديد',
    subtitle: 'حدد قيمة قابلة للقياس وتاريخًا واقعيًا',
    content,
    footer: `
      <button class="ghost-btn" data-modal-close>إلغاء</button>
      <div class="spacer"></div>
      <button class="primary-btn" type="submit" form="goal-form">${icon('check', 15)} ${goal ? 'حفظ التعديلات' : 'إضافة الهدف'}</button>
    `
  });
  setTimeout(() => document.getElementById('goal-title')?.focus(), 80);
}

function openGoalProgress(id) {
  const goal = state.data.goals.find((item) => item.id === id);
  if (!goal) { toast({ type: 'error', title: 'الهدف غير موجود' }); return; }
  const pct = goalPercent(goal);
  const content = `
    <form id="goal-progress-form" data-form="goal-progress" data-id="${goal.id}">
      <div class="row" style="justify-content:space-between;margin-bottom:8px">
        <span class="text-muted small-text">${goal.currentValue}${goal.unit ? ' ' + escapeHtml(goal.unit) : ''} من ${goal.targetValue}${goal.unit ? ' ' + escapeHtml(goal.unit) : ''}</span>
        <strong>${pct}%</strong>
      </div>
      <div class="progress purple"><span style="width:${pct}%"></span></div>
      <div class="form-grid mt-3">
        <div class="field full">
          <label for="progress-value">القيمة الجديدة</label>
          <input id="progress-value" name="value" type="number" min="0" step="any" value="${goal.currentValue}" required>
          <div class="row wrap mt-1">
            ${[1, 5, 10, 25].map((step) => `<button type="button" class="ghost-btn small" data-action="goal-increment" data-step="${step}" data-target="progress-value">+${step}</button>`).join('')}
          </div>
          <span class="help">عند الوصول للقيمة المستهدفة سيصبح الهدف مكتملًا تلقائيًا.</span>
        </div>
        <div class="field full">
          <label for="progress-note">ملاحظة (اختياري)</label>
          <input id="progress-note" name="note" type="text" maxlength="160" placeholder="ماذا أنجزت اليوم؟">
        </div>
      </div>
      <div class="form-note mt-2">${icon('info', 14)}<span>يُحفظ تاريخ كل تحديث للتقدم مع القيمة والملاحظة في سجل الهدف.</span></div>
    </form>
  `;
  openModal({
    title: `تقدم: ${goal.title}`,
    subtitle: 'حدّث قيمة التقدم الحالية',
    content,
    footer: `
      <button class="ghost-btn" data-modal-close>إلغاء</button>
      <div class="spacer"></div>
      <button class="primary-btn" type="submit" form="goal-progress-form">${icon('check', 15)} حفظ التقدم</button>
    `
  });
  setTimeout(() => document.getElementById('progress-value')?.focus(), 80);
}

function openGoalDetail(id) {
  const goal = state.data.goals.find((item) => item.id === id);
  if (!goal) { toast({ type: 'error', title: 'الهدف غير موجود' }); return; }
  const pct = goalPercent(goal);
  const milestones = sortBy(state.data.milestones.filter((ms) => ms.goalId === id), (ms) => ms.order || 0);
  const tasks = tasksForGoal(id);
  const history = goal.progressHistory || [];
  const historyBars = history.slice(-12).map((item) => {
    const height = goal.targetValue ? Math.max(3, Math.round((Number(item.value) / Number(goal.targetValue)) * 100)) : 3;
    return `<div class="bar" style="height:${clamp(height, 3, 100)}%" title="${escapeAttr(item.value)} — ${formatTimestamp(item.timestamp)}"></div>`;
  }).join('');
  const historyRows = sortBy(history, (item) => item.timestamp, 'desc').slice(0, 12).map((item) => `
    <div class="history-item">
      <span class="history-dot"></span>
      <span style="flex:1;min-width:0">
        <strong style="font-weight:500">${item.value}${goal.unit ? ' ' + escapeHtml(goal.unit) : ''}</strong>
        ${item.note ? `<span class="text-muted"> · ${escapeHtml(item.note)}</span>` : ''}
      </span>
      <span class="text-muted small-text">${formatTimestamp(item.timestamp, { day: 'numeric', month: 'short' })}</span>
    </div>
  `).join('');
  const milestoneRows = milestones.map((ms) => `
    <div class="milestone ${ms.done ? 'done' : ''}">
      <button class="task-check ${ms.done ? 'done' : ''}" data-action="toggle-milestone" data-id="${ms.id}" title="تبديل الإكمال">${ms.done ? icon('check', 12) : ''}</button>
      <span class="milestone-title">${escapeHtml(ms.title)}</span>
      ${ms.dueDate ? `<span class="text-muted small-text">${formatDateShort(ms.dueDate)}</span>` : ''}
      <button class="icon-btn danger" data-action="delete-milestone" data-id="${ms.id}" title="حذف">${icon('trash', 13)}</button>
    </div>
  `).join('');
  const taskRows = tasks.map((task) => `
    <div class="day-event">
      <span class="day-event-color" style="background:${task.status === 'done' ? 'var(--accent)' : 'var(--blue)'}"></span>
      <div class="day-event-main">
        <div class="day-event-title ${task.status === 'done' ? 'text-muted' : ''}" style="${task.status === 'done' ? 'text-decoration:line-through' : ''}">${escapeHtml(task.title)}</div>
        <div class="day-event-meta">${TASK_STATUS_LABELS[task.status]}${task.dueDate ? ` · ${relativeDateLabel(task.dueDate)}` : ''}</div>
      </div>
      <div class="day-event-actions">
        <button class="icon-btn" data-action="edit-task" data-id="${task.id}" title="تعديل">${icon('edit', 13)}</button>
      </div>
    </div>
  `).join('');

  openModal({
    title: goal.title,
    subtitle: goal.description || 'تفاصيل الهدف والتقدم',
    size: 'lg',
    content: `
      <div class="row" style="justify-content:space-between;margin-bottom:7px">
        <div>
          <div class="goal-percent">${pct}<small>%</small></div>
          <div class="text-muted small-text">${goal.currentValue}${goal.unit ? ' ' + escapeHtml(goal.unit) : ''} من ${goal.targetValue}${goal.unit ? ' ' + escapeHtml(goal.unit) : ''}</div>
        </div>
        <div class="text-end">
          <span class="pill ${goal.status === 'active' ? 'purple' : 'green'}">${goal.status === 'active' ? 'نشط' : goal.status === 'completed' ? 'مكتمل' : 'مؤرشف'}</span>
          <div class="text-muted small-text mt-1" style="margin-top:5px">${formatDateShort(goal.startDate)} — ${formatDateShort(goal.endDate)}</div>
        </div>
      </div>
      <div class="progress purple" style="height:8px"><span style="width:${pct}%"></span></div>

      <div class="grid grid-2 mt-3">
        <div>
          <div class="row" style="justify-content:space-between;margin-bottom:8px">
            <div class="section-title">المراحل</div>
            <span class="pill muted">${milestones.filter((m) => m.done).length}/${milestones.length}</span>
          </div>
          <div class="milestone-list">${milestoneRows || '<p class="text-muted small-text">لا توجد مراحل بعد.</p>'}</div>
          <form data-form="milestone" data-goal-id="${goal.id}" class="row mt-2" style="gap:6px">
            <input type="text" name="title" placeholder="مرحلة جديدة..." maxlength="100" required>
            <button class="soft-btn small" type="submit">${icon('plus', 13)} إضافة</button>
          </form>
        </div>
        <div>
          <div class="row" style="justify-content:space-between;margin-bottom:8px">
            <div class="section-title">المهام المرتبطة</div>
            <button class="card-link" data-action="goal-task-add" data-id="${goal.id}">${icon('plus', 11)} مهمة</button>
          </div>
          ${taskRows || '<p class="text-muted small-text">لا توجد مهام مرتبطة بهدفك بعد.</p>'}
        </div>
      </div>

      <div class="grid grid-2 mt-3">
        <div class="card pad" style="box-shadow:none;background:rgba(148,163,184,.03)">
          <div class="section-title mb-2">تطور التقدم</div>
          <div class="mini-chart">${historyBars || '<span class="text-muted small-text">لا يوجد سجل تقدم.</span>'}</div>
          <div class="mt-2">${historyRows || '<p class="text-muted small-text">لم يتم تسجيل تقدم بعد.</p>'}</div>
        </div>
        <div class="card pad" style="box-shadow:none;background:rgba(148,163,184,.03)">
          <div class="section-title mb-2">ملخص</div>
          <div class="kv"><span>عدد المراحل المكتملة</span><span>${milestones.filter((m) => m.done).length} / ${milestones.length}</span></div>
          <div class="kv"><span>المهام المكتملة</span><span>${tasks.filter((t) => t.status === 'done').length} / ${tasks.length}</span></div>
          <div class="kv"><span>آخر تحديث</span><span>${formatTimestamp(goal.updatedAt)}</span></div>
          <button class="soft-btn small mt-2" data-action="goal-progress" data-id="${goal.id}" style="width:100%">${icon('trending', 13)} تحديث التقدم</button>
        </div>
      </div>
    `,
    footer: `
      <button class="ghost-btn" data-modal-close>إغلاق</button>
      <div class="spacer"></div>
      <button class="soft-btn" data-action="edit-goal" data-id="${goal.id}">${icon('edit', 14)} تعديل</button>
      <button class="danger-btn" data-action="delete-goal" data-id="${goal.id}">${icon('trash', 14)} حذف</button>
    `
  });
}

/* ---------------- النوم ---------------- */
function defaultSleepTimes() {
  const now = nowWallParts();
  const hour = Number(now.time.split(':')[0]);
  if (hour < 14) {
    return { startDate: addDaysISO(todayISO(), -1), startTime: '22:30', endDate: todayISO(), endTime: '06:30' };
  }
  return { startDate: todayISO(), startTime: '22:30', endDate: addDaysISO(todayISO(), 1), endTime: '06:30' };
}

function sleepDurationPreview(startValue, endValue) {
  if (!startValue || !endValue) return '—';
  const start = splitDatetimeLocal(startValue);
  const end = splitDatetimeLocal(endValue);
  const minutes = diffWallMinutes(start.date, start.time, end.date, end.time);
  if (minutes <= 0) return 'الوقت غير صالح';
  return formatDuration(minutes);
}

function openSleepModal(id = null) {
  const record = id ? state.data.sleep.find((item) => item.id === id) : null;
  const defaults = defaultSleepTimes();
  const startValue = record ? `${record.startDate}T${record.startTime}` : `${defaults.startDate}T${defaults.startTime}`;
  const endValue = record ? `${record.endDate}T${record.endTime}` : `${defaults.endDate}T${defaults.endTime}`;
  const content = `
    <form id="sleep-form" data-form="sleep" data-id="${record?.id || ''}">
      <div class="form-grid">
        <div class="field full">
          <label for="sleep-type">نوع السجل</label>
          <select id="sleep-type" name="type">
            <option value="night" ${record?.type !== 'nap' ? 'selected' : ''}>نوم ليلي</option>
            <option value="nap" ${record?.type === 'nap' ? 'selected' : ''}>قيلولة</option>
          </select>
        </div>
        <div class="field">
          <label for="sleep-start">وقت النوم <span class="req">*</span></label>
          <input id="sleep-start" name="start" type="datetime-local" value="${escapeAttr(startValue)}" data-sleep-field required>
        </div>
        <div class="field">
          <label for="sleep-end">وقت الاستيقاظ <span class="req">*</span></label>
          <input id="sleep-end" name="end" type="datetime-local" value="${escapeAttr(endValue)}" data-sleep-field required>
        </div>
        <div class="field full">
          <div class="form-note" data-sleep-duration>${icon('clock', 15)}<span>المدة المحسوبة: <strong>${sleepDurationPreview(startValue, endValue)}</strong></span></div>
        </div>
        <div class="field full">
          <label for="sleep-notes">ملاحظات</label>
          <textarea id="sleep-notes" name="notes" maxlength="500" placeholder="جودة النوم، الاستيقاظ المتكرر، كافيين...">${escapeHtml(record?.notes || '')}</textarea>
        </div>
      </div>
      <div class="form-note mt-2">${icon('info', 14)}<span>إذا كان وقت الاستيقاظ في اليوم التالي، اختر التاريخ الصحيح. يُنسب السجل إلى يوم الاستيقاظ في الإحصاءات.</span></div>
    </form>
  `;
  openModal({
    title: record ? 'تعديل سجل النوم' : 'تسجيل نوم جديد',
    subtitle: record ? 'سيتم إعادة حساب المدة تلقائيًا' : 'سجّل نومك الليلي أو قيلولتك',
    content,
    footer: `
      <button class="ghost-btn" data-modal-close>إلغاء</button>
      <div class="spacer"></div>
      <button class="primary-btn" type="submit" form="sleep-form">${icon('check', 15)} ${record ? 'حفظ التعديلات' : 'حفظ السجل'}</button>
    `
  });
  setTimeout(() => document.getElementById('sleep-start')?.focus(), 80);
}

/* ---------------- التذكيرات ---------------- */
function reminderLinkOptions(selectedType, selectedId) {
  const current = selectedType && selectedId ? `${selectedType}:${selectedId}` : '';
  const taskOptions = state.data.tasks.map((task) => `<option value="task:${task.id}" ${current === `task:${task.id}` ? 'selected' : ''}>${escapeHtml(task.title)}</option>`).join('');
  const habitOptions = state.data.habits.map((habit) => `<option value="habit:${habit.id}" ${current === `habit:${habit.id}` ? 'selected' : ''}>${escapeHtml(habit.name)}</option>`).join('');
  const goalOptions = state.data.goals.map((goal) => `<option value="goal:${goal.id}" ${current === `goal:${goal.id}` ? 'selected' : ''}>${escapeHtml(goal.title)}</option>`).join('');
  return `
    <option value="">بدون ربط</option>
    ${taskOptions ? `<optgroup label="المهام">${taskOptions}</optgroup>` : ''}
    ${habitOptions ? `<optgroup label="العادات">${habitOptions}</optgroup>` : ''}
    ${goalOptions ? `<optgroup label="الأهداف">${goalOptions}</optgroup>` : ''}
  `;
}

function openReminderModal(id = null, defaults = {}) {
  const reminder = id ? state.data.reminders.find((item) => item.id === id) : null;
  const repeat = reminder?.repeat || defaults.repeat || 'once';
  const weekdays = reminder?.weekdays || [];
  const date = reminder?.date || defaults.date || todayISO();
  const time = reminder?.time || defaults.time || '09:00';
  const link = reminder?.linkType && reminder?.linkId ? `${reminder.linkType}:${reminder.linkId}` : (defaults.linkType && defaults.linkId ? `${defaults.linkType}:${defaults.linkId}` : '');
  const [linkType, linkId] = link ? link.split(':') : ['', ''];

  const repeatOptions = Object.entries(REPEAT_LABELS).map(([key, label]) => `
    <label class="repeat-option">
      <input type="radio" name="repeat" value="${key}" ${repeat === key ? 'checked' : ''}>
      <span>${label}</span>
    </label>
  `).join('');
  const weekdayOptions = WEEKDAYS_SHORT.map((label, day) => `
    <label class="day-toggle">
      <input type="checkbox" name="weekdays" value="${day}" ${weekdays.includes(day) ? 'checked' : ''}>
      <span>${label}</span>
    </label>
  `).join('');

  const content = `
    <form id="reminder-form" data-form="reminder" data-id="${reminder?.id || ''}">
      <div class="form-grid">
        <div class="field full">
          <label for="reminder-title">العنوان <span class="req">*</span></label>
          <input id="reminder-title" name="title" type="text" maxlength="120" placeholder="بماذا تريد أن نُذكّرك؟" value="${escapeAttr(reminder?.title || '')}" required>
        </div>
        <div class="field full">
          <label for="reminder-description">الوصف</label>
          <textarea id="reminder-description" name="description" maxlength="500" placeholder="تفاصيل إضافية...">${escapeHtml(reminder?.description || '')}</textarea>
        </div>
        <div class="field">
          <label for="reminder-date">التاريخ <span class="req">*</span></label>
          <input id="reminder-date" name="date" type="date" value="${escapeAttr(date)}" required>
        </div>
        <div class="field">
          <label for="reminder-time">الوقت <span class="req">*</span></label>
          <input id="reminder-time" name="time" type="time" value="${escapeAttr(time)}" required>
        </div>
        <div class="field full">
          <label>التكرار</label>
          <div class="repeat-options">${repeatOptions}</div>
        </div>
        <div class="field full" data-repeat-panel="weekdays" ${repeat === 'weekdays' ? '' : 'hidden'}>
          <label>أيام التكرار</label>
          <div class="days-picker">${weekdayOptions}</div>
        </div>
        <div class="field full" data-repeat-panel="custom" ${repeat === 'custom' ? '' : 'hidden'}>
          <label for="reminder-interval">كل كم يوم؟</label>
          <input id="reminder-interval" name="customInterval" type="number" min="1" max="365" value="${reminder?.customInterval || 2}">
        </div>
        <div class="field full">
          <label for="reminder-link">ربط بعنصر (اختياري)</label>
          <select id="reminder-link" name="link">${reminderLinkOptions(linkType, linkId)}</select>
          <span class="help">يمكنك ربط التذكير بمهمة أو عادة أو هدف لمتابعته من نفس المكان.</span>
        </div>
        <div class="field full">
          <div class="form-note">${icon('bell', 14)}<span>سيظهر التذكير داخل التطبيق، ومع إذن المتصفح ستظهر إشعارات أثناء فتح التطبيق. التكرار المتكرر يُحسب تلقائيًا من تاريخ البداية.</span></div>
        </div>
        ${reminder ? '' : `
        <div class="field full" style="border-top:1px solid var(--border);padding-top:10px;margin-top:10px">
          <div class="row" style="justify-content:space-between;align-items:center">
            <span class="text-muted small-text">${icon('copy', 13)} قالب:</span>
            <button class="soft-btn small" data-action="tpl-choose-from" data-type="reminder">${icon('folder', 13)} اختيار من القوالب</button>
          </div>
          <label class="row" style="cursor:pointer;font-size:12px;margin-top:6px">
            <input type="checkbox" name="saveAsTemplate">
            <span>حفظ هذا التذكير كقالب لإعادة الاستخدام لاحقًا</span>
          </label>
        </div>
        `}
      </div>
    </form>
  `;
  openModal({
    title: reminder ? 'تعديل التذكير' : 'تذكير جديد',
    subtitle: reminder ? 'أي تغيير في الجدولة يعيد ضبط مواعيد التنبيه' : 'اجعل التطبيق يتذكر بدلًا عنك',
    size: 'lg',
    content,
    footer: `
      <button class="ghost-btn" data-modal-close>إلغاء</button>
      <div class="spacer"></button>
      <button class="primary-btn" type="submit" form="reminder-form">${icon('check', 15)} ${reminder ? 'حفظ التعديلات' : 'إضافة التذكير'}</button>
    `
  });
  setTimeout(() => document.getElementById('reminder-title')?.focus(), 80);
}

function openSnooze(id) {
  const reminder = state.data.reminders.find((item) => item.id === id);
  if (!reminder) { toast({ type: 'error', title: 'التذكير غير موجود' }); return; }
  const content = `
    <p class="text-muted small-text mb-2">اختر مدة التأجيل، وسيعود التذكير للظهور بعدها.</p>
    <div class="row wrap">
      ${REMINDER_SNOOZE_OPTIONS.map((minutes) => `<button class="soft-btn" data-action="do-snooze" data-id="${id}" data-minutes="${minutes}">${icon('alarm', 14)} ${minutes === 60 ? 'ساعة' : `${minutes} دقيقة`}</button>`).join('')}
    </div>
    <form data-form="snooze-custom" data-id="${id}" class="row mt-3" style="gap:7px">
      <input type="number" name="minutes" min="1" max="1440" value="20" style="width:120px" aria-label="مدة مخصصة">
      <button class="ghost-btn small" type="submit">${icon('clock', 13)} مدة مخصصة</button>
    </form>
  `;
  openModal({
    title: `تأجيل: ${reminder.title}`,
    subtitle: 'Snooze',
    size: 'sm',
    content,
    footer: `<button class="ghost-btn" data-modal-close>إلغاء</button>`
  });
}

/* ---------------- تفاصيل اليوم ---------------- */
function openDayDetails(date) {
  const events = eventsGroupedByDate(date, date).get(date) || [];
  const groups = {
    tasks: events.filter((event) => event.type === 'task'),
    prayer: events.filter((event) => event.type === 'prayer'),
    habits: events.filter((event) => event.type === 'habit'),
    reminders: events.filter((event) => event.type === 'reminder'),
    sleep: events.filter((event) => event.type === 'sleep')
  };
  const groupMeta = [
    ['tasks', 'المهام', 'list-check', 'blue'],
    ['prayer', 'مواقيت الصلاة', 'mosque', 'teal'],
    ['habits', 'إنجازات العادات', 'check-circle', 'green'],
    ['reminders', 'التذكيرات', 'bell', 'warning'],
    ['sleep', 'النوم والاستيقاظ', 'moon', 'purple']
  ];

  const groupsHtml = groupMeta.map(([key, label, iconName, tone]) => {
    const list = groups[key];
    if (!list.length) return '';
    return `
      <div class="day-group">
        <div class="day-group-title">${icon(iconName, 13)} ${label} <span class="pill muted">${list.length}</span></div>
        ${list.map((event) => {
          let action = 'edit-task';
          if (event.type === 'prayer') action = 'prayer-goto-date';
          if (event.type === 'habit') action = 'habit-detail';
          if (event.type === 'reminder') action = 'edit-reminder';
          if (event.type === 'sleep') action = 'edit-sleep';
          const isPrayer = event.type === 'prayer';
          return `
            <div class="day-event ${event.type}">
              <span class="day-event-color"></span>
              <div class="day-event-main">
                <div class="day-event-title ${event.done ? 'text-muted' : ''}" style="${event.done ? 'text-decoration:line-through' : ''}">${escapeHtml(event.title)}</div>
                <div class="day-event-meta">${event.time ? formatTimeHM(event.time) : 'طوال اليوم'}${event.meta ? ` · ${escapeHtml(event.meta)}` : ''}${event.status === 'paused' ? ' · موقوف' : ''}</div>
              </div>
              <div class="day-event-actions">
                <button class="icon-btn" data-action="${action}" data-id="${event.id}" data-date="${event.date}" title="${isPrayer ? 'فتح قسم الصلاة' : 'فتح/تعديل'}">${icon(event.type === 'habit' ? 'chart' : isPrayer ? 'mosque' : 'edit', 14)}</button>
                ${!isPrayer && event.type !== 'habit' ? `<button class="icon-btn danger" data-action="day-delete" data-type="${event.type}" data-id="${event.id}" title="حذف">${icon('trash', 14)}</button>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');

  openModal({
    title: formatDateLong(date),
    subtitle: `${events.length} حدث مرتبط بهذا اليوم`,
    size: 'lg',
    content: `
      <div class="day-detail-head">
        <div class="row wrap">
          <button class="primary-btn small" data-action="day-add-task" data-date="${date}">${icon('plus', 13)} مهمة</button>
          <button class="soft-btn small" data-action="day-add-reminder" data-date="${date}">${icon('bell', 13)} تذكير</button>
          <button class="ghost-btn small" data-action="calendar-goto-day" data-date="${date}">${icon('calendar', 13)} عرض اليوم</button>
        </div>
        ${date === todayISO() ? '<span class="pill green">اليوم</span>' : ''}
      </div>
      ${groupsHtml || emptyState('calendar', 'لا أحداث في هذا اليوم', 'أضف مهمة أو تذكيرًا لهذا التاريخ.', `<button class="soft-btn small" data-action="day-add-task" data-date="${date}">${icon('plus', 13)} إضافة</button>`)}
    `,
    footer: `<button class="ghost-btn" data-modal-close>إغلاق</button>`
  });
}

/* ---------------- تفاصيل سجل النشاط ---------------- */
function flattenData(obj, prefix = '') {
  const rows = [];
  if (obj === null || obj === undefined) return rows;
  if (Array.isArray(obj)) {
    rows.push([prefix || 'القيمة', `${obj.length} عنصر`]);
    return rows;
  }
  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const label = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) rows.push([label, `${value.length} عنصر`]);
        else rows.push(...flattenData(value, label));
      } else {
        rows.push([label, value]);
      }
    }
    return rows;
  }
  rows.push([prefix || 'القيمة', obj]);
  return rows;
}

function openActivityDetail(id) {
  const log = state.data.activity.find((item) => item.id === id);
  if (!log) { toast({ type: 'error', title: 'سجل النشاط غير موجود' }); return; }
  const oldRows = flattenData(log.oldData);
  const newRows = flattenData(log.newData);
  const oldMap = new Map(oldRows.map(([key, value]) => [key, value]));
  const newMap = new Map(newRows.map(([key, value]) => [key, value]));
  const keys = [...new Set([...oldMap.keys(), ...newMap.keys()])].filter((key) => !['progressHistory', 'notifiedKeys'].some((skip) => key === skip || key.startsWith(`${skip}.`)));
  const displayValue = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
    return String(value);
  };
  const diffRows = keys.map((key) => {
    const before = oldMap.get(key);
    const after = newMap.get(key);
    const changed = String(before) !== String(after);
    return `<tr style="${changed ? 'background:rgba(108,140,255,.04)' : ''}">
      <td style="color:var(--muted);font-size:10.5px;padding:5px 7px;border-bottom:1px solid var(--border);direction:ltr;text-align:start">${escapeHtml(key)}</td>
      <td style="padding:5px 7px;border-bottom:1px solid var(--border);font-size:11px;color:var(--muted)">${escapeHtml(displayValue(before))}</td>
      <td style="padding:5px 7px;border-bottom:1px solid var(--border);font-size:11px;color:var(--text-soft)">${escapeHtml(displayValue(after))}</td>
    </tr>`;
  }).join('');

  const pretty = (data) => data ? `<pre class="json-block">${escapeHtml(JSON.stringify(data, null, 2))}</pre>` : '<p class="text-muted small-text">لا توجد بيانات</p>';

  openModal({
    title: 'تفاصيل عملية',
    subtitle: `${ACTION_LABELS[log.action] || log.action} ${ENTITY_LABELS[log.entityType] || ''} · ${log.entityName}`,
    size: 'lg',
    content: `
      <div class="stat-grid" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:15px">
        ${statCard({ label: 'نوع العملية', value: ACTION_LABELS[log.action] || log.action, iconName: 'activity', meta: formatTimestampFull(log.timestamp) })}
        ${statCard({ label: 'نوع العنصر', value: ENTITY_LABELS[log.entityType] || log.entityType, iconName: entityIcon(log.entityType), tone: 'blue', meta: `المعرف: ${log.entityId}` })}
      </div>
      ${keys.length ? `
        <div class="section-title mb-2">مقارنة البيانات</div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse">
            <thead><tr>
              <th style="text-align:start;font-size:10px;color:var(--muted-2);padding:5px 7px">الحقل</th>
              <th style="text-align:start;font-size:10px;color:var(--muted-2);padding:5px 7px">قبل</th>
              <th style="text-align:start;font-size:10px;color:var(--muted-2);padding:5px 7px">بعد</th>
            </tr></thead>
            <tbody>${diffRows}</tbody>
          </table>
        </div>
      ` : '<p class="text-muted small-text">لا توجد بيانات تفصيلية متاحة لهذه العملية.</p>'}
      <details class="mt-3">
        <summary class="section-title" style="cursor:pointer">البيانات الخام</summary>
        <div class="grid grid-2 mt-2">
          <div><div class="text-muted small-text mb-1">البيانات القديمة</div>${pretty(log.oldData)}</div>
          <div><div class="text-muted small-text mb-1">البيانات الجديدة</div>${pretty(log.newData)}</div>
        </div>
      </details>
      ${log.details ? `<details class="mt-2"><summary class="section-title" style="cursor:pointer">تفاصيل إضافية</summary>${pretty(log.details)}</details>` : ''}
    `,
    footer: `<button class="ghost-btn" data-modal-close>إغلاق</button>`
  });
}

/* ---------------- مكتبة القوالب (مركزي) ---------------- */

const TEMPLATE_TYPE_LABELS = {
  task: 'مهمة',
  goal: 'هدف',
  habit: 'عادة',
  reminder: 'تذكير',
  finance_expense: 'مصروف',
  finance_income: 'دخل / راتب',
  finance_obligation: 'التزام',
  finance_debt: 'دين',
  finance_savings_goal: 'هدف ادخار',
  event: 'حدث'
};

const TEMPLATE_TYPE_ICONS = {
  task: 'list-check',
  goal: 'target',
  habit: 'check-circle',
  reminder: 'bell',
  finance_expense: 'receipt',
  finance_income: 'arrow-down-left',
  finance_obligation: 'bell',
  finance_debt: 'scale',
  finance_savings_goal: 'piggy-bank',
  event: 'calendar'
};

function templateTypeLabel(type) {
  return TEMPLATE_TYPE_LABELS[type] || type;
}

function templateTypeIcon(type) {
  return icon(TEMPLATE_TYPE_ICONS[type] || 'circle', 14);
}

function renderTemplatesModal() {
  const templates = state.data.templates || [];
  const typeFilter = state.ui.templateTypeFilter || 'all';
  const query = (state.ui.templateQuery || '').toLowerCase();
  const showFav = state.ui.templateShowFav === true;

  let list = templates;
  if (typeFilter !== 'all') list = list.filter((t) => t.entityType === typeFilter);
  if (showFav) list = list.filter((t) => t.isFavorite);
  if (query) {
    list = list.filter((t) =>
      t.name.toLowerCase().includes(query)
      || (t.description || '').toLowerCase().includes(query)
      || templateTypeLabel(t.entityType).toLowerCase().includes(query)
    );
  }
  list = sortBy(list, (t) => (t.isFavorite ? 0 : 1) * 1000000 - (t.useCount || 0) - (t.lastUsedAt || 0));

  const typeOptions = TEMPLATE_ENTITY_TYPES.map((t) => `
    <option value="${t}" ${typeFilter === t ? 'selected' : ''}>${templateTypeLabel(t)}</option>
  `).join('');

  const rows = list.length ? list.map((t) => {
    const usedAgo = t.lastUsedAt ? `· استخدم منذ ${timeAgo(t.lastUsedAt)}` : '';
    return `
      <div class="template-row" data-template-id="${t.id}">
        <div class="template-row-main">
          <div class="template-row-icon">${templateTypeIcon(t.entityType)}</div>
          <div class="template-row-info">
            <div class="template-row-title">${escapeHtml(t.name)}${t.isFavorite ? ' ' + icon('star', 12) : ''}</div>
            <div class="template-row-meta">${templateTypeLabel(t.entityType)} ${usedAgo ? '· ' : ''}${usedAgo} ${t.useCount ? `· استخدامات ${t.useCount}` : ''}</div>
            ${t.description ? `<div class="template-row-desc">${escapeHtml(t.description)}</div>` : ''}
          </div>
        </div>
        <div class="template-row-actions">
          <button class="soft-btn small" data-action="tpl-use" data-id="${t.id}">${icon('play', 12)} استخدام</button>
          <button class="ghost-btn small" data-action="tpl-edit" data-id="${t.id}">${icon('edit', 12)}</button>
          <button class="${t.isFavorite ? 'soft-btn' : 'ghost-btn'} small" data-action="tpl-fav" data-id="${t.id}">${icon('star', 12)}</button>
          <button class="danger-btn small" data-action="tpl-delete" data-id="${t.id}">${icon('trash', 12)}</button>
        </div>
      </div>
    `;
  }).join('') : '<div class="empty-state"><div class="empty-icon">'+icon('copy', 20)+'</div><h4>لا توجد قوالب محفوظة</h4><p>أنشئ عنصرًا واختر "حفظ كقالب" لإعادة استخدامه لاحقًا.</p></div>';

  const content = `
    <div class="row wrap mb-3" style="gap:8px;align-items:flex-end">
      <select class="input" id="tpl-type-filter" style="max-width:170px">${typeOptions}</select>
      <input class="input" id="tpl-search" placeholder="البحث في القوالب..." value="${escapeAttr(state.ui.templateQuery || '')}" style="flex:1;max-width:260px">
      <label class="row" style="cursor:pointer;font-size:12px;margin:0">
        <input type="checkbox" id="tpl-fav-only" ${showFav ? 'checked' : ''}>
        <span>المفضلة فقط</span>
      </label>
    </div>
    <div class="card"><div class="card-body">${rows}</div></div>
  `;

  openModal({
    title: 'مكتبة القوالب',
    subtitle: 'أعد استخدام العناصر التي أنشأتها سابقًا دون إعادة كتابتها',
    size: 'lg',
    content,
    footer: `
      <button class="ghost-btn" data-modal-close>إغلاق</button>
      <div class="spacer"></div>
      <button class="primary-btn" data-action="tpl-new">${icon('plus', 14)} إنشاء قالب جديد</button>
    `
  });

  const overlay = document.querySelector('.modal-overlay');
  overlay.querySelector('#tpl-type-filter')?.addEventListener('change', (e) => {
    state.ui.templateTypeFilter = e.target.value;
    state.ui.templateQuery = '';
    renderTemplatesModal();
  });
  overlay.querySelector('#tpl-search')?.addEventListener('input', (e) => {
    state.ui.templateQuery = e.target.value;
    renderTemplatesModal();
  });
  overlay.querySelector('#tpl-fav-only')?.addEventListener('change', (e) => {
    state.ui.templateShowFav = e.target.checked;
    renderTemplatesModal();
  });
}

function openTemplateEditor(id = null) {
  const template = id ? getTemplate(id) : null;
  const data = template || {
    entityType: 'task',
    name: '',
    description: '',
    tags: [],
    data: {}
  };
  const typeOptions = TEMPLATE_ENTITY_TYPES.map((t) => `
    <option value="${t}" ${data.entityType === t ? 'selected' : ''}>${templateTypeLabel(t)}</option>
  `).join('');
  const content = `
    <form id="tpl-form" data-id="${template?.id || ''}">
      <div class="form-grid">
        <div class="field">
          <label for="tpl-type">نوع العنصر <span class="req">*</span></label>
          <select id="tpl-type" name="entityType">${typeOptions}</select>
        </div>
        <div class="field full">
          <label for="tpl-name">اسم القالب <span class="req">*</span></label>
          <input id="tpl-name" name="name" type="text" maxlength="100" value="${escapeAttr(data.name)}" required placeholder="مثال: مهمة تقرير أسبوعي">
        </div>
        <div class="field full">
          <label for="tpl-desc">وصف القالب (اختياري)</label>
          <input id="tpl-desc" name="description" type="text" maxlength="160" value="${escapeAttr(data.description || '')}" placeholder="ما الغرض من هذا القالب؟">
        </div>
        <div class="field full">
          <label for="tpl-tags">التصنيفات/العلامات (اختياري، مفصولة بفاصلة)</label>
          <input id="tpl-tags" name="tags" type="text" maxlength="120" value="${escapeAttr(Array.isArray(data.tags) ? data.tags.join(', ') : '')}" placeholder="عمل، عاجل، monthly...">
        </div>
      </div>
      <div class="form-note mt-2">${icon('info', 14)}<span>تُستخدم البيانات الافتراضية من العنصر الأصلي عند الإنشاء من هذا القالب، ويمكن تعديلها قبل الحفظ.</span></div>
    </form>
  `;
  openModal({
    title: template ? 'تعديل القالب' : 'قالب جديد',
    subtitle: 'حدد نوع العنصر والبيانات التي سيتم إعادة استخدامها',
    content,
    footer: `
      <button class="ghost-btn" data-modal-close>إلغاء</button>
      <div class="spacer"></div>
      <button class="primary-btn" type="submit" form="tpl-form">${icon('check', 15)} ${template ? 'حفظ التعديلات' : 'إنشاء القالب'}</button>
    `
  });
}

function handleTemplateAction(action, id) {
  switch (action) {
    case 'tpl-new':
      closeAllModals();
      openTemplateEditor();
      return true;
    case 'tpl-use':
      closeAllModals();
      openTemplateUseModal(id);
      return true;
    case 'tpl-edit':
      closeAllModals();
      openTemplateEditor(id);
      return true;
    case 'tpl-fav':
      toggleTemplateFavorite(id).then(() => renderTemplatesModal()).catch((err) => showToast({ type: 'error', title: 'فشل', message: err.message }));
      return true;
    case 'tpl-delete':
      closeAllModals();
      confirmAction({
        title: 'حذف القالب؟',
        message: 'سيُحذف القالب نهائيًا ولا يؤثر على العناصر المنشأة منه سابقًا.',
        confirmText: 'حذف', danger: true
      }).then(async (ok) => {
        if (!ok) return;
        try {
          await deleteTemplate(id);
          renderTemplatesModal();
          showToast({ title: 'تم حذف القالب' });
        } catch (e) { showToast({ type: 'error', title: 'فشل الحذف', message: e.message }); }
      });
      return true;
  }
  return false;
}

async function openTemplateUseModal(templateId) {
  const template = getTemplate(templateId);
  if (!template) return;
  const { entityType, data } = template;

  let fieldsHtml = '';
  let formId = 'tpl-use-form';
  let submitLabel = 'إنشاء العنصر';

  switch (entityType) {
    case 'task':
      fieldsHtml = `
        <div class="field full">
          <label for="tpl-use-title">عنوان المهمة <span class="req">*</span></label>
          <input id="tpl-use-title" name="title" type="text" value="${escapeAttr(data.title || template.name)}" required>
        </div>
        <div class="field full">
          <label for="tpl-use-desc">الوصف</label>
          <textarea id="tpl-use-desc" name="description">${escapeHtml(data.description || '')}</textarea>
        </div>
        <div class="field">
          <label for="tpl-use-priority">الأولوية</label>
          <select id="tpl-use-priority" name="priority">
            ${Object.entries(PRIORITY_LABELS).map(([k, l]) => `<option value="${k}" ${data.priority === k ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="tpl-use-category">التصنيف</label>
          <input id="tpl-use-category" name="category" type="text" value="${escapeAttr(data.category || '')}">
        </div>
      `;
      break;
    case 'goal':
      fieldsHtml = `
        <div class="field full">
          <label for="tpl-use-title">عنوان الهدف <span class="req">*</span></label>
          <input id="tpl-use-title" name="title" type="text" value="${escapeAttr(data.title || template.name)}" required>
        </div>
        <div class="field full">
          <label for="tpl-use-desc">الوصف</label>
          <textarea id="tpl-use-desc" name="description">${escapeHtml(data.description || '')}</textarea>
        </div>
        <div class="field">
          <label for="tpl-use-target">القيمة المستهدفة</label>
          <input id="tpl-use-target" name="targetValue" type="number" min="0.01" step="any" value="${data.targetValue || 100}" required>
        </div>
        <div class="field">
          <label for="tpl-use-unit">الوحدة</label>
          <input id="tpl-use-unit" name="unit" type="text" value="${escapeAttr(data.unit || '')}">
        </div>
      `;
      break;
    case 'habit':
      fieldsHtml = `
        <div class="field full">
          <label for="tpl-use-name">اسم العادة <span class="req">*</span></label>
          <input id="tpl-use-name" name="name" type="text" value="${escapeAttr(data.name || template.name)}" required>
        </div>
        <div class="field full">
          <label for="tpl-use-desc">الوصف</label>
          <input id="tpl-use-desc" name="description" type="text" value="${escapeHtml(data.description || '')}">
        </div>
      `;
      break;
    case 'reminder':
    case 'event':
      fieldsHtml = `
        <div class="field full">
          <label for="tpl-use-title">العنوان <span class="req">*</span></label>
          <input id="tpl-use-title" name="title" type="text" value="${escapeAttr(data.title || template.name)}" required>
        </div>
        <div class="field full">
          <label for="tpl-use-desc">الوصف</label>
          <textarea id="tpl-use-desc" name="description">${escapeHtml(data.description || '')}</textarea>
        </div>
        <div class="field">
          <label for="tpl-use-date">التاريخ</label>
          <input id="tpl-use-date" name="date" type="date" value="${data.date || todayISO()}">
        </div>
        <div class="field">
          <label for="tpl-use-time">الوقت</label>
          <input id="tpl-use-time" name="time" type="time" value="${data.time || '09:00'}">
        </div>
      `;
      break;
    case 'finance_expense':
      fieldsHtml = `
        <div class="field full">
          <label for="tpl-use-name">اسم المصروف <span class="req">*</span></label>
          <input id="tpl-use-name" name="name" type="text" value="${escapeAttr(data.merchant || template.name)}" required>
        </div>
        <div class="field">
          <label for="tpl-use-amount">المبلغ <span class="req">*</span></label>
          <input id="tpl-use-amount" name="amount" type="number" min="0.001" step="0.001" value="${data.amount || ''}" required>
        </div>
        <div class="field">
          <label for="tpl-use-account">الحساب</label>
          ${financeAccountSelect('tpl-use-account', data.accountId || '', false, 'all', 'accountId')}
        </div>
        <div class="field">
          <label for="tpl-use-category">التصنيف</label>
          ${financeCategorySelect('tpl-use-category', 'expense', data.categoryId || '', true, 'categoryId')}
        </div>
      `;
      submitLabel = 'إضافة المصروف';
      break;
    case 'finance_income':
      fieldsHtml = `
        <div class="field full">
          <label for="tpl-use-name">مصدر الدخل <span class="req">*</span></label>
          <input id="tpl-use-name" name="name" type="text" value="${escapeAttr(data.counterparty || template.name)}" required>
        </div>
        <div class="field">
          <label for="tpl-use-amount">المبلغ <span class="req">*</span></label>
          <input id="tpl-use-amount" name="amount" type="number" min="0.001" step="0.001" value="${data.amount || ''}" required>
        </div>
        <div class="field">
          <label for="tpl-use-account">الحساب</label>
          ${financeAccountSelect('tpl-use-account', data.accountId || '', false, 'all', 'accountId')}
        </div>
        <div class="field">
          <label for="tpl-use-kind">نوع الدخل</label>
          <select id="tpl-use-kind" name="incomeKind">
            ${Object.entries(FINANCE_INCOME_KINDS).map(([k, l]) => `<option value="${k}" ${data.incomeKind === k ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
      `;
      submitLabel = 'تسجيل الدخل';
      break;
    case 'finance_obligation':
      fieldsHtml = `
        <div class="field full">
          <label for="tpl-use-name">اسم الالتزام <span class="req">*</span></label>
          <input id="tpl-use-name" name="name" type="text" value="${escapeAttr(data.name || template.name)}" required>
        </div>
        <div class="field">
          <label for="tpl-use-amount">المبلغ المتوقع <span class="req">*</span></label>
          <input id="tpl-use-amount" name="expectedAmount" type="number" min="0.001" step="0.001" value="${data.expectedAmount || ''}" required>
        </div>
        <div class="field">
          <label for="tpl-use-date">تاريخ الاستحقاق <span class="req">*</span></label>
          <input id="tpl-use-date" name="dueDate" type="date" value="${data.dueDate || todayISO()}" required>
        </div>
        <div class="field">
          <label for="tpl-use-recurrence">التكرار</label>
          <select id="tpl-use-recurrence" name="recurrence">
            ${Object.entries(FINANCE_RECURRENCE).map(([k, l]) => `<option value="${k}" ${data.recurrence === k ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
      `;
      submitLabel = 'إضافة الالتزام';
      break;
    case 'finance_debt':
      fieldsHtml = `
        <div class="field full">
          <label for="tpl-use-name">اسم الدائن <span class="req">*</span></label>
          <input id="tpl-use-name" name="creditor" type="text" value="${escapeAttr(data.creditor || template.name)}" required>
        </div>
        <div class="field">
          <label for="tpl-use-amount">أصل الدين <span class="req">*</span></label>
          <input id="tpl-use-amount" name="principal" type="number" min="0.001" step="0.001" value="${data.principal || ''}" required>
        </div>
        <div class="field">
          <label for="tpl-use-account">الحساب</label>
          ${financeAccountSelect('tpl-use-account', data.accountId || '', false, 'all', 'accountId')}
        </div>
      `;
      submitLabel = 'إضافة الدين';
      break;
    case 'finance_savings_goal':
      fieldsHtml = `
        <div class="field full">
          <label for="tpl-use-name">اسم هدف الادخار <span class="req">*</span></label>
          <input id="tpl-use-name" name="name" type="text" value="${escapeAttr(data.name || template.name)}" required>
        </div>
        <div class="field">
          <label for="tpl-use-target">المبلغ المستهدف <span class="req">*</span></label>
          <input id="tpl-use-target" name="targetAmount" type="number" min="0.001" step="0.001" value="${data.targetAmount || ''}" required>
        </div>
        <div class="field">
          <label for="tpl-use-account">الحساب</label>
          ${financeAccountSelect('tpl-use-account', data.accountId || '', false, 'all', 'accountId')}
        </div>
      `;
      submitLabel = 'إضافة هدف الادخار';
      break;
  }

  const content = `
    <div class="banner"><span class="banner-icon">${templateTypeIcon(entityType)}</span><div><strong>استخدام القالب: ${escapeHtml(template.name)}</strong><p>يمكنك تعديل التفاصيل قبل إنشاء العنصر الجديد. سيُنشأ عنصر بمعرّف مستقل ولا يتم نسخ حالة الإنجاز أو التواريخ القديمة.</p></div></div>
    <form id="${formId}">
      <div class="form-grid mt-2">${fieldsHtml}</div>
    </form>
  `;

  const close = openModal({
    title: `إنشاء من القالب: ${template.name}`,
    subtitle: templateTypeLabel(entityType),
    size: 'lg',
    content,
    footer: `
      <button class="ghost-btn" data-modal-close>إلغاء</button>
      <div class="spacer"></div>
      <button class="primary-btn" type="submit" form="${formId}">${icon('plus', 14)} ${submitLabel}</button>
    `
  });

  const form = document.getElementById(formId);
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const fdObj = {};
    for (const [k, v] of fd.entries()) fdObj[k] = v;

    let overrides = {};
    switch (entityType) {
      case 'task':
        overrides = {
          title: fdObj.title,
          description: fdObj.description,
          priority: fdObj.priority,
          status: 'new',
          category: fdObj.category,
          dueDate: '',
          dueTime: '',
          goalId: '',
          subtasks: (data.subtasks || []).map((s) => ({ id: s.id || uid('sub'), title: s.title, done: false })).filter((s) => s.title)
        };
        break;
      case 'goal':
        overrides = {
          title: fdObj.title,
          description: fdObj.description,
          startDate: todayISO(),
          endDate: addDaysISO(todayISO(), 30),
          targetValue: Number(fdObj.targetValue) || 100,
          currentValue: 0,
          unit: fdObj.unit,
          color: data.color || '#b58cff',
          status: 'active',
          progressHistory: []
        };
        break;
      case 'habit':
        overrides = {
          name: fdObj.name,
          description: fdObj.description,
          color: data.color || '#35e0b5',
          days: data.days || [0, 1, 2, 3, 4, 5, 6],
          weeklyGoal: data.weeklyGoal || 7
        };
        break;
      case 'reminder':
      case 'event':
        overrides = {
          title: fdObj.title,
          description: fdObj.description,
          date: fdObj.date || todayISO(),
          time: fdObj.time || '09:00',
          repeat: data.repeat || 'once',
          weekdays: data.weekdays || [],
          customInterval: data.customInterval || 2,
          linkType: '',
          linkId: '',
          status: 'active',
          notifiedKeys: [],
          completedAt: null,
          snoozeUntil: null
        };
        break;
      case 'finance_expense':
        overrides = {
          amount: fdObj.amount,
          accountId: fdObj.accountId || financeSettings().defaultAccountId,
          categoryId: fdObj.categoryId || 'cat_exp_other',
          date: todayISO(),
          time: nowHHMM(),
          paymentMethod: data.paymentMethod || 'cash',
          merchant: fdObj.name,
          notes: ''
        };
        break;
      case 'finance_income':
        overrides = {
          amount: fdObj.amount,
          accountId: fdObj.accountId || financeSettings().defaultAccountId,
          categoryId: fdObj.categoryId || 'cat_inc_salary',
          incomeKind: fdObj.incomeKind || 'salary',
          date: todayISO(),
          time: nowHHMM(),
          counterparty: fdObj.name,
          notes: '',
          scheduleId: ''
        };
        break;
      case 'finance_obligation':
        overrides = {
          name: fdObj.name,
          accountId: fdObj.accountId || financeSettings().defaultAccountId,
          expectedAmount: fdObj.expectedAmount,
          dueDate: fdObj.dueDate || todayISO(),
          recurrence: fdObj.recurrence || 'monthly',
          type: data.type || 'bill',
          categoryId: data.categoryId || 'cat_exp_other',
          reminderEnabled: data.reminderEnabled !== false,
          reminderTime: data.reminderTime || '09:00',
          notes: '',
          status: 'active'
        };
        break;
      case 'finance_debt':
        overrides = {
          creditor: fdObj.name,
          principal: fdObj.amount,
          accountId: fdObj.accountId || financeSettings().defaultAccountId,
          date: todayISO(),
          dueDate: '',
          notes: '',
          reminderEnabled: data.reminderEnabled !== false
        };
        break;
      case 'finance_savings_goal':
        overrides = {
          name: fdObj.name,
          targetAmount: fdObj.targetAmount,
          accountId: fdObj.accountId || financeSettings().defaultAccountId,
          startDate: todayISO(),
          targetDate: addMonthsISO(todayISO(), 6),
          notes: '',
          linkedGoalId: '',
          status: 'active',
          color: data.color || '#35e0b5'
        };
        break;
    }

    try {
      await incrementTemplateUse(templateId);
      await applyTemplate(templateId, overrides);
      close();
      closeAllModals();
      refreshUI();
      showToast({ title: 'تم إنشاء العنصر من القالب', message: `استُخدم القالب "${escapeHtml(template.name)}"` });
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'فشل الإنشاء', message: error.message });
    }
  }, { once: true });
}
