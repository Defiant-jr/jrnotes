const localFrontendPorts = new Set(['5173', '4173']);
const isLocalFrontend = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  && localFrontendPorts.has(window.location.port);
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || (isLocalFrontend ? 'http://localhost:3000' : '');
const BASE = `${API_ORIGIN}/api/google-tasks/tasks`;

function normalizeTask(task = {}) {
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

function toGoogleTasksPayload(body = {}) {
  return {
    ...(Object.prototype.hasOwnProperty.call(body, 'title') ? { title: body.title } : {}),
    ...(Object.prototype.hasOwnProperty.call(body, 'notes') ? { notes: body.notes } : {}),
    ...(Object.prototype.hasOwnProperty.call(body, 'due') ? { due: body.due } : {}),
    ...(Object.prototype.hasOwnProperty.call(body, 'status') ? { status: body.status } : {}),
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
    throw new Error('API de tarefas indisponivel. Abra o app pelo npm run dev em http://localhost:3000 ou mantenha npm run server rodando junto com npm run dev:client.');
  }

  if (!res.ok || payload?.success === false) {
    throw new Error(payload?.message || payload?.error || `Erro na integração com Google Tasks (${res.status}). Verifique o terminal do backend.`);
  }
  return payload || {};
}

export const tasksApi = {
  async list(completed = false) {
    const payload = await req();
    const items = (Array.isArray(payload?.tasks) ? payload.tasks : []).map(normalizeTask);

    return {
      items: items.filter(task => completed ? task.status === 'completed' : task.status !== 'completed'),
    };
  },

  async create(body) {
    const payload = await req('', {
      method: 'POST',
      body: JSON.stringify(toGoogleTasksPayload(body)),
    });
    return normalizeTask(payload?.task || payload);
  },

  async update(id, body) {
    const payload = await req(`/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(toGoogleTasksPayload(body)),
    });
    return normalizeTask(payload?.task || payload);
  },

  async remove(id) {
    await req(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  complete: (id) => tasksApi.update(id, { status: 'completed' }),
  reopen: (id) => tasksApi.update(id, { status: 'needsAction' }),
};
