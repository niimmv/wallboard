# Quality Assurance — wallBoard Storefront / Django Admin

- [x] No custom admin HTML, JavaScript, CSS or bundle is included; `/admin/` is reserved for Django.
- [x] Six product fixtures match the owner's confirmed component list and package quantities.
- [x] Every product fixture uses a separate optimized WebP media asset; product geometry is not drawn with CSS.
- [x] Product prices and inventory remain `null` until confirmed.
- [x] Product links use stable SEO slugs.
- [x] Django API adapter includes same-origin credentials and CSRF header support.
- [x] Homepage banners can be loaded from Django API; static fallback remains visible before backend integration.
- [x] Banner rotation is configured for 5 seconds with manual controls and reduced-motion handling.
- [x] Hero and product media are responsive and have meaningful alt text.
- [x] Desktop and mobile banner image fields are documented for Django Admin.

Required on developer workstation:
- [ ] `npm install`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run budget`
- [ ] `npm run test:e2e`
- [ ] Test 320–1920 px viewports on Home, Shop, Product, Cart, Checkout and Account.
- [ ] Lighthouse mobile/desktop and real-device QA.
- [ ] Connect Django sessions, CSRF, catalog, banner, cart, orders, media and payment.
- [ ] Verify all production metadata, canonical URLs, sitemap and Product JSON-LD.
