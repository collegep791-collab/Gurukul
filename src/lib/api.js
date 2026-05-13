/**
 * src/lib/api.js
 * 
 * Technical Component: HTTP Fetch API Wrapper
 * Description: A centralized utility for making REST API calls to the backend.
 * It enforces strict `credentials: 'include'` on every request to ensure the HttpOnly
 * JWT cookie is sent along. It also centralizes error handling, automatically intercepting
 * 401 Unauthorized responses to force a secure logout/redirect back to the login screen.
 */
const BASE = '/api';

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      // If unauthorized, session is expired. Reload to trigger AuthGuard protection
      window.dispatchEvent(new Event('unauthorized'));
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const err = new Error(data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const api = {
  get:    (path)       => request('GET', path),
  post:   (path, body) => request('POST', path, body),
  put:    (path, body) => request('PUT', path, body),
  patch:  (path, body) => request('PATCH', path, body),
  delete: (path)       => request('DELETE', path),

  // Upload FormData (multipart) — no Content-Type header so browser sets boundary
  upload: async (path, formData) => {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        window.dispatchEvent(new Event('unauthorized'));
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      const err = new Error(data.error || `Upload failed: ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  },
};

export default api;
