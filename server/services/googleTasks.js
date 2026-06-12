import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const googleTasksConfig = {
  accessToken: process.env.GOOGLE_TASKS_ACCESS_TOKEN,
  clientId: process.env.GOOGLE_TASKS_CLIENT_ID,
  clientSecret: process.env.GOOGLE_TASKS_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_TASKS_REFRESH_TOKEN,
  taskListId: process.env.GOOGLE_TASKS_LIST_ID || '@default',
};

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;

const encodeTaskListId = (taskListId) => encodeURIComponent(taskListId).replace(/%40/g, '@');

async function getAccessToken() {
  if (googleTasksConfig.accessToken) {
    return googleTasksConfig.accessToken;
  }

  const now = Date.now();
  if (cachedAccessToken && cachedAccessTokenExpiresAt > now + 60000) {
    return cachedAccessToken;
  }

  if (!googleTasksConfig.clientId || !googleTasksConfig.clientSecret || !googleTasksConfig.refreshToken) {
    throw new Error('Google Tasks nao configurado. Preencha GOOGLE_TASKS_CLIENT_ID, GOOGLE_TASKS_CLIENT_SECRET e GOOGLE_TASKS_REFRESH_TOKEN no .env.local.');
  }

  let response;
  try {
    response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleTasksConfig.clientId,
        client_secret: googleTasksConfig.clientSecret,
        refresh_token: googleTasksConfig.refreshToken,
        grant_type: 'refresh_token',
      }),
    });
  } catch {
    throw new Error('Falha de rede ao autenticar no Google. Verifique internet, proxy/firewall e acesso a oauth2.googleapis.com.');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || 'Failed to refresh Google Tasks access token.');
  }

  cachedAccessToken = payload.access_token;
  cachedAccessTokenExpiresAt = now + Number(payload.expires_in || 3600) * 1000;
  return cachedAccessToken;
}

async function googleTasksRequest(pathname, options = {}) {
  const accessToken = await getAccessToken();
  const url = new URL(`https://tasks.googleapis.com/tasks/v1/${pathname}`);

  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      if (value != null) {
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
    throw new Error('Falha de rede ao acessar Google Tasks. Verifique internet, proxy/firewall e acesso a tasks.googleapis.com.');
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Google Tasks request failed: ${response.status}`);
  }
  return payload;
}

export function normalizeTaskDate(value) {
  if (!value) return null;
  const text = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return `${text}T00:00:00.000Z`;
}

export function mapGoogleTask(task = {}) {
  return {
    id: task.id,
    title: task.title || task.tarefa || '',
    notes: task.notes || '',
    due: task.due || task.data || null,
    status: task.status || (task.concluida === 'S' ? 'completed' : 'needsAction'),
    completed: task.completed || null,
    updated: task.updated || null,
  };
}

export function mapBookTask(task = {}) {
  const normalized = mapGoogleTask(task);
  return {
    id: normalized.id,
    tarefa: normalized.title,
    data: normalized.due,
    concluida: normalized.status === 'completed' ? 'S' : 'N',
    status: normalized.status,
    updated: normalized.updated,
  };
}

function taskListPath() {
  return `lists/${encodeTaskListId(googleTasksConfig.taskListId)}/tasks`;
}

function toGoogleTaskPayload(body = {}) {
  const payload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'title') || Object.prototype.hasOwnProperty.call(body, 'tarefa')) {
    const title = String(body.title ?? body.tarefa ?? '').trim();
    if (!title) throw new Error('Informe a descricao da tarefa.');
    payload.title = title;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'notes')) {
    payload.notes = String(body.notes || '');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'due') || Object.prototype.hasOwnProperty.call(body, 'data')) {
    payload.due = normalizeTaskDate(body.due ?? body.data);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'status') || Object.prototype.hasOwnProperty.call(body, 'concluida')) {
    payload.status = body.status === 'completed' || body.concluida === 'S' ? 'completed' : 'needsAction';
    payload.completed = payload.status === 'completed' ? new Date().toISOString() : null;
  }

  return payload;
}

export async function listTasks(showCompleted = false) {
  return googleTasksRequest(taskListPath(), {
    searchParams: {
      showCompleted,
      showDeleted: false,
      showHidden: showCompleted,
      maxResults: 100,
    },
  });
}

export async function createTask(body) {
  const payload = toGoogleTaskPayload(body);
  if (!payload.title) throw new Error('Informe a descricao da tarefa.');
  return googleTasksRequest(taskListPath(), {
    method: 'POST',
    body: payload,
  });
}

export async function updateTask(taskId, body) {
  return googleTasksRequest(`${taskListPath()}/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    body: toGoogleTaskPayload(body),
  });
}

export async function deleteTask(taskId) {
  return googleTasksRequest(`${taskListPath()}/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
  });
}

export async function completeTask(taskId) {
  return updateTask(taskId, { status: 'completed' });
}

export async function reopenTask(taskId) {
  return updateTask(taskId, { status: 'needsAction' });
}
