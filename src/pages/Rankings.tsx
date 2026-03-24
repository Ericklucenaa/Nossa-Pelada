import { useState } from 'react';
import { useAppContext } from '../context/AppDataContext';
import { Trophy, Target, Activity, Shield } from 'lucide-react';

export const Rankings = () => {
  const { users, matches } = useAppContext();
  const [period, setPeriod] = useState<'Geral' | 'Anual' | 'Semanal'>('Geral');

  const getFilteredMatches = () => {
    const now = new Date();
    if (period === 'Semanal') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return matches.filter(m => new Date(m.date) >= oneWeekAgo);
    }
    if (period === 'Anual') {
      return matches.filter(m => new Date(m.date).getFullYear() === now.getFullYear());
    }
    return matches;
  };

  const calculateStats = (userId: string, originalGoals: number, originalAssists: number) => {
    if (period === 'Geral') return { goals: originalGoals, assists: originalAssists };
    
    const periodMatches = getFilteredMatches();
    let g = 0; let a = 0;
    periodMatches.forEach(m => {
      if (m.stats && m.stats[userId]) {
        g += m.stats[userId].goals || 0;
        a += m.stats[userId].assists || 0;
      }
    });
    return { goals: g, assists: a };
  };

  const usersWithStats = users.map(u => ({
    ...u,
    ...calculateStats(u.id, u.goals, u.assists)
  }));

  const topScorers = [...usersWithStats].sort((a,b) => b.goals - a.goals || b.overall - a.overall).slice(0, 5);
  const topAssists = [...usersWithStats].sort((a,b) => b.assists - a.assists || b.overall - a.overall).slice(0, 5);
  const topGoleiros = [...usersWithStats].filter(u => u.position === 'Goleiro').sort((a,b) => b.overall - a.overall).slice(0, 5);
  const topOverall = [...usersWithStats].sort((a,b) => b.overall - a.overall).slice(0, 5);

  return (
    <div className="rankings-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient">Rankings</h1>
        <p className="subtitle text-muted" style={{ marginBottom: '1rem' }}>A nata da nossa pelada.</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn-primary ${period !== 'Geral' ? 'btn-outline' : ''}`} 
             style={{ padding: '0.5rem 1rem', background: period === 'Geral' ? 'var(--color-primary)' : 'transparent', border: period === 'Geral' ? 'none' : '1px solid var(--color-primary)', color: period === 'Geral' ? 'black' : 'var(--color-primary)' }}
            onClick={() => setPeriod('Geral')}
          >
            Geral
          </button>
          <button 
            className={`btn-primary ${period !== 'Anual' ? 'btn-outline' : ''}`} 
            style={{ padding: '0.5rem 1rem', background: period === 'Anual' ? 'var(--color-primary)' : 'transparent', border: period === 'Anual' ? 'none' : '1px solid var(--color-primary)', color: period === 'Anual' ? 'black' : 'var(--color-primary)' }}
            onClick={() => setPeriod('Anual')}
          >
            Anual
          </button>
          <button 
            className={`btn-primary ${period !== 'Semanal' ? 'btn-outline' : ''}`} 
            style={{ padding: '0.5rem 1rem', background: period === 'Semanal' ? 'var(--color-primary)' : 'transparent', border: period === 'Semanal' ? 'none' : '1px solid var(--color-primary)', color: period === 'Semanal' ? 'black' : 'var(--color-primary)' }}
            onClick={() => setPeriod('Semanal')}
          >
            Semanal
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Artilheiros */}
        <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid var(--color-primary)' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}><Trophy /> Artilheiros</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {topScorers.map((u, i) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: i === 0 ? 'var(--color-warning)' : 'var(--text-muted)' }}>{i + 1}</span>
                  <div>
                    <h4 style={{ margin: 0 }}>{u.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.position}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>{u.goals}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gols</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Garçons */}
        <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid var(--color-accent)' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)' }}><Target /> Garçons</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {topAssists.map((u, i) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: i === 0 ? 'var(--color-warning)' : 'var(--text-muted)' }}>{i + 1}</span>
                  <div>
                    <h4 style={{ margin: 0 }}>{u.name}</h4>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>{u.assists}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assists</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Melhores Goleiros */}
        <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid var(--color-secondary)' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-secondary)' }}><Shield /> Melhores Goleiros</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {topGoleiros.map((u, i) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: i === 0 ? 'var(--color-warning)' : 'var(--text-muted)' }}>{i + 1}</span>
                  <div>
                    <h4 style={{ margin: 0 }}>{u.name}</h4>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary)', lineHeight: 1 }}>{u.overall}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>OVR</span>
                </div>
              </div>
            ))}
            {topGoleiros.length === 0 && <p className="text-muted" style={{ textAlign: 'center' }}>Nenhum goleiro registrado.</p>}
          </div>
        </div>

        {/* Melhores OVR */}
        <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid var(--color-warning)' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning)' }}><Activity /> Melhores Jogadores</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {topOverall.map((u, i) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: i === 0 ? 'var(--color-warning)' : 'var(--text-muted)' }}>{i + 1}</span>
                  <div>
                    <h4 style={{ margin: 0 }}>{u.name}</h4>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning)', lineHeight: 1 }}>{u.overall}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>OVR</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
