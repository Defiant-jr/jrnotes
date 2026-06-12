import { NavLink } from 'react-router-dom';
import { CheckSquare, Calendar, CheckCircle2, LayoutDashboard } from 'lucide-react';

const links = [
  { to: '/', label: 'Início', icon: LayoutDashboard, exact: true },
  { to: '/tasks', label: 'Tarefas', icon: CheckSquare },
  { to: '/today', label: 'Hoje', icon: Calendar },
  { to: '/completed', label: 'Concluídas', icon: CheckCircle2 },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between sm:h-16">
          <NavLink to="/" className="flex min-w-0 items-center gap-2.5 group">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-green-500 shadow-lg">
              <CheckSquare className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 leading-none">
              <span className="block truncate text-lg font-bold gradient-text">JR Notes</span>
              <span className="block truncate text-xs text-white/40 -mt-0.5">Gestão de Tarefas</span>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/10'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 gap-1 border-t border-white/15 bg-slate-950/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:hidden">
        {links.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                  : 'text-white/55 active:bg-white/10'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="leading-none">{label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
