import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, BadgeDollarSign, CheckSquare, XSquare, Trash2, Share2 } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import type { MatchPlayer, PaymentStatus, User, Position } from '../types';
import { formatCurrencyBRL, getMonthKey } from '../utils/format';

type MatchTab = 'lista' | 'financeiro' | 'times' | 'jogo';

type PlayerRow = MatchPlayer & {
  displayName: string;
  displayPosition: string;
  user?: User;
};

const TEAM_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export const MatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { matches, users, courts, updateMatchPlayer, updateMatch, drawTeams, setMatchStats, swapPlayers, joinMatch, joinMatchGuest, removeMatch, currentUser, loadPublicMatch } = useAppContext();
  const location = useLocation();
  const initialTab = (location.hash.replace('#', '') as MatchTab) || 'lista';
  const [activeTab, setActiveTab] = useState<MatchTab>((['lista','jogo','financeiro','times'] as MatchTab[]).includes(initialTab) ? initialTab : 'lista');
  const [swapModal, setSwapModal] = useState<{ active: boolean; idToSwap: string | null }>({ active: false, idToSwap: null });
  const [addPlayerModal, setAddPlayerModal] = useState(false);
  const [guestModal, setGuestModal] = useState(false);
  const [drawOptions, setDrawOptions] = useState({ useMensalista: true, useOverall: true, useArrival: false });
  const [isLoading, setIsLoading] = useState(true);

  const match = matches.find((candidate) => candidate.id === id);

  useEffect(() => {
    if (id && !match) {
      loadPublicMatch(id).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [id, match, loadPublicMatch]);

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
        // Auto-open guest modal if they came from a join link and aren't logged in
        setGuestModal(true);
      }
    }
  }, [location.search, match, currentUser, joinMatch, navigate]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div style={{ width: 50, height: 50, border: '4px solid var(--color-surface-light)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p className="text-muted">Buscando pelada...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!match) return <div style={{ padding: '2rem', textAlign: 'center' }} className="glass-panel"><h2 style={{ color: 'var(--color-danger)' }}>Pelada não encontrada</h2><p className="text-muted">O link pode estar expirado ou incorreto.</p><button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>Ir para o Início</button></div>;

  const handleUpdateStatus = (playerId: string | undefined, guestName: string | undefined, status: MatchPlayer['attendance']) => {
    if (playerId) {
      updateMatchPlayer(match.id, playerId, { attendance: status, team: status === 'Confirmado' ? undefined : null });
    } else if (guestName) {
      updateMatch(match.id, {
        players: match.players.map(p => p.guestName === guestName ? { ...p, attendance: status, team: status === 'Confirmado' ? undefined : null } : p)
      });
    }
  };

  const handleRemoveFromMatch = (playerId: string | undefined, guestName: string | undefined, playerName: string) => {
    if (!window.confirm(`Remover ${playerName} da pelada?`)) return;
    updateMatch(match.id, {
      players: match.players.filter((p) => playerId ? p.userId !== playerId : p.guestName !== guestName),
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

  const playersFullData = match.players
    .map((player): PlayerRow | null => {
      if (player.userId) {
        const user = users.find((u) => u.id === player.userId);
        if (user) return { ...player, displayName: user.name, displayPosition: user.position, user };
      }
      if (player.guestName) {
        return { 
          ...player, 
          displayName: player.guestName, 
          displayPosition: (player.guestPosition as string) || 'Linha' 
        };
      }
      return null;
    })
    .filter((p): p is PlayerRow => p !== null)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

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

  const getShareLink = () => `${window.location.origin}/matches/${match.id}?join=true`;
  
  const getShareText = () => {
    const court = courts.find(c => c.id === match.courtId);
    const courtName = court ? court.name : 'Local não definido';
    const date = new Date(match.date).toLocaleDateString('pt-BR');
    const time = new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `⚽ *CONVOCAÇÃO: ${match.name.toUpperCase()}*\n📍 ${courtName} • 📅 ${date} • 🕐 ${time}\n\nFala galera! Clique no link abaixo para confirmar sua presença:\n\n👉 ${getShareLink()}`;
  };

  const handleShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(getShareText())}`, '_blank');
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(getShareLink());
    window.alert('Link copiado para a área de transferência! Cole no WhatsApp.');
  };

  return (
    <div className="match-detail" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {!currentUser && (
        <div className="glass-panel" style={{ marginBottom: '1.5rem', border: '1px solid var(--color-primary)', background: 'rgba(69, 242, 72, 0.05)', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Shield size={24} color="var(--color-primary)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Acesso Público</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Você está visualizando esta pelada. Deseja confirmar sua presença?</p>
              </div>
           </div>
           <div style={{ display: 'flex', gap: '0.5rem' }}>
             <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => setGuestModal(true)}>Confirmar Presença</button>
           </div>
        </div>
      )}

      <header style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="text-gradient" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', marginBottom: '0.25rem', wordBreak: 'break-word' }}>{match.name}</h1>
            <p className="subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {new Date(match.date).toLocaleDateString('pt-BR')} das {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} às {match.endTime ? new Date(match.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} | Confirmados: {confirmedCount} | Reservas: {subsCount}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {currentUser && (
              <>
                <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.5rem 0.8rem' }} onClick={() => setAddPlayerModal(true)}>+ Jogador</button>
                <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.5rem 0.8rem', borderColor: '#25D366', color: '#25D366' }} onClick={handleShare}>
                  <Share2 size={14} style={{ marginRight: '4px' }}/> Whats
                </button>
                <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.5rem 0.8rem' }} onClick={handleCopyToClipboard} title="Copiar Link">
                  📋 Copiar Link
                </button>
                <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.5rem 0.8rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={handleDeleteMatch}>Excluir</button>
              </>
            )}
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--color-surface-light)', padding: '0.375rem', borderRadius: '14px', width: 'fit-content' }}>
        {([
          { key: 'lista',      icon: '📋', label: 'Lista'      },
          { key: 'times',      icon: '🛡️', label: 'Times'      },
          { key: 'jogo',       icon: '⚽', label: 'Jogo'       },
          { key: 'financeiro', icon: '💰', label: 'Financeiro' },
        ] as { key: MatchTab; icon: string; label: string }[])
        .filter(tab => currentUser || tab.key === 'lista')
        .map(({ key, icon, label }) => (
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
              {currentUser && (
                <button 
                  className="btn-outline" 
                  style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem', borderColor: 'var(--color-warning)', color: 'var(--color-warning)', textTransform: 'uppercase', letterSpacing: '0.5px' }} 
                  onClick={handleClearList}
                >
                  Limpar Todos
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {playersFullData.map((player, index) => (
                <div key={player.userId || player.guestName} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: index % 2 === 0 ? 'var(--color-surface-light)' : 'transparent', borderRadius: 'var(--radius-sm)', borderBottom: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {player.displayName} 
                        <span style={{ color: 'var(--color-primary)', fontSize: '0.75rem', marginLeft: '4px' }}>{player.displayPosition}</span> 
                        {player.user ? <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', marginLeft: '4px'}}>⭐ {player.user.overall || 50}</span> : <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: '4px', marginLeft: '4px', color: 'var(--text-muted)' }}>Convidado</span>}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: player.attendance === 'Confirmado' ? 'var(--color-primary)' : 'var(--color-danger)' }}>{player.attendance}</p>
                    </div>
                  </div>
                  {currentUser && (
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
                      <button onClick={() => handleUpdateStatus(player.userId, player.guestName, 'Confirmado')} title="Confirmado" style={{ background: 'transparent', color: player.attendance === 'Confirmado' ? 'var(--color-primary)' : 'var(--text-muted)', padding: '4px' }}><CheckSquare size={18} /></button>
                      <button onClick={() => handleUpdateStatus(player.userId, player.guestName, 'Ausente')} title="Ausente" style={{ background: 'transparent', color: player.attendance === 'Ausente' ? 'var(--color-danger)' : 'var(--text-muted)', padding: '4px' }}><XSquare size={18} /></button>
                      <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 2px' }} />
                      <button
                        onClick={() => handleRemoveFromMatch(player.userId, player.guestName, player.displayName)}
                        title="Remover da pelada"
                        style={{ background: 'transparent', color: 'var(--color-danger)', opacity: 0.7, padding: '4px' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {playersFullData.length === 0 && <p className="text-muted text-center" style={{ padding: '2rem' }}>Ninguém na lista ainda. Seja o primeiro!</p>}
            </div>
          </div>
        )}

        {/* Other tabs remain largely similar but check for currentUser permissions */}
        {activeTab === 'financeiro' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Status Financeiro</h2>
              {currentUser && (
                <div style={{ textAlign: 'right', background: 'var(--color-surface-light)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                  <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>Recebido: {formatCurrencyBRL(totalPaid)}</span>
                  <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-warning)', fontWeight: 'bold' }}>Pendente: {formatCurrencyBRL(totalPending)}</span>
                </div>
              )}
            </div>
            {!currentUser ? (
              <p className="text-muted">Apenas organizadores podem visualizar detalhes financeiros.</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {financeRows.map((player, index) => {
                  const playerCost = player.paymentType === 'Mensalista' ? match.valorMensal ?? 0 : match.valorAvulso ?? 0;
                  return (
                    <div key={player.userId || player.guestName} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: index % 2 === 0 ? 'var(--color-surface-light)' : 'transparent', borderRadius: 'var(--radius-sm)', borderBottom: '1px solid var(--border-color)' }}>
                      <div>
                        <h4 style={{ margin: 0 }}>{player.displayName}</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {player.paymentType} • {formatCurrencyBRL(playerCost)} • <span style={{ color: player.paymentStatus === 'Pago' ? 'var(--color-primary)' : 'var(--color-warning)', fontWeight: 700 }}>{player.paymentStatus}</span>
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button style={{ background: 'transparent', color: player.paymentStatus === 'Pago' ? 'var(--color-primary)' : 'var(--color-warning)' }} onClick={() => player.userId && handlePayment(player.userId, player.paymentStatus === 'Pago' ? 'Pendente' : 'Pago', player.paymentType === 'Mensalista')} title="Alterar Status">
                            <BadgeDollarSign size={20} />
                          </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Teams tab updated to show display names */}
        {activeTab === 'times' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}><ShieldAlert /> Escalação dos Times</h2>
              {currentUser && <button className="btn-primary" onClick={() => drawTeams(match.id, drawOptions)}>Sortear Times</button>}
            </div>

            {currentUser && (
              <div style={{ background: 'var(--color-surface-light)', padding: '1.2rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', border: '1px solid var(--border-color)' }}>
                <span style={{ width: '100%', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Prioridades do Sorteio</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}><input type="checkbox" checked={drawOptions.useMensalista} onChange={(e) => setDrawOptions(p => ({ ...p, useMensalista: e.target.checked }))} /> <span>Mensalista</span></label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}><input type="checkbox" checked={drawOptions.useOverall} onChange={(e) => setDrawOptions(p => ({ ...p, useOverall: e.target.checked }))} /> <span>Overall</span></label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}><input type="checkbox" checked={drawOptions.useArrival} onChange={(e) => setDrawOptions(p => ({ ...p, useArrival: e.target.checked }))} /> <span>Chegada</span></label>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
              {TEAM_NAMES.filter((teamName) => playersFullData.some((player) => player.team === teamName)).map((teamName, index) => {
                const teamPlayers = playersFullData.filter((player) => player.team === teamName);
                const ovrAvg = teamPlayers.filter(p => p.user).length ? Math.round(teamPlayers.reduce((sum, p) => sum + (p.user?.overall || 50), 0) / teamPlayers.length) : '--';
                return (
                  <div key={teamName} style={{ background: index % 2 === 0 ? 'rgba(69, 242, 72, 0.05)' : 'rgba(102, 252, 241, 0.05)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: index % 2 === 0 ? '1px solid rgba(69, 242, 72, 0.2)' : '1px solid rgba(102, 252, 241, 0.2)' }}>
                    <h3 style={{ marginBottom: '1rem', color: index % 2 === 0 ? 'var(--color-primary)' : 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield /> Time {teamName} {currentUser && `(OVR ${ovrAvg})`}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {teamPlayers.map((player) => (
                        <div key={player.userId || player.guestName} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <span>{player.displayName} {player.displayPosition === 'Goleiro' && '🧤'}</span>
                          <span style={{ fontWeight: 800 }}>{player.displayPosition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {playersFullData.every((player) => !player.team) && <p className="text-muted text-center" style={{ marginTop: '2rem' }}>Times ainda não definidos.</p>}
            </div>
          </div>
        )}

        {/* Jogo tab updated */}
        {activeTab === 'jogo' && (
          <div>
            <h2 style={{ margin: 0, marginBottom: '1.5rem' }}>Estatísticas</h2>
            {!currentUser ? (
               <p className="text-muted">Apenas organizadores podem registrar gols e assistências.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {playingPlayers.map((player, index) => {
                  const pid = player.userId || player.guestName!;
                  const goals = match.stats?.[pid]?.goals || 0;
                  const assists = match.stats?.[pid]?.assists || 0;
                  return (
                    <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: index % 2 === 0 ? 'var(--color-surface-light)' : 'transparent', borderRadius: 'var(--radius-sm)', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0 }}>{player.displayName}</h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{player.displayPosition}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--color-primary)' }}>⚽ GOLS</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <button onClick={() => setMatchStats(match.id, pid, Math.max(0, goals - 1), assists)}>-</button>
                            <span style={{ fontWeight: 700 }}>{goals}</span>
                            <button onClick={() => setMatchStats(match.id, pid, goals + 1, assists)}>+</button>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--color-accent)' }}>🎯 ASSIST</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <button onClick={() => setMatchStats(match.id, pid, goals, Math.max(0, assists - 1))}>-</button>
                            <span style={{ fontWeight: 700 }}>{assists}</span>
                            <button onClick={() => setMatchStats(match.id, pid, goals, assists + 1)}>+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guest RSVP Modal */}
      {guestModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="text-gradient">Confirmar Presença</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Selecione seu nome da lista ou adicione um novo.</p>
            
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jogadores Cadastrados</span>
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'grid', gap: '0.5rem', paddingRight: '4px' }}>
                {users
                  .filter(u => !match.players.some(p => p.userId === u.id))
                  .sort((a,b) => a.name.localeCompare(b.name))
                  .map(u => (
                    <button 
                      key={u.id} 
                      className="btn-outline" 
                      style={{ justifyContent: 'space-between', padding: '0.75rem 1rem', fontSize: '0.9rem' }}
                      onClick={() => {
                        joinMatch(match.id, u.id);
                        setGuestModal(false);
                        navigate(location.pathname, { replace: true });
                      }}
                    >
                      {u.name} <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{u.position}</span>
                    </button>
                  ))
                }
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Não está na lista? (Novo Convidado)</span>
              <form onSubmit={(e) => {
                e.preventDefault();
                const target = e.target as typeof e.target & { name: { value: string }; pos: { value: Position } };
                joinMatchGuest(match.id, { name: target.name.value, position: target.pos.value });
                setGuestModal(false);
                navigate(location.pathname, { replace: true });
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <input name="name" className="input-base" placeholder="Seu Nome Completo" required />
                </div>
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                  <select name="pos" className="input-base" style={{ background: 'var(--color-surface)', flex: 1 }}>
                    <option value="Linha">Linha</option>
                    <option value="Goleiro">Goleiro</option>
                  </select>
                  <button type="submit" className="btn-primary" style={{ flex: 1.5 }}>Confirmar!</button>
                </div>
              </form>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setGuestModal(false)}>Fechar</button>
            </div>
            
            <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
               <button className="btn-link" style={{ fontSize: '0.85rem' }} onClick={() => { setGuestModal(false); navigate('/'); }}>Já tem conta? Fazer Login</button>
            </div>
          </div>
        </div>
      )}
      {/* Swap Modal */}
      {swapModal.active && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Quitar Jogador</h3>
            <p className="text-muted" style={{ marginBottom: '2rem' }}>Escolha quem vai entrar no lugar deste jogador.</p>
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              {playersFullData.filter((player) => player.attendance === 'De Fora').map((reserve) => (
                <button key={reserve.userId || reserve.guestName} className="btn-outline" onClick={() => confirmSwap(reserve.userId!)} style={{ justifyContent: 'space-between', padding: '1rem', width: '100%' }}>
                  {reserve.displayName} <span style={{ color: 'var(--text-muted)' }}>{reserve.displayPosition}</span>
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

      {/* Add Regular Player Modal */}
      {addPlayerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '95%', maxWidth: '650px', padding: '2.5rem', maxHeight: '85vh', overflowY: 'auto', background: 'var(--color-surface)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '0.8rem', fontSize: '1.8rem', color: 'var(--color-primary)', fontWeight: 800 }}>Adicionar à Pelada</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {users.filter((user) => !match.players.some((player) => player.userId === user.id)).map((user) => (
                <button key={user.id} className="btn-outline" onClick={() => joinMatch(match.id, user.id)} style={{ padding: '1.2rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700 }}>{user.name}</span>
                    <span style={{ fontSize: '0.75rem', color: user.subscriptionType === 'Mensalista' ? 'var(--color-primary)' : 'var(--color-accent)' }}>{user.subscriptionType}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>{user.position}</span>
                </button>
              ))}
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setAddPlayerModal(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};
