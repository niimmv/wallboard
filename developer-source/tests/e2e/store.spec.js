import { test, expect } from '@playwright/test';

test('Home is visible without hidden hero content', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('.hero-carousel .hero-slide:not([hidden]) h1')).toBeVisible();
  await expect(page.locator('.brand')).toBeVisible();
});

test('a product can move from the shop to the cart', async ({ page }) => {
  await page.goto('/shop.html');
  await page.locator('[data-add="panel-30"]').click();
  await page.goto('/cart.html');
  await expect(page.locator('#cartItems')).toContainText('پنل پگ‌برد');
});

test('Home carousel keeps one slide visible and navigation works', async ({ page }) => {
  await page.goto('/index.html');

  const activeSlide = page.locator('.hero-slide:not([hidden])');
  await expect(activeSlide).toHaveCount(1);
  await expect(activeSlide).toHaveAttribute('id', 'heroSlideOne');

  await page.getByRole('button', { name: 'بنر بعدی' }).click();
  await expect(activeSlide).toHaveAttribute('id', 'heroSlideTwo');

  await page.getByRole('button', { name: 'رفتن به بنر سوم' }).click();
  await expect(activeSlide).toHaveAttribute('id', 'heroSlideThree');

  await page.getByRole('button', { name: 'توقف پخش خودکار' }).click();
  await expect(page.locator('[data-hero-pause]')).toHaveAttribute('aria-pressed', 'true');
});

test('Home banner fits narrow mobile screens', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/index.html');

  await expect(page.locator('.hero-carousel')).toBeVisible();

  const isOverflowing = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });

  expect(isOverflowing).toBe(false);
});


test('storefront layouts stay within the viewport from compact phones to desktop', async ({ page }) => {
  const routes = [
    '/index.html',
    '/shop.html',
    '/categories.html',
    '/product.html',
    '/cart.html',
    '/checkout.html',
    '/gallery.html',
    '/about.html',
    '/contact.html',
    '/faq.html',
    '/account.html',
  ];

  const widths = [320, 360, 390, 430, 768, 1024, 1440];

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });

    for (const route of routes) {
      await page.goto(route);
      const metrics = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));

      expect(
        Math.max(metrics.document, metrics.body),
        `${route} overflows at ${width}px`,
      ).toBeLessThanOrEqual(metrics.viewport);
    }
  }
});

test('product cards remain two columns on compact phones', async ({ page }) => {
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/shop.html');

    const columns = await page.locator('#productGrid').evaluate((element) => {
      return getComputedStyle(element).gridTemplateColumns
        .split(' ')
        .filter(Boolean).length;
    });

    expect(columns, `expected two product columns at ${width}px`).toBe(2);
  }
});

test('mobile menu stays attached to the sticky header while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html');
  await page.locator('[data-menu-button]').click();
  await expect(page.locator('#mobileNav')).toBeVisible();

  const measureMenuGap = () => page.evaluate(() => {
    const header = document.querySelector('.site-header');
    const menu = document.querySelector('#mobileNav');
    return Math.abs(
      Number.parseFloat(getComputedStyle(menu).top) -
      header.getBoundingClientRect().bottom - 8,
    );
  });

  expect(await measureMenuGap()).toBeLessThanOrEqual(2);

  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(120);
  expect(await measureMenuGap()).toBeLessThanOrEqual(2);
});
