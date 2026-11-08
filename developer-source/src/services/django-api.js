/**
 * Django REST Framework adapter contract.
 * The current preview uses local fixtures; this adapter is ready to be wired
 * by the backend team. Endpoint paths are proposals, not a live API.
 */
const DEFAULT_BASE_PATH = '/api/v1';

function readCookie(name) {
  const prefix = `${encodeURIComponent(name)}=`;
  const entry = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : '';
}

export class ApiError extends Error {
  constructor(status, message, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function createDjangoApi({
  basePath = DEFAULT_BASE_PATH,
  csrfToken = () => readCookie('csrftoken'),
  fetchImpl = (...args) => fetch(...args),
} = {}) {
  const root = basePath.replace(/\/$/, '');

  async function request(path, { method = 'GET', body, signal, headers: customHeaders = {} } = {}) {
    const verb = method.toUpperCase();
    const headers = { Accept: 'application/json', ...customHeaders };

    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (!['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(verb)) {
      const token = csrfToken();
      if (token) headers['X-CSRFToken'] = token;
    }

    const response = await fetchImpl(`${root}${path}`, {
      method: verb,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });

    const contentType = response.headers?.get?.('content-type') || '';
    const payload = response.status === 204
      ? null
      : contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
      const message = payload && typeof payload === 'object'
        ? (payload.detail || payload.message || `درخواست با خطای ${response.status} مواجه شد`)
        : `درخواست با خطای ${response.status} مواجه شد`;
      throw new ApiError(response.status, message, payload);
    }

    return payload;
  }

  const queryString = (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
    });
    const result = query.toString();
    return result ? `?${result}` : '';
  };

  return {
    products: {
      list: (params = {}, options = {}) => request(`/products/${queryString(params)}`, options),
      detail: (slug, options = {}) => request(`/products/${encodeURIComponent(slug)}/`, options),
    },
    categories: {
      list: (options = {}) => request('/categories/', options),
      detail: (slug, options = {}) => request(`/categories/${encodeURIComponent(slug)}/`, options),
    },
    banners: {
      list: (options = {}) => request('/banners/?placement=home', options),
    },
    users: {
      current: (options = {}) => request('/users/me/', options),
      addresses: (options = {}) => request('/users/me/addresses/', options),
    },
    auth: {
      register: (payload) => request('/auth/register/', { method: 'POST', body: payload }),
      login: (credentials) => request('/auth/login/', { method: 'POST', body: credentials }),
      logout: () => request('/auth/logout/', { method: 'POST' }),
    },
    cart: {
      read: (options = {}) => request('/cart/', options),
      update: (items) => request('/cart/', { method: 'PUT', body: { items } }),
    },
    wishlist: {
      read: (options = {}) => request('/wishlist/', options),
      update: (productIds) => request('/wishlist/', { method: 'PUT', body: { product_ids: productIds } }),
    },
    orders: {
      create: (payload) => request('/orders/', { method: 'POST', body: payload }),
      list: (params = {}, options = {}) => request(`/orders/${queryString(params)}`, options),
      detail: (orderNumber, options = {}) => request(`/orders/${encodeURIComponent(orderNumber)}/`, options),
    },
    checkout: {
      initialize: (orderId) => request('/payments/initialize/', { method: 'POST', body: { order_id: orderId } }),
    },
  };
}
