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
      className="page-container max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Concluídas</h1>
          <p className="text-white/40 text-sm mt-0.5">{completed.length} tarefa{completed.length !== 1 ? 's' : ''} finalizada{completed.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={loadCompleted}
          className="btn-outline flex items-center gap-2"
          disabled={loading}
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {loading && completed.length === 0 ? (
        <div className="glass-card p-14 flex flex-col items-center gap-3 text-white/40">
          <Loader2 className="w-7 h-7 animate-spin" />
          <p className="text-sm">Carregando...</p>
        </div>
      ) : completed.length === 0 ? (
        <div className="glass-card p-14 flex flex-col items-center gap-3 text-white/40">
          <CheckCircle2 className="w-10 h-10" />
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
