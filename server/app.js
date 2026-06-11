import express from 'express';
import compression from 'compression';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import tasksRouter from './routes/tasks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(compression());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/tasks', tasksRouter);

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));

export default app;
