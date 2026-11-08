# Proposed API Contract — wallBoard /api/v1

> این قرارداد برای اتصال فرانت‌اند به Django REST Framework است؛ مسیرها تا زمان پیاده‌سازی بک‌اند فعال نیستند.

## قواعد عمومی

- JSON با UTF-8 روی HTTPS.
- قالب فهرست‌ها: `{ "count": 0, "next": null, "previous": null, "results": [] }`.
- خطاها با خطاهای استاندارد DRF یا `{ "detail": "..." }`.
- شناسه‌ها immutable و مسیر عمومی محصولات بر پایه `slug` باشد.
- واحد پول را در بک‌اند صریحاً بین ریال و تومان تعیین کنید. رابط فعلی مقدارهای عددی را با برچسب تومان نمایش می‌دهد؛ تبدیل ضمنی ممنوع است.
- قیمت و موجودی نامشخص باید `null` بمانند؛ مقدار فرضی ثبت نکنید.

## محصولات

### `GET /products/`

پارامترها: `category`, `search`, `ordering`, `availability`, `page`, `page_size`.

فیلدهای محصول:

- `id`, `slug`, `sku`, `name`, `summary`, `description`
- `category`, `category_name`, `package_label`
- `price`, `compare_at_price`, `currency`
- `stock_quantity`, `stock_status`, `status`, `is_active`
- `images`: آرایه مرتب‌شده از `{ url, alt, width, height, is_primary }`
- `specifications`: آرایه `{ label, value }`
- `compatibility`, `seo`

### `GET /products/{slug}/`

جزئیات محصول، گالری تصاویر، مشخصات، محتویات بسته، سازگاری و اطلاعات SEO را برگرداند.

### ترکیب محصولات تأییدشده برای داده اولیه

| شناسه پیشنهادی | نام محصول | محتویات بسته |
|---|---|---|
| `panel-30` | پنل اصلی پگ‌برد ۳۰×۳۰ | ۱ پنل |
| `small-clips` | گیره کوچک | ۳ گیره کوچک |
| `medium-clips` | گیره متوسط | ۲ گیره متوسط |
| `support-brackets` | گیره تکیه‌گاهی | ۲ گیره تکیه‌گاهی |
| `desk-stands` | پایه رومیزی | ۲ پایه رومیزی |
| `large-clips-with-shelf` | گیره بزرگ همراه تاقچه | ۲ گیره بزرگ + ۱ تاقچه |

مشخصات قطعات جانبی، ظرفیت بار، ابعاد و سازگاری را تا زمان تأیید فنی قطعی نکنید. برای پنل اصلی اطلاعات تأییدشده عبارت‌اند از PVC سفید، ابعاد ۳۰×۳۰ سانتی‌متر، ضخامت ۸ میلی‌متر و برش CNC.

## دسته‌بندی‌ها

### `GET /categories/` و `GET /categories/{slug}/`

نام، slug، توضیح، تصویر و تعداد محصولات هر دسته را برگردانید. دسته‌های اولیه فروشگاه `panels` و `accessories` هستند.

## بنرهای صفحه اصلی

### `GET /banners/?placement=home`

فقط بنرهای فعال و داخل بازه زمانی را به ترتیب `sort_order` برگردانید. فرانت‌اند در صورت دریافت پاسخ معتبر، محتوای استاتیک اولیه را با رکوردهای Django جایگزین می‌کند. اگر API در دسترس نباشد، اسلایدهای fallback در HTML نمایش داده می‌شوند.

فیلدهای هر اسلاید:

| فیلد | نوع | کاربرد |
|---|---|---|
| `id` | string/integer | شناسه رکورد |
| `placement` | string | محل نمایش؛ برای صفحه اصلی `home` |
| `eyebrow` | string, optional | متن کوچک بالای تیتر |
| `title` | string | خط اول تیتر |
| `accent_text` | string, optional | خط تأکیدی تیتر |
| `description` | string, optional | توضیح کوتاه |
| `cta_label` | string | متن دکمه |
| `cta_url` | string | مقصد دکمه |
| `desktop_image` | URL | تصویر اصلی بنر |
| `mobile_image` | URL, optional | تصویر اختصاصی موبایل؛ در صورت خالی بودن تصویر دسکتاپ استفاده می‌شود |
| `alt` | string | متن جایگزین تصویر |
| `footnote` | string, optional | توضیح کوچک پایین محتوا |
| `theme` | `coral`, `cream`, `ink` | یکی از تم‌های موجود در قالب فعلی |
| `sort_order` | integer | ترتیب نمایش |
| `is_active` | boolean | فعال/غیرفعال |
| `starts_at`, `ends_at` | datetime, nullable | زمان‌بندی نمایش |

نمونه پاسخ:

```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "placement": "home",
      "eyebrow": "YOUR SPACE, YOUR RULES",
      "title": "هر چیز،",
      "accent_text": "سر جای خودش!",
      "description": "فضای خودت را با قطعات wallBoard مرتب کن.",
      "cta_label": "مشاهده محصولات",
      "cta_url": "/shop/",
      "desktop_image": "/media/banners/home-main.webp",
      "mobile_image": "/media/banners/home-main-mobile.webp",
      "alt": "پنل پگ‌برد و متعلقات wallBoard",
      "footnote": "تصویرسازی فانتزی بر اساس قطعات واقعی",
      "theme": "coral",
      "sort_order": 1,
      "is_active": true,
      "starts_at": null,
      "ends_at": null
    }
  ]
}
```

متن‌ها باید به‌صورت plain text برگردند؛ فرانت‌اند آن‌ها را با `textContent` نمایش می‌دهد و HTML دلخواه داخل متن را اجرا نمی‌کند.

## احراز هویت و اطلاعات مشتری

- `POST /auth/register/`
- `POST /auth/login/`
- `POST /auth/logout/`
- `GET /users/me/`
- `GET|POST /users/me/addresses/`
- `PATCH|DELETE /users/me/addresses/{id}/`

از session cookie و CSRF استفاده کنید. توکن‌های قابل استفاده مجدد را به JavaScript تحویل ندهید.

## سبد خرید و علاقه‌مندی‌ها

- `GET /cart/`
- `PUT /cart/` با `{ "items": [{ "product_id": "...", "quantity": 1 }] }`
- `GET /wishlist/`
- `PUT /wishlist/` با `{ "product_ids": ["..."] }`

سرور باید قیمت و موجودی معتبر را دوباره از پایگاه داده بخواند. جمع مبلغ سمت کاربر قابل اعتماد نیست.

## سفارش و پرداخت

- `POST /orders/` — اعتبارسنجی سبد، نشانی ارسال، موجودی و قیمت.
- `GET /orders/`
- `GET /orders/{order_number}/`
- `POST /payments/initialize/` با `{ "order_id": "..." }`
- callback و verification درگاه فقط سمت سرور انجام شود.

هیچ‌وقت مبلغ قابل پرداخت را از ورودی مرورگر به‌عنوان مبلغ نهایی قبول نکنید.

## پیام تماس و دیدگاه‌ها (اختیاری)

- `POST /contact-messages/`
- `GET /products/{slug}/reviews/`
- `POST /products/{slug}/reviews/` (احراز هویت و moderation الزامی)

