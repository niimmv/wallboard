# Release QA Report — wallBoard Storefront / Django Admin

## بررسی‌های اجراشده در این بسته

- ساخت پیش‌نمایش مستقل با `python tools/build_standalone.py` موفق بود.
- بررسی پروژه با `python tools/check_project.py` موفق بود: ۱۶ صفحه، لینک‌ها و assetهای محلی، RTL فارسی، رنگ برند، زمان اسلایدر، شش تصویر محصول و سه تصویر بنر.
- تست smoke با `node tests/node-smoke.mjs` موفق بود؛ شامل داده‌های شش محصول، تعداد بسته‌ها، سبد، علاقه‌مندی، adapter جنگو و بارگذاری کاتالوگ و تصویر از مسیر `/media/`.
- ۲۳ فایل JavaScript منبع و خروجی با `node --check` بررسی شدند؛ خطای syntax وجود نداشت.
- مجموع فایل‌های WebP محصول و بنر در سورس حدود ۶۸۰ کیلوبایت است.
- هیچ صفحه، bundle یا اسکریپت پنل مدیریت اختصاصی در بسته وجود ندارد؛ `/admin/` برای Django Admin رزرو شده است.

## مواردی که در این محیط اجرا نشدند

- نصب npm dependencyها انجام نشده؛ بنابراین ESLint، Vitest، Vite production build و Playwright E2E اجرا نشده‌اند.
- تست واقعی API با Django، احراز هویت، CSRF، سفارش، پرداخت و آپلود در Django Admin اجرا نشده؛ بک‌اند در این ZIP وجود ندارد.
- Lighthouse و Core Web Vitals روی دامنه production اجرا نشده‌اند.

## پیش از انتشار production

1. در `developer-source/` دستور `npm install` اجرا شود؛ سپس `npm run check` و `npm run test:e2e`.
2. مدل `HomeBanner`، مدل تصاویر محصول و endpointهای API طبق مستندات Django پیاده‌سازی شوند.
3. متن و تصویر هر بنر، تصویر موبایل، زمان‌بندی و ترتیب از Django Admin تست شود.
4. تمام صفحات در عرض‌های ۳۲۰ تا ۱۹۲۰ پیکسل و روی دستگاه واقعی بررسی شوند.
5. Lighthouse موبایل/دسکتاپ و Core Web Vitals روی دامنه HTTPS بررسی شوند.
6. عنوان، canonical، sitemap، Product JSON-LD و محتوای server-rendered توسط SEO بررسی شوند.
