import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckSquare, Calendar, CheckCircle2, Clock, ArrowRight,
  ListTodo, AlertCircle, Loader2, RefreshCw,
} from 'lucide-react';
import { useTasks } from '../context/TasksContext.jsx';
import StatsCard from '../components/StatsCard.jsx';
import TaskCard from '../components/TaskCard.jsx';
import TaskForm from '../components/TaskForm.jsx';
import { AnimatePresence } from 'framer-motion';

const navCards = [
  {
    to: '/tasks',
    icon: ListTodo,
    label: 'Todas as Tarefas',
    desc: 'Gerencie todas as suas tarefas pendentes',
    gradient: 'from-blue-600/30 to-blue-800/20',
    border: 'border-blue-500/30 hover:border-blue-400/60',
    iconColor: 'text-blue-400',
  },
  {
    to: '/today',
    icon: Calendar,
    label: 'Para Hoje',
    desc: 'Tarefas com vencimento para hoje',
    gradient: 'from-cyan-600/30 to-cyan-800/20',
    border: 'border-cyan-500/30 hover:border-cyan-400/60',
    iconColor: 'text-cyan-400',
  },
  {
    to: '/completed',
    icon: CheckCircle2,
    label: 'Concluídas',
    desc: 'Histórico de tarefas finalizadas',
    gradient: 'from-green-600/30 to-green-800/20',
    border: 'border-green-500/30 hover:border-green-400/60',
    iconColor: 'text-green-400',
  },
  {
    action: 'refresh',
    icon: RefreshCw,
    label: 'Atualizar',
    desc: 'Sincronizar com o Google Tasks',
    gradient: 'from-indigo-600/30 to-indigo-800/20',
    border: 'border-indigo-500/30 hover:border-indigo-400/60',
    iconColor: 'text-indigo-400',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { tasks, todayTasks, stats, loading, loadTasks } = useTasks();

  useEffect(() => {
    loadTasks();
  }, []);

  const recentTasks = tasks.slice(0, 5);
  const today = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <motion.div
      key="home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-container max-w-6xl mx-auto"
    >
      {/* Hero */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <p className="text-white/40 text-sm mb-1">{todayCapitalized}</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
            Olá! Aqui estão suas{' '}
            <span className="gradient-text">tarefas</span>
          </h1>
          <p className="text-white/50 text-sm">
            {stats.today > 0
              ? `Você tem ${stats.today} tarefa${stats.today > 1 ? 's' : ''} para hoje`
              : 'Nenhuma tarefa vence hoje — bom trabalho!'}
          </p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatsCard icon={ListTodo} label="Total pendente" value={stats.total} color="blue" index={0} />
        <StatsCard icon={Calendar} label="Para hoje" value={stats.today} color="cyan" index={1} />
        <StatsCard icon={AlertCircle} label="Atrasadas" value={stats.overdue} color="red" index={2} />
        <StatsCard icon={CheckCircle2} label="Concluídas" value={stats.completed} color="green" index={3} />
      </div>

      {/* Navigation cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
      >
        {navCards.map(({ to, action, icon: Icon, label, desc, gradient, border, iconColor }) => (
          <button
            key={label}
            onClick={() => action === 'refresh' ? loadTasks() : navigate(to)}
            className={`glass-card-hover bg-gradient-to-br ${gradient} border ${border} p-4 text-left group`}
          >
            <div className={`w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <p className="text-white font-semibold text-sm mb-0.5">{label}</p>
            <p className="text-white/40 text-xs leading-snug">{desc}</p>
            {to && (
              <div className="flex items-center gap-1 mt-2 text-xs text-white/30 group-hover:text-white/60 transition-colors">
                Acessar <ArrowRight className="w-3 h-3" />
              </div>
            )}
          </button>
        ))}
      </motion.div>

      {/* Quick add */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="glass-card p-4 mb-6"
      >
        <p className="text-xs text-white/40 uppercase tracking-wide font-medium mb-3">Adição rápida</p>
        <TaskForm compact />
      </motion.div>

      {/* Recent tasks */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">Tarefas recentes</h2>
          <button
            onClick={() => navigate('/tasks')}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            Ver todas <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {loading && tasks.length === 0 ? (
          <div className="glass-card p-10 flex flex-col items-center gap-3 text-white/40">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">Carregando tarefas...</p>
          </div>
        ) : recentTasks.length === 0 ? (
          <div className="glass-card p-10 flex flex-col items-center gap-3 text-white/40">
            <CheckSquare className="w-8 h-8" />
            <p className="text-sm">Nenhuma tarefa pendente</p>
            <TaskForm />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {recentTasks.map((task, i) => (
                <TaskCard key={task.id} task={task} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
