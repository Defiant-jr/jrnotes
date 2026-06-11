import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_TASKS_CLIENT_ID,
      client_secret: process.env.GOOGLE_TASKS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_TASKS_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!data.access_token) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

const listId = () => process.env.GOOGLE_TASKS_LIST_ID || '@default';
const base = 'https://tasks.googleapis.com/tasks/v1';

async function apiFetch(path, options = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (res.status === 204) return null;
  return res.json();
}

export async function listTasks(showCompleted = false) {
  const params = new URLSearchParams({
    maxResults: '100',
    showCompleted: String(showCompleted),
    showHidden: String(showCompleted),
  });
  return apiFetch(`/lists/${listId()}/tasks?${params}`);
}

export async function createTask(body) {
  return apiFetch(`/lists/${listId()}/tasks`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateTask(taskId, body) {
  return apiFetch(`/lists/${listId()}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteTask(taskId) {
  return apiFetch(`/lists/${listId()}/tasks/${taskId}`, { method: 'DELETE' });
}

export async function completeTask(taskId) {
  return updateTask(taskId, { status: 'completed', completed: new Date().toISOString() });
}

export async function reopenTask(taskId) {
  return updateTask(taskId, { status: 'needsAction', completed: null });
}
