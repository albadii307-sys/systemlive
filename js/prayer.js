/* =========================================================
   نظامي — محرك مواقيت الصلاة والأذان والتنبيهات والتتبع
   الحسابات: Adhan.js (MIT) — لا تُعرض أي مواقيت بدون موقع
   ========================================================= */
'use strict';

const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

const PRAYER_LABELS = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء'
};

const PRAYER_ICONS = {
  fajr: 'sunrise',
  sunrise: 'sunrise',
  dhuhr: 'sun',
  asr: 'sun',
  maghrib: 'sunrise',
  isha: 'moon'
};

const CALCULATION_METHODS = [
  { key: 'MuslimWorldLeague', label: 'رابطة العالم الإسلامي', note: 'شائعة في أوروبا وأجزاء من العالم الإسلامي' },
  { key: 'Egyptian', label: 'الهيئة المصرية العامة للمساحة', note: 'طريقة مصرية معتمدة' },
  { key: 'Karachi', label: 'جامعة العلوم الإسلامية — كراتشي', note: 'شائعة في باكستان والهند' },
  { key: 'UmmAlQura', label: 'أم القرى — مكة المكرمة', note: 'العشاء بعد المغرب بـ 90 دقيقة' },
  { key: 'Dubai', label: 'دبي', note: 'طريقة دائرة الشؤون الإسلامية' },
  { key: 'Qatar', label: 'قطر', note: 'طريقة قطر الرسمية' },
  { key: 'Kuwait', label: 'الكويت', note: 'طريقة الكويت الرسمية' },
  { key: 'MoonsightingCommittee', label: 'لجنة رؤية الهلال', note: 'تعتمد على رؤية الهلال' },
  { key: 'Singapore', label: 'سنغافورة', note: 'طريقة سنغافورة' },
  { key: 'Turkey', label: 'تركيا', note: 'طريقة رئاسة الشؤون الدينية التركية' },
  { key: 'Tehran', label: 'طهران', note: 'طريقة جامعة طهران' },
  { key: 'NorthAmerica', label: 'أمريكا الشمالية — ISNA', note: 'شائعة في أمريكا وكندا' },
  { key: 'Other', label: 'مخصصة', note: 'حدد زوايا الفجر والعشاء بنفسك' }
];

const HIGH_LATITUDE_LABELS = {
  middleofthenight: 'منتصف الليل',
  seventhofthenight: 'سُبع الليل',
  twilightangle: 'زاوية الشفق'
};

const ADHAN_DEFAULT_SOUND = 'andrewler';

const PRAYER_DEFAULT_SETTINGS = {
  version: 1,
  location: null,
  calculation: {
    method: 'MuslimWorldLeague',
    madhab: 'shafi',
    highLatitudeRule: 'middleofthenight',
    customFajrAngle: 18,
    customIshaAngle: 17,
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }
  },
  volume: 0.8,
  adhanSound: ADHAN_DEFAULT_SOUND,
  alerts: {
    fajr: { enabled: true, mode: 'full', soundId: null },
    dhuhr: { enabled: true, mode: 'full', soundId: null },
    asr: { enabled: true, mode: 'short', soundId: null },
    maghrib: { enabled: true, mode: 'full', soundId: null },
    isha: { enabled: true, mode: 'short', soundId: null }
  },
  preReminder: { enabled: false, minutes: 10 },
  tracking: { enabled: true, startedAt: null },
  awareness: true
};

const PRAYER_ALERT_MODE_LABELS = {
  full: 'أذان كامل',
  short: 'مقتطف قصير',
  silent: 'صامت'
};

const ADHAN_SHORT_SECONDS = 12;

const ADHAN_SOUNDS = [
  {
    id: 'andrewler',
    type: 'builtin',
    file: 'assets/sounds/adhan-full.ogg',
    label: 'أذان هادئ',
    reciter: 'Andrewler',
    style: 'أذان كامل بتسجيل واضح',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Azan.ogg',
    credit: 'Andrewler — Wikimedia Commons',
    note: 'التسجيل الافتراضي، مناسب للاستماع اليومي.',
    duration: 183,
    size: 1473809,
    mime: 'application/ogg'
  },
  {
    id: 'sabah-fakhry',
    type: 'builtin',
    file: 'assets/sounds/adhan-sabah-fakhry.mp3',
    label: 'أذان الشيخ صباح فخري',
    reciter: 'الشيخ صباح فخري',
    style: 'أذان شامي تاريخي',
    license: 'ملكية عامة',
    licenseUrl: 'https://commons.wikimedia.org/wiki/Commons:Copyright_tags',
    source: 'https://commons.wikimedia.org/wiki/File:Call_to_prayer_by_Sabah_Fakhry.mp3',
    credit: 'الشيخ صباح فخري — Wikimedia Commons',
    note: 'تسجيل تاريخي بصوت المؤذن صباح فخري.',
    duration: 158,
    size: 2530742,
    mime: 'audio/mpeg'
  },
  {
    id: 'adam-synagda',
    type: 'builtin',
    file: 'assets/sounds/adhan-beautiful.ogg',
    label: 'أذان عذب',
    reciter: 'Adam Synagda',
    style: 'أذان قصير بنبرة هادئة',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg',
    credit: 'Adam Synagda — Wikimedia Commons',
    note: 'مسجّل برخصة CC0، يمكن استخدامه دون قيود.',
    duration: 154,
    size: 1229032,
    mime: 'application/ogg'
  }
];

function isAdhanSoundId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(id);
}

function adhanSoundById(id) {
  const builtin = ADHAN_SOUNDS.find((sound) => sound.id === id);
  if (builtin) return builtin;
  if (typeof adhanLibrarySoundById === 'function') {
    const local = adhanLibrarySoundById(id);
    if (local) return local;
  }
  if (typeof adhanCatalogSoundById === 'function') {
    const remote = adhanCatalogSoundById(id);
    if (remote) return remote;
  }
  return null;
}

function adhanSoundOrFallback(id) {
  return adhanSoundById(id) || adhanSoundById(ADHAN_DEFAULT_SOUND);
}

function adhanSoundLabel(id) {
  const sound = adhanSoundOrFallback(id);
  return `${sound.label} — ${sound.reciter}`;
}

function prayerSoundIdFor(key, settings = getPrayerSettings()) {
  const assigned = settings.alerts?.[key]?.soundId;
  if (assigned && adhanSoundById(assigned)) return assigned;
  if (settings.adhanSound && adhanSoundById(settings.adhanSound)) return settings.adhanSound;
  return ADHAN_DEFAULT_SOUND;
}

function prayerSoundLabelFor(key, settings = getPrayerSettings()) {
  return adhanSoundLabel(prayerSoundIdFor(key, settings));
}

let prayerTimesCache = new Map();
let prayerLiveTimer = null;
let prayerAlertTimer = null;
let prayerLiveSignature = '';
let prayerLastDay = '';
let prayerAudioEl = null;
let prayerAudioSoundId = null;
let prayerShortStop = null;

/* =========================================================
   الإعدادات والتخزين
   ========================================================= */
function isPrayerTimeZone(timeZone) {
  if (!timeZone || typeof timeZone !== 'string') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

function normalizePrayerLocation(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return {
    lat: Math.round(lat * 100000) / 100000,
    lng: Math.round(lng * 100000) / 100000,
    city: String(raw.city || '').trim(),
    country: String(raw.country || '').trim(),
    timezone: isPrayerTimeZone(raw.timezone) ? raw.timezone : (isPrayerTimeZone(raw.tz) ? raw.tz : TZ),
    source: ['gps', 'city', 'manual', 'import'].includes(raw.source) ? raw.source : 'manual',
    updatedAt: Number(raw.updatedAt) || Date.now()
  };
}

function normalizePrayerSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const calc = source.calculation && typeof source.calculation === 'object' ? source.calculation : {};
  const alerts = source.alerts && typeof source.alerts === 'object' ? source.alerts : {};
  const methodKeys = CALCULATION_METHODS.map((item) => item.key);
  const normalizedAlerts = {};
  for (const key of PRAYER_ORDER) {
    const item = alerts[key] && typeof alerts[key] === 'object' ? alerts[key] : {};
    normalizedAlerts[key] = {
      enabled: item.enabled !== false,
      mode: PRAYER_ALERT_MODE_LABELS[item.mode] ? item.mode : (key === 'asr' || key === 'isha' ? 'short' : 'full'),
      soundId: isAdhanSoundId(item.soundId) ? item.soundId : null
    };
  }
  return {
    version: 1,
    location: normalizePrayerLocation(source.location),
    calculation: {
      method: methodKeys.includes(calc.method) ? calc.method : 'MuslimWorldLeague',
      madhab: calc.madhab === 'hanafi' ? 'hanafi' : 'shafi',
      highLatitudeRule: HIGH_LATITUDE_LABELS[calc.highLatitudeRule] ? calc.highLatitudeRule : 'middleofthenight',
      customFajrAngle: clamp(Number(calc.customFajrAngle ?? 18), 0, 30),
      customIshaAngle: clamp(Number(calc.customIshaAngle ?? 17), 0, 30),
      adjustments: Object.fromEntries(PRAYER_KEYS.map((key) => [
        key,
        clamp(Number(calc.adjustments?.[key] ?? 0), -60, 60)
      ]))
    },
    volume: clamp(Number(source.volume ?? 0.8), 0, 1),
    adhanSound: isAdhanSoundId(source.adhanSound) ? source.adhanSound : ADHAN_DEFAULT_SOUND,
    alerts: normalizedAlerts,
    preReminder: {
      enabled: Boolean(source.preReminder?.enabled),
      minutes: [5, 10, 15, 20, 30, 45, 60].includes(Number(source.preReminder?.minutes))
        ? Number(source.preReminder.minutes) : 10
    },
    tracking: {
      enabled: source.tracking?.enabled !== false,
      startedAt: Number(source.tracking?.startedAt) || null
    },
    awareness: source.awareness !== false
  };
}

function mergePrayerSettings(base, patch) {
  const safeBase = normalizePrayerSettings(base);
  if (!patch || typeof patch !== 'object') return safeBase;
  const merged = {
    ...safeBase,
    ...patch,
    location: Object.prototype.hasOwnProperty.call(patch, 'location')
      ? normalizePrayerLocation(patch.location)
      : safeBase.location,
    calculation: {
      ...safeBase.calculation,
      ...(patch.calculation || {}),
      adjustments: {
        ...safeBase.calculation.adjustments,
        ...((patch.calculation || {}).adjustments || {})
      }
    },
    alerts: { ...safeBase.alerts },
    preReminder: { ...safeBase.preReminder, ...(patch.preReminder || {}) },
    tracking: { ...safeBase.tracking, ...(patch.tracking || {}) }
  };
  if (patch.alerts && typeof patch.alerts === 'object') {
    for (const key of PRAYER_ORDER) {
      if (patch.alerts[key]) merged.alerts[key] = { ...safeBase.alerts[key], ...patch.alerts[key] };
    }
  }
  return normalizePrayerSettings(merged);
}

function getPrayerSettings() {
  if (!state.settings.prayer || typeof state.settings.prayer !== 'object') {
    state.settings.prayer = normalizePrayerSettings(null);
  }
  return state.settings.prayer;
}

async function savePrayerSettings(patch) {
  const merged = mergePrayerSettings(getPrayerSettings(), patch);
  if (merged.tracking.enabled && !merged.tracking.startedAt) merged.tracking.startedAt = Date.now();
  await saveSettings({ prayer: merged });
  state.settings.prayer = merged;
  invalidatePrayerCache();
  return merged;
}

function invalidatePrayerCache() {
  prayerTimesCache = new Map();
  prayerLiveSignature = '';
}

function prayerTimezone() {
  const location = getPrayerSettings().location;
  return location && isPrayerTimeZone(location.timezone) ? location.timezone : TZ;
}

function prayerTodayISO() {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: prayerTimezone(),
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  } catch {
    return todayISO();
  }
}

function prayerSelectedDate() {
  return state.ui.prayerDate || prayerTodayISO();
}

function prayerNowLabel() {
  try {
    return new Intl.DateTimeFormat('ar-OM-u-nu-latn', {
      timeZone: prayerTimezone(),
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date());
  } catch {
    return formatTimeHM(nowHHMM());
  }
}

function prayerLocationLabel(location = getPrayerSettings().location) {
  if (!location) return 'لم يُحدد الموقع';
  const place = [location.city, location.country].filter(Boolean).join('، ');
  return place || `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}`;
}

function prayerHijriLabel(dateISO) {
  try {
    const formatted = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(parseISODate(dateISO));
    return /هـ\s*$/.test(formatted) ? formatted : `${formatted} هـ`;
  } catch {
    return '';
  }
}

/* =========================================================
   الحساب والتنسيق
   ========================================================= */
function buildCalculationParams(settings) {
  const methodKey = settings.calculation.method;
  const methods = (typeof adhan !== 'undefined' && adhan.CalculationMethod) ? adhan.CalculationMethod : {};
  const factory = typeof methods[methodKey] === 'function' ? methods[methodKey] : methods.MuslimWorldLeague;
  if (typeof factory !== 'function') return null;
  const params = factory();
  if (methodKey === 'Other') {
    params.fajrAngle = settings.calculation.customFajrAngle;
    params.ishaAngle = settings.calculation.customIshaAngle;
    params.ishaInterval = 0;
  }
  if (typeof adhan !== 'undefined' && adhan.Madhab) {
    params.madhab = settings.calculation.madhab === 'hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
  }
  if (typeof adhan !== 'undefined' && adhan.HighLatitudeRule) {
    const rule = adhan.HighLatitudeRule;
    params.highLatitudeRule = settings.calculation.highLatitudeRule === 'seventhofthenight'
      ? rule.SeventhOfTheNight
      : settings.calculation.highLatitudeRule === 'twilightangle'
        ? rule.TwilightAngle
        : rule.MiddleOfTheNight;
  }
  params.adjustments = { ...settings.calculation.adjustments };
  return params;
}

function timeInPrayerZone(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hourCycle: 'h23',
      hour: '2-digit',
      minute: '2-digit'
    }).formatToParts(date);
    const get = (type) => parts.find((part) => part.type === type)?.value || '00';
    return `${get('hour')}:${get('minute')}`;
  } catch {
    return `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
  }
}

function prayerTimesForDate(dateISO, force = false) {
  const settings = getPrayerSettings();
  if (!settings.location || typeof adhan === 'undefined') return null;
  const signature = [
    dateISO,
    settings.location.lat,
    settings.location.lng,
    settings.location.timezone,
    settings.calculation.method,
    settings.calculation.madhab,
    settings.calculation.highLatitudeRule,
    settings.calculation.customFajrAngle,
    settings.calculation.customIshaAngle,
    ...PRAYER_KEYS.map((key) => settings.calculation.adjustments[key])
  ].join('|');
  if (!force && prayerTimesCache.has(signature)) return prayerTimesCache.get(signature);
  const params = buildCalculationParams(settings);
  if (!params) return null;
  try {
    const [year, month, day] = dateISO.split('-').map(Number);
    const civilDate = new Date(year, month - 1, day, 12, 0, 0);
    const coords = new adhan.Coordinates(settings.location.lat, settings.location.lng);
    const calculated = new adhan.PrayerTimes(coords, civilDate, params);
    const times = {};
    for (const key of PRAYER_KEYS) {
      const value = calculated[key];
      if (!(value instanceof Date) || Number.isNaN(value.getTime())) continue;
      const hhmm = timeInPrayerZone(value, settings.location.timezone);
      times[key] = {
        key,
        label: PRAYER_LABELS[key],
        epoch: value.getTime(),
        hhmm,
        timeLabel: formatTimeHM(hhmm)
      };
    }
    if (!times.fajr || !times.isha) return null;
    const result = {
      date: dateISO,
      timezone: settings.location.timezone,
      times,
      list: PRAYER_KEYS.map((key) => times[key]).filter(Boolean),
      params,
      method: settings.calculation.method,
      madhab: settings.calculation.madhab,
      calculatedAt: Date.now()
    };
    prayerTimesCache.set(signature, result);
    if (prayerTimesCache.size > 80) {
      const firstKey = prayerTimesCache.keys().next().value;
      prayerTimesCache.delete(firstKey);
    }
    return result;
  } catch (error) {
    console.error('[نظامي] تعذر حساب مواقيت الصلاة', error);
    return null;
  }
}

function nextPrayerToday() {
  const today = prayerTodayISO();
  const data = prayerTimesForDate(today);
  if (!data) return null;
  const now = Date.now();
  const list = PRAYER_ORDER.map((key) => data.times[key]).filter(Boolean);
  let next = list.find((item) => item.epoch > now) || null;
  let nextDate = today;
  let tomorrow = false;
  if (!next) {
    const tomorrowDate = addDaysISO(today, 1);
    const tomorrowData = prayerTimesForDate(tomorrowDate);
    if (tomorrowData?.times?.fajr) {
      next = tomorrowData.times.fajr;
      nextDate = tomorrowDate;
      tomorrow = true;
    }
  }
  if (!next) return null;
  const current = [...list].reverse().find((item) => item.epoch <= now) || null;
  return {
    ...next,
    date: nextDate,
    isTomorrow: tomorrow,
    current,
    remainingMs: Math.max(0, next.epoch - now)
  };
}

function currentPrayerToday() {
  const data = prayerTimesForDate(prayerTodayISO());
  if (!data) return null;
  const now = Date.now();
  return [...PRAYER_ORDER.map((key) => data.times[key]).filter(Boolean)]
    .reverse()
    .find((item) => item.epoch <= now) || null;
}

function prayerDayProgress(next, current) {
  if (!next) return 0;
  const start = current ? current.epoch : next.epoch - 6 * 3600000;
  const span = Math.max(1, next.epoch - start);
  return clamp(Math.round(((Date.now() - start) / span) * 100), 0, 100);
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(Number(ms) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

function prayerMethodInfo(settings = getPrayerSettings()) {
  const method = CALCULATION_METHODS.find((item) => item.key === settings.calculation.method) || CALCULATION_METHODS[0];
  const params = buildCalculationParams(settings);
  let angles = '';
  if (params) {
    if (Number(params.ishaInterval) > 0) {
      angles = `زاوية الفجر ${params.fajrAngle}° · العشاء بعد المغرب بـ ${params.ishaInterval} دقيقة`;
    } else {
      angles = `زاوية الفجر ${params.fajrAngle}° · زاوية العشاء ${params.ishaAngle}°`;
    }
  }
  const adjustments = PRAYER_KEYS
    .filter((key) => Number(settings.calculation.adjustments[key]) !== 0)
    .map((key) => `${PRAYER_LABELS[key]} ${settings.calculation.adjustments[key] > 0 ? '+' : ''}${settings.calculation.adjustments[key]} د`)
    .join(' · ');
  return {
    label: method.label,
    note: method.note,
    angles,
    madhab: settings.calculation.madhab === 'hanafi' ? 'الحنفي' : 'الشافعي (الجمهور)',
    highLatitude: HIGH_LATITUDE_LABELS[settings.calculation.highLatitudeRule] || '',
    adjustments: adjustments || 'لا توجد تعديلات يدوية'
  };
}

/* =========================================================
   الموقع الجغرافي — واجهات حقيقية فقط
   ========================================================= */
async function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('المتصفح لا يدعم تحديد الموقع'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 300000
    });
  });
}

async function reversePrayerGeocode(lat, lng) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=ar`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('[نظامي] تعذر جلب اسم المدينة', error);
    return null;
  }
}

async function timezoneForCoordinates(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&timezone=auto&forecast_days=1`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return '';
    const data = await response.json();
    return isPrayerTimeZone(data.timezone) ? data.timezone : '';
  } catch (error) {
    console.warn('[نظامي] تعذر تحديد المنطقة الزمنية', error);
    return '';
  }
}

async function searchPrayerCities(query) {
  const trimmed = String(query || '').trim();
  if (trimmed.length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=12&language=ar&format=json`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];
    return results.map((item) => ({
      name: item.name || '',
      country: item.country || '',
      admin1: item.admin1 || '',
      lat: Number(item.latitude),
      lng: Number(item.longitude),
      timezone: isPrayerTimeZone(item.timezone) ? item.timezone : ''
    })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  } catch (error) {
    console.warn('[نظامي] تعذر البحث عن المدينة', error);
    return [];
  }
}

async function detectPrayerLocation() {
  const position = await getBrowserPosition();
  const lat = Math.round(position.coords.latitude * 100000) / 100000;
  const lng = Math.round(position.coords.longitude * 100000) / 100000;
  const [reverse, timezone] = await Promise.all([
    reversePrayerGeocode(lat, lng),
    timezoneForCoordinates(lat, lng)
  ]);
  const city = reverse?.city || reverse?.locality || reverse?.principalSubdivision || 'موقعي الحالي';
  const country = reverse?.countryName || reverse?.countryCode || '';
  return normalizePrayerLocation({
    lat,
    lng,
    city,
    country,
    timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || TZ,
    source: 'gps',
    updatedAt: Date.now()
  });
}

async function setPrayerLocation(location, { silent = false } = {}) {
  const normalized = normalizePrayerLocation(location);
  if (!normalized) throw new Error('إحداثيات الموقع غير صالحة');
  const settings = await savePrayerSettings({ location: normalized });
  state.ui.prayerDate = prayerTodayISO();
  prayerLastDay = prayerTodayISO();
  if (!silent) {
    showToast({
      title: 'تم حفظ موقع الصلاة',
      message: `${prayerLocationLabel(settings.location)} · ${settings.location.timezone}`
    });
  }
  if (state.view === 'prayer' || state.view === 'dashboard' || state.view === 'settings') refreshUI();
  return settings.location;
}

/* =========================================================
   تتبع الصلوات
   ========================================================= */
function prayerLogId(dateISO, key) {
  return `pl_${dateISO.replace(/-/g, '')}_${key}`;
}

function prayerLogFor(dateISO, key) {
  if (!Array.isArray(state.data.prayerLogs)) state.data.prayerLogs = [];
  return state.data.prayerLogs.find((log) => log.date === dateISO && log.prayer === key) || null;
}

function isPrayerDone(dateISO, key) {
  return Boolean(prayerLogFor(dateISO, key));
}

function prayerCanMark(dateISO, key) {
  const today = prayerTodayISO();
  if (dateISO < today) return true;
  if (dateISO > today) return false;
  const data = prayerTimesForDate(dateISO);
  if (!data || !data.times[key]) return true;
  return Date.now() >= data.times[key].epoch - 60000;
}

async function markPrayerDone(dateISO, key) {
  if (!PRAYER_ORDER.includes(key)) throw new Error('صلاة غير معروفة');
  if (!prayerCanMark(dateISO, key)) throw new Error('لم يحن وقت هذه الصلاة بعد');
  const existing = prayerLogFor(dateISO, key);
  if (existing) return existing;
  const log = {
    id: prayerLogId(dateISO, key),
    date: dateISO,
    prayer: key,
    done: true,
    doneAt: Date.now(),
    updatedAt: Date.now()
  };
  try {
    await DB.put('prayer_logs', log);
  } catch (error) {
    const duplicate = String(error?.name || '').includes('Constraint') || String(error?.message || '').includes('constraint');
    if (!duplicate) throw error;
    await loadStore('prayer_logs');
    return prayerLogFor(dateISO, key);
  }
  await logActivity('complete', 'prayer', log.id, `صلاة ${PRAYER_LABELS[key]}`, null, log, { date: dateISO });
  await loadStore('prayer_logs');
  if (!getPrayerSettings().tracking.startedAt) {
    await savePrayerSettings({ tracking: { enabled: true, startedAt: Date.now() } });
  }
  return log;
}

async function unmarkPrayerDone(dateISO, key) {
  const existing = prayerLogFor(dateISO, key);
  if (!existing) return null;
  await DB.remove('prayer_logs', existing.id);
  await logActivity('uncomplete', 'prayer', existing.id, `صلاة ${PRAYER_LABELS[key]}`, existing, null, { date: dateISO });
  await loadStore('prayer_logs');
  return existing;
}

async function togglePrayerDone(dateISO, key) {
  if (isPrayerDone(dateISO, key)) return unmarkPrayerDone(dateISO, key);
  return markPrayerDone(dateISO, key);
}

function prayerStats(days = 7) {
  const period = days === 30 ? 30 : 7;
  const today = prayerTodayISO();
  const rangeStart = addDaysISO(today, -(period - 1));
  const logs = (state.data.prayerLogs || []).filter((log) => log.date >= rangeStart && log.date <= today);
  const firstDate = sortBy((state.data.prayerLogs || []).map((log) => log.date), (date) => date)[0] || '';
  const startDate = firstDate && firstDate > rangeStart ? firstDate : rangeStart;
  const dayCount = Math.max(1, diffDaysISO(startDate, today) + 1);
  const byPrayer = {};
  for (const key of PRAYER_ORDER) byPrayer[key] = logs.filter((log) => log.prayer === key).length;
  const done = logs.length;
  const possible = dayCount * PRAYER_ORDER.length;
  const completeDays = [];
  for (let i = 0; i < dayCount; i++) {
    const date = addDaysISO(today, -i);
    if (PRAYER_ORDER.every((key) => logs.some((log) => log.date === date && log.prayer === key))) {
      completeDays.push(date);
    }
  }
  return {
    days: period,
    startDate,
    logs,
    byPrayer,
    done,
    possible,
    rate: possible ? clamp(Math.round((done / possible) * 100), 0, 100) : 0,
    completeDays: completeDays.length,
    trackedDays: new Set(logs.map((log) => log.date)).size
  };
}

function prayerHistoryRows(days = 21) {
  const today = prayerTodayISO();
  const rows = [];
  for (let i = 0; i < days; i++) {
    const date = addDaysISO(today, -i);
    const entries = PRAYER_ORDER.map((key) => ({ key, label: PRAYER_LABELS[key], done: isPrayerDone(date, key) }));
    const done = entries.filter((entry) => entry.done).length;
    if (date !== today && done === 0) continue;
    rows.push({
      date,
      entries,
      done,
      isToday: date === today,
      hijri: prayerHijriLabel(date)
    });
  }
  return rows;
}

/* =========================================================
   الإشعارات والصوت
   ========================================================= */
function prayerNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function loadPrayerNotified() {
  try {
    const raw = localStorage.getItem('nizami_prayer_notified_v1');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePrayerNotified(map) {
  try {
    const cutoff = Date.now() - 8 * 86400000;
    const cleaned = Object.fromEntries(Object.entries(map).filter(([, timestamp]) => Number(timestamp) > cutoff));
    localStorage.setItem('nizami_prayer_notified_v1', JSON.stringify(cleaned));
  } catch (error) {
    console.warn('[نظامي] تعذر حفظ حالة إشعارات الصلاة', error);
  }
}

async function getPrayerAudio(soundId, urlOverride = null) {
  const sound = adhanSoundById(soundId);
  if (!sound && !urlOverride) throw new Error('الصوت المحدد غير متاح');
  const url = urlOverride || (typeof resolveAdhanSoundUrl === 'function'
    ? await resolveAdhanSoundUrl(sound)
    : sound.file);
  const key = urlOverride ? `url:${url}` : `sound:${sound.id}`;
  if (!prayerAudioEl || prayerAudioSoundId !== key) {
    if (prayerAudioEl) {
      try {
        prayerAudioEl.pause();
        prayerAudioEl.removeAttribute('src');
        prayerAudioEl.load();
      } catch {}
    }
    prayerAudioEl = new Audio(url);
    prayerAudioEl.preload = 'auto';
    prayerAudioSoundId = key;
  }
  return prayerAudioEl;
}

function unlockPrayerAudio() {
  const sound = adhanSoundOrFallback(getPrayerSettings().adhanSound);
  if (!sound) return;
  getPrayerAudio(sound.id)
    .then((audio) => audio.load())
    .catch(() => {});
}

function stopPrayerSound() {
  clearTimeout(prayerShortStop);
  prayerShortStop = null;
  if (prayerAudioEl) {
    try {
      prayerAudioEl.pause();
      prayerAudioEl.currentTime = 0;
    } catch {}
  }
}

async function playPrayerSound(mode = 'full', { notifyOnError = true, soundId = null } = {}) {
  if (mode === 'silent') return;
  const settings = getPrayerSettings();
  const sound = adhanSoundById(soundId || settings.adhanSound);
  if (!sound) {
    if (notifyOnError) {
      showToast({
        type: 'warning',
        title: 'الصوت غير متاح',
        message: 'اختر صوتًا آخر من مكتبة الأذان.'
      });
    }
    return;
  }
  stopPrayerSound();
  try {
    const audio = await getPrayerAudio(sound.id);
    audio.volume = clamp(Number(settings.volume) || 0.8, 0, 1);
    audio.currentTime = 0;
    const promise = audio.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch((error) => {
        console.warn('[نظامي] تعذر تشغيل صوت الأذان', error);
        if (notifyOnError) {
          showToast({
            type: 'warning',
            title: 'تعذر تشغيل الصوت',
            message: 'تفاعل مع الصفحة أولًا أو اسمح بالصوت من إعدادات المتصفح. الصوت لا يعمل بعد إغلاق التطبيق.'
          });
        }
      });
    }
    if (mode === 'short') {
      prayerShortStop = setTimeout(stopPrayerSound, ADHAN_SHORT_SECONDS * 1000);
    }
  } catch (error) {
    console.warn('[نظامي] تعذر تشغيل صوت الأذان', error);
    if (notifyOnError) {
      showToast({
        type: 'warning',
        title: 'تعذر تشغيل الصوت',
        message: error?.message || 'تحقق من اتصال الإنترنت أو أنزل الصوت من مكتبة الأذان أولًا.'
      });
    }
  }
}

function testPrayerSound(mode = 'full', soundId = null) {
  if (mode === 'silent') {
    showToast({ type: 'info', title: 'الوضع الصامت مختار', message: 'لن يُشغّل صوت عند التنبيه.' });
    return;
  }
  const sound = adhanSoundById(soundId || getPrayerSettings().adhanSound);
  if (!sound) {
    showToast({ type: 'warning', title: 'الصوت غير متاح', message: 'اختر صوتًا من مكتبة الأذان أولًا.' });
    return;
  }
  playPrayerSound(mode, { soundId: sound.id });
  const remote = typeof isAdhanSoundDownloaded === 'function' && !isAdhanSoundDownloaded(sound.id) && sound.type === 'external';
  showToast({
    type: 'info',
    title: mode === 'short' ? `تجربة المقتطف — ${sound.reciter}` : `تجربة الأذان — ${sound.reciter}`,
    message: remote
      ? 'معاينة من المكتبة الخارجية عبر الإنترنت. أنزل الصوت ليعمل دون اتصال.'
      : 'اضغط إيقاف الصوت لإيقافه في أي وقت.',
    actions: [{ label: 'إيقاف الصوت', action: stopPrayerSound }],
    duration: 9000
  });
}

function prayerAlertTitle(key, pre = false) {
  return `${pre ? 'اقتربت صلاة' : 'حان وقت صلاة'} ${PRAYER_LABELS[key]}`;
}

function firePrayerAlert(key, time, pre = false) {
  const settings = getPrayerSettings();
  const location = settings.location;
  const title = prayerAlertTitle(key, pre);
  const body = `${time.timeLabel} · ${prayerLocationLabel(location)}${pre ? ` · بعد ${settings.preReminder.minutes} دقيقة` : ''}`;
  const alert = settings.alerts[key];
  if (alert?.enabled && alert.mode !== 'silent') {
    playPrayerSound(pre ? 'short' : alert.mode, { soundId: prayerSoundIdFor(key, settings) });
  }
  showBrowserNotification(title, body, {
    force: true,
    tag: `prayer-${key}-${prayerTodayISO()}`,
    action: () => {
      stopPrayerSound();
      navigate('prayer');
    }
  });
  if (document.visibilityState === 'visible') {
    showToast({
      type: 'info',
      title,
      message: body,
      duration: 16000,
      actions: [
        { label: 'عرض الصلاة', action: () => navigate('prayer') },
        { label: 'إيقاف الصوت', action: stopPrayerSound }
      ]
    });
  }
}

function checkPrayerAlerts() {
  const settings = getPrayerSettings();
  if (!settings.location) return;
  const today = prayerTodayISO();
  const data = prayerTimesForDate(today);
  if (!data) return;
  const now = Date.now();
  const notified = loadPrayerNotified();
  let changed = false;
  for (const key of PRAYER_ORDER) {
    const time = data.times[key];
    const alert = settings.alerts[key];
    if (!time || !alert?.enabled) continue;
    if (settings.preReminder.enabled && settings.preReminder.minutes > 0) {
      const preKey = `pre:${today}:${key}`;
      const preEpoch = time.epoch - settings.preReminder.minutes * 60000;
      if (!notified[preKey] && now >= preEpoch && now < time.epoch) {
        notified[preKey] = now;
        changed = true;
        firePrayerAlert(key, time, true);
      }
    }
    const prayerKey = `prayer:${today}:${key}`;
    if (!notified[prayerKey] && now >= time.epoch && now - time.epoch <= 120000) {
      notified[prayerKey] = now;
      changed = true;
      firePrayerAlert(key, time, false);
    }
  }
  if (changed) savePrayerNotified(notified);
}

/* =========================================================
   التحديث الحي والعد التنازلي
   ========================================================= */
function updatePrayerLiveElements() {
  const next = nextPrayerToday();
  if (!next) return;
  const countdown = formatCountdown(next.remainingMs);
  document.querySelectorAll('[data-prayer-countdown]').forEach((el) => {
    el.textContent = countdown;
  });
  document.querySelectorAll('[data-prayer-next-label]').forEach((el) => {
    el.textContent = next.label;
  });
  document.querySelectorAll('[data-prayer-next-time]').forEach((el) => {
    el.textContent = next.timeLabel;
  });
  document.querySelectorAll('[data-prayer-next-day]').forEach((el) => {
    el.textContent = next.isTomorrow ? 'غدًا' : 'اليوم';
  });
}

function prayerLiveTick() {
  const settings = getPrayerSettings();
  if (!settings.location) return;
  const today = prayerTodayISO();
  if (today !== prayerLastDay) {
    const wasToday = prayerLastDay;
    prayerLastDay = today;
    invalidatePrayerCache();
    if (!state.ui.prayerDate || state.ui.prayerDate === wasToday) state.ui.prayerDate = today;
    if (state.view === 'prayer' || state.view === 'dashboard' || state.view === 'calendar') {
      renderCurrentView();
    }
    return;
  }
  const next = nextPrayerToday();
  if (!next) return;
  updatePrayerLiveElements();
  const signature = `${next.date}:${next.key}:${next.current?.key || ''}`;
  if (signature !== prayerLiveSignature) {
    prayerLiveSignature = signature;
    if (state.view === 'prayer' || state.view === 'dashboard' || state.view === 'calendar') {
      renderCurrentView();
    }
  }
}

function startPrayerClock() {
  clearInterval(prayerLiveTimer);
  clearInterval(prayerAlertTimer);
  prayerLastDay = prayerTodayISO();
  prayerLiveSignature = '';
  prayerLiveTimer = setInterval(prayerLiveTick, 1000);
  prayerAlertTimer = setInterval(checkPrayerAlerts, 20000);
  setTimeout(checkPrayerAlerts, 1200);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      prayerLiveTick();
      checkPrayerAlerts();
    }
  });
  window.addEventListener('focus', () => {
    prayerLiveTick();
    checkPrayerAlerts();
  });
  document.addEventListener('pointerdown', unlockPrayerAudio, { once: true });
  document.addEventListener('keydown', unlockPrayerAudio, { once: true });
  prayerLiveTick();
}

/* =========================================================
   التكامل مع التقويم والمهام والتذكيرات
   ========================================================= */
function prayerTimeConflict(dateISO, time) {
  if (!dateISO || !time) return null;
  const settings = getPrayerSettings();
  if (!settings.location || !settings.awareness) return null;
  const data = prayerTimesForDate(dateISO);
  if (!data) return null;
  const minutes = timeToMinutes(time);
  let best = null;
  for (const key of PRAYER_ORDER) {
    const prayer = data.times[key];
    if (!prayer) continue;
    const diff = minutes - timeToMinutes(prayer.hhmm);
    if (Math.abs(diff) <= 30 && (!best || Math.abs(diff) < Math.abs(best.diff))) {
      best = { key, label: PRAYER_LABELS[key], diff };
    }
  }
  return best;
}

function prayerConflictChip(dateISO, time) {
  const conflict = prayerTimeConflict(dateISO, time);
  if (!conflict) return '';
  const text = conflict.diff === 0
    ? `يتزامن مع ${conflict.label}`
    : conflict.diff > 0
      ? `بعد ${conflict.label} ${Math.abs(conflict.diff)} د`
      : `قبل ${conflict.label} ${Math.abs(conflict.diff)} د`;
  return `<span class="pill prayer-awareness" title="تنبيه لطيف لتجنب ازدحام المواعيد مع وقت الصلاة">${icon('clock', 10)} ${text}</span>`;
}

function prayerCalendarEvents(startDate, endDate) {
  const settings = getPrayerSettings();
  if (!settings.location) return [];
  const events = [];
  let cursor = startDate;
  let guard = 0;
  while (cursor <= endDate && guard < 70) {
    const data = prayerTimesForDate(cursor);
    if (data) {
      for (const key of PRAYER_ORDER) {
        const time = data.times[key];
        if (!time) continue;
        events.push({
          key: `prayer-${cursor}-${key}`,
          type: 'prayer',
          id: `${cursor}:${key}`,
          date: cursor,
          time: time.hhmm,
          title: `صلاة ${PRAYER_LABELS[key]}`,
          meta: `${prayerLocationLabel(settings.location)} · ${time.timeLabel}`,
          done: isPrayerDone(cursor, key),
          kind: 'prayer',
          prayerKey: key
        });
      }
    }
    cursor = addDaysISO(cursor, 1);
    guard++;
  }
  return events;
}

/* =========================================================
   بطاقة الصفحة الرئيسية
   ========================================================= */
function prayerDashboardCard() {
  const settings = getPrayerSettings();
  if (!settings.location) {
    return `
      <div class="card prayer-dash-card prayer-setup-card">
        <div class="card-head">
          <h3 class="card-title"><span class="icon-wrap prayer-icon">${icon('mosque', 17)}</span> مواقيت الصلاة</h3>
          <button class="card-link" data-action="go-view" data-view="prayer">فتح القسم ${icon('arrow-left', 12)}</button>
        </div>
        <div class="card-body">
          <div class="prayer-mini-setup">
            <div class="prayer-mini-icon">${icon('map-pin', 22)}</div>
            <div>
              <strong>حدّد موقعك لعرض مواقيت دقيقة</strong>
              <p>لن نعرض أي مواقيت افتراضية. نحسب المواقيت من إحداثياتك وطريقة الحساب التي تختارها.</p>
            </div>
            <button class="primary-btn small" data-action="prayer-open-location">${icon('compass', 14)} تحديد الموقع</button>
          </div>
        </div>
      </div>
    `;
  }
  const today = prayerTodayISO();
  const data = prayerTimesForDate(today);
  const next = nextPrayerToday();
  if (!data || !next) {
    return `
      <div class="card prayer-dash-card">
        <div class="card-head"><h3 class="card-title">${icon('mosque', 17)} مواقيت الصلاة</h3></div>
        <div class="card-body"><p class="text-muted small-text">تعذر عرض المواقيت. راجع إعدادات الموقع والحساب.</p></div>
      </div>
    `;
  }
  const rows = PRAYER_ORDER.map((key) => {
    const time = data.times[key];
    const isNext = next.key === key && !next.isTomorrow;
    const isCurrent = next.current?.key === key;
    return `
      <div class="prayer-mini-row ${isNext ? 'is-next' : ''} ${isCurrent ? 'is-current' : ''}">
        <span class="prayer-mini-name">${PRAYER_LABELS[key]}</span>
        <span class="prayer-mini-time">${time.timeLabel}</span>
        ${isNext ? '<span class="prayer-mini-badge">القادمة</span>' : ''}
      </div>
    `;
  }).join('');
  return `
    <div class="card prayer-dash-card">
      <div class="card-head">
        <h3 class="card-title"><span class="icon-wrap prayer-icon">${icon('mosque', 17)}</span> مواقيت الصلاة</h3>
        <button class="card-link" data-action="go-view" data-view="prayer">التفاصيل ${icon('arrow-left', 12)}</button>
      </div>
      <div class="card-body">
        <div class="prayer-dash-hero">
          <div class="prayer-dash-orb">${icon('mosque', 22)}</div>
          <div class="prayer-dash-main">
            <span class="prayer-dash-kicker">الصلاة القادمة</span>
            <div class="prayer-dash-next"><strong data-prayer-next-label>${next.label}</strong><span data-prayer-next-time>${next.timeLabel}</span></div>
            <div class="prayer-dash-countdown" data-prayer-countdown>${formatCountdown(next.remainingMs)}</div>
          </div>
          <div class="prayer-dash-location">${icon('map-pin', 11)} ${escapeHtml(prayerLocationLabel(settings.location))}</div>
        </div>
        <div class="prayer-mini-grid">${rows}</div>
        <div class="prayer-dash-foot">
          <span class="text-muted small-text">${icon('clock', 11)} الآن ${prayerNowLabel()} · ${escapeHtml(prayerHijriLabel(today))}</span>
          <button class="ghost-btn small" data-action="prayer-open-adhan">${icon('bell', 12)} تنبيهات الأذان</button>
        </div>
      </div>
    </div>
  `;
}

/* =========================================================
   التهيئة
   ========================================================= */
function initPrayer() {
  if (typeof adhan === 'undefined') {
    console.error('[نظامي] مكتبة Adhan غير محمّلة — لن تعمل مواقيت الصلاة');
  }
  prayerLastDay = prayerTodayISO();
  startPrayerClock();
}
