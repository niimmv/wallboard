import { getProduct } from './catalog.js';
import { readStorage, storageKeys, writeStorage } from '../lib/storage.js';
import { hasConfirmedPrice } from '../lib/format.js';

const LIMIT = 99;

function sanitizeCart(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([id, quantity]) => {
        return getProduct(id) && Number.isInteger(quantity) && quantity > 0;
      })
      .map(([id, quantity]) => [id, Math.min(quantity, LIMIT)]),
  );
}

export function getCart() {
  return sanitizeCart(readStorage(storageKeys.cart, {}));
}

export function cartEntries() {
  return Object.entries(getCart()).map(([id, quantity]) => ({
    product: getProduct(id),
    quantity,
  }));
}

export function cartCount() {
  return cartEntries().reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotal() {
  const entries = cartEntries();
  const pricesComplete = entries.every(({ product }) => hasConfirmedPrice(product));

  return {
    amount: pricesComplete
      ? entries.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0)
      : null,
    pricesComplete,
  };
}

export function changeCartQuantity(id, difference) {
  if (!getProduct(id) || !Number.isInteger(difference)) {
    return false;
  }

  const cart = getCart();
  const next = Math.max(0, Math.min(LIMIT, (cart[id] || 0) + difference));

  if (next === 0) {
    delete cart[id];
  } else {
    cart[id] = next;
  }

  return writeStorage(storageKeys.cart, cart);
}

export function removeCartItem(id) {
  const cart = getCart();
  delete cart[id];
  return writeStorage(storageKeys.cart, cart);
}
