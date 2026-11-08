/** Small DOM helpers shared by storefront and admin. */
export const select = (selector, root = document) => root.querySelector(selector);

export const selectAll = (selector, root = document) => [
  ...root.querySelectorAll(selector),
];

/** Escape anything that can originate from editable local catalog content. */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function notify(message) {
  const element = select('#toast');

  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.add('show');
  window.clearTimeout(notify.timeoutId);
  notify.timeoutId = window.setTimeout(() => {
    element.classList.remove('show');
  }, 2800);
}
