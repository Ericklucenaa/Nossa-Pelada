import { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { Loader, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const Login = ({ setMode }: { setMode: (m: 'login' | 'register' | 'forgot') => void }) => {
  const { loginWithGoogle, loginWithEmail, toggleTheme } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const emailError = touched.email && !validateEmail(email) ? (email ? 'E-mail inválido.' : 'E-mail é obrigatório.') : '';
  const passwordError = touched.password && !password ? 'Senha é obrigatória.' : '';

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        setError('Login cancelado. Tente novamente.');
      } else {
        setError('Erro ao fazer login com Google. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!validateEmail(email) || !password) return;

    setEmailLoading(true);
    setError('');
    try {
      await loginWithEmail(email.trim(), password);
    } catch (err: unknown) {
      const fbErr = err as { code?: string };
      if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos. Verifique seus dados.');
      } else if (fbErr.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Aguarde alguns minutos ou redefina sua senha.');
      } else if (fbErr.code === 'auth/user-disabled') {
        setError('Esta conta foi desativada. Entre em contato com o administrador.');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <div style={{ padding: '3rem 2rem 2rem', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem', fontSize: '2rem'
        }}>
          ⚽
        </div>
        <h1 className="text-gradient" style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-1px' }}>
          NOSSA PELADA
        </h1>
        <p className="text-muted" style={{ marginTop: '0.5rem', fontSize: '1rem' }}>
          O seu app de futebol.
        </p>
      </div>

      {/* Card */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', padding: '2.5rem 1.5rem',
        background: 'var(--color-surface)',
        borderTopLeftRadius: '30px', borderTopRightRadius: '30px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.07)'
      }}>
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.6rem', fontWeight: 700 }}>Seja Bem-vindo</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Acesse sua conta para continuar
        </p>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
            marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>E-mail</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Mail size={16} />
              </span>
              <input
                id="login-email"
                className={`input-base${emailError ? ' input-error' : ''}`}
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                style={{ paddingLeft: '2.5rem' }}
                autoComplete="email"
              />
            </div>
            {emailError && (
              <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertCircle size={12} />{emailError}
              </p>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Senha</label>
              <span
                style={{ color: 'var(--color-primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}
                onClick={() => setMode('forgot')}
              >
                Esqueceu a senha?
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Lock size={16} />
              </span>
              <input
                id="login-password"
                className={`input-base${passwordError ? ' input-error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                style={{ paddingLeft: '2.5rem', paddingRight: '3rem' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordError && (
              <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertCircle size={12} />{passwordError}
              </p>
            )}
          </div>

          <button
            id="btn-email-login"
            type="submit"
            className="btn-primary"
            disabled={emailLoading || loading}
            style={{ width: '100%', justifyContent: 'center', opacity: emailLoading ? 0.7 : 1 }}
          >
            {emailLoading ? <Loader size={18} className="spin" /> : null}
            {emailLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0 1rem', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          <span style={{ padding: '0 1rem', fontSize: '0.8rem' }}>ou</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        </div>

        {/* Google Login Button */}
        <button
          id="btn-google-login"
          onClick={handleGoogleLogin}
          disabled={loading || emailLoading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            background: loading ? 'var(--color-surface-light)' : '#fff',
            color: '#3c4043',
            border: '1px solid #dadce0',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600, fontSize: '1rem',
            cursor: loading || emailLoading ? 'not-allowed' : 'pointer',
            transition: 'box-shadow 0.2s, transform 0.1s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            width: '100%',
          }}
          onMouseEnter={e => { if (!loading && !emailLoading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; }}
        >
          {loading ? (
            <Loader size={22} className="spin" />
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {loading ? 'Entrando...' : 'Continuar com Google'}
        </button>

        {/* Register Link */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            Novo por aqui?{' '}
            <span
              style={{ color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => setMode('register')}
            >
              Criar conta
            </span>
          </p>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', justifyContent: 'center' }}>
          <button onClick={toggleTheme} style={{ color: 'var(--text-muted)', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer' }}>
            Mudar Tema 🌓
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        #btn-google-login:active:not(:disabled) { transform: scale(0.98); }
        #btn-email-login:active:not(:disabled) { transform: scale(0.98); }
        .input-error { border-color: #ef4444 !important; box-shadow: 0 0 0 2px rgba(239,68,68,0.15) !important; }
      `}</style>
    </div>
  );
};
