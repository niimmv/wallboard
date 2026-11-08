export function faNumber(value) {
  return Number(value).toLocaleString('fa-IR');
}

export function hasConfirmedPrice(product) {
  return Number.isSafeInteger(product?.price) && product.price >= 0;
}

export function priceText(product) {
  return hasConfirmedPrice(product)
    ? `${faNumber(product.price)} تومان`
    : 'قیمت: اعلام می‌شود';
}

export function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('fa-IR');
}
