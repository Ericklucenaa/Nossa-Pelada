import { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { Eye, EyeOff, Loader, UserPlus, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';

type FieldError = {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const passwordRules = [
  { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Uma letra maiúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Uma letra minúscula', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Um número', test: (p: string) => /[0-9]/.test(p) },
];

export const Register = ({ setMode }: { setMode: (m: 'login' | 'register' | 'forgot') => void }) => {
  const { registerWithEmail } = useAppContext();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);

  const validate = (): FieldError => {
    const errs: FieldError = {};
    if (!email.trim()) errs.email = 'E-mail é obrigatório.';
    else if (!validateEmail(email)) errs.email = 'E-mail inválido.';

    if (!username.trim()) errs.username = 'Nome de usuário é obrigatório.';
    else if (username.trim().length < 3) errs.username = 'Use pelo menos 3 caracteres.';
    else if (!/^[a-zA-Z0-9 _]+$/.test(username)) errs.username = 'Apenas letras, números, espaços e _.';

    if (!password) errs.password = 'Senha é obrigatória.';
    else if (passwordRules.some(r => !r.test(password))) errs.password = 'Senha não atende aos requisitos.';

    if (!confirmPassword) errs.confirmPassword = 'Confirme sua senha.';
    else if (password !== confirmPassword) errs.confirmPassword = 'As senhas não coincidem.';

    return errs;
  };

  const handleBlur = (field: string) =>
    setTouched(prev => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, username: true, password: true, confirmPassword: true });
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await registerWithEmail(email.trim(), password, username.trim());
      setSuccess(true);
    } catch (err: unknown) {
      const fbErr = err as { code?: string };
      if (fbErr.code === 'auth/email-already-in-use') {
        setErrors({ email: 'Este e-mail já está em uso.' });
      } else if (fbErr.code === 'auth/invalid-email') {
        setErrors({ email: 'E-mail inválido.' });
      } else if (fbErr.code === 'auth/weak-password') {
        setErrors({ password: 'Senha muito fraca.' });
      } else if (fbErr.code === 'auth/operation-not-allowed') {
        setErrors({ general: 'O cadastro via e-mail e senha está desativado no Console do Firebase. Ative-o para continuar.' });
      } else {
        const errorMsg = (err as { message?: string }).message || 'Erro ao criar conta. Tente novamente.';
        setErrors({ general: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (field: keyof FieldError) =>
    touched[field] ? (validate()[field] || errors[field]) : errors[field];

  if (success) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem', background: 'var(--color-bg)' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '3rem 2rem', textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>
            ✅
          </div>
          <h2 style={{ marginBottom: '0.75rem' }}>Conta criada!</h2>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>Bem-vindo, <strong>{username}</strong>! Sua conta foi criada com sucesso.</p>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMode('login')}>
            Fazer login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <div style={{ padding: '3rem 2rem 2rem', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>⚽</div>
        <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px' }}>NOSSA PELADA</h1>
        <p className="text-muted" style={{ marginTop: '0.5rem' }}>Crie sua conta para começar</p>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem 1.5rem', background: 'var(--color-surface)', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', boxShadow: '0 -4px 20px rgba(0,0,0,0.07)' }}>
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Criar Conta</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Preencha os campos para acesso</p>

        {errors.general && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} /> {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>E-mail</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Mail size={16} />
              </span>
              <input
                id="reg-email"
                className={`input-base${fieldError('email') ? ' input-error' : ''}`}
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                style={{ paddingLeft: '2.5rem' }}
                autoComplete="email"
              />
            </div>
            {fieldError('email') && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertCircle size={12} />{fieldError('email')}</p>}
          </div>

          {/* Username */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Nome de Usuário</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <User size={16} />
              </span>
              <input
                id="reg-username"
                className={`input-base${fieldError('username') ? ' input-error' : ''}`}
                type="text"
                placeholder="Será seu login (Ex: erick_10)"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onBlur={() => handleBlur('username')}
                style={{ paddingLeft: '2.5rem' }}
                autoComplete="username"
                maxLength={40}
              />
            </div>
            {fieldError('username') && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertCircle size={12} />{fieldError('username')}</p>}
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Lock size={16} />
              </span>
              <input
                id="reg-password"
                className={`input-base${fieldError('password') ? ' input-error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                style={{ paddingLeft: '2.5rem', paddingRight: '3rem' }}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldError('password') && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertCircle size={12} />{fieldError('password')}</p>}

            {/* Password strength indicators */}
            {password && (
              <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 0.5rem' }}>
                {passwordRules.map(rule => {
                  const ok = rule.test(password);
                  return (
                    <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: ok ? '#22c55e' : 'var(--text-muted)' }}>
                      <CheckCircle2 size={11} style={{ opacity: ok ? 1 : 0.4 }} />
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Confirmar Senha</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Lock size={16} />
              </span>
              <input
                id="reg-confirm"
                className={`input-base${fieldError('confirmPassword') ? ' input-error' : ''}`}
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                style={{ paddingLeft: '2.5rem', paddingRight: '3rem' }}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldError('confirmPassword') && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertCircle size={12} />{fieldError('confirmPassword')}</p>}
            {touched.confirmPassword && !fieldError('confirmPassword') && confirmPassword && (
              <p style={{ color: '#22c55e', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={12} />Senhas conferem</p>
            )}
          </div>

          <button
            id="btn-register-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Loader size={18} className="spin" /> : <UserPlus size={18} />}
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            Já tem uma conta?{' '}
            <span style={{ color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setMode('login')}>
              Fazer login
            </span>
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }} onClick={() => setMode('forgot')}>
              Esqueceu a senha?
            </span>
          </p>
        </div>
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
