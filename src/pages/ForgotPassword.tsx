import { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { Mail, Loader, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const ForgotPassword = ({ setMode }: { setMode: (m: 'login' | 'register' | 'forgot') => void }) => {
  const { resetPassword } = useAppContext();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [touched, setTouched] = useState(false);

  const getEmailError = (val: string) => {
    if (!val.trim()) return 'E-mail é obrigatório.';
    if (!validateEmail(val)) return 'E-mail inválido.';
    return '';
  };

  const handleBlur = () => {
    setTouched(true);
    setEmailError(getEmailError(email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const err = getEmailError(email);
    if (err) { setEmailError(err); return; }
    setEmailError('');
    setGeneralError('');
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (ex: unknown) {
      const fbErr = ex as { code?: string };
      if (fbErr.code === 'auth/user-not-found') {
        setGeneralError('Nenhuma conta encontrada com esse e-mail.');
      } else if (fbErr.code === 'auth/invalid-email') {
        setEmailError('E-mail inválido.');
      } else {
        setGeneralError('Erro ao enviar e-mail. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <div style={{ padding: '3rem 2rem 2rem', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>⚽</div>
        <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px' }}>NOSSA PELADA</h1>
        <p className="text-muted" style={{ marginTop: '0.5rem' }}>Recupere o acesso à sua conta</p>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem 1.5rem', background: 'var(--color-surface)', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', boxShadow: '0 -4px 20px rgba(0,0,0,0.07)' }}>
        <button onClick={() => setMode('login')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1.5rem', padding: 0 }}>
          <ArrowLeft size={16} /> Voltar ao login
        </button>

        {sent ? (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>
              📧
            </div>
            <h2 style={{ marginBottom: '0.75rem' }}>E-mail enviado!</h2>
            <p className="text-muted" style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              Enviamos um link de recuperação para:
            </p>
            <p style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1.5rem', wordBreak: 'break-all' }}>{email}</p>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '2rem' }}>
              Verifique sua caixa de entrada e spam. O link expira em 1 hora.
            </p>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMode('login')}>
              Voltar ao login
            </button>
            <button
              className="btn-outline"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem', border: 'none' }}
              onClick={() => { setSent(false); setEmail(''); setTouched(false); }}
            >
              Usar outro e-mail
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Recuperar Senha</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Digite seu e-mail cadastrado e enviaremos um link para criar uma nova senha.
            </p>

            {generalError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} /> {generalError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>E-mail cadastrado</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <Mail size={16} />
                  </span>
                  <input
                    id="forgot-email"
                    className={`input-base${touched && emailError ? ' input-error' : ''}`}
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (touched) setEmailError(getEmailError(e.target.value)); }}
                    onBlur={handleBlur}
                    style={{ paddingLeft: '2.5rem' }}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {touched && emailError && (
                  <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertCircle size={12} />{emailError}
                  </p>
                )}
                {touched && !emailError && email && (
                  <p style={{ color: '#22c55e', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle2 size={12} />E-mail válido
                  </p>
                )}
              </div>

              <button
                id="btn-forgot-submit"
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? <Loader size={18} className="spin" /> : <Mail size={18} />}
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                Lembrou a senha?{' '}
                <span style={{ color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setMode('login')}>
                  Fazer login
                </span>
              </p>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .input-error { border-color: #ef4444 !important; box-shadow: 0 0 0 2px rgba(239,68,68,0.15) !important; }
      `}</style>
    </div>
  );
};
