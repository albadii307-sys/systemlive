# أصوات الأذان — المصادر والتراخيص

تُستخدم في التطبيق ثلاث فئات من الأصوات:

1. **أصوات مضمنة** داخل `assets/sounds/` وتعمل دون اتصال من أول تشغيل.
2. **مكتبة خارجية** من **Wikimedia Commons** تُعرض بياناتها الوصفية عبر MediaWiki API، ويُنزّلها المستخدم بنفسه عند الحاجة.
3. **ملفات المستخدم** التي يرفعها بنفسه؛ تبقى على جهازه ولا تُوزَّع مع المشروع.

لا يُعاد توزيع أي تسجيل خارجي بوصفه ملكًا للمشروع، وتبقى حقوق كل تسجيل
لأصحابه وفق الترخيص المذكور. لا تُستخرج أصوات من تطبيقات أخرى.

## 1) الأصوات المضمنة

| المعرّف | الملف | المؤذن / التسجيل | الترخيص | المصدر |
|---|---|---|---|---|
| `andrewler` | `adhan-full.ogg` | Andrewler | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Azan.ogg |
| `sabah-fakhry` | `adhan-sabah-fakhry.mp3` | الشيخ صباح فخري | ملكية عامة (Public domain) | https://commons.wikimedia.org/wiki/File:Call_to_prayer_by_Sabah_Fakhry.mp3 |
| `adam-synagda` | `adhan-beautiful.ogg` | Adam Synagda | CC0 1.0 | https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg |

## 2) المكتبة الخارجية (Wikimedia Commons)

هذه الملفات **ليست مضمنة** في المستودع. تظهر في «مكتبة الأذان» كبيانات وصفية
وروابط، ولا تُحفظ إلا عندما يضغط المستخدم «تنزيل». البيانات التالية تم التحقق
منها عبر `commons.wikimedia.org/w/api.php` (المدة والحجم والترخيص واسم المؤلف)
وعبر طلب نطاق فعلي إلى `upload.wikimedia.org`.

| المعرّف | الملف في Commons | المؤذن / المؤلف | الترخيص | المدة | الحجم |
|---|---|---|---|---|---|
| `ext-wikimedia-aqib` | [The Adhan - Muslim Call to Prayer - Aaqib Azeez.mp3](https://commons.wikimedia.org/wiki/File:The_Adhan_-_Muslim_Call_to_Prayer_-_Aaqib_Azeez.mp3) | بصوت Aaqib Azeez — رفع Atcovi | CC BY-SA 4.0 | ≈ 1:27 | ≈ 1.4 م.ب |
| `ext-wikimedia-community` | [Adhan.ogg](https://commons.wikimedia.org/wiki/File:Adhan.ogg) | Aishatu98 | CC0 1.0 | ≈ 0:42 | ≈ 331 ك.ب |
| `ext-wikimedia-call` | [Call to prayer.ogg](https://commons.wikimedia.org/wiki/File:Call_to_prayer.ogg) | Isaacayodele32 | CC BY-SA 4.0 | ≈ 1:05 | ≈ 611 ك.ب |

- روابط الملفات المباشرة تُقرأ من API وتُخزَّن في سجل المصدر؛ لا تُخترع روابط.
- عند تعذّر الوصول إلى API تبقى البيانات المحفوظة ظاهرة مع تحذير واضح.
- كل بطاقة تعرض الترخيص ورابط المصدر قبل التنزيل.
- إضافة مصدر خارجي جديد تتطلب تسجيل provider جديدًا في
  `ADHAN_PROVIDER_REGISTRY` داخل `js/adhan-library.js` والتحقق من تراخيصه.

## التزامات الإسناد

### Andrewler — CC BY-SA 4.0
- يجب ذكر اسم المؤلف (Andrewler) ورابط المصدر والترخيص.
- أي تعديل على الملف أو إعادة توزيعه يخضع لنفس الترخيص CC BY-SA 4.0.
- نص الترخيص: https://creativecommons.org/licenses/by-sa/4.0/

### الشيخ صباح فخري — ملكية عامة
- الملف موسوم على Wikimedia Commons بأنه في الملكية العامة.
- لا توجد شروط إسناد إلزامية، لكن ذُكر المؤذن والمصدر للأمانة.

### Adam Synagda — CC0 1.0
- التنازل الكامل عن الحقوق؛ لا شروط إسناد إلزامية.
- نص الترخيص: https://creativecommons.org/publicdomain/zero/1.0/

### Aaqib Azeez / Atcovi — CC BY-SA 4.0
- يُنسب التسجيل لصاحبه Atcovi على Commons، وبصوت Aaqib Azeez وفق عنوان الملف.
- أي مشاركة للملف المنزّل أو تعديله تخضع لـ CC BY-SA 4.0 مع الإسناد.
- نص الترخيص: https://creativecommons.org/licenses/by-sa/4.0/

### Aishatu98 — CC0 1.0
- الملف موسوم بـ CC0؛ لا شروط إسناد إلزامية.
- نص الترخيص: https://creativecommons.org/publicdomain/zero/1.0/

### Isaacayodele32 — CC BY-SA 4.0
- يجب الإسناد عند إعادة التوزيع، وأي تعديل يخضع لنفس الترخيص.
- نص الترخيص: https://creativecommons.org/licenses/by-sa/4.0/

## ملاحظات

- الملفات المضمنة مخزّنة محليًا لتجنّب الاعتماد على الشبكة أثناء تشغيل الأذان.
- ملفات المكتبة الخارجية وملفات المستخدم تُحفظ في IndexedDB (`adhan_blobs`)
  ولا تُصدَّر ضمن نسخة JSON الاحتياطية.
- عند إضافة صوت مضمن جديد يجب تحديث `ADHAN_SOUNDS` في `js/prayer.js`،
  وقائمة `APP_SHELL` في `sw.js`، وهذا الملف، وقسم الأذان في `README.md`.
- عند إضافة تسجيل خارجي يجب التحقق من الترخيص عبر API أولًا، لا الاعتماد على
  افتراض أن أي ملف على الإنترنت مسموح بإعادة استخدامه.
- «المقتطف القصير» هو أول 12 ثانية من نفس الملف المختار، وليس ملفًا منفصلًا.
