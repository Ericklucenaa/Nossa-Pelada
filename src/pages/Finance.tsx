import { useState } from 'react';
import { useAppContext } from '../context/AppDataContext';
import { TrendingUp, Clock, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export const Finance = () => {
  const { matches, users, updateMatchPlayer } = useAppContext();
  const [detailModal, setDetailModal] = useState<'Pendente' | 'Pago' | null>(null);
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const getPlayerCost = (match: any, player: any) => {
    return player.paymentType === 'Mensalista' ? (match.valorMensal || 0) : (match.valorAvulso || 0);
  };

  // Filter matches by selected month
  const filteredMatches = matches.filter(m => {
    const matchDate = new Date(m.date);
    const matchMonth = `${matchDate.getFullYear()}-${String(matchDate.getMonth() + 1).padStart(2, '0')}`;
    return matchMonth === selectedMonth;
  });

  // Calcula estatísticas financeiras
  let totalReceived = 0;
  let totalPending = 0;
  const mensalistaSetTotals = new Set<string>();

  filteredMatches.forEach(match => {
    match.players.forEach((p: any) => {
      if (p.attendance === 'Confirmado') {
        const isMensalista = p.paymentType === 'Mensalista';
        if (isMensalista && !mensalistaSetTotals.has(p.userId)) {
           mensalistaSetTotals.add(p.userId);
           if (p.paymentStatus === 'Pago') totalReceived += (match.valorMensal || 0);
           else totalPending += (match.valorMensal || 0);
        } else if (!isMensalista) {
           if (p.paymentStatus === 'Pago') totalReceived += (match.valorAvulso || 0);
           else totalPending += (match.valorAvulso || 0);
        }
      }
    });
  });

  const togglePayment = (userId: string, currentStatus: string, paymentType: string, specificMatchId: string) => {
    const newStatus = currentStatus === 'Pago' ? 'Pendente' : 'Pago';
    if (paymentType === 'Mensalista') {
      filteredMatches.forEach(fm => {
        if (fm.players.some((fp: any) => fp.userId === userId)) {
          updateMatchPlayer(fm.id, userId, { paymentStatus: newStatus });
        }
      });
    } else {
      updateMatchPlayer(specificMatchId, userId, { paymentStatus: newStatus });
    }
  };

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatMonthDisplay = (yyyyMM: string) => {
    const [year, month] = yyyyMM.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
  };

  return (
    <div className="finance-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient">Histórico de Finanças</h1>
          <p className="subtitle text-muted">Controle mensal de mensalidades e pagamentos avulsos.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--color-surface)', padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <button onClick={handlePrevMonth} className="btn-icon" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
            <ChevronLeft size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '160px', justifyContent: 'center' }}>
            <Calendar size={18} color="var(--color-primary)" />
            <span style={{ fontSize: '1.1rem', fontWeight: 600, textTransform: 'capitalize' }}>
              {formatMonthDisplay(selectedMonth)}
            </span>
          </div>

          <button onClick={handleNextMonth} className="btn-icon" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-primary)', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setDetailModal('Pago')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
             <div>
               <p className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>Total Recebido (Clique p/ ver)</p>
               <h2 style={{ fontSize: '2.5rem', color: 'var(--color-primary)' }}>R$ {totalReceived.toFixed(2)}</h2>
             </div>
             <div style={{ background: 'rgba(69, 242, 72, 0.1)', padding: '0.5rem', borderRadius: '50%' }}>
               <TrendingUp color="var(--color-primary)" />
             </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-warning)', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setDetailModal('Pendente')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
             <div>
               <p className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>Total Pendente (Clique p/ ver)</p>
               <h2 style={{ fontSize: '2.5rem', color: 'var(--color-warning)' }}>R$ {totalPending.toFixed(2)}</h2>
             </div>
             <div style={{ background: 'rgba(252, 163, 17, 0.1)', padding: '0.5rem', borderRadius: '50%' }}>
               <Clock color="var(--color-warning)" />
             </div>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: '1rem' }}>Resumo por Pelada ({formatMonthDisplay(selectedMonth)})</h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {(() => {
          const mensalistaSetResumo = new Set<string>();
          return filteredMatches.map(m => {
            let matchReceived = 0;
            let matchPending = 0;
            m.players.forEach((p: any) => {
              if (p.attendance === 'Confirmado') {
                const isMensalista = p.paymentType === 'Mensalista';
                if (isMensalista) {
                  if (!mensalistaSetResumo.has(p.userId)) {
                    mensalistaSetResumo.add(p.userId);
                    if (p.paymentStatus === 'Pago') matchReceived += (m.valorMensal || 0);
                    else matchPending += (m.valorMensal || 0);
                  }
                } else {
                  if (p.paymentStatus === 'Pago') matchReceived += (m.valorAvulso || 0);
                  else matchPending += (m.valorAvulso || 0);
                }
              }
            });
            return (
            <div key={m.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem', color: 'var(--text-main)' }}>{m.name}</h3>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>{new Date(m.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: 'rgba(69, 242, 72, 0.1)', color: 'var(--color-primary)', borderRadius: '1rem', fontWeight: 600, height: 'fit-content' }}>Mensal R$ {m.valorMensal?.toFixed(2) || '0.00'}</span>
                  <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: 'rgba(102, 252, 241, 0.1)', color: 'var(--color-accent)', borderRadius: '1rem', fontWeight: 600, height: 'fit-content' }}>Avulso R$ {m.valorAvulso?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', margin: 0 }}>Recebido</p>
                  <p style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.2rem', margin: 0 }}>R$ {matchReceived.toFixed(2)}</p>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', margin: 0 }}>Pendente</p>
                  <p style={{ fontWeight: 800, color: 'var(--color-warning)', fontSize: '1.2rem', margin: 0 }}>R$ {matchPending.toFixed(2)}</p>
                </div>
              </div>
            </div>
          );
        });
        })()}
        {filteredMatches.length === 0 && <p className="text-muted">Nenhuma pelada registrada para este mês.</p>}
      </div>

      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', padding: '1.5rem', background: 'var(--color-bg)', border: `1px solid ${detailModal === 'Pago' ? 'var(--color-primary)' : 'var(--color-warning)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
              <h2 style={{ color: detailModal === 'Pago' ? 'var(--color-primary)' : 'var(--color-warning)', margin: 0 }}>
                Jogadores {detailModal === 'Pago' ? 'Pagos' : 'Pendentes'}
              </h2>
              <button onClick={() => setDetailModal(null)} className="btn-icon" style={{ cursor: 'pointer' }}>X</button>
            </div>
            
            {filteredMatches.map(m => {
              const playersToShow = m.players.filter((p:any) => p.paymentStatus === detailModal && p.attendance === 'Confirmado');
              if (playersToShow.length === 0) return null;
              
              return (
                <div key={m.id} style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{m.name} - {new Date(m.date).toLocaleDateString()}</h3>
                  {playersToShow.map((p:any) => {
                     const user = users.find(u => u.id === p.userId);
                     const cost = getPlayerCost(m, p);
                     return (
                       <div key={p.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', marginBottom: '0.5rem', borderRadius: '8px' }}>
                         <div>
                           <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>{user?.name || 'Desconhecido'}</p>
                           <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>{p.paymentType} (R$ {cost.toFixed(2)})</p>
                         </div>
                         <button 
                           onClick={() => togglePayment(p.userId, p.paymentStatus, p.paymentType, m.id)}
                           className={detailModal === 'Pago' ? "btn-danger" : "btn-primary"}
                           style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', border: 'none' }}
                         >
                           {detailModal === 'Pago' ? 'Marcar Pendente' : 'Marcar Pago'}
                         </button>
                       </div>
                     )
                  })}
                </div>
              )
            })}
            
            {!filteredMatches.some(m => m.players.some((p:any) => p.paymentStatus === detailModal && p.attendance === 'Confirmado')) && (
              <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>Nenhum jogador encontrado.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
