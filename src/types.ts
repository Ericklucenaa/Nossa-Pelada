export type Position = 'Goleiro' | 'Linha';


export interface User {
  id: string;
  name: string;
  photoUrl?: string;
  position: Position;
  subscriptionType: 'Mensalista' | 'Avulso';
  
  // Basic Stats (lifetime)
  goals: number;
  assists: number;
  matchesPlayed: number;
}

export interface Court {
  id: string;
  name: string;
  address: string;
  pricePerHour: number;
}

export type PaymentStatus = 'Pago' | 'Pendente';
export type AttendanceStatus = 'Confirmado' | 'Pendente' | 'Ausente' | 'De Fora';

export interface MatchPlayer {
  userId: string;
  attendance: AttendanceStatus;
  paymentStatus: PaymentStatus;
  paymentType: 'Mensalista' | 'Avulso';
  team?: string | null; // A, B, C, D... ou Null if not drawn yet
}

export interface Match {
  id: string;
  name: string;
  courtId: string;
  date: string; // ISO String
  endTime?: string; // ISO String
  isFixed?: boolean;
  valorAvulso?: number;
  valorMensal?: number;
  players: MatchPlayer[];
  
  // Match Specific Stats
  stats: Record<string, { goals: number, assists: number }>; // userId -> stats
}


