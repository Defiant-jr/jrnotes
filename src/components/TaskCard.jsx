import { motion } from 'framer-motion';
import { Check, Trash2, RotateCcw, Calendar, AlignLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTasks } from '../context/TasksContext.jsx';

const statusConfig = {
  pending: { label: 'Pendente', cls: 'badge-pending' },
  today: { label: 'Hoje', cls: 'badge-today' },
  overdue: { label: 'Atrasada', cls: 'badge-overdue' },
  completed: { label: 'Concluída', cls: 'badge-completed' },
};

function formatDue(due) {
  try {
    return format(parseISO(due), "dd 'de' MMM", { locale: ptBR });
  } catch {
    return '';
  }
}

export default function TaskCard({ task, index = 0 }) {
  const { completeTask, reopenTask, removeTask, getTaskStatus } = useTasks();
  const status = getTaskStatus(task);
  const { label, cls } = statusConfig[status] || statusConfig.pending;
  const isCompleted = status === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.04 }}
      className={`glass-card p-3 sm:p-4 flex items-start gap-3 group transition-all duration-200 hover:border-white/30 ${isCompleted ? 'opacity-70' : ''}`}
    >
      <button
        onClick={() => (isCompleted ? reopenTask(task.id) : completeTask(task.id))}
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 sm:h-6 sm:w-6 ${
          isCompleted
            ? 'bg-green-500/30 border-green-500/60 text-green-400'
            : 'border-white/30 hover:border-blue-400 hover:bg-blue-500/20'
        }`}
        title={isCompleted ? 'Reabrir tarefa' : 'Concluir tarefa'}
      >
        {isCompleted && <Check className="h-4 w-4 sm:h-3.5 sm:w-3.5" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`text-[15px] sm:text-sm font-medium leading-snug text-white/90 ${isCompleted ? 'line-through text-white/40' : ''}`}>
          {task.title}
        </p>
        {task.notes && (
          <p className="mt-1 flex items-center gap-1 text-xs text-white/40 line-clamp-2">
            <AlignLeft className="h-3 w-3 shrink-0" />
            {task.notes}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={cls}>{label}</span>
          {task.due && (
            <span className="flex items-center gap-1 text-xs text-white/40">
              <Calendar className="h-3 w-3" />
              {formatDue(task.due)}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        {isCompleted && (
          <button
            onClick={() => reopenTask(task.id)}
            className="rounded-lg p-2 text-white/50 transition-colors hover:bg-blue-500/20 hover:text-blue-400"
            title="Reabrir"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => removeTask(task.id)}
          className="rounded-lg p-2 text-white/50 transition-colors hover:bg-red-500/20 hover:text-red-400"
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
