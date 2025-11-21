import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      token: 'mock-jwt-token',
      user: {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'berufsbilder',
        isAdmin: false,
      },
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      success: true,
      user: {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'berufsbilder',
        isAdmin: false,
      },
    });
  }),

  // Events endpoints
  http.get('/api/events', () => {
    return HttpResponse.json({
      success: true,
      events: [
        {
          id: 1,
          title: 'Test Event 1',
          description: 'Description 1',
          dateAt: '2025-12-01',
          startingAt: '10:00:00',
          endingAt: '12:00:00',
          locationName: 'Berlin',
          locationAddress: 'Main Street 1',
          locationCity: 'Berlin',
          locationPlz: '10115',
          createdByFirstName: 'John',
          createdByLastName: 'Doe',
        },
        {
          id: 2,
          title: 'Test Event 2',
          description: 'Description 2',
          dateAt: '2025-12-02',
          startingAt: '14:00:00',
          endingAt: '16:00:00',
          locationName: 'Munich',
          locationAddress: 'Second Street 2',
          locationCity: 'Munich',
          locationPlz: '80331',
          createdByFirstName: 'Jane',
          createdByLastName: 'Smith',
        },
      ],
    });
  }),

  http.get('/api/events/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      success: true,
      event: {
        id: Number(id),
        title: `Test Event ${id}`,
        description: `Description ${id}`,
        dateAt: '2025-12-01',
        startingAt: '10:00:00',
        endingAt: '12:00:00',
        locationName: 'Berlin',
        locationAddress: 'Main Street 1',
        locationCity: 'Berlin',
        locationPlz: '10115',
        createdByFirstName: 'John',
        createdByLastName: 'Doe',
      },
    });
  }),

  // Candidates endpoints
  http.get('/api/candidates', () => {
    return HttpResponse.json({
      success: true,
      candidates: [
        {
          id: 1,
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice@example.com',
          phone: '123-456-7890',
          city: 'Berlin',
        },
        {
          id: 2,
          firstName: 'Bob',
          lastName: 'Williams',
          email: 'bob@example.com',
          phone: '098-765-4321',
          city: 'Munich',
        },
      ],
    });
  }),

  http.get('/api/candidates/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      success: true,
      candidate: {
        id: Number(id),
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        phone: '123-456-7890',
        city: 'Berlin',
        apprenticeships: [],
      },
    });
  }),
];
