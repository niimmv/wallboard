import { getProduct } from './catalog.js';
import { readStorage, storageKeys, writeStorage } from '../lib/storage.js';

export function getFavorites() {
  const saved = readStorage(storageKeys.favorites, []);
  return Array.isArray(saved)
    ? [...new Set(saved.filter((id) => typeof id === 'string' && getProduct(id)))]
    : [];
}

export function toggleFavorite(id) {
  if (!getProduct(id)) {
    return false;
  }

  const current = getFavorites();
  const next = current.includes(id)
    ? current.filter((itemId) => itemId !== id)
    : [...current, id];

  writeStorage(storageKeys.favorites, next);
  return next.includes(id);
}
