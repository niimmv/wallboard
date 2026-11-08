/** Run without npm: `node tests/node-smoke.mjs` */
import assert from 'node:assert/strict';
import { listProducts, getProduct, loadRemoteProducts } from '../src/services/catalog.js';
import { getCart, changeCartQuantity, removeCartItem, cartTotal } from '../src/services/cart.js';
import { getFavorites, toggleFavorite } from '../src/services/favorites.js';
import { createDjangoApi } from '../src/services/django-api.js';

const memory = new Map();

globalThis.window = {
  localStorage: {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key),
  },
  dispatchEvent: () => {},
};

globalThis.CustomEvent = class CustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
};

const catalog = listProducts();
assert.equal(catalog.length, 6);
assert.equal(getProduct('small-clips').packageLabel, '۳ گیره در بسته');
assert.equal(getProduct('medium-clips').packageLabel, '۲ گیره در بسته');
assert.equal(getProduct('support-brackets').packageLabel, '۲ گیره در بسته');
assert.equal(getProduct('desk-stands').packageLabel, '۲ پایه در بسته');
assert.equal(getProduct('large-clips-with-shelf').packageLabel, '۲ گیره بزرگ + ۱ تاقچه');
assert.equal(getProduct('panel-30').price, null);
assert.equal(getProduct('pegboard-panel-30x30').id, 'panel-30');
assert.equal(getProduct('panel-30').stock, null);
assert.equal(getProduct('panel-30').specs.some((item) => item.includes('۸')), true);
assert.ok(Array.isArray(getProduct('panel-30').images));

assert.equal(changeCartQuantity('panel-30', 1), true);
assert.equal(getCart()['panel-30'], 1);
assert.equal(cartTotal().pricesComplete, false);
changeCartQuantity('panel-30', 4);
assert.equal(getCart()['panel-30'], 5);
removeCartItem('panel-30');
assert.equal(getCart()['panel-30'], undefined);

assert.equal(toggleFavorite('panel-30'), true);
assert.ok(getFavorites().includes('panel-30'));
assert.equal(toggleFavorite('panel-30'), false);
assert.ok(!getFavorites().includes('panel-30'));

const api = createDjangoApi();
assert.equal(typeof api.products.list, 'function');
assert.equal(typeof api.banners.list, 'function');
assert.equal(typeof api.checkout.initialize, 'function');

const apiCalls = [];
const mockApi = createDjangoApi({
  basePath: '/api/v1',
  csrfToken: () => 'csrf-test-token',
  fetchImpl: async (url, options) => {
    apiCalls.push({ url, options });
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  },
});
await mockApi.products.list({ page: 2, category: 'panels' });
await mockApi.orders.create({ items: [{ product_id: 'panel-30', quantity: 1 }] });
assert.match(apiCalls[0].url, /page=2.*category=panels|category=panels.*page=2/);
assert.equal(apiCalls[1].options.headers['X-CSRFToken'], 'csrf-test-token');
assert.equal(apiCalls[1].options.credentials, 'same-origin');

const originalFetch = globalThis.fetch;
globalThis.fetch = async () => new Response(JSON.stringify({
  results: [
    {
      id: 'django-product',
      slug: 'django-product',
      sku: 'WB-DJ-01',
      name: 'محصول مدیریت‌شده',
      category: 'accessories',
      category_name: 'متعلقات',
      package_label: '۲ عدد در بسته',
      price: null,
      stock_quantity: null,
      status: 'active',
      images: [
        {
          url: '/media/products/django-product.webp',
          alt: 'تصویر محصول بارگذاری‌شده از Django Admin',
          is_primary: true,
        },
      ],
    },
  ],
}), {
  status: 200,
  headers: { 'content-type': 'application/json' },
});

assert.equal(await loadRemoteProducts(), true);
assert.equal(listProducts().length, 1);
assert.equal(listProducts()[0].id, 'django-product');
assert.equal(listProducts()[0].images[0].src, '/media/products/django-product.webp');
assert.equal(listProducts()[0].packageLabel, '۲ عدد در بسته');
globalThis.fetch = originalFetch;

console.log('PASS: catalog fixtures, Django-managed catalog/media, cart, favorites, and API adapter contracts.');
