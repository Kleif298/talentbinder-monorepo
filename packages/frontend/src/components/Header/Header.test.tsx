import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '~/test/testUtils';
import Header from './Header';

// Mock the auth utilities
vi.mock('~/utils/auth.ts', () => ({
  getAccountEmail: vi.fn(() => Promise.resolve('test@example.com')),
  getAdminStatus: vi.fn(() => Promise.resolve(false)),
  clearUserCache: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(() => ({ pathname: '/events' })),
    useNavigate: vi.fn(() => vi.fn()),
  };
});

describe('Header', () => {
  it('renders the header component', async () => {
    render(<Header />);
    
    // Check if header element exists
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    // Wait for async state updates to complete
    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('displays navigation links', async () => {
    render(<Header />);
    
    // Wait for component to stabilize
    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
    
    // Check for both navigation elements separately (both exist in header)
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('displays user email when loaded', async () => {
    render(<Header />);
    
    // Wait for email to be loaded and displayed
    const emailElement = await screen.findByText('test@example.com');
    expect(emailElement).toBeInTheDocument();
  });
});
