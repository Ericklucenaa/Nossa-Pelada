import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Share2, X } from 'lucide-react';
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
  const { matches, users, updateMatchPlayer, updateMatch } = useAppContext();
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
          const userName = player.userId ? users.find((c) => c.id === player.userId)?.name : player.guestName;
          const uid = player.userId || `guest:${player.guestName}`;
          if (!userName && !uid) return;

          const isMonthlyCharge = player.paymentType === 'Mensalista';
          const monthlyKey = `${selectedMonth}:${uid}`;
          if (isMonthlyCharge && monthlySeen.has(monthlyKey)) return;
          if (isMonthlyCharge) monthlySeen.add(monthlyKey);

          entries.push({
            id: isMonthlyCharge ? monthlyKey : `${match.id}:${uid}`,
            userId: player.userId || uid,
            userName: userName || 'Convidado',
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

    if (entry.userId.startsWith('guest:')) {
      const guestName = entry.userId.replace('guest:', '');
      updateMatch(entry.matchId, {
        players: matches.find(m => m.id === entry.matchId)?.players.map(p => 
          p.guestName === guestName ? { ...p, paymentStatus: nextStatus } : p
        ) || []
      });
    } else {
      updateMatchPlayer(entry.matchId, entry.userId, { paymentStatus: nextStatus });
    }
  };

  const shiftMonth = (direction: -1 | 1) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month - 1 + direction, 1);
    setSelectedMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleExportText = () => {
    let text = `*RESUMO FINANCEIRO - ${formatMonthDisplay(selectedMonth).toUpperCase()}*\n\n`;

    filteredMatches.forEach(match => {
      const matchEntries = entriesByMatch.get(match.id) ?? [];
      const dateStr = new Date(match.date).toLocaleDateString('pt-BR');
      text += `*${match.name}* (${dateStr})\n`;
      
      const paid = matchEntries.filter(e => e.paymentStatus === 'Pago');
      const pending = matchEntries.filter(e => e.paymentStatus === 'Pendente');

      if (paid.length > 0) {
        text += `Pagantes:\n`;
        paid.forEach(e => text += `- ${e.userName} (${e.paymentType})\n`);
      }

      if (pending.length > 0) {
        text += `Pendentes:\n`;
        pending.forEach(e => text += `- ${e.userName} (${e.paymentType})\n`);
      }
      text += `\n`;
    });

    text += `Recebido: ${formatCurrencyBRL(totalReceived)}\n`;
    text += `Pendente: ${formatCurrencyBRL(totalPending)}\n`;

    if (navigator.share) {
      navigator.share({ title: 'Resumo Financeiro', text }).catch(() => {
        navigator.clipboard.writeText(text);
        alert('Copiado para a área de transferência!');
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('Copiado para a área de transferência!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <header className="page-header">
        <h1>Finanças</h1>
        <button 
          onClick={handleExportText}
          className="btn-outline"
          style={{ height: '32px', fontSize: '12px' }}
        >
          <Share2 size={14} /> Relatório
        </button>
      </header>

      {/* Month Navigator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface)', padding: '6px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <button onClick={() => shiftMonth(-1)} className="btn-icon" style={{ width: '28px', height: '28px' }}>
          <ChevronLeft size={16} />
        </button>

        <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>
          {formatMonthDisplay(selectedMonth)}
        </span>

        <button onClick={() => shiftMonth(1)} className="btn-icon" style={{ width: '28px', height: '28px' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div
          className="panel"
          style={{ padding: '12px', cursor: 'pointer' }}
          onClick={() => setDetailModal('Pago')}
        >
          <span className="metric-card-label" style={{ color: 'var(--color-primary-text)' }}>Recebido</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary-text)', display: 'block', marginTop: '2px' }}>
            {formatCurrencyBRL(totalReceived)}
          </span>
          <span className="text-muted" style={{ fontSize: '10px', marginTop: '2px', display: 'block' }}>Ver pagantes</span>
        </div>

        <div
          className="panel"
          style={{ padding: '12px', cursor: 'pointer' }}
          onClick={() => setDetailModal('Pendente')}
        >
          <span className="metric-card-label" style={{ color: 'var(--color-warning)' }}>Pendente</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-warning)', display: 'block', marginTop: '2px' }}>
            {formatCurrencyBRL(totalPending)}
          </span>
          <span className="text-muted" style={{ fontSize: '10px', marginTop: '2px', display: 'block' }}>Ver devedores</span>
        </div>
      </div>

      {/* Match breakdown */}
      <div>
        <h2 className="section-title" style={{ marginBottom: '8px' }}>Peladas do Mês</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredMatches.map((match) => {
            const matchEntries = entriesByMatch.get(match.id) ?? [];
            const matchReceived = matchEntries
              .filter((entry) => entry.paymentStatus === 'Pago')
              .reduce((sum, entry) => sum + entry.cost, 0);
            const matchPending = matchEntries
              .filter((entry) => entry.paymentStatus === 'Pendente')
              .reduce((sum, entry) => sum + entry.cost, 0);

            return (
              <div key={match.id} className="panel" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{match.name}</h3>
                    <p className="text-muted" style={{ margin: '2px 0 0', fontSize: '11px' }}>
                      {new Date(match.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span className="badge badge-muted">Mensal {formatCurrencyBRL(match.valorMensal ?? 0)}</span>
                    <span className="badge badge-muted">Avulso {formatCurrencyBRL(match.valorAvulso ?? 0)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '6px', fontSize: '12px' }}>
                  <span>Recebido: <strong style={{ color: 'var(--color-primary-text)' }}>{formatCurrencyBRL(matchReceived)}</strong></span>
                  <span>Pendente: <strong style={{ color: 'var(--color-warning)' }}>{formatCurrencyBRL(matchPending)}</strong></span>
                </div>
              </div>
            );
          })}
          {filteredMatches.length === 0 && (
            <div className="panel" style={{ padding: '24px', textAlign: 'center' }}>
              <p className="text-muted" style={{ margin: 0 }}>Nenhuma pelada registrada para este mês.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail */}
      {detailModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
                Jogadores {detailModal === 'Pago' ? 'Pagos' : 'Pendentes'}
              </h2>
              <button onClick={() => setDetailModal(null)} className="btn-icon" style={{ width: '28px', height: '28px' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto', marginBottom: '12px' }}>
              {modalEntries.map((entry) => (
                <div key={entry.id} className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>{entry.userName}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {entry.paymentType} • {entry.matchName} • {formatCurrencyBRL(entry.cost)}
                    </span>
                  </div>
                  <button
                    onClick={() => togglePayment(entry)}
                    className={detailModal === 'Pago' ? 'btn-outline' : 'btn-primary'}
                    style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}
                  >
                    {detailModal === 'Pago' ? 'Pendente' : 'Pago'}
                  </button>
                </div>
              ))}

              {modalEntries.length === 0 && (
                <p className="text-muted" style={{ textAlign: 'center', padding: '20px 0', margin: 0 }}>
                  Nenhum jogador encontrado.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setDetailModal(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
