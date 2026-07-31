import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
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
    () => matches.filter(m => savedMatchIds.includes(m.id) && m.organizerId !== currentUser?.id),
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
    <div className="matches-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-gradient">Peladas</h1>
          <p className="subtitle text-muted">Gerencie ou crie suas partidas.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Nova Pelada</button>
      </header>

      <div className="matches-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sortedMatches.map((match) => {
          const confirmedCount = match.players.filter(p => p.attendance === 'Confirmado').length;
          const matchDate = new Date(getNextMatchDate(match.date, match.isFixed));
          const dayNum = matchDate.toLocaleDateString('pt-BR', { day: '2-digit' });
          const monthAbbr = matchDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
          const weekday = matchDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
          const startTime = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const endTime = match.endTime ? new Date(match.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

          return (
            <Link
              to={`/matches/${match.id}`}
              key={match.id}
              className="glass-panel"
              style={{ textDecoration: 'none', display: 'flex', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(69,242,72,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
            >
              {/* Left date accent */}
              <div style={{ width: '70px', flexShrink: 0, background: 'linear-gradient(180deg, var(--color-primary) 0%, #1a7a1a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem 0', gap: '2px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(0,0,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{weekday}</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0a0a0a', lineHeight: 1 }}>{dayNum}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(0,0,0,0.7)', textTransform: 'uppercase' }}>{monthAbbr}</span>
              </div>
              {/* Main content + Actions container */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Info Section */}
                <div style={{ flex: 1, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.name}</h3>
                    {match.isFixed && <span style={{ fontSize: '0.65rem', background: 'var(--color-primary)', color: '#000', padding: '2px 7px', borderRadius: '20px', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>Fixa</span>}
                  </div>

                  {/* Info chips */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '6px' }}>
                      🕐 {startTime}{endTime ? ` – ${endTime}` : ''}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: confirmedCount > 0 ? 'var(--color-primary)' : 'var(--text-muted)', background: confirmedCount > 0 ? 'rgba(69,242,72,0.08)' : 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '6px', fontWeight: confirmedCount > 0 ? 600 : 400 }}>
                      <Users size={12} /> {confirmedCount}/{match.players.length}
                    </span>
                    {match.courtId && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                        📍 {getCourtLabel(match.courtId)}
                      </span>
                    )}
                  </div>

                  {/* Financial row */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-accent)', background: 'rgba(102,252,241,0.08)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                      Avulso {formatCurrencyBRL(match.valorAvulso ?? 0)}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-warning)', background: 'rgba(255,170,0,0.08)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                      Mensalista {formatCurrencyBRL(match.valorMensal ?? 0)}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    gap: '0.4rem', 
                    padding: '0.75rem 1.25rem', 
                    justifyContent: 'center', 
                    flexShrink: 0,
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(0,0,0,0.1)'
                  }} 
                  onClick={e => e.preventDefault()}
                >
                  <Link to={`/matches/${match.id}`} className="btn-outline" style={{ flex: 1, fontSize: '0.7rem', textAlign: 'center', textDecoration: 'none', padding: '0.4rem 0.6rem', whiteSpace: 'nowrap' }}>
                    Acessar
                  </Link>
                  <Link to={`/matches/${match.id}#jogo`} className="btn-primary" style={{ flex: 1, fontSize: '0.7rem', textAlign: 'center', textDecoration: 'none', padding: '0.4rem 0.6rem', whiteSpace: 'nowrap', boxShadow: 'none' }} onClick={e => e.stopPropagation()}>
                    Estatísticas
                  </Link>
                  <button className="btn-outline" style={{ flex: 1, fontSize: '0.7rem', borderColor: 'var(--color-accent)', color: 'var(--color-accent)', padding: '0.4rem 0.6rem', whiteSpace: 'nowrap' }} onClick={(e) => { e.preventDefault(); handleEditClick(match); }}>
                    Editar
                  </button>
                </div>
              </div>
            </Link>
          );
        })}
        {sortedMatches.length === 0 && (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <p className="text-muted">Nenhuma pelada criada ainda. Crie a primeira!</p>
          </div>
        )}
      </div>

      {savedMatches.length > 0 && (
        <section style={{ marginTop: '2.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning)' }}>
            📌 Peladas Salvas
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {savedMatches.map(match => {
              const confirmedCount = match.players.filter(p => p.attendance === 'Confirmado').length;
              const matchDate = new Date(getNextMatchDate(match.date, match.isFixed));
              const alreadyIn = currentUser && match.players.some(p => p.userId === currentUser.id);
              return (
                <div key={match.id} className="glass-panel" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 1.25rem', borderLeft: '4px solid var(--color-warning)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{match.name}</h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      📅 {matchDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}  •  👥 {confirmedCount} confirmados
                      {alreadyIn && <span style={{ marginLeft: '0.5rem', color: 'var(--color-primary)', fontWeight: 700 }}>✅ Na lista</span>}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <Link to={`/matches/${match.id}`} className="btn-primary" style={{ fontSize: '0.72rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}>Ver</Link>
                    <button className="btn-outline" style={{ fontSize: '0.72rem', padding: '0.4rem 0.8rem', borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }} onClick={() => unsaveMatch(match.id)}>Remover</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem 1rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '440px', margin: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editTarget ? 'Editar Pelada' : 'Criar Nova Pelada'}</h2>
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
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nome da Pelada</label>
                <input name="name" className="input-base" defaultValue={editTarget?.name ?? ''} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 2fr) 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Data</label>
                  <input name="date" type="date" className="input-base" defaultValue={editTarget ? new Date(editTarget.date).toISOString().split('T')[0] : ''} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Início</label>
                  <input name="time" type="time" className="input-base" defaultValue={editTarget ? new Date(editTarget.date).toTimeString().slice(0, 5) : ''} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Fim</label>
                  <input name="timeEnd" type="time" className="input-base" defaultValue={editTarget?.endTime ? new Date(editTarget.endTime).toTimeString().slice(0, 5) : editTarget ? getDefaultEndTime(editTarget.date) : ''} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Valor Avulso</label>
                  <input name="valorAvulso" type="number" step="0.01" min="0" className="input-base" defaultValue={editTarget?.valorAvulso ?? ''} placeholder="Ex: 20" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Valor Mensal</label>
                  <input name="valorMensal" type="number" step="0.01" min="0" className="input-base" defaultValue={editTarget?.valorMensal ?? ''} placeholder="Ex: 60" required />
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Quadra</label>
                <select name="courtId" className="input-base" defaultValue={editTarget?.courtId ?? ''} style={{ background: 'var(--color-surface)' }}>
                  <option value="">Sem quadra definida</option>
                  {courts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" name="isFixed" id="isFixed" style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--color-primary)' }} defaultChecked={editTarget?.isFixed} />
                <label htmlFor="isFixed" style={{ fontSize: '0.9rem' }}>Pelada Fixa (Semanal)</label>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary">{editTarget ? 'Salvar Edição' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
