/* =========================================================
   نظامي — أدوات مساعدة (تواريخ، أيقونات، تنسيق)
   المرجع الزمني: Asia/Muscat (UTC+04:00)
   ========================================================= */
'use strict';

const TZ = 'Asia/Muscat';
const TZ_OFFSET = '+04:00';
const TZ_OFFSET_MINUTES = 240;
const MS_DAY = 86400000;

const WEEKDAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const WEEKDAYS_SHORT = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const WEEKDAYS_MIN = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const PRIORITY_LABELS = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' };
const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };
const TASK_STATUS_LABELS = { new: 'جديدة', progress: 'قيد التنفيذ', done: 'مكتملة', postponed: 'مؤجلة' };
const REPEAT_LABELS = {
  once: 'مرة واحدة',
  daily: 'يوميًا',
  weekly: 'أسبوعيًا',
  monthly: 'شهريًا',
  weekdays: 'أيام محددة',
  custom: 'تكرار مخصص'
};
const ACTION_LABELS = {
  create: 'إضافة',
  update: 'تعديل',
  delete: 'حذف',
  complete: 'إكمال',
  uncomplete: 'إلغاء إكمال',
  snooze: 'تأجيل',
  pause: 'إيقاف مؤقت',
  resume: 'استئناف',
  progress: 'تحديث تقدم',
  download: 'تنزيل'
};
const ENTITY_LABELS = {
  habit: 'عادة',
  task: 'مهمة',
  goal: 'هدف',
  milestone: 'مرحلة',
  sleep: 'سجل نوم',
  reminder: 'تذكير',
  prayer: 'صلاة',
  adhan_audio: 'صوت أذان',
  settings: 'إعدادات',
  finance_account: 'حساب مالي',
  finance_category: 'تصنيف مالي',
  finance_transaction: 'معاملة مالية',
  finance_obligation: 'التزام/قسط',
  finance_obligation_payment: 'سداد التزام',
  finance_debt: 'دين',
  finance_debt_payment: 'سداد دين',
  finance_savings_goal: 'هدف ادخار',
  finance_savings_entry: 'حركة ادخار',
  finance_budget: 'ميزانية',
  finance_income_schedule: 'جدول راتب',
  finance_settings: 'إعدادات مالية'
};
const ACTIVITY_COLORS = {
  create: 'green',
  update: 'blue',
  delete: 'danger',
  complete: 'green',
  uncomplete: 'warning',
  snooze: 'warning',
  pause: 'warning',
  resume: 'blue',
  progress: 'purple',
  download: 'blue',
  pay: 'green',
  transfer: 'blue',
  receive: 'green',
  lock: 'warning'
};
const PRAYER_ACTIVITY_TYPES = ['prayer'];

const HABIT_COLORS = ['#35e0b5', '#6c8cff', '#b58cff', '#ffc857', '#ff9f6b', '#ff8fc7', '#45d6df', '#8ed081'];
const GOAL_COLORS = ['#b58cff', '#6c8cff', '#35e0b5', '#ffc857', '#ff9f6b', '#ff8fc7'];

/* ---------------- أيقونات ---------------- */
const ICON_PATHS = {
  home: '<path d="m3 9.5 9-7 9 7V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.2 12.2 2.6 2.6 5-5.2"/>',
  'list-check': '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1.4 1.4L7 4.8M3 12l1.4 1.4L7 10.8M3 18l1.4 1.4L7 16.8"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  moon: '<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/>',
  history: '<path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flame: '<path d="M8.5 14.5A4.5 4.5 0 0 1 12 2c1 3 4 4.5 4 8a5.5 5.5 0 0 1-11 0c0-1.5.5-3 1.5-4"/><path d="M12 22a4 4 0 0 0 4-4c0-2-1.5-3.5-2.5-5-.5 1.5-1.5 2-1.5 2s-1-1-1-2.5c-1.5 1.5-3 3-3 5.5a4 4 0 0 0 4 4Z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 16v-5M12 16V7M17 16v-8"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  upload: '<path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  filter: '<path d="M4 4h16l-6 8v6l-4 2v-8Z"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  play: '<path d="m7 4 13 8-13 8Z"/>',
  alarm: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M5 3 2 6M22 6l-3-3"/>',
  sparkles: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="M19 17v4M17 19h4M5 3v3M3.5 4.5h3"/>',
  trending: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/>',
  bed: '<path d="M3 20V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11"/><path d="M3 17h18M7 7V5M17 7V5"/><path d="M7 14h.01M17 14h.01"/>',
  sunrise: '<path d="M12 2v6M4.9 9.9 6.3 11.3M19.1 9.9l-1.4 1.4M2 18h20M8 18a4 4 0 1 1 8 0M17 22H7"/>',
  coffee: '<path d="M18 8h1a3 3 0 0 1 0 6h-1"/><path d="M3 8h15v7a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Z"/><path d="M7 3v2M11 3v2M15 3v2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  alert: '<path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  more: '<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>',
  'arrow-left': '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  flag: '<path d="M4 22V4c4-3 8 3 12 0v10c-4 3-8-3-12 0"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  minus: '<path d="M5 12h14"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  zap: '<path d="M13 2 3 14h8l-1 8 10-12h-8Z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
  droplet: '<path d="M12 2.7 6.3 8.4a8 8 0 1 0 11.4 0Z"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 6-10 16-10 0 10-4 16-10 16Z"/><path d="M4 21c2-6 6-9 11-11"/>',
  dumbbell: '<path d="M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12"/>',
  wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7H5a2 2 0 0 1-2-2Z"/><path d="M17 13h.01"/>',
  star: '<path d="m12 2 3 6.3 6.9 1-5 4.9 1.2 6.8-6.1-3.2L5.9 21 7 14.2l-5-4.9 6.9-1Z"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  'map-pin': '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  volume: '<path d="M11 5 6 9H2v6h4l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  'volume-x': '<path d="M11 5 6 9H2v6h4l5 4Z"/><path d="m16 9 5 6M21 9l-5 6"/>',
  mosque: '<path d="M4 21V11l8-6 8 6v10"/><path d="M9 21v-6a3 3 0 0 1 6 0v6"/><path d="M2 21h20M12 5V3"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 15v2"/>',
  unlock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/><path d="M12 15v2"/>',
  bank: '<path d="M3 10 12 3l9 7"/><path d="M5 10v11M19 10v11M9 21v-6h6v6"/><path d="M2 21h20"/>',
  'credit-card': '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/>',
  receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2Z"/><path d="M9 8h6M9 12h6"/>',
  'piggy-bank': '<path d="M19 9c1.2 1 2 2.4 2 4 0 1.2-.4 2.3-1 3.2V19a1 1 0 0 1-1 1h-2v-2H9v2H7a1 1 0 0 1-1-1v-1.5A5 5 0 0 1 4 13c0-3.3 2.7-6 6-6h5l2-3v5Z"/><path d="M15 9h.01"/><path d="M8 7V4"/>',
  scale: '<path d="M12 3v18M7 21h10"/><path d="M5 7h14"/><path d="m5 7-3 7h6Z"/><path d="m19 7-3 7h6Z"/>',
  shield: '<path d="M12 3 20 6v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6Z"/><path d="m9 12 2 2 4-4"/>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
  percent: '<path d="m19 5-14 14"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  'arrow-down-left': '<path d="M17 7 7 17M17 17H7V7"/>',
  'arrow-up-right': '<path d="M7 17 17 7M7 7h10v10"/>'
};

function icon(name, size = 18) {
  const paths = ICON_PATHS[name] || ICON_PATHS.circle;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

/* ---------------- معرّفات ونصوص ---------------- */
function uid(prefix = 'id') {
  let random;
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    random = window.crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  } else {
    random = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }
  return `${prefix}_${random}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
const escapeAttr = escapeHtml;

function nl2br(value) {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function round(value, digits = 1) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(value) || 0) * factor) / factor;
}

/* ---------------- التواريخ (Asia/Muscat) ---------------- */
function pad2(n) { return String(n).padStart(2, '0'); }

function todayISO() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

function nowWallParts() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
    seconds: get('second'),
    dateTime: `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`
  };
}

function nowHHMM() { return nowWallParts().time; }

/** تاريخ ISO (YYYY-MM-DD) -> Date بمنتصف النهار UTC لتفادي مشاكل المناطق */
function parseISODate(iso) {
  if (!iso || typeof iso !== 'string') return new Date(NaN);
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`);
}

function dateToISO(date) {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function addDaysISO(iso, days) {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + Number(days || 0));
  return dateToISO(d);
}

function diffDaysISO(a, b) {
  return Math.round((parseISODate(b) - parseISODate(a)) / MS_DAY);
}

function dayOfWeek(iso) { return parseISODate(iso).getUTCDay(); }
function dayOfMonth(iso) { return Number(iso.slice(8, 10)); }
function yearOfISO(iso) { return Number(iso.slice(0, 4)); }
function monthOfISO(iso) { return Number(iso.slice(5, 7)); }

function startOfWeekISO(iso) { return addDaysISO(iso, -dayOfWeek(iso)); }
function endOfWeekISO(iso) { return addDaysISO(startOfWeekISO(iso), 6); }
function startOfMonthISO(iso) { return `${iso.slice(0, 7)}-01`; }
function endOfMonthISO(iso) { return addDaysISO(startOfMonthISO(addMonthsISO(iso, 1)), -1); }

function addMonthsISO(iso, months) {
  const y = yearOfISO(iso);
  const m = monthOfISO(iso) - 1 + Number(months || 0);
  const targetY = y + Math.floor(m / 12);
  const targetM = ((m % 12) + 12) % 12;
  const maxDay = new Date(Date.UTC(targetY, targetM + 1, 0)).getUTCDate();
  const day = Math.min(Number(iso.slice(8, 10)), maxDay);
  return `${targetY}-${pad2(targetM + 1)}-${pad2(day)}`;
}

function addMonthsToMonth(iso, months) {
  return startOfMonthISO(addMonthsISO(startOfMonthISO(iso), months));
}

function getWeekDates(iso) {
  const start = startOfWeekISO(iso);
  return Array.from({ length: 7 }, (_, i) => addDaysISO(start, i));
}

function getMonthGrid(iso) {
  const first = startOfMonthISO(iso);
  const gridStart = startOfWeekISO(first);
  return Array.from({ length: 42 }, (_, i) => addDaysISO(gridStart, i));
}

function getMonthCalendarDays(iso) {
  const first = startOfMonthISO(iso);
  const last = endOfMonthISO(iso);
  const start = startOfWeekISO(first);
  const end = endOfWeekISO(last);
  const total = diffDaysISO(start, end) + 1;
  return Array.from({ length: total }, (_, i) => addDaysISO(start, i));
}

function weekNumber(iso) {
  const d = parseISODate(iso);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  return 1 + Math.round((target - firstThursday) / (7 * MS_DAY));
}

function formatDate(iso, options = {}) {
  if (!iso) return '';
  const defaults = { weekday: undefined, day: 'numeric', month: 'long', year: undefined };
  const opts = { ...defaults, ...options, timeZone: 'UTC' };
  try {
    return new Intl.DateTimeFormat('ar-OM-u-nu-latn', opts).format(parseISODate(iso));
  } catch {
    return iso;
  }
}

function formatDateLong(iso) {
  return formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function formatDateMedium(iso) {
  return formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long' });
}
function formatDateShort(iso) {
  return formatDate(iso, { day: 'numeric', month: 'short' });
}
function formatMonthYear(iso) {
  return formatDate(iso, { month: 'long', year: 'numeric' });
}
function dayName(iso) { return WEEKDAYS_AR[dayOfWeek(iso)]; }
function dayNameShort(iso) { return WEEKDAYS_SHORT[dayOfWeek(iso)]; }

function relativeDateLabel(iso) {
  if (!iso) return '';
  const today = todayISO();
  const diff = diffDaysISO(today, iso);
  if (diff === 0) return 'اليوم';
  if (diff === 1) return 'غدًا';
  if (diff === -1) return 'أمس';
  if (diff > 1 && diff <= 6) return dayName(iso);
  return formatDateShort(iso);
}

function formatTimeHM(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return '';
  const [hStr, mStr] = hhmm.split(':');
  let h = Number(hStr);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? 'م' : 'ص';
  h = h % 12 || 12;
  return `${h}:${pad2(Number(mStr) || 0)} ${suffix}`;
}

function timeToMinutes(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(minutes) {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(normalized / 60))}:${pad2(normalized % 60)}`;
}

function wallEpoch(date, time = '00:00') {
  if (!date) return NaN;
  return Date.parse(`${date.slice(0, 10)}T${(time || '00:00').slice(0, 5)}:00${TZ_OFFSET}`);
}

function diffWallMinutes(startDate, startTime, endDate, endTime) {
  const start = wallEpoch(startDate, startTime);
  const end = wallEpoch(endDate, endTime);
  return Math.round((end - start) / 60000);
}

function formatTimestamp(ts, opts = {}) {
  if (!ts) return '';
  const date = new Date(Number(ts));
  const options = {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...opts
  };
  try {
    return new Intl.DateTimeFormat('ar-OM-u-nu-latn', options).format(date);
  } catch {
    return date.toISOString();
  }
}

function formatTimestampFull(ts) {
  return formatTimestamp(ts, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(ts) {
  if (!ts) return '';
  const seconds = Math.max(0, (Date.now() - Number(ts)) / 1000);
  if (seconds < 45) return 'الآن';
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    return m === 1 ? 'منذ دقيقة' : m === 2 ? 'منذ دقيقتين' : `منذ ${m} دقيقة`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    return h === 1 ? 'منذ ساعة' : h === 2 ? 'منذ ساعتين' : `منذ ${h} ساعات`;
  }
  const days = Math.floor(seconds / 86400);
  if (days === 1) return 'أمس';
  if (days === 2) return 'منذ يومين';
  if (days <= 10) return `منذ ${days} أيام`;
  return formatTimestamp(ts, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDuration(totalMinutes, mode = 'full') {
  const minutes = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (mode === 'compact') {
    if (h === 0) return `${m}د`;
    if (m === 0) return `${h}س`;
    return `${h}س ${m}د`;
  }
  if (h === 0) return `${m} دقيقة`;
  if (m === 0) return `${h} ساعة`;
  return `${h} س ${m} د`;
}

function formatHours(totalMinutes) {
  return round((Number(totalMinutes) || 0) / 60, 1);
}

function formatWallRange(startDate, startTime, endDate, endTime) {
  const sameDay = startDate === endDate;
  if (sameDay) return `${formatTimeHM(startTime)} — ${formatTimeHM(endTime)}`;
  return `${formatDateShort(startDate)} ${formatTimeHM(startTime)} — ${formatDateShort(endDate)} ${formatTimeHM(endTime)}`;
}

function datetimeLocalValue(date, time) {
  return `${date || todayISO()}T${(time || nowHHMM()).slice(0, 5)}`;
}

function splitDatetimeLocal(value) {
  if (!value) return { date: todayISO(), time: '00:00' };
  const [date, time] = value.split('T');
  return { date: date || todayISO(), time: (time || '00:00').slice(0, 5) };
}

/* ---------------- تجميع وحسابات ---------------- */
function sum(list, pick = (x) => x) {
  return list.reduce((acc, item) => acc + (Number(pick(item)) || 0), 0);
}
function average(list, pick = (x) => x) {
  return list.length ? sum(list, pick) / list.length : 0;
}
function groupBy(list, keyFn) {
  const map = new Map();
  for (const item of list) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}
function sortBy(list, keyFn, direction = 'asc') {
  const factor = direction === 'desc' ? -1 : 1;
  return [...list].sort((a, b) => {
    const av = keyFn(a);
    const bv = keyFn(b);
    if (av == bv) return 0;
    return av > bv ? factor : -factor;
  });
}
function uniqueBy(list, keyFn) {
  const seen = new Set();
  return list.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function debounce(fn, wait = 220) {
  let timer = null;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}
function greeting() {
  const hour = Number(nowWallParts().time.split(':')[0]);
  if (hour < 5) return 'طاب مساؤك';
  if (hour < 12) return 'صباح الخير';
  if (hour < 17) return 'طاب يومك';
  if (hour < 20) return 'مساء الخير';
  return 'طاب مساؤك';
}
function percent(part, total) {
  if (!total) return 0;
  return clamp(Math.round((part / total) * 100), 0, 100);
}
