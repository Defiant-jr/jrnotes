import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';

const ACCESS_PASSWORD = '151828';

export default function PasswordGate({ children }) {
  const location = useLocation();
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setUnlocked(false);
    setPassword('');
    setError('');
  }, [location.pathname]);

  useEffect(() => {
    if (!unlocked) inputRef.current?.focus();
  }, [unlocked]);

  const handleSubmit = event => {
    event.preventDefault();

    if (password === ACCESS_PASSWORD) {
      setUnlocked(true);
      setError('');
      return;
    }

    setError('Senha incorreta');
    setPassword('');
  };

  if (unlocked) return children;

  return (
    <div className="page-container mx-auto flex max-w-md items-center justify-center">
      <form onSubmit={handleSubmit} className="glass-card w-full p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/25 text-blue-200">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-white">Acesso restrito</h1>
            <p className="mt-0.5 text-sm text-white/45">Informe a senha para continuar</p>
          </div>
        </div>

        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/45" htmlFor="access-password">
          Senha
        </label>
        <input
          ref={inputRef}
          id="access-password"
          className="input-field"
          type="password"
          value={password}
          onChange={event => {
            setPassword(event.target.value);
            setError('');
          }}
          autoComplete="current-password"
        />

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        <button type="submit" className="btn-primary mt-5 w-full">
          Entrar
        </button>
      </form>
    </div>
  );
}
