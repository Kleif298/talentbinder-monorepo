import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '~/test/testUtils';
import CandidateCard from './CandidateCard';

const mockCandidate = {
  id: 1,
  firstName: 'Alice',
  lastName: 'Johnson',
  email: 'alice@example.com',
  phone: '123-456-7890',
  city: 'Berlin',
  street: 'Main Street',
  houseNumber: '10',
  plz: '10115',
  birthdate: '2000-01-01',
  gender: 'Female',
  status: 'Normal' as const,
  notes: 'Test notes',
  apprenticeships: [
    {
      id: 1,
      name: 'Software Developer',
      candidateId: 1,
      branchId: 1,
    },
  ],
  createdAt: '2025-01-01T10:00:00Z',
  updatedAt: '2025-01-01T10:00:00Z',
};

describe('CandidateCard', () => {
  it('renders candidate name correctly', () => {
    render(
      <CandidateCard 
        candidate={mockCandidate}
        isAdmin={false}
        onEdit={vi.fn()}
        onView={vi.fn()}
      />
    );

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('displays email address', () => {
    render(
      <CandidateCard 
        candidate={mockCandidate}
        isAdmin={false}
        onEdit={vi.fn()}
        onView={vi.fn()}
      />
    );

    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('displays apprenticeship information', () => {
    render(
      <CandidateCard 
        candidate={mockCandidate}
        isAdmin={false}
        onEdit={vi.fn()}
        onView={vi.fn()}
      />
    );

    expect(screen.getByText('Software Developer')).toBeInTheDocument();
  });

  it('shows edit button when user is admin', () => {
    render(
      <CandidateCard 
        candidate={mockCandidate}
        isAdmin={true}
        onEdit={vi.fn()}
        onView={vi.fn()}
      />
    );

    const editButton = screen.getByLabelText('Bearbeiten');
    expect(editButton).toBeInTheDocument();
  });

  it('calls onView when card is clicked', () => {
    const onViewMock = vi.fn();
    render(
      <CandidateCard 
        candidate={mockCandidate}
        isAdmin={false}
        onEdit={vi.fn()}
        onView={onViewMock}
      />
    );

    const card = screen.getByText('Alice Johnson').closest('.candidate-card');
    if (card) {
      fireEvent.click(card);
    }

    expect(onViewMock).toHaveBeenCalledWith(mockCandidate);
  });
});
