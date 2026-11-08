import { escapeHtml } from '../lib/dom.js';
import { priceText } from '../lib/format.js';
import { getFavorites } from '../services/favorites.js';

/**
 * Resolve local /images and Django /media paths, or an explicit HTTP(S) CDN URL.
 * Unsafe URL schemes are rejected before they reach an img element.
 */
export function imageUrl(path) {
  if (typeof path !== 'string' || path.includes('..')) {
    return null;
  }

  if (/^\/images\/[\w./-]+$/.test(path)) {
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      return new URL(path.slice('/images/'.length), new URL('.', favicon.href)).href;
    }
    return new URL(path, document.baseURI).href;
  }

  if (/^\/media\/[\w./-]+$/.test(path)) {
    return new URL(path, document.baseURI).href;
  }

  try {
    const url = new URL(path);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function productPhotos(product) {
  const candidates = Array.isArray(product.images) && product.images.length
    ? product.images
    : product.image ? [product.image] : [];

  return candidates.map((image) => {
    const source = typeof image === 'string' ? image : image?.src || image?.url;
    const url = imageUrl(source);
    const alt = typeof image === 'object' ? image?.alt : '';

    return url ? { url, alt: alt || product.name } : null;
  }).filter(Boolean);
}

/** Product cards and detail pages use uploaded media, never CSS-drawn product shapes. */
export function productArt(product, { eager = false, photoIndex = 0 } = {}) {
  const image = productPhotos(product)[photoIndex];

  if (image) {
    return `
      <div class="product-art ${escapeHtml(product.color)} product-art--photo">
        <img
          src="${escapeHtml(image.url)}"
          alt="${escapeHtml(image.alt)}"
          loading="${eager ? 'eager' : 'lazy'}"
          decoding="async"
          fetchpriority="${eager ? 'high' : 'auto'}"
          data-product-image
          data-product-id="${escapeHtml(product.id)}"
          width="720"
          height="720"
        >
      </div>
    `;
  }

  return `
    <div class="product-art product-art--placeholder" role="img" aria-label="تصویر محصول هنوز بارگذاری نشده است">
      <span>تصویر محصول</span>
      <small>به‌زودی</small>
    </div>
  `;
}

/** Cards carry the product image, title, package quantity, price and useful actions. */
export function productCard(product) {
  const favorite = getFavorites().includes(product.id);
  const url = `product.html?slug=${encodeURIComponent(product.slug || product.id)}`;
  const name = escapeHtml(product.name);
  const id = escapeHtml(product.id);
  const packageLabel = product.packageLabel
    ? `<span class="product-card__package">${escapeHtml(product.packageLabel)}</span>`
    : '';

  return `
    <article class="product-card">
      <div class="product-visual">
        <a href="${url}" aria-label="مشاهده جزئیات ${name}">
          ${productArt(product)}
        </a>
        <button
          class="favorite-toggle ${favorite ? 'is-favorite' : ''}"
          type="button"
          data-favorite="${id}"
          aria-label="${favorite ? 'حذف از' : 'افزودن به'} علاقه‌مندی‌ها"
          aria-pressed="${favorite}"
        >${favorite ? '♥' : '♡'}</button>
      </div>
      <div class="product-card__details">
        <h3><a href="${url}">${name}</a></h3>
        ${packageLabel}
        <strong class="product-card__price">${priceText(product)}</strong>
      </div>
      <div class="product-actions">
        <a class="outline-button" href="${url}">مشاهده جزئیات ↗</a>
        <button
          class="mini-add"
          type="button"
          data-add="${id}"
          aria-label="افزودن ${name} به سبد انتخاب‌ها"
        >+</button>
      </div>
    </article>
  `;
}

export function renderProductGrid(element, products) {
  if (!element) {
    return;
  }

  element.innerHTML = products.length
    ? products.map(productCard).join('')
    : '<p class="empty-state">محصولی با این مشخصات پیدا نشد.</p>';
}
