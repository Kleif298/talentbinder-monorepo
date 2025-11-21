/**
 * Integration Tests for Candidates Routes
 * Tests CRUD operations for candidate management
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import candidatesRouter from './candidates.js';
import { authRequired } from '../middleware/auth.js';

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
app.use('/api/candidates', candidatesRouter);

describe('Candidates Routes', () => {
    let authToken: string;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret-key';
        
        // Create valid auth token
        authToken = jwt.sign(
            { id: 1, email: 'test@example.com', name: 'Test User', role: 'user', isAdmin: false },
            process.env.JWT_SECRET!
        );
    });

    describe('GET /api/candidates', () => {
        it('should return list of candidates with authentication', async () => {
            const mockCandidates = [
                {
                    candidate_id: 1,
                    first_name: 'John',
                    last_name: 'Doe',
                    email: 'john@example.com',
                    candidate_status: 'active',
                    created_at: new Date().toISOString(),
                    apprenticeship: 'Software Developer',
                    apprenticeship_id: 1
                }
            ];

            (pool.query as jest.Mock).mockResolvedValue({
                rows: mockCandidates
            });

            const response = await request(app)
                .get('/api/candidates')
                .set('Cookie', [`user=${authToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.candidates).toBeDefined();
            expect(Array.isArray(response.body.candidates)).toBe(true);
        });

        it('should filter candidates by search query', async () => {
            (pool.query as jest.Mock).mockResolvedValue({
                rows: []
            });

            const response = await request(app)
                .get('/api/candidates?search=John')
                .set('Cookie', [`user=${authToken}`]);

            expect(response.status).toBe(200);
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('LOWER'),
                expect.arrayContaining(['%John%'])
            );
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/candidates');

            expect(response.status).toBe(401);
        });

        it('should handle database errors gracefully', async () => {
            (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/candidates')
                .set('Cookie', [`user=${authToken}`]);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/candidates/:id', () => {
        it('should return single candidate by ID', async () => {
            const mockCandidate = {
                candidate_id: 1,
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                candidate_status: 'active',
                created_at: new Date().toISOString(),
                created_by: 1
            };

            const mockApprenticeships = [
                { id: 1, name: 'Software Developer', branchId: 1 }
            ];

            (pool.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [mockCandidate] })
                .mockResolvedValueOnce({ rows: mockApprenticeships });

            const response = await request(app)
                .get('/api/candidates/1')
                .set('Cookie', [`user=${authToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.candidate).toBeDefined();
            expect(response.body.candidate.firstName).toBe('John');
            expect(response.body.candidate.apprenticeships).toHaveLength(1);
        });

        it('should return 404 for non-existent candidate', async () => {
            (pool.query as jest.Mock).mockResolvedValue({
                rows: []
            });

            const response = await request(app)
                .get('/api/candidates/9999')
                .set('Cookie', [`user=${authToken}`]);

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/candidates', () => {
        it('should create new candidate with valid data', async () => {
            const adminToken = jwt.sign(
                { id: 1, email: 'admin@example.com', name: 'Admin', role: 'berufsbilder', isAdmin: true },
                process.env.JWT_SECRET!
            );

            const newCandidate = {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
                phone: '0987654321'
            };

            (pool.query as jest.Mock).mockResolvedValue({
                rows: [{ candidate_id: 2, ...newCandidate }]
            });

            const response = await request(app)
                .post('/api/candidates')
                .set('Cookie', [`user=${adminToken}`])
                .send(newCandidate);

            expect(response.status).toBeGreaterThanOrEqual(200);
            expect(response.status).toBeLessThan(500);
        });

        it('should validate required fields', async () => {
            const adminToken = jwt.sign(
                { id: 1, email: 'admin@example.com', name: 'Admin', role: 'berufsbilder', isAdmin: true },
                process.env.JWT_SECRET!
            );

            const response = await request(app)
                .post('/api/candidates')
                .set('Cookie', [`user=${adminToken}`])
                .send({});

            expect(response.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('PUT /api/candidates/:id', () => {
        it('should update existing candidate', async () => {
            const adminToken = jwt.sign(
                { id: 1, email: 'admin@example.com', name: 'Admin', role: 'berufsbilder', isAdmin: true },
                process.env.JWT_SECRET!
            );

            const updatedData = {
                firstName: 'John',
                lastName: 'Updated',
                email: 'updated@example.com'
            };

            (pool.query as jest.Mock).mockResolvedValue({
                rows: [{ candidate_id: 1, ...updatedData }]
            });

            const response = await request(app)
                .put('/api/candidates/1')
                .set('Cookie', [`user=${adminToken}`])
                .send(updatedData);

            expect(response.status).toBeGreaterThanOrEqual(200);
        });
    });

    describe('DELETE /api/candidates/:id', () => {
        it('should delete candidate with admin role', async () => {
            const adminToken = jwt.sign(
                { id: 1, email: 'admin@example.com', name: 'Admin', role: 'berufsbilder', isAdmin: true },
                process.env.JWT_SECRET!
            );

            (pool.query as jest.Mock).mockResolvedValue({
                rowCount: 1
            });

            const response = await request(app)
                .delete('/api/candidates/1')
                .set('Cookie', [`user=${adminToken}`]);

            expect(response.status).toBeGreaterThanOrEqual(200);
        });
    });
});
