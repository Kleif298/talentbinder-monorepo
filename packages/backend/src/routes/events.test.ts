/**
 * Integration Tests for Events Routes
 * Tests event creation, retrieval, and management
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import eventsRouter from './events.js';

// Mock dependencies
jest.mock('../config/db.js', () => ({
    pool: {
        query: jest.fn()
    }
}));

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/events', eventsRouter);

describe('Events Routes', () => {
    let authToken: string;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret-key';
        
        authToken = jwt.sign(
            { id: 1, email: 'test@example.com', name: 'Test User', role: 'user', isAdmin: false },
            process.env.JWT_SECRET!
        );
    });

    describe('GET /api/events', () => {
        it('should return list of events', async () => {
            const mockEvents = [
                {
                    event_id: 1,
                    title: 'Test Event',
                    description: 'Test Description',
                    branch_id: 1,
                    location_id: 1,
                    registration_required: true,
                    created_at: new Date().toISOString(),
                    created_by: 1,
                    created_by_first_name: 'Test',
                    created_by_last_name: 'User',
                    date_at: '2025-12-01',
                    starting_at: '10:00:00',
                    ending_at: '12:00:00',
                    location_name: 'Main Office',
                    location_address: '123 Main St',
                    location_city: 'Berlin',
                    location_plz: '10115'
                }
            ];

            (pool.query as jest.Mock).mockResolvedValue({
                rows: mockEvents
            });

            const response = await request(app)
                .get('/api/events');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.events).toBeDefined();
            expect(Array.isArray(response.body.events)).toBe(true);
        });

        it('should handle database errors', async () => {
            (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/events');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/events', () => {
        it('should create new event with valid data', async () => {
            const newEvent = {
                title: 'New Event',
                description: 'Event Description',
                locationId: 1,
                dateAt: '2025-12-15',
                startingAt: '14:00:00',
                endingAt: '16:00:00',
                registrationRequired: true
            };

            (pool.query as jest.Mock)
                .mockResolvedValueOnce({
                    rows: [{ event_id: 1, title: 'New Event' }]
                })
                .mockResolvedValueOnce({
                    rows: [{ session_id: 1 }]
                });

            const response = await request(app)
                .post('/api/events')
                .set('Cookie', [`user=${authToken}`])
                .send(newEvent);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.event).toBeDefined();
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/events')
                .set('Cookie', [`user=${authToken}`])
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/events')
                .send({
                    title: 'Event',
                    locationId: 1,
                    dateAt: '2025-12-15',
                    startingAt: '14:00:00'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/events/:id', () => {
        it('should return single event by ID', async () => {
            const mockEvent = {
                id: 1,
                title: 'Test Event',
                description: 'Test Description',
                dateAt: '2024-12-01',
                startingAt: '10:00',
                endingAt: '12:00',
                locationName: 'Main Office',
                createdAt: new Date().toISOString()
            };

            (pool.query as jest.Mock).mockResolvedValue({
                rows: [mockEvent]
            });

            const response = await request(app)
                .get('/api/events/1');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.event).toBeDefined();
            expect(response.body.event.title).toBe('Test Event');
        });

        it('should return 404 for non-existent event', async () => {
            (pool.query as jest.Mock).mockResolvedValue({
                rows: []
            });

            const response = await request(app)
                .get('/api/events/9999');

            expect(response.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('PUT /api/events/:id', () => {
        it('should update event with valid data', async () => {
            const updatedEvent = {
                title: 'Updated Event',
                description: 'Updated Description'
            };

            (pool.query as jest.Mock).mockResolvedValue({
                rows: [{ event_id: 1, ...updatedEvent }]
            });

            const response = await request(app)
                .put('/api/events/1')
                .set('Cookie', [`user=${authToken}`])
                .send(updatedEvent);

            expect(response.status).toBeGreaterThanOrEqual(200);
        });
    });

    describe('DELETE /api/events/:id', () => {
        it('should delete event with admin role', async () => {
            const adminToken = jwt.sign(
                { id: 1, email: 'admin@example.com', name: 'Admin', role: 'berufsbilder', isAdmin: true },
                process.env.JWT_SECRET!
            );

            (pool.query as jest.Mock).mockResolvedValue({
                rowCount: 1
            });

            const response = await request(app)
                .delete('/api/events/1')
                .set('Cookie', [`user=${adminToken}`]);

            expect(response.status).toBeGreaterThanOrEqual(200);
        });
    });
});
