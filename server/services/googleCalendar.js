import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const googleCalendarConfig = {
  accessToken: process.env.GOOGLE_CALENDAR_ACCESS_TOKEN,
  clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_TASKS_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_TASKS_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN || process.env.GOOGLE_TASKS_REFRESH_TOKEN,
  calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
  timeZone: process.env.GOOGLE_CALENDAR_TIME_ZONE || 'America/Sao_Paulo',
};

const META_PREFIX = '[AGENDA]';

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;

async function getAccessToken() {
  if (googleCalendarConfig.accessToken) {
    return googleCalendarConfig.accessToken;
  }

  const now = Date.now();
  if (cachedAccessToken && cachedAccessTokenExpiresAt > now + 60000) {
    return cachedAccessToken;
  }

  if (!googleCalendarConfig.clientId || !googleCalendarConfig.clientSecret || !googleCalendarConfig.refreshToken) {
    throw new Error('Google Calendar nao configurado. Preencha GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET e GOOGLE_CALENDAR_REFRESH_TOKEN no .env.local.');
  }

  let response;
  try {
    response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleCalendarConfig.clientId,
        client_secret: googleCalendarConfig.clientSecret,
        refresh_token: googleCalendarConfig.refreshToken,
        grant_type: 'refresh_token',
      }),
    });
  } catch {
    throw new Error('Falha de rede ao autenticar no Google. Verifique internet, proxy/firewall e acesso a oauth2.googleapis.com.');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || 'Falha ao renovar token do Google Calendar.');
  }

  cachedAccessToken = payload.access_token;
  cachedAccessTokenExpiresAt = now + Number(payload.expires_in || 3600) * 1000;
  return cachedAccessToken;
}

async function googleCalendarRequest(pathname, options = {}) {
  const accessToken = await getAccessToken();
  const url = new URL(`https://www.googleapis.com/calendar/v3/${pathname}`);

  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      if (value != null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  let response;
  try {
    response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('Falha de rede ao acessar Google Calendar. Verifique internet, proxy/firewall e acesso a www.googleapis.com.');
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message || `Google Calendar request failed: ${response.status}`;
    if (response.status === 403) {
      throw new Error(`${message}. Confirme se o token OAuth tem escopo https://www.googleapis.com/auth/calendar.events.`);
    }
    throw new Error(message);
  }
  return payload;
}

function calendarPath(calendarId = googleCalendarConfig.calendarId, suffix = '') {
  return `calendars/${encodeURIComponent(calendarId)}/events${suffix}`;
}

function normalizeDate(value) {
  const text = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return text;
}

function normalizeTime(value, fallback) {
  const text = String(value || fallback).slice(0, 5);
  return /^\d{2}:\d{2}$/.test(text) ? text : fallback;
}

function buildDateTime(date, time) {
  return `${date}T${time}:00`;
}

function stripAgendaMeta(description = '') {
  return String(description || '')
    .split(/\r?\n/)
    .filter(line => !line.startsWith(META_PREFIX))
    .join('\n')
    .trim();
}

function parseMeta(description = '') {
  const metaLine = String(description || '').split(/\r?\n/).find(line => line.startsWith(META_PREFIX));
  const meta = {};
  if (!metaLine) return meta;

  metaLine
    .slice(META_PREFIX.length)
    .trim()
    .split(';')
    .forEach(part => {
      const [key, ...rawValue] = part.split('=');
      const value = rawValue.join('=').trim();
      if (key?.trim() && value) meta[key.trim()] = value;
    });
  return meta;
}

function buildDescription(detail, category) {
  const meta = `${META_PREFIX} category=${category || 'administrativo'}`;
  const cleanDetail = String(detail || '').trim();
  return cleanDetail ? `${meta}\n${cleanDetail}` : meta;
}

function eventDate(event = {}) {
  return String(event.start?.dateTime || event.start?.date || '').slice(0, 10);
}

function eventTime(event = {}, field = 'start') {
  const value = event[field]?.dateTime || '';
  const match = String(value).match(/T(\d{2}:\d{2})/);
  return match?.[1] || (field === 'start' ? '09:00' : '10:00');
}

export function mapGoogleCalendarEvent(event = {}) {
  const meta = parseMeta(event.description);
  const category = event.extendedProperties?.private?.category || meta.category || 'administrativo';

  return {
    id: event.id,
    title: event.summary || '',
    detail: stripAgendaMeta(event.description),
    date: eventDate(event),
    startTime: eventTime(event, 'start'),
    endTime: eventTime(event, 'end'),
    category,
    htmlLink: event.htmlLink || null,
    updated: event.updated || null,
    status: event.status || 'confirmed',
  };
}

function toGoogleCalendarPayload(body = {}) {
  const title = String(body.title || body.summary || '').trim();
  if (!title) throw new Error('Informe o titulo do compromisso.');

  const date = normalizeDate(body.date || body.data || body.due);
  if (!date) throw new Error('Informe a data do compromisso.');

  const startTime = normalizeTime(body.startTime || body.horaInicio, '09:00');
  const endTime = normalizeTime(body.endTime || body.horaFim, '10:00');
  const category = String(body.category || 'administrativo').trim() || 'administrativo';

  return {
    summary: title,
    description: buildDescription(body.detail || body.description || body.notes, category),
    start: {
      dateTime: buildDateTime(date, startTime),
      timeZone: googleCalendarConfig.timeZone,
    },
    end: {
      dateTime: buildDateTime(date, endTime),
      timeZone: googleCalendarConfig.timeZone,
    },
    extendedProperties: {
      private: { category },
    },
  };
}

export async function listEvents({ timeMin, timeMax, q } = {}) {
  const payload = await googleCalendarRequest(calendarPath(), {
    searchParams: {
      timeMin,
      timeMax,
      q,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    },
  });

  return {
    events: (payload?.items || []).map(mapGoogleCalendarEvent),
  };
}

export async function createEvent(body) {
  const event = await googleCalendarRequest(calendarPath(), {
    method: 'POST',
    body: toGoogleCalendarPayload(body),
  });
  return mapGoogleCalendarEvent(event);
}

export async function updateEvent(eventId, body) {
  const event = await googleCalendarRequest(calendarPath(googleCalendarConfig.calendarId, `/${encodeURIComponent(eventId)}`), {
    method: 'PATCH',
    body: toGoogleCalendarPayload(body),
  });
  return mapGoogleCalendarEvent(event);
}

export async function deleteEvent(eventId) {
  return googleCalendarRequest(calendarPath(googleCalendarConfig.calendarId, `/${encodeURIComponent(eventId)}`), {
    method: 'DELETE',
  });
}
