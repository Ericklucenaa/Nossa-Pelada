import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Shield, ShieldAlert, BadgeDollarSign, CheckSquare, XSquare, MinusSquare, RefreshCw, Trash2 } from 'lucide-react';
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
  const { matches, users, updateMatchPlayer, updateMatch, drawTeams, setMatchStats, swapPlayers, joinMatch, removeMatch } = useAppContext();
  const location = useLocation();
  const initialTab = (location.hash.replace('#', '') as MatchTab) || 'lista';
  const [activeTab, setActiveTab] = useState<MatchTab>((['lista','jogo','financeiro','times'] as MatchTab[]).includes(initialTab) ? initialTab : 'lista');
  const [swapModal, setSwapModal] = useState<{ active: boolean; idToSwap: string | null }>({ active: false, idToSwap: null });
  const [addPlayerModal, setAddPlayerModal] = useState(false);

  const match = matches.find((candidate) => candidate.id === id);
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
    .sort((a, b) => b.user.overall - a.user.overall);

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

  const handleDeleteMatch = () => {
    if (window.confirm('Tem certeza que deseja excluir esta pelada?')) {
      removeMatch(match.id);
      navigate('/matches', { replace: true });
    }
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
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }} onClick={() => setAddPlayerModal(true)}>+ Jogador</button>
            <button className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={handleDeleteMatch}>Remover</button>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--color-surface-light)', padding: '0.375rem', borderRadius: '14px', width: 'fit-content' }}>
        {([
          { key: 'lista',      icon: '📋', label: 'Lista'      },
          { key: 'times',      icon: '🛡️', label: 'Times'      },
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Lista de Presença</h2>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {playersFullData.map((player, index) => (
                <div key={player.userId} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: index % 2 === 0 ? 'var(--color-surface-light)' : 'transparent', borderRadius: 'var(--radius-sm)', borderBottom: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                    <div style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {player.user.overall}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.user.name} <span style={{ color: 'var(--color-primary)', fontSize: '0.75rem' }}>{player.user.position}</span></h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: player.attendance === 'Confirmado' ? 'var(--color-primary)' : player.attendance === 'Pendente' ? 'var(--color-warning)' : player.attendance === 'De Fora' ? 'var(--color-accent)' : 'var(--color-danger)' }}>{player.attendance}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
                    <button onClick={() => handleUpdateStatus(player.userId, 'Confirmado')} title="Confirmado" style={{ background: 'transparent', color: player.attendance === 'Confirmado' ? 'var(--color-primary)' : 'var(--text-muted)', padding: '4px' }}><CheckSquare size={18} /></button>
                    <button onClick={() => handleUpdateStatus(player.userId, 'De Fora')} title="De Fora" style={{ background: 'transparent', color: player.attendance === 'De Fora' ? 'var(--color-accent)' : 'var(--text-muted)', padding: '4px' }}><RefreshCw size={18} /></button>
                    <button onClick={() => handleUpdateStatus(player.userId, 'Pendente')} title="Pendente" style={{ background: 'transparent', color: player.attendance === 'Pendente' ? 'var(--color-warning)' : 'var(--text-muted)', padding: '4px' }}><MinusSquare size={18} /></button>
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
              {financeRows.map((player, index) => {
                const playerCost = player.paymentType === 'Mensalista' ? match.valorMensal ?? 0 : match.valorAvulso ?? 0;
                return (
                  <div key={player.userId} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: index % 2 === 0 ? 'var(--color-surface-light)' : 'transparent', borderRadius: 'var(--radius-sm)', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{player.user.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {player.paymentType} • {formatCurrencyBRL(playerCost)} • {player.paymentStatus}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {player.paymentStatus === 'Pago' ? (
                        <button style={{ background: 'transparent', color: 'var(--color-warning)' }} onClick={() => handlePayment(player.userId, 'Pendente', player.paymentType === 'Mensalista')}>
                          <BadgeDollarSign size={20} />
                        </button>
                      ) : (
                        <button style={{ background: 'transparent', color: 'var(--color-primary)' }} onClick={() => handlePayment(player.userId, 'Pago', player.paymentType === 'Mensalista')}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldAlert /> Sorteio Inteligente</h2>
              <button className="btn-primary" onClick={() => drawTeams(match.id)}>Sortear Times</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
              {TEAM_NAMES.filter((teamName) => playersFullData.some((player) => player.team === teamName)).map((teamName, index) => {
                const teamPlayers = playersFullData.filter((player) => player.team === teamName);
                const ovrVal = teamPlayers.length ? Math.round(teamPlayers.reduce((acc, player) => acc + player.user.overall, 0) / teamPlayers.length) : 0;
                return (
                  <div key={teamName} style={{ background: index % 2 === 0 ? 'rgba(69, 242, 72, 0.05)' : 'rgba(102, 252, 241, 0.05)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: index % 2 === 0 ? '1px solid rgba(69, 242, 72, 0.2)' : '1px solid rgba(102, 252, 241, 0.2)' }}>
                    <h3 style={{ marginBottom: '1rem', color: index % 2 === 0 ? 'var(--color-primary)' : 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield /> Time {teamName} (OVR {ovrVal})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {teamPlayers.map((player) => (
                        <div key={player.userId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <span>{player.user.name} {player.user.position === 'Goleiro' && '🧤'}</span>
                          <span style={{ fontWeight: 800 }}>{player.user.overall}</span>
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
                    {reserve.user.name} <span style={{ color: 'var(--color-accent)' }}>OVR {reserve.user.overall}</span>
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
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ marginBottom: '1rem' }}>Adicionar à Pelada</h3>
              <p className="text-muted" style={{ marginBottom: '2rem' }}>Escolha jogadores do sistema.</p>

              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                {users.filter((user) => !match.players.some((player) => player.userId === user.id)).map((user) => (
                  <button key={user.id} className="btn-outline" onClick={() => { joinMatch(match.id, user.id); setAddPlayerModal(false); }} style={{ justifyContent: 'space-between', padding: '1rem', width: '100%' }}>
                    <span style={{ textAlign: 'left' }}>{user.name} <span style={{ display: 'block', margin: '4px 0 0', fontSize: '0.7rem', color: user.subscriptionType === 'Mensalista' ? 'var(--color-primary)' : 'var(--color-accent)' }}>{user.subscriptionType.toUpperCase()}</span></span>
                    <span style={{ color: 'var(--color-warning)' }}>OVR {user.overall}</span>
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
