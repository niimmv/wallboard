import { select, selectAll, escapeHtml, notify } from '../lib/dom.js';
import { faNumber, priceText, hasConfirmedPrice } from '../lib/format.js';
import { listProducts, getProduct } from '../services/catalog.js';
import {
  cartEntries,
  cartCount,
  cartTotal,
  changeCartQuantity,
  removeCartItem,
} from '../services/cart.js';
import { getFavorites, toggleFavorite } from '../services/favorites.js';
import { productArt, renderProductGrid, productPhotos } from '../components/product.js';

let refreshShopResults = null;

function updateNavigationCounts() {
  selectAll('[data-cart-count]').forEach((node) => {
    node.textContent = faNumber(cartCount());
  });

  selectAll('[data-favorites-count]').forEach((node) => {
    node.textContent = faNumber(getFavorites().length);
  });
}

function updateAmountLabels() {
  const { amount, pricesComplete } = cartTotal();
  const label = pricesComplete && cartCount() > 0
    ? `${faNumber(amount)} تومان`
    : 'پس از تعیین همه قیمت‌ها';

  selectAll('[data-cart-total]').forEach((node) => {
    node.textContent = label;
  });
}

function setupNavigation() {
  const menu = select('#mobileNav');
  const trigger = select('[data-menu-button]');

  if (!menu || !trigger) {
    return;
  }

  const header = select('.site-header');

  function updateMenuPosition() {
    if (!header) {
      return;
    }

    const headerBottom = header.getBoundingClientRect().bottom;
    menu.style.setProperty('--mobile-menu-top', `${Math.round(headerBottom + 8)}px`);
  }

  function setOpen(open) {
    menu.classList.toggle('open', open);
    trigger.setAttribute('aria-expanded', String(open));
    trigger.textContent = open ? '×' : '☰';

    if (open) {
      updateMenuPosition();
    }
  }

  window.addEventListener('scroll', () => {
    if (menu.classList.contains('open')) {
      updateMenuPosition();
    }
  }, { passive: true });

  window.addEventListener('resize', updateMenuPosition);

  trigger.addEventListener('click', () => {
    setOpen(!menu.classList.contains('open'));
  });

  selectAll('a', menu).forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  });

  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target) && !trigger.contains(event.target)) {
      setOpen(false);
    }
  });
}

function setupHome() {
  const grid = select('[data-product-grid][data-limit]');

  if (grid) {
    renderProductGrid(grid, listProducts().slice(0, Number(grid.dataset.limit) || 4));
  }
}

function setupShop() {
  const grid = select('#productGrid');

  if (!grid || document.body.dataset.page !== 'shop.html') {
    return;
  }

  const allowedCategories = new Set(['all', 'panels', 'accessories']);
  const categoryParam = new URLSearchParams(window.location.search).get('category');
  const searchInput = select('#productSearch');
  const sortInput = select('#sortProducts');
  const availabilityInput = select('#availabilityFilter');
  const moreButton = select('#loadMoreProducts');
  const resultCount = select('#resultCount');

  let category = allowedCategories.has(categoryParam) ? categoryParam : 'all';
  let visibleCount = 6;
  let matchingProducts = [];

  function renderResults() {
    renderProductGrid(grid, matchingProducts.slice(0, visibleCount));

    if (resultCount) {
      resultCount.textContent = `${faNumber(Math.min(visibleCount, matchingProducts.length))} از ${faNumber(matchingProducts.length)} محصول`;
    }

    if (moreButton) {
      moreButton.hidden = matchingProducts.length <= visibleCount;
    }
  }

  function applyFilters() {
    const query = (searchInput?.value || '').trim().toLocaleLowerCase('fa');
    const availability = availabilityInput?.value || 'all';
    const sort = sortInput?.value || 'default';

    matchingProducts = listProducts().filter((product) => {
      const matchesCategory = category === 'all' || product.category === category;
      const matchesQuery = `${product.name} ${product.summary} ${product.sku}`
        .toLocaleLowerCase('fa').includes(query);
      const matchesAvailability = availability !== 'available'
        || (Number.isInteger(product.stock) && product.stock > 0);

      return matchesCategory && matchesQuery && matchesAvailability;
    });

    if (sort === 'name') {
      matchingProducts.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    } else if (sort === 'price-asc' || sort === 'price-desc') {
      const multiplier = sort === 'price-asc' ? 1 : -1;
      matchingProducts.sort((a, b) => {
        const aPriced = hasConfirmedPrice(a);
        const bPriced = hasConfirmedPrice(b);

        if (aPriced !== bPriced) {
          return aPriced ? -1 : 1;
        }

        return aPriced && bPriced ? (a.price - b.price) * multiplier : 0;
      });
    }

    visibleCount = 6;
    renderResults();

    selectAll('[data-filter]').forEach((button) => {
      const active = button.dataset.filter === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  selectAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      category = button.dataset.filter;
      const url = category === 'all' ? 'shop.html' : `shop.html?category=${category}`;
      window.history.replaceState(null, '', url);
      applyFilters();
    });
  });

  searchInput?.addEventListener('input', applyFilters);
  sortInput?.addEventListener('change', applyFilters);
  availabilityInput?.addEventListener('change', applyFilters);
  moreButton?.addEventListener('click', () => {
    visibleCount += 6;
    renderResults();
  });

  refreshShopResults = applyFilters;
  applyFilters();
}

function setupProductDetails() {
  const container = select('#productDetail');

  if (!container) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const productKey = params.get('slug') || params.get('id') || 'panel-30';
  const product = getProduct(productKey);

  if (!product) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>این محصول پیدا نشد.</h2>
        <a href="shop.html" class="button button-dark">بازگشت به فروشگاه</a>
      </div>
    `;
    return;
  }

  document.title = `${product.name} | wallBoard`;
  const description = `${product.name}؛ مشاهده تصاویر، مشخصات و اطلاعات محصول در فروشگاه wallBoard.`;
  const descriptionMeta = document.querySelector('meta[name="description"]');
  const ogTitleMeta = document.querySelector('meta[property="og:title"]');
  const ogDescriptionMeta = document.querySelector('meta[property="og:description"]');
  const twitterTitleMeta = document.querySelector('meta[name="twitter:title"]');
  const twitterDescriptionMeta = document.querySelector('meta[name="twitter:description"]');
  if (descriptionMeta) descriptionMeta.content = description;
  if (ogTitleMeta) ogTitleMeta.content = document.title;
  if (ogDescriptionMeta) ogDescriptionMeta.content = description;
  if (twitterTitleMeta) twitterTitleMeta.content = document.title;
  if (twitterDescriptionMeta) twitterDescriptionMeta.content = description;
  const photos = productPhotos(product);
  const isFavorite = getFavorites().includes(product.id);
  const stockLabel = Number.isInteger(product.stock)
    ? (product.stock > 0 ? `${faNumber(product.stock)} عدد` : 'ناموجود')
    : 'هنوز تأیید نشده';

  const thumbnails = photos.length > 1
    ? `<div class="detail-gallery__thumbnails" role="group" aria-label="گالری عکس‌های محصول">
      ${photos.map((photo, index) => `
        <button
          type="button"
          data-photo-index="${index}"
          aria-label="نمایش عکس ${faNumber(index + 1)}"
          aria-pressed="${index === 0}"
          class="detail-gallery__thumbnail ${index === 0 ? 'is-active' : ''}"
        >
          <img src="${escapeHtml(photo.url)}" alt="" loading="lazy" width="88" height="88">
        </button>
      `).join('')}
    </div>`
    : '';

  container.innerHTML = `
    <div class="detail-gallery">
      <div class="detail-art" id="detailMainImage">
        ${productArt(product, { eager: true })}
      </div>
      ${thumbnails}
      <p class="muted small">${photos.length
        ? 'تصاویر در اندازه ثابت و با حفظ تناسب اصلی نمایش داده می‌شوند.'
        : 'تصویر محصول هنوز از طریق مدیریت رسانه بارگذاری نشده است.'}</p>
    </div>
    <div class="detail-content">
      <span class="kicker">${escapeHtml(product.categoryName)} / WALLBOARD</span>
      <h2>${escapeHtml(product.name)}</h2>
      <p class="detail-description">${escapeHtml(product.summary)}</p>
      <div class="detail-facts">
        <strong>${priceText(product)}</strong>
        <span>موجودی: ${stockLabel}</span>
      </div>
      <div class="detail-buttons">
        <div class="quantity-control" aria-label="انتخاب تعداد">
          <button type="button" id="qtyMinus" aria-label="کاهش تعداد">−</button>
          <output id="qtyValue" aria-live="polite">۱</output>
          <button type="button" id="qtyPlus" aria-label="افزایش تعداد">+</button>
        </div>
        <button type="button" class="button button-dark" id="detailAdd">
          افزودن به سبد انتخاب‌ها ←
        </button>
        <button
          type="button"
          class="heart-button"
          data-favorite="${escapeHtml(product.id)}"
          aria-label="${isFavorite ? 'حذف از' : 'افزودن به'} علاقه‌مندی‌ها"
          aria-pressed="${isFavorite}"
        >${isFavorite ? '♥' : '♡'}</button>
      </div>
      <p class="muted small">ثبت سفارش و پرداخت واقعی هنوز فعال نیست.</p>
      <div class="detail-accordions">
        <details open>
          <summary>مشخصات فنی</summary>
          <ul class="spec-list">
            ${product.specs.length
              ? product.specs.map((spec) => `<li>${escapeHtml(spec)}</li>`).join('')
              : '<li>اطلاعات فنی این قطعه در انتظار تأیید است.</li>'}
          </ul>
        </details>
        <details>
          <summary>سازگاری و محتویات</summary>
          <p>سازگاری قطعات و ترکیب بسته بر اساس فایل‌های نهایی تولید تأیید خواهد شد.
          برای تصمیم‌گیری درباره نصب و ظرفیت بار، اطلاعات اعلام‌نشده را قطعی فرض نکن.</p>
        </details>
        <details>
          <summary>راهنمای نصب</summary>
          <p>راهنمای نصب دقیق پس از بررسی هندسه قطعات و نحوه اتصال تهیه می‌شود.</p>
        </details>
      </div>
    </div>
  `;

  selectAll('[data-photo-index]', container).forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.photoIndex);
      select('#detailMainImage').innerHTML = productArt(product, {
        eager: true,
        photoIndex: index,
      });

      selectAll('[data-photo-index]', container).forEach((thumbnail) => {
        const active = thumbnail === button;
        thumbnail.classList.toggle('is-active', active);
        thumbnail.setAttribute('aria-pressed', String(active));
      });
    });
  });

  let quantity = 1;
  const output = select('#qtyValue');

  select('#qtyMinus').addEventListener('click', () => {
    quantity = Math.max(1, quantity - 1);
    output.textContent = faNumber(quantity);
  });

  select('#qtyPlus').addEventListener('click', () => {
    quantity = Math.min(99, quantity + 1);
    output.textContent = faNumber(quantity);
  });

  select('#detailAdd').addEventListener('click', () => {
    addItem(product.id, quantity);
  });

  renderProductGrid(
    select('#relatedGrid'),
    listProducts().filter((item) => item.id !== product.id && item.category === product.category)
      .concat(listProducts().filter((item) => item.id !== product.id && item.category !== product.category))
      .slice(0, 3),
  );
}

function renderCart() {
  const container = select('#cartItems');

  if (!container) {
    return;
  }

  const entries = cartEntries();

  if (!entries.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span>☹</span>
        <h2>سبدت هنوز خالیه!</h2>
        <p>از فروشگاه چیزی انتخاب کن.</p>
        <a href="shop.html" class="button button-dark">رفتن به فروشگاه ←</a>
      </div>
    `;
    return;
  }

  container.innerHTML = entries.map(({ product, quantity }) => `
    <div class="cart-row">
      <a href="product.html?id=${encodeURIComponent(product.id)}" class="cart-picture">
        ${productArt(product)}
      </a>
      <div>
        <span class="kicker">${escapeHtml(product.categoryName)}</span>
        <h3><a href="product.html?id=${encodeURIComponent(product.id)}">
          ${escapeHtml(product.name)}
        </a></h3>
        <p class="muted small">${priceText(product)}</p>
        <div class="quantity-control">
          <button type="button" data-qty="-1" data-id="${escapeHtml(product.id)}"
            aria-label="کاهش تعداد">−</button>
          <output>${faNumber(quantity)}</output>
          <button type="button" data-qty="1" data-id="${escapeHtml(product.id)}"
            aria-label="افزایش تعداد">+</button>
        </div>
      </div>
      <button type="button" class="remove-button"
        data-remove="${escapeHtml(product.id)}">حذف ×</button>
    </div>
  `).join('');

  updateAmountLabels();
}

function renderCheckout() {
  const container = select('#checkoutItems');

  if (!container) {
    return;
  }

  const entries = cartEntries();
  container.innerHTML = entries.length
    ? entries.map(({ product, quantity }) => `
      <div class="summary-line">
        <span>${escapeHtml(product.name)} × ${faNumber(quantity)}</span>
        <b>${priceText(product)}</b>
      </div>
    `).join('')
    : '<p class="muted">سبد خالی است. <a href="shop.html">فروشگاه</a></p>';

  updateAmountLabels();
}

function renderFavorites() {
  const container = select('#favoritesGrid');

  if (!container) {
    return;
  }

  const products = getFavorites().map(getProduct).filter(Boolean);
  renderProductGrid(container, products);

  if (select('#favoritesEmpty')) {
    select('#favoritesEmpty').hidden = products.length > 0;
  }
}

function addItem(id, quantity = 1) {
  const product = getProduct(id);

  if (!product) {
    return;
  }

  const saved = changeCartQuantity(id, quantity);
  notify(saved ? `${product.name} به سبد انتخاب‌ها اضافه شد` : 'ذخیره‌سازی مرورگر در دسترس نیست');
  refreshCartViews();
}

function refreshCartViews() {
  updateNavigationCounts();
  renderCart();
  renderCheckout();
  updateAmountLabels();
}

function setupActions() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');

    if (!button) {
      return;
    }

    if (button.dataset.add) {
      addItem(button.dataset.add);
      return;
    }

    if (button.dataset.favorite) {
      const added = toggleFavorite(button.dataset.favorite);
      const saved = getFavorites();

      selectAll('[data-favorite]').forEach((favoriteButton) => {
        const active = saved.includes(favoriteButton.dataset.favorite);
        favoriteButton.classList.toggle('is-favorite', active);
        favoriteButton.textContent = active ? '♥' : '♡';
        favoriteButton.setAttribute('aria-pressed', String(active));
        favoriteButton.setAttribute('aria-label', active ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها');
      });

      updateNavigationCounts();
      renderFavorites();
      notify(added ? 'به علاقه‌مندی‌ها اضافه شد ♥' : 'از علاقه‌مندی‌ها حذف شد');
      return;
    }

    if (button.dataset.qty) {
      changeCartQuantity(button.dataset.id, Number(button.dataset.qty));
      refreshCartViews();
      return;
    }

    if (button.dataset.remove) {
      removeCartItem(button.dataset.remove);
      refreshCartViews();
      notify('کالا از سبد انتخاب‌ها حذف شد');
    }
  });
}

function setupDemoForms() {
  const forms = [
    ['contactForm', 'contactFeedback', 'فرم بررسی شد اما هیچ پیامی ارسال نشده است.'],
    ['checkoutForm', 'checkoutFeedback', 'فرم معتبر است اما هیچ سفارشی ثبت یا پرداخت نشده است.'],
  ];

  for (const [formId, feedbackId, message] of forms) {
    const form = select(`#${formId}`);

    form?.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!form.reportValidity()) {
        return;
      }

      const feedback = select(`#${feedbackId}`);
      if (feedback) {
        feedback.textContent = message;
      }

      notify('این بخش فعلاً نمایشی است');
    });
  }
}

function setupImageFallbacks() {
  // Missing user-supplied photos must never become broken-image icons.
  document.addEventListener('error', (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.hasAttribute('data-product-image')) {
      return;
    }

    const product = getProduct(image.dataset.productId);
    const frame = image.closest('.product-art');
    if (!product || !frame) {
      return;
    }

    const replacement = document.createElement('div');
    replacement.innerHTML = productArt({ ...product, image: null, images: [] });
    frame.replaceWith(replacement.firstElementChild);
  }, true);
}

export function refreshStorefrontCatalog() {
  setupHome();
  refreshShopResults?.();
  setupProductDetails();
  renderFavorites();
  refreshCartViews();
}

export function initializeStorefront() {
  setupImageFallbacks();
  setupNavigation();
  setupActions();
  setupHome();
  setupShop();
  setupProductDetails();
  setupDemoForms();
  renderFavorites();
  refreshCartViews();

  window.addEventListener('storage', () => {
    // Keep multiple tabs synchronized; cross-tab changes are browser-local only.
    window.location.reload();
  });
}
