import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CheckSquare, XSquare, Trash2, Share2, Copy, UserPlus, RotateCcw } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import type { AttendanceStatus, MatchPlayer, PaymentStatus, User, Position } from '../types';
import { formatCurrencyBRL, getMonthKey } from '../utils/format';

type MatchTab = 'lista' | 'financeiro' | 'times' | 'jogo';

type PlayerRow = MatchPlayer & {
  displayName: string;
  displayPosition: string;
  user?: User;
};

const attendanceColor = (status: AttendanceStatus): string => {
  if (status === 'Confirmado') return 'var(--color-primary-text)';
  if (status === 'De Fora') return 'var(--color-warning)';
  if (status === 'Ausente') return 'var(--color-danger)';
  return 'var(--text-muted)';
};

const TEAM_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export const MatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { matches, users, courts, updateMatchPlayer, updateMatch, drawTeams, setMatchStats, joinMatch, joinMatchGuest, removeMatch, currentUser, listenPublicMatch, updateUser } = useAppContext();
  const location = useLocation();
  const initialTab = (location.hash.replace('#', '') as MatchTab) || 'lista';
  const [activeTab, setActiveTab] = useState<MatchTab>((['lista','jogo','financeiro','times'] as MatchTab[]).includes(initialTab) ? initialTab : 'lista');
  const [addPlayerModal, setAddPlayerModal] = useState(false);
  const [guestModal, setGuestModal] = useState(false);
  const [drawOptions, setDrawOptions] = useState({ useMensalista: true, useArrival: false });
  const [isLoading, setIsLoading] = useState(true);
  const [successName, setSuccessName] = useState<string | null>(null);

  const match = matches.find((candidate) => candidate.id === id);
  const matchUsers = match?.organizerPlayers || users;

  const isOrganizer = currentUser != null && match?.organizerId === currentUser.id;
  const organizerUser = match?.organizerPlayers?.find(u => u.id === match.organizerId)
    ?? users.find(u => u.id === match?.organizerId);

  useEffect(() => {
    if (id) {
      const unsubscribe = listenPublicMatch(id, () => setIsLoading(false));
      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, [id, listenPublicMatch]);

  useEffect(() => {
    if (!match) return;
    const params = new URLSearchParams(location.search);
    if (params.get('join') === 'true') {
      if (currentUser) {
        const isAlreadyIn = match.players.some(p => p.userId === currentUser.id);
        if (!isAlreadyIn) {
          joinMatch(match.id, currentUser.id);
          setSuccessName(currentUser.name);
        }
        navigate(location.pathname, { replace: true });
      } else {
        setGuestModal(true);
      }
    }
  }, [location.search, match, currentUser, joinMatch, navigate]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '0.75rem' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <p className="text-muted" style={{ fontSize: '12px' }}>Carregando pelada...</p>
      </div>
    );
  }

  if (!match) return (
    <div style={{ padding: '24px', textAlign: 'center' }} className="panel">
      <h2 style={{ color: 'var(--color-danger)', fontSize: '16px', marginBottom: '6px' }}>Pelada não encontrada</h2>
      <p className="text-muted" style={{ fontSize: '13px', marginBottom: '14px' }}>O link pode estar expirado ou incorreto.</p>
      <button className="btn-primary" onClick={() => navigate('/')}>Ir para o Início</button>
    </div>
  );

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
        const user = matchUsers.find((u) => u.id === player.userId);
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
    
    return `*${match.name.toUpperCase()}*\nLocal: ${courtName}\nData: ${date} às ${time}\n\nConfirme sua presença no link:\n${getShareLink()}`;
  };

  const handleShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(getShareText())}`, '_blank');
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(getShareLink());
    window.alert('Link copiado para a área de transferência!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Success modal after joining */}
      {successName && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Presença Confirmada</h2>
            <p className="text-muted" style={{ marginBottom: '16px', fontSize: '13px' }}><strong>{successName}</strong> foi adicionado à lista da pelada.</p>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setSuccessName(null)}>Ver Lista</button>
          </div>
        </div>
      )}

      {/* Banner for guests and non-organizer logged-in users */}
      {(!currentUser || !isOrganizer) && (() => {
        const selfInList = currentUser && match.players.some(p => p.userId === currentUser.id);
        return (
          <div className="panel" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: 'var(--color-surface-hover)' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                {currentUser ? 'Modo Participante' : 'Acesso Público'}
              </span>
              <p className="text-muted" style={{ margin: 0, fontSize: '11px' }}>
                {selfInList ? 'Você está confirmado na lista.' : 'Confirme sua presença abaixo.'}
              </p>
            </div>
            <div>
              {selfInList ? (
                <button className="btn-danger" style={{ height: '30px', fontSize: '12px', padding: '0 10px' }}
                  onClick={() => {
                    if (window.confirm('Sair da lista desta pelada?')) {
                      updateMatch(match.id, { players: match.players.filter(p => p.userId !== currentUser!.id) });
                    }
                  }}>
                  Sair da Lista
                </button>
              ) : (
                <button className="btn-primary" style={{ height: '30px', fontSize: '12px', padding: '0 12px' }}
                  onClick={() => {
                    if (currentUser) {
                      joinMatch(match.id, currentUser.id);
                      setSuccessName(currentUser.name);
                    } else {
                      setGuestModal(true);
                    }
                  }}>
                  Confirmar Presença
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Header Info */}
      <div className="panel" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{match.name}</h1>
            <p className="text-muted" style={{ margin: '3px 0 0', fontSize: '12px' }}>
              {new Date(match.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} às {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{match.endTime ? ` – ${new Date(match.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''} • Confirmados: <strong>{confirmedCount}</strong> {subsCount > 0 && `(Reservas: ${subsCount})`}
            </p>
            {organizerUser && (
              <p className="text-muted" style={{ margin: '2px 0 0', fontSize: '11px' }}>
                Organizado por: <strong>{organizerUser.name}</strong>
              </p>
            )}
          </div>

          {isOrganizer && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button className="btn-primary" style={{ height: '30px', fontSize: '12px', padding: '0 8px' }} onClick={() => setAddPlayerModal(true)} title="Adicionar Atleta">
                <UserPlus size={14} /> Atleta
              </button>
              <button className="btn-outline" style={{ height: '30px', fontSize: '12px', padding: '0 8px' }} onClick={handleShare} title="Compartilhar no WhatsApp">
                <Share2 size={14} /> WhatsApp
              </button>
              <button className="btn-icon" style={{ width: '30px', height: '30px' }} onClick={handleCopyToClipboard} title="Copiar Link">
                <Copy size={14} />
              </button>
              <button className="btn-ghost" style={{ width: '30px', height: '30px', padding: 0, color: 'var(--color-danger)' }} onClick={handleDeleteMatch} title="Excluir Pelada">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        {([
          { key: 'lista', label: 'Lista' },
          { key: 'times', label: 'Times' },
          { key: 'jogo', label: 'Jogo' },
          { key: 'financeiro', label: 'Financeiro' },
        ] as { key: MatchTab; label: string }[])
        .filter(tab => isOrganizer || tab.key === 'lista')
        .map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1,
              height: '30px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === key ? 'var(--color-primary)' : 'transparent',
              color: activeTab === key ? '#ffffff' : 'var(--text-muted)',
              fontWeight: activeTab === key ? 600 : 500,
              fontSize: '12px',
              transition: 'background-color 0.15s ease',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="panel" style={{ padding: '14px 16px', minHeight: '300px' }}>
        {activeTab === 'lista' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 className="section-title">Presença ({playersFullData.length})</h2>
              {isOrganizer && playersFullData.length > 0 && (
                <button 
                  className="btn-ghost" 
                  style={{ height: '26px', fontSize: '11px', color: 'var(--color-danger)' }} 
                  onClick={handleClearList}
                >
                  Limpar lista
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {playersFullData.map((player) => (
                <div
                  key={player.userId || player.guestName}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--color-surface)',
                    gap: '8px',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{player.displayName}</span>
                      <span className="badge badge-muted">{player.displayPosition}</span>
                      {player.user ? (
                        isOrganizer ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            OVR:
                            <input
                              type="number" min={0} max={100}
                              defaultValue={player.user.overall || 50}
                              onBlur={e => {
                                const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 50));
                                e.target.value = String(val);
                                if (player.userId) updateUser(player.userId, { overall: val });
                              }}
                              style={{ width: 34, height: 20, fontSize: '11px', padding: '0 2px', borderRadius: 4, border: '1px solid var(--border-color)', background: 'var(--color-surface)', color: 'var(--text-main)', fontWeight: 600, textAlign: 'center' }}
                            />
                          </span>
                        ) : (
                          <span className="badge badge-primary">OVR {player.user.overall || 50}</span>
                        )
                      ) : (
                        <span className="badge badge-muted">Convidado</span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: attendanceColor(player.attendance), fontWeight: 600, marginTop: '2px', display: 'inline-block' }}>
                      {player.attendance}
                    </span>
                  </div>

                  {isOrganizer && (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                      <button
                        onClick={() => handleUpdateStatus(player.userId, player.guestName, 'Confirmado')}
                        title="Confirmar"
                        className="btn-icon"
                        style={{ width: '28px', height: '28px', color: player.attendance === 'Confirmado' ? 'var(--color-primary)' : 'var(--text-muted)' }}
                      >
                        <CheckSquare size={15} />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(player.userId, player.guestName, 'Ausente')}
                        title="Ausente"
                        className="btn-icon"
                        style={{ width: '28px', height: '28px', color: player.attendance === 'Ausente' ? 'var(--color-danger)' : 'var(--text-muted)' }}
                      >
                        <XSquare size={15} />
                      </button>
                      <button
                        onClick={() => handleRemoveFromMatch(player.userId, player.guestName, player.displayName)}
                        title="Remover"
                        className="btn-ghost"
                        style={{ width: '28px', height: '28px', padding: 0, color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  {!isOrganizer && currentUser && player.userId === currentUser.id && (
                    <button
                      onClick={() => {
                        if (window.confirm('Sair da lista desta pelada?')) {
                          updateMatch(match.id, { players: match.players.filter(p => p.userId !== currentUser.id) });
                        }
                      }}
                      title="Sair da lista"
                      className="btn-ghost"
                      style={{ height: '26px', fontSize: '11px', color: 'var(--color-danger)' }}
                    >
                      Sair
                    </button>
                  )}
                </div>
              ))}

              {playersFullData.length === 0 && (
                <p className="text-muted" style={{ textAlign: 'center', padding: '24px 0', margin: 0 }}>
                  Nenhum jogador confirmado na lista.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'times' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 className="section-title">Escalação dos Times</h2>
              {isOrganizer && (
                <button className="btn-primary" style={{ height: '30px', fontSize: '12px' }} onClick={() => drawTeams(match.id, drawOptions)}>
                  <RotateCcw size={13} /> Sortear Times
                </button>
              )}
            </div>

            {isOrganizer && (
              <div style={{ background: 'var(--color-surface-hover)', padding: '10px 12px', borderRadius: 'var(--radius-md)', marginBottom: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Configurações do Sorteio</span>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={drawOptions.useMensalista} onChange={(e) => setDrawOptions(p => ({ ...p, useMensalista: e.target.checked }))} style={{ accentColor: 'var(--color-primary)' }} />
                    Mensalista Primeiro
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={drawOptions.useArrival} onChange={(e) => setDrawOptions(p => ({ ...p, useArrival: e.target.checked }))} style={{ accentColor: 'var(--color-primary)' }} />
                    Ordem de Chegada
                  </label>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              {TEAM_NAMES.filter((teamName) => playersFullData.some((player) => player.team === teamName)).map((teamName) => {
                const teamPlayers = playersFullData.filter((player) => player.team === teamName);
                const ovrAvg = teamPlayers.filter(p => p.user).length ? Math.round(teamPlayers.reduce((sum, p) => sum + (p.user?.overall || 50), 0) / teamPlayers.length) : '--';
                return (
                  <div key={teamName} className="panel" style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                        Time {teamName}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Média OVR: <strong>{ovrAvg}</strong>
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {teamPlayers.map((player) => (
                        <div key={player.userId || player.guestName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '3px 0' }}>
                          <span>{player.displayName}</span>
                          <span className="badge badge-muted">{player.displayPosition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {playersFullData.every((player) => !player.team) && (
                <p className="text-muted" style={{ textAlign: 'center', padding: '24px 0', margin: 0 }}>
                  Times ainda não sorteados.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'jogo' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 className="section-title">Estatísticas da Partida</h2>
            </div>

            {!isOrganizer ? (
              <p className="text-muted" style={{ fontSize: '13px' }}>Apenas o organizador pode registrar gols e assistências.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {playingPlayers.map((player) => {
                  const pid = player.userId || player.guestName!;
                  const goals = match.stats?.[pid]?.goals || 0;
                  const assists = match.stats?.[pid]?.assists || 0;
                  return (
                    <div key={pid} className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', gap: '8px' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.displayName}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{player.displayPosition}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>GOLS</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <button className="btn-icon" style={{ width: '24px', height: '24px', fontSize: '12px' }} onClick={() => setMatchStats(match.id, pid, Math.max(0, goals - 1), assists)}>-</button>
                            <span style={{ minWidth: '16px', textAlign: 'center', fontWeight: 700, fontSize: '13px' }}>{goals}</span>
                            <button className="btn-icon" style={{ width: '24px', height: '24px', fontSize: '12px' }} onClick={() => setMatchStats(match.id, pid, goals + 1, assists)}>+</button>
                          </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>ASSISTS</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <button className="btn-icon" style={{ width: '24px', height: '24px', fontSize: '12px' }} onClick={() => setMatchStats(match.id, pid, goals, Math.max(0, assists - 1))}>-</button>
                            <span style={{ minWidth: '16px', textAlign: 'center', fontWeight: 700, fontSize: '13px' }}>{assists}</span>
                            <button className="btn-icon" style={{ width: '24px', height: '24px', fontSize: '12px' }} onClick={() => setMatchStats(match.id, pid, goals, assists + 1)}>+</button>
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

        {activeTab === 'financeiro' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 className="section-title">Financeiro da Pelada</h2>
              {currentUser && (
                <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                  <span className="badge badge-primary">Pago: {formatCurrencyBRL(totalPaid)}</span>
                  <span className="badge badge-warning">Pendente: {formatCurrencyBRL(totalPending)}</span>
                </div>
              )}
            </div>

            {!isOrganizer ? (
              <p className="text-muted" style={{ fontSize: '13px' }}>Apenas o organizador pode gerenciar pagamentos.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {financeRows.map((player) => {
                  const playerCost = player.paymentType === 'Mensalista' ? match.valorMensal ?? 0 : match.valorAvulso ?? 0;
                  const isPaid = player.paymentStatus === 'Pago';
                  return (
                    <div key={player.userId || player.guestName} className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>{player.displayName}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {player.paymentType} • {formatCurrencyBRL(playerCost)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const nextStatus: PaymentStatus = isPaid ? 'Pendente' : 'Pago';
                          if (player.userId) {
                            handlePayment(player.userId, nextStatus, player.paymentType === 'Mensalista');
                          } else if (player.guestName) {
                            updateMatch(match.id, {
                              players: match.players.map(p => p.guestName === player.guestName ? { ...p, paymentStatus: nextStatus } : p)
                            });
                          }
                        }}
                        className={isPaid ? 'btn-primary' : 'btn-outline'}
                        style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}
                      >
                        {isPaid ? 'Pago' : 'Pendente'}
                      </button>
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
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Confirmar Presença</h2>
            <p className="text-muted" style={{ fontSize: '12px', marginBottom: '14px' }}>Selecione seu nome da lista ou adicione um novo convidado.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <span className="input-label">Atletas Cadastrados</span>
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {matchUsers
                  .filter(u => !match.players.some(p => p.userId === u.id))
                  .sort((a,b) => a.name.localeCompare(b.name))
                  .map(u => (
                    <button 
                      key={u.id} 
                      className="btn-outline" 
                      style={{ justifyContent: 'space-between', height: '34px', fontSize: '13px' }}
                      onClick={() => {
                        joinMatch(match.id, u.id);
                        setSuccessName(u.name);
                        setGuestModal(false);
                        navigate(location.pathname, { replace: true });
                      }}
                    >
                      <span>{u.name}</span>
                      <span className="badge badge-muted">{u.position}</span>
                    </button>
                  ))
                }
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <span className="input-label">Novo Convidado</span>
              <form onSubmit={(e) => {
                e.preventDefault();
                const target = e.target as typeof e.target & { name: { value: string }; pos: { value: Position } };
                joinMatchGuest(match.id, { name: target.name.value, position: target.pos.value });
                setSuccessName(target.name.value);
                setGuestModal(false);
                navigate(location.pathname, { replace: true });
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <input name="name" className="input-base" placeholder="Nome do Convidado" required />
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  <select name="pos" className="input-base" style={{ flex: 1 }}>
                    <option value="Linha">Linha</option>
                    <option value="Goleiro">Goleiro</option>
                  </select>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>Confirmar</button>
                </div>
              </form>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn-outline" onClick={() => setGuestModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Regular Player Modal */}
      {addPlayerModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Adicionar à Pelada</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto', marginBottom: '14px' }}>
              {matchUsers.filter((user) => !match.players.some((player) => player.userId === user.id)).map((user) => (
                <button
                  key={user.id}
                  className="btn-outline"
                  onClick={() => joinMatch(match.id, user.id)}
                  style={{ justifyContent: 'space-between', height: '36px', padding: '0 10px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 600 }}>{user.name}</span>
                    <span className="badge badge-muted">{user.subscriptionType}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.position}</span>
                </button>
              ))}
              {matchUsers.filter((user) => !match.players.some((player) => player.userId === user.id)).length === 0 && (
                <p className="text-muted" style={{ textAlign: 'center', padding: '16px 0', margin: 0 }}>Todos os atletas cadastrados já estão na lista.</p>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setAddPlayerModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
