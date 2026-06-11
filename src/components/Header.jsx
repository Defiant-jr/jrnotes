import { NavLink } from 'react-router-dom';
import { CheckSquare, Calendar, CheckCircle2, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const links = [
  { to: '/', label: 'Início', icon: LayoutDashboard, exact: true },
  { to: '/tasks', label: 'Tarefas', icon: CheckSquare },
  { to: '/today', label: 'Hoje', icon: Calendar },
  { to: '/completed', label: 'Concluídas', icon: CheckCircle2 },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center shadow-lg">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            <div className="leading-none">
              <span className="text-lg font-bold gradient-text">JR Notes</span>
              <span className="block text-xs text-white/40 -mt-0.5">Gestão de Tarefas</span>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/10'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-white/10"
          >
            <nav className="flex flex-col gap-1 p-3">
              {links.map(({ to, label, icon: Icon, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
