import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import app from './app.js';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`\n🚀  Servidor rodando em http://${HOST}:${PORT}`);
  console.log(`   Google Tasks: lista "${process.env.GOOGLE_TASKS_LIST_ID || '@default'}"\n`);
});
