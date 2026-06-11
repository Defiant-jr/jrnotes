import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { ListTodo, Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import { useTasks } from '../context/TasksContext.jsx';
import TaskCard from '../components/TaskCard.jsx';
import TaskForm from '../components/TaskForm.jsx';

const filterOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'today', label: 'Hoje' },
  { value: 'overdue', label: 'Atrasadas' },
  { value: 'pending', label: 'Pendentes' },
];

export default function TasksPage() {
  const { tasks, loading, loadTasks, getTaskStatus } = useTasks();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (tasks.length === 0) loadTasks();
  }, []);

  const filtered = tasks.filter(task => {
    const matchSearch = !search || task.title.toLowerCase().includes(search.toLowerCase());
    const status = getTaskStatus(task);
    const matchFilter = filter === 'all' || status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <motion.div
      key="tasks"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="page-container max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Todas as Tarefas</h1>
          <p className="text-white/40 text-sm mt-0.5">{tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} pendente{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <TaskForm />
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            className="input-field pl-9 pr-9"
            placeholder="Buscar tarefas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === opt.value
                  ? 'bg-blue-600/40 text-blue-300 border border-blue-500/50'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/10 border border-transparent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading && tasks.length === 0 ? (
        <div className="glass-card p-14 flex flex-col items-center gap-3 text-white/40">
          <Loader2 className="w-7 h-7 animate-spin" />
          <p className="text-sm">Carregando...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-14 flex flex-col items-center gap-3 text-white/40">
          <ListTodo className="w-10 h-10" />
          <p className="text-sm">
            {search ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa pendente'}
          </p>
          {!search && <TaskForm />}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {filtered.map((task, i) => (
              <TaskCard key={task.id} task={task} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
