/** Versioned browser storage adapter; user data is NEVER authentication data. */
export const storageKeys = Object.freeze({
  cart: 'wallboard.cart.v1',
  favorites: 'wallboard.favorites.v1',
});

export function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? structuredClone(fallback) : JSON.parse(raw);
  } catch {
    return structuredClone(fallback);
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('wallboard:updated', {
      detail: { key },
    }));
    return true;
  } catch {
    return false;
  }
}
