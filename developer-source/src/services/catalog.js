import { defaultProducts } from '../data/products.js';
import { createDjangoApi } from './django-api.js';

const validCategories = new Set(['panels', 'accessories']);
const validColors = new Set(['coral', 'sand', 'yellow', 'pink', 'dark']);

let remoteProducts = null;

function validImagePath(value) {
  if (typeof value !== 'string' || value.includes('..')) {
    return false;
  }

  if (/^\/(?:images|media)\/[\w./-]+$/.test(value)) {
    return true;
  }

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function imageRecord(image, fallbackAlt = '') {
  const source = typeof image === 'string'
    ? image
    : image?.src || image?.url || image?.image;

  if (!validImagePath(source)) {
    return null;
  }

  return {
    src: source,
    alt: typeof image === 'object' && typeof image.alt === 'string'
      ? image.alt.slice(0, 240)
      : fallbackAlt,
    width: Number.isInteger(image?.width) ? image.width : null,
    height: Number.isInteger(image?.height) ? image.height : null,
  };
}

function normalizedProduct(product) {
  if (!product || typeof product.id !== 'string' || !/^[\w-]{2,80}$/.test(product.id)) {
    return null;
  }

  if (typeof product.name !== 'string' || product.name.trim().length < 2) {
    return null;
  }

  const priceValue = product.price === '' || product.price == null
    ? null
    : Number(product.price);
  const stockValue = product.stock === '' || product.stock == null
    ? null
    : Number(product.stock);

  const images = Array.isArray(product.images)
    ? product.images
      .map((image) => imageRecord(image, product.name))
      .filter(Boolean)
      .slice(0, 12)
    : [];

  const primaryImage = imageRecord(product.image, product.name) || images[0] || null;

  return {
    id: product.id,
    slug: typeof product.slug === 'string' && /^[a-z0-9-]{2,100}$/.test(product.slug)
      ? product.slug
      : product.id,
    sku: String(product.sku || product.id).slice(0, 80),
    name: product.name.slice(0, 120),
    category: validCategories.has(product.category) ? product.category : 'accessories',
    categoryName: String(product.categoryName || 'متعلقات').slice(0, 80),
    color: validColors.has(product.color) ? product.color : 'sand',
    label: String(product.label || 'WALLBOARD').slice(0, 60),
    packageLabel: String(product.packageLabel || '').slice(0, 100),
    price: Number.isSafeInteger(priceValue) && priceValue >= 0 ? priceValue : null,
    stock: Number.isSafeInteger(stockValue) && stockValue >= 0 ? stockValue : null,
    status: ['draft', 'active', 'archived'].includes(product.status)
      ? product.status
      : 'draft',
    summary: String(product.summary || '').slice(0, 500),
    specs: Array.isArray(product.specs)
      ? product.specs.map((spec) => {
        if (typeof spec === 'string') return spec;
        if (spec && typeof spec === 'object') {
          return [spec.label, spec.value].filter(Boolean).join(': ');
        }
        return '';
      }).filter(Boolean).slice(0, 16)
      : [],
    image: primaryImage?.src || null,
    images,
  };
}

function mapApiProduct(record) {
  const apiImages = Array.isArray(record?.images)
    ? [...record.images].sort((left, right) => Number(Boolean(right?.is_primary)) - Number(Boolean(left?.is_primary)))
    : [];
  const primary = apiImages.find((image) => image?.is_primary) || apiImages[0] || null;
  const category = typeof record?.category === 'object'
    ? record.category.slug
    : record?.category;

  return {
    id: String(record?.id ?? ''),
    slug: record?.slug,
    sku: record?.sku,
    name: record?.name,
    category,
    categoryName: record?.category_name || record?.categoryName,
    color: record?.display_color || record?.color,
    label: record?.label,
    packageLabel: record?.package_label || record?.packageLabel,
    price: record?.price,
    stock: record?.stock_quantity ?? record?.stock,
    status: record?.status || (record?.is_active ? 'active' : 'draft'),
    summary: record?.summary || record?.short_description,
    specs: record?.specifications || record?.specs,
    image: record?.image || primary?.url || primary?.image || null,
    images: apiImages,
  };
}

export function listProducts() {
  const source = remoteProducts !== null ? remoteProducts : defaultProducts;
  return source.map(normalizedProduct).filter(Boolean);
}

export function getProduct(id) {
  return listProducts().find((product) => product.id === id || product.slug === id) || null;
}

/**
 * Load the Django-managed catalog when the API is available.
 * The local fixtures remain the immediate preview fallback.
 */
export async function loadRemoteProducts() {
  try {
    const api = createDjangoApi();
    const payload = await api.products.list({ page_size: 100 });
    const records = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.results) ? payload.results : null;

    if (!records) {
      return false;
    }

    remoteProducts = records
      .map(mapApiProduct)
      .map(normalizedProduct)
      .filter(Boolean);

    return true;
  } catch {
    return false;
  }
}
