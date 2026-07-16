import { Router } from 'express';
import {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
} from '../services/googleCalendar.js';

const router = Router();

router.get('/events', async (req, res) => {
  try {
    const data = await listEvents({
      timeMin: req.query.timeMin,
      timeMax: req.query.timeMax,
      q: req.query.q,
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/events', async (req, res) => {
  try {
    const event = await createEvent(req.body);
    res.status(201).json({ event });
  } catch (err) {
    console.error(err);
    const status = /^(Informe |Hora Fim)/.test(err.message || '') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.patch('/events/:id', async (req, res) => {
  try {
    const event = await updateEvent(req.params.id, req.body);
    res.json({ event });
  } catch (err) {
    console.error(err);
    const status = /^(Informe |Hora Fim)/.test(err.message || '') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.delete('/events/:id', async (req, res) => {
  try {
    await deleteEvent(req.params.id, { calendarId: req.query.calendarId });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
