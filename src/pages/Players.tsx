import { useState, useRef } from 'react';
import { useAppContext } from '../context/useAppContext';
import { Trash2, UserPlus, Camera, User as UserIcon, Loader } from 'lucide-react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import type { User } from '../types';

export const Players = () => {
  const { users, addUser, updateUser, removeUser } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const MAX = 200;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      setPhotoPreview(canvas.toDataURL('image/jpeg', 0.7));
      canvas.toBlob(blob => setPhotoBlob(blob), 'image/jpeg', 0.7);
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  const openModal = (target: User | null) => {
    setEditTarget(target);
    setPhotoPreview(target?.photoUrl || '');
    setPhotoBlob(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setPhotoBlob(null);
    setPhotoPreview('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setUploading(true);

    let resolvedPhotoUrl = editTarget?.photoUrl || '';

    if (photoBlob) {
      try {
        const photoId = crypto.randomUUID();
        const fileRef = storageRef(storage, `player-photos/${photoId}.jpg`);
        await uploadBytes(fileRef, photoBlob, { contentType: 'image/jpeg' });
        resolvedPhotoUrl = await getDownloadURL(fileRef);
      } catch (err) {
        console.error('Falha no upload da foto:', err);
        resolvedPhotoUrl = photoPreview;
      }
    } else if (!photoPreview && !editTarget?.photoUrl) {
      resolvedPhotoUrl = '';
    } else if (!photoBlob && photoPreview) {
      resolvedPhotoUrl = editTarget?.photoUrl || photoPreview;
    }

    setUploading(false);

    const data = {
      name: formData.get('name') as string,
      position: formData.get('position') as 'Linha' | 'Goleiro',
      subscriptionType: formData.get('subscriptionType') as 'Mensalista' | 'Avulso',
      photoUrl: resolvedPhotoUrl,
      overall: parseInt(formData.get('overall') as string) || 50,
    };

    if (editTarget) {
      updateUser(editTarget.id, data);
    } else {
      addUser(data);
    }
    closeModal();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <header className="page-header">
        <h1>Jogadores ({users.length})</h1>
        <button className="btn-primary" onClick={() => openModal(null)}>
          <UserPlus size={14} /> Novo Atleta
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {users.sort((a,b) => a.name.localeCompare(b.name)).map(u => (
          <div
            key={u.id}
            className="panel"
            onClick={() => openModal(u)}
            style={{
              padding: '8px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                {u.photoUrl ? (
                  <img src={u.photoUrl} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UserIcon size={16} color="var(--text-muted)" />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</span>
                  <span className="badge badge-primary">OVR {u.overall || 50}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '2px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>{u.position}</span>
                  <span>•</span>
                  <span>{u.subscriptionType}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Excluir ' + u.name + '?')) {
                  removeUser(u.id);
                }
              }} 
              className="btn-ghost"
              style={{ width: '28px', height: '28px', padding: 0, color: 'var(--color-danger)' }}
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {users.length === 0 && (
          <div className="panel" style={{ padding: '24px', textAlign: 'center' }}>
            <p className="text-muted" style={{ margin: 0 }}>Nenhum jogador cadastrado ainda.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
              {editTarget ? 'Editar Atleta' : 'Novo Atleta'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {/* Photo Upload */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--color-surface-hover)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <UserIcon size={28} color="var(--text-muted)" />
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: photoPreview ? 0 : 0.6 }}>
                    <Camera size={18} color="#fff" />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    hidden 
                    accept="image/*" 
                  />
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label className="input-label">Nome / Apelido</label>
                <input name="name" className="input-base" defaultValue={editTarget?.name || ''} required placeholder="Ex: Lucas Silva" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <label className="input-label">Posição</label>
                  <select name="position" className="input-base" defaultValue={editTarget?.position || 'Linha'} required>
                    <option value="Linha">Linha</option>
                    <option value="Goleiro">Goleiro</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Tipo de Membro</label>
                  <select name="subscriptionType" className="input-base" defaultValue={editTarget?.subscriptionType || 'Mensalista'} required>
                    <option value="Mensalista">Mensalista</option>
                    <option value="Avulso">Avulso</option>
                  </select>
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label">Nível / Overall (0-100)</label>
                <input type="number" name="overall" min="0" max="100" className="input-base" defaultValue={editTarget?.overall || 50} required />
              </div>
              
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={closeModal} disabled={uploading}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={uploading}>
                  {uploading ? <><Loader size={14} className="spin" /> Salvando...</> : (editTarget ? 'Salvar' : 'Cadastrar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


