import { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { Eye, EyeOff, Loader, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';

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
    else if (username.trim().length < 3) errs.username = 'Mínimo 3 caracteres.';
    else if (!/^[a-zA-Z0-9 _]+$/.test(username)) errs.username = 'Apenas letras, números e _.';

    if (!password) errs.password = 'Senha é obrigatória.';
    else if (passwordRules.some(r => !r.test(password))) errs.password = 'Senha incompleta.';

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
        setErrors({ general: 'Cadastro por e-mail desativado no Firebase.' });
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '16px', background: 'var(--color-bg)' }}>
        <div className="panel" style={{ width: '100%', maxWidth: '380px', padding: '24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Conta criada com sucesso</h2>
          <p className="text-muted" style={{ marginBottom: '16px', fontSize: '13px' }}>Bem-vindo, <strong>{username}</strong>!</p>
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => setMode('login')}>
            Fazer login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '16px', background: 'var(--color-bg)' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '380px', padding: '24px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-main)' }}>Criar Conta</h1>
          <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>Preencha os campos para acesso</p>
        </div>

        {errors.general && (
          <div style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', marginBottom: '14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} /> {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Email */}
          <div>
            <label className="input-label">E-mail</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Mail size={15} />
              </span>
              <input
                id="reg-email"
                className={`input-base${fieldError('email') ? ' input-error' : ''}`}
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                style={{ paddingLeft: '32px' }}
                autoComplete="email"
              />
            </div>
            {fieldError('email') && <p style={{ color: 'var(--color-danger)', fontSize: '11px', margin: '3px 0 0' }}>{fieldError('email')}</p>}
          </div>

          {/* Username */}
          <div>
            <label className="input-label">Nome de Usuário</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <User size={15} />
              </span>
              <input
                id="reg-username"
                className={`input-base${fieldError('username') ? ' input-error' : ''}`}
                type="text"
                placeholder="Ex: jogador_7"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onBlur={() => handleBlur('username')}
                style={{ paddingLeft: '32px' }}
                autoComplete="username"
                maxLength={40}
              />
            </div>
            {fieldError('username') && <p style={{ color: 'var(--color-danger)', fontSize: '11px', margin: '3px 0 0' }}>{fieldError('username')}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="input-label">Senha</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Lock size={15} />
              </span>
              <input
                id="reg-password"
                className={`input-base${fieldError('password') ? ' input-error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                style={{ paddingLeft: '32px', paddingRight: '36px' }}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {fieldError('password') && <p style={{ color: 'var(--color-danger)', fontSize: '11px', margin: '3px 0 0' }}>{fieldError('password')}</p>}

            {/* Password strength indicators */}
            {password && (
              <div style={{ marginTop: '4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 6px' }}>
                {passwordRules.map(rule => {
                  const ok = rule.test(password);
                  return (
                    <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: ok ? 'var(--color-primary-text)' : 'var(--text-muted)' }}>
                      <CheckCircle2 size={10} style={{ opacity: ok ? 1 : 0.4 }} />
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="input-label">Confirmar Senha</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Lock size={15} />
              </span>
              <input
                id="reg-confirm"
                className={`input-base${fieldError('confirmPassword') ? ' input-error' : ''}`}
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                style={{ paddingLeft: '32px', paddingRight: '36px' }}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {fieldError('confirmPassword') && <p style={{ color: 'var(--color-danger)', fontSize: '11px', margin: '3px 0 0' }}>{fieldError('confirmPassword')}</p>}
          </div>

          <button
            id="btn-register-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', height: '36px', fontSize: '13px', marginTop: '6px' }}
          >
            {loading ? <Loader size={15} className="spin" /> : null}
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>
            Já tem uma conta?{' '}
            <button
              type="button"
              className="btn-link"
              style={{ fontSize: '12px', fontWeight: 600 }}
              onClick={() => setMode('login')}
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
