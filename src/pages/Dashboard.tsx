import { useAppContext } from '../context/AppDataContext';
import { Users, Calendar, Trophy, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { matches, users, currentUser } = useAppContext();

  const totalGols = users.reduce((acc, user) => acc + (user.goals || 0), 0);

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
    <div className="dashboard-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient">Resumo da Rodada</h1>
          <p className="subtitle" style={{ margin: 0 }}>Bem-vindo de volta, {currentUser?.name}</p>
        </div>
        <button className="btn-primary" onClick={exportData} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>Exportar</button>
      </header>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard title="Jogadores" value={users.length.toString()} icon={<Users />} to="/players" />
        <StatCard title="Estatísticas" value={`${totalGols} Gols`} icon={<Trophy />} to="/rankings" />
        <StatCard title="Histórico da Pelada" value={`${matches.length} Jogos`} icon={<Calendar />} to="/matches" />
        <StatCard title="Finanças" value="Controle" icon={<Activity />} to="/finance" highlight />
      </div>

      <section className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Sua Próxima Pelada</h2>
        {matches.length > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>{matches[0].name}</h3>
              <p className="text-muted">{new Date(matches[0].date).toLocaleDateString()}</p>
            </div>
            <Link to={`/matches/${matches[0].id}`} className="btn-primary">Ver Detalhes</Link>
          </div>
        ) : (
          <p className="text-muted">Nenhuma Pelada agendada.</p>
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
