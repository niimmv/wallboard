# wallBoard — نسخه نهایی فروشگاه (Django Admin)

این بسته فقط فرانت‌اند فروشگاه wallBoard را شامل می‌شود. **هیچ پنل مدیریتی اختصاصی در فرانت‌اند وجود ندارد**؛ مدیریت محصولات، دسته‌بندی‌ها، تصاویر، موجودی، سفارش‌ها و کاربران با Django Admin انجام خواهد شد.

## شروع سریع — پیش‌نمایش روی ویندوز

1. فایل ZIP را کامل استخراج کنید.
2. روی `RUN-WALLBOARD-WINDOWS.bat` دوبار کلیک کنید.
3. مرورگر به پیش‌نمایش محلی فروشگاه هدایت می‌شود.
4. برای توقف سرور، پنجره اجرا را با `Ctrl + C` ببندید.

این پیش‌نمایش از Python استاندارد استفاده می‌کند؛ اگر Python نصب نباشد، فایل BAT از PowerShell داخلی ویندوز کمک می‌گیرد. این سرور فقط برای مشاهده محلی است و سرور production نیست.

## ساختار پروژه

```text
wallBoard-storefront/
├── site/                    # خروجی مستقل و قابل پیش‌نمایش
├── developer-source/        # سورس اصلی HTML/CSS/JS و Vite
├── docs/                    # مستندات تحویل به Django و SEO
├── tools/                   # build و بررسی‌های پروژه
├── run_server.py            # سرور پیش‌نمایش محلی
├── run_server_windows.ps1   # fallback ویندوز بدون Python
└── RUN-WALLBOARD-WINDOWS.bat
```

## توسعه فرانت‌اند

نیازمندی: Node.js نسخه LTS و npm.

```bash
cd developer-source
npm install
npm run dev
```

ساخت نسخه production و اجرای تست‌ها:

```bash
npm run check
npm run build
npm run test:e2e
```

برای بازسازی نسخه مستقل بدون npm از ریشه پروژه اجرا کنید:

```bash
python tools/build_standalone.py
python tools/check_project.py
```

## تحویل به برنامه‌نویس Django

قبل از اتصال، این اسناد را به‌ترتیب بخوانید:

1. `docs/DJANGO-BACKEND-HANDOFF.md` — مسئولیت‌ها و الزامات بک‌اند
2. `docs/API-CONTRACT.md` — قرارداد پیشنهادی API نسخه ۱
3. `docs/DJANGO-TEMPLATE-MAPPING.md` — تبدیل صفحات به Django Templates و URLها
4. `docs/ASSET-GUIDE.md` — تصاویر و رسانه
5. `docs/SEO-HANDOFF.md` — کارهای فنی SEO و SSR
6. `docs/QA-REPORT.md` — وضعیت تست‌ها و موارد باقی‌مانده

Django باید مالک مسیرهای `/admin/`، `/api/`، احراز هویت، سبد و سفارش سمت سرور، پرداخت، فایل‌های media و رندر صفحات SEO باشد. برای مدیریت بنرها، مدل `HomeBanner` و endpoint بنر مطابق `docs/DJANGO-BACKEND-HANDOFF.md` پیاده‌سازی شود. نمونه Nginx در `developer-source/deploy/nginx.example.conf` صرفاً الگو است و باید با دامنه و مسیرهای سرور واقعی تنظیم شود.

## وضعیت قابلیت‌ها

- ظاهر، ناوبری، صفحات فروشگاه، اسلایدر و تعاملات سمت مرورگر: پیش‌نمایش فرانت‌اند
- قیمت، موجودی، ثبت سفارش، ورود و پرداخت واقعی: نیازمند Django و سرویس‌های متصل
- محصولات: شش گروه قطعه با تعداد بسته‌بندی تأییدشده؛ قیمت و موجودی تأییدنشده عمداً `null` هستند
- تصاویر محصولات: تصویرسازی فانتزی وفادار به فرم شش قطعه واقعی ارسالی؛ نه نقشه ابعادی یا تأیید ظرفیت بار
- رنگ اصلی برند: `#FF636C`
- اسلایدر صفحه اصلی: تعویض خودکار هر ۵ ثانیه؛ متن و تصاویر نسخه متصل از Django Admin مدیریت می‌شوند

**این ZIP یک پروژه فرانت‌اند آماده تحویل است، نه فروشگاه production متصل.** قبل از انتشار عمومی، اتصال بک‌اند، تست امنیتی، تست مرورگر و Lighthouse روی دامنه نهایی الزامی است.


## Responsive implementation

The final responsive rules are centralized in `site/assets/css/mobile-experience.css`.
The Vite source mirror is `developer-source/src/styles/mobile-experience.css`.
This layer is loaded after the earlier design layers so it owns the final desktop,
tablet and mobile adjustments without changing the approved wallBoard brand system.

Mobile behavior includes a compact boxed hero, two-column product cards down to 320px,
balanced category and gallery tiles, dedicated product/cart/checkout layouts, and a
mobile menu positioned from the sticky header. The Playwright suite includes viewport
overflow and navigation-position checks across phone, tablet and desktop widths.
