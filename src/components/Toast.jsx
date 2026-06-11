import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { useTasks } from '../context/TasksContext.jsx';

export default function Toast() {
  const { toast } = useTasks();

  return (
    <div className="fixed bottom-6 right-4 z-[100] sm:right-6 pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium max-w-xs ${
              toast.type === 'error'
                ? 'bg-red-900/90 border-red-500/50 text-red-200'
                : 'bg-slate-800/95 border-green-500/40 text-white'
            }`}
          >
            {toast.type === 'error'
              ? <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              : <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            }
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
