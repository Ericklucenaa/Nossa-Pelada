import { useState } from 'react';
import { MapPin, Info, Trash } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import { formatCurrencyBRL, parseMoneyInput } from '../utils/format';

export const Courts = () => {
  const { courts, matches, addCourt, deleteCourt } = useAppContext();
  const [showModal, setShowModal] = useState(false);

  const handleDeleteCourt = (courtId: string) => {
    const linkedMatches = matches.filter((match) => match.courtId === courtId).length;
    const message = linkedMatches > 0
      ? 'Esta quadra está vinculada a peladas existentes. Ao remover, as peladas ficarão sem quadra definida. Deseja continuar?'
      : 'Deseja remover esta quadra?';

    if (window.confirm(message)) {
      deleteCourt(courtId);
    }
  };

  return (
    <div className="courts-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient">Quadras</h1>
          <p className="subtitle text-muted">Locais utilizados para os jogos.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Nova Quadra</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {courts.map((court) => (
          <div key={court.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin color="var(--color-primary)" /> {court.name}</h3>
              <button onClick={() => handleDeleteCourt(court.id)} style={{ background: 'transparent', color: 'var(--color-danger)' }}><Trash size={20} /></button>
            </div>
            <p className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Info size={16} /> {court.address}</p>
            <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Valor / Hora</span>
              <strong style={{ color: 'var(--color-primary)', fontSize: '1.25rem' }}>{formatCurrencyBRL(court.pricePerHour)}</strong>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel p-6" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Cadastrar Quadra</h2>
            <form onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              addCourt({
                name: String(formData.get('name') ?? ''),
                address: String(formData.get('address') ?? ''),
                pricePerHour: parseMoneyInput(formData.get('price')),
              });
              setShowModal(false);
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nome da Quadra</label>
                <input name="name" className="input-base" required />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Endereço</label>
                <input name="address" className="input-base" required />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Preço por Hora</label>
                <input name="price" type="number" min="0" step="0.01" className="input-base" required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
