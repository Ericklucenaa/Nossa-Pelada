import { useState } from 'react';
import { useAppContext } from '../context/useAppContext';

export const Rankings = () => {
  const { users, matches } = useAppContext();
  const [period, setPeriod] = useState<'Semanal' | 'Anual' | 'Geral'>('Semanal');

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

  const topScorers = [...usersWithStats].sort((a,b) => b.goals - a.goals || a.name.localeCompare(b.name)).slice(0, 10);
  const topAssists = [...usersWithStats].sort((a,b) => b.assists - a.assists || a.name.localeCompare(b.name)).slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <header className="page-header">
        <h1>Rankings</h1>
      </header>

      {/* Period Selector */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        {(['Semanal', 'Anual', 'Geral'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              flex: 1,
              height: '30px',
              borderRadius: 'var(--radius-sm)',
              background: period === p ? 'var(--color-primary)' : 'transparent',
              color: period === p ? '#ffffff' : 'var(--text-muted)',
              fontWeight: period === p ? 600 : 500,
              fontSize: '12px',
              transition: 'background-color 0.15s ease',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Artilheiros */}
        <RankingSection
          title="Artilheiros"
          data={topScorers}
          valKey="goals"
          unitLabel="gols"
        />

        {/* Garçons */}
        <RankingSection
          title="Assistências"
          data={topAssists}
          valKey="assists"
          unitLabel="assists"
        />
      </div>
    </div>
  );
};

type RankUser = { id: string; name: string; photoUrl?: string; goals: number; assists: number };

const RankingSection = ({
  title,
  data,
  valKey,
  unitLabel,
}: {
  title: string;
  data: RankUser[];
  valKey: keyof RankUser;
  unitLabel: string;
}) => (
  <div className="panel" style={{ padding: '12px 14px' }}>
    <h2 className="section-title" style={{ marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
      {title}
    </h2>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {data.map((u, i) => {
        const val = u[valKey] as number;
        return (
          <div
            key={u.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              background: i === 0 ? 'var(--color-surface-hover)' : 'transparent',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
              <span style={{ width: '18px', fontSize: '12px', fontWeight: i < 3 ? 700 : 500, color: i < 3 ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                {i + 1}º
              </span>

              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--color-surface-hover)', flexShrink: 0, overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>
                {u.photoUrl ? (
                  <img src={u.photoUrl} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  u.name.substring(0, 2).toUpperCase()
                )}
              </div>

              <span style={{ fontWeight: i === 0 ? 600 : 500, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.name}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{val}</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{unitLabel}</span>
            </div>
          </div>
        );
      })}

      {data.length === 0 && (
        <p className="text-muted" style={{ textAlign: 'center', padding: '16px 0', margin: 0, fontSize: '12px' }}>
          Nenhum registro no período.
        </p>
      )}
    </div>
  </div>
);
