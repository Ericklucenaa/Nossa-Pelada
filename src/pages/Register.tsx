import { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import type { PlayerAttributes, Position } from '../types';

const ATTRIBUTE_KEYS: Array<keyof PlayerAttributes> = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];

export const Register = ({ setMode }: { setMode: (m: 'login' | 'register') => void }) => {
  const { addUser } = useAppContext();
  const [name, setName] = useState('');
  const [position, setPosition] = useState<Position>('Linha');
  const [attributes, setAttributes] = useState<PlayerAttributes>({
    pace: 50,
    shooting: 50,
    passing: 50,
    dribbling: 50,
    defending: 50,
    physical: 50,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    addUser({
      name: name.trim(),
      position,
      attributes,
      subscriptionType: 'Mensalista',
      photoUrl: '',
    });
    setMode('login');
  };

  const updateAttribute = (attribute: keyof PlayerAttributes, value: number) => {
    setAttributes((prev) => ({ ...prev, [attribute]: value }));
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '3rem 2rem' }}>
        <h1 className="text-gradient" style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '0.5rem' }}>Criar Jogador</h1>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '2rem' }}>Defina seu estilo de jogo.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nome (ou Apelido)</label>
            <input className="input-base" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Posição</label>
            <select className="input-base" value={position} onChange={(event) => setPosition(event.target.value as Position)}>
              <option value="Linha">Linha</option>
              <option value="Goleiro">Goleiro</option>
            </select>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Distribuição Inicial (FIFA)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {ATTRIBUTE_KEYS.map((attribute) => (
                <div key={attribute}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    {attribute} <span>{attributes[attribute]}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="99"
                    value={attributes[attribute]}
                    onChange={(event) => updateAttribute(attribute, Number(event.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
            Finalizar Cadastro
          </button>
        </form>

        <button className="btn-outline" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', border: 'none' }} onClick={() => setMode('login')}>
          Acessar uma conta existente
        </button>
      </div>
    </div>
  );
};
