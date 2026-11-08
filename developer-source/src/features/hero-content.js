import { createDjangoApi } from '../services/django-api.js';

const ALLOWED_THEMES = new Set(['coral', 'cream', 'ink']);

function mediaUrl(value) {
  const candidate = typeof value === 'object' && value !== null
    ? value.url || value.image || ''
    : value;

  if (typeof candidate !== 'string' || candidate.includes('..')) {
    return '';
  }

  if (/^\/(?:media|images)\/[\w./-]+$/.test(candidate)) {
    return candidate;
  }

  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function safeLink(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return 'shop.html';
  }

  const candidate = value.trim();

  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }

  if ((candidate.startsWith('/') && !candidate.startsWith('//'))
    || /^[a-z0-9][\w-]*\.html(?:[?#].*)?$/i.test(candidate)) {
    return candidate;
  }

  return 'shop.html';
}

function normalizeBanner(record) {
  if (!record || record.is_active === false) {
    return null;
  }

  const desktopImage = mediaUrl(record.desktop_image || record.image);
  const mobileImage = mediaUrl(record.mobile_image) || desktopImage;
  const title = String(record.title || '').trim();
  const accentText = String(record.accent_text || record.accentText || '').trim();

  if (!desktopImage || !title) {
    return null;
  }

  return {
    eyebrow: String(record.eyebrow || '').trim(),
    title,
    accentText,
    description: String(record.description || '').trim(),
    ctaLabel: String(record.cta_label || record.ctaLabel || 'مشاهده محصولات').trim(),
    ctaUrl: safeLink(record.cta_url || record.ctaUrl),
    desktopImage,
    mobileImage,
    alt: String(record.alt || record.image_alt || title).trim(),
    footnote: String(record.footnote || '').trim(),
    theme: ALLOWED_THEMES.has(record.theme) ? record.theme : 'coral',
  };
}

function createTextElement(tagName, className, value) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = value;
  return element;
}

function createSlide(banner, index, total) {
  const slide = document.createElement('article');
  slide.className = `hero-slide hero-slide--${banner.theme}${index === 0 ? ' is-active' : ''}`;
  slide.id = `heroSlideRemote${index + 1}`;
  slide.dataset.heroSlide = '';
  slide.setAttribute('aria-label', `اسلاید ${index + 1} از ${total}`);
  slide.setAttribute('aria-roledescription', 'اسلاید');
  slide.setAttribute('aria-hidden', String(index !== 0));

  const content = document.createElement('div');
  content.className = 'hero-slide__content';

  if (banner.eyebrow) {
    content.append(createTextElement('span', 'hero-slide__eyebrow', banner.eyebrow));
  }

  const heading = document.createElement(index === 0 ? 'h1' : 'h2');
  heading.append(document.createTextNode(banner.title));

  if (banner.accentText) {
    heading.append(document.createElement('br'));
    heading.append(createTextElement('em', '', banner.accentText));
  }

  heading.dataset.bannerHeading = '';
  content.append(heading);

  if (banner.description) {
    content.append(createTextElement('p', '', banner.description));
  }

  const actions = document.createElement('div');
  actions.className = 'hero-slide__actions';
  const link = createTextElement('a', 'hero-slide__button', banner.ctaLabel);
  link.href = banner.ctaUrl;
  link.append(createTextElement('span', '', '←'));
  link.lastElementChild.setAttribute('aria-hidden', 'true');
  actions.append(link);
  content.append(actions);

  if (banner.footnote) {
    content.append(createTextElement('small', 'hero-slide__footnote', banner.footnote));
  }

  const artwork = document.createElement('div');
  artwork.className = 'hero-slide__art';

  const picture = document.createElement('picture');
  if (banner.mobileImage && banner.mobileImage !== banner.desktopImage) {
    const source = document.createElement('source');
    source.media = '(max-width: 680px)';
    source.srcset = banner.mobileImage;
    picture.append(source);
  }

  const image = document.createElement('img');
  image.src = banner.desktopImage;
  image.alt = banner.alt;
  image.width = 900;
  image.height = 700;
  image.loading = index === 0 ? 'eager' : 'lazy';
  image.decoding = 'async';
  if (index === 0) image.fetchPriority = 'high';
  picture.append(image);
  artwork.append(picture);

  slide.append(content, artwork);
  return slide;
}

function updateControls(carousel, count) {
  const controls = carousel.querySelector('.hero-carousel__controls');
  const pagination = carousel.querySelector('.hero-carousel__pagination');

  if (!controls || !pagination) {
    return;
  }

  pagination.replaceChildren();

  for (let index = 0; index < count; index += 1) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `hero-carousel__dot${index === 0 ? ' is-active' : ''}`;
    dot.dataset.heroDot = String(index);
    dot.setAttribute('aria-label', `رفتن به بنر ${index + 1}`);

    if (index === 0) {
      dot.setAttribute('aria-current', 'true');
    }

    pagination.append(dot);
  }

  controls.hidden = count < 2;
}

export async function initializeHeroContent() {
  const carousel = document.querySelector('[data-hero-carousel]');
  const viewport = carousel?.querySelector('.hero-carousel__viewport');

  if (!carousel || !viewport) {
    return false;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 2500);

  try {
    const api = createDjangoApi();
    const payload = await api.banners.list({ signal: controller.signal });
    const records = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.results) ? payload.results : [];

    const banners = records
      .map(normalizeBanner)
      .filter(Boolean)
      .slice(0, 6);

    if (!banners.length) {
      return false;
    }

    viewport.replaceChildren(
      ...banners.map((banner, index) => createSlide(banner, index, banners.length)),
    );

    updateControls(carousel, banners.length);
    return true;
  } catch {
    // Keep the authored HTML fallback visible when Django is not connected yet.
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
