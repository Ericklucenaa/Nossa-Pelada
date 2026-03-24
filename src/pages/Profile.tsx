import { useAppContext } from '../context/AppDataContext';
import { User, Activity, Trophy, Target, Share2, Flame } from 'lucide-react';

export const Profile = () => {
  const { currentUser } = useAppContext();

  if (!currentUser) return <div>No User</div>;
  const { attributes, name, position, overall, goals, assists, matchesPlayed } = currentUser;

  return (
    <div className="profile-container" style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: '800px', margin: '0 auto' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem' }}>Perfil do Jogador</h1>
          <p className="subtitle" style={{ color: 'var(--text-muted)' }}>Métricas Premium da Temporada.</p>
        </div>
      </header>

      {/* Main Stats Banner */}
      <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', padding: '2rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(69, 242, 72, 0.1) 0%, transparent 60%)', zIndex: 0, opacity: 0.5, pointerEvents: 'none' }}></div>
        
        <div style={{ flex: '1 1 auto', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
              <User size={40} color="var(--color-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{name}</h2>
              <span className="text-gradient" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{position}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <StatPill icon={<Flame />} label="Partidas" value={matchesPlayed.toString()} />
            <StatPill icon={<Trophy />} label="Gols" value={goals.toString()} />
            <StatPill icon={<Target />} label="Assist" value={assists.toString()} />
            <StatPill icon={<Share2 />} label="Média" value={matchesPlayed > 0 ? (goals/matchesPlayed).toFixed(2) : '0'} />
          </div>
        </div>

        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)', minWidth: '140px' }}>
          <span style={{ fontSize: '1rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '-0.5rem' }}>Overall</span>
          <span style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 1, color: 'var(--color-primary)', textShadow: '0 0 20px rgba(69, 242, 72, 0.4)' }}>{overall}</span>
        </div>
      </div>

      {/* Attributes Bars */}
      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity /> Atributos Detalhados</h3>
      <div className="glass-panel" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <AttributeBar name="Ritmo (PAC)" value={attributes.pace} />
        <AttributeBar name="Chute (SHO)" value={attributes.shooting} />
        <AttributeBar name="Passe (PAS)" value={attributes.passing} />
        <AttributeBar name="Drible (DRI)" value={attributes.dribbling} />
        <AttributeBar name="Defesa (DEF)" value={attributes.defending} />
        <AttributeBar name="Físico (PHY)" value={attributes.physical} />
      </div>
    </div>
  );
};

const StatPill = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <span style={{ color: 'var(--color-primary)', transform: 'scale(0.8)' }}>{icon}</span>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1 }}>{value}</span>
    </div>
  </div>
);

const AttributeBar = ({ name, value }: { name: string, value: number }) => {
  const getColor = (val: number) => {
    if (val >= 85) return 'var(--color-primary)';
    if (val >= 70) return 'var(--color-accent)';
    if (val >= 50) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        <span>{name}</span>
        <span>{value}</span>
      </div>
      <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: getColor(value), borderRadius: 'var(--radius-full)', transition: 'width 1s ease-out' }} />
      </div>
    </div>
  );
};
