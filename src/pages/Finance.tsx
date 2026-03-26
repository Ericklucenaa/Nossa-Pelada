import { useMemo, useState } from 'react';
import { TrendingUp, Clock, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import type { Match, MatchPlayer, PaymentStatus } from '../types';
import { formatCurrencyBRL, formatMonthDisplay, getMonthKey } from '../utils/format';

type FinanceEntry = {
  id: string;
  userId: string;
  userName: string;
  matchId: string;
  matchName: string;
  paymentType: MatchPlayer['paymentType'];
  paymentStatus: PaymentStatus;
  cost: number;
  isMonthlyCharge: boolean;
};

const getPlayerCost = (match: Match, player: MatchPlayer): number =>
  player.paymentType === 'Mensalista' ? match.valorMensal ?? 0 : match.valorAvulso ?? 0;

export const Finance = () => {
  const { matches, users, updateMatchPlayer } = useAppContext();
  const [detailModal, setDetailModal] = useState<PaymentStatus | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const filteredMatches = useMemo(
    () => matches.filter((match) => getMonthKey(match.date) === selectedMonth),
    [matches, selectedMonth],
  );

  const financeEntries = useMemo(() => {
    const monthlySeen = new Set<string>();
    const entries: FinanceEntry[] = [];

    filteredMatches.forEach((match) => {
      match.players
        .filter((player) => player.attendance === 'Confirmado')
        .forEach((player) => {
          const user = users.find((candidate) => candidate.id === player.userId);
          if (!user) return;

          const isMonthlyCharge = player.paymentType === 'Mensalista';
          const monthlyKey = `${selectedMonth}:${player.userId}`;
          if (isMonthlyCharge && monthlySeen.has(monthlyKey)) return;
          if (isMonthlyCharge) monthlySeen.add(monthlyKey);

          entries.push({
            id: isMonthlyCharge ? monthlyKey : `${match.id}:${player.userId}`,
            userId: player.userId,
            userName: user.name,
            matchId: match.id,
            matchName: match.name,
            paymentType: player.paymentType,
            paymentStatus: player.paymentStatus,
            cost: getPlayerCost(match, player),
            isMonthlyCharge,
          });
        });
    });

    return entries;
  }, [filteredMatches, selectedMonth, users]);

  const totalReceived = financeEntries
    .filter((entry) => entry.paymentStatus === 'Pago')
    .reduce((sum, entry) => sum + entry.cost, 0);
  const totalPending = financeEntries
    .filter((entry) => entry.paymentStatus === 'Pendente')
    .reduce((sum, entry) => sum + entry.cost, 0);

  const entriesByMatch = useMemo(() => {
    const bucket = new Map<string, FinanceEntry[]>();
    financeEntries.forEach((entry) => {
      const current = bucket.get(entry.matchId) ?? [];
      current.push(entry);
      bucket.set(entry.matchId, current);
    });
    return bucket;
  }, [financeEntries]);

  const modalEntries = financeEntries.filter((entry) => entry.paymentStatus === detailModal);

  const togglePayment = (entry: FinanceEntry) => {
    const nextStatus: PaymentStatus = entry.paymentStatus === 'Pago' ? 'Pendente' : 'Pago';

    if (entry.isMonthlyCharge) {
      filteredMatches.forEach((match) => {
        const player = match.players.find(
          (candidate) => candidate.userId === entry.userId && candidate.attendance === 'Confirmado',
        );
        if (player?.paymentType === 'Mensalista') {
          updateMatchPlayer(match.id, entry.userId, { paymentStatus: nextStatus });
        }
      });
      return;
    }

    updateMatchPlayer(entry.matchId, entry.userId, { paymentStatus: nextStatus });
  };

  const shiftMonth = (direction: -1 | 1) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month - 1 + direction, 1);
    setSelectedMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div className="finance-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient">Histórico de Finanças</h1>
          <p className="subtitle text-muted">Controle mensal de mensalidades e pagamentos avulsos.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--color-surface)', padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <button onClick={() => shiftMonth(-1)} className="btn-icon" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
            <ChevronLeft size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '160px', justifyContent: 'center' }}>
            <Calendar size={18} color="var(--color-primary)" />
            <span style={{ fontSize: '1.1rem', fontWeight: 600, textTransform: 'capitalize' }}>{formatMonthDisplay(selectedMonth)}</span>
          </div>

          <button onClick={() => shiftMonth(1)} className="btn-icon" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-primary)', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setDetailModal('Pago')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>Total Recebido (Clique p/ ver)</p>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--color-primary)' }}>{formatCurrencyBRL(totalReceived)}</h2>
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
              <h2 style={{ fontSize: '2.5rem', color: 'var(--color-warning)' }}>{formatCurrencyBRL(totalPending)}</h2>
            </div>
            <div style={{ background: 'rgba(252, 163, 17, 0.1)', padding: '0.5rem', borderRadius: '50%' }}>
              <Clock color="var(--color-warning)" />
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: '1rem' }}>Resumo por Pelada ({formatMonthDisplay(selectedMonth)})</h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {filteredMatches.map((match) => {
          const matchEntries = entriesByMatch.get(match.id) ?? [];
          const matchReceived = matchEntries
            .filter((entry) => entry.paymentStatus === 'Pago')
            .reduce((sum, entry) => sum + entry.cost, 0);
          const matchPending = matchEntries
            .filter((entry) => entry.paymentStatus === 'Pendente')
            .reduce((sum, entry) => sum + entry.cost, 0);

          return (
            <div key={match.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem', color: 'var(--text-main)' }}>{match.name}</h3>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>{new Date(match.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: 'rgba(69, 242, 72, 0.1)', color: 'var(--color-primary)', borderRadius: '1rem', fontWeight: 600, height: 'fit-content' }}>Mensal {formatCurrencyBRL(match.valorMensal ?? 0)}</span>
                  <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: 'rgba(102, 252, 241, 0.1)', color: 'var(--color-accent)', borderRadius: '1rem', fontWeight: 600, height: 'fit-content' }}>Avulso {formatCurrencyBRL(match.valorAvulso ?? 0)}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', margin: 0 }}>Recebido</p>
                  <p style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.2rem', margin: 0 }}>{formatCurrencyBRL(matchReceived)}</p>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', margin: 0 }}>Pendente</p>
                  <p style={{ fontWeight: 800, color: 'var(--color-warning)', fontSize: '1.2rem', margin: 0 }}>{formatCurrencyBRL(matchPending)}</p>
                </div>
              </div>
            </div>
          );
        })}
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

            {modalEntries.map((entry) => (
              <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', marginBottom: '0.5rem', borderRadius: '8px' }}>
                <div>
                  <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>{entry.userName}</p>
                  <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                    {entry.paymentType} • {entry.matchName} • {formatCurrencyBRL(entry.cost)}
                  </p>
                </div>
                <button
                  onClick={() => togglePayment(entry)}
                  className={detailModal === 'Pago' ? 'btn-danger' : 'btn-primary'}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', border: 'none' }}
                >
                  {detailModal === 'Pago' ? 'Marcar Pendente' : 'Marcar Pago'}
                </button>
              </div>
            ))}

            {modalEntries.length === 0 && (
              <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>Nenhum jogador encontrado.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
