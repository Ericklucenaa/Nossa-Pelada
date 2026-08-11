import { useState } from 'react';
import { MapPin, Trash2, Edit2 } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import { formatCurrencyBRL, parseMoneyInput } from '../utils/format';
import type { Court } from '../types';

export const Courts = () => {
  const { courts, matches, addCourt, updateCourt, deleteCourt } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Court | null>(null);

  const handleDeleteCourt = (courtId: string) => {
    const linkedMatches = matches.filter((match) => match.courtId === courtId).length;
    const message = linkedMatches > 0
      ? 'Esta quadra está vinculada a peladas existentes. Ao remover, as peladas ficarão sem quadra definida. Deseja continuar?'
      : 'Deseja remover esta quadra?';

    if (window.confirm(message)) {
      deleteCourt(courtId);
    }
  };

  const openModal = (court: Court | null) => {
    setEditTarget(court);
    setShowModal(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      name: String(formData.get('name') ?? ''),
      address: String(formData.get('address') ?? ''),
      pricePerHour: parseMoneyInput(formData.get('price')),
    };
    if (editTarget) {
      updateCourt(editTarget.id, data);
    } else {
      addCourt(data);
    }
    setShowModal(false);
    setEditTarget(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <header className="page-header">
        <h1>Quadras</h1>
        <button className="btn-primary" onClick={() => openModal(null)}>+ Nova Quadra</button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {courts.map((court) => (
          <div key={court.id} className="panel" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{court.name}</h3>
                <p className="text-muted" style={{ margin: '3px 0 0', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} /> {court.address}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="btn-ghost" style={{ width: '28px', height: '28px', padding: 0 }} onClick={() => openModal(court)} title="Editar">
                  <Edit2 size={14} />
                </button>
                <button className="btn-ghost" style={{ width: '28px', height: '28px', padding: 0, color: 'var(--color-danger)' }} onClick={() => handleDeleteCourt(court.id)} title="Excluir">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span className="text-muted">Valor / Hora:</span>
              <strong style={{ color: 'var(--color-primary-text)', fontSize: '13px' }}>{formatCurrencyBRL(court.pricePerHour)}</strong>
            </div>
          </div>
        ))}

        {courts.length === 0 && (
          <div className="panel" style={{ padding: '24px', textAlign: 'center' }}>
            <p className="text-muted" style={{ margin: 0 }}>Nenhuma quadra cadastrada.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
              {editTarget ? 'Editar Quadra' : 'Cadastrar Quadra'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '10px' }}>
                <label className="input-label">Nome da Quadra</label>
                <input name="name" className="input-base" defaultValue={editTarget?.name ?? ''} required placeholder="Ex: Arena Society" />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label className="input-label">Endereço</label>
                <input name="address" className="input-base" defaultValue={editTarget?.address ?? ''} required placeholder="Ex: Rua das Flores, 123" />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label className="input-label">Preço por Hora (R$)</label>
                <input name="price" type="number" min="0" step="0.01" className="input-base" defaultValue={editTarget?.pricePerHour ?? ''} required placeholder="Ex: 120" />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => { setShowModal(false); setEditTarget(null); }}>Cancelar</button>
                <button type="submit" className="btn-primary">{editTarget ? 'Salvar' : 'Cadastrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
