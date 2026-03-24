import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, DollarSign, Activity, LogOut, Sun, Moon, Settings } from 'lucide-react';
import { useAppContext } from './context/AppDataContext';
import './App.css';

import { Dashboard } from './pages/Dashboard';
import { MatchList } from './pages/MatchList';
import { MatchDetail } from './pages/MatchDetail';
import { Profile } from './pages/Profile';
import { Finance } from './pages/Finance';
import { Courts } from './pages/Courts';
import { Rankings } from './pages/Rankings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Players } from './pages/Players';
import { useState } from 'react';

function TopBar() {
  const { theme, toggleTheme, logout } = useAppContext();
  
  return (
    <header className="nav-bar">
      <div className="nav-brand">
        <span className="text-gradient brand-title" style={{ textTransform: 'uppercase' }}>Nossa Pelada</span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Link to="/profile" className="theme-toggle" style={{ color: 'var(--color-accent)' }}>
          <Settings size={20} />
        </Link>
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
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <BottomNav />
    </>
  );
}

function App() {
  const { currentUser } = useAppContext();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  return (
    <Router>
      <div className="app-container" style={{ minHeight: '100vh' }}>
        {!currentUser ? (
          authMode === 'login' ? <Login setMode={setAuthMode} /> : <Register setMode={setAuthMode} />
        ) : (
          <MainApp />
        )}
      </div>
    </Router>
  );
}

export default App;
