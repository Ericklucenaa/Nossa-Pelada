import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, Court, Match, MatchPlayer } from '../types';
import { calculateOverall } from '../types';

interface AppState {
  users: User[];
  courts: Court[];
  matches: Match[];
  currentUser: User | null;
  theme: 'light' | 'dark';
}

interface AppContextType extends AppState {
  addUser: (user: Omit<User, 'id' | 'overall' | 'goals' | 'assists' | 'matchesPlayed'>) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  removeUser: (userId: string) => void;
  addCourt: (court: Omit<Court, 'id'>) => void;
  addMatch: (match: Omit<Match, 'id' | 'stats'>) => void;
  updateMatch: (matchId: string, updates: Partial<Match>) => void;
  updateMatchPlayer: (matchId: string, playerId: string, updates: Partial<MatchPlayer>) => void;
  login: (userId: string) => void;
  logout: () => void;
  drawTeams: (matchId: string) => void;
  recordEvent: (matchId: string, playerId: string, type: 'goal' | 'assist') => void;
  swapPlayers: (matchId: string, playerOutId: string, playerInId: string) => void;
  toggleTheme: () => void;
  joinMatch: (matchId: string, userId: string) => void;
  removeMatch: (matchId: string) => void;
  deleteCourt: (courtId: string) => void;
}

const defaultMockUsers: User[] = [
  { id: '1', name: 'João (Admin)', position: 'Linha', photoUrl: '', matchesPlayed: 10, goals: 5, assists: 3, attributes: { pace: 80, shooting: 75, passing: 85, dribbling: 82, defending: 60, physical: 70 }, overall: 78, subscriptionType: 'Mensalista' },
  { id: '2', name: 'Marcos (Goleiro)', position: 'Goleiro', photoUrl: '', matchesPlayed: 10, goals: 0, assists: 1, attributes: { pace: 50, shooting: 20, passing: 60, dribbling: 40, defending: 85, physical: 80 }, overall: 80, subscriptionType: 'Avulso' },
  { id: '3', name: 'Lucas (Artilheiro)', position: 'Linha', photoUrl: '', matchesPlayed: 8, goals: 12, assists: 2, attributes: { pace: 85, shooting: 90, passing: 70, dribbling: 88, defending: 40, physical: 75 }, overall: 84, subscriptionType: 'Mensalista' },
  { id: '4', name: 'Thiago (Xerife)', position: 'Linha', photoUrl: '', matchesPlayed: 9, goals: 1, assists: 1, attributes: { pace: 70, shooting: 40, passing: 65, dribbling: 50, defending: 90, physical: 88 }, overall: 81, subscriptionType: 'Mensalista' },
  { id: '5', name: 'Pedro (Motorzinho)', position: 'Linha', photoUrl: '', matchesPlayed: 10, goals: 4, assists: 8, attributes: { pace: 90, shooting: 70, passing: 80, dribbling: 85, defending: 65, physical: 85 }, overall: 83, subscriptionType: 'Avulso' },
];

const defaultMockCourts: Court[] = [
  { id: '1', name: 'Arena Soccer VIP', address: 'Rua do Fut, 123', pricePerHour: 150 },
];

const defaultMockMatches: Match[] = [
  { id: '1', name: 'Pelada de Quarta', courtId: 'Arena Soccer', date: new Date().toISOString(), valorAvulso: 20, valorMensal: 60, stats: {}, players: defaultMockUsers.map((u, i) => ({ userId: u.id, attendance: i < 4 ? 'Confirmado' : 'De Fora', paymentStatus: i % 2 === 0 ? 'Pago' : 'Pendente', paymentType: 'Mensalista' }))}
];

const getStoredState = (): AppState => {
  const saved = localStorage.getItem('nossaPeladaState');
  if (saved) return JSON.parse(saved);
  return { users: defaultMockUsers, courts: defaultMockCourts, matches: defaultMockMatches, currentUser: null, theme: 'light' };
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(getStoredState());

  useEffect(() => {
    localStorage.setItem('nossaPeladaState', JSON.stringify(state));
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state]);

  const addUser = (userData: Omit<User, 'id' | 'overall' | 'goals' | 'assists' | 'matchesPlayed'>) => {
    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substring(7),
      overall: calculateOverall(userData.attributes, userData.position),
      goals: 0,
      assists: 0,
      matchesPlayed: 0
    };
    setState((prev: AppState) => ({ ...prev, users: [...prev.users, newUser], currentUser: prev.currentUser || newUser }));
  };

  const removeUser = (userId: string) => {
    setState((prev: AppState) => ({
      ...prev,
      users: prev.users.filter((u: User) => u.id !== userId),
      matches: prev.matches.map(m => ({ ...m, players: m.players.filter(p => p.userId !== userId) }))
    }));
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setState((prev: AppState) => {
      const updatedUsers = prev.users.map(u => {
        if (u.id !== userId) return u;
        const newUser = { ...u, ...updates };
        // Recalcular overall se necessário
        if (updates.attributes || updates.position) {
          newUser.overall = calculateOverall(newUser.attributes, newUser.position);
        }
        return newUser;
      });
      return { 
        ...prev, 
        users: updatedUsers,
        currentUser: prev.currentUser?.id === userId ? updatedUsers.find(u => u.id === userId) || prev.currentUser : prev.currentUser 
      };
    });
  };

  const addCourt = (courtData: Omit<Court, 'id'>) => {
    setState((prev: AppState) => ({ ...prev, courts: [...prev.courts, { ...courtData, id: Math.random().toString(36).substring(7) }] }));
  };

  const addMatch = (matchData: Omit<Match, 'id' | 'stats'>) => {
    const newMatch: Match = { ...matchData, id: Math.random().toString(36).substring(7), stats: {} };
    setState((prev: AppState) => ({ ...prev, matches: [...prev.matches, newMatch] }));
  };

  const updateMatch = (matchId: string, updates: Partial<Match>) => {
    setState((prev: AppState) => ({
      ...prev,
      matches: prev.matches.map(m => m.id === matchId ? { ...m, ...updates } : m)
    }));
  };

  const updateMatchPlayer = (matchId: string, playerId: string, updates: Partial<MatchPlayer>) => {
    setState((prev: AppState) => ({
      ...prev,
      matches: prev.matches.map((m: Match) => m.id === matchId ? {
        ...m, players: m.players.map((p: MatchPlayer) => p.userId === playerId ? { ...p, ...updates } : p)
      } : m)
    }));
  };

  const drawTeams = (matchId: string) => {
    setState((prev: AppState) => ({
      ...prev,
      matches: prev.matches.map((m: Match) => {
        if (m.id !== matchId) return m;

        const confirmed: MatchPlayer[] = m.players.filter((p: MatchPlayer) => p.attendance === 'Confirmado');
        const confirmedUsers = confirmed.map((p: MatchPlayer) => {
          const u = state.users.find((user: User) => user.id === p.userId)!;
          return { player: p, user: u };
        });

        // Sort priority: Mensalista first, then overall desc
        const sortPlayers = (a: any, b: any) => {
           if (a.user.subscriptionType !== b.user.subscriptionType) {
               return a.user.subscriptionType === 'Mensalista' ? -1 : 1;
           }
           return b.user.overall - a.user.overall;
        };

        const goalkeepers = confirmedUsers.filter((cu: any) => cu.user.position === 'Goleiro').sort(sortPlayers);
        const fieldPlayers = confirmedUsers.filter((cu: any) => cu.user.position === 'Linha').sort(sortPlayers);
        
        // Count possible full teams
        const maxTeamsByGK = goalkeepers.length;
        const maxTeamsByFP = Math.floor(fieldPlayers.length / 4);
        const possibleTeamsCount = Math.min(maxTeamsByGK, maxTeamsByFP);
        
        const teamNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const numTeams = Math.max(2, Math.min(possibleTeamsCount, teamNames.length));
        
        const teamOVRs = new Array(numTeams).fill(0);
        const updatedPlayers: MatchPlayer[] = [...m.players].map(p => ({ ...p, team: null }));
        
        // 1. Distribute GKs
        for(let i=0; i<numTeams; i++) {
           if (i < goalkeepers.length) {
               const gk = goalkeepers[i];
               const matchPlayerIndex = updatedPlayers.findIndex((up: MatchPlayer) => up.userId === gk.player.userId);
               updatedPlayers[matchPlayerIndex].team = teamNames[i];
               teamOVRs[i] += gk.user.overall;
           }
        }
        
        // 2. Distribute FPs
        // Iterate through FPs, filling Teams in chunks of 2 (A/B, C/D...)
        let fpIndex = 0;
        for (let pairStart = 0; pairStart < numTeams; pairStart += 2) {
           const team1Index = pairStart;
           const team2Index = pairStart + 1;
           const isPair = team2Index < numTeams;
           
           if (isPair) {
               let bucket = fieldPlayers.slice(fpIndex, fpIndex + 8);
               fpIndex += 8;
               bucket.forEach(fp => {
                  const targetIndex = teamOVRs[team1Index] <= teamOVRs[team2Index] ? team1Index : team2Index;
                  const matchPlayerIndex = updatedPlayers.findIndex((up: MatchPlayer) => up.userId === fp.player.userId);
                  updatedPlayers[matchPlayerIndex].team = teamNames[targetIndex];
                  teamOVRs[targetIndex] += fp.user.overall;
               });
           } else {
               let bucket = fieldPlayers.slice(fpIndex, fpIndex + 4);
               fpIndex += 4;
               bucket.forEach(fp => {
                  const matchPlayerIndex = updatedPlayers.findIndex((up: MatchPlayer) => up.userId === fp.player.userId);
                  updatedPlayers[matchPlayerIndex].team = teamNames[team1Index];
               });
           }
        }
        
        return { ...m, players: updatedPlayers };
      })
    }));
  };

  const recordEvent = (matchId: string, playerId: string, type: 'goal' | 'assist') => {
    setState((prev: AppState) => {
      // Update global user stats
      const users = prev.users.map(u => 
        u.id === playerId ? { ...u, goals: u.goals + (type === 'goal' ? 1 : 0), assists: u.assists + (type === 'assist' ? 1 : 0) } : u
      );
      
      // Update match specific stats
      const matches = prev.matches.map(m => {
        if (m.id !== matchId) return m;
        const currentStats = m.stats || {};
        const playerStats = currentStats[playerId] || { goals: 0, assists: 0 };
        return {
          ...m,
          stats: {
            ...currentStats,
            [playerId]: {
              goals: playerStats.goals + (type === 'goal' ? 1 : 0),
              assists: playerStats.assists + (type === 'assist' ? 1 : 0)
            }
          }
        };
      });

      // Update currentUser if applicable
      const currentUser = prev.currentUser?.id === playerId ? users.find(u => u.id === playerId) || prev.currentUser : prev.currentUser;
      
      return { ...prev, users, matches, currentUser };
    });
  };

  const swapPlayers = (matchId: string, playerOutId: string, playerInId: string) => {
    setState((prev: AppState) => ({
      ...prev,
      matches: prev.matches.map(m => {
        if (m.id !== matchId) return m;
        const players = m.players.map(p => {
          // If player is out, move to De Fora, remove their team
          if (p.userId === playerOutId) return { ...p, attendance: 'De Fora' as const, team: null };
          // If player is in, move to Confirmado (team can be assigned later, or we just put them pending for drawTeams)
          if (p.userId === playerInId) return { ...p, attendance: 'Confirmado' as const, team: null };
          return p;
        });
        return { ...m, players };
      })
    }));
  };

  const joinMatch = (matchId: string, userId: string) => {
    setState((prev: AppState) => {
      const user = prev.users.find(u => u.id === userId);
      if(!user) return prev;
      return {
        ...prev,
        matches: prev.matches.map(m => {
          if (m.id !== matchId) return m;
          if (m.players.some(p => p.userId === userId)) return m; // Já está na partida
          const newPlayer: MatchPlayer = {
            userId,
            attendance: 'Confirmado',
            paymentStatus: user.subscriptionType === 'Mensalista' ? 'Pago' : 'Pendente',
            paymentType: user.subscriptionType
          };
          return { ...m, players: [...m.players, newPlayer] };
        })
      };
    });
  };

  const removeMatch = (matchId: string) => {
    setState((prev: AppState) => ({
      ...prev,
      matches: prev.matches.filter(m => m.id !== matchId)
    }));
  };

  const deleteCourt = (courtId: string) => {
    setState((prev: AppState) => ({
      ...prev,
      courts: prev.courts.filter(c => c.id !== courtId)
    }));
  };

  const login = (userId: string) => {
    const user = state.users.find((u: User) => u.id === userId);
    if(user) setState((prev: AppState) => ({ ...prev, currentUser: user }));
  };

  const toggleTheme = () => {
    setState((prev: AppState) => {
      const newTheme = prev.theme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      return { ...prev, theme: newTheme };
    });
  };

  const logout = () => {
    setState((prev: AppState) => ({ ...prev, currentUser: null }));
  };

  return (
    <AppContext.Provider value={{ ...state, addUser, updateUser, removeUser, addCourt, addMatch, updateMatch, updateMatchPlayer, login, logout, drawTeams, recordEvent, swapPlayers, toggleTheme, joinMatch, removeMatch, deleteCourt }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
