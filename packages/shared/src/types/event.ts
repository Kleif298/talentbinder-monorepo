import type { Candidate } from './candidate.js';

export interface Session {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  branchId?: number;
  templateId?: number;
  locationId: number;
  locationName?: string;
  locationAddress?: string;
  locationCity?: string;
  locationPlz?: string;
  dateAt?: string;
  startingAt: string;
  endingAt?: string;
  invitationsSendingAt?: string;
  registrationsSendingAt?: string;
  registrationsClosingAt?: string;
  registrationRequired?: boolean;
  invitationsSent?: boolean;
  createdAt: string;
  createdByAccountId: number;
  createdByFirstName: string;
  createdByLastName: string;
  registrationsCount?: number;
  sessions?: Session[];
  candidates?: Candidate[];
}

export type EventForm = {
  title?: string;
  description?: string;
  branchId?: number;
  templateId?: number;
  locationId?: number;
  registrationRequired?: boolean;
  dateAt?: string;
  startingAt?: string;
  endingAt?: string;
  invitationsSendingAt?: string;
  registrationsSendingAt?: string;
  registrationsClosingAt?: string;
}
export type testtest = string;