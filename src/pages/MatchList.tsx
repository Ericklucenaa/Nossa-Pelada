import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, MapPin, Clock, Edit2 } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import type { Match } from '../types';
import { buildIsoFromDateAndTime, formatCurrencyBRL, parseMoneyInput, getNextMatchDate } from '../utils/format';

export const MatchList = () => {
  const { matches, courts, addMatch, updateMatch, currentUser, savedMatchIds, unsaveMatch } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Match | null>(null);

  // My matches: created by me (or old matches without organizerId owned by me)
  const sortedMatches = useMemo(
    () => [...matches]
      .filter(m => !m.organizerId || m.organizerId === currentUser?.id)
      .sort((a, b) => {
        const dateA = new Date(getNextMatchDate(a.date, a.isFixed)).getTime();
        const dateB = new Date(getNextMatchDate(b.date, b.isFixed)).getTime();
        return dateA - dateB;
      }),
    [matches, currentUser],
  );

  // Saved matches from other organizers
  const savedMatches = useMemo(
    () => matches.filter(m => (savedMatchIds ?? []).includes(m.id) && m.organizerId !== currentUser?.id),
    [matches, savedMatchIds, currentUser],
  );

  const handleEditClick = (match: Match) => {
    setEditTarget(match);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditTarget(null);
  };

  const getCourtLabel = (courtId: string) => {
    const court = courts.find(c => c.id === courtId);
    return court ? court.name : (courtId || 'Quadra não definida');
  };

  const getDefaultEndTime = (dateIso: string) => {
    const date = new Date(dateIso);
    if (Number.isNaN(date.getTime())) return '';
    return new Date(date.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <header className="page-header">
        <h1>Peladas</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Nova Pelada</button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedMatches.map((match) => {
          const confirmedCount = match.players.filter(p => p.attendance === 'Confirmado').length;
          const matchDate = new Date(getNextMatchDate(match.date, match.isFixed));
          const dateStr = matchDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
          const startTime = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const endTime = match.endTime ? new Date(match.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

          return (
            <div
              key={match.id}
              className="panel"
              style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {/* Header / Title Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <Link to={`/matches/${match.id}`} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {match.name}
                    </Link>
                    {match.isFixed && <span className="badge badge-primary">Fixa</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} /> {dateStr} às {startTime}{endTime ? ` – ${endTime}` : ''}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: confirmedCount > 0 ? 'var(--color-primary-text)' : 'var(--text-muted)', fontWeight: confirmedCount > 0 ? 600 : 400 }}>
                      <Users size={13} /> {confirmedCount}/{match.players.length}
                    </span>
                    {match.courtId && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} /> {getCourtLabel(match.courtId)}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className="btn-ghost"
                  style={{ width: '28px', height: '28px', padding: 0 }}
                  onClick={() => handleEditClick(match)}
                  title="Editar Pelada"
                >
                  <Edit2 size={14} />
                </button>
              </div>

              {/* Footer / Values & Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '8px', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Avulso: <strong style={{ color: 'var(--text-main)' }}>{formatCurrencyBRL(match.valorAvulso ?? 0)}</strong></span>
                  <span>•</span>
                  <span>Mensal: <strong style={{ color: 'var(--text-main)' }}>{formatCurrencyBRL(match.valorMensal ?? 0)}</strong></span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <Link to={`/matches/${match.id}#jogo`} className="btn-outline" style={{ height: '28px', fontSize: '12px', padding: '0 8px' }}>
                    Stats
                  </Link>
                  <Link to={`/matches/${match.id}`} className="btn-primary" style={{ height: '28px', fontSize: '12px', padding: '0 10px' }}>
                    Abrir
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {sortedMatches.length === 0 && (
          <div className="panel" style={{ padding: '24px', textAlign: 'center' }}>
            <p className="text-muted" style={{ margin: 0 }}>Nenhuma pelada criada ainda.</p>
          </div>
        )}
      </div>

      {savedMatches.length > 0 && (
        <section style={{ marginTop: '12px' }}>
          <div style={{ marginBottom: '8px' }}>
            <h2 className="section-title">Peladas Salvas</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {savedMatches.map(match => {
              const confirmedCount = match.players.filter(p => p.attendance === 'Confirmado').length;
              const matchDate = new Date(getNextMatchDate(match.date, match.isFixed));
              const alreadyIn = currentUser && match.players.some(p => p.userId === currentUser.id);
              return (
                <div key={match.id} className="panel" style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 12px', justifyContent: 'space-between' }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>{match.name}</h3>
                    <p className="text-muted" style={{ margin: '2px 0 0', fontSize: '11px' }}>
                      {matchDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} • {confirmedCount} confirmados
                      {alreadyIn && <span style={{ marginLeft: '6px', color: 'var(--color-primary)', fontWeight: 600 }}>• Na lista</span>}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <Link to={`/matches/${match.id}`} className="btn-primary" style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}>Ver</Link>
                    <button className="btn-outline" style={{ height: '28px', fontSize: '11px', padding: '0 8px' }} onClick={() => unsaveMatch(match.id)}>Remover</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
              {editTarget ? 'Editar Pelada' : 'Criar Nova Pelada'}
            </h2>
            <form onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const dateValue = String(formData.get('date') ?? '');
              const startTimeValue = String(formData.get('time') ?? '');
              const endTimeValue = String(formData.get('timeEnd') ?? '');

              if (!dateValue || !startTimeValue || !endTimeValue) return;

              const startDateTime = buildIsoFromDateAndTime(dateValue, startTimeValue);
              const endDateTime = buildIsoFromDateAndTime(dateValue, endTimeValue);

              if (new Date(endDateTime).getTime() <= new Date(startDateTime).getTime()) {
                window.alert('O horário final precisa ser maior que o horário inicial.');
                return;
              }

              const updateData = {
                name: String(formData.get('name') ?? ''),
                courtId: String(formData.get('courtId') ?? ''),
                date: startDateTime,
                endTime: endDateTime,
                isFixed: formData.get('isFixed') === 'on',
                valorAvulso: parseMoneyInput(formData.get('valorAvulso')),
                valorMensal: parseMoneyInput(formData.get('valorMensal')),
              };

              if (editTarget) {
                updateMatch(editTarget.id, updateData);
              } else {
                addMatch({ ...updateData, players: [] });
              }
              handleCloseModal();
            }}>
              <div style={{ marginBottom: '10px' }}>
                <label className="input-label">Nome da Pelada</label>
                <input name="name" className="input-base" defaultValue={editTarget?.name ?? ''} required placeholder="Ex: Pelada de Terça" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <label className="input-label">Data</label>
                  <input name="date" type="date" className="input-base" defaultValue={editTarget ? new Date(editTarget.date).toISOString().split('T')[0] : ''} required />
                </div>
                <div>
                  <label className="input-label">Início</label>
                  <input name="time" type="time" className="input-base" defaultValue={editTarget ? new Date(editTarget.date).toTimeString().slice(0, 5) : ''} required />
                </div>
                <div>
                  <label className="input-label">Fim</label>
                  <input name="timeEnd" type="time" className="input-base" defaultValue={editTarget?.endTime ? new Date(editTarget.endTime).toTimeString().slice(0, 5) : editTarget ? getDefaultEndTime(editTarget.date) : ''} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <label className="input-label">Valor Avulso (R$)</label>
                  <input name="valorAvulso" type="number" step="0.01" min="0" className="input-base" defaultValue={editTarget?.valorAvulso ?? ''} placeholder="Ex: 20" required />
                </div>
                <div>
                  <label className="input-label">Valor Mensal (R$)</label>
                  <input name="valorMensal" type="number" step="0.01" min="0" className="input-base" defaultValue={editTarget?.valorMensal ?? ''} placeholder="Ex: 60" required />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label className="input-label">Quadra</label>
                <select name="courtId" className="input-base" defaultValue={editTarget?.courtId ?? ''}>
                  <option value="">Sem quadra definida</option>
                  {courts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" name="isFixed" id="isFixed" style={{ accentColor: 'var(--color-primary)' }} defaultChecked={editTarget?.isFixed} />
                <label htmlFor="isFixed" style={{ fontSize: '12px', cursor: 'pointer' }}>Pelada Fixa (Semanal)</label>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary">{editTarget ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
