const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (res.status === 204) return null;

  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.error?.message || 'Request failed');
    err.status = res.status;
    err.details = json.error?.details;
    throw err;
  }
  return json;
}

// Admin — Collections
export function getCollections() {
  return request('/admin/collections');
}

export function getCollection(id) {
  return request(`/admin/collections/${id}`);
}

export function createCollection(data) {
  return request('/admin/collections', { method: 'POST', body: JSON.stringify(data) });
}

export function updateCollection(id, data) {
  return request(`/admin/collections/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteCollection(id) {
  return request(`/admin/collections/${id}`, { method: 'DELETE' });
}

// Content — Entries
export function getContentEntries(slug, params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/content/${slug}${query ? '?' + query : ''}`);
}

export function getContentEntry(slug, id) {
  return request(`/content/${slug}/${id}`);
}

export function createEntry(slug, data) {
  return request(`/content/${slug}`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateEntry(slug, id, data) {
  return request(`/content/${slug}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteEntry(slug, id) {
  return request(`/content/${slug}/${id}`, { method: 'DELETE' });
}
