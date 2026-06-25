const BASE = '/api';

async function handleRes(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function lookupWeather(query) {
  const res = await fetch(`${BASE}/lookup?q=${encodeURIComponent(query)}`);
  return handleRes(res);
}

export async function lookupByCoords(lat, lon) {
  const res = await fetch(`${BASE}/lookup?lat=${lat}&lon=${lon}`);
  return handleRes(res);
}

export async function createRecord(payload) {
  const res = await fetch(`${BASE}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleRes(res);
}

export async function getRecords() {
  const res = await fetch(`${BASE}/records`);
  return handleRes(res);
}

export async function updateRecord(id, payload) {
  const res = await fetch(`${BASE}/records/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleRes(res);
}

export async function deleteRecord(id) {
  const res = await fetch(`${BASE}/records/${id}`, { method: 'DELETE' });
  return handleRes(res);
}

export async function getExtras(id) {
  const res = await fetch(`${BASE}/records/${id}/extras`);
  return handleRes(res);
}

export function exportUrl(format) {
  return `${BASE}/export?format=${format}`;
}