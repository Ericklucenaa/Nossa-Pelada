import { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { User as UserIcon, Edit3, X, Save } from 'lucide-react';
import type { User as AppUser, Position } from '../types';

export const Profile = () => {
  const { currentUser, updateUser } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<AppUser | null>(null);

  if (!currentUser) return (
    <div className="panel" style={{ padding: '24px', textAlign: 'center' }}>
      <p className="text-muted" style={{ margin: 0 }}>Nenhum jogador encontrado. Faça login novamente.</p>
    </div>
  );

  const { name, position, goals, assists, matchesPlayed } = currentUser;

  const startEditing = () => {
    setEditData({ ...currentUser });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handleSave = () => {
    if (editData) {
      updateUser(currentUser.id, {
        name: editData.name,
        position: editData.position,
      });
      setIsEditing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <header className="page-header">
        <h1>Meu Perfil</h1>
        {!isEditing ? (
          <button className="btn-primary" onClick={startEditing}>
            <Edit3 size={14} /> Editar
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn-outline" onClick={cancelEditing}>
              <X size={14} /> Cancelar
            </button>
            <button className="btn-primary" onClick={handleSave}>
              <Save size={14} /> Salvar
            </button>
          </div>
        )}
      </header>

      {/* Main Profile Info */}
      <div className="panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0 }}>
            {currentUser.photoUrl ? (
              <img src={currentUser.photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <UserIcon size={28} color="var(--text-muted)" />
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  className="input-base" 
                  value={editData?.name ?? ''} 
                  onChange={e => setEditData(prev => prev ? {...prev, name: e.target.value} : null)}
                  placeholder="Seu Nome / Apelido"
                />
                <select 
                  className="input-base" 
                  value={editData?.position ?? 'Linha'} 
                  onChange={e => setEditData(prev => prev ? {...prev, position: e.target.value as Position} : null)}
                >
                  <option value="Linha">Linha</option>
                  <option value="Goleiro">Goleiro</option>
                </select>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main)' }}>{name}</h2>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className="badge badge-primary">{position}</span>
                  <span className="badge badge-muted">OVR {currentUser.overall || 50}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          <div className="panel" style={{ padding: '10px 12px', background: 'var(--color-surface-hover)' }}>
            <span className="metric-card-label">Partidas</span>
            <strong style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginTop: '2px' }}>{matchesPlayed}</strong>
          </div>
          <div className="panel" style={{ padding: '10px 12px', background: 'var(--color-surface-hover)' }}>
            <span className="metric-card-label">Gols</span>
            <strong style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginTop: '2px' }}>{goals}</strong>
          </div>
          <div className="panel" style={{ padding: '10px 12px', background: 'var(--color-surface-hover)' }}>
            <span className="metric-card-label">Assistências</span>
            <strong style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginTop: '2px' }}>{assists}</strong>
          </div>
          <div className="panel" style={{ padding: '10px 12px', background: 'var(--color-surface-hover)' }}>
            <span className="metric-card-label">Média Gols</span>
            <strong style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginTop: '2px' }}>
              {matchesPlayed > 0 ? (goals / matchesPlayed).toFixed(1) : '0.0'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
