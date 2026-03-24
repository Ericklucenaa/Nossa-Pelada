import { useState } from 'react';
import { useAppContext } from '../context/AppDataContext';
import { Link } from 'react-router-dom';
import { Calendar, Users } from 'lucide-react';

export const MatchList = () => {
  const { matches, addMatch, updateMatch } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);

  const handleEditClick = (m: any) => {
    setEditTarget(m);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditTarget(null);
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
        {matches.map(m => (
          <Link to={`/matches/${m.id}`} key={m.id} className="glass-panel match-card" style={{ textDecoration: 'none', display: 'flex', padding: '1.5rem', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {m.name} {m.isFixed && <span style={{ fontSize: '0.7rem', background: 'var(--color-primary)', color: '#fff', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Fixa</span>}
              </h3>
              <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={16} /> {new Date(m.date).toLocaleDateString()}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Users size={16} /> {m.players.length} Jogador(es)</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to={`/matches/${m.id}`} className="btn-outline" style={{ fontSize: '0.8rem', textAlign: 'center', textDecoration: 'none' }}>Acessar</Link>
              <button className="btn-outline" style={{ fontSize: '0.8rem', borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }} onClick={(e) => { e.preventDefault(); handleEditClick(m); }}>Editar</button>
            </div>
          </Link>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel p-6" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editTarget ? 'Editar Pelada' : 'Criar Nova Pelada'}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const dateVal = formData.get('date') as string;
              const timeVal = formData.get('time') as string;
              const timeEndVal = formData.get('timeEnd') as string;
              const dateTimeObj = new Date(dateVal + 'T' + timeVal);
              const dateTimeEndObj = new Date(dateVal + 'T' + timeEndVal);
              
              const updateData = {
                name: formData.get('name') as string,
                courtId: formData.get('courtId') as string,
                date: dateTimeObj.toISOString(),
                endTime: dateTimeEndObj.toISOString(),
                isFixed: formData.get('isFixed') === 'on',
                valorAvulso: parseFloat(formData.get('valorAvulso') as string),
                valorMensal: parseFloat(formData.get('valorMensal') as string)
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
                <input name="name" className="input-base" defaultValue={editTarget?.name || ''} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 2fr) 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Data</label>
                  <input name="date" type="date" className="input-base" defaultValue={editTarget ? new Date(editTarget.date).toISOString().split('T')[0] : ''} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Início</label>
                  <input name="time" type="time" className="input-base" defaultValue={editTarget ? new Date(editTarget.date).toTimeString().substring(0,5) : ''} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Fim</label>
                  <input name="timeEnd" type="time" className="input-base" defaultValue={editTarget?.endTime ? new Date(editTarget.endTime).toTimeString().substring(0,5) : ''} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Valor Avulso (R$)</label>
                  <input name="valorAvulso" type="number" step="0.01" className="input-base" defaultValue={editTarget?.valorAvulso || ''} placeholder="Ex: 20" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Valor Mensal (R$)</label>
                  <input name="valorMensal" type="number" step="0.01" className="input-base" defaultValue={editTarget?.valorMensal || ''} placeholder="Ex: 60" required />
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Local / Quadra</label>
                <input name="courtId" type="text" placeholder="Nome da quadra..." className="input-base" defaultValue={editTarget?.courtId || ''} required />
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
