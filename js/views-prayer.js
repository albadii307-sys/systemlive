/* =========================================================
   نظامي — واجهة قسم الصلاة: المواقيت، الأذان، المتابعة
   ========================================================= */
'use strict';

/* ---------------- عناصر مساعدة ---------------- */
function prayerAlertModeLabel(mode) {
  return PRAYER_ALERT_MODE_LABELS[mode] || 'أذان كامل';
}

function prayerAdhanLibrarySummary(settings = getPrayerSettings()) {
  const sound = adhanSoundOrFallback(settings.adhanSound);
  const libraryCount = typeof adhanLibraryRecords === 'function' ? adhanLibraryRecords().length : 0;
  return `
    <div class="prayer-sound-current prayer-sound-current-lg">
      <div class="prayer-sound-current-body">
        <span>${icon('volume', 13)} المؤذن الافتراضي لكل الصلوات</span>
        <strong>${escapeHtml(sound.label)} — ${escapeHtml(sound.reciter)}</strong>
        <p class="help">${escapeHtml(sound.style || '')} · ${escapeHtml(sound.license || '')}</p>
      </div>
      <div class="row wrap">
        <button class="soft-btn small" type="button" data-action="prayer-open-library">${icon('database', 13)} مكتبة الأذان</button>
        <button class="ghost-btn small" type="button" data-action="prayer-test-sound" data-mode="full" data-sound="${escapeAttr(sound.id)}">${icon('play', 12)} تجربة</button>
      </div>
    </div>
    <p class="help mb-2">من المكتبة يمكنك اختيار مؤذن لجميع الصلوات، أو تخصيص صوت لكل صلاة، ورفع ملفاتك الخاصة. الأصوات المنزّلة تعمل دون إنترنت${libraryCount ? ` — لديك ${libraryCount} صوت محفوظ على الجهاز` : ''}.</p>
  `;
}

function prayerAlertBell(key, settings) {
  const alert = settings.alerts[key];
  if (!alert?.enabled) return `<span class="prayer-alert-state off" title="التنبيه غير مفعّل">${icon('volume-x', 12)}</span>`;
  if (alert.mode === 'silent') return `<span class="prayer-alert-state silent" title="تنبيه صامت">${icon('bell', 12)}</span>`;
  return `<span class="prayer-alert-state on" title="${escapeAttr(prayerAlertModeLabel(alert.mode))}">${icon(alert.mode === 'short' ? 'bell' : 'volume', 12)}</span>`;
}

function prayerNotificationBanner() {
  const permission = prayerNotificationPermission();
  if (permission === 'granted') {
    return `
      <div class="banner success-soft">
        <span class="banner-icon" style="color:var(--accent)">${icon('check-circle', 16)}</span>
        <div>
          <strong>إشعارات المتصفح مفعّلة</strong>
          <p>سيظهر إشعار النظام وتنبيه داخل التطبيق عند دخول وقت الصلاة، ما دام التطبيق مفتوحًا في هذا التبويب.</p>
        </div>
      </div>
    `;
  }
  if (permission === 'denied') {
    return `
      <div class="banner danger">
        <span class="banner-icon">${icon('alert', 16)}</span>
        <div>
          <strong>إشعارات المتصفح محظورة</strong>
          <p>يمكنك إعادة السماح من إعدادات الموقع في المتصفح. ستظل التنبيهات الصوتية والبطاقة داخل التطبيق تعمل أثناء فتحه.</p>
        </div>
      </div>
    `;
  }
  if (permission === 'unsupported') {
    return `
      <div class="banner warning">
        <span class="banner-icon">${icon('info', 16)}</span>
        <div>
          <strong>هذا المتصفح لا يدعم إشعارات النظام</strong>
          <p>ستظهر التنبيهات داخل التطبيق فقط، مع إمكانية تشغيل صوت الأذان أثناء فتحه.</p>
        </div>
      </div>
    `;
  }
  return `
    <div class="banner warning">
      <span class="banner-icon">${icon('bell', 16)}</span>
      <div>
        <strong>فعّل إشعارات المتصفح</strong>
        <p>ستحتاجها لتنبيهك عند دخول الوقت. الإذن يُطلب مرة واحدة، ويمكنك رفضه واستخدام التنبيه الصوتي فقط.</p>
      </div>
      <div class="banner-actions">
        <button class="primary-btn small" data-action="request-notifications">${icon('bell', 13)} تفعيل</button>
      </div>
    </div>
  `;
}

function prayerTimesRow(date, data, key, next, current, settings) {
  const time = data.times[key];
  if (!time) return '';
  const isSunrise = key === 'sunrise';
  const isNext = !isSunrise && date === prayerTodayISO() && next?.key === key && !next.isTomorrow;
  const isCurrent = !isSunrise && date === prayerTodayISO() && current?.key === key;
  const done = !isSunrise && isPrayerDone(date, key);
  const canMark = !isSunrise && prayerCanMark(date, key);
  const future = date > prayerTodayISO();
  const statePills = [
    isNext ? '<span class="pill green">القادمة</span>' : '',
    isCurrent ? '<span class="pill blue">الحالية</span>' : '',
    future ? '<span class="pill muted">قادمة</span>' : ''
  ].filter(Boolean).join('');
  return `
    <div class="prayer-time-row ${isNext ? 'is-next' : ''} ${isCurrent ? 'is-current' : ''} ${done ? 'is-done' : ''} ${isSunrise ? 'is-sunrise' : ''}">
      <div class="prayer-time-name">
        <span class="prayer-row-icon">${icon(PRAYER_ICONS[key] || 'clock', 16)}</span>
        <div class="prayer-row-text">
          <div class="prayer-row-title">${PRAYER_LABELS[key]} ${statePills}</div>
          <div class="prayer-row-sub">${isSunrise ? 'شروق الشمس — ليس صلاة' : done ? 'تم تسجيلها' : canMark ? 'لم تُسجّل بعد' : 'لم يحن وقتها'}</div>
        </div>
      </div>
      <div class="prayer-time-value">
        <strong>${time.timeLabel}</strong>
        ${!isSunrise ? `<span class="prayer-time-alert">${prayerAlertBell(key, settings)} ${prayerAlertModeLabel(settings.alerts[key]?.mode)}</span>` : ''}
      </div>
      <div class="prayer-time-action">
        ${isSunrise
          ? `<span class="prayer-sunrise-mark">${icon('sunrise', 16)}</span>`
          : `<button class="prayer-check ${done ? 'done' : ''}" data-action="prayer-mark" data-date="${date}" data-key="${key}" ${canMark ? '' : 'disabled'} title="${done ? 'إلغاء تسجيل الصلاة' : 'تسجيل الصلاة'}">
              ${done ? icon('check', 14) : icon('plus', 13)}
            </button>`}
      </div>
    </div>
  `;
}

function prayerHeroCard(date, data, next, current, settings) {
  const isToday = date === prayerTodayISO();
  const focus = isToday ? next : null;
  const progress = focus ? prayerDayProgress(focus, focus.current) : 0;
  const method = prayerMethodInfo(settings);
  if (!focus) {
    return `
      <section class="card prayer-hero prayer-hero-quiet">
        <div class="prayer-hero-orb">${icon('mosque', 26)}</div>
        <div class="prayer-hero-body">
          <span class="prayer-hero-kicker">مواقيت ${isToday ? 'اليوم' : formatDateLong(date)}</span>
          <h2>جدول هذا اليوم جاهز</h2>
          <p>اختر صلاة من الجدول لتسجيلها، أو انتقل إلى يوم آخر من شريط التاريخ.</p>
          <div class="prayer-hero-meta">
            <span>${icon('map-pin', 12)} ${escapeHtml(prayerLocationLabel(settings.location))}</span>
            <span>${icon('compass', 12)} ${escapeHtml(method.label)}</span>
          </div>
        </div>
      </section>
    `;
  }
  return `
    <section class="card prayer-hero">
      <div class="prayer-hero-orb">${icon('mosque', 26)}</div>
      <div class="prayer-hero-body">
        <span class="prayer-hero-kicker">الصلاة القادمة · ${escapeHtml(prayerLocationLabel(settings.location))}</span>
        <div class="prayer-hero-main">
          <div class="prayer-hero-name">
            <h2 data-prayer-next-label>${focus.label}</h2>
            <div class="prayer-hero-time"><span data-prayer-next-time>${focus.timeLabel}</span> <small data-prayer-next-day>${focus.isTomorrow ? 'غدًا' : 'اليوم'}</small></div>
          </div>
          <div class="prayer-hero-countdown">
            <span class="prayer-countdown-label">متبقٍ</span>
            <strong data-prayer-countdown>${formatCountdown(focus.remainingMs)}</strong>
          </div>
        </div>
        <div class="prayer-hero-progress"><span style="width:${progress}%"></span></div>
        <div class="prayer-hero-meta">
          <span>${icon('clock', 12)} ${current ? `الصلاة الحالية: ${current.label}` : 'لم يدخل وقت صلاة بعد'}</span>
          <span>${icon('compass', 12)} ${escapeHtml(method.label)} · ${escapeHtml(method.madhab)}</span>
        </div>
      </div>
      <div class="prayer-hero-side">
        <div class="prayer-hero-side-item"><span>الفجر</span><strong>${data.times.fajr?.timeLabel || '—'}</strong></div>
        <div class="prayer-hero-side-item"><span>المغرب</span><strong>${data.times.maghrib?.timeLabel || '—'}</strong></div>
        <div class="prayer-hero-side-item"><span>العشاء</span><strong>${data.times.isha?.timeLabel || '—'}</strong></div>
      </div>
    </section>
  `;
}

function prayerTrackingCard(date) {
  const today = prayerTodayISO();
  const done = PRAYER_ORDER.filter((key) => isPrayerDone(date, key)).length;
  const pct = Math.round((done / PRAYER_ORDER.length) * 100);
  const chips = PRAYER_ORDER.map((key) => {
    const isDone = isPrayerDone(date, key);
    const canMark = prayerCanMark(date, key);
    return `
      <button class="prayer-track-chip ${isDone ? 'done' : ''}" data-action="prayer-mark" data-date="${date}" data-key="${key}" ${canMark ? '' : 'disabled'} title="${isDone ? 'إلغاء تسجيل' : 'تسجيل'} صلاة ${PRAYER_LABELS[key]}">
        <span class="prayer-track-icon">${isDone ? icon('check', 14) : icon('circle', 14)}</span>
        <span>${PRAYER_LABELS[key]}</span>
      </button>
    `;
  }).join('');
  return `
    <section class="card prayer-track-card">
      <div class="card-head">
        <h3 class="card-title"><span class="icon-wrap" style="color:var(--accent)">${icon('check-circle', 17)}</span> متابعة الصلوات</h3>
        <span class="pill ${done === PRAYER_ORDER.length ? 'green' : 'muted'}">${done} / ${PRAYER_ORDER.length}</span>
      </div>
      <div class="card-body">
        <div class="prayer-track-head">
          <div>
            <strong>${date === today ? 'صلوات اليوم' : `صلوات ${formatDateMedium(date)}`}</strong>
            <p>التتبع اختياري وغير تقييمي، فقط لتعرف نمطك وتسجّل ما تحب متابعته.</p>
          </div>
          <div class="prayer-track-ring" style="--pct:${pct}"><strong>${pct}%</strong></div>
        </div>
        <div class="prayer-track-grid">${chips}</div>
        <div class="prayer-track-foot">
          <span class="text-muted small-text">${icon('info', 11)} يمكنك إلغاء أي تسجيل بالضغط عليه مرة أخرى.</span>
          <button class="ghost-btn small" data-action="prayer-stats" data-days="30">إحصاءات الشهر</button>
        </div>
      </div>
    </section>
  `;
}

function prayerStatsCard() {
  const days = Number(state.ui.prayerStatsDays) === 30 ? 30 : 7;
  const stats = prayerStats(days);
  const dayCount = Math.max(1, Math.round(stats.possible / PRAYER_ORDER.length));
  const bars = PRAYER_ORDER.map((key) => {
    const count = stats.byPrayer[key] || 0;
    const pct = Math.min(100, Math.round((count / dayCount) * 100));
    return `
      <div class="prayer-stat-row">
        <span>${PRAYER_LABELS[key]}</span>
        <div class="prayer-stat-bar"><i style="width:${pct}%"></i></div>
        <strong>${count}</strong>
      </div>
    `;
  }).join('');
  return `
    <section class="card prayer-stats-card">
      <div class="card-head">
        <h3 class="card-title"><span class="icon-wrap" style="color:var(--purple)">${icon('chart', 17)}</span> إحصاءات الصلاة</h3>
        <div class="tabs tab-scroll prayer-stats-tabs">
          <button class="${days === 7 ? 'active' : ''}" data-action="prayer-stats" data-days="7">أسبوع</button>
          <button class="${days === 30 ? 'active' : ''}" data-action="prayer-stats" data-days="30">شهر</button>
        </div>
      </div>
      <div class="card-body">
        <div class="prayer-stats-summary">
          <div><strong>${stats.done}</strong><span>تسجيل</span></div>
          <div><strong>${stats.rate}%</strong><span>من الممكن</span></div>
          <div><strong>${stats.completeDays}</strong><span>أيام كاملة</span></div>
        </div>
        <div class="prayer-stat-bars">${bars}</div>
        <p class="help mt-2">تُحسب النسبة من أول يوم سجّلت فيه صلاة حتى اليوم، وتبقى المتابعة اختيارية.</p>
      </div>
    </section>
  `;
}

function prayerHistoryCard() {
  const rows = prayerHistoryRows(14);
  const rowsHtml = rows.length ? rows.map((row) => `
    <div class="prayer-history-row ${row.isToday ? 'is-today' : ''}">
      <div class="prayer-history-date">
        <strong>${row.isToday ? 'اليوم' : dayName(row.date)}</strong>
        <span>${formatDateShort(row.date)}</span>
      </div>
      <div class="prayer-history-days">
        ${row.entries.map((entry) => `
          <button class="prayer-history-chip ${entry.done ? 'done' : ''}" data-action="prayer-mark" data-date="${row.date}" data-key="${entry.key}" ${prayerCanMark(row.date, entry.key) ? '' : 'disabled'} title="${entry.label} · ${entry.done ? 'مسجلة' : 'غير مسجلة'}">
            ${escapeHtml(entry.label)}
          </button>
        `).join('')}
      </div>
      <span class="prayer-history-count">${row.done}/5</span>
    </div>
  `).join('') : `<p class="text-muted small-text">لم تسجّل أي صلاة بعد. ابدأ من بطاقة المتابعة أعلاه.</p>`;
  return `
    <section class="card prayer-history-card">
      <div class="card-head">
        <h3 class="card-title"><span class="icon-wrap" style="color:var(--blue)">${icon('history', 17)}</span> سجل الصلوات</h3>
        <span class="pill muted">آخر 14 يومًا</span>
      </div>
      <div class="card-body">
        <div class="prayer-history-list">${rowsHtml}</div>
      </div>
    </section>
  `;
}

function prayerLocationInfoCard(settings) {
  const method = prayerMethodInfo(settings);
  const loc = settings.location;
  return `
    <section class="card prayer-info-card">
      <div class="card-head">
        <h3 class="card-title"><span class="icon-wrap" style="color:var(--blue)">${icon('map-pin', 17)}</span> الموقع والحساب</h3>
        <button class="card-link" data-action="prayer-open-settings">تعديل ${icon('arrow-left', 12)}</button>
      </div>
      <div class="card-body">
        <div class="prayer-location-line">
          <div class="prayer-location-mark">${icon('mosque', 18)}</div>
          <div>
            <strong>${escapeHtml(prayerLocationLabel(loc))}</strong>
            <span>${loc ? `${loc.lat.toFixed(3)}، ${loc.lng.toFixed(3)}` : '—'} · ${escapeHtml(loc?.timezone || TZ)}</span>
          </div>
        </div>
        <div class="kv"><span>طريقة الحساب</span><span>${escapeHtml(method.label)}</span></div>
        <div class="kv"><span>مذهب العصر</span><span>${escapeHtml(method.madhab)}</span></div>
        <div class="kv"><span>زوايا الحساب</span><span>${escapeHtml(method.angles || '—')}</span></div>
        <div class="kv"><span>القاعدة في العروض العالية</span><span>${escapeHtml(method.highLatitude)}</span></div>
        <div class="kv"><span>التعديلات اليدوية</span><span>${escapeHtml(method.adjustments)}</span></div>
        <div class="row wrap mt-3">
          <button class="soft-btn small" data-action="prayer-open-location">${icon('map-pin', 13)} تغيير الموقع</button>
          <button class="ghost-btn small" data-action="prayer-open-settings">${icon('sliders', 13)} طريقة الحساب</button>
        </div>
        <p class="help mt-2">المواقيت محسوبة فلكيًا من إحداثياتك، وقد تختلف دقائق يسيرة عن تقويم مسجدك المحلي. استخدم التعديلات اليدوية للمطابقة.</p>
      </div>
    </section>
  `;
}

function prayerAdhanCard(settings) {
  const rows = PRAYER_ORDER.map((key) => {
    const alert = settings.alerts[key];
    return `
      <div class="prayer-alert-row ${alert?.enabled ? 'on' : ''}" title="${escapeAttr(prayerSoundLabelFor(key, settings))}">
        <span class="prayer-alert-name">${PRAYER_LABELS[key]}</span>
        <span class="prayer-alert-mode">${prayerAlertModeLabel(alert?.mode)}${alert?.soundId ? ` · ${escapeHtml(adhanSoundOrFallback(alert.soundId).reciter)}` : ''}</span>
        ${prayerAlertBell(key, settings)}
      </div>
    `;
  }).join('');
  return `
    <section class="card prayer-adhan-card">
      <div class="card-head">
        <h3 class="card-title"><span class="icon-wrap" style="color:var(--warning)">${icon('volume', 17)}</span> الأذان والتنبيهات</h3>
        <div class="row wrap">
          <button class="card-link" data-action="prayer-open-library">${icon('database', 12)} المكتبة</button>
          <button class="card-link" data-action="prayer-open-adhan">إعداد ${icon('arrow-left', 12)}</button>
        </div>
      </div>
      <div class="card-body">
        <div class="prayer-sound-current">
          <span>${icon('volume', 13)} الصوت المختار</span>
          <strong>${escapeHtml(adhanSoundLabel(settings.adhanSound))}</strong>
        </div>
        ${rows}
        <div class="prayer-volume-line">
          <span>مستوى الصوت</span>
          <div class="prayer-volume-bar"><i style="width:${Math.round((settings.volume || 0.8) * 100)}%"></i></div>
          <strong>${Math.round((settings.volume || 0.8) * 100)}%</strong>
        </div>
        <div class="row wrap mt-2">
          <button class="soft-btn small" data-action="prayer-test-sound" data-mode="full">${icon('play', 12)} تجربة الأذان</button>
          <button class="ghost-btn small" data-action="prayer-open-library">${icon('database', 12)} مكتبة الأذان</button>
          <button class="ghost-btn small" data-action="prayer-stop-sound">${icon('volume-x', 12)} إيقاف</button>
        </div>
        <p class="help mt-2">التنبيهات تعمل أثناء فتح التطبيق فقط. لا يمكن تشغيل الأذان بعد إغلاق المتصفح بالكامل دون Web Push وخادم، وهذا غير مفعّل في النسخة المحلية.</p>
      </div>
    </section>
  `;
}

function prayerOnboarding() {
  return `
    <div class="view-fade prayer-view">
      ${pageHead('الصلاة', 'مواقيت دقيقة من موقعك، وطريقة حساب تختارها أنت', `
        <button class="soft-btn" data-action="prayer-open-settings">${icon('sliders', 14)} طريقة الحساب</button>
      `)}
      <section class="card prayer-onboarding">
        <div class="prayer-onboarding-orb">${icon('mosque', 34)}</div>
        <div class="prayer-onboarding-body">
          <span class="prayer-hero-kicker">قبل عرض المواقيت</span>
          <h2>حدّد موقعك أولًا</h2>
          <p>لن نعرض أي مواقيت افتراضية أو ثابتة. نحسب المواقيت فلكيًا من إحداثيات موقعك باستخدام مكتبة Adhan، ثم نعرضها بتوقيت مدينتك.</p>
          <div class="prayer-onboarding-actions">
            <button class="primary-btn" data-action="prayer-detect-location">${icon('compass', 15)} تحديد موقعي تلقائيًا</button>
            <button class="soft-btn" data-action="prayer-open-location">${icon('search', 15)} اختيار مدينة يدويًا</button>
          </div>
          <div class="prayer-onboarding-features">
            <div><span>${icon('clock', 17)}</span><strong>خمس صلوات + الشروق</strong><p>عد تنازلي حي، وتحديد الصلاة الحالية والقادمة.</p></div>
            <div><span>${icon('sliders', 17)}</span><strong>طرق حساب موثوقة</strong><p>رابطة العالم الإسلامي، أم القرى، مصر، كراتشي وغيرها.</p></div>
            <div><span>${icon('volume', 17)}</span><strong>أذان لكل صلاة</strong><p>كامل أو مقتطف قصير أو صامت، مع تجربة فورية.</p></div>
          </div>
        </div>
      </section>
      <div class="banner mt-3">
        <span class="banner-icon">${icon('info', 16)}</span>
        <div>
          <strong>الموقع يبقى على جهازك</strong>
          <p>يُحفظ الموقع محليًا في قاعدة بيانات المتصفح. يُستخدم للبحث عن اسم المدينة والمنطقة الزمنية عبر خدمات عامة، ولا يُرسل إلى خادم تابع لنا.</p>
        </div>
      </div>
    </div>
  `;
}

function renderPrayer() {
  const settings = getPrayerSettings();
  if (!settings.location) {
    dom.view.innerHTML = prayerOnboarding();
    return;
  }
  if (!state.ui.prayerDate) state.ui.prayerDate = prayerTodayISO();
  const date = prayerSelectedDate();
  const today = prayerTodayISO();
  const data = prayerTimesForDate(date);
  const next = nextPrayerToday();
  const current = currentPrayerToday();

  if (!data) {
    dom.view.innerHTML = `
      <div class="view-fade prayer-view">
        ${pageHead('الصلاة', 'تعذر حساب المواقيت', `
          <button class="soft-btn" data-action="prayer-open-settings">${icon('sliders', 14)} طريقة الحساب</button>
          <button class="primary-btn" data-action="prayer-open-location">${icon('map-pin', 14)} الموقع</button>
        `)}
        <section class="card prayer-onboarding">
          <div class="prayer-onboarding-orb" style="color:var(--warning)">${icon('alert', 32)}</div>
          <div class="prayer-onboarding-body">
            <h2>لم نتمكن من حساب المواقيت</h2>
            <p>راجع إحداثيات الموقع وطريقة الحساب. إذا كنت في عرض جغرافي عالٍ فقد تحتاج قاعدة مختلفة للعروض العالية.</p>
            <div class="prayer-onboarding-actions">
              <button class="primary-btn" data-action="prayer-open-location">${icon('map-pin', 15)} مراجعة الموقع</button>
              <button class="soft-btn" data-action="prayer-open-settings">${icon('sliders', 15)} مراجعة طريقة الحساب</button>
            </div>
          </div>
        </section>
      </div>
    `;
    return;
  }

  const method = prayerMethodInfo(settings);
  const methodShort = `${method.label} · ${method.madhab}`;
  const dateLabel = formatDateLong(date);
  const hijri = prayerHijriLabel(date);
  const rows = PRAYER_KEYS.map((key) => prayerTimesRow(date, data, key, next, current, settings)).join('');
  const isToday = date === today;

  dom.view.innerHTML = `
    <div class="view-fade prayer-view">
      ${pageHead('الصلاة', 'مواقيت محسوبة من موقعك — لا بيانات ثابتة أو افتراضية', `
        <button class="soft-btn" data-action="prayer-open-adhan">${icon('volume', 14)} الأذان</button>
        <button class="soft-btn" data-action="prayer-open-location">${icon('map-pin', 14)} الموقع</button>
        <button class="primary-btn" data-action="prayer-open-settings">${icon('sliders', 14)} إعدادات الحساب</button>
      `)}

      <div class="prayer-layout">
        <div class="stack">
          ${prayerHeroCard(date, data, next, current, settings)}

          <section class="card prayer-times-card">
            <div class="card-head prayer-times-head">
              <div>
                <h3 class="card-title"><span class="icon-wrap">${icon('clock', 17)}</span> مواقيت ${isToday ? 'اليوم' : 'اليوم المحدد'}</h3>
                <div class="section-sub">${dateLabel}${hijri ? ` · ${hijri}` : ''}</div>
              </div>
              <div class="prayer-date-nav">
                <button class="icon-btn" data-action="prayer-prev" title="اليوم السابق">${icon('chevron-right', 16)}</button>
                <input type="date" value="${date}" data-prayer-date aria-label="اختيار تاريخ المواقيت">
                <button class="icon-btn" data-action="prayer-next" title="اليوم التالي">${icon('chevron-left', 16)}</button>
                ${isToday ? '' : `<button class="ghost-btn small" data-action="prayer-today">${icon('calendar', 12)} اليوم</button>`}
              </div>
            </div>
            <div class="card-body">
              <div class="prayer-method-strip">
                <span>${icon('compass', 12)} ${escapeHtml(methodShort)}</span>
                <span>${icon('map-pin', 12)} ${escapeHtml(prayerLocationLabel(settings.location))}</span>
              </div>
              <div class="prayer-times-list">${rows}</div>
              ${isToday ? '' : `<div class="banner warning mt-3"><span class="banner-icon">${icon('info', 15)}</span><div><strong>أنت تعرض يومًا آخر</strong><p>التتبع متاح للأيام السابقة، أما الصلوات القادمة فلا يمكن تسجيلها قبل دخول وقتها.</p></div></div>`}
            </div>
          </section>

          ${prayerTrackingCard(date)}
          ${prayerHistoryCard()}
        </div>

        <div class="stack">
          ${prayerLocationInfoCard(settings)}
          ${prayerAdhanCard(settings)}
          ${prayerStatsCard()}
          ${prayerNotificationBanner()}
          <div class="banner">
            <span class="banner-icon">${icon('info', 15)}</span>
            <div>
              <strong>دقة المواقيت</strong>
              <p>الحساب فلكي وقد يختلف دقيقة أو دقيقتين عن تقويم مسجدك. اختر الطريقة المعتمدة في بلدك، وعدّل الدقائق يدويًا عند الحاجة. لا تُستخدم أي مواقيت ثابتة أو مخزنة مسبقًا.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* =========================================================
   نافذة الموقع
   ========================================================= */
function renderPrayerCityResults(results, query = '') {
  const box = document.querySelector('[data-prayer-city-results]');
  if (!box) return;
  if (!results.length) {
    box.innerHTML = `<p class="text-muted small-text" style="padding:8px 2px">${query ? `لا نتائج مطابقة لـ «${escapeHtml(query)}». جرّب اسمًا آخر أو أدخل الإحداثيات يدويًا.` : 'اكتب اسم مدينة للبحث.'}</p>`;
    return;
  }
  box.innerHTML = results.map((item) => {
    const meta = [item.admin1, item.country, item.timezone].filter(Boolean).join(' · ');
    return `
      <button class="prayer-city-result" data-action="prayer-use-city"
        data-lat="${item.lat}" data-lng="${item.lng}"
        data-name="${escapeAttr(item.name)}" data-country="${escapeAttr(item.country || '')}"
        data-timezone="${escapeAttr(item.timezone || '')}">
        <span class="prayer-city-pin">${icon('map-pin', 15)}</span>
        <span class="prayer-city-text"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(meta || 'بدون تفاصيل')}</span></span>
        ${icon('arrow-left', 14)}
      </button>
    `;
  }).join('');
}

async function searchPrayerCitiesFromUI() {
  const input = document.querySelector('[data-prayer-city-search]');
  const box = document.querySelector('[data-prayer-city-results]');
  if (!input || !box) return;
  const query = input.value.trim();
  if (query.length < 2) {
    box.innerHTML = `<p class="text-muted small-text" style="padding:8px 2px">اكتب حرفين على الأقل للبحث.</p>`;
    return;
  }
  box.innerHTML = `<p class="text-muted small-text" style="padding:8px 2px">جارٍ البحث عن «${escapeHtml(query)}»…</p>`;
  const results = await searchPrayerCities(query);
  renderPrayerCityResults(results, query);
}

async function detectPrayerLocationFromUI(button) {
  const original = button?.innerHTML;
  if (button) {
    button.disabled = true;
    button.innerHTML = `${icon('compass', 14)} جارٍ تحديد الموقع…`;
  }
  try {
    const location = await detectPrayerLocation();
    await setPrayerLocation(location);
    closeAllModals();
    refreshUI();
  } catch (error) {
    const denied = error?.code === 1 || /denied|permission/i.test(String(error?.message || ''));
    showToast({
      type: 'error',
      title: denied ? 'تم رفض إذن الموقع' : 'تعذر تحديد الموقع',
      message: denied
        ? 'اسمح بالوصول للموقع من إعدادات المتصفح، أو اختر مدينتك يدويًا.'
        : 'قد يكون الموقع غير متاح أو الاتصال ضعيفًا. اختر مدينتك يدويًا أو أدخل الإحداثيات.'
    });
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = original;
    }
  }
}

async function applyPrayerCityFromButton(button) {
  const lat = Number(button.dataset.lat);
  const lng = Number(button.dataset.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    showToast({ type: 'error', title: 'بيانات المدينة غير صالحة' });
    return;
  }
  button.disabled = true;
  try {
    const tz = isPrayerTimeZone(button.dataset.timezone)
      ? button.dataset.timezone
      : (await timezoneForCoordinates(lat, lng)) || TZ;
    await setPrayerLocation({
      lat,
      lng,
      city: button.dataset.name || '',
      country: button.dataset.country || '',
      timezone: tz,
      source: 'city'
    });
    closeAllModals();
    refreshUI();
  } catch (error) {
    showToast({ type: 'error', title: 'تعذر حفظ المدينة', message: error.message });
    button.disabled = false;
  }
}

function openPrayerLocationModal() {
  const settings = getPrayerSettings();
  const loc = settings.location;
  openModal({
    title: 'موقع الصلاة',
    subtitle: 'اختر موقعك لتُحسب المواقيت بدقة — لا مواقيت افتراضية',
    size: 'lg',
    content: `
      <div class="prayer-current-location">
        <div class="prayer-location-mark">${icon('map-pin', 18)}</div>
        <div>
          <strong>${loc ? escapeHtml(prayerLocationLabel(loc)) : 'لم يُحدد الموقع بعد'}</strong>
          <span>${loc ? `${loc.lat.toFixed(4)}، ${loc.lng.toFixed(4)} · ${escapeHtml(loc.timezone)}` : 'لن تظهر المواقيت حتى تحدد موقعًا.'}</span>
        </div>
        ${loc ? `<span class="pill green">محفوظ</span>` : ''}
      </div>

      <div class="prayer-location-methods">
        <div class="prayer-location-method">
          <div class="prayer-method-icon">${icon('compass', 20)}</div>
          <div class="prayer-method-body">
            <strong>استخدام موقعي الحالي</strong>
            <p>يطلب المتصفح إذن الموقع، ثم نحدد اسم المدينة والمنطقة الزمنية تلقائيًا.</p>
          </div>
          <button class="primary-btn small" data-action="prayer-detect-location">${icon('compass', 13)} تحديد تلقائي</button>
        </div>

        <div class="prayer-location-method is-column">
          <div class="prayer-method-head">
            <div class="prayer-method-icon">${icon('search', 20)}</div>
            <div class="prayer-method-body">
              <strong>البحث عن مدينة</strong>
              <p>اكتب اسم المدينة بالعربية أو الإنجليزية. النتائج من خدمة Open-Meteo العامة.</p>
            </div>
          </div>
          <div class="prayer-city-search">
            <input type="search" data-prayer-city-search placeholder="مثال: مسقط، القاهرة، مكة" aria-label="البحث عن مدينة">
            <button class="soft-btn" data-action="prayer-city-search">${icon('search', 14)} بحث</button>
          </div>
          <div class="prayer-city-results" data-prayer-city-results>
            <p class="text-muted small-text" style="padding:8px 2px">اكتب اسم مدينتك لعرض النتائج.</p>
          </div>
        </div>

        <form id="prayer-location-form" data-form="prayer-location-manual" class="prayer-location-manual">
          <div class="prayer-method-head">
            <div class="prayer-method-icon">${icon('map-pin', 20)}</div>
            <div class="prayer-method-body">
              <strong>إدخال الإحداثيات يدويًا</strong>
              <p>للمواقع التي لا تظهر في البحث. المنطقة الزمنية تُكتشف تلقائيًا عند الحفظ.</p>
            </div>
          </div>
          <div class="form-grid">
            <div class="field">
              <label for="prayer-lat">خط العرض</label>
              <input id="prayer-lat" name="lat" type="number" step="0.0001" min="-90" max="90" placeholder="23.5859" value="${loc ? loc.lat : ''}" required>
            </div>
            <div class="field">
              <label for="prayer-lng">خط الطول</label>
              <input id="prayer-lng" name="lng" type="number" step="0.0001" min="-180" max="180" placeholder="58.4059" value="${loc ? loc.lng : ''}" required>
            </div>
            <div class="field">
              <label for="prayer-city">المدينة</label>
              <input id="prayer-city" name="city" type="text" maxlength="80" placeholder="مسقط" value="${loc ? escapeAttr(loc.city || '') : ''}">
            </div>
            <div class="field">
              <label for="prayer-country">الدولة</label>
              <input id="prayer-country" name="country" type="text" maxlength="80" placeholder="عُمان" value="${loc ? escapeAttr(loc.country || '') : ''}">
            </div>
          </div>
          <button class="soft-btn small mt-2" type="submit">${icon('check', 13)} حفظ الإحداثيات</button>
        </form>
      </div>
      <div class="banner mt-3">
        <span class="banner-icon">${icon('info', 15)}</span>
        <div>
          <strong>ملاحظة عن الدقة</strong>
          <p>كشف الموقع عبر GPS قد يكون تقريبيًا داخل المباني. يمكنك اختيار المدينة من القائمة أو إدخال إحداثيات أدق. تُحفظ آخر إحداثيات محلية وتُستخدم عند إعادة فتح التطبيق.</p>
        </div>
      </div>
    `,
    footer: `<button class="ghost-btn" data-modal-close>إغلاق</button>`
  });
}

/* =========================================================
   نافذة إعدادات الحساب
   ========================================================= */
function openPrayerSettingsModal() {
  const settings = getPrayerSettings();
  const calc = settings.calculation;
  const methodOptions = CALCULATION_METHODS.map((method) => `
    <option value="${method.key}" ${calc.method === method.key ? 'selected' : ''}>${escapeHtml(method.label)}</option>
  `).join('');
  const adjustmentInputs = PRAYER_KEYS.map((key) => `
    <div class="field prayer-adjust-field">
      <label for="prayer-adj-${key}">${PRAYER_LABELS[key]}</label>
      <input id="prayer-adj-${key}" name="adj_${key}" type="number" min="-60" max="60" step="1" value="${calc.adjustments[key]}">
      <span class="help">دقيقة</span>
    </div>
  `).join('');

  openModal({
    title: 'إعدادات حساب المواقيت',
    subtitle: 'اختر الطريقة المعتمدة في بلدك، وعدّل الدقائق عند الحاجة',
    size: 'lg',
    content: `
      <form id="prayer-settings-form" data-form="prayer-settings">
        <div class="prayer-settings-grid">
          <div class="field full">
            <label for="prayer-method">طريقة الحساب</label>
            <select id="prayer-method" name="method">${methodOptions}</select>
            <span class="help">اختر الطريقة الرسمية في بلدك أو أقرب طريقة معتمدة لديك.</span>
          </div>

          <div class="field">
            <label for="prayer-madhab">مذهب حساب العصر</label>
            <select id="prayer-madhab" name="madhab">
              <option value="shafi" ${calc.madhab === 'shafi' ? 'selected' : ''}>الشافعي / الجمهور (الظل = مثله)</option>
              <option value="hanafi" ${calc.madhab === 'hanafi' ? 'selected' : ''}>الحنفي (الظل = مثليه)</option>
            </select>
            <span class="help">يغيّر وقت العصر فقط، وقد يختلف نحو 40–60 دقيقة.</span>
          </div>

          <div class="field">
            <label for="prayer-high-lat">قاعدة العروض العالية</label>
            <select id="prayer-high-lat" name="highLatitudeRule">
              <option value="middleofthenight" ${calc.highLatitudeRule === 'middleofthenight' ? 'selected' : ''}>منتصف الليل</option>
              <option value="seventhofthenight" ${calc.highLatitudeRule === 'seventhofthenight' ? 'selected' : ''}>سُبع الليل</option>
              <option value="twilightangle" ${calc.highLatitudeRule === 'twilightangle' ? 'selected' : ''}>زاوية الشفق</option>
            </select>
            <span class="help">تُستخدم في المدن ذات العروض العالية حيث يصعب تحديد الفجر والعشاء.</span>
          </div>

          <div class="field">
            <label for="prayer-custom-fajr">زاوية الفجر المخصصة</label>
            <input id="prayer-custom-fajr" name="customFajrAngle" type="number" min="0" max="30" step="0.1" value="${calc.customFajrAngle}">
            <span class="help">تُستخدم فقط مع طريقة «مخصصة».</span>
          </div>

          <div class="field">
            <label for="prayer-custom-isha">زاوية العشاء المخصصة</label>
            <input id="prayer-custom-isha" name="customIshaAngle" type="number" min="0" max="30" step="0.1" value="${calc.customIshaAngle}">
            <span class="help">تُستخدم فقط مع طريقة «مخصصة».</span>
          </div>
        </div>

        <div class="section-title mt-3 mb-2">تعديلات الدقائق لكل صلاة</div>
        <p class="section-sub mb-2">أضف أو اطرح دقائق لمطابقة تقويم مسجدك. القيمة الموجبة تؤخر الوقت.</p>
        <div class="prayer-adjust-grid">${adjustmentInputs}</div>

        <div class="section-title mt-3 mb-2">التنبيه والمتابعة</div>
        <div class="prayer-toggle-list">
          <label class="prayer-toggle-row">
            <span><strong>تنبيه قبل الصلاة</strong><small>تذكير صوتي/مرئي قبل دخول الوقت</small></span>
            <input type="checkbox" name="preReminderEnabled" ${settings.preReminder.enabled ? 'checked' : ''}>
          </label>
          <div class="field prayer-inline-field">
            <label for="prayer-pre-minutes">قبل كم دقيقة؟</label>
            <select id="prayer-pre-minutes" name="preReminderMinutes">
              ${[5, 10, 15, 20, 30, 45, 60].map((min) => `<option value="${min}" ${settings.preReminder.minutes === min ? 'selected' : ''}>${min} دقيقة</option>`).join('')}
            </select>
          </div>
          <label class="prayer-toggle-row">
            <span><strong>تفعيل متابعة الصلوات</strong><small>تسجيل اختياري لصلواتك وإحصاءات لطيفة</small></span>
            <input type="checkbox" name="trackingEnabled" ${settings.tracking.enabled ? 'checked' : ''}>
          </label>
          <label class="prayer-toggle-row">
            <span><strong>تنبيهات توافق المواعيد</strong><small>إظهار ملاحظة عند اقتراب مهمة أو تذكير من وقت الصلاة</small></span>
            <input type="checkbox" name="awareness" ${settings.awareness ? 'checked' : ''}>
          </label>
        </div>

        <div class="banner mt-3">
          <span class="banner-icon">${icon('info', 15)}</span>
          <div>
            <strong>كيف تُحسب المواقيت؟</strong>
            <p>يعتمد التطبيق على مكتبة Adhan مفتوحة المصدر (MIT). تُحسب المواقيت من إحداثياتك وتاريخ اليوم وطريقة الحساب، ثم تُعرض بتوقيت المدينة المختارة. لا تُستخدم قيم ثابتة أو مواقيت محفوظة مسبقًا.</p>
          </div>
        </div>
      </form>
    `,
    footer: `
      <button class="ghost-btn" data-modal-close>إلغاء</button>
      <div class="spacer"></div>
      <button class="primary-btn" type="submit" form="prayer-settings-form">${icon('check', 15)} حفظ الإعدادات</button>
    `
  });
}

/* =========================================================
   نافذة الأذان والتنبيهات
   ========================================================= */
function openPrayerAdhanModal() {
  const settings = getPrayerSettings();
  const rows = PRAYER_ORDER.map((key) => {
    const alert = settings.alerts[key];
    return `
      <div class="prayer-adhan-setting ${alert?.enabled ? 'on' : ''}">
        <div class="prayer-adhan-setting-main">
          <span class="prayer-adhan-setting-icon">${icon(PRAYER_ICONS[key] || 'clock', 16)}</span>
          <div>
            <strong>${PRAYER_LABELS[key]}</strong>
            <span>${prayerAlertModeLabel(alert?.mode)} · ${escapeHtml(adhanSoundOrFallback(prayerSoundIdFor(key, settings)).reciter)}</span>
          </div>
        </div>
        <div class="prayer-adhan-controls">
          <label class="switch">
            <input type="checkbox" name="alert_${key}_enabled" ${alert?.enabled ? 'checked' : ''}>
            <span></span>
          </label>
          <select name="alert_${key}_mode" aria-label="نوع تنبيه ${PRAYER_LABELS[key]}">
            <option value="full" ${alert?.mode === 'full' ? 'selected' : ''}>أذان كامل</option>
            <option value="short" ${alert?.mode === 'short' ? 'selected' : ''}>مقتطف 12 ثانية</option>
            <option value="silent" ${alert?.mode === 'silent' ? 'selected' : ''}>صامت</option>
          </select>
        </div>
      </div>
    `;
  }).join('');

  openModal({
    title: 'الأذان والتنبيهات',
    subtitle: 'تحكم مستقل لكل صلاة — الصوت داخل التطبيق فقط',
    size: 'lg',
    content: `
      <form id="prayer-adhan-form" data-form="prayer-adhan">
        ${prayerNotificationBanner()}

        <div class="section-title mt-3 mb-2">المؤذن والصوت</div>
        ${prayerAdhanLibrarySummary(settings)}

        <div class="section-title mt-3 mb-2">نوع التنبيه لكل صلاة</div>
        <p class="help mb-2">هذه الإعدادات تحدّد هل يُشغّل الصوت كاملًا أو مقتطفًا قصيرًا أو بلا صوت. لتغيير المؤذن أو تخصيص صوت مختلف لكل صلاة، افتح مكتبة الأذان.</p>
        <div class="prayer-adhan-list">${rows}</div>

        <div class="field mt-3">
          <label for="prayer-volume">مستوى صوت الأذان</label>
          <div class="prayer-volume-control">
            <input id="prayer-volume" name="volume" type="range" min="0" max="100" step="5" value="${Math.round((settings.volume || 0.8) * 100)}">
            <span class="pill muted" data-prayer-volume-label>${Math.round((settings.volume || 0.8) * 100)}%</span>
          </div>
          <span class="help">قد يمنع المتصفح الصوت التلقائي قبل أول تفاعل مع الصفحة، لذلك شغّل تجربة الأذان مرة واحدة بعد فتح التطبيق. الصوت يتبع مستوى صوت الجهاز، وقد يُكتم في وضع عدم الإزعاج أو الصامت.</span>
        </div>

        <div class="row wrap mt-2">
          <button class="soft-btn small" type="button" data-action="prayer-test-sound" data-mode="full">${icon('play', 12)} تجربة الصوت المختار كاملًا</button>
          <button class="soft-btn small" type="button" data-action="prayer-test-sound" data-mode="short">${icon('play', 12)} تجربة المقتطف</button>
          <button class="ghost-btn small" type="button" data-action="prayer-stop-sound">${icon('volume-x', 12)} إيقاف الصوت</button>
          <button class="ghost-btn small" type="button" data-action="prayer-open-library">${icon('database', 12)} مكتبة الأذان</button>
        </div>

        <div class="banner warning mt-3">
          <span class="banner-icon">${icon('alert', 16)}</span>
          <div>
            <strong>حدود مهمة — اقرأها قبل الاعتماد على الأذان</strong>
            <p>هذه النسخة لا تشغّل الأذان بعد إغلاق المتصفح أو التطبيق بالكامل. التنبيهات تعمل أثناء فتح الصفحة فقط، مع فحص كل 20 ثانية. لتشغيل الأذان في الخلفية أو بعد الإغلاق يلزم Web Push عبر خادم ومفاتيح VAPID، أو تطبيق أصلي — ولم يُنفّذ ذلك هنا بعد.</p>
          </div>
        </div>

        <p class="help mt-2">مصادر الأصوات: أصوات مضمنة في التطبيق، وتسجيلات من Wikimedia Commons برخص موثّقة، وملفاتك الخاصة. التفاصيل والروابط في <code>assets/sounds/ADHAN-CREDITS.md</code> وREADME.</p>
      </form>
    `,
    footer: `
      <button class="ghost-btn" data-modal-close>إلغاء</button>
      <div class="spacer"></div>
      <button class="soft-btn" type="button" data-action="prayer-open-library">${icon('database', 14)} مكتبة الأذان</button>
      <button class="primary-btn" type="submit" form="prayer-adhan-form">${icon('check', 15)} حفظ إعدادات الأذان</button>
    `
  });
}
