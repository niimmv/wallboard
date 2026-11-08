# wallBoard — Mobile & Responsive UX Handoff

## Goal

The storefront is one responsive product with one visual identity. Desktop and mobile are not separate sites, and the mobile layout is not a scaled-down desktop page.

The approved brand direction remains unchanged:
- Primary coral: `#FF636C`
- Warm cream and paper surfaces
- Dark hand-drawn outlines and offset shadows
- Rounded, playful typography with controlled weights
- Framed three-slide home carousel, auto-advancing every 5 seconds

## Responsive breakpoints

| Range | Intended behavior |
|---|---|
| 1440px and wider | Full desktop composition; 4-column product grid where space allows |
| 1101px–1439px | Desktop/tablet transition; tighter content width and 3-column catalog where applicable |
| 701px–1100px | Tablet composition; compact header with menu button, two-column catalog |
| 361px–700px | Phone composition; stacked hero, two-column products and category tiles |
| 320px–360px | Compact phone composition; tighter controls and spacing while keeping two product columns |

## Mobile behavior

- Header: compact sticky header. Desktop navigation is replaced by an accessible menu button.
- Menu: the menu calculates its `top` offset from the current sticky-header position. This keeps it directly below the header both at page top and after scrolling.
- Hero: boxed carousel, text first and artwork second, reduced decorative artwork dimensions, reachable controls and no full-bleed banner.
- Categories: two balanced columns with compact cards and smaller illustrations.
- Products: two columns down to 320px; square image areas; two-line product names; price and action controls stay aligned.
- Shop controls: search occupies the full row; category filters wrap; sorting controls use the available width.
- Product detail: gallery first, details and purchase controls below; thumbnails use a compact grid.
- Cart and checkout: single-column flow; cart rows use a compact image/content layout; form fields are full-width.
- Gallery: two-column tile grid with the tall tile spanning two rows.
- Footer: two-column link layout with brand and statement spanning the full width.
- Account: form remains first; decorative panel is reduced and moved below it.

## Source of truth

- Standalone preview: `site/assets/css/mobile-experience.css`
- Editable Vite source: `developer-source/src/styles/mobile-experience.css`
- Navigation behavior: `site/assets/js/store.js` and `developer-source/src/features/storefront.js`

Keep the two CSS files and the two navigation implementations synchronized when making future responsive changes.

## Regression coverage

Playwright tests were added for:
- Horizontal overflow across 320, 360, 390, 430, 768, 1024 and 1440px widths.
- Main storefront routes: home, shop, categories, product, cart, checkout, gallery, about, contact, FAQ and account.
- Two-column product cards on compact phones.
- Mobile menu placement below the sticky header before and after scrolling.

## Before production

Run from `developer-source/`:

```bash
npm install
npm run test:e2e
npm run check
```

Then manually inspect real iOS Safari and Android Chrome devices, including keyboard navigation, touch targets, text zoom, reduced-motion settings and landscape orientation. Browser screenshots and Lighthouse must be captured against the actual deployed build; they are not claimed as completed in this handoff.
