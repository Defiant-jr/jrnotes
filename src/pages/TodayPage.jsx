import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTasks } from '../context/TasksContext.jsx';
import TaskCard from '../components/TaskCard.jsx';
import TaskForm from '../components/TaskForm.jsx';

export default function TodayPage() {
  const { todayTasks, stats, loading, loadTasks, getTaskStatus } = useTasks();

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
      className="page-container max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wide mb-1">{today}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Para Hoje</h1>
          <p className="text-white/40 text-sm mt-0.5">{todayTasks.length} tarefa{todayTasks.length !== 1 ? 's' : ''} urgente{todayTasks.length !== 1 ? 's' : ''}</p>
        </div>
        <TaskForm />
      </div>

      {loading && todayTasks.length === 0 ? (
        <div className="glass-card p-14 flex flex-col items-center gap-3 text-white/40">
          <Loader2 className="w-7 h-7 animate-spin" />
          <p className="text-sm">Carregando...</p>
        </div>
      ) : todayTasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-14 flex flex-col items-center gap-3 text-white/40"
        >
          <CheckCircle2 className="w-12 h-12 text-green-400/60" />
          <p className="text-lg font-medium text-white/60">Tudo em dia!</p>
          <p className="text-sm">Nenhuma tarefa vence hoje</p>
          <TaskForm />
        </motion.div>
      ) : (
        <div className="flex flex-col gap-6">
          {overdue.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide">Atrasadas ({overdue.length})</h2>
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
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">Vencem hoje ({dueToday.length})</h2>
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
