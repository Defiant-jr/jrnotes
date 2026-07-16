import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DEFAULT_GOOGLE_CALENDAR_ID = 'primary';
const configuredGoogleCalendarId = String(process.env.GOOGLE_CALENDAR_ID || '').trim();

const googleCalendarConfig = {
  accessToken: process.env.GOOGLE_CALENDAR_ACCESS_TOKEN,
  clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_TASKS_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_TASKS_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
  calendarId: configuredGoogleCalendarId || DEFAULT_GOOGLE_CALENDAR_ID,
  calendarName: process.env.GOOGLE_CALENDAR_NAME,
  timeZone: process.env.GOOGLE_CALENDAR_TIME_ZONE || 'America/Sao_Paulo',
};

const META_PREFIX = '[AGENDA]';

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;
let cachedAuthError = null;
let cachedAuthErrorExpiresAt = 0;
let cachedGoogleCalendarId = null;
let cachedGoogleCalendarList = null;
let cachedGoogleCalendarListExpiresAt = 0;

const encodeCalendarId = (calendarId) => encodeURIComponent(calendarId).replace(/%40/g, '@');
const calendarEventsPathFor = (calendarId) => `calendars/${encodeCalendarId(calendarId)}/events`;

async function getAccessToken() {
  if (googleCalendarConfig.accessToken) {
    return googleCalendarConfig.accessToken;
  }

  const now = Date.now();
  if (cachedAccessToken && cachedAccessTokenExpiresAt > now + 60000) {
    return cachedAccessToken;
  }
  if (cachedAuthError && cachedAuthErrorExpiresAt > now) {
    throw cachedAuthError;
  }

  if (!googleCalendarConfig.clientId || !googleCalendarConfig.clientSecret || !googleCalendarConfig.refreshToken) {
    throw new Error('Google Calendar nao configurado. Preencha GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET e GOOGLE_CALENDAR_REFRESH_TOKEN no .env.local. Se usar o mesmo OAuth Client das tarefas, copie GOOGLE_TASKS_CLIENT_ID e GOOGLE_TASKS_CLIENT_SECRET para as variaveis GOOGLE_CALENDAR_* e gere um refresh token com escopo de Calendar.');
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
    if (payload?.error === 'invalid_grant') {
      cachedAuthError = new Error('GOOGLE_CALENDAR_REFRESH_TOKEN invalido, expirado, revogado ou gerado para outro OAuth Client. Gere um novo refresh token no OAuth Playground usando o mesmo GOOGLE_CALENDAR_CLIENT_ID/SECRET e os escopos https://www.googleapis.com/auth/calendar e https://www.googleapis.com/auth/calendar.events.');
      cachedAuthErrorExpiresAt = now + 30000;
      throw cachedAuthError;
    }
    cachedAuthError = new Error(payload?.error_description || payload?.error || 'Falha ao renovar token do Google Calendar.');
    cachedAuthErrorExpiresAt = now + 30000;
    throw cachedAuthError;
  }

  cachedAccessToken = payload.access_token;
  cachedAccessTokenExpiresAt = now + Number(payload.expires_in || 3600) * 1000;
  cachedAuthError = null;
  cachedAuthErrorExpiresAt = 0;
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
    if (/insufficient authentication scopes/i.test(message)) {
      throw new Error('Token sem permissao para Google Calendar. Gere um GOOGLE_CALENDAR_REFRESH_TOKEN com os escopos https://www.googleapis.com/auth/calendar e https://www.googleapis.com/auth/calendar.events.');
    }
    throw new Error(message);
  }
  return payload;
}

function calendarPath(calendarId = googleCalendarConfig.calendarId, suffix = '') {
  return `${calendarEventsPathFor(calendarId)}${suffix}`;
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

function hasValidTimeRange(startTime, endTime) {
  return startTime < endTime;
}

function normalizeCalendarName(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

function isWritableCalendar(calendar) {
  return ['owner', 'writer'].includes(calendar?.accessRole);
}

function mapGoogleCalendar(calendar = {}) {
  return {
    id: calendar.id,
    summary: calendar.summary || calendar.id,
    description: calendar.description || '',
    backgroundColor: calendar.backgroundColor || null,
    foregroundColor: calendar.foregroundColor || null,
    accessRole: calendar.accessRole || 'reader',
    primary: Boolean(calendar.primary),
    selected: calendar.selected !== false,
    canWrite: isWritableCalendar(calendar),
  };
}

async function listAvailableGoogleCalendars({ force = false } = {}) {
  const now = Date.now();
  if (!force && cachedGoogleCalendarList && cachedGoogleCalendarListExpiresAt > now) {
    return cachedGoogleCalendarList;
  }

  const calendars = [];
  let pageToken = null;
  do {
    const payload = await googleCalendarRequest('users/me/calendarList', {
      searchParams: {
        maxResults: 250,
        minAccessRole: 'reader',
        showDeleted: false,
        showHidden: true,
        pageToken,
      },
    });
    calendars.push(...(payload?.items || []).map(mapGoogleCalendar));
    pageToken = payload?.nextPageToken || null;
  } while (pageToken);

  cachedGoogleCalendarList = calendars;
  cachedGoogleCalendarListExpiresAt = now + 60000;
  return calendars;
}

async function findOrCreateGoogleCalendarByName(calendarName) {
  const normalizedCalendarName = normalizeCalendarName(calendarName);
  if (!normalizedCalendarName) {
    return googleCalendarConfig.calendarId;
  }
  if (cachedGoogleCalendarId) {
    return cachedGoogleCalendarId;
  }

  const calendarList = await listAvailableGoogleCalendars();
  const matchingCalendars = calendarList.filter(
    (calendar) => normalizeCalendarName(calendar.summary) === normalizedCalendarName
  );
  const writableCalendar = matchingCalendars.find(isWritableCalendar);

  if (writableCalendar?.id) {
    cachedGoogleCalendarId = writableCalendar.id;
    return cachedGoogleCalendarId;
  }

  const createdCalendar = await googleCalendarRequest('calendars', {
    method: 'POST',
    body: {
      summary: calendarName.trim(),
      timeZone: googleCalendarConfig.timeZone,
    },
  });

  cachedGoogleCalendarId = createdCalendar.id;
  cachedGoogleCalendarList = null;
  cachedGoogleCalendarListExpiresAt = 0;
  return cachedGoogleCalendarId;
}

function hasExplicitGoogleCalendarId() {
  return Boolean(configuredGoogleCalendarId);
}

async function getTargetGoogleCalendarId() {
  if (hasExplicitGoogleCalendarId()) {
    return googleCalendarConfig.calendarId;
  }
  if (googleCalendarConfig.calendarName) {
    return findOrCreateGoogleCalendarByName(googleCalendarConfig.calendarName);
  }
  return googleCalendarConfig.calendarId;
}

async function getCalendarById(calendarId) {
  const calendars = await listAvailableGoogleCalendars();
  return calendars.find((calendar) => calendar.id === calendarId) || {
    id: calendarId,
    summary: calendarId,
    accessRole: 'owner',
    canWrite: true,
  };
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

export function mapGoogleCalendarEvent(event = {}, calendar = {}) {
  const meta = parseMeta(event.description);
  const category = event.extendedProperties?.private?.category || meta.category || 'administrativo';
  const calendarId = calendar.id || googleCalendarConfig.calendarId;

  return {
    id: event.id,
    key: `${calendarId}:${event.id}`,
    calendarId,
    calendarSummary: calendar.summary || '',
    calendarColor: calendar.backgroundColor || null,
    calendarAccessRole: calendar.accessRole || 'reader',
    canEdit: isWritableCalendar(calendar),
    title: event.summary || '',
    detail: stripAgendaMeta(event.description),
    notes: stripAgendaMeta(event.description),
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
  if (!hasValidTimeRange(startTime, endTime)) throw new Error('Hora Fim deve ser maior que Hora Inicio.');

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
  const calendars = await listAvailableGoogleCalendars();
  const warnings = [];
  const eventGroups = await Promise.all(calendars.map(async (calendar) => {
    try {
      const payload = await googleCalendarRequest(calendarPath(calendar.id), {
        searchParams: {
          timeMin,
          timeMax,
          q,
          singleEvents: true,
          orderBy: 'startTime',
          showDeleted: false,
          maxResults: 2500,
        },
      });
      return (payload?.items || []).map((event) => mapGoogleCalendarEvent(event, calendar));
    } catch (error) {
      warnings.push({ calendarId: calendar.id, calendarSummary: calendar.summary, message: error.message });
      return [];
    }
  }));

  return {
    success: true,
    calendars,
    warnings,
    events: eventGroups.flat(),
  };
}

export async function createEvent(body) {
  const calendarId = await getTargetGoogleCalendarId();
  const calendar = hasExplicitGoogleCalendarId()
    ? { id: calendarId, summary: calendarId, accessRole: 'owner' }
    : await getCalendarById(calendarId);
  const event = await googleCalendarRequest(calendarPath(calendarId), {
    method: 'POST',
    body: toGoogleCalendarPayload(body),
  });
  return mapGoogleCalendarEvent(event, calendar);
}

export async function updateEvent(eventId, body) {
  const calendarId = String(body?.calendarId || '').trim() || await getTargetGoogleCalendarId();
  const event = await googleCalendarRequest(calendarPath(calendarId, `/${encodeURIComponent(eventId)}`), {
    method: 'PATCH',
    body: toGoogleCalendarPayload(body),
  });
  return mapGoogleCalendarEvent(event, { id: calendarId, summary: calendarId, accessRole: 'owner' });
}

export async function deleteEvent(eventId, { calendarId } = {}) {
  const targetCalendarId = String(calendarId || '').trim() || await getTargetGoogleCalendarId();
  return googleCalendarRequest(calendarPath(targetCalendarId, `/${encodeURIComponent(eventId)}`), {
    method: 'DELETE',
  });
}
