import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '~/test/testUtils';
import Events from './Events';

// Mock auth utilities
vi.mock('~/utils/auth.ts', () => ({
  getAccountEmail: vi.fn(() => Promise.resolve('test@example.com')),
  getAdminStatus: vi.fn(() => Promise.resolve(false)),
  clearUserCache: vi.fn(),
  getAccountId: vi.fn(() => 1),
  isOwnerOfEvent: vi.fn(() => false),
}));

describe('Events Page', () => {
  it('renders the events page', async () => {
    render(<Events />);
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
    
    // Wait for async operations to complete
    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('shows create event button', async () => {
    render(<Events />);
    
    const createButton = screen.getByText(/Event erstellen/i);
    expect(createButton).toBeInTheDocument();
    
    // Wait for async operations
    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('shows search input field', async () => {
    render(<Events />);
    
    const searchInput = screen.getByPlaceholderText(/Nach Events suchen/i);
    expect(searchInput).toBeInTheDocument();
    
    // Wait for async operations
    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });
});
