import { useMemo } from 'react';
import { useAppContext } from '../context/useAppContext';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <header className="page-header">
        <h1>Visão Geral</h1>
      </header>

      {/* Quick Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        <Link to="/matches" className="panel" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Peladas</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>{matches.length}</span>
        </Link>
        <Link to="/players" className="panel" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Jogadores</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>{users.length}</span>
        </Link>
        <Link to="/courts" className="panel" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Quadras</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>{courts.length}</span>
        </Link>
        <Link to="/rankings" className="panel" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Rankings</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.2 }}>Geral</span>
        </Link>
      </div>

      {/* Next Match Section */}
      <section className="panel" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 700 }}>
            Próxima Pelada
          </span>
          {nextMatch && (
            <span className="badge badge-primary">Agendada</span>
          )}
        </div>

        {nextMatch ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nextMatch.name}
              </h3>
              <p className="text-muted" style={{ margin: '2px 0 0', fontSize: '12px' }}>
                {new Date(nextMatch.dynamicDate).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} • {new Date(nextMatch.dynamicDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <Link to={`/matches/${nextMatch.id}`} className="btn-primary" style={{ flexShrink: 0 }}>
              Acessar
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>Nenhuma pelada agendada.</p>
            <Link to="/matches" className="btn-outline" style={{ height: '30px', fontSize: '12px', padding: '0 10px' }}>
              Criar pelada
            </Link>
          </div>
        )}
      </section>

      {/* User Stats Section */}
      {currentUser && (
        <section className="panel" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 700 }}>
                Suas Estatísticas
              </span>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>{currentUser.name}</p>
            </div>
            <Link to="/profile" className="btn-ghost" style={{ height: '28px', fontSize: '12px', padding: '0 6px' }}>
              Ver perfil
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>{currentUser.goals}</span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>Gols</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>{currentUser.assists}</span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>Assists</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>{playerMatches}</span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>Jogos</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.2 }}>{currentUser.overall || 50}</span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>Overall</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
