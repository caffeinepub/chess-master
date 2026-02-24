/**
 * Utility functions for parsing and managing URL parameters.
 * Works with both hash-based and browser-based routing.
 */

export function getUrlParameter(paramName: string): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  const regularParam = urlParams.get(paramName);
  if (regularParam !== null) return regularParam;

  const hash = window.location.hash;
  const queryStartIndex = hash.indexOf('?');
  if (queryStartIndex !== -1) {
    const hashQuery = hash.substring(queryStartIndex + 1);
    const hashParams = new URLSearchParams(hashQuery);
    return hashParams.get(paramName);
  }

  return null;
}

export function storeSessionParameter(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch (error) {
    // ignore
  }
}

export function getSessionParameter(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getPersistedUrlParameter(paramName: string, storageKey?: string): string | null {
  const key = storageKey || paramName;
  const urlValue = getUrlParameter(paramName);
  if (urlValue !== null) {
    storeSessionParameter(key, urlValue);
    return urlValue;
  }
  return getSessionParameter(key);
}

export function clearSessionParameter(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function clearParamFromHash(paramName: string): void {
  if (!window.history.replaceState) return;

  const hash = window.location.hash;
  if (!hash || hash.length <= 1) return;

  const hashContent = hash.substring(1);
  const queryStartIndex = hashContent.indexOf('?');
  if (queryStartIndex === -1) return;

  const routePath = hashContent.substring(0, queryStartIndex);
  const queryString = hashContent.substring(queryStartIndex + 1);
  const params = new URLSearchParams(queryString);
  params.delete(paramName);

  const newQueryString = params.toString();
  let newHash = routePath;
  if (newQueryString) newHash += '?' + newQueryString;

  const newUrl =
    window.location.pathname +
    window.location.search +
    (newHash ? '#' + newHash : '');
  window.history.replaceState(null, '', newUrl);
}

export function getSecretFromHash(paramName: string): string | null {
  const existing = getSessionParameter(paramName);
  if (existing !== null) return existing;

  const hash = window.location.hash;
  if (!hash || hash.length <= 1) return null;

  const hashContent = hash.substring(1);
  const params = new URLSearchParams(hashContent);
  const secret = params.get(paramName);

  if (secret) {
    storeSessionParameter(paramName, secret);
    clearParamFromHash(paramName);
    return secret;
  }

  return null;
}

/**
 * Gets a secret parameter from hash fragment with sessionStorage fallback.
 * Required by useActor.ts for admin token handling.
 */
export function getSecretParameter(paramName: string): string | null {
  return getSecretFromHash(paramName);
}

// Game ID helpers
export function getGameIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
  return (
    params.get('gameId') ||
    hashParams.get('gameId') ||
    sessionStorage.getItem('pendingGameId')
  );
}

export function storeGameId(gameId: string): void {
  sessionStorage.setItem('pendingGameId', gameId);
}

export function clearStoredGameId(): void {
  sessionStorage.removeItem('pendingGameId');
}

export function getStoredGameId(): string | null {
  return sessionStorage.getItem('pendingGameId');
}
