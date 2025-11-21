/**
 * Unit Tests for Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { authRequired, checkAdmin } from './auth.js';
import jwt from 'jsonwebtoken';

describe('Authentication Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            cookies: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        nextFunction = jest.fn();
        process.env.JWT_SECRET = 'test-secret-key';
    });

    describe('authRequired', () => {
        it('should pass authentication with valid token', () => {
            const userData = { id: 1, email: 'test@example.com', name: 'Test User', role: 'user' };
            const token = jwt.sign(userData, process.env.JWT_SECRET!);
            
            mockRequest.cookies = { user: token };

            authRequired(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
            expect(mockRequest.user).toBeDefined();
            expect(mockRequest.user?.id).toBe(1);
            expect(mockRequest.user?.email).toBe('test@example.com');
        });

        it('should reject request without token', () => {
            mockRequest.cookies = {};

            authRequired(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: expect.stringContaining('melden Sie sich an')
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it('should reject request with invalid token', () => {
            mockRequest.cookies = { user: 'invalid-token' };

            authRequired(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: expect.stringContaining('Ungültiger')
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it('should reject request with expired token', () => {
            const userData = { id: 1, email: 'test@example.com', name: 'Test User', role: 'user' };
            const expiredToken = jwt.sign(userData, process.env.JWT_SECRET!, { expiresIn: '-1h' });
            
            mockRequest.cookies = { user: expiredToken };

            authRequired(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });

    describe('checkAdmin', () => {
        it('should allow access for berufsbilder role', () => {
            mockRequest.user = {
                id: 1,
                email: 'admin@example.com',
                name: 'Admin User',
                role: 'berufsbilder',
                isAdmin: true
            };

            checkAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should allow access for developer role', () => {
            mockRequest.user = {
                id: 1,
                email: 'dev@example.com',
                name: 'Developer',
                role: 'developer',
                isAdmin: true
            };

            checkAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
        });

        it('should deny access for regular user role', () => {
            mockRequest.user = {
                id: 1,
                email: 'user@example.com',
                name: 'Regular User',
                role: 'user',
                isAdmin: false
            };

            checkAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: expect.stringContaining('Administratoren')
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it('should deny access when user is not defined', () => {
            mockRequest.user = undefined;

            checkAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });
});
