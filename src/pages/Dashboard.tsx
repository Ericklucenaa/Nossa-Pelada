import { useMemo } from 'react';
import { useAppContext } from '../context/useAppContext';
import { Users, Calendar, Trophy, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getNextMatchDate } from '../utils/format';

export const Dashboard = () => {
  const { matches, users, currentUser } = useAppContext();

  const nextMatch = useMemo(() => {
    if (matches.length === 0) return null;
    const now = new Date();
    return [...matches]
      .map(m => ({ ...m, dynamicDate: getNextMatchDate(m.date, m.isFixed) }))
      .filter(m => new Date(m.dynamicDate) >= now)
      .sort((a, b) => new Date(a.dynamicDate).getTime() - new Date(b.dynamicDate).getTime())[0];
  }, [matches]);

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ users, matches }));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "nossa_pelada_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="dashboard-container" style={{ animation: 'fadeIn 0.5s ease-out', paddingBottom: '2rem' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800 }}>Resumo da Rodada</h1>
          <p className="subtitle" style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem' }}>Seja Bem-vindo, <strong>{currentUser?.name}</strong></p>
        </div>
        <button className="btn-outline" onClick={exportData} style={{ fontSize: '0.85rem', padding: '0.6rem 1.2rem', backdropFilter: 'blur(5px)' }}>Exportar Dados</button>
      </header>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.2rem', marginBottom: '2.5rem' }}>
        <StatCard title="Jogadores" value={users.length.toString()} icon={<Users />} to="/players" />
        <StatCard title="Rankings" value="Geral" icon={<Trophy />} to="/rankings" highlight />
        <StatCard title="Peladas" value={`${matches.length} Jogos`} icon={<Calendar />} to="/matches" />
        <StatCard title="Finanças" value="Fluxo" icon={<Activity />} to="/finance" />
      </div>

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
          <p className="text-muted" style={{ margin: 0 }}>Nenhuma Pelada agendada.</p>
        )}
      </section>
    </div>
  );
};

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
