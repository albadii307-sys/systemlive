/* =========================================================
   نظامي — مكتبة الأذان: مصادر خارجية، ملفات المستخدم، تخزين محلي
   المصدر الخارجي الحالي: Wikimedia Commons (MediaWiki API)
   ========================================================= */
'use strict';

const ADHAN_LIBRARY_MAX_BYTES = 20 * 1024 * 1024;
const ADHAN_LIBRARY_MAX_DURATION = 20 * 60;
const ADHAN_LIBRARY_ALLOWED_EXTENSIONS = ['mp3', 'm4a', 'wav'];
const ADHAN_LIBRARY_ALLOWED_MIME = [
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/vnd.wave'
];

const ADHAN_PROVIDER_REGISTRY = {
  wikimedia: {
    id: 'wikimedia',
    label: 'Wikimedia Commons',
    note: 'مكتبة صوتية مفتوحة. كل ملف يحمل ترخيصه واسم مؤلفه، وتُعرض الروابط قبل التنزيل.',
    homepage: 'https://commons.wikimedia.org/wiki/Category:Adhan',
    api: 'https://commons.wikimedia.org/w/api.php',
    catalog: [
      {
        id: 'ext-wikimedia-aqib',
        providerId: 'wikimedia',
        providerKey: 'aqib-azeez',
        label: 'أذان — Aaqib Azeez',
        reciter: 'Aaqib Azeez',
        style: 'نداء صلاة كامل',
        note: 'تسجيل نداء الصلاة بصوت Aaqib Azeez، مرفوع إلى Wikimedia Commons.',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        credit: 'Atcovi — Wikimedia Commons',
        source: 'https://commons.wikimedia.org/wiki/File:The_Adhan_-_Muslim_Call_to_Prayer_-_Aaqib_Azeez.mp3',
        downloadUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/The_Adhan_-_Muslim_Call_to_Prayer_-_Aaqib_Azeez.mp3',
        remoteTitle: 'File:The Adhan - Muslim Call to Prayer - Aaqib Azeez.mp3',
        duration: 87,
        size: 1448294,
        mime: 'audio/mpeg'
      },
      {
        id: 'ext-wikimedia-community',
        providerId: 'wikimedia',
        providerKey: 'adhan-community',
        label: 'أذان قصير',
        reciter: 'تسجيل مجتمعي — Aishatu98',
        style: 'نداء صلاة مختصر',
        note: 'ملف صوتي قصير يعلن دخول وقت الصلاة، برخصة CC0.',
        license: 'CC0 1.0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        credit: 'Aishatu98 — Wikimedia Commons',
        source: 'https://commons.wikimedia.org/wiki/File:Adhan.ogg',
        downloadUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Adhan.ogg',
        remoteTitle: 'File:Adhan.ogg',
        duration: 42,
        size: 338741,
        mime: 'application/ogg'
      },
      {
        id: 'ext-wikimedia-call',
        providerId: 'wikimedia',
        providerKey: 'call-to-prayer',
        label: 'نداء الصلاة',
        reciter: 'تسجيل مجتمعي — Isaacayodele32',
        style: 'نداء صلاة كامل',
        note: 'تسجيل لنداء الصلاة من Wikimedia Commons، برخصة CC BY-SA 4.0.',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        credit: 'Isaacayodele32 — Wikimedia Commons',
        source: 'https://commons.wikimedia.org/wiki/File:Call_to_prayer.ogg',
        downloadUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Call_to_prayer.ogg',
        remoteTitle: 'File:Call to prayer.ogg',
        duration: 65,
        size: 625484,
        mime: 'application/ogg'
      }
    ]
  }
};

let adhanExternalCatalog = ADHAN_PROVIDER_REGISTRY.wikimedia.catalog.map((entry) => ({
  ...entry,
  type: 'external'
}));
let adhanCatalogLoadedAt = 0;
let adhanCatalogError = '';
let adhanCatalogPromise = null;
const adhanObjectUrlCache = new Map();

/* =========================================================
   أدوات مساعدة
   ========================================================= */
function adhanLibraryRecords() {
  return Array.isArray(state?.data?.adhanLibrary) ? state.data.adhanLibrary : [];
}

function adhanLibrarySoundById(id) {
  const record = adhanLibraryRecords().find((item) => item.id === id);
  return record ? { ...record, downloaded: true } : null;
}

function adhanCatalogSoundById(id) {
  const entry = adhanExternalCatalog.find((item) => item.id === id);
  return entry
    ? { ...entry, downloaded: adhanLibraryRecords().some((item) => item.id === id) }
    : null;
}

function isAdhanSoundDownloaded(id) {
  return adhanLibraryRecords().some((record) => record.id === id);
}

function adhanSoundDurationLabel(seconds) {
  const total = Math.round(Number(seconds) || 0);
  if (!total) return '—';
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function adhanSoundSizeLabel(bytes) {
  const value = Number(bytes) || 0;
  if (!value) return '—';
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} م.ب`;
  return `${Math.max(1, Math.round(value / 1024))} ك.ب`;
}

function adhanProviderLabel(sound) {
  if (!sound) return '—';
  if (sound.type === 'builtin') return 'مضمن في التطبيق';
  if (sound.type === 'user') return 'ملف المستخدم';
  const provider = ADHAN_PROVIDER_REGISTRY[sound.providerId];
  return provider ? provider.label : 'مصدر خارجي';
}

function allAdhanSounds() {
  const local = adhanLibraryRecords();
  const localMap = new Map(local.map((record) => [record.id, record]));
  const seen = new Set();
  const result = [];

  for (const sound of ADHAN_SOUNDS) {
    seen.add(sound.id);
    result.push({ ...sound, type: 'builtin', downloaded: true });
  }
  for (const sound of adhanExternalCatalog) {
    if (seen.has(sound.id)) continue;
    seen.add(sound.id);
    result.push(localMap.get(sound.id)
      ? { ...localMap.get(sound.id), type: 'external', downloaded: true }
      : { ...sound, type: 'external', downloaded: false });
  }
  for (const record of local) {
    if (seen.has(record.id)) continue;
    seen.add(record.id);
    result.push({ ...record, downloaded: true });
  }
  return result;
}

function availableAdhanSounds() {
  return allAdhanSounds().filter((sound) => sound.type !== 'external' || sound.downloaded);
}

function adhanLibraryStorageBytes() {
  return adhanLibraryRecords().reduce((sum, record) => sum + (Number(record.size) || 0), 0);
}

function adhanLibraryPlayable(sound) {
  if (!sound) return false;
  return sound.type !== 'external' || sound.downloaded;
}

async function resolveAdhanSoundUrl(sound) {
  if (!sound) throw new Error('الصوت المحدد غير متاح');
  if (sound.type === 'builtin') return sound.file;
  if (adhanLibraryRecords().some((record) => record.id === sound.id)) {
    if (adhanObjectUrlCache.has(sound.id)) return adhanObjectUrlCache.get(sound.id);
    const stored = await DB.get('adhan_blobs', sound.id);
    if (!stored || !stored.blob) {
      throw new Error('ملف الصوت غير موجود على هذا الجهاز. أعد تنزيله أو ارفعه من جديد.');
    }
    const url = URL.createObjectURL(stored.blob);
    adhanObjectUrlCache.set(sound.id, url);
    return url;
  }
  if (sound.type === 'external' && sound.downloadUrl) {
    if (sound.broken) throw new Error('رابط هذا الصوت معطّل في المصدر الخارجي. حدّث المكتبة أو جرّب صوتًا آخر.');
    return sound.downloadUrl;
  }
  throw new Error('لا يوجد ملف صوتي صالح لهذا الاختيار');
}

function revokeAdhanObjectUrl(id) {
  if (!adhanObjectUrlCache.has(id)) return;
  try { URL.revokeObjectURL(adhanObjectUrlCache.get(id)); } catch {}
  adhanObjectUrlCache.delete(id);
}

/* =========================================================
   المصدر الخارجي: تحديث البيانات الوصفية
   ========================================================= */
async function refreshAdhanCatalog({ force = false } = {}) {
  if (adhanCatalogPromise) return adhanCatalogPromise;
  if (!force && adhanCatalogLoadedAt && Date.now() - adhanCatalogLoadedAt < 5 * 60 * 1000) {
    return adhanExternalCatalog;
  }
  adhanCatalogPromise = (async () => {
    try {
      const provider = ADHAN_PROVIDER_REGISTRY.wikimedia;
      const titles = provider.catalog.map((entry) => entry.remoteTitle).filter(Boolean);
      const url = `${provider.api}?action=query&titles=${encodeURIComponent(titles.join('|'))}` +
        '&prop=imageinfo&iiprop=url%7Csize%7Cmime%7Cextmetadata&format=json&origin=*';
      const response = await fetch(url, { mode: 'cors', cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const pages = Object.values(payload?.query?.pages || {});
      const byTitle = new Map(pages.map((page) => [page.title, page]));

      adhanExternalCatalog = adhanExternalCatalog.map((entry) => {
        const page = byTitle.get(entry.remoteTitle);
        if (!page || page.missing !== undefined) {
          return { ...entry, broken: true };
        }
        const info = page.imageinfo?.[0] || {};
        return {
          ...entry,
          broken: false,
          downloadUrl: info.url ? info.url.split('?')[0] : entry.downloadUrl,
          duration: Number(info.duration) || entry.duration,
          size: Number(info.size) || entry.size,
          mime: info.mime || entry.mime,
          license: info.extmetadata?.LicenseShortName?.value || entry.license,
          credit: (info.extmetadata?.Artist?.value || '').replace(/<[^>]+>/g, '').trim() || entry.credit
        };
      });
      adhanCatalogLoadedAt = Date.now();
      adhanCatalogError = '';
      return adhanExternalCatalog;
    } catch (error) {
      adhanCatalogError = 'تعذر تحديث بيانات المكتبة الخارجية. تُعرض البيانات المحفوظة، وقد تحتاج اتصالًا بالإنترنت للتنزيل.';
      console.warn('[نظامي] تعذر تحديث مكتبة الأذان الخارجية', error);
      return adhanExternalCatalog;
    } finally {
      adhanCatalogPromise = null;
    }
  })();
  return adhanCatalogPromise;
}

/* =========================================================
   التخزين والتنزيل
   ========================================================= */
function adhanLibraryStorageSupported() {
  if (DB.isFallback()) {
    throw new Error('تخزين ملفات الصوت يحتاج IndexedDB. التخزين البديل الحالي لا يحفظ الملفات.');
  }
}

function adhanFileExtension(name) {
  return String(name || '').split('.').pop().toLowerCase();
}

function validateAdhanUpload(file) {
  if (!file) throw new Error('اختر ملفًا صوتيًا أولًا');
  const ext = adhanFileExtension(file.name);
  if (!ADHAN_LIBRARY_ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('الصيغة غير مدعومة. المسموح: MP3 أو M4A أو WAV.');
  }
  const mime = String(file.type || '').toLowerCase();
  if (mime && !ADHAN_LIBRARY_ALLOWED_MIME.includes(mime) && !mime.startsWith('audio/')) {
    throw new Error('نوع الملف لا يبدو ملفًا صوتيًا.');
  }
  if (file.size <= 0) throw new Error('الملف فارغ');
  if (file.size > ADHAN_LIBRARY_MAX_BYTES) {
    throw new Error(`حجم الملف يتجاوز الحد (${Math.round(ADHAN_LIBRARY_MAX_BYTES / (1024 * 1024))} م.ب).`);
  }
  return { ext, mime: mime || (ext === 'mp3' ? 'audio/mpeg' : ext === 'm4a' ? 'audio/mp4' : 'audio/wav') };
}

function audioDurationFromBlob(blob) {
  return new Promise((resolve) => {
    let settled = false;
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { audio.removeAttribute('src'); audio.load(); } catch {}
      URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = setTimeout(() => finish(0), 9000);
    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', () => {
      finish(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0);
    }, { once: true });
    audio.addEventListener('error', () => finish(0), { once: true });
    audio.src = url;
    audio.load();
  });
}

async function saveUserAdhanFile({ file, name, reciter }) {
  adhanLibraryStorageSupported();
  const info = validateAdhanUpload(file);
  const duration = await audioDurationFromBlob(file);
  if (!duration) throw new Error('تعذر قراءة الملف الصوتي. تأكد أنه MP3 أو M4A أو WAV سليم.');
  if (duration > ADHAN_LIBRARY_MAX_DURATION) {
    throw new Error('مدة الملف طويلة جدًا. الحد الأقصى 20 دقيقة.');
  }
  const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record = {
    id,
    type: 'user',
    sourceId: 'user-files',
    label: String(name || '').trim() || file.name.replace(/\.[^.]+$/, ''),
    reciter: String(reciter || '').trim() || 'مؤذن غير مسمى',
    style: 'ملف خاص بك',
    note: 'ملف صوتي رفعته أنت، محفوظ على جهازك فقط.',
    license: 'ملف المستخدم',
    licenseUrl: '',
    credit: 'ملف المستخدم',
    source: '',
    downloadUrl: '',
    fileName: file.name,
    mime: info.mime,
    size: file.size,
    duration: Math.round(duration),
    addedAt: Date.now(),
    updatedAt: Date.now()
  };
  try {
    await DB.put('adhan_library', record);
    await DB.put('adhan_blobs', { id, libraryId: id, blob: file, addedAt: Date.now() });
  } catch (error) {
    try { await DB.remove('adhan_library', id); } catch {}
    throw new Error(error?.name === 'QuotaExceededError'
      ? 'مساحة التخزين ممتلئة. احذف صوتًا قديمًا ثم أعد المحاولة.'
      : (error?.message || 'تعذر حفظ الملف الصوتي'));
  }
  state.data.adhanLibrary = [...adhanLibraryRecords().filter((item) => item.id !== id), record];
  if (typeof logActivity === 'function') {
    await logActivity('create', 'adhan_audio', id, record.label, null, record);
  }
  return record;
}

async function readResponseWithProgress(response, onProgress) {
  const total = Number(response.headers.get('content-length')) || 0;
  if (!response.body || typeof response.body.getReader !== 'function') {
    const blob = await response.blob();
    onProgress?.(100, blob.size, total || blob.size);
    return blob;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    if (total) onProgress?.(Math.min(99, Math.round((loaded / total) * 100)), loaded, total);
    else onProgress?.(Math.min(95, Math.round(loaded / 2048)), loaded, total);
  }
  const blob = new Blob(chunks, { type: response.headers.get('content-type') || '' });
  onProgress?.(100, blob.size, total || blob.size);
  return blob;
}

async function downloadExternalAdhan(id, { onProgress } = {}) {
  adhanLibraryStorageSupported();
  const entry = adhanCatalogSoundById(id);
  if (!entry) throw new Error('الصوت غير موجود في المصدر الخارجي');
  const existing = adhanLibraryRecords().find((record) => record.id === id);
  if (existing) return existing;
  if (entry.broken) throw new Error('رابط هذا الصوت معطّل في المصدر. جرّب تحديث المكتبة لاحقًا.');
  if (!entry.downloadUrl) throw new Error('لا يوجد رابط تنزيل صالح لهذا الصوت');

  let response;
  try {
    response = await fetch(entry.downloadUrl, { mode: 'cors', cache: 'no-store' });
  } catch {
    throw new Error('تعذر الاتصال بالمصدر الخارجي. تحقق من اتصال الإنترنت ثم أعد المحاولة.');
  }
  if (!response.ok) throw new Error(`فشل التنزيل من المصدر (HTTP ${response.status}). قد يكون الرابط معطّلًا.`);
  const declaredSize = Number(response.headers.get('content-length')) || entry.size || 0;
  if (declaredSize > ADHAN_LIBRARY_MAX_BYTES) {
    throw new Error('حجم الملف أكبر من الحد المسموح (20 م.ب).');
  }

  let blob;
  try {
    blob = await readResponseWithProgress(response, onProgress);
  } catch {
    throw new Error('انقطع التنزيل. تحقق من الاتصال وأعد المحاولة.');
  }
  if (!blob || blob.size <= 0) throw new Error('الملف الذي وصل فارغ أو غير صالح');
  if (blob.size > ADHAN_LIBRARY_MAX_BYTES) {
    throw new Error('حجم الملف أكبر من الحد المسموح (20 م.ب).');
  }
  const mime = blob.type || entry.mime;
  if (mime && !mime.startsWith('audio/') && mime !== 'application/ogg' && mime !== 'video/ogg') {
    throw new Error('المصدر أعاد ملفًا غير صوتي. لم يُحفظ أي شيء.');
  }
  const duration = Number(entry.duration) || Math.round(await audioDurationFromBlob(blob)) || 0;
  if (duration > ADHAN_LIBRARY_MAX_DURATION) {
    throw new Error('مدة التسجيل أطول من الحد المسموح (20 دقيقة).');
  }

  const record = {
    ...entry,
    type: 'external',
    sourceId: entry.providerId,
    license: entry.license,
    size: blob.size,
    mime,
    duration: Math.round(duration),
    fileName: entry.remoteTitle,
    addedAt: Date.now(),
    updatedAt: Date.now()
  };
  try {
    await DB.put('adhan_library', record);
    await DB.put('adhan_blobs', { id, libraryId: id, blob, addedAt: Date.now() });
  } catch (error) {
    try { await DB.remove('adhan_library', id); } catch {}
    try { await DB.remove('adhan_blobs', id); } catch {}
    throw new Error(error?.name === 'QuotaExceededError'
      ? 'مساحة التخزين ممتلئة. احذف صوتًا قديمًا ثم أعد المحاولة.'
      : 'تعذر حفظ الملف في التخزين المحلي.');
  }
  state.data.adhanLibrary = [...adhanLibraryRecords().filter((item) => item.id !== id), record];
  return record;
}

/* =========================================================
   الاختيار والتعيين
   ========================================================= */
async function setAdhanDefaultSound(id) {
  const sound = adhanSoundById(id);
  if (!sound) throw new Error('الصوت غير موجود');
  if (!adhanLibraryPlayable(sound)) throw new Error('أنزل الصوت أولًا حتى يعمل دون اتصال.');
  await savePrayerSettings({ adhanSound: id });
  if (typeof logActivity === 'function') {
    await logActivity('update', 'settings', 'prayer-audio', 'الصوت الافتراضي للأذان', null, { adhanSound: id });
  }
  if (typeof refreshUI === 'function') refreshUI();
  showToast({
    type: 'success',
    title: 'تم اختيار المؤذن',
    message: `${sound.reciter} — سيُستخدم افتراضيًا لكل صلاة لم يُخصّص لها صوت.`
  });
}

async function unassignAdhanSound(id) {
  const settings = getPrayerSettings();
  const alerts = {};
  for (const key of PRAYER_ORDER) {
    alerts[key] = {
      ...settings.alerts[key],
      soundId: settings.alerts[key]?.soundId === id ? null : settings.alerts[key]?.soundId
    };
  }
  const patch = { alerts };
  if (settings.adhanSound === id) patch.adhanSound = ADHAN_DEFAULT_SOUND;
  await savePrayerSettings(patch);
}

async function deleteAdhanSound(id) {
  const record = adhanLibraryRecords().find((item) => item.id === id);
  if (!record) throw new Error('الصوت غير موجود');
  stopPrayerSound();
  revokeAdhanObjectUrl(id);
  await DB.remove('adhan_blobs', id);
  await DB.remove('adhan_library', id);
  state.data.adhanLibrary = adhanLibraryRecords().filter((item) => item.id !== id);
  await unassignAdhanSound(id);
  if (typeof logActivity === 'function') {
    await logActivity('delete', 'adhan_audio', id, record.label, record, null);
  }
  if (typeof refreshUI === 'function') refreshUI();
}

async function deleteAdhanSoundWithConfirm(id) {
  const record = adhanLibraryRecords().find((item) => item.id === id);
  if (!record) return;
  const confirmed = await confirmAction({
    title: 'حذف الصوت من الجهاز؟',
    message: `سيُحذف «${record.label}» من التخزين المحلي.`,
    detail: 'إذا كان هذا الصوت مستخدمًا، سيعود الأذان إلى الصوت الافتراضي. يمكنك تنزيله أو رفعه لاحقًا.',
    confirmText: 'حذف الصوت',
    danger: true
  });
  if (!confirmed) return;
  try {
    await deleteAdhanSound(id);
    showToast({ type: 'success', title: 'تم حذف الصوت', message: 'تم تحرير المساحة وإعادة تعيين الصوت الافتراضي عند الحاجة.' });
    refreshAdhanLibraryModal();
  } catch (error) {
    showToast({ type: 'error', title: 'تعذر حذف الصوت', message: error.message });
  }
}

async function downloadAdhanSoundFromUI(id, button) {
  const progressEl = document.querySelector(`[data-adhan-progress="${id}"]`);
  if (button) {
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
  }
  const setProgress = (percent) => {
    if (progressEl) {
      progressEl.textContent = `${Math.max(0, Math.min(100, percent))}%`;
      progressEl.hidden = false;
    }
    if (button) button.innerHTML = `${icon('download', 12)} جارٍ التنزيل ${Math.max(0, Math.min(100, percent))}%`;
  };
  setProgress(0);
  try {
    const record = await downloadExternalAdhan(id, { onProgress: setProgress });
    showToast({
      type: 'success',
      title: 'تم تنزيل الأذان',
      message: `${record.label} — ${adhanSoundSizeLabel(record.size)} محفوظة الآن للعمل دون إنترنت.`
    });
    if (typeof logActivity === 'function') {
      await logActivity('download', 'adhan_audio', id, record.label, null, record);
    }
    refreshAdhanLibraryModal({ preserveForm: true });
  } catch (error) {
    showToast({ type: 'error', title: 'تعذر تنزيل الصوت', message: error.message });
    if (button) {
      button.disabled = false;
      button.innerHTML = button.dataset.originalText || `${icon('download', 12)} تنزيل`;
    }
    if (progressEl) progressEl.hidden = true;
  }
}

/* =========================================================
   واجهة مكتبة الأذان
   ========================================================= */
function adhanLibraryCurrentTab() {
  return state?.ui?.adhanLibraryTab || 'library';
}

function switchAdhanLibraryTab(tab) {
  const valid = ['library', 'user', 'assign'];
  const next = valid.includes(tab) ? tab : 'library';
  state.ui.adhanLibraryTab = next;
  document.querySelectorAll('[data-adhan-library-tab]').forEach((button) => {
    const active = button.dataset.adhanLibraryTab === next;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  document.querySelectorAll('[data-adhan-library-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.adhanLibraryPanel !== next;
  });
}

function adhanLibrarySoundCard(sound) {
  const selected = getPrayerSettings().adhanSound === sound.id;
  const externalNotDownloaded = sound.type === 'external' && !sound.downloaded;
  const downloadable = sound.type !== 'builtin';
  return `
    <article class="adhan-sound-card ${selected ? 'is-selected' : ''} ${sound.broken ? 'is-broken' : ''}">
      <div class="adhan-sound-top">
        <div class="adhan-sound-avatar">${icon(sound.type === 'user' ? 'folder' : sound.type === 'external' ? 'database' : 'volume', 18)}</div>
        <div class="adhan-sound-id">
          <div class="adhan-sound-title-line">
            <strong>${escapeHtml(sound.label)}</strong>
            ${selected ? `<span class="pill green">${icon('check', 9)} المحدد حاليًا</span>` : ''}
          </div>
          <span class="adhan-sound-reciter">${escapeHtml(sound.reciter)} · ${escapeHtml(sound.style || '')}</span>
          <span class="adhan-sound-source">${escapeHtml(adhanProviderLabel(sound))}${externalNotDownloaded ? ' · يحتاج تنزيلًا للعمل دون إنترنت' : ''}</span>
        </div>
      </div>
      <p class="adhan-sound-note">${escapeHtml(sound.note || '')}</p>
      <div class="adhan-sound-meta">
        <span>${icon('clock', 11)} ${adhanSoundDurationLabel(sound.duration)}</span>
        <span>${icon('database', 11)} ${adhanSoundSizeLabel(sound.size)}</span>
        <span class="adhan-sound-license">${escapeHtml(sound.license || '—')}</span>
      </div>
      <div class="adhan-sound-actions">
        <button class="soft-btn tiny" type="button" data-action="prayer-test-sound" data-mode="full" data-sound="${escapeAttr(sound.id)}">${icon('play', 11)} معاينة</button>
        <button class="ghost-btn tiny" type="button" data-action="prayer-test-sound" data-mode="short" data-sound="${escapeAttr(sound.id)}">${icon('play', 11)} مقتطف</button>
        <button class="ghost-btn tiny" type="button" data-action="prayer-stop-sound">${icon('volume-x', 11)} إيقاف</button>
        ${externalNotDownloaded
          ? `<button class="primary-btn tiny" type="button" data-action="adhan-download" data-id="${escapeAttr(sound.id)}" ${sound.broken ? 'disabled' : ''}>${icon('download', 11)} تنزيل للاستخدام دون إنترنت</button>
             <span class="adhan-progress" data-adhan-progress="${escapeAttr(sound.id)}" hidden>0%</span>`
          : `<button class="primary-btn tiny" type="button" data-action="adhan-set-default" data-id="${escapeAttr(sound.id)}" ${selected ? 'disabled' : ''}>${icon('check', 11)} ${selected ? 'المؤذن الافتراضي' : 'اختيار كافتراضي'}</button>`}
        ${downloadable ? `<button class="danger-btn tiny" type="button" data-action="adhan-delete" data-id="${escapeAttr(sound.id)}">${icon('trash', 11)} حذف</button>` : ''}
        ${sound.source ? `<a class="ghost-btn tiny" href="${escapeAttr(sound.source)}" target="_blank" rel="noopener">${icon('link', 11)} المصدر</a>` : ''}
      </div>
      ${sound.broken ? '<div class="adhan-broken-note">الرابط معطّل حاليًا في المصدر. لم يُحفظ أي ملف.</div>' : ''}
      ${sound.licenseUrl ? `<a class="adhan-license-link" href="${escapeAttr(sound.licenseUrl)}" target="_blank" rel="noopener">شروط الترخيص: ${escapeHtml(sound.license)}</a>` : ''}
    </article>
  `;
}

function adhanLibraryCatalogHtml() {
  const settings = getPrayerSettings();
  const builtins = ADHAN_SOUNDS.map((sound) => ({ ...sound, type: 'builtin', downloaded: true }));
  const external = adhanExternalCatalog.map((entry) => adhanLibrarySoundById(entry.id) || entry);
  const provider = ADHAN_PROVIDER_REGISTRY.wikimedia;
  const online = navigator.onLine !== false;
  const status = adhanCatalogError
    ? `<div class="adhan-source-status warning">${icon('alert', 13)} ${escapeHtml(adhanCatalogError)}</div>`
    : !online
      ? `<div class="adhan-source-status warning">${icon('alert', 13)} لا يوجد اتصال بالإنترنت. المكتبة المضمنة والأصوات المنزّلة تعمل، لكن التنزيل والمعاينة الخارجية لا يعملان.</div>`
      : `<div class="adhan-source-status">${icon('check-circle', 13)} المصدر متاح. البيانات الوصفية محدّثة${adhanCatalogLoadedAt ? ` آخر مرة ${new Date(adhanCatalogLoadedAt).toLocaleTimeString('ar-OM-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}` : ''}.</div>`;
  return `
    <div class="adhan-source-head">
      <div>
        <strong>${escapeHtml(provider.label)}</strong>
        <p>${escapeHtml(provider.note)}</p>
      </div>
      <div class="row wrap">
        <button class="ghost-btn tiny" type="button" data-action="adhan-refresh-catalog">${icon('refresh', 11)} تحديث البيانات</button>
        <a class="ghost-btn tiny" href="${escapeAttr(provider.homepage)}" target="_blank" rel="noopener">${icon('link', 11)} المصدر</a>
      </div>
    </div>
    ${status}

    <div class="section-title mt-3 mb-2">أصوات مضمنة في التطبيق</div>
    <div class="adhan-sound-grid">${builtins.map(adhanLibrarySoundCard).join('')}</div>

    <div class="section-title mt-3 mb-2">من المكتبة الخارجية</div>
    <div class="adhan-sound-grid">${external.map(adhanLibrarySoundCard).join('')}</div>

    <p class="help mt-3">اختيار صوت خارجي لا يعني نسخه إلى جهازك. اضغط «تنزيل» ليُحفظ في IndexedDB ويعمل دون إنترنت. لا يُشغّل التطبيق أي ملف قبل التحقق من نوعه وحجمه.</p>
    <p class="help mt-1">التراخيص والروابط لكل تسجيل ظاهرة في بطاقته. لا تُستخدم هنا أصوات من تطبيقات أخرى، ولا يُفترض أن أي ملف على الإنترنت مسموح بإعادة استخدامه.</p>
  `;
}

function adhanUserFilesHtml() {
  const userSounds = adhanLibraryRecords()
    .filter((record) => record.type === 'user')
    .map((record) => ({ ...record, downloaded: true }));
  return `
    <div class="adhan-upload-card">
      <div class="adhan-source-head">
        <div>
          <strong>${icon('upload', 15)} رفع ملف أذان من جهازك</strong>
          <p>MP3 أو M4A أو WAV · الحد 20 م.ب · المدة حتى 20 دقيقة. يُحفظ الملف في IndexedDB ولا يُرسل إلى أي خادم.</p>
        </div>
      </div>
      <form id="adhan-upload-form" data-form="adhan-upload">
        <div class="form-grid">
          <div class="field full">
            <label for="adhan-upload-file">ملف الصوت <span class="req">*</span></label>
            <input id="adhan-upload-file" name="audioFile" type="file" accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/wav" required>
          </div>
          <div class="field">
            <label for="adhan-upload-name">اسم الصوت</label>
            <input id="adhan-upload-name" name="name" type="text" maxlength="80" placeholder="مثال: أذان المسجد النبوي">
          </div>
          <div class="field">
            <label for="adhan-upload-reciter">اسم المؤذن <span class="req">*</span></label>
            <input id="adhan-upload-reciter" name="reciter" type="text" maxlength="80" placeholder="مثال: الشيخ عبد الرحمن السديس" required>
          </div>
        </div>
        <div class="row mt-2">
          <button class="primary-btn small" type="submit">${icon('upload', 12)} رفع الملف وحفظه</button>
        </div>
      </form>
    </div>

    <div class="section-title mt-3 mb-2">ملفاتي (${userSounds.length})</div>
    ${userSounds.length
      ? `<div class="adhan-sound-grid">${userSounds.map(adhanLibrarySoundCard).join('')}</div>`
      : `<div class="empty-state" style="padding:24px"><div class="empty-icon">${icon('folder', 22)}</div><strong>لا توجد ملفات خاصة بعد</strong><p>ارفع ملف أذان بصيغة MP3 أو M4A أو WAV، ثم عيّنه لأي صلاة.</p></div>`}
    <p class="help mt-3">ملفاتك تبقى على هذا الجهاز. لا يمكن استعادتها من نسخة احتياطية نصية؛ احتفظ بالملف الأصلي لإعادة رفعه على جهاز آخر.</p>
  `;
}

function adhanSoundSelectOptions(selectedId, { allowDefault = false } = {}) {
  const sounds = availableAdhanSounds();
  const options = [];
  if (allowDefault) options.push(`<option value="" ${!selectedId ? 'selected' : ''}>استخدم الصوت الافتراضي</option>`);
  for (const sound of sounds) {
    options.push(`<option value="${escapeAttr(sound.id)}" ${sound.id === selectedId ? 'selected' : ''}>${escapeHtml(sound.reciter)} — ${escapeHtml(sound.label)}</option>`);
  }
  return options.join('');
}

function adhanAssignmentsHtml() {
  const settings = getPrayerSettings();
  const defaultOptions = adhanSoundSelectOptions(
    availableAdhanSounds().some((sound) => sound.id === settings.adhanSound) ? settings.adhanSound : ADHAN_DEFAULT_SOUND
  );
  const rows = PRAYER_ORDER.map((key) => {
    const alert = settings.alerts[key];
    const assigned = alert?.soundId && availableAdhanSounds().some((sound) => sound.id === alert.soundId)
      ? alert.soundId
      : '';
    return `
      <div class="adhan-assign-row ${alert?.enabled ? 'on' : ''}">
        <div class="adhan-assign-prayer">
          <span class="adhan-assign-icon">${icon(PRAYER_ICONS[key] || 'clock', 15)}</span>
          <div>
            <strong>${PRAYER_LABELS[key]}</strong>
            <span>${alert?.soundId ? escapeHtml(prayerSoundLabelFor(key, settings)) : 'الصوت الافتراضي'}</span>
          </div>
        </div>
        <div class="adhan-assign-fields">
          <label class="switch" title="تفعيل التنبيه">
            <input type="checkbox" name="enabled_${key}" ${alert?.enabled ? 'checked' : ''}>
            <span></span>
          </label>
          <select name="sound_${key}" aria-label="صوت ${PRAYER_LABELS[key]}">
            ${adhanSoundSelectOptions(assigned, { allowDefault: true })}
          </select>
          <select name="mode_${key}" aria-label="نوع تنبيه ${PRAYER_LABELS[key]}">
            <option value="full" ${alert?.mode === 'full' ? 'selected' : ''}>أذان كامل</option>
            <option value="short" ${alert?.mode === 'short' ? 'selected' : ''}>مقتطف قصير</option>
            <option value="silent" ${alert?.mode === 'silent' ? 'selected' : ''}>صامت</option>
          </select>
        </div>
      </div>
    `;
  }).join('');

  return `
    <form id="adhan-library-form" data-form="prayer-adhan-library">
      <div class="field">
        <label for="adhan-default-sound">المؤذن الافتراضي لكل الصلوات</label>
        <select id="adhan-default-sound" name="defaultSound">${defaultOptions}</select>
        <span class="help">يُستخدم لكل صلاة لم تحدّد لها صوتًا خاصًا. الأصوات الخارجية لا تظهر هنا قبل تنزيلها، لضمان العمل دون إنترنت.</span>
      </div>

      <div class="section-title mt-3 mb-2">تخصيص كل صلاة</div>
      <div class="adhan-assign-list">${rows}</div>
      <p class="help mt-2">يمكنك جعل الفجر بصوت مختلف، أو اختيار مقتطف قصير لبعض الصلوات، أو إيقاف الصوت مع إبقاء الإشعار. «صامت» يعني بلا صوت، وليس إيقاف الإشعار.</p>

      <div class="banner warning mt-3">
        <span class="banner-icon">${icon('alert', 15)}</span>
        <div>
          <strong>حدود التشغيل</strong>
          <p>التنبيهات تعمل أثناء فتح التطبيق فقط. لا يستطيع Service Worker تشغيل أذان كامل بعد إغلاق المتصفح. راجع docs/background-adhan.md للمسارات البديلة.</p>
        </div>
      </div>

      <div class="row mt-3">
        <button class="primary-btn" type="submit">${icon('check', 14)} حفظ التعيينات</button>
      </div>
    </form>
  `;
}

function adhanLibraryStorageHtml() {
  return `
    <div class="adhan-storage-line">
      <span>${icon('database', 13)} مساحة الأصوات المحلية</span>
      <strong data-adhan-storage-bytes>${adhanLibraryStorageBytes() ? adhanSoundSizeLabel(adhanLibraryStorageBytes()) : '0 ك.ب'}</strong>
      <span class="muted" data-adhan-storage-estimate>جارٍ حساب مساحة المتصفح…</span>
      <button class="ghost-btn tiny" type="button" data-action="prayer-open-library">${icon('refresh', 10)} تحديث</button>
    </div>
  `;
}

function captureAdhanLibraryForm() {
  const form = document.getElementById('adhan-library-form');
  if (!form) return null;
  const values = {};
  form.querySelectorAll('input[name], select[name]').forEach((input) => {
    if (input.type === 'checkbox') values[input.name] = input.checked;
    else values[input.name] = input.value;
  });
  return values;
}

function restoreAdhanLibraryForm(values) {
  if (!values) return;
  const form = document.getElementById('adhan-library-form');
  if (!form) return;
  for (const [name, value] of Object.entries(values)) {
    const field = form.querySelector(`[name="${CSS.escape(name)}"]`);
    if (!field) continue;
    if (field.type === 'checkbox') field.checked = Boolean(value);
    else field.value = value;
  }
}

async function updateAdhanStorageEstimate() {
  const el = document.querySelector('[data-adhan-storage-estimate]');
  if (!el) return;
  try {
    if (!navigator.storage?.estimate) {
      el.textContent = 'المتصفح لا يوفر تقديرًا للمساحة';
      return;
    }
    const estimate = await navigator.storage.estimate();
    const used = Number(estimate.usage) || 0;
    const quota = Number(estimate.quota) || 0;
    if (!quota) {
      el.textContent = `المستخدَم كليًا: ${adhanSoundSizeLabel(used)}`;
      return;
    }
    const percent = Math.min(100, Math.round((used / quota) * 100));
    el.textContent = `المستخدَم كليًا ${adhanSoundSizeLabel(used)} من ${adhanSoundSizeLabel(quota)} (${percent}%)`;
  } catch {
    el.textContent = 'تعذر قراءة تقدير المساحة';
  }
}

function openPrayerAdhanLibraryModal({ preserveForm = false } = {}) {
  const preserved = preserveForm ? captureAdhanLibraryForm() : null;
  const tab = adhanLibraryCurrentTab();
  const content = `
    <div class="adhan-library-tabs" role="tablist">
      <button type="button" class="adhan-library-tab ${tab === 'library' ? 'active' : ''}" data-action="adhan-library-tab" data-tab="library" data-adhan-library-tab="library" role="tab" aria-selected="${tab === 'library'}">${icon('database', 13)} المكتبة</button>
      <button type="button" class="adhan-library-tab ${tab === 'user' ? 'active' : ''}" data-action="adhan-library-tab" data-tab="user" data-adhan-library-tab="user" role="tab" aria-selected="${tab === 'user'}">${icon('folder', 13)} ملفاتي</button>
      <button type="button" class="adhan-library-tab ${tab === 'assign' ? 'active' : ''}" data-action="adhan-library-tab" data-tab="assign" data-adhan-library-tab="assign" role="tab" aria-selected="${tab === 'assign'}">${icon('sliders', 13)} التعيين لكل صلاة</button>
    </div>
    ${adhanLibraryStorageHtml()}
    <div class="adhan-library-panel" data-adhan-library-panel="library" ${tab !== 'library' ? 'hidden' : ''}>${adhanLibraryCatalogHtml()}</div>
    <div class="adhan-library-panel" data-adhan-library-panel="user" ${tab !== 'user' ? 'hidden' : ''}>${adhanUserFilesHtml()}</div>
    <div class="adhan-library-panel" data-adhan-library-panel="assign" ${tab !== 'assign' ? 'hidden' : ''}>${adhanAssignmentsHtml()}</div>
  `;
  openModal({
    title: 'مكتبة الأذان',
    subtitle: 'اختر مؤذنًا لكل صلاة، أنزل الأصوات للعمل دون إنترنت، أو ارفع ملفك الخاص',
    size: 'lg',
    content,
    footer: `
      <button class="ghost-btn" data-modal-close>إغلاق</button>
      <div class="spacer"></div>
      <button class="soft-btn" type="button" data-action="prayer-open-adhan">${icon('bell', 14)} إعدادات التنبيه</button>
    `
  });
  if (preserved) restoreAdhanLibraryForm(preserved);
  updateAdhanStorageEstimate();
}

function refreshAdhanLibraryModal({ preserveForm = true } = {}) {
  openPrayerAdhanLibraryModal({ preserveForm });
}

async function refreshAdhanCatalogFromUI() {
  showToast({ type: 'info', title: 'جارٍ تحديث المكتبة', message: 'يتم التحقق من بيانات Wikimedia Commons.' });
  await refreshAdhanCatalog({ force: true });
  const panel = document.querySelector('[data-adhan-library-panel="library"]');
  if (panel) {
    panel.innerHTML = adhanLibraryCatalogHtml();
    updateAdhanStorageEstimate();
  }
  showToast({
    type: adhanCatalogError ? 'warning' : 'success',
    title: adhanCatalogError ? 'تعذر تحديث البيانات' : 'تم تحديث المكتبة',
    message: adhanCatalogError || 'تم التحقق من الروابط والمدد والتراخيص المتاحة.'
  });
}

async function handleAdhanUploadForm(form) {
  const formData = new FormData(form);
  const file = formData.get('audioFile');
  const name = formData.get('name');
  const reciter = formData.get('reciter');
  if (!file || !file.size) throw new Error('اختر ملفًا صوتيًا أولًا');
  const submit = form.querySelector('button[type="submit"]');
  if (submit) {
    submit.disabled = true;
    submit.dataset.originalText = submit.innerHTML;
    submit.innerHTML = `${icon('upload', 12)} جارٍ التحقق والحفظ…`;
  }
  try {
    const record = await saveUserAdhanFile({ file, name, reciter });
    showToast({
      type: 'success',
      title: 'تم حفظ ملف الأذان',
      message: `${record.label} — ${adhanSoundDurationLabel(record.duration)}، محفوظ على هذا الجهاز.`
    });
    state.ui.adhanLibraryTab = 'user';
    refreshAdhanLibraryModal({ preserveForm: true });
  } finally {
    if (submit && document.contains(submit)) {
      submit.disabled = false;
      submit.innerHTML = submit.dataset.originalText || `${icon('upload', 12)} رفع الملف وحفظه`;
    }
  }
}

async function handleAdhanLibraryForm(form) {
  const formData = new FormData(form);
  const defaultSound = String(formData.get('defaultSound') || '');
  if (!availableAdhanSounds().some((sound) => sound.id === defaultSound)) {
    throw new Error('اختر مؤذنًا متاحًا أو منزّلًا كصوت افتراضي');
  }
  const alerts = {};
  for (const key of PRAYER_ORDER) {
    const soundId = String(formData.get(`sound_${key}`) || '');
    if (soundId && !availableAdhanSounds().some((sound) => sound.id === soundId)) {
      throw new Error(`الصوت المحدد لصلاة ${PRAYER_LABELS[key]} غير متاح على هذا الجهاز`);
    }
    const mode = String(formData.get(`mode_${key}`) || 'full');
    alerts[key] = {
      enabled: formData.get(`enabled_${key}`) === 'on',
      mode: ['full', 'short', 'silent'].includes(mode) ? mode : 'full',
      soundId: soundId || null
    };
  }
  await savePrayerSettings({ adhanSound: defaultSound, alerts });
  closeAllModals();
  if (typeof refreshUI === 'function') refreshUI();
  showToast({
    type: 'success',
    title: 'تم حفظ مكتبة الأذان',
    message: 'سيُستخدم الصوت المحدد لكل صلاة عند دخول وقتها.'
  });
}

function initAdhanLibrary() {
  window.addEventListener('online', () => {
    if (document.querySelector('[data-adhan-library-panel="library"]')) {
      const panel = document.querySelector('[data-adhan-library-panel="library"]');
      if (panel) panel.innerHTML = adhanLibraryCatalogHtml();
    }
  });
  window.addEventListener('offline', () => {
    const panel = document.querySelector('[data-adhan-library-panel="library"]');
    if (panel) panel.innerHTML = adhanLibraryCatalogHtml();
  });
}
