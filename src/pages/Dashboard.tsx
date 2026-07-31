import { useMemo } from 'react';
import { useAppContext } from '../context/useAppContext';
import { Users, Calendar, Trophy, Activity, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getNextMatchDate } from '../utils/format';

export const Dashboard = () => {
  const { matches, users, currentUser, courts } = useAppContext();

  const nextMatch = useMemo(() => {
    if (matches.length === 0) return null;
    const now = new Date();
    return [...matches]
      .map(m => ({ ...m, dynamicDate: getNextMatchDate(m.date, m.isFixed) }))
      .filter(m => new Date(m.dynamicDate) >= now)
      .sort((a, b) => new Date(a.dynamicDate).getTime() - new Date(b.dynamicDate).getTime())[0];
  }, [matches]);

  const playerMatches = useMemo(() => {
    if (!currentUser) return 0;
    return matches.filter(m => m.players.some(p => p.userId === currentUser.id && p.attendance === 'Confirmado')).length;
  }, [matches, currentUser]);

  return (
    <div className="dashboard-container" style={{ animation: 'fadeIn 0.5s ease-out', paddingBottom: '2rem' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800 }}>Resumo da Rodada</h1>
          <p className="subtitle" style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem' }}>Seja Bem-vindo, <strong>{currentUser?.name}</strong></p>
        </div>
      </header>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.2rem', marginBottom: '2.5rem' }}>
        <StatCard title="Jogadores" value={users.length.toString()} icon={<Users />} to="/players" />
        <StatCard title="Rankings" value="Geral" icon={<Trophy />} to="/rankings" highlight />
        <StatCard title="Peladas" value={`${matches.length} Jogos`} icon={<Calendar />} to="/matches" />
        <StatCard title="Finanças" value="Fluxo" icon={<Activity />} to="/finance" />
        <StatCard title="Quadras" value={`${courts.length}`} icon={<MapPin />} to="/courts" />
      </div>

      {currentUser && (
        <section className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderLeft: '5px solid var(--color-primary)', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 700 }}>Suas Stats</p>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.9rem', fontWeight: 600 }}>{currentUser.name}</p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Pill emoji="⚽" label="Gols" value={currentUser.goals} />
            <Pill emoji="🎯" label="Assists" value={currentUser.assists} />
            <Pill emoji="📅" label="Jogos" value={playerMatches} />
            <Pill emoji="⭐" label="Overall" value={currentUser.overall || 50} />
          </div>
        </section>
      )}

      <section className="glass-panel" style={{ padding: '1.8rem', borderLeft: '5px solid var(--color-accent)' }}>
        <h2 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📅 Sua Próxima Pelada</h2>
        {nextMatch ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.4rem' }}>{nextMatch.name}</h3>
              <p className="text-muted" style={{ margin: 0 }}>{new Date(nextMatch.dynamicDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <Link to={`/matches/${nextMatch.id}`} className="btn-primary">Ver Detalhes</Link>
          </div>
        ) : (
          <p className="text-muted" style={{ margin: 0 }}>Nenhuma Pelada agendada. <Link to="/matches" style={{ color: 'var(--color-primary)' }}>Criar uma!</Link></p>
        )}
      </section>
    </div>
  );
};

const Pill = ({ emoji, label, value }: { emoji: string; label: string; value: number }) => (
  <div style={{ textAlign: 'center' }}>
    <span style={{ display: 'block', fontSize: '1.4rem' }}>{emoji}</span>
    <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 800, lineHeight: 1 }}>{value}</span>
    <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
  </div>
);

const StatCard = ({ title, value, icon, to, highlight = false }: { title: string, value: string, icon: React.ReactNode, to?: string, highlight?: boolean }) => {
  const CardContent = (
    <div className={`glass-panel stat-card ${highlight ? 'highlight' : ''}`} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: highlight ? '1px solid var(--color-primary)' : '', height: '100%', cursor: to ? 'pointer' : 'default', transition: 'transform 0.2s', textDecoration: 'none', color: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: highlight ? 'var(--color-primary)' : 'var(--text-muted)' }}>
        {icon}
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{title}</span>
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
    </div>
  );

  return to ? <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>{CardContent}</Link> : CardContent;
};
