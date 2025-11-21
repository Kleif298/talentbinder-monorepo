/**
 * Unit Tests for Authentication Utilities
 */

import { getOrCreateUser, createAuthToken } from './auth.js';
import { pool } from '../config/db.js';

// Mock the database pool
jest.mock('../config/db.js', () => ({
    pool: {
        query: jest.fn()
    }
}));

describe('Authentication Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getOrCreateUser', () => {
        it('should return existing user when found by email', async () => {
            const mockUser = {
                account_id: 1,
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Doe',
                role: 'user'
            };

            (pool.query as jest.Mock).mockResolvedValue({
                rows: [mockUser]
            });

            const result = await getOrCreateUser('test@example.com', 'John', 'Doe', 'uid123');

            expect(result).toEqual({
                id: 1,
                email: 'test@example.com',
                name: 'John Doe',
                role: 'user'
            });
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT account_id'),
                ['test@example.com', 'uid123']
            );
        });

        it('should create new user when not found', async () => {
            const mockNewUser = {
                account_id: 2,
                email: 'newuser@example.com',
                first_name: 'Jane',
                last_name: 'Smith',
                role: 'user'
            };

            (pool.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [] }) // User not found
                .mockResolvedValueOnce({ rows: [mockNewUser] }); // User created

            const result = await getOrCreateUser('newuser@example.com', 'Jane', 'Smith', 'uid456');

            expect(result).toEqual({
                id: 2,
                email: 'newuser@example.com',
                name: 'Jane Smith',
                role: 'user'
            });
            expect(pool.query).toHaveBeenCalledTimes(2);
        });

        it('should handle database errors gracefully', async () => {
            (pool.query as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

            await expect(
                getOrCreateUser('error@example.com', 'Error', 'User', 'uid789')
            ).rejects.toThrow('Database connection failed');
        });
    });

    describe('createAuthToken', () => {
        it('should generate a valid JWT token', () => {
            const userData = {
                id: 1,
                email: 'test@example.com',
                name: 'John Doe',
                role: 'user'
            };

            process.env.JWT_SECRET = 'test-secret-key';
            const token = createAuthToken(userData);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.').length).toBe(3); // JWT has 3 parts
        });

        it('should throw error when JWT_SECRET is not configured', () => {
            delete process.env.JWT_SECRET;
            
            const userData = {
                id: 1,
                email: 'test@example.com',
                name: 'John Doe',
                role: 'user'
            };

            expect(() => createAuthToken(userData)).toThrow('JWT_SECRET not configured');
        });
    });
});
