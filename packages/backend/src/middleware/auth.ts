/**
 * Authentication Middleware
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UserData } from '@talentbinder/shared';

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: UserData;
    }
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.user;
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Bitte melden Sie sich an, um fortzufahren.' });
    }
    
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET!) as UserData;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Ungültiger oder abgelaufener Token.' });
    }
}

export function checkAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.user?.role !== 'berufsbilder' && req.user?.role !== 'developer') {
        return res.status(403).json({ success: false, message: 'Zugriff verweigert. Nur Administratoren.' });
    }
    next();
}
