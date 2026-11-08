# wallBoard — Frontend Source

این پوشه سورس اصلی فروشگاه است و شامل پنل مدیریت اختصاصی نیست. پنل مدیریت production از Django Admin ارائه می‌شود.

## اجرای توسعه

```bash
npm install
npm run dev
```

## بررسی و ساخت

```bash
npm run lint
npm run test
npm run build
npm run budget
npm run test:e2e
```

## نقشه سورس

- `src/data/products.js`: شش گروه قطعه و تعداد دقیق هر بسته؛ قیمت و موجودی تأییدنشده `null` است.
- `src/services/catalog.js`: دسترسی و فیلتر کاتالوگ نمایشی.
- `src/services/django-api.js`: adapter برای Django REST Framework؛ `src/features/hero-content.js` بنرهای Django را بارگذاری می‌کند و `src/services/catalog.js` کاتالوگ را از API می‌خواند؛ در نبود API از fallback محلی استفاده می‌شود.
- `src/services/cart.js` و `favorites.js`: وضعیت موقت سمت مرورگر برای پیش‌نمایش.
- `src/features/`: رفتارهای صفحه، اسلایدر، بارگذاری بنرهای Django و prefetch.
- `src/components/product.js`: کارت، تصویر و گالری محصول؛ تصاویر از فایل رسانه‌ای خوانده می‌شوند و قطعات با CSS ترسیم نمی‌شوند.
- `src/styles/tokens.css`: توکن‌های مرکزی رنگ، تایپوگرافی و فاصله‌ها.
- `scripts/`: بررسی بودجه فایل‌ها و بهینه‌سازی اختیاری تصاویر (نیازمند Pillow).
- `tests/`: تست واحد و E2E.

## اتصال به Django

پیشنهاد API در `../docs/API-CONTRACT.md` و نگاشت قالب در `../docs/DJANGO-TEMPLATE-MAPPING.md` است. قیمت نهایی، موجودی، مجوزها، محاسبه سبد و پرداخت باید در سرور Django اعتبارسنجی شوند. برای احراز هویت از session و CSRF هم‌مبدأ استفاده شود.
