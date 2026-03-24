import { useState } from 'react';
import { useAppContext } from '../context/AppDataContext';
import { LogIn } from 'lucide-react';

export const Login = ({ setMode }: { setMode: (m: 'login' | 'register') => void }) => {
  const { users, login, toggleTheme } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Fallback para o MVP local (selecionar da lista) se o usuário quiser
  const [selectedUser, setSelectedUser] = useState<string>('');
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      login(selectedUser);
    } else {
      alert('Integração Firebase pendente: ' + email);
      // Fallback pra login admin provisório:
      login(users[0]?.id);
    }
  };

  const handleGoogleLogin = () => {
    alert('Integração com Google Firebase pendente de credenciais. (Redirecionando via Mock)');
    login(users[0]?.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Fake Mobile Status Bar / Top Area */}
      <div style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', fontWeight: 800 }}>PELADA</h1>
        <p className="subtitle text-muted" style={{ marginTop: '0.5rem' }}>O seu app de futebol.</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem', background: 'var(--color-surface)', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Bem-vindo de volta</h2>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
             <label style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</label>
             <input type="email" className="input-base" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
             <label style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Senha</label>
             <input type="password" className="input-base" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <div style={{ margin: '1rem 0' }}>
             <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-warning)' }}>(Modo Teste Local) Selecione Perfil Mock</label>
             <select className="input-base" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                <option value="">Entrar c/ Email acima...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} (OVR: {u.overall})</option>
                ))}
             </select>
          </div>
          
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
            <LogIn size={20} /> Entrar
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          <span style={{ padding: '0 1rem', fontSize: '0.8rem' }}>ou continue com</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
            background: 'var(--color-surface-light)', color: 'var(--text-main)', 
            border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-md)',
            fontWeight: 600
          }}>
          <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
          Google
        </button>

        <p className="text-muted" style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '2rem', fontSize: '0.9rem' }}>
          Não tem uma conta? <span style={{ color: 'var(--color-primary)', fontWeight: 600 }} onClick={() => setMode('register')}>Criar agora</span>
        </p>

        <button onClick={toggleTheme} style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Mudar Tema 🌓</button>
      </div>
    </div>
  );
};
