import { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { Mail, Loader, ArrowLeft, AlertCircle } from 'lucide-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '16px', background: 'var(--color-bg)' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '380px', padding: '24px 20px' }}>
        <button onClick={() => setMode('login')} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '0 4px', height: '26px', marginBottom: '14px' }}>
          <ArrowLeft size={14} /> Voltar ao login
        </button>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>E-mail enviado</h2>
            <p className="text-muted" style={{ marginBottom: '4px', fontSize: '13px' }}>
              Enviamos um link de recuperação para:
            </p>
            <p style={{ fontWeight: 600, color: 'var(--color-primary-text)', marginBottom: '14px', fontSize: '13px' }}>{email}</p>
            <p className="text-muted" style={{ fontSize: '11px', marginBottom: '16px' }}>
              Verifique sua caixa de entrada e spam.
            </p>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setMode('login')}>
              Voltar ao login
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-main)' }}>Recuperar Senha</h1>
              <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>
                Digite seu e-mail para receber o link
              </p>
            </div>

            {generalError && (
              <div style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', marginBottom: '14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> {generalError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">E-mail cadastrado</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <Mail size={15} />
                  </span>
                  <input
                    id="forgot-email"
                    className={`input-base${touched && emailError ? ' input-error' : ''}`}
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (touched) setEmailError(getEmailError(e.target.value)); }}
                    onBlur={handleBlur}
                    style={{ paddingLeft: '32px' }}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {touched && emailError && (
                  <p style={{ color: 'var(--color-danger)', fontSize: '11px', margin: '3px 0 0' }}>
                    {emailError}
                  </p>
                )}
              </div>

              <button
                id="btn-forgot-submit"
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: '100%', height: '36px', fontSize: '13px', marginTop: '6px' }}
              >
                {loading ? <Loader size={15} className="spin" /> : null}
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
