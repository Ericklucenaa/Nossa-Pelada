import { useState } from 'react';
import { useAppContext } from '../context/AppDataContext';
import { TrendingUp, Clock } from 'lucide-react';

export const Finance = () => {
  const { matches, courts } = useAppContext();
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const getPlayerCost = (match: any) => {
    const court = courts.find(c => c.id === match.courtId);
    if (!court) return 20; // fallback
    const confirmedCount = match.players.filter((p: any) => p.attendance === 'Confirmado').length;
    if (confirmedCount === 0) return 0;
    return court.pricePerHour / confirmedCount;
  };

  // Filter matches by selected month
  const filteredMatches = matches.filter(m => {
    const matchDate = new Date(m.date);
    const matchMonth = `${matchDate.getFullYear()}-${String(matchDate.getMonth() + 1).padStart(2, '0')}`;
    return matchMonth === selectedMonth;
  });

  // Calcula estatísticas financeiras
  const totalReceived = filteredMatches.reduce((acc, match) => {
    const pago = match.players.filter((p: any) => p.paymentStatus === 'Pago').length;
    return acc + (pago * getPlayerCost(match));
  }, 0);

  const totalPending = filteredMatches.reduce((acc, match) => {
    const pendente = match.players.filter((p: any) => p.paymentStatus === 'Pendente').length;
    return acc + (pendente * getPlayerCost(match));
  }, 0);

  return (
    <div className="finance-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient">Histórico de Finanças</h1>
          <p className="subtitle text-muted">Controle mensal de mensalidades e pagamentos avulsos.</p>
        </div>
        <div>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
            style={{ 
              padding: '0.75rem', 
              borderRadius: '8px', 
              border: '1px solid rgba(255,255,255,0.2)', 
              background: 'rgba(0,0,0,0.5)', 
              color: 'white',
              fontSize: '1rem' 
            }}
          />
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
             <div>
               <p className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>Total Recebido</p>
               <h2 style={{ fontSize: '2.5rem', color: 'var(--color-primary)' }}>R$ {totalReceived.toFixed(2)}</h2>
             </div>
             <div style={{ background: 'rgba(69, 242, 72, 0.1)', padding: '0.5rem', borderRadius: '50%' }}>
               <TrendingUp color="var(--color-primary)" />
             </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
             <div>
               <p className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>Total Pendente</p>
               <h2 style={{ fontSize: '2.5rem', color: 'var(--color-warning)' }}>R$ {totalPending.toFixed(2)}</h2>
             </div>
             <div style={{ background: 'rgba(252, 163, 17, 0.1)', padding: '0.5rem', borderRadius: '50%' }}>
               <Clock color="var(--color-warning)" />
             </div>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: '1rem' }}>Resumo por Pelada ({selectedMonth})</h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {filteredMatches.map(m => {
          const cost = getPlayerCost(m);
          const paid = m.players.filter((p: any) => p.paymentStatus === 'Pago').length;
          const pending = m.players.filter((p: any) => p.paymentStatus === 'Pendente').length;
          
          return (
            <div key={m.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ marginBottom: '0.5rem' }}>{m.name}</h3>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>{new Date(m.date).toLocaleDateString()}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>Taxa ind.: R$ {cost.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
                <div>
                  <p className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Recebido</p>
                  <p style={{ fontWeight: 800, color: 'var(--color-primary)' }}>R$ {(paid * cost).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Pendente</p>
                  <p style={{ fontWeight: 800, color: 'var(--color-warning)' }}>R$ {(pending * cost).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )
        })}
        {filteredMatches.length === 0 && <p className="text-muted">Nenhuma pelada registrada para este mês.</p>}
      </div>
    </div>
  );
};
