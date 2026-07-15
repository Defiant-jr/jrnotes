import { useState } from 'react';
import { Clock, Loader2, Plus } from 'lucide-react';
import { calendarApi } from '../services/calendarApi.js';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function AgendaQuickForm() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayKey());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [detail, setDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setMessage('');
    setError('');
    try {
      await calendarApi.create({
        title: title.trim(),
        date,
        startTime,
        endTime,
        detail: detail.trim(),
        category: 'administrativo',
      });
      setTitle('');
      setDetail('');
      setMessage('Compromisso adicionado à agenda.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_8.5rem_8.5rem_auto]">
      {(message || error) && (
        <p className={`rounded-lg border px-3 py-2 text-sm lg:col-span-5 ${
          error
            ? 'border-red-400/30 bg-red-500/15 text-red-100'
            : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100'
        }`}
        >
          {error || message}
        </p>
      )}

      <input
        className="input-field min-w-0"
        placeholder="Título compromisso"
        value={title}
        onChange={e => setTitle(e.target.value)}
        disabled={loading}
        aria-label="Título compromisso"
      />

      <input
        type="date"
        className="input-field [color-scheme:dark]"
        value={date}
        onChange={e => setDate(e.target.value)}
        disabled={loading}
        aria-label="Data do compromisso"
      />

      <label className="relative">
        <input
          type="time"
          className="input-field pr-10 [color-scheme:dark]"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          disabled={loading}
          aria-label="Hora inicial"
        />
        <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
      </label>

      <label className="relative">
        <input
          type="time"
          className="input-field pr-10 [color-scheme:dark]"
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
          disabled={loading}
          aria-label="Hora final"
        />
        <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
      </label>

      <div className="hidden lg:block" />

      <input
        className="input-field min-w-0 lg:col-span-4"
        placeholder="Detalhes do compromisso"
        value={detail}
        onChange={e => setDetail(e.target.value)}
        disabled={loading}
        aria-label="Detalhes do compromisso"
      />

      <button type="submit" className="btn-primary flex shrink-0 items-center justify-center gap-1.5 px-3 sm:px-4 lg:self-end" disabled={loading || !title.trim()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        <span>Adicionar</span>
      </button>
    </form>
  );
}
