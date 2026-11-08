# Django Template & URL Mapping — wallBoard

این راهنما مسیر تبدیل فایل‌های پیش‌نمایش به Django templates را برای تیم بک‌اند مشخص می‌کند.

## صفحه‌ها و مسیر پیشنهادی

| صفحه فعلی در فرانت‌اند | مسیر پیشنهادی در Django | توضیح |
|---|---|---|
| `index.html` | `/` | Home و بنرهای فعال |
| `shop.html` | `/shop/` | فهرست محصولات و فیلترها |
| `categories.html` | `/categories/` | دسته‌بندی‌ها |
| `product.html?slug=...` | `/products/<slug>/` | صفحه محصول با SSR و SEO |
| `cart.html` | `/cart/` | سبد کاربر |
| `checkout.html` | `/checkout/` | تسویه‌حساب؛ قیمت و جمع فقط سمت سرور |
| `favorites.html` | `/favorites/` | علاقه‌مندی‌های کاربر |
| `account.html` | `/account/` | ورود، ثبت‌نام و پروفایل |
| `about.html` | `/about/` | درباره برند |
| `gallery.html` | `/gallery/` | گالری و الهام |
| `faq.html` | `/faq/` | سوالات متداول |
| `contact.html` | `/contact/` | فرم تماس |
| `shipping.html` | `/shipping/` | ارسال |
| `returns.html` | `/returns/` | مرجوعی |
| `privacy.html` | `/privacy/` | حریم خصوصی |
| `terms.html` | `/terms/` | قوانین |
| پنل واقعی | `/admin/` | Django Admin، با احراز هویت و مجوز سمت سرور |

## پیشنهاد ساختار templates

```text
templates/
  base.html
  includes/
    header.html
    footer.html
    messages.html
  pages/
    home.html
    shop.html
    categories.html
    product_detail.html
    cart.html
    checkout.html
    account.html
    about.html
    gallery.html
    faq.html
    contact.html
    shipping.html
    returns.html
    privacy.html
    terms.html
```

## تبدیل فایل‌ها

- هدر و فوتر را به include مشترک تبدیل کنید تا ناوبری و footer در همه صفحات یکسان باشد.
- مسیرهای `/src/...` در نسخه Vite به bundleهای `/assets/...` تبدیل می‌شوند؛ از `static` tag جنگو برای assetهای buildشده استفاده کنید.
- مسیر تصاویر API را از فیلد `images[].url` بخوانید و alt را از `images[].alt` بگیرید.
- در صفحه محصول، title/description/canonical و JSON-LD را در HTML سمت سرور رندر کنید.
- برای فرم‌های POST، CSRF template tag و CSRF cookie را فعال نگه دارید.
- `data-*` hooks فعلی برای اتصال تدریجی JS حفظ شوند؛ منطق قیمت و موجودی به سمت سرور منتقل شود.
