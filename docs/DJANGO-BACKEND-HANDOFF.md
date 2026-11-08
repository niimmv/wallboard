# Django Backend Handoff — wallBoard

## 1. اصل اتصال

این بسته فقط فرانت‌اند فروشگاه عمومی wallBoard است. قالب فعلی، صفحات و رفتارهای رابط کاربری باید حفظ شوند. هیچ پنل مدیریت سفارشی در HTML/CSS/JavaScript وجود ندارد؛ مسیر `/admin/` متعلق به Django Admin است.

Django منبع حقیقت برای کاتالوگ، قیمت، موجودی، مشتری، سبد، سفارش، پرداخت، بنرها و فایل‌های رسانه است. اطلاعات ذخیره‌شده در مرورگر صرفاً برای پیش‌نمایش و تجربه موقت کاربر هستند و نباید مرجع قیمت یا موجودی باشند.

## 2. معماری پیشنهادی

- Django + Django REST Framework برای `/api/v1/`.
- صفحات SEO-critical محصول و دسته‌بندی با Django Templates سمت سرور render شوند.
- خروجی Vite از `developer-source/` ساخته و در static root یا CDN ارائه شود.
- `site/` فقط پیش‌نمایش مستقل محلی است و نباید به‌عنوان استقرار production استفاده شود.
- احراز هویت با session cookie امن و CSRF هم‌مبدأ انجام شود؛ رمز یا access token در `localStorage` ذخیره نشود.
- فایل‌های media توسط Django یا فضای ذخیره‌سازی/CDN ارائه شوند.

## 3. Django Admin

مدیریت محصولات، تصاویر، دسته‌ها، قیمت، موجودی، بنرها، مشتریان، سفارش‌ها و رسانه‌ها از Django Admin انجام شود.

برای مدیریت بنرها، مدل پیشنهادی:

```python
from django.db import models
from django.utils import timezone


class HomeBanner(models.Model):
    THEME_CHOICES = [
        ("coral", "قرمز wallBoard"),
        ("cream", "کرم"),
        ("ink", "تیره"),
    ]

    placement = models.CharField(max_length=40, default="home", db_index=True)
    eyebrow = models.CharField(max_length=120, blank=True)
    title = models.CharField(max_length=180)
    accent_text = models.CharField(max_length=180, blank=True)
    description = models.CharField(max_length=300, blank=True)
    cta_label = models.CharField(max_length=80, default="مشاهده محصولات")
    cta_url = models.CharField(max_length=300, default="/shop/")
    desktop_image = models.ImageField(upload_to="banners/desktop/")
    mobile_image = models.ImageField(
        upload_to="banners/mobile/",
        blank=True,
        null=True,
    )
    alt = models.CharField(max_length=240)
    footnote = models.CharField(max_length=180, blank=True)
    theme = models.CharField(max_length=12, choices=THEME_CHOICES, default="coral")
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    starts_at = models.DateTimeField(blank=True, null=True)
    ends_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("sort_order", "id")

    def is_visible_now(self):
        now = timezone.now()
        return (
            self.is_active
            and (self.starts_at is None or self.starts_at <= now)
            and (self.ends_at is None or self.ends_at >= now)
        )

    def __str__(self):
        return self.title
```

ثبت در Django Admin:

```python
from django.contrib import admin
from .models import HomeBanner


@admin.register(HomeBanner)
class HomeBannerAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "placement",
        "theme",
        "is_active",
        "sort_order",
        "starts_at",
        "ends_at",
    )
    list_editable = ("is_active", "sort_order")
    list_filter = ("placement", "theme", "is_active")
    search_fields = ("title", "accent_text", "description")
    ordering = ("sort_order", "id")
    fieldsets = (
        ("محتوای بنر", {
            "fields": (
                "placement",
                "eyebrow",
                "title",
                "accent_text",
                "description",
                "cta_label",
                "cta_url",
                "footnote",
            )
        }),
        ("تصاویر", {
            "fields": ("desktop_image", "mobile_image", "alt")
        }),
        ("نمایش", {
            "fields": (
                "theme",
                "sort_order",
                "is_active",
                "starts_at",
                "ends_at",
            )
        }),
    )
```

در endpoint بنر، فقط رکوردهایی برگردند که `is_visible_now()` برایشان درست است. فرانت‌اند از `title`, `accent_text`, `description`, `cta_label`, `cta_url`, `desktop_image`, `mobile_image`, `alt`, `footnote` و `theme` استفاده می‌کند. متن‌ها باید plain text باشند؛ HTML از پنل نباید اجرا شود.

برای تصاویر محصول، مدل جداگانه‌ای مانند `ProductImage` با `image`, `alt`, `sort_order` و `is_primary` بسازید و آن را به‌صورت inline در صفحه ویرایش محصول Django Admin نمایش دهید.

## 4. کاتالوگ و قطعات تأییدشده

محصولات اولیه و تعداد داخل هر بسته:

| محصول | تعداد داخل بسته |
|---|---:|
| پنل اصلی پگ‌برد ۳۰×۳۰ | ۱ پنل |
| گیره کوچک | ۳ عدد |
| گیره متوسط | ۲ عدد |
| گیره تکیه‌گاهی | ۲ عدد |
| پایه رومیزی | ۲ عدد |
| گیره بزرگ همراه تاقچه | ۲ گیره بزرگ + ۱ تاقچه |

مشخصات تأییدشده پنل اصلی: PVC سفید، ابعاد ۳۰×۳۰ سانتی‌متر، ضخامت ۸ میلی‌متر، برش CNC.

برای گیره‌ها و پایه‌ها ابعاد، جنس نهایی، ظرفیت بار، روش اتصال و سازگاری را تا زمان تأیید فنی وارد نکنید. قیمت و موجودی فعلاً نامشخص‌اند و باید `null` بمانند تا مالک کسب‌وکار آن‌ها را تعیین کند.

فیلدهای پیشنهادی محصول:

- `id`, `slug`, `sku`, `name`, `summary`, `description`
- `category`, `package_label`, `price`, `compare_at_price`, `currency`
- `stock_quantity`, `stock_status`, `is_active`
- `images` با `url`, `alt`, `width`, `height`, `is_primary`
- `specifications`, `compatibility`
- `seo_title`, `seo_description`, `canonical_path`, `og_image`

## 5. API و بارگذاری محتوا

فرانت‌اند در شروع صفحه تلاش می‌کند این endpointها را بخواند:

- `GET /api/v1/banners/?placement=home`
- `GET /api/v1/products/?page_size=100`

اگر API پاسخ معتبر بدهد، داده‌های Django جایگزین fallback محلی می‌شوند. اگر Django هنوز متصل نشده باشد یا endpoint خطا بدهد، پیش‌نمایش با داده‌ها و تصاویر داخل پروژه کار می‌کند.

قرارداد کامل فیلدها در `API-CONTRACT.md` است. فرانت‌اند برای تصاویر مسیرهای `/media/...`, `/images/...` و URL کامل HTTP(S) را می‌پذیرد.

## 6. سبد، سفارش و پرداخت

- مرورگر فقط `product_id` و `quantity` را برای وضعیت موقت نگه می‌دارد.
- Django قیمت روز، موجودی، تخفیف، هزینه ارسال و مبلغ نهایی را دوباره محاسبه کند.
- ثبت سفارش باید شماره سفارش سمت سرور برگرداند.
- سفارش فقط بعد از تأیید سرور به‌عنوان پرداخت‌شده نمایش داده شود.
- آغاز پرداخت، callback، verify و کلیدهای محرمانه فقط سمت سرور بمانند.

## 7. امنیت

- session cookie با `Secure`, `HttpOnly`, `SameSite` در محیط production.
- CSRF برای درخواست‌های تغییردهنده داده.
- مجوز سمت سرور برای همه endpointهای مدیریتی و اطلاعات مشتری.
- محدودیت نرخ برای ورود، ثبت‌نام، فرم تماس و آغاز پرداخت.
- اعتبارسنجی MIME، حجم، ابعاد و نام فایل در زمان آپلود تصویر.
- نگهداری media خارج از مسیرهای اجرایی و ثبت audit log برای تغییرات مهم پنل.
- هیچ قیمت، موجودی، مجوز یا مبلغ پرداختی را از DOM یا localStorage معتبر فرض نکنید.

## 8. مسیرهای صفحات

نگاشت مسیرها در `DJANGO-TEMPLATE-MAPPING.md` آمده است. مسیر `/admin/` باید مستقیماً به Django Admin برسد و هرگز به فایل استاتیک فروشگاه rewrite نشود.

## 9. چک‌لیست پیش از انتشار

- [ ] تأیید دامنه، HTTPS و routing هم‌مبدأ `/api/`.
- [ ] پیاده‌سازی مدل‌های محصول، تصاویر، دسته‌بندی و بنر.
- [ ] فعال‌سازی و تست آپلود تصاویر در Django Admin.
- [ ] پیاده‌سازی endpointهای کاتالوگ و بنر مطابق API contract.
- [ ] تأیید قیمت، موجودی، ارز و محتوای دقیق بسته‌ها.
- [ ] پیاده‌سازی احراز هویت، session و CSRF.
- [ ] پیاده‌سازی سبد، سفارش، ارسال، تخفیف و پرداخت سمت سرور.
- [ ] رندر server-side عنوان، توضیح، canonical و JSON-LD صفحات محصول.
- [ ] تست امنیتی، دسترس‌پذیری، موبایل و Core Web Vitals.
