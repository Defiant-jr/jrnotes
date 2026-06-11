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
      await addTask({ title: title.trim() });
      setTitle('');
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <form onSubmit={handleInlineSubmit} className="flex gap-2">
        <input
          className="input-field flex-1 text-sm"
          placeholder="Adicionar nova tarefa..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn-primary flex items-center gap-1.5 shrink-0" disabled={loading || !title.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </form>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Nova Tarefa
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed inset-x-4 top-[10%] sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-24 sm:w-full sm:max-w-md glass-card p-6 z-50 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white">Nova Tarefa</h2>
                <button onClick={() => setOpen(false)} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wide">Título *</label>
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
                  <label className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wide">
                    <AlignLeft className="w-3 h-3" /> Notas
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
                  <label className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wide">
                    <Calendar className="w-3 h-3" /> Data de vencimento
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
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading || !title.trim()}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Criar Tarefa
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
