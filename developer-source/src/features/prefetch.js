/**
 * Prefetch only after explicit navigation intent; never speculate on mobile
 * connections with reduced-data preferences, and never prefetch admin/auth.
 */
export function enableIntentPrefetch() {
  // Speculative file:// document requests are unreliable in offline previews.
  if (window.location.protocol === 'file:') {
    return;
  }
  const connection = navigator.connection;

  if (connection?.saveData || /(^|-)2g/.test(connection?.effectiveType || '')) {
    return;
  }

  const prefetched = new Set();
  const allowed = new Set(['shop.html', 'product.html', 'categories.html', 'cart.html']);

  document.addEventListener('pointerover', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) {
      return;
    }

    const target = new URL(link.href, window.location.href);
    if (target.origin !== window.location.origin) {
      return;
    }

    const page = target.pathname.split('/').at(-1);
    if (!allowed.has(page) || prefetched.has(target.pathname)) {
      return;
    }

    // No more than two speculative document requests in one page visit.
    if (prefetched.size >= 2) {
      return;
    }

    const preload = document.createElement('link');
    preload.rel = 'prefetch';
    preload.href = target.pathname + target.search;
    preload.as = 'document';
    document.head.append(preload);
    prefetched.add(target.pathname);
  }, { passive: true });
}
