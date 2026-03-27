import { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { User, Trophy, Target, Share2, Flame, Save, Edit3, X } from 'lucide-react';
import type { User as AppUser, Position } from '../types';

export const Profile = () => {
  const { currentUser, updateUser } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<AppUser | null>(null);

  if (!currentUser) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <p className="text-muted">Nenhum jogador encontrado. Faça login novamente.</p>
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
    <div className="profile-container" style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800 }}>Meu Perfil</h1>
          <p className="subtitle" style={{ color: 'var(--text-muted)' }}>Métricas da sua temporada.</p>
        </div>
        {!isEditing ? (
          <button className="btn-primary" onClick={startEditing}>
            <Edit3 size={18} /> Editar Perfil
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-outline" onClick={cancelEditing} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
              <X size={18} /> Cancelar
            </button>
            <button className="btn-primary" onClick={handleSave}>
              <Save size={18} /> Salvar Alterações
            </button>
          </div>
        )}
      </header>

      {/* Main Stats Banner */}
      <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', padding: '2rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(69, 242, 72, 0.1) 0%, transparent 60%)', zIndex: 0, opacity: 0.5, pointerEvents: 'none' }}></div>
        
        <div style={{ flex: '1 1 auto', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'var(--color-surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)', border: '2px solid var(--border-color)' }}>
              <User size={50} color="var(--color-primary)" />
            </div>
            <div style={{ flex: 1 }}>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <input 
                    className="input-base" 
                    value={editData?.name} 
                    onChange={e => setEditData(prev => prev ? {...prev, name: e.target.value} : null)}
                    placeholder="Seu Nome / Apelido"
                    style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}
                  />
                  <select 
                    className="input-base" 
                    value={editData?.position} 
                    onChange={e => setEditData(prev => prev ? {...prev, position: e.target.value as Position} : null)}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    <option value="Linha">Linha</option>
                    <option value="Goleiro">Goleiro</option>
                  </select>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: '2.2rem', margin: '0 0 0.2rem 0', fontWeight: 800 }}>{name}</h2>
                  <span className="text-gradient" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1rem' }}>{position}</span>
                </>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <StatPill icon={<Flame />} label="Partidas" value={matchesPlayed.toString()} />
            <StatPill icon={<Trophy />} label="Gols" value={goals.toString()} />
            <StatPill icon={<Target />} label="Assist" value={assists.toString()} />
            <StatPill icon={<Share2 />} label="Média" value={matchesPlayed > 0 ? (goals/matchesPlayed).toFixed(1) : '0.0'} />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatPill = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div style={{ background: 'var(--color-surface-light)', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '0.8rem', border: '1px solid var(--border-color)' }}>
    <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>{label}</span>
      <span style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1 }}>{value}</span>
    </div>
  </div>
);
