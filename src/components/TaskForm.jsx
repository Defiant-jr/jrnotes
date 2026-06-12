import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Calendar, AlignLeft, Loader2 } from 'lucide-react';
import { useTasks } from '../context/TasksContext.jsx';

export default function TaskForm({ compact = false }) {
  const { addTask } = useTasks();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [due, setDue] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const body = { title: title.trim() };
      if (notes.trim()) body.notes = notes.trim();
      if (due) body.due = new Date(due + 'T00:00:00').toISOString();
      await addTask(body);
      setTitle('');
      setNotes('');
      setDue('');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleInlineSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const body = { title: title.trim() };
      if (notes.trim()) body.notes = notes.trim();
      if (due) body.due = new Date(due + 'T00:00:00').toISOString();
      await addTask(body);
      setTitle('');
      setNotes('');
      setDue('');
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <form onSubmit={handleInlineSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
        <div>
          <input
            className="input-field min-w-0"
            placeholder="Título tarefa"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={loading}
            aria-label="Título tarefa"
          />
        </div>

        <div>
          <input
            type="date"
            className="input-field [color-scheme:dark]"
            value={due}
            onChange={e => setDue(e.target.value)}
            disabled={loading}
            aria-label="Data da tarefa"
          />
        </div>

        <div className="hidden sm:block" />

        <div className="sm:col-span-2">
          <input
            className="input-field min-w-0"
            placeholder="Detalhes da tarefa"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            disabled={loading}
            aria-label="Detalhes da tarefa"
          />
        </div>

        <button type="submit" className="btn-primary flex shrink-0 items-center justify-center gap-1.5 px-3 sm:px-4 sm:self-end" disabled={loading || !title.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span>Adicionar</span>
        </button>
      </form>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center justify-center gap-2">
        <Plus className="h-4 w-4" />
        <span>Nova</span>
        <span className="hidden sm:inline">Tarefa</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-b-none rounded-t-2xl border-b-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:inset-auto sm:left-1/2 sm:top-24 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-lg sm:border-b sm:p-6 glass-card"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Nova Tarefa</h2>
                <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50">Título *</label>
                  <input
                    className="input-field"
                    placeholder="O que precisa ser feito?"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    autoFocus
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/50">
                    <AlignLeft className="h-3 w-3" /> Notas
                  </label>
                  <textarea
                    className="textarea-field"
                    placeholder="Detalhes adicionais..."
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/50">
                    <Calendar className="h-3 w-3" /> Data de vencimento
                  </label>
                  <input
                    type="date"
                    className="input-field [color-scheme:dark]"
                    value={due}
                    onChange={e => setDue(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setOpen(false)} className="btn-outline flex-1">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary flex flex-1 items-center justify-center gap-2" disabled={loading || !title.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Criar
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
