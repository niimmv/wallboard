import {
  initializeStorefront,
  refreshStorefrontCatalog,
} from './features/storefront.js';
import { enableIntentPrefetch } from './features/prefetch.js';
import { initializeHeroSlider } from './features/hero-slider.js';
import { initializeHeroContent } from './features/hero-content.js';
import { loadRemoteProducts } from './services/catalog.js';

initializeStorefront();
enableIntentPrefetch();

// Django-managed banners and product media replace the local fallback when available.
initializeHeroContent().finally(initializeHeroSlider);

loadRemoteProducts().then((loaded) => {
  if (loaded) {
    refreshStorefrontCatalog();
  }
});
