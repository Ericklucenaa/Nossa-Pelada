import { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { Loader, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';

export const Login = ({ setMode }: { setMode: (m: 'login' | 'register' | 'forgot') => void }) => {
  const { loginWithGoogle, loginWithEmail, toggleTheme } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const identifierError = touched.email && !email.trim() ? 'Usuário ou e-mail é obrigatório.' : '';
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
    if (!email.trim() || !password) return;

    setEmailLoading(true);
    setError('');
    try {
      await loginWithEmail(email.trim(), password);
    } catch (err: unknown) {
      const fbErr = err as { code?: string };
      if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (fbErr.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Aguarde alguns minutos.');
      } else if (fbErr.code === 'auth/user-disabled') {
        setError('Esta conta foi desativada.');
      } else {
        const errorMsg = (err as { message?: string }).message || 'Erro ao fazer login. Tente novamente.';
        setError(errorMsg);
      }
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '16px', background: 'var(--color-bg)' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '380px', padding: '24px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-main)' }}>Nossa Pelada</h1>
          <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>Acesse sua conta para continuar</p>
        </div>

        {error && (
          <div style={{
            background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)',
            color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '8px 10px',
            marginBottom: '14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          <div>
            <label className="input-label">Usuário ou E-mail</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Mail size={15} />
              </span>
              <input
                id="login-email"
                className={`input-base${identifierError ? ' input-error' : ''}`}
                type="text"
                placeholder="seu@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                style={{ paddingLeft: '32px' }}
                autoComplete="email"
              />
            </div>
            {identifierError && (
              <p style={{ color: 'var(--color-danger)', fontSize: '11px', marginTop: '3px', margin: '3px 0 0' }}>
                {identifierError}
              </p>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <label className="input-label" style={{ margin: 0 }}>Senha</label>
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: '11px' }}
                onClick={() => setMode('forgot')}
              >
                Esqueceu?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Lock size={15} />
              </span>
              <input
                id="login-password"
                className={`input-base${passwordError ? ' input-error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                style={{ paddingLeft: '32px', paddingRight: '36px' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {passwordError && (
              <p style={{ color: 'var(--color-danger)', fontSize: '11px', marginTop: '3px', margin: '3px 0 0' }}>
                {passwordError}
              </p>
            )}
          </div>

          <button
            id="btn-email-login"
            type="submit"
            className="btn-primary"
            disabled={emailLoading || loading}
            style={{ width: '100%', height: '36px', fontSize: '13px', marginTop: '4px' }}
          >
            {emailLoading ? <Loader size={15} className="spin" /> : null}
            {emailLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '6px 0 12px', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          <span style={{ padding: '0 8px', fontSize: '11px' }}>ou</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        </div>

        {/* Google Login Button */}
        <button
          id="btn-google-login"
          onClick={handleGoogleLogin}
          disabled={loading || emailLoading}
          className="btn-outline"
          style={{ width: '100%', height: '36px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          {loading ? (
            <Loader size={16} className="spin" />
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </button>

        {/* Register Link */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>
            Novo por aqui?{' '}
            <button
              type="button"
              className="btn-link"
              style={{ fontSize: '12px', fontWeight: 600 }}
              onClick={() => setMode('register')}
            >
              Criar conta
            </button>
          </p>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button type="button" onClick={toggleTheme} className="btn-ghost" style={{ fontSize: '11px', height: '26px' }}>
            Alternar Tema
          </button>
        </div>
      </div>
    </div>
  );
};
