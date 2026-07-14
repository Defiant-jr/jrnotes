import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar, CheckCircle2, ArrowRight,
  ListTodo, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useTasks } from '../context/TasksContext.jsx';
import StatsCard from '../components/StatsCard.jsx';
import TaskForm from '../components/TaskForm.jsx';

const navCards = [
  {
    to: '/tasks',
    icon: ListTodo,
    label: 'Todas as Tarefas',
    ref: '11100',
    desc: 'Gerencie pendências',
    gradient: 'from-blue-600/30 to-blue-800/20',
    border: 'border-blue-500/30 hover:border-blue-400/60',
    iconColor: 'text-blue-400',
  },
  {
    to: '/today',
    icon: Calendar,
    label: 'Para Hoje',
    ref: '11200',
    desc: 'Vencem hoje',
    gradient: 'from-cyan-600/30 to-cyan-800/20',
    border: 'border-cyan-500/30 hover:border-cyan-400/60',
    iconColor: 'text-cyan-400',
  },
  {
    to: '/completed',
    icon: CheckCircle2,
    label: 'Concluídas',
    ref: '11300',
    desc: 'Finalizadas',
    gradient: 'from-green-600/30 to-green-800/20',
    border: 'border-green-500/30 hover:border-green-400/60',
    iconColor: 'text-green-400',
  },
  {
    action: 'refresh',
    icon: RefreshCw,
    label: 'Atualizar',
    desc: 'Sincronizar',
    gradient: 'from-indigo-600/30 to-indigo-800/20',
    border: 'border-indigo-500/30 hover:border-indigo-400/60',
    iconColor: 'text-indigo-400',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { stats, loadTasks } = useTasks();

  useEffect(() => {
    loadTasks();
  }, []);

  const today = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <motion.div
      key="home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-container mx-auto max-w-6xl"
    >
      <div className="mb-6 sm:mb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="mb-1 flex items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-white/45">{todayCapitalized}</p>
            <span className="shrink-0 text-[10px] font-medium text-white/35 sm:text-xs">11000</span>
          </div>
          <h1 className="mb-2 text-2xl font-bold leading-tight text-white sm:text-4xl">
            Olá! Aqui estão as tarefas de <span className="gradient-text">Jr.</span>
          </h1>
          <p className="text-sm text-white/55">
            {stats.today > 0
              ? `Você tem ${stats.today} tarefa${stats.today > 1 ? 's' : ''} para hoje`
              : 'Nenhuma tarefa vence hoje.'}
          </p>
        </motion.div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2.5 sm:mb-8 sm:gap-3 lg:grid-cols-4">
        <StatsCard icon={ListTodo} label="Pendentes" value={stats.total} color="blue" index={0} />
        <StatsCard icon={Calendar} label="Para hoje" value={stats.today} color="cyan" index={1} />
        <StatsCard icon={AlertCircle} label="Atrasadas" value={stats.overdue} color="red" index={2} />
        <StatsCard icon={CheckCircle2} label="Concluídas" value={stats.completed} color="green" index={3} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 grid grid-cols-2 gap-2.5 sm:mb-8 sm:gap-3 lg:grid-cols-4"
      >
        {navCards.map(({ to, action, icon: Icon, label, ref, desc, gradient, border, iconColor }) => (
          <button
            key={label}
            onClick={() => (action === 'refresh' ? loadTasks() : navigate(to))}
            className={`glass-card-hover bg-gradient-to-br ${gradient} border ${border} flex min-w-0 items-center gap-3 p-3 text-left group sm:gap-4 sm:p-4`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-transform group-hover:scale-105 sm:h-10 sm:w-10">
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-white">{label}</p>
              <p className="text-xs leading-snug text-white/45">{desc}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {to && <ArrowRight className="h-4 w-4 text-white/30" />}
              {ref && <span className="text-[10px] font-semibold text-white/35">{ref}</span>}
            </div>
          </button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="glass-card mb-6 p-3 sm:p-4"
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-white/45">Adição rápida</p>
        <TaskForm compact />
      </motion.div>

    </motion.div>
  );
}
