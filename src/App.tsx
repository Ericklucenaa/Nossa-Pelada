import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Calendar, DollarSign, Activity, LogOut, Sun, Moon, UserCircle2, Loader } from 'lucide-react';
import { useAppContext } from './context/useAppContext';
import './App.css';

import { Dashboard } from './pages/Dashboard';
import { MatchList } from './pages/MatchList';
import { MatchDetail } from './pages/MatchDetail';
import { Finance } from './pages/Finance';
import { Courts } from './pages/Courts';
import { Rankings } from './pages/Rankings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Players } from './pages/Players';
import { ForgotPassword } from './pages/ForgotPassword';
import { Profile } from './pages/Profile';
import { useState } from 'react';

function TopBar() {
  const { theme, toggleTheme, logout, currentUser } = useAppContext();
  const navigate = useNavigate();
  
  return (
    <header className="nav-bar">
      <div className="nav-brand">
        <span className="brand-title">Nossa Pelada</span>
      </div>
      <div className="nav-actions">
        <button className="header-btn" onClick={toggleTheme} title="Alternar tema">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {currentUser && (
          <button className="header-btn" onClick={() => navigate('/profile')} title="Meu Perfil" style={{ overflow: 'hidden' }}>
            {currentUser.photoUrl
              ? <img src={currentUser.photoUrl} alt="avatar" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
              : <UserCircle2 size={16} />}
          </button>
        )}
        <button className="header-btn" style={{ color: 'var(--color-danger)' }} onClick={logout} title="Sair">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

function BottomNav() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <nav className="nav-links">
      <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}><Home size={18} /> <span>Início</span></Link>
      <Link to="/players" className={`nav-link ${isActive('/players') ? 'active' : ''}`}><Users size={18} /> <span>Jogadores</span></Link>
      <Link to="/matches" className={`nav-link ${isActive('/matches') ? 'active' : ''}`}><Calendar size={18} /> <span>Peladas</span></Link>
      <Link to="/rankings" className={`nav-link ${isActive('/rankings') ? 'active' : ''}`}><Activity size={18} /> <span>Rankings</span></Link>
      <Link to="/finance" className={`nav-link ${isActive('/finance') ? 'active' : ''}`}><DollarSign size={18} /> <span>Finanças</span></Link>
    </nav>
  );
}

function MainApp() {
  return (
    <>
      <TopBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/matches" element={<MatchList />} />
          <Route path="/matches/:id" element={<MatchDetail />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/courts" element={<Courts />} />
          <Route path="/players" element={<Players />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <BottomNav />
    </>
  );
}

function App() {
  const { currentUser, authLoading } = useAppContext();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  if (authLoading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', gap: '0.75rem',
        background: 'var(--color-bg)'
      }}>
        <Loader size={24} className="spin" style={{ color: 'var(--color-primary)' }} />
        <p className="text-muted" style={{ fontSize: '0.8rem' }}>Carregando...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Public Routes - MatchDetail is key for WhatsApp links */}
          <Route path="/matches/:id" element={
            <>
              <TopBar />
              <main className="main-content"><MatchDetail /></main>
              {currentUser && <BottomNav />}
            </>
          } />

          {/* Protected Routes or Login Flow */}
          <Route path="*" element={
            !currentUser ? (
              authMode === 'login' ? <Login setMode={setAuthMode} /> :
              authMode === 'register' ? <Register setMode={setAuthMode} /> :
              <ForgotPassword setMode={setAuthMode} />
            ) : (
              <MainApp />
            )
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
