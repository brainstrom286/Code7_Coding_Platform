import { clearAuth, getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(`Server error (${res.status}): unexpected response`);
  }

  if (res.status === 401) {
    clearAuth();
  }

  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

export function showSuccess(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}
