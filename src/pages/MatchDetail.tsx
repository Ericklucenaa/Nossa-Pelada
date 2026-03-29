import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, BadgeDollarSign, CheckSquare, XSquare, Trash2, Share2 } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import type { MatchPlayer, PaymentStatus, User } from '../types';
import { formatCurrencyBRL, getMonthKey } from '../utils/format';

type MatchTab = 'lista' | 'financeiro' | 'times' | 'jogo';

type PlayerRow = MatchPlayer & {
  user: User;
};

const TEAM_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export const MatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { matches, users, updateMatchPlayer, updateMatch, drawTeams, setMatchStats, swapPlayers, joinMatch, removeMatch, currentUser } = useAppContext();
  const location = useLocation();
  const initialTab = (location.hash.replace('#', '') as MatchTab) || 'lista';
  const [activeTab, setActiveTab] = useState<MatchTab>((['lista','jogo','financeiro','times'] as MatchTab[]).includes(initialTab) ? initialTab : 'lista');
  const [swapModal, setSwapModal] = useState<{ active: boolean; idToSwap: string | null }>({ active: false, idToSwap: null });
  const [addPlayerModal, setAddPlayerModal] = useState(false);
  const [drawOptions, setDrawOptions] = useState({ useMensalista: true, useOverall: true, useArrival: false });

  const match = matches.find((candidate) => candidate.id === id);

  useEffect(() => {
    if (!match) return;
    const params = new URLSearchParams(location.search);
    if (params.get('join') === 'true') {
      if (currentUser) {
        const isAlreadyIn = match.players.some(p => p.userId === currentUser.id);
        if (!isAlreadyIn) {
          joinMatch(match.id, currentUser.id);
        }
        navigate(location.pathname, { replace: true });
      } else {
        // If they are not logged in, we could redirect them to login with a redirect param. 
        // But for now, just sending them to login since they need an account.
        // Usually handled by App.tsx restricting access, but if this is public, it might crash without currentUser.
        // Assuming user must be logged in to reach here.
      }
    }
  }, [location.search, match, currentUser, joinMatch, navigate]);

  if (!match) return <div>Match not found</div>;

  const handleUpdateStatus = (playerId: string, status: MatchPlayer['attendance']) => {
    updateMatchPlayer(match.id, playerId, { attendance: status, team: status === 'Confirmado' ? undefined : null });
  };

  const handleRemoveFromMatch = (playerId: string, playerName: string) => {
    if (!window.confirm(`Remover ${playerName} da pelada?`)) return;
    updateMatch(match.id, {
      players: match.players.filter((p) => p.userId !== playerId),
    });
  };

  const handlePayment = (playerId: string, status: PaymentStatus, isMensalista: boolean) => {
    if (isMensalista) {
      const matchMonth = getMonthKey(match.date);
      matches
        .filter((candidate) => getMonthKey(candidate.date) === matchMonth)
        .forEach((candidate) => {
          const player = candidate.players.find(
            (entry) => entry.userId === playerId && entry.attendance === 'Confirmado' && entry.paymentType === 'Mensalista',
          );
          if (player) {
            updateMatchPlayer(candidate.id, playerId, { paymentStatus: status });
          }
        });
      return;
    }

    updateMatchPlayer(match.id, playerId, { paymentStatus: status });
  };

  const playersFullData: PlayerRow[] = match.players
    .map((player) => {
      const user = users.find((candidate) => candidate.id === player.userId);
      return user ? { ...player, user } : null;
    })
    .filter((entry): entry is PlayerRow => Boolean(entry))
    .sort((a, b) => a.user.name.localeCompare(b.user.name));

  const playingPlayers = playersFullData.filter((player) => player.team || player.attendance === 'Confirmado');
  const confirmedCount = playersFullData.filter((player) => player.attendance === 'Confirmado').length;
  const subsCount = playersFullData.filter((player) => player.attendance === 'De Fora').length;

  const financeRows = playersFullData.filter((player) => player.attendance === 'Confirmado');
  const totalPaid = financeRows
    .filter((player) => player.paymentStatus === 'Pago')
    .reduce((sum, player) => sum + (player.paymentType === 'Mensalista' ? match.valorMensal ?? 0 : match.valorAvulso ?? 0), 0);
  const totalPending = financeRows
    .filter((player) => player.paymentStatus === 'Pendente')
    .reduce((sum, player) => sum + (player.paymentType === 'Mensalista' ? match.valorMensal ?? 0 : match.valorAvulso ?? 0), 0);

  const confirmSwap = (playerInId: string) => {
    if (swapModal.idToSwap) {
      swapPlayers(match.id, swapModal.idToSwap, playerInId);
    }
    setSwapModal({ active: false, idToSwap: null });
  };

  const handleClearList = () => {
    if (window.confirm('Esvaziar lista de presença? Isso removerá todos os jogadores registrados nesta pelada.')) {
      updateMatch(match.id, { players: [] });
    }
  };

  const handleDeleteMatch = () => {
    if (window.confirm('Tem certeza que deseja excluir esta pelada?')) {
      removeMatch(match.id);
      navigate('/matches', { replace: true });
    }
  };

  const handleShare = () => {
    const link = `${window.location.origin}/match/${match.id}?join=true`;
    const text = `⚽ *CONVOCAÇÃO: ${match.name.toUpperCase()}* ⚽\n\nFala galera! Clique no link abaixo para confirmar sua presença na pelada:\n\n👉 ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyToClipboard = () => {
    const link = `${window.location.origin}/match/${match.id}?join=true`;
    navigator.clipboard.writeText(link);
    window.alert('Link copiado para a área de transferência! Cole no WhatsApp.');
  };

  return (
    <div className="match-detail" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="text-gradient" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', marginBottom: '0.25rem', wordBreak: 'break-word' }}>{match.name}</h1>
            <p className="subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {new Date(match.date).toLocaleDateString('pt-BR')} das {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} às {match.endTime ? new Date(match.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} | Confirmados: {confirmedCount} | Reservas: {subsCount}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.5rem 0.8rem' }} onClick={() => setAddPlayerModal(true)}>+ Jogador</button>
            <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.5rem 0.8rem', borderColor: '#25D366', color: '#25D366' }} onClick={handleShare}>
              <Share2 size={14} style={{ marginRight: '4px' }}/> Whats
            </button>
            <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.5rem 0.8rem' }} onClick={handleCopyToClipboard} title="Copiar Link">
              📋 Copiar Link
            </button>
            <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.5rem 0.8rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={handleDeleteMatch}>Excluir</button>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--color-surface-light)', padding: '0.375rem', borderRadius: '14px', width: 'fit-content' }}>
        {([
          { key: 'lista',      icon: '📋', label: 'Lista'      },
          { key: 'times',      icon: '🛡️', label: 'Times'      },
          { key: 'jogo',       icon: '⚽', label: 'Jogo'       },
          { key: 'financeiro', icon: '💰', label: 'Financeiro' },
        ] as { key: MatchTab; icon: string; label: string }[]).map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: '10px',
              background: activeTab === key
                ? 'linear-gradient(135deg, var(--color-primary) 0%, #2ecc71 100%)'
                : 'transparent',
              color: activeTab === key ? '#0a0a0a' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.82rem',
              letterSpacing: '0.02em',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: activeTab === key ? '0 2px 12px rgba(69,242,72,0.35)' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{icon}</span> {label}
          </button>
        ))}
      </div>

      <div className="tab-content glass-panel" style={{ padding: '1.5rem', minHeight: '60vh', position: 'relative' }}>
        {activeTab === 'lista' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', gap: '1rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>Lista de Presença</h2>
              <button 
                className="btn-outline" 
                style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem', borderColor: 'var(--color-warning)', color: 'var(--color-warning)', textTransform: 'uppercase', letterSpacing: '0.5px' }} 
                onClick={handleClearList}
              >
                Limpar Todos
              </button>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {playersFullData.map((player, index) => (
                <div key={player.userId} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: index % 2 === 0 ? 'var(--color-surface-light)' : 'transparent', borderRadius: 'var(--radius-sm)', borderBottom: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>

                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.user.name} <span style={{ color: 'var(--color-primary)', fontSize: '0.75rem', marginLeft: '4px' }}>{player.user.position}</span> <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)'}}>⭐ {player.user.overall || 50}</span></h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: player.attendance === 'Confirmado' ? 'var(--color-primary)' : 'var(--color-danger)' }}>{player.attendance}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
                    <button onClick={() => handleUpdateStatus(player.userId, 'Confirmado')} title="Confirmado" style={{ background: 'transparent', color: player.attendance === 'Confirmado' ? 'var(--color-primary)' : 'var(--text-muted)', padding: '4px' }}><CheckSquare size={18} /></button>
                    <button onClick={() => handleUpdateStatus(player.userId, 'Ausente')} title="Ausente" style={{ background: 'transparent', color: player.attendance === 'Ausente' ? 'var(--color-danger)' : 'var(--text-muted)', padding: '4px' }}><XSquare size={18} /></button>
                    <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 2px' }} />
                    <button
                      onClick={() => handleRemoveFromMatch(player.userId, player.user.name)}
                      title="Remover da pelada"
                      style={{ background: 'transparent', color: 'var(--color-danger)', opacity: 0.7, padding: '4px' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'financeiro' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Status Financeiro</h2>
              <div style={{ textAlign: 'right', background: 'var(--color-surface-light)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>Recebido: {formatCurrencyBRL(totalPaid)}</span>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-warning)', fontWeight: 'bold' }}>Pendente: {formatCurrencyBRL(totalPending)}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {financeRows
                .filter(p => !(p.paymentType === 'Mensalista' && p.paymentStatus === 'Pago')) 
                .map((player, index) => {
                const playerCost = player.paymentType === 'Mensalista' ? match.valorMensal ?? 0 : match.valorAvulso ?? 0;
                return (
                  <div key={player.userId} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: index % 2 === 0 ? 'var(--color-surface-light)' : 'transparent', borderRadius: 'var(--radius-sm)', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{player.user.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {player.paymentType} • {formatCurrencyBRL(playerCost)} • <span style={{ color: player.paymentStatus === 'Pago' ? 'var(--color-primary)' : 'var(--color-warning)', fontWeight: 700 }}>{player.paymentStatus}</span>
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {player.paymentStatus === 'Pago' ? (
                        <button style={{ background: 'transparent', color: 'var(--color-primary)' }} onClick={() => handlePayment(player.userId, 'Pendente', player.paymentType === 'Mensalista')} title="Marcar como Pendente">
                          <BadgeDollarSign size={20} />
                        </button>
                      ) : (
                        <button style={{ background: 'transparent', color: 'var(--color-warning)' }} onClick={() => handlePayment(player.userId, 'Pago', player.paymentType === 'Mensalista')} title="Marcar como Pago">
                          <BadgeDollarSign size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'times' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}><ShieldAlert /> Sorteio Inteligente</h2>
              <button className="btn-primary" onClick={() => drawTeams(match.id, drawOptions)}>Sortear Times</button>
            </div>

            <div style={{ background: 'var(--color-surface-light)', padding: '1.2rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', border: '1px solid var(--border-color)' }}>
              <span style={{ width: '100%', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Prioridades do Sorteio (Multi-seleção)</span>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: drawOptions.useMensalista ? 1 : 0.6, transition: 'opacity 0.2s' }}>
                <input type="checkbox" checked={drawOptions.useMensalista} onChange={(e) => setDrawOptions(p => ({ ...p, useMensalista: e.target.checked }))} style={{ accentColor: 'var(--color-primary)', width: '18px', height: '18px', cursor: 'pointer' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Tiers (Mensalista/Avulso)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: drawOptions.useOverall ? 1 : 0.6, transition: 'opacity 0.2s' }}>
                <input type="checkbox" checked={drawOptions.useOverall} onChange={(e) => setDrawOptions(p => ({ ...p, useOverall: e.target.checked }))} style={{ accentColor: 'var(--color-primary)', width: '18px', height: '18px', cursor: 'pointer' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Equilibrar Overall</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: drawOptions.useArrival ? 1 : 0.6, transition: 'opacity 0.2s' }}>
                <input type="checkbox" checked={drawOptions.useArrival} onChange={(e) => setDrawOptions(p => ({ ...p, useArrival: e.target.checked }))} style={{ accentColor: 'var(--color-primary)', width: '18px', height: '18px', cursor: 'pointer' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Ordem de Chegada</span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
              {TEAM_NAMES.filter((teamName) => playersFullData.some((player) => player.team === teamName)).map((teamName, index) => {
                const teamPlayers = playersFullData.filter((player) => player.team === teamName);
                const ovrAvg = teamPlayers.length ? Math.round(teamPlayers.reduce((sum, p) => sum + (p.user.overall || 50), 0) / teamPlayers.length) : '--';
                return (
                  <div key={teamName} style={{ background: index % 2 === 0 ? 'rgba(69, 242, 72, 0.05)' : 'rgba(102, 252, 241, 0.05)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: index % 2 === 0 ? '1px solid rgba(69, 242, 72, 0.2)' : '1px solid rgba(102, 252, 241, 0.2)' }}>
                    <h3 style={{ marginBottom: '1rem', color: index % 2 === 0 ? 'var(--color-primary)' : 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield /> Time {teamName} (OVR {ovrAvg})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {teamPlayers.map((player) => (
                        <div key={player.userId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <span>{player.user.name} {player.user.position === 'Goleiro' && '🧤'}</span>
                          <span style={{ fontWeight: 800 }}>{player.user.position}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {playersFullData.every((player) => !player.team) && <p className="text-muted text-center" style={{ marginTop: '2rem' }}>Nenhum time sorteado ainda.</p>}
            </div>
          </div>
        )}

        {activeTab === 'jogo' && (
          <div>
            <h2 style={{ margin: 0, marginBottom: '1.5rem' }}>Estatísticas da Pelada</h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {playingPlayers.map((player, index) => {
                const goals = match.stats?.[player.userId]?.goals || 0;
                const assists = match.stats?.[player.userId]?.assists || 0;
                return (
                  <div key={player.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: index % 2 === 0 ? 'var(--color-surface-light)' : 'transparent', borderRadius: 'var(--radius-sm)', borderBottom: '1px solid var(--border-color)' }}>
                    {/* Name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.user.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{player.user.position}</p>
                    </div>
                    {/* Goals */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase' }}>⚽ Gols</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => setMatchStats(match.id, player.userId, Math.max(0, goals - 1), assists)}
                          style={{ background: 'transparent', color: 'var(--text-muted)', padding: '2px 6px', fontSize: '1rem', lineHeight: 1 }}
                        >−</button>
                        <input
                          type="number" min="0" value={goals}
                          onChange={(e) => setMatchStats(match.id, player.userId, Math.max(0, parseInt(e.target.value) || 0), assists)}
                          style={{ width: '42px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700, padding: '2px 0' }}
                        />
                        <button onClick={() => setMatchStats(match.id, player.userId, goals + 1, assists)} style={{ background: 'transparent', color: 'var(--color-primary)', padding: '2px 6px', fontSize: '1rem', lineHeight: 1 }}>+</button>
                      </div>
                    </div>
                    {/* Assists */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-accent)', fontWeight: 600, textTransform: 'uppercase' }}>🎯 Assists</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => setMatchStats(match.id, player.userId, goals, Math.max(0, assists - 1))}
                          style={{ background: 'transparent', color: 'var(--text-muted)', padding: '2px 6px', fontSize: '1rem', lineHeight: 1 }}
                        >−</button>
                        <input
                          type="number" min="0" value={assists}
                          onChange={(e) => setMatchStats(match.id, player.userId, goals, Math.max(0, parseInt(e.target.value) || 0))}
                          style={{ width: '42px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700, padding: '2px 0' }}
                        />
                        <button onClick={() => setMatchStats(match.id, player.userId, goals, assists + 1)} style={{ background: 'transparent', color: 'var(--color-accent)', padding: '2px 6px', fontSize: '1rem', lineHeight: 1 }}>+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {swapModal.active && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Quitar Jogador</h3>
              <p className="text-muted" style={{ marginBottom: '2rem' }}>Escolha quem vai entrar no lugar deste jogador (Tampinha).</p>

              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                {playersFullData.filter((player) => player.attendance === 'De Fora').map((reserve) => (
                  <button key={reserve.userId} className="btn-outline" onClick={() => confirmSwap(reserve.userId)} style={{ justifyContent: 'space-between', padding: '1rem', width: '100%' }}>
                    {reserve.user.name} <span style={{ color: 'var(--text-muted)' }}>{reserve.user.position}</span>
                  </button>
                ))}
                {playersFullData.filter((player) => player.attendance === 'De Fora').length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--color-warning)' }}>Ninguém de Fora no momento.</p>
                )}
              </div>

              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setSwapModal({ active: false, idToSwap: null })}>Cancelar</button>
            </div>
          </div>
        )}

        {addPlayerModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
            <div className="glass-panel" style={{ width: '95%', maxWidth: '650px', padding: '2.5rem', maxHeight: '85vh', overflowY: 'auto', background: 'var(--color-surface)', border: '1px solid var(--border-color)', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
              <h3 style={{ marginBottom: '0.8rem', fontSize: '1.8rem', color: 'var(--color-primary)', fontWeight: 800 }}>Adicionar à Pelada</h3>
              <p className="text-muted" style={{ marginBottom: '2.2rem', fontSize: '1rem' }}>Selecione os jogadores abaixo para incluir na lista de presença.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {users.filter((user) => !match.players.some((player) => player.userId === user.id)).map((user) => (
                  <button 
                    key={user.id} 
                    className="btn-outline" 
                    onClick={() => joinMatch(match.id, user.id)} 
                    style={{ 
                      justifyContent: 'space-between', 
                      padding: '1.2rem', 
                      width: '100%', 
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--color-surface-light)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user.name}</span>
                      <span style={{ display: 'block', margin: '4px 0 0', fontSize: '0.75rem', color: user.subscriptionType === 'Mensalista' ? 'var(--color-primary)' : 'var(--color-accent)', fontWeight: 800 }}>
                        {user.subscriptionType.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>{user.position}</span>
                  </button>
                ))}
                {users.filter((user) => !match.players.some((player) => player.userId === user.id)).length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--color-warning)' }}>Todos os reservas já foram chamados!</p>
                )}
              </div>

              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setAddPlayerModal(false)}>Fechar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
