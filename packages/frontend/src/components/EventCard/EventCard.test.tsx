import { describe, it, expect } from 'vitest';
import { render, screen } from '~/test/testUtils';
import EventCard from './EventCard';

// Mock event data
const mockEvent = {
  id: 1,
  title: 'Test Event',
  description: 'This is a test event description',
  dateAt: '2025-12-01',
  startingAt: '10:00:00',
  endingAt: '12:00:00',
  locationId: 1,
  locationName: 'Test Location',
  locationAddress: 'Test Address 1',
  locationCity: 'Berlin',
  locationPlz: '10115',
  createdById: 1,
  createdByAccountId: 1,
  createdByFirstName: 'John',
  createdByLastName: 'Doe',
  createdAt: '2025-11-01T10:00:00Z',
  updatedAt: '2025-11-01T10:00:00Z',
};

describe('EventCard', () => {
  it('renders event details correctly', () => {
    render(
      <EventCard 
        event={mockEvent}
        onEdit={() => {}}
        onView={() => {}}
        registrationCount={5}
        readonly={true}
      />
    );

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText(/This is a test event description/)).toBeInTheDocument();
    // Check that the date and time are displayed
    expect(screen.getByText(/1\.12\.2025/)).toBeInTheDocument();
  });

  it('displays registration count when provided', () => {
    render(
      <EventCard 
        event={mockEvent}
        onEdit={() => {}}
        onView={() => {}}
        registrationCount={5}
        readonly={true}
      />
    );

    // Check for the registration count more specifically
    const metaValue = screen.getAllByText('5').find(el => 
      el.closest('.meta-content')?.querySelector('.meta-label')?.textContent === 'Anmeldungen'
    );
    expect(metaValue).toBeInTheDocument();
  });

  it('formats date and time correctly', () => {
    render(
      <EventCard 
        event={mockEvent}
        onEdit={() => {}}
        onView={() => {}}
        readonly={true}
      />
    );

    // Check if formatted date is present (1.12.2025 format)
    expect(screen.getByText(/1\.12\.2025/)).toBeInTheDocument();
    // Check if times are present
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
    expect(screen.getByText(/12:00/)).toBeInTheDocument();
  });
});
