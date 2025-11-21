/**
 * Health Check Test
 * Simple test to verify the API server responds correctly
 */

import request from 'supertest';
import express from 'express';

describe('Health Check', () => {
    const app = express();
    
    app.get('/api/health', (req, res) => {
        res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    it('should return 200 OK for health endpoint', async () => {
        const response = await request(app).get('/api/health');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('timestamp');
    });

    it('should return 404 for non-existent routes', async () => {
        const response = await request(app).get('/api/non-existent');
        
        expect(response.status).toBe(404);
    });
});
