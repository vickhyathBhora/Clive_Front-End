import { API_BASE_URL } from './constant';

const TOKEN_STORAGE_KEY = 'token';

export class ApiError extends Error {
  constructor(message, { status, data, response } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.response = response;
  }
}

function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('api:unauthorized'));
}

function buildUrl(endpoint) {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
}

function isJsonBody(body) {
  return (
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof URLSearchParams)
  );
}

async function parseResponse(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

/**
 * Global Base API Request Handler
 */
export async function apiRequest(endpoint, options = {}) {
  const { auth = true, body, headers: requestHeaders, ...fetchOptions } = options;
  const headers = new Headers(requestHeaders);
  const hasJsonBody = isJsonBody(body);

  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('ngrok-skip-browser-warning')) {
    headers.set('ngrok-skip-browser-warning', 'true');
  }

  // Attach Authorization header if authenticated request
  if (auth) {
    const token = getStoredToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(buildUrl(endpoint), {
    ...fetchOptions,
    headers,
    body: hasJsonBody ? JSON.stringify(body) : body,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    // Automatically clear token on 401 Unauthorized responses
    if (auth && response.status === 401) {
      clearStoredAuth();
    }

    throw new ApiError(
      data?.message || data?.error || response.statusText || 'Request failed.',
      {
        status: response.status,
        data,
        response,
      }
    );
  }

  return data;
}

// Global HTTP Helper Methods
export function apiGet(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'GET' });
}

export function apiPost(endpoint, body, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'POST', body });
}

export function apiPut(endpoint, body, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'PUT', body });
}

export function apiPatch(endpoint, body, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'PATCH', body });
}

export function apiDelete(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
}