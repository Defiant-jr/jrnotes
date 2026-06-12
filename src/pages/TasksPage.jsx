import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListTodo, Loader2, Search, X } from 'lucide-react';
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
      className="page-container mx-auto max-w-3xl"
    >
      <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6 sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">Todas as Tarefas</h1>
          <p className="mt-1 text-sm text-white/45">{tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} pendente{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[10px] font-medium text-white/35 sm:text-xs">11100</span>
          <TaskForm />
        </div>
      </div>

      <div className="glass-card mb-5 flex flex-col gap-3 p-3 sm:flex-row sm:p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            className="input-field pl-9 pr-9"
            placeholder="Buscar tarefas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/40 hover:text-white/70"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible">
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`min-h-10 shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                filter === opt.value
                  ? 'bg-blue-600/40 text-blue-200 border-blue-500/50'
                  : 'border-transparent text-white/55 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 p-10 text-white/45 sm:p-14">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm">Carregando...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 p-10 text-center text-white/45 sm:p-14">
          <ListTodo className="h-10 w-10" />
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
