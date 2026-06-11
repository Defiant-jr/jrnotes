const BASE = '/api/tasks';

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Erro na requisição');
  }
  if (res.status === 204) return null;
  return res.json();
}

export const tasksApi = {
  list: (completed = false) => req(`?completed=${completed}`),
  create: (body) => req('', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => req(`/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id) => req(`/${id}`, { method: 'DELETE' }),
  complete: (id) => req(`/${id}/complete`, { method: 'POST' }),
  reopen: (id) => req(`/${id}/reopen`, { method: 'POST' }),
};
