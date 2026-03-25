import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppDataContext';
import { useState } from 'react';
import { Shield, ShieldAlert, BadgeDollarSign, CheckSquare, XSquare, MinusSquare, Goal, Target, RefreshCw } from 'lucide-react';
import type { MatchPlayer } from '../types';

export const MatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // @ts-ignore
  const { matches, users, updateMatchPlayer, drawTeams, recordEvent, swapPlayers, joinMatch, removeMatch, currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState<'lista' | 'financeiro' | 'times' | 'jogo'>('lista');
  const [swapModal, setSwapModal] = useState<{ active: boolean, idToSwap: string | null }>({ active: false, idToSwap: null });
  const [addPlayerModal, setAddPlayerModal] = useState(false);

  const match = matches.find(m => m.id === id);
  if (!match) return <div>Match not found</div>;

  const handleUpdateStatus = (playerId: string, status: MatchPlayer['attendance']) => {
    updateMatchPlayer(match.id, playerId, { attendance: status });
  };

  const handlePayment = (playerId: string, status: MatchPlayer['paymentStatus'], isMensalista: boolean) => {
    if (isMensalista) {
      const matchDate = new Date(match.date);
      const matchMonth = `${matchDate.getFullYear()}-${String(matchDate.getMonth() + 1).padStart(2, '0')}`;
      matches.filter(m => {
        const d = new Date(m.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === matchMonth;
      }).forEach(m => {
        if (m.players.some((p: any) => p.userId === playerId)) {
          updateMatchPlayer(m.id, playerId, { paymentStatus: status });
        }
      });
    } else {
      updateMatchPlayer(match.id, playerId, { paymentStatus: status });
    }
  };

  const playersFullData = match.players.map((p: MatchPlayer) => {
    const user = users.find(u => u.id === p.userId)!;
    return { ...p, user };
  }).sort((a,b) => b.user.overall - a.user.overall);

  const playingPlayers = playersFullData.filter((p: any) => p.team || p.attendance === 'Confirmado');

  const confirmedCount = playersFullData.filter((p: any) => p.attendance === 'Confirmado').length;
  const subsCount = playersFullData.filter((p: any) => p.attendance === 'De Fora').length;

  const handleSwapClick = (playerId: string) => {
    setSwapModal({ active: true, idToSwap: playerId });
  };

  const confirmSwap = (playerInId: string) => {
    if (swapModal.idToSwap) {
      swapPlayers(match.id, swapModal.idToSwap, playerInId);
    }
    setSwapModal({ active: false, idToSwap: null });
  };



  const handleDeleteMatch = () => {
    if (confirm('Tem certeza que deseja excluir esta pelada?')) {
      removeMatch(match.id);
      navigate('/matches', { replace: true });
    }
  };

  return (
    <div className="match-detail" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{match.name}</h1>
          <p className="subtitle" style={{ color: 'var(--text-muted)' }}>
            {new Date(match.date).toLocaleDateString()} das {new Date(match.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} às {match.endTime ? new Date(match.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'} | Confirmados: {confirmedCount} | Reservas: {subsCount}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
           <button className="btn-primary" onClick={() => setAddPlayerModal(true)}>
             Adicionar Jogador
           </button>
           <button className="btn-outline" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={handleDeleteMatch}>
             Remover Partida
           </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {['lista', 'financeiro', 'times', 'jogo'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{ 
              padding: '1rem 2rem', 
              background: 'transparent', 
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--text-muted)',
              textTransform: 'uppercase',
              fontWeight: 600
            }}
          >
            {tab === 'jogo' ? 'Jogar / Estatísticas' : tab}
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
              {playersFullData.map((p: any, index: number) => (
                <div key={p.userId} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: index % 2 === 0 ? 'var(--color-surface-light)' : 'transparent', borderRadius: 'var(--radius-sm)', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {p.user.overall}
                    </div>
                    <div>
                      <h4 style={{ margin: 0 }}>{p.user.name} <span style={{ color: 'var(--color-primary)', fontSize: '0.8rem' }}>{p.user.position}</span></h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: p.attendance === 'Confirmado' ? 'var(--color-primary)' : p.attendance === 'Pendente' ? 'var(--color-warning)' : p.attendance === 'De Fora' ? 'var(--color-accent)' : 'var(--color-danger)' }}>{p.attendance}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleUpdateStatus(p.userId, 'Confirmado')} style={{ background: 'transparent', color: p.attendance === 'Confirmado' ? 'var(--color-primary)' : 'var(--text-muted)' }}><CheckSquare /></button>
                    <button onClick={() => handleUpdateStatus(p.userId, 'De Fora')} style={{ background: 'transparent', color: p.attendance === 'De Fora' ? 'var(--color-accent)' : 'var(--text-muted)' }}><RefreshCw /></button>
                    <button onClick={() => handleUpdateStatus(p.userId, 'Pendente')} style={{ background: 'transparent', color: p.attendance === 'Pendente' ? 'var(--color-warning)' : 'var(--text-muted)' }}><MinusSquare /></button>
                    <button onClick={() => handleUpdateStatus(p.userId, 'Ausente')} style={{ background: 'transparent', color: p.attendance === 'Ausente' ? 'var(--color-danger)' : 'var(--text-muted)' }}><XSquare /></button>
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
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>Recebido: R$ {
                   playersFullData.filter((p:any) => p.paymentStatus === 'Pago' && p.attendance === 'Confirmado').reduce((sum: number, p:any) => sum + (p.user.subscriptionType === 'Mensalista' ? (match.valorMensal || 0) : (match.valorAvulso || 0)), 0).toFixed(2)
                }</span>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-warning)', fontWeight: 'bold' }}>Pendente: R$ {
                   playersFullData.filter((p:any) => p.paymentStatus === 'Pendente' && p.attendance === 'Confirmado').reduce((sum: number, p:any) => sum + (p.user.subscriptionType === 'Mensalista' ? (match.valorMensal || 0) : (match.valorAvulso || 0)), 0).toFixed(2)
                }</span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {playersFullData.map((p: any, index: number) => {
                const playerCost = p.user.subscriptionType === 'Mensalista' ? (match.valorMensal || 0) : (match.valorAvulso || 0);

                return (
                <div key={p.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: index % 2 === 0 ? 'var(--color-surface-light)' : 'transparent', borderRadius: 'var(--radius-sm)', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {p.user.name}
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-accent)' }}>R$ {playerCost.toFixed(2)}</span>
                    </h4>
                    <span style={{ display: 'inline-block', marginTop: '0.4rem', fontSize: '0.8rem', padding: '2px 6px', borderRadius: '4px', background: p.user.subscriptionType === 'Mensalista' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: p.user.subscriptionType === 'Mensalista' ? '#fff' : 'var(--text-muted)' }}>
                      {p.user.subscriptionType}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {p.user.subscriptionType === 'Mensalista' ? (
                       <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>PAGO (PLANO)</span>
                    ) : (
                      <>
                        <span style={{ color: p.paymentStatus === 'Pago' ? 'var(--color-primary)' : 'var(--color-danger)', fontWeight: 'bold' }}>
                          {p.paymentStatus}
                        </span>
                        <button className="btn-outline" style={{ padding: '0.5rem', borderColor: p.paymentStatus === 'Pago' ? 'var(--color-primary)' : 'var(--color-danger)', color: p.paymentStatus === 'Pago' ? 'var(--color-primary)' : 'var(--color-danger)' }} onClick={() => handlePayment(p.userId, p.paymentStatus === 'Pago' ? 'Pendente' : 'Pago', p.user.subscriptionType === 'Mensalista')}>
                          <BadgeDollarSign size={20} />
                        </button>
                      </>
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
               {['A','B','C','D','E','F', 'G', 'H'].filter(tName => playersFullData.some((p:any) => p.team === tName)).map((tName, index) => {
                 const teamPlayers = playersFullData.filter((p:any) => p.team === tName);
                 const ovrVal = teamPlayers.length ? Math.round(teamPlayers.reduce((acc: number, p: any) => acc + p.user.overall, 0)/teamPlayers.length) : 0;
                 return (
                   <div key={tName} style={{ background: index % 2 === 0 ? 'rgba(69, 242, 72, 0.05)' : 'rgba(102, 252, 241, 0.05)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: index % 2 === 0 ? '1px solid rgba(69, 242, 72, 0.2)' : '1px solid rgba(102, 252, 241, 0.2)' }}>
                     <h3 style={{ marginBottom: '1rem', color: index % 2 === 0 ? 'var(--color-primary)' : 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield /> Time {tName} (OVR {ovrVal})</h3>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       {teamPlayers.map((p: any) => (
                         <div key={p.userId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                           <span>{p.user.name} {p.user.position === 'Goleiro' && '🧤'}</span>
                           <span style={{ fontWeight: 800 }}>{p.user.overall}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 );
               })}
               {playersFullData.every((p:any) => !p.team) && <p className="text-muted text-center" style={{ marginTop: '2rem' }}>Nenhum time sorteado ainda.</p>}
            </div>
          </div>
        )}

        {activeTab === 'jogo' && (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Ações Livres do Jogo</h2>
            <p className="text-muted" style={{ marginBottom: '2rem' }}>Registre gols, assistências e substituições. Estes dados alimentam as estatísticas individuais do perfil.</p>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {playingPlayers.map((p: any, index: number) => (
                <div key={p.userId} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: index % 2 === 0 ? 'var(--color-surface-light)' : 'transparent', borderRadius: 'var(--radius-sm)', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {p.user.name} 
                      {p.team && <span style={{ fontSize: '0.7rem', color: p.team === 'A' ? 'var(--color-primary)' : 'var(--color-accent)', border: `1px solid ${p.team === 'A' ? 'var(--color-primary)' : 'var(--color-accent)'}`, padding: '0 4px', borderRadius: '4px' }}>TIME {p.team}</span>}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Gols no jogo: {match.stats?.[p.userId]?.goals || 0} | Assists: {match.stats?.[p.userId]?.assists || 0}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }} onClick={() => recordEvent(match.id, p.userId, 'goal')}>
                      <Goal size={16} /> +Gol
                    </button>
                    <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }} onClick={() => recordEvent(match.id, p.userId, 'assist')}>
                      <Target size={16} /> +Assist
                    </button>
                    <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }} onClick={() => handleSwapClick(p.userId)}>
                      <RefreshCw size={16} /> Girar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de Substituição (Tampinha) */}
        {swapModal.active && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
               <h3 style={{ marginBottom: '1rem' }}>Quitar Jogador</h3>
               <p className="text-muted" style={{ marginBottom: '2rem' }}>Escolha quem vai entrar no lugar deste jogador (Tampinha).</p>
               
               <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                  {playersFullData.filter((p: any) => p.attendance === 'De Fora').map((pOut: any) => (
                    <button 
                      key={pOut.userId} 
                      className="btn-outline" 
                      onClick={() => confirmSwap(pOut.userId)}
                      style={{ justifyContent: 'space-between', padding: '1rem', width: '100%' }}
                    >
                      {pOut.user.name} <span style={{ color: 'var(--color-accent)' }}>OVR {pOut.user.overall}</span>
                    </button>
                  ))}
                  {playersFullData.filter((p: any) => p.attendance === 'De Fora').length === 0 && (
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
                  {users.filter(u => !match.players.some((p: MatchPlayer) => p.userId === u.id)).map(u => (
                    <button 
                      key={u.id} 
                      className="btn-outline" 
                      onClick={() => { joinMatch(match.id, u.id); setAddPlayerModal(false); }}
                      style={{ justifyContent: 'space-between', padding: '1rem', width: '100%' }}
                    >
                      <span style={{ textAlign: 'left' }}>{u.name} <span style={{ display: 'block', margin: '4px 0 0', fontSize: '0.7rem', color: u.subscriptionType === 'Mensalista' ? 'var(--color-primary)' : 'var(--color-accent)' }}>{u.subscriptionType?.toUpperCase() || 'AVULSO'}</span></span>
                      <span style={{ color: 'var(--color-warning)' }}>OVR {u.overall}</span>
                    </button>
                  ))}
                  {users.filter(u => !match.players.some((p: MatchPlayer) => p.userId === u.id)).length === 0 && (
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
