import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../src/lib/dom.js';
import { hasConfirmedPrice, priceText } from '../src/lib/format.js';
import { defaultProducts } from '../src/data/products.js';

describe('catalog fixtures', () => {
  it('contains the six confirmed product groups', () => {
    expect(defaultProducts.map((product) => product.id)).toEqual([
      'panel-30',
      'small-clips',
      'medium-clips',
      'support-brackets',
      'desk-stands',
      'large-clips-with-shelf',
    ]);
  });

  it('keeps the owner-confirmed package quantities', () => {
    expect(defaultProducts.map((product) => product.packageLabel)).toEqual([
      '۱ پنل در بسته',
      '۳ گیره در بسته',
      '۲ گیره در بسته',
      '۲ گیره در بسته',
      '۲ پایه در بسته',
      '۲ گیره بزرگ + ۱ تاقچه',
    ]);
  });

  it('does not invent prices or inventory', () => {
    expect(defaultProducts.every((product) => product.price === null)).toBe(true);
    expect(defaultProducts.every((product) => product.stock === null)).toBe(true);
  });

  it('preserves the real panel specifications and product media', () => {
    const panel = defaultProducts.find((product) => product.id === 'panel-30');
    expect(panel.specs).toContain('ضخامت: ۸ میلی‌متر');
    expect(panel.specs).toContain('جنس: PVC سفید');
    expect(panel.image).toBe('/images/products/pegboard-panel.webp');
    expect(defaultProducts.every((product) => product.image?.endsWith('.webp'))).toBe(true);
  });
});

describe('safe rendering and money', () => {
  it('escapes editable content', () => {
    expect(escapeHtml('<img src=x onerror="x">')).toContain('&lt;img');
  });

  it('treats missing prices as unknown', () => {
    expect(hasConfirmedPrice({ price: null })).toBe(false);
    expect(priceText({ price: null })).toContain('اعلام');
    expect(hasConfirmedPrice({ price: 0 })).toBe(true);
  });
});
