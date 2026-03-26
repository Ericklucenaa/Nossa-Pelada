import { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { Shield, Trash, UserPlus } from 'lucide-react';

import type { User } from '../types';

export const Players = () => {
  const { users, addUser, updateUser, removeUser } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);

  return (
    <div className="players-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient">Jogadores</h1>
          <p className="subtitle text-muted">Gerencie a lista de atletas da nossa pelada.</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditTarget(null); setShowModal(true); }}>
          <UserPlus size={20} /> Novo
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        {users.map(u => (
          <div key={u.id} className="glass-panel" onClick={() => { setEditTarget(u); setShowModal(true); }} style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: 'var(--shadow-surface)' }}>
                {u.overall}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{u.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 700 }}>{u.position}</span>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Excluir ' + u.name + '? (Isso o removerá de peladas e pontuações.)')) {
                   removeUser(u.id);
                }
              }} 
              style={{ background: 'transparent', color: 'var(--color-danger)', padding: '0.5rem' }}
            >
              <Trash size={20} />
            </button>
          </div>
        ))}
        {users.length === 0 && <p className="text-muted text-center" style={{ marginTop: '2rem' }}>O banco de jogadores está vazio.</p>}
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editTarget ? 'Editar Jogador' : 'Adicionar Jogador'}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const data = {
                name: formData.get('name') as string,
                position: formData.get('position') as 'Linha' | 'Goleiro',
                subscriptionType: formData.get('subscriptionType') as 'Mensalista' | 'Avulso',
                attributes: {
                  pace: parseInt(formData.get('pace') as string),
                  shooting: parseInt(formData.get('shooting') as string),
                  passing: parseInt(formData.get('passing') as string),
                  dribbling: parseInt(formData.get('dribbling') as string),
                  defending: parseInt(formData.get('defending') as string),
                  physical: parseInt(formData.get('physical') as string)
                }
              };
              if (editTarget) {
                 updateUser(editTarget.id, data);
              } else {
                 addUser({ ...data, photoUrl: '' });
              }
              setShowModal(false);
              setEditTarget(null);
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nome do Jogador</label>
                <input name="name" className="input-base" defaultValue={editTarget?.name || ''} required />
              </div>
              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Posição</label>
                  <select name="position" className="input-base" defaultValue={editTarget?.position || 'Linha'} required>
                     <option value="Linha">Jogador de Linha</option>
                     <option value="Goleiro">Goleiro</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Plano (Pagamento)</label>
                  <select name="subscriptionType" className="input-base" defaultValue={editTarget?.subscriptionType || 'Mensalista'} required>
                     <option value="Mensalista">Mensalista</option>
                     <option value="Avulso">Avulso</option>
                  </select>
                </div>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={18} /> Atributos (1-99)</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>Ritmo (PAC)</label>
                    <input name="pace" type="number" min="1" max="99" defaultValue={editTarget?.attributes.pace || 70} className="input-base" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>Chute (SHO)</label>
                    <input name="shooting" type="number" min="1" max="99" defaultValue={editTarget?.attributes.shooting || 70} className="input-base" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>Passe (PAS)</label>
                    <input name="passing" type="number" min="1" max="99" defaultValue={editTarget?.attributes.passing || 70} className="input-base" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>Drible (DRI)</label>
                    <input name="dribbling" type="number" min="1" max="99" defaultValue={editTarget?.attributes.dribbling || 70} className="input-base" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>Defesa (DEF)</label>
                    <input name="defending" type="number" min="1" max="99" defaultValue={editTarget?.attributes.defending || 70} className="input-base" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>Físico (PHY)</label>
                    <input name="physical" type="number" min="1" max="99" defaultValue={editTarget?.attributes.physical || 70} className="input-base" required />
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => { setShowModal(false); setEditTarget(null); }}>Cancelar</button>
                <button type="submit" className="btn-primary">{editTarget ? 'Salvar Edição' : 'Registrar Atleta'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
