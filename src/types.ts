export type Position = 'Goleiro' | 'Linha';

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface User {
  id: string;
  name: string;
  photoUrl?: string;
  position: Position;
  attributes: PlayerAttributes;
  overall: number;
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

// Helper to calculate overall
export const calculateOverall = (attrs: PlayerAttributes, position: Position): number => {
  if (position === 'Goleiro') {
    // Goalkeepers might have different weights, but for now we average specific stats or all:
    return Math.round((attrs.defending * 0.5) + (attrs.physical * 0.3) + (attrs.passing * 0.2));
  }
  return Math.round(
    (attrs.pace * 0.1) +
    (attrs.shooting * 0.2) +
    (attrs.passing * 0.2) +
    (attrs.dribbling * 0.2) +
    (attrs.defending * 0.1) +
    (attrs.physical * 0.2)
  );
};
