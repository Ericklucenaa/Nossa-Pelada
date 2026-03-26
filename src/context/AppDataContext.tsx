import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { signOut, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import type { Court, Match, MatchPlayer, User } from '../types';
import { AppContext } from './appContext';
import { calculateOverall } from '../types';

export interface AppState {
  users: User[];
  courts: Court[];
  matches: Match[];
  currentUser: User | null;
  theme: 'light' | 'dark';
}

export interface AppContextType extends AppState {
  addUser: (user: Omit<User, 'id' | 'overall' | 'goals' | 'assists' | 'matchesPlayed'>) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  removeUser: (userId: string) => void;
  addCourt: (court: Omit<Court, 'id'>) => void;
  addMatch: (match: Omit<Match, 'id' | 'stats'>) => void;
  updateMatch: (matchId: string, updates: Partial<Match>) => void;
  updateMatchPlayer: (matchId: string, playerId: string, updates: Partial<MatchPlayer>) => void;
  login: (userId: string) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithFirebaseUser: (fbUser: FirebaseUser) => void;
  logout: () => void;
  drawTeams: (matchId: string) => void;
  recordEvent: (matchId: string, playerId: string, type: 'goal' | 'assist') => void;
  setMatchStats: (matchId: string, playerId: string, goals: number, assists: number) => void;
  swapPlayers: (matchId: string, playerOutId: string, playerInId: string) => void;
  toggleTheme: () => void;
  joinMatch: (matchId: string, userId: string) => void;
  removeMatch: (matchId: string) => void;
  deleteCourt: (courtId: string) => void;
  authLoading: boolean;
}

type PlayerWithUser = {
  player: MatchPlayer;
  user: User;
};

const STORAGE_KEY = 'nossaPeladaState';
const TEAM_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

const createId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

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
  {
    id: '1',
    name: 'Pelada de Quarta',
    courtId: '1',
    date: new Date().toISOString(),
    valorAvulso: 20,
    valorMensal: 60,
    stats: {},
    players: defaultMockUsers.map((user, index) => ({
      userId: user.id,
      attendance: index < 4 ? 'Confirmado' : 'De Fora',
      paymentStatus: 'Pendente',
      paymentType: user.subscriptionType,
    })),
  },
];

const defaultState: AppState = {
  users: defaultMockUsers,
  courts: defaultMockCourts,
  matches: defaultMockMatches,
  currentUser: null,
  theme: 'light',
};

const sanitizeState = (value: unknown): AppState => {
  if (!value || typeof value !== 'object') return defaultState;
  const candidate = value as Partial<AppState>;
  return {
    users: Array.isArray(candidate.users) ? candidate.users : defaultState.users,
    courts: Array.isArray(candidate.courts) ? candidate.courts : defaultState.courts,
    matches: Array.isArray(candidate.matches) ? candidate.matches : defaultState.matches,
    currentUser: candidate.currentUser && typeof candidate.currentUser === 'object' ? candidate.currentUser as User : null,
    theme: candidate.theme === 'dark' ? 'dark' : 'light',
  };
};

const getStoredState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? sanitizeState(JSON.parse(saved)) : defaultState;
  } catch {
    return defaultState;
  }
};

const sortPlayers = (a: PlayerWithUser, b: PlayerWithUser): number => {
  if (a.user.subscriptionType !== b.user.subscriptionType) {
    return a.user.subscriptionType === 'Mensalista' ? -1 : 1;
  }
  return b.user.overall - a.user.overall;
};

const getPlayersWithUser = (players: MatchPlayer[], users: User[]): PlayerWithUser[] =>
  players
    .map((player) => {
      const user = users.find((candidate) => candidate.id === player.userId);
      return user ? { player, user } : null;
    })
    .filter((entry): entry is PlayerWithUser => Boolean(entry));


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(getStoredState);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        loginWithFirebaseUser(fbUser);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state]);

  const addUser: AppContextType['addUser'] = (userData) => {
    const newUser: User = {
      ...userData,
      id: createId(),
      overall: calculateOverall(userData.attributes, userData.position),
      goals: 0,
      assists: 0,
      matchesPlayed: 0,
    };

    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      currentUser: prev.currentUser ?? newUser,
    }));
  };

  const removeUser: AppContextType['removeUser'] = (userId) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.filter((user) => user.id !== userId),
      matches: prev.matches.map((match) => ({
        ...match,
        players: match.players.filter((player) => player.userId !== userId),
        stats: Object.fromEntries(Object.entries(match.stats).filter(([key]) => key !== userId)),
      })),
      // Never clear currentUser on player deletion — auth is managed by Firebase.
      // Only logout() should end the session.
    }));
  };

  const updateUser: AppContextType['updateUser'] = (userId, updates) => {
    setState((prev) => {
      const updatedUsers = prev.users.map((user) => {
        if (user.id !== userId) return user;
        const nextUser: User = { ...user, ...updates };
        if (updates.attributes || updates.position) {
          nextUser.overall = calculateOverall(nextUser.attributes, nextUser.position);
        }
        return nextUser;
      });

      // If subscriptionType changed, sync paymentType in all matches
      let updatedMatches = prev.matches;
      if (updates.subscriptionType) {
        updatedMatches = prev.matches.map((match) => ({
          ...match,
          players: match.players.map((p) =>
            p.userId === userId ? { ...p, paymentType: updates.subscriptionType! } : p,
          ),
        }));
      }

      return {
        ...prev,
        users: updatedUsers,
        matches: updatedMatches,
        currentUser:
          prev.currentUser?.id === userId
            ? updatedUsers.find((user) => user.id === userId) ?? null
            : prev.currentUser,
      };
    });
  };

  const addCourt: AppContextType['addCourt'] = (courtData) => {
    setState((prev) => ({
      ...prev,
      courts: [...prev.courts, { ...courtData, id: createId() }],
    }));
  };

  const addMatch: AppContextType['addMatch'] = (matchData) => {
    const newMatch: Match = { ...matchData, id: createId(), stats: {} };
    setState((prev) => ({ ...prev, matches: [...prev.matches, newMatch] }));
  };

  const updateMatch: AppContextType['updateMatch'] = (matchId, updates) => {
    setState((prev) => ({
      ...prev,
      matches: prev.matches.map((match) => (match.id === matchId ? { ...match, ...updates } : match)),
    }));
  };

  const updateMatchPlayer: AppContextType['updateMatchPlayer'] = (matchId, playerId, updates) => {
    setState((prev) => ({
      ...prev,
      matches: prev.matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              players: match.players.map((player) =>
                player.userId === playerId ? { ...player, ...updates } : player,
              ),
            }
          : match,
      ),
    }));
  };

  const drawTeams: AppContextType['drawTeams'] = (matchId) => {
    setState((prev) => ({
      ...prev,
      matches: prev.matches.map((match) => {
        if (match.id !== matchId) return match;

        const confirmedPlayers = getPlayersWithUser(
          match.players.filter((player) => player.attendance === 'Confirmado'),
          prev.users,
        ).sort(sortPlayers);

        if (confirmedPlayers.length < 2) {
          return { ...match, players: match.players.map((player) => ({ ...player, team: null })) };
        }

        const TARGET_SIZE = 5;
        const total = confirmedPlayers.length;
        const numTeams = Math.min(TEAM_NAMES.length, Math.max(2, Math.ceil(total / TARGET_SIZE)));

        // Complete teams fill to TARGET_SIZE; last team gets the remainder
        const remainder = total % TARGET_SIZE;
        const teamCapacities = new Array(numTeams).fill(TARGET_SIZE) as number[];
        if (remainder > 0) teamCapacities[numTeams - 1] = remainder;

        // Split by subscription type, maintaining OVR sort within each group
        const mensalistas = confirmedPlayers.filter((e) => e.user.subscriptionType === 'Mensalista');
        const avulsos = confirmedPlayers.filter((e) => e.user.subscriptionType !== 'Mensalista');

        // Mensalistas fill the first N teams, avulsos fill the rest
        const numMensalistaTeams = Math.min(numTeams, Math.max(1, Math.ceil(mensalistas.length / TARGET_SIZE)));
        const mensalistaZoneEnd = avulsos.length > 0 ? numMensalistaTeams : numTeams;

        const updatedPlayers = match.players.map((p) => ({ ...p, team: null as string | null }));
        const teamSizes = new Array(numTeams).fill(0) as number[];
        const teamTotals = new Array(numTeams).fill(0) as number[];

        // Helper: assign a player to the best team within a zone (lowest OVR total with capacity)
        // Falls back to any available team if zone is full
        const assignToZone = (entry: (typeof confirmedPlayers)[0], zoneStart: number, zoneEnd: number) => {
          let bestTeam = -1;
          let bestTotal = Infinity;
          // Try zone first
          for (let i = zoneStart; i < zoneEnd; i++) {
            if (teamSizes[i] < teamCapacities[i] && teamTotals[i] < bestTotal) {
              bestTotal = teamTotals[i];
              bestTeam = i;
            }
          }
          // Fallback: any team with capacity
          if (bestTeam < 0) {
            bestTotal = Infinity;
            for (let i = 0; i < numTeams; i++) {
              if (teamSizes[i] < teamCapacities[i] && teamTotals[i] < bestTotal) {
                bestTotal = teamTotals[i];
                bestTeam = i;
              }
            }
          }
          if (bestTeam >= 0) {
            const playerIndex = updatedPlayers.findIndex((p) => p.userId === entry.player.userId);
            if (playerIndex >= 0) {
              updatedPlayers[playerIndex].team = TEAM_NAMES[bestTeam];
              teamSizes[bestTeam]++;
              teamTotals[bestTeam] += entry.user.overall;
            }
          }
        };

        // — MENSALISTAS —
        const mensalistaGKs = mensalistas.filter((e) => e.user.position === 'Goleiro');
        const mensalistaField = mensalistas.filter((e) => e.user.position !== 'Goleiro');
        // Anchor one mensalista GK per mensalista team
        mensalistaGKs.slice(0, mensalistaZoneEnd).forEach((gk, index) => {
          const playerIndex = updatedPlayers.findIndex((p) => p.userId === gk.player.userId);
          if (playerIndex >= 0) {
            updatedPlayers[playerIndex].team = TEAM_NAMES[index];
            teamSizes[index]++;
            teamTotals[index] += gk.user.overall;
          }
        });
        // Distribute remaining mensalistas (field + extra GKs) in their zone
        const extraMensalistaGKs = mensalistaGKs.slice(mensalistaZoneEnd);
        [...mensalistaField, ...extraMensalistaGKs]
          .sort((a, b) => b.user.overall - a.user.overall)
          .forEach((e) => assignToZone(e, 0, mensalistaZoneEnd));

        // — AVULSOS —
        const avulsoGKs = avulsos.filter((e) => e.user.position === 'Goleiro');
        const avulsoField = avulsos.filter((e) => e.user.position !== 'Goleiro');
        // Anchor one avulso GK per avulso team
        avulsoGKs.slice(0, numTeams - mensalistaZoneEnd).forEach((gk, index) => {
          const teamIndex = mensalistaZoneEnd + index;
          const playerIndex = updatedPlayers.findIndex((p) => p.userId === gk.player.userId);
          if (playerIndex >= 0) {
            updatedPlayers[playerIndex].team = TEAM_NAMES[teamIndex];
            teamSizes[teamIndex]++;
            teamTotals[teamIndex] += gk.user.overall;
          }
        });
        // Distribute remaining avulsos (field + extra GKs) in their zone
        const extraAvulsoGKs = avulsoGKs.slice(numTeams - mensalistaZoneEnd);
        [...avulsoField, ...extraAvulsoGKs]
          .sort((a, b) => b.user.overall - a.user.overall)
          .forEach((e) => assignToZone(e, mensalistaZoneEnd, numTeams));

        return { ...match, players: updatedPlayers };
      }),
    }));
  };



  const recordEvent: AppContextType['recordEvent'] = (matchId, playerId, type) => {
    setState((prev) => {
      const users = prev.users.map((user) =>
        user.id === playerId
          ? {
              ...user,
              goals: user.goals + (type === 'goal' ? 1 : 0),
              assists: user.assists + (type === 'assist' ? 1 : 0),
            }
          : user,
      );

      const matches = prev.matches.map((match) => {
        if (match.id !== matchId) return match;
        const currentStats = match.stats ?? {};
        const playerStats = currentStats[playerId] ?? { goals: 0, assists: 0 };

        return {
          ...match,
          stats: {
            ...currentStats,
            [playerId]: {
              goals: playerStats.goals + (type === 'goal' ? 1 : 0),
              assists: playerStats.assists + (type === 'assist' ? 1 : 0),
            },
          },
        };
      });

      return {
        ...prev,
        users,
        matches,
        currentUser: prev.currentUser?.id === playerId ? users.find((user) => user.id === playerId) ?? null : prev.currentUser,
      };
    });
  };

  // Set exact goals/assists for a player in a match; recalculates lifetime totals by summing all matches.
  const setMatchStats = (matchId: string, playerId: string, goals: number, assists: number) => {
    setState((prev) => {
      const matches = prev.matches.map((match) =>
        match.id === matchId
          ? { ...match, stats: { ...(match.stats ?? {}), [playerId]: { goals, assists } } }
          : match,
      );
      // Recalculate global totals from all match stats
      const users = prev.users.map((user) => {
        if (user.id !== playerId) return user;
        let totalGoals = 0;
        let totalAssists = 0;
        matches.forEach((m) => {
          if (m.stats?.[playerId]) {
            totalGoals += m.stats[playerId].goals || 0;
            totalAssists += m.stats[playerId].assists || 0;
          }
        });
        return { ...user, goals: totalGoals, assists: totalAssists };
      });
      return {
        ...prev,
        matches,
        users,
        currentUser: prev.currentUser?.id === playerId ? users.find((u) => u.id === playerId) ?? null : prev.currentUser,
      };
    });
  };

  const swapPlayers: AppContextType['swapPlayers'] = (matchId, playerOutId, playerInId) => {
    setState((prev) => ({
      ...prev,
      matches: prev.matches.map((match) => {
        if (match.id !== matchId) return match;

        const playerOut = match.players.find((player) => player.userId === playerOutId);
        const outTeam = playerOut?.team ?? null;

        return {
          ...match,
          players: match.players.map((player) => {
            if (player.userId === playerOutId) {
              return { ...player, attendance: 'De Fora', team: null };
            }
            if (player.userId === playerInId) {
              return { ...player, attendance: 'Confirmado', team: outTeam };
            }
            return player;
          }),
        };
      }),
    }));
  };

  const joinMatch: AppContextType['joinMatch'] = (matchId, userId) => {
    setState((prev) => {
      const user = prev.users.find((candidate) => candidate.id === userId);
      if (!user) return prev;

      return {
        ...prev,
        matches: prev.matches.map((match) => {
          if (match.id !== matchId || match.players.some((player) => player.userId === userId)) {
            return match;
          }

          const newPlayer: MatchPlayer = {
            userId,
            attendance: 'Confirmado',
            paymentStatus: 'Pendente',
            paymentType: user.subscriptionType,
            team: null,
          };

          return { ...match, players: [...match.players, newPlayer] };
        }),
      };
    });
  };

  const removeMatch: AppContextType['removeMatch'] = (matchId) => {
    setState((prev) => ({
      ...prev,
      matches: prev.matches.filter((match) => match.id !== matchId),
    }));
  };

  const deleteCourt: AppContextType['deleteCourt'] = (courtId) => {
    setState((prev) => ({
      ...prev,
      courts: prev.courts.filter((court) => court.id !== courtId),
      matches: prev.matches.map((match) =>
        match.courtId === courtId ? { ...match, courtId: '' } : match,
      ),
    }));
  };

  const login: AppContextType['login'] = (userId) => {
    setState((prev) => ({
      ...prev,
      currentUser: prev.users.find((user) => user.id === userId) ?? null,
    }));
  };

  const loginWithFirebaseUser = (fbUser: FirebaseUser) => {
    setState((prev) => {
      // Check if a user with this Firebase UID already exists
      const existing = prev.users.find((u) => u.id === fbUser.uid);
      if (existing) {
        return { ...prev, currentUser: existing };
      }
      // Auto-create a new app user from the Google profile
      const newUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName ?? 'Jogador',
        photoUrl: fbUser.photoURL ?? '',
        position: 'Linha',
        matchesPlayed: 0,
        goals: 0,
        assists: 0,
        subscriptionType: 'Avulso',
        attributes: { pace: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70 },
        overall: 70,
      };
      return {
        ...prev,
        users: [...prev.users, newUser],
        currentUser: newUser,
      };
    });
  };

  const loginWithGoogle: AppContextType['loginWithGoogle'] = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    loginWithFirebaseUser(result.user);
  };

  const toggleTheme: AppContextType['toggleTheme'] = () => {
    setState((prev) => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const logout: AppContextType['logout'] = () => {
    signOut(auth).catch(() => {});
    setState((prev) => ({ ...prev, currentUser: null }));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        addUser,
        updateUser,
        removeUser,
        addCourt,
        addMatch,
        updateMatch,
        updateMatchPlayer,
        login,
        loginWithGoogle,
        loginWithFirebaseUser,
        logout,
        drawTeams,
        recordEvent,
        setMatchStats,
        swapPlayers,
        toggleTheme,
        joinMatch,
        removeMatch,
        deleteCourt,
        authLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
