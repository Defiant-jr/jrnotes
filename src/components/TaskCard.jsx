import { motion } from 'framer-motion';
import { Check, Trash2, RotateCcw, Calendar, AlignLeft, GripVertical } from 'lucide-react';
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
      className={`glass-card p-4 flex items-start gap-3 group transition-all duration-200 hover:border-white/30 ${isCompleted ? 'opacity-70' : ''}`}
    >
      {/* Complete / Reopen button */}
      <button
        onClick={() => isCompleted ? reopenTask(task.id) : completeTask(task.id)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
          isCompleted
            ? 'bg-green-500/30 border-green-500/60 text-green-400'
            : 'border-white/30 hover:border-blue-400 hover:bg-blue-500/20'
        }`}
        title={isCompleted ? 'Reabrir tarefa' : 'Concluir tarefa'}
      >
        {isCompleted && <Check className="w-3 h-3" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-white/90 text-sm font-medium leading-snug ${isCompleted ? 'line-through text-white/40' : ''}`}>
          {task.title}
        </p>
        {task.notes && (
          <p className="flex items-center gap-1 text-white/40 text-xs mt-1 line-clamp-2">
            <AlignLeft className="w-3 h-3 shrink-0" />
            {task.notes}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={cls}>{label}</span>
          {task.due && (
            <span className="flex items-center gap-1 text-white/40 text-xs">
              <Calendar className="w-3 h-3" />
              {formatDue(task.due)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {isCompleted && (
          <button
            onClick={() => reopenTask(task.id)}
            className="p-1.5 text-white/40 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
            title="Reabrir"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => removeTask(task.id)}
          className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
