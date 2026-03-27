import { useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { signOut, signInWithPopup, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import type { Court, Match, MatchPlayer, User } from '../types';
import { AppContext } from './appContext';

export interface AppState {
  users: User[];
  courts: Court[];
  matches: Match[];
  currentUser: User | null;
  theme: 'light' | 'dark';
}

export interface AppContextType extends AppState {
  addUser: (user: Omit<User, 'id' | 'goals' | 'assists' | 'matchesPlayed'>) => void;
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
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

type PlayerWithUser = {
  player: MatchPlayer;
  user: User;
};

const STORAGE_KEY = 'nossaPeladaState';
const userStorageKey = (uid: string) => `nossaPeladaState_${uid}`;
const TEAM_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

const createId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const defaultMockUsers: User[] = [
  { id: '1', name: 'João (Admin)', position: 'Linha', photoUrl: '', matchesPlayed: 10, goals: 5, assists: 3, subscriptionType: 'Mensalista' },
  { id: '2', name: 'Marcos (Goleiro)', position: 'Goleiro', photoUrl: '', matchesPlayed: 10, goals: 0, assists: 1, subscriptionType: 'Avulso' },
  { id: '3', name: 'Lucas (Artilheiro)', position: 'Linha', photoUrl: '', matchesPlayed: 8, goals: 12, assists: 2, subscriptionType: 'Mensalista' },
  { id: '4', name: 'Thiago (Xerife)', position: 'Linha', photoUrl: '', matchesPlayed: 9, goals: 1, assists: 1, subscriptionType: 'Mensalista' },
  { id: '5', name: 'Pedro (Motorzinho)', position: 'Linha', photoUrl: '', matchesPlayed: 10, goals: 4, assists: 8, subscriptionType: 'Avulso' },
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
  theme: 'dark',
};

const sanitizeState = (value: unknown): AppState => {
  if (!value || typeof value !== 'object') return defaultState;
  const candidate = value as Partial<AppState>;
  return {
    users: Array.isArray(candidate.users) ? candidate.users : defaultState.users,
    courts: Array.isArray(candidate.courts) ? candidate.courts : defaultState.courts,
    matches: Array.isArray(candidate.matches) ? candidate.matches : defaultState.matches,
    currentUser: candidate.currentUser && typeof candidate.currentUser === 'object' ? candidate.currentUser as User : null,
    theme: candidate.theme === 'light' ? 'light' : 'dark',
  };
};

const getStoredState = (uid?: string): AppState => {
  try {
    const key = uid ? userStorageKey(uid) : STORAGE_KEY;
    const saved = localStorage.getItem(key);
    return saved ? sanitizeState(JSON.parse(saved)) : defaultState;
  } catch {
    return defaultState;
  }
};

const sortPlayers = (a: PlayerWithUser, b: PlayerWithUser): number => {
  if (a.user.subscriptionType !== b.user.subscriptionType) {
    return a.user.subscriptionType === 'Mensalista' ? -1 : 1;
  }
  return a.user.name.localeCompare(b.user.name);
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
  const currentUidRef = useRef<string | null>(null);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setAuthLoading(true);
      if (fbUser) {
        currentUidRef.current = fbUser.uid;
        
        // 1. Try to fetch cloud data
        try {
          const docRef = doc(db, 'user_data', fbUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const cloudData = docSnap.data() as AppState;
            // Ensure currentUser matches the auth user
            const existingInCloud = cloudData.users.find(u => u.id === fbUser.uid);
            setState({ 
              ...cloudData, 
              currentUser: existingInCloud || null 
            });
          } else {
            // 2. Fallback to existing logic (creation or local)
            loginWithFirebaseUser(fbUser);
          }
        } catch (err) {
          console.error('Cloud Sync failed, using local fallback:', err);
          loginWithFirebaseUser(fbUser);
        }
      } else {
        currentUidRef.current = null;
        setState(getStoredState());
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 1. Save locally
    const key = currentUidRef.current ? userStorageKey(currentUidRef.current) : STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(state));
    document.documentElement.setAttribute('data-theme', state.theme);

    // 2. Sync to Cloud if logged in
    if (currentUidRef.current && !authLoading) {
      const syncRef = doc(db, 'user_data', currentUidRef.current);
      setDoc(syncRef, state).catch(err => console.error('Cloud Update error:', err));
    }
  }, [state, authLoading]);

  const addUser: AppContextType['addUser'] = (userData) => {
    const newUser: User = {
      ...userData,
      id: createId(),
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
    }));
  };

  const updateUser: AppContextType['updateUser'] = (userId, updates) => {
    setState((prev) => {
      const updatedUsers = prev.users.map((user) => {
        if (user.id !== userId) return user;
        return { ...user, ...updates };
      });

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

        const remainder = total % TARGET_SIZE;
        const teamCapacities = new Array(numTeams).fill(TARGET_SIZE) as number[];
        if (remainder > 0) teamCapacities[numTeams - 1] = remainder;

        const mensalistas = confirmedPlayers.filter((e) => e.user.subscriptionType === 'Mensalista');
        const avulsos = confirmedPlayers.filter((e) => e.user.subscriptionType !== 'Mensalista');

        const numMensalistaTeams = Math.min(numTeams, Math.max(1, Math.ceil(mensalistas.length / TARGET_SIZE)));
        const mensalistaZoneEnd = avulsos.length > 0 ? numMensalistaTeams : numTeams;

        const updatedPlayers = match.players.map((p) => ({ ...p, team: null as string | null }));
        const teamSizes = new Array(numTeams).fill(0) as number[];

        const assignToZone = (entry: (typeof confirmedPlayers)[0], zoneStart: number, zoneEnd: number) => {
          let bestTeam = -1;
          for (let i = zoneStart; i < zoneEnd; i++) {
            if (teamSizes[i] < teamCapacities[i]) {
              bestTeam = i;
              break;
            }
          }
          if (bestTeam < 0) {
            for (let i = 0; i < numTeams; i++) {
              if (teamSizes[i] < teamCapacities[i]) {
                bestTeam = i;
                break;
              }
            }
          }
          if (bestTeam >= 0) {
            const playerIndex = updatedPlayers.findIndex((p) => p.userId === entry.player.userId);
            if (playerIndex >= 0) {
              updatedPlayers[playerIndex].team = TEAM_NAMES[bestTeam];
              teamSizes[bestTeam]++;
            }
          }
        };

        const mensalistaGKs = mensalistas.filter((e) => e.user.position === 'Goleiro');
        const mensalistaField = mensalistas.filter((e) => e.user.position !== 'Goleiro');
        mensalistaGKs.slice(0, mensalistaZoneEnd).forEach((gk, index) => {
          const playerIndex = updatedPlayers.findIndex((p) => p.userId === gk.player.userId);
          if (playerIndex >= 0) {
            updatedPlayers[playerIndex].team = TEAM_NAMES[index];
            teamSizes[index]++;
          }
        });
        const extraMensalistaGKs = mensalistaGKs.slice(mensalistaZoneEnd);
        [...mensalistaField, ...extraMensalistaGKs].forEach((e) => assignToZone(e, 0, mensalistaZoneEnd));

        const avulsoGKs = avulsos.filter((e) => e.user.position === 'Goleiro');
        const avulsoField = avulsos.filter((e) => e.user.position !== 'Goleiro');
        avulsoGKs.slice(0, numTeams - mensalistaZoneEnd).forEach((gk, index) => {
          const teamIndex = mensalistaZoneEnd + index;
          const playerIndex = updatedPlayers.findIndex((p) => p.userId === gk.player.userId);
          if (playerIndex >= 0) {
            updatedPlayers[playerIndex].team = TEAM_NAMES[teamIndex];
            teamSizes[teamIndex]++;
          }
        });
        const extraAvulsoGKs = avulsoGKs.slice(numTeams - mensalistaZoneEnd);
        [...avulsoField, ...extraAvulsoGKs].forEach((e) => assignToZone(e, mensalistaZoneEnd, numTeams));

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

  const setMatchStats = (matchId: string, playerId: string, goals: number, assists: number) => {
    setState((prev) => {
      const matches = prev.matches.map((match) =>
        match.id === matchId
          ? { ...match, stats: { ...(match.stats ?? {}), [playerId]: { goals, assists } } }
          : match,
      );
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
    const userState = getStoredState(fbUser.uid);
    const existing = userState.users.find((u) => u.id === fbUser.uid);
    if (existing) {
      setState({ ...userState, currentUser: existing });
      return;
    }
    const newUser: User = {
      id: fbUser.uid,
      name: fbUser.displayName ?? 'Jogador',
      photoUrl: fbUser.photoURL ?? '',
      position: 'Linha',
      matchesPlayed: 0,
      goals: 0,
      assists: 0,
      subscriptionType: 'Avulso',
    };
    setState({
      ...defaultState,
      theme: userState.theme,
      users: [newUser],
      currentUser: newUser,
    });
  };

  const loginWithGoogle: AppContextType['loginWithGoogle'] = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    loginWithFirebaseUser(result.user);
  };

  const loginWithEmail = async (identifier: string, password: string): Promise<void> => {
    let email = identifier.trim();
    
    // Check if it's a username (no @)
    if (!email.includes('@')) {
      const docRef = doc(db, 'usernames', email.toLowerCase());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        email = docSnap.data().email;
      } else {
        throw new Error('Usuário não encontrado.');
      }
    }

    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (email: string, password: string, username: string): Promise<void> => {
    const trimmedUsername = username.trim().toLowerCase();
    
    // 1. Verify if username exists
    const docRef = doc(db, 'usernames', trimmedUsername);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      throw new Error('Este nome de usuário já está em uso.');
    }

    // 2. Create Auth User
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // 3. Save mapping to Firestore
    await setDoc(docRef, { email: email.trim(), userId: result.user.uid });
    
    // 4. Update Profile
    await updateProfile(result.user, { displayName: username.trim() });
    loginWithFirebaseUser({ ...result.user, displayName: username.trim() });
  };

  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  const toggleTheme: AppContextType['toggleTheme'] = () => {
    setState((prev) => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const logout: AppContextType['logout'] = () => {
    signOut(auth).catch(() => {});
    currentUidRef.current = null;
    setState((prev) => ({ ...defaultState, theme: prev.theme, currentUser: null }));
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
        loginWithEmail,
        registerWithEmail,
        resetPassword,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
