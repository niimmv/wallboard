/** Local demo record IDs. Not suitable for authentication tokens. */
export function createLocalId(prefix = 'local') {
  const random = globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}-${random}`;
}
