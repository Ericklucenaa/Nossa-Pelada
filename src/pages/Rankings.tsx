import { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { Trophy, Target } from 'lucide-react';

export const Rankings = () => {
  const { users, matches } = useAppContext();
  const [period, setPeriod] = useState<'Geral' | 'Anual' | 'Semanal'>('Semanal');

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

  const topScorers = [...usersWithStats].sort((a,b) => b.goals - a.goals || a.name.localeCompare(b.name)).slice(0, 5);
  const topAssists = [...usersWithStats].sort((a,b) => b.assists - a.assists || a.name.localeCompare(b.name)).slice(0, 5);


  return (
    <div className="rankings-container" style={{ animation: 'fadeIn 0.5s ease-out', paddingBottom: '3.5rem' }}>
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient" style={{ fontWeight: 800, fontSize: '2.4rem' }}>Rankings</h1>
        <p className="subtitle text-muted" style={{ marginBottom: '1.2rem', fontSize: '1rem' }}>Desempenho da temporada.</p>
        
        {/* Period Selector - Premium Floating Style */}
        <div style={{ 
          display: 'flex', 
          width: '100%',
          overflowX: 'auto',
          paddingBottom: '0.8rem',
          scrollbarWidth: 'none',
        }}>
          <div style={{ 
            display: 'flex', 
            background: 'var(--color-surface)', 
            padding: '4px', 
            borderRadius: 'var(--radius-lg)', 
            gap: '4px',
            boxShadow: 'var(--shadow-surface)',
            border: '1px solid var(--border-color)',
            minWidth: 'fit-content'
          }}>
            {(['Semanal', 'Anual', 'Geral'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: period === p ? 'var(--color-primary)' : 'transparent',
                  color: period === p ? '#000' : 'var(--text-muted)',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  whiteSpace: 'nowrap'
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="rankings-grid">
        
        {/* Artilheiros */}
        <RankingCard 
          title="Artilheiros" 
          icon={<Trophy size={22} />} 
          color="var(--color-primary)" 
          data={topScorers} 
          valKey="goals" 
          label="Gols" 
        />

        {/* Garçons */}
        <RankingCard 
          title="Garçons" 
          icon={<Target size={22} />} 
          color="var(--color-accent)" 
          data={topAssists} 
          valKey="assists" 
          label="Assists" 
        />

        
      </div>
    </div>
  );
};

const RankingCard = ({ title, icon, color, data, valKey, label }: { title: string, icon: React.ReactNode, color: string, data: any[], valKey: string, label: string }) => (
  <div className="glass-panel fadeIn" style={{ borderTop: `4px solid ${color}`, padding: '1.5rem', borderRadius: 'var(--radius-lg)', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle at top right, ${color}11, transparent 70%)`, pointerEvents: 'none' }}></div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.8rem' }}>
      <div style={{ background: `${color}15`, color: color, padding: '10px', borderRadius: '12px', display: 'flex' }}>
        {icon}
      </div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{title}</h2>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      {data.map((u, i) => (
        <RankingItem 
          key={u.id} 
          rank={i + 1} 
          name={u.name} 
          photoUrl={u.photoUrl} 
          value={u[valKey]} 
          label={label} 
          color={color} 
        />
      ))}
      {data.length === 0 && (
        <p className="text-muted" style={{ textAlign: 'center', padding: '1rem', fontSize: '0.9rem' }}>Nenhum dado registrado.</p>
      )}
    </div>
  </div>
);

const RankingItem = ({ rank, name, photoUrl, value, label, color }: { rank: number, name: string, photoUrl?: string, value: number, label: string, color: string }) => {
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;
  
  const getRankColor = () => {
    if (isFirst) return '#FFD700'; // Gold
    if (isSecond) return '#C0C0C0'; // Silver
    if (isThird) return '#CD7F32'; // Bronze
    return 'var(--text-muted)';
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '12px', 
      background: isFirst ? `${color}08` : 'transparent',
      borderRadius: 'var(--radius-md)',
      border: isFirst ? `1px solid ${color}22` : 'none'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0, flex: 1 }}>
        {/* Rank Number or Medal */}
        <div style={{ 
          minWidth: '28px', 
          height: '28px', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontWeight: 900,
          background: isFirst || isSecond || isThird ? getRankColor() : 'rgba(255,255,255,0.05)',
          color: isFirst || isSecond || isThird ? '#000' : 'var(--text-muted)',
          fontSize: '0.85rem'
        }}>
          {rank}
        </div>

        {/* Avatar */}
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-surface-light)', flexShrink: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {photoUrl ? (
            <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>
              {name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: isFirst ? 800 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>{name}</h4>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '0.5rem' }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 900, color: color, lineHeight: 1, textShadow: isFirst ? `0 0 10px ${color}33` : 'none' }}>{value}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>{label}</span>
      </div>
    </div>
  );
};
