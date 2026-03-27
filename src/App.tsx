import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, DollarSign, Activity, LogOut, Sun, Moon } from 'lucide-react';
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
import { useState } from 'react';

function TopBar() {
  const { theme, toggleTheme, logout } = useAppContext();
  
  return (
    <header className="nav-bar">
      <div className="nav-brand">
        <span className="text-gradient brand-title" style={{ textTransform: 'uppercase' }}>Nossa Pelada</span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="theme-toggle" style={{ color: 'var(--color-danger)' }} onClick={logout}>
          <LogOut size={20} />
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
      <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}><Home size={24} /> <span>Início</span></Link>
      <Link to="/players" className={`nav-link ${isActive('/players') ? 'active' : ''}`}><Users size={24} /> <span>Jogadores</span></Link>
      <Link to="/matches" className={`nav-link ${isActive('/matches') ? 'active' : ''}`}><Calendar size={24} /> <span>Peladas</span></Link>
      <Link to="/rankings" className={`nav-link ${isActive('/rankings') ? 'active' : ''}`}><Activity size={24} /> <span>Rankings</span></Link>
      <Link to="/finance" className={`nav-link ${isActive('/finance') ? 'active' : ''}`}><DollarSign size={24} /> <span>Finanças</span></Link>
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
        </Routes>
      </main>
      <BottomNav />
    </>
  );
}

function App() {
  const { currentUser, authLoading } = useAppContext();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  return (
    <Router>
      <div className="app-container" style={{ minHeight: '100vh' }}>
        {authLoading ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', gap: '1rem',
            background: 'var(--color-bg)'
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', animation: 'pulse 1.5s ease-in-out infinite'
            }}>⚽</div>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>Carregando...</p>
            <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.92)} }`}</style>
          </div>
        ) : !currentUser ? (
          authMode === 'login' ? <Login setMode={setAuthMode} /> :
          authMode === 'register' ? <Register setMode={setAuthMode} /> :
          <ForgotPassword setMode={setAuthMode} />
        ) : (
          <MainApp />
        )}
      </div>
    </Router>
  );
}

export default App;
