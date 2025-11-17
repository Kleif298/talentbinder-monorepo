/**
 * Candidate Types
 * Re-exports from shared package + frontend-specific types
 */

// Re-export shared types
export type { Apprenticeship, Candidate, CandidateForm, CandidateForReport } from '@talentbinder/shared';
import type { Candidate } from '@talentbinder/shared';

// Frontend-specific component props
export interface CandidateCardProps {
  candidate: Candidate;
  isAdmin: boolean;
  onEdit: (candidate: Candidate) => void;
  onView: (candidate: Candidate) => void;
}

export interface GridListProps {
  refreshKey: number;
  filterParams: {
    search?: string;
    status?: string;
    sortBy?: string;
  };
  onEditCandidate: (candidate: Candidate) => void;
  onViewCandidate: (candidate: Candidate) => void;
}

