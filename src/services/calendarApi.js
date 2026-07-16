const localFrontendPorts = new Set(['5173', '4173']);
const isLocalFrontend = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  && localFrontendPorts.has(window.location.port);
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || (isLocalFrontend ? 'http://localhost:3000' : '');
const BASE = `${API_ORIGIN}/api/google-calendar/events`;

function normalizeEvent(event = {}) {
  return {
    id: event.id,
    key: event.key || event.id,
    calendarId: event.calendarId || '',
    calendarSummary: event.calendarSummary || '',
    calendarColor: event.calendarColor || null,
    calendarAccessRole: event.calendarAccessRole || '',
    canEdit: event.canEdit !== false,
    title: event.title || event.summary || '',
    detail: event.detail || event.description || '',
    notes: event.notes || event.detail || event.description || '',
    date: event.date || '',
    startTime: event.startTime || '09:00',
    endTime: event.endTime || '10:00',
    category: event.category || 'administrativo',
    htmlLink: event.htmlLink || null,
    updated: event.updated || null,
    status: event.status || 'confirmed',
  };
}

async function req(path = '', options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Backend não está rodando. Inicie npm run server em outro terminal.');
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!isJson) {
    throw new Error('API de Google Calendar indisponivel. Abra o app pelo npm run dev em http://localhost:3000 ou mantenha npm run server rodando junto com npm run dev:client.');
  }

  if (!res.ok || payload?.success === false) {
    throw new Error(payload?.message || payload?.error || `Erro na integração com Google Calendar (${res.status}). Verifique o terminal do backend.`);
  }
  return payload || {};
}

export const calendarApi = {
  async list({ timeMin, timeMax, q } = {}) {
    const params = new URLSearchParams();
    if (timeMin) params.set('timeMin', timeMin);
    if (timeMax) params.set('timeMax', timeMax);
    if (q) params.set('q', q);

    const payload = await req(params.size ? `?${params.toString()}` : '');
    return {
      items: (Array.isArray(payload?.events) ? payload.events : []).map(normalizeEvent),
    };
  },

  async create(body) {
    const payload = await req('', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return normalizeEvent(payload?.event || payload);
  },

  async update(id, body) {
    const payload = await req(`/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return normalizeEvent(payload?.event || payload);
  },

  async remove(id, { calendarId } = {}) {
    const query = calendarId ? `?calendarId=${encodeURIComponent(calendarId)}` : '';
    await req(`/${encodeURIComponent(id)}${query}`, { method: 'DELETE' });
  },
};
