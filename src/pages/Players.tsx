import { useState, useRef } from 'react';
import { useAppContext } from '../context/useAppContext';
import { Trash, UserPlus, Camera, User as UserIcon } from 'lucide-react';
import type { User } from '../types';

export const Players = () => {
  const { users, addUser, updateUser, removeUser } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openModal = (target: User | null) => {
    setEditTarget(target);
    setPhotoPreview(target?.photoUrl || '');
    setShowModal(true);
  };

  return (
    <div className="players-container" style={{ animation: 'fadeIn 0.5s ease-out', paddingBottom: '2rem' }}>
      <header className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800 }}>Jogadores</h1>
          <p className="subtitle text-muted">A nossa lista de atletas.</p>
        </div>
        <button className="btn-primary" onClick={() => openModal(null)}>
          <UserPlus size={20} /> Novo Atleta
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        {users.sort((a,b) => a.name.localeCompare(b.name)).map(u => (
          <div key={u.id} className="glass-panel" onClick={() => openModal(u)} style={{ padding: '0.8rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s', borderLeft: u.subscriptionType === 'Mensalista' ? '4px solid var(--color-primary)' : '4px solid var(--color-accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--color-surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'var(--shadow-surface)', border: '1px solid var(--border-color)' }}>
                {u.photoUrl ? (
                  <img src={u.photoUrl} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UserIcon size={24} color="var(--text-muted)" />
                )}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{u.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{u.position}</span>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Excluir ' + u.name + '?')) {
                   removeUser(u.id);
                }
              }} 
              style={{ background: 'transparent', color: 'var(--color-danger)', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}
            >
              <Trash size={18} />
            </button>
          </div>
        ))}
        {users.length === 0 && (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <p className="text-muted">Nenhum jogador cadastrado ainda.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '480px', maxHeight: '95vh', overflowY: 'auto', border: '1px solid var(--color-primary)' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: 800 }}>{editTarget ? 'Editar Atleta' : 'Novo Atleta'}</h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const data = {
                name: formData.get('name') as string,
                position: formData.get('position') as 'Linha' | 'Goleiro',
                subscriptionType: formData.get('subscriptionType') as 'Mensalista' | 'Avulso',
                photoUrl: photoPreview,
              };
              if (editTarget) {
                 updateUser(editTarget.id, data);
              } else {
                 addUser(data);
              }
              setShowModal(false);
              setEditTarget(null);
            }}>
              
              {/* Photo Upload Section */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--color-surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer', overflow: 'hidden', border: '3px solid var(--color-primary)', boxShadow: 'var(--shadow-glow)' }}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <UserIcon size={40} color="var(--text-muted)" />
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: photoPreview ? 0 : 1, transition: 'opacity 0.2s' }}>
                    <Camera size={24} color="#fff" />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    hidden 
                    accept="image/*" 
                    capture="environment"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Nome Completo / Apelido</label>
                <input name="name" className="input-base" defaultValue={editTarget?.name || ''} required placeholder="Ex: Lucas Artilheiro" />
              </div>

              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Célula / Posição</label>
                  <select name="position" className="input-base" defaultValue={editTarget?.position || 'Linha'} required>
                     <option value="Linha">Linha</option>
                     <option value="Goleiro">Goleiro</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Tipo de Membro</label>
                  <select name="subscriptionType" className="input-base" defaultValue={editTarget?.subscriptionType || 'Mensalista'} required>
                     <option value="Mensalista">Mensalista</option>
                     <option value="Avulso">Avulso</option>
                  </select>
                </div>
              </div>
              
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" style={{ border: 'none', color: 'var(--text-muted)' }} onClick={() => { setShowModal(false); setEditTarget(null); }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.7rem 1.5rem' }}>{editTarget ? 'Salvar Edição' : 'Registrar Jogador'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


