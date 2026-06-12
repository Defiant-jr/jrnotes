import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { useTasks } from '../context/TasksContext.jsx';
import TaskCard from '../components/TaskCard.jsx';
import TaskForm from '../components/TaskForm.jsx';

export default function CompletedPage() {
  const { completed, loading, loadCompleted } = useTasks();

  useEffect(() => {
    loadCompleted();
  }, []);

  return (
    <motion.div
      key="completed"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="page-container mx-auto max-w-3xl"
    >
      <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6 sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">Concluídas</h1>
          <p className="mt-1 text-sm text-white/45">{completed.length} tarefa{completed.length !== 1 ? 's' : ''} finalizada{completed.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[10px] font-medium text-white/35 sm:text-xs">11300</span>
          <button
            onClick={loadCompleted}
            className="btn-outline flex items-center justify-center gap-2 px-3 sm:px-4"
            disabled={loading}
          >
            <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {loading && completed.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 p-10 text-white/45 sm:p-14">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm">Carregando...</p>
        </div>
      ) : completed.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 p-10 text-center text-white/45 sm:p-14">
          <CheckCircle2 className="h-10 w-10" />
          <p className="text-sm">Nenhuma tarefa concluída ainda</p>
          <TaskForm />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {completed.map((task, i) => (
              <TaskCard key={task.id} task={task} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
