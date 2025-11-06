import { API_CONFIG } from '../config/api.config';

const JSON_CONTENT_TYPE = 'application/json';

const buildUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_CONFIG.baseURL.replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(errorText || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

const withDefaults = (init: RequestInit = {}): RequestInit => {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', JSON_CONTENT_TYPE);
  }

  return { ...init, credentials: init.credentials ?? 'include', headers };
};

export async function apiGet<T = unknown>(path: string, opts?: RequestInit): Promise<T> {
  const { body: _body, ...rest } = opts ?? {};
  const response = await fetch(buildUrl(path), withDefaults({ ...rest, method: 'GET' }));
  return handleResponse<T>(response);
}

export async function apiPost<T = unknown>(path: string, body?: unknown, opts?: RequestInit): Promise<T> {
  const init: RequestInit = {
    ...opts,
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : opts?.body,
  };
  const response = await fetch(buildUrl(path), withDefaults(init));
  return handleResponse<T>(response);
}
