import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';
import TasksPage from './pages/TasksPage.jsx';
import AgendaPage from './pages/AgendaPage.jsx';
import TodayPage from './pages/TodayPage.jsx';
import CompletedPage from './pages/CompletedPage.jsx';
import { TasksProvider } from './context/TasksContext.jsx';
import Toast from './components/Toast.jsx';
import PasswordGate from './components/PasswordGate.jsx';

export default function App() {
  const location = useLocation();
  const hideHeader = location.pathname === '/agenda';

  return (
    <TasksProvider>
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #312e81 100%)' }}>
        {!hideHeader && <Header />}
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tasks" element={<PasswordGate><TasksPage /></PasswordGate>} />
            <Route path="/agenda" element={<PasswordGate><AgendaPage /></PasswordGate>} />
            <Route path="/today" element={<PasswordGate><TodayPage /></PasswordGate>} />
            <Route path="/completed" element={<PasswordGate><CompletedPage /></PasswordGate>} />
          </Routes>
        </AnimatePresence>
        <Toast />
      </div>
    </TasksProvider>
  );
}
