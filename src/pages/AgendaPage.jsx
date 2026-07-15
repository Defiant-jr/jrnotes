import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calendarApi } from '../services/calendarApi.js';

const CATEGORIES = [
  { key: 'administrativo', label: 'Administrativo', color: 'bg-blue-400', event: 'border-blue-300/40 bg-blue-500/25 text-blue-50' },
  { key: 'financeiro', label: 'Financeiro', color: 'bg-emerald-400', event: 'border-emerald-300/40 bg-emerald-500/25 text-emerald-50' },
  { key: 'pedagogico', label: 'Pedagogico', color: 'bg-violet-400', event: 'border-violet-300/40 bg-violet-500/25 text-violet-50' },
  { key: 'reuniao', label: 'Reuniao', color: 'bg-amber-400', event: 'border-amber-300/40 bg-amber-500/25 text-amber-50' },
  { key: 'pessoal', label: 'Pessoal', color: 'bg-rose-400', event: 'border-rose-300/40 bg-rose-500/25 text-rose-50' },
];

const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map(category => [category.key, category]));
const BOOK_REFERENCE_DATE = new Date(2026, 6, 15);

function dateKey(value) {
  return format(value, 'yyyy-MM-dd');
}

function monthDays(monthDate) {
  const firstVisible = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
  const lastVisible = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 });
  return eachDayOfInterval({ start: firstVisible, end: lastVisible });
}

function formatWeekRange(days) {
  if (!days.length) return '';
  return `${format(days[0], 'dd MMM', { locale: ptBR })} - ${format(days[days.length - 1], 'dd MMM yyyy', { locale: ptBR })}`;
}

function formatInputDate(value) {
  try {
    return format(parseISO(`${value}T00:00:00`), 'dd/MM/yyyy');
  } catch {
    return value;
  }
}

function parseEventDate(event) {
  try {
    return parseISO(`${event.date}T00:00:00`);
  } catch {
    return null;
  }
}

function toRangeIso(day, end = false) {
  const suffix = end ? '23:59:59' : '00:00:00';
  return `${dateKey(day)}T${suffix}-03:00`;
}

export default function AgendaPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(BOOK_REFERENCE_DATE);
  const [monthDate, setMonthDate] = useState(BOOK_REFERENCE_DATE);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [form, setForm] = useState({
    title: '',
    date: dateKey(BOOK_REFERENCE_DATE),
    startTime: '09:00',
    endTime: '10:00',
    detail: '',
    category: 'administrativo',
  });
  const [saving, setSaving] = useState(false);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end: endOfWeek(selectedDate, { weekStartsOn: 0 }) });
  }, [selectedDate]);

  const calendarDays = useMemo(() => monthDays(monthDate), [monthDate]);
  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const firstVisible = calendarDays[0] || weekDays[0];
      const lastVisible = calendarDays[calendarDays.length - 1] || weekDays[weekDays.length - 1];
      const data = await calendarApi.list({
        timeMin: toRangeIso(firstVisible),
        timeMax: toRangeIso(lastVisible, true),
      });
      setEvents(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [calendarDays, weekDays]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const agendaItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return events
      .map(event => ({ ...event, agendaDate: parseEventDate(event) }))
      .filter(item => item.agendaDate)
      .filter(item => categoryFilter === 'todas' || item.category === categoryFilter)
      .filter(item => {
        if (!term) return true;
        return `${item.title} ${item.detail}`.toLowerCase().includes(term);
      })
      .sort((a, b) => `${dateKey(a.agendaDate)} ${a.startTime}`.localeCompare(`${dateKey(b.agendaDate)} ${b.startTime}`));
  }, [events, search, categoryFilter]);

  const weekItems = useMemo(() => {
    const weekKeys = new Set(weekDays.map(dateKey));
    return agendaItems.filter(item => weekKeys.has(dateKey(item.agendaDate)));
  }, [agendaItems, weekDays]);

  function selectDate(value) {
    setSelectedDate(value);
    setMonthDate(value);
    setForm(current => ({ ...current, date: dateKey(value) }));
  }

  function moveWeek(direction) {
    const nextDate = direction > 0 ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1);
    selectDate(nextDate);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const event = await calendarApi.create({
        title: form.title.trim(),
        detail: form.detail,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        category: form.category,
      });
      setEvents(current => [event, ...current.filter(item => item.id !== event.id)]);
      setForm(current => ({
        ...current,
        title: '',
        detail: '',
      }));
    } finally {
      setSaving(false);
    }
  }

  async function removeEvent(id) {
    try {
      await calendarApi.remove(id);
      setEvents(current => current.filter(item => item.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  const today = BOOK_REFERENCE_DATE;

  return (
    <motion.div
      key="agenda"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[radial-gradient(circle_at_36%_12%,rgba(42,94,176,0.38),transparent_36%),linear-gradient(135deg,#10275b_0%,#18377b_42%,#10195a_100%)] px-[22px] py-[26px] text-white"
    >
      <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mt-2 -ml-1 p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[32px] font-bold leading-none text-[#7da7ff]">Agenda</h1>
            <p className="mt-1 text-[15px] leading-tight text-white/52">{formatWeekRange(weekDays)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-[5px]">
          <span className="mr-1 px-2 text-xs font-medium text-white/52">11400</span>
          <button type="button" onClick={() => selectDate(BOOK_REFERENCE_DATE)} className="h-10 bg-black/75 px-4 text-sm font-semibold text-white hover:bg-black/85">
            Hoje
          </button>
          <button type="button" onClick={loadEvents} className="flex h-10 items-center gap-2 bg-black/75 px-4 text-sm font-semibold text-white hover:bg-black/85">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <div className="flex h-10 border border-white/15 bg-white/5">
            <button type="button" onClick={() => moveWeek(-1)} className="w-10 text-white/75 hover:bg-white/10" aria-label="Semana anterior">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => moveWeek(1)} className="w-10 text-white/75 hover:bg-white/10" aria-label="Proxima semana">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button type="button" className="flex h-10 w-[130px] items-center justify-between border border-white/15 bg-white/10 px-3 text-sm font-semibold text-white/85">
            Semana
            <ChevronDown className="h-4 w-4 text-white/45" />
          </button>
          <button type="button" onClick={() => document.getElementById('agenda-title')?.focus()} className="flex h-10 items-center gap-2 bg-[#2563eb] px-[18px] text-sm font-semibold text-white transition-colors hover:bg-blue-500">
            <Plus className="h-4 w-4" />
            Criar
          </button>
        </div>
      </header>

      <section className="mb-6 rounded-[10px] border border-white/20 bg-white/[0.105] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.12)] backdrop-blur-md">
        <p className="mb-3 text-xs font-bold uppercase text-white/45">Insercao de compromisso</p>
        {error && (
          <p className="mb-3 rounded border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_170px_140px_140px_126px]">
          <input
            id="agenda-title"
            className="h-11 rounded-[9px] border border-white/20 bg-white/10 px-3 text-[15px] text-white placeholder-white/38 outline-none transition-colors focus:border-blue-300/70 focus:bg-white/15"
            placeholder="Titulo"
            value={form.title}
            onChange={e => setForm(current => ({ ...current, title: e.target.value }))}
            disabled={saving}
          />
          <label className="relative">
            <input
              type="text"
              className="h-11 w-full rounded-[9px] border border-white/20 bg-white/10 px-3 pr-10 text-[15px] font-semibold text-white outline-none transition-colors focus:border-blue-300/70 focus:bg-white/15"
              value={formatInputDate(form.date)}
              readOnly
              disabled={saving}
            />
            <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/72" />
          </label>
          <label className="relative">
            <input
              type="time"
              className="h-11 w-full rounded-[9px] border border-white/20 bg-white/10 px-3 pr-10 text-[15px] font-semibold text-white outline-none [color-scheme:dark] focus:border-blue-300/70 focus:bg-white/15"
              value={form.startTime}
              onChange={e => setForm(current => ({ ...current, startTime: e.target.value }))}
              disabled={saving}
            />
            <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
          </label>
          <label className="relative">
            <input
              type="time"
              className="h-11 w-full rounded-[9px] border border-white/20 bg-white/10 px-3 pr-10 text-[15px] font-semibold text-white outline-none [color-scheme:dark] focus:border-blue-300/70 focus:bg-white/15"
              value={form.endTime}
              onChange={e => setForm(current => ({ ...current, endTime: e.target.value }))}
              disabled={saving}
            />
            <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
          </label>
          <button type="submit" className="flex h-11 items-center justify-center gap-2 rounded-[9px] bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50" disabled={saving || !form.title.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar
          </button>
          <textarea
            className="min-h-[84px] resize-none rounded-[9px] border border-white/20 bg-white/10 px-3 py-3 text-[15px] text-white placeholder-white/38 outline-none transition-colors focus:border-blue-300/70 focus:bg-white/15 lg:col-span-5"
            placeholder="Detalhe"
            value={form.detail}
            onChange={e => setForm(current => ({ ...current, detail: e.target.value }))}
            disabled={saving}
          />
        </form>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-[10px] border border-white/20 bg-white/[0.105] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.12)] backdrop-blur-md">
            <div className="border border-white/10 p-3">
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setMonthDate(subMonths(monthDate, 1))} className="rounded-md p-1 text-white/0 hover:bg-white/10 hover:text-white/60" aria-label="Mes anterior">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="text-[15px] font-semibold capitalize text-white">{format(monthDate, 'MMMM yyyy', { locale: ptBR })}</h2>
                <button type="button" onClick={() => setMonthDate(addMonths(monthDate, 1))} className="rounded-md p-1 text-white/0 hover:bg-white/10 hover:text-white/60" aria-label="Proximo mes">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-white/30">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <span key={`${day}-${index}`} className="leading-7">{day}</span>)}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1 text-center text-[13px]">
                {calendarDays.map(day => {
                  const selected = isSameDay(day, selectedDate);
                  const currentMonth = day.getMonth() === monthDate.getMonth();
                  const hasItems = agendaItems.some(item => isSameDay(item.agendaDate, day));
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => selectDate(day)}
                      className={`relative flex h-8 items-center justify-center rounded-full font-semibold transition-colors ${
                        selected
                          ? 'bg-blue-500 text-white'
                          : currentMonth
                            ? 'text-white/82 hover:bg-white/10'
                            : 'text-white/16 hover:bg-white/5'
                      }`}
                    >
                      {format(day, 'd')}
                      {hasItems && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-emerald-300" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="relative mt-4 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                className="h-10 w-full border border-white/15 bg-white/10 pl-10 pr-3 text-sm text-white placeholder-white/48 outline-none focus:border-blue-300/60"
                placeholder="Buscar"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </label>

            <select
              className="mt-4 h-10 w-full border border-white/15 bg-white/10 px-3 text-sm font-semibold text-white outline-none [color-scheme:dark] focus:border-blue-300/60"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="todas">Todas as agendas</option>
              {CATEGORIES.map(category => <option key={category.key} value={category.key}>{category.label}</option>)}
            </select>

            <div className="mt-4 space-y-3">
              {CATEGORIES.map(category => (
                <label key={category.key} className="flex cursor-pointer items-center gap-2 text-sm text-white/75">
                  <input
                    type="radio"
                    className="sr-only"
                    name="agenda-category"
                    checked={form.category === category.key}
                    onChange={() => setForm(current => ({ ...current, category: category.key }))}
                  />
                  <span className={`h-3 w-3 rounded-full ${category.color}`} />
                  <span className={form.category === category.key ? 'font-semibold text-white' : ''}>{category.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-[10px] border border-white/20 bg-white/[0.105] p-4 text-sm text-white/80 shadow-[0_18px_45px_rgba(0,0,0,0.12)] backdrop-blur-md">
            <div className="flex items-center gap-2 font-semibold">
              <Clock className="h-4 w-4 text-blue-300" />
              Hoje
            </div>
            <p className="mt-2 text-white/50">{format(today, "dd 'de' MMMM", { locale: ptBR })}</p>
          </section>
        </aside>

        <main className="min-w-0 overflow-hidden border border-white/10 bg-transparent">
          {loading && events.length === 0 ? (
            <div className="flex min-h-[522px] flex-col items-center justify-center gap-3 text-white/45">
              <Loader2 className="h-7 w-7 animate-spin" />
              <p className="text-sm">Carregando agenda...</p>
            </div>
          ) : (
            <div className="grid min-h-[522px] grid-cols-1 md:grid-cols-7">
              {weekDays.map(day => {
                const items = weekItems.filter(item => isSameDay(item.agendaDate, day));
                const isToday = isSameDay(day, today);
                return (
                  <section key={day.toISOString()} className="min-h-40 border-b border-white/10 p-3 md:min-h-[522px] md:border-b-0 md:border-r last:md:border-r-0 md:border-white/10">
                    <div className="mb-[28px] border-b border-white/10 pb-[14px]">
                      <p className="text-xs font-medium uppercase text-white/32">{format(day, 'EEEE', { locale: ptBR })}</p>
                      <p className={`mt-1 text-[27px] font-bold leading-none ${isToday ? 'text-[#8ab3ff]' : 'text-white'}`}>{format(day, 'd')}</p>
                    </div>

                    <div className="space-y-3 px-[18px] md:px-[16px]">
                      {items.map(item => {
                        const category = CATEGORY_BY_KEY[item.category] || CATEGORIES[0];
                        return (
                          <article key={item.id} className={`group rounded-[4px] border px-2 py-1 text-xs shadow-sm ${category.event}`}>
                            <div className="flex items-start justify-between gap-2">
                              <a
                                href={item.htmlLink || undefined}
                                target={item.htmlLink ? '_blank' : undefined}
                                rel={item.htmlLink ? 'noreferrer' : undefined}
                                className="min-w-0 text-left font-semibold leading-tight"
                              >
                                <span className="font-mono">{item.startTime}</span> {item.title}
                              </a>
                              <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                                <button type="button" onClick={() => removeEvent(item.id)} className="rounded p-1 hover:bg-white/15" aria-label="Remover compromisso">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            {item.detail && <p className="mt-1 line-clamp-2 text-white/65">{item.detail}</p>}
                          </article>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => selectDate(day)}
                        className="flex min-h-6 items-center gap-2 rounded px-2 text-sm text-white/45 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Criar
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </motion.div>
  );
}
