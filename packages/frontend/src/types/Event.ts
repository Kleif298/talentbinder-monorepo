/**
 * Event Types
 * Re-exports from shared package + frontend-specific types
 */

// Re-export shared types
export type { Event, EventForm, Session } from '@talentbinder/shared';
import type { Event } from '@talentbinder/shared';

// Frontend-specific component props
export interface EventCardProps {
  event: Event;
  onEdit: (formData: Event) => void;
  onView: (event: Event) => void;
  registrationCount?: number;
  onRefresh?: () => void;
  readonly?: boolean;
  onReport?: (event: Event) => void;
}

export interface EventListProps {
  refreshKey: number;
}

