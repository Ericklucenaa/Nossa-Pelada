import { useAppContext } from '../context/AppDataContext';
import { MapPin, Info, Trash } from 'lucide-react';
import { useState } from 'react';

export const Courts = () => {
  const { courts, addCourt, deleteCourt } = useAppContext();
  const [showModal, setShowModal] = useState(false);

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
        {courts.map(c => (
          <div key={c.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--color-primary)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin color="var(--color-primary)" /> {c.name}</h3>
               <button onClick={() => deleteCourt(c.id)} style={{ background: 'transparent', color: 'var(--color-danger)' }}><Trash size={20} /></button>
             </div>
             <p className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Info size={16} /> {c.address}</p>
             <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Valor / Hora</span>
               <strong style={{ color: 'var(--color-primary)', fontSize: '1.25rem' }}>R$ {c.pricePerHour}</strong>
             </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel p-6" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Cadastrar Quadra</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              addCourt({
                name: formData.get('name') as string,
                address: formData.get('address') as string,
                pricePerHour: parseFloat(formData.get('price') as string) || 0
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Preço por Hora (R$)</label>
                <input name="price" type="number" step="0.01" className="input-base" required />
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
