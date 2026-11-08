# wallBoard Storefront — Release Notes

- Distribution: storefront-only; Django Admin is the sole administration interface.
- Brand color: `#FF636C`.
- Home hero: three framed slides, 5-second autoplay, manual navigation and pause control; Django API can replace text and desktop/mobile artwork.
- Responsive storefront: desktop, tablet and mobile layouts.
- Product catalog: six confirmed component groups with exact package counts and separate transparent WebP artwork based on the supplied product references.
- Pages: Home, Shop, Product, Categories, Cart, Checkout, Favorites, Account, About, Gallery, FAQ, Contact, Shipping, Returns, Privacy and Terms.
- Source: `developer-source/` (Vite + modular HTML/CSS/JavaScript).
- Preview: `site/` (independent build for local review).
- Django handoff: `docs/`, including HomeBanner model/admin guidance and media API contract.

This is a frontend release package. Real prices, inventory, accounts, checkout, payments and SEO-critical server rendering require the Django backend.


## Mobile & desktop responsive refinement

- Added a unified responsive layer at `site/assets/css/mobile-experience.css`.
- Kept product cards in a balanced two-column grid on compact phones (including 320px layouts).
- Reworked the mobile hero, category tiles, shop filters, product detail, cart, checkout, gallery, footer and account page layouts.
- Mobile navigation now calculates its top position from the sticky header, including after scrolling.
- The same responsive stylesheet and navigation behavior are mirrored in `developer-source`.
- Desktop brand layout and approved color palette remain unchanged.
