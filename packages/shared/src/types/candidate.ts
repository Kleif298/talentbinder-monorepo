import type { Apprenticeship } from './other.js';

export type { Apprenticeship };

export interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  status: 'Favorit' | 'Normal' | 'Eliminiert';
  apprenticeships: Apprenticeship[];
  createdAt?: string;
}

export type CandidateForm = {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: 'Favorit' | 'Normal' | 'Eliminiert';
  apprenticeshipId?: number;
  apprenticeshipIds?: number[];
}

export interface CandidateForReport {
  candidateId: number;
  firstName: string;
  lastName: string;
  email: string;
  status?: 'Favorit' | 'Normal' | 'Eliminiert';
}