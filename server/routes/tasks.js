import { Router } from 'express';
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  reopenTask,
} from '../services/googleTasks.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const showCompleted = req.query.completed === 'true';
    const data = await listTasks(showCompleted);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const task = await createTask(req.body);
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const task = await updateTask(req.params.id, req.body);
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteTask(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/complete', async (req, res) => {
  try {
    const task = await completeTask(req.params.id);
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/reopen', async (req, res) => {
  try {
    const task = await reopenTask(req.params.id);
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
