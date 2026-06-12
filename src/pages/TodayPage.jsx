import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTasks } from '../context/TasksContext.jsx';
import TaskCard from '../components/TaskCard.jsx';
import TaskForm from '../components/TaskForm.jsx';

export default function TodayPage() {
  const { todayTasks, loading, loadTasks, getTaskStatus } = useTasks();

  useEffect(() => {
    if (todayTasks.length === 0) loadTasks();
  }, []);

  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const overdue = todayTasks.filter(t => getTaskStatus(t) === 'overdue');
  const dueToday = todayTasks.filter(t => getTaskStatus(t) === 'today');

  return (
    <motion.div
      key="today"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="page-container mx-auto max-w-3xl"
    >
      <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6 sm:items-center">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-white/45">{today}</p>
          <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">Para Hoje</h1>
          <p className="mt-1 text-sm text-white/45">{todayTasks.length} tarefa{todayTasks.length !== 1 ? 's' : ''} urgente{todayTasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[10px] font-medium text-white/35 sm:text-xs">11200</span>
          <TaskForm />
        </div>
      </div>

      {loading && todayTasks.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 p-10 text-white/45 sm:p-14">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm">Carregando...</p>
        </div>
      ) : todayTasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card flex flex-col items-center gap-3 p-10 text-center text-white/45 sm:p-14"
        >
          <CheckCircle2 className="h-12 w-12 text-green-400/60" />
          <p className="text-lg font-medium text-white/65">Tudo em dia!</p>
          <p className="text-sm">Nenhuma tarefa vence hoje</p>
          <TaskForm />
        </motion.div>
      ) : (
        <div className="flex flex-col gap-6">
          {overdue.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-red-400">Atrasadas ({overdue.length})</h2>
              </div>
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {overdue.map((task, i) => (
                    <TaskCard key={task.id} task={task} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {dueToday.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-400">Vencem hoje ({dueToday.length})</h2>
              </div>
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {dueToday.map((task, i) => (
                    <TaskCard key={task.id} task={task} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
