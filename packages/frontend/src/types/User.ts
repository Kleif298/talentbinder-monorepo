/**
 * User Types
 * Re-exports from shared package + frontend-specific types
 */

// Re-export shared types
export type { User, UserData } from '@talentbinder/shared';
import type { User } from '@talentbinder/shared';

// Frontend-specific component props
export interface UserCardProps {
    user: User;
}

export interface UserListProps {
    refreshKey?: number;
}

