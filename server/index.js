import { createApp } from './app.js';

const PORT = Number.parseInt(process.env.PORT ?? '3000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

async function start() {
  try {
    const { app } = await createApp();

    app.listen(PORT, HOST, () => {
      const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
      console.log(`[server] JR Notes disponivel em http://${displayHost}:${PORT}`);
      console.log(`[server] Google Tasks: lista "${process.env.GOOGLE_TASKS_LIST_ID || '@default'}"`);
    });
  } catch (error) {
    console.error('[server] Falha ao iniciar', error);
    process.exit(1);
  }
}

start();
