import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { authRequired } from '../middleware/auth.js';

// Type definitions for auth utils (temporary until utils/auth.js is converted)
interface AuthUser {
    id: number;
    email: string;
    name: string;
    role: string;
}

interface LdapModule {
    authenticateLdapUser: (email: string, password: string) => Promise<{
        uid: string;
        email: string;
        name: string;
        givenName?: string;
        surname?: string;
    } | null>;
    isLdapServerReachable: () => Promise<boolean>;
}

const router = express.Router();
let ldapFunctions: LdapModule | null = null;

async function initLdapFunctions() {
    if (!ldapFunctions) {
        try {
            ldapFunctions = await import("../config/ldap.js") as LdapModule;
            console.log('✅ LDAP module loaded');
        } catch (err) {
            console.error('⚠️ LDAP module load failed:', (err as Error).message);
        }
    }
    return ldapFunctions;
}

// Temporary wrapper functions for auth utils
async function getOrCreateUser(email: string, firstName: string, lastName: string, uid: string): Promise<AuthUser> {
    const { getOrCreateUser: getUser } = await import('../utils/auth.js');
    return getUser(email, firstName, lastName, uid);
}

function createAuthToken(user: AuthUser): string {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not configured');
    
    const tokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.role === 'berufsbilder' || user.role === 'developer'
    };
    
    return jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

router.get('/ldap-status', async (req: Request, res: Response) => {
    await initLdapFunctions();
    const isReachable = ldapFunctions ? await ldapFunctions.isLdapServerReachable() : false;
    res.json({ success: true, ldapAvailable: isReachable });
});

router.post('/login', async (req: Request, res: Response) => {
    const { email, password, preferredMethod } = req.body;

    console.log('🔵 Login:', { email, preferredMethod });

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'E-Mail und Passwort erforderlich.' });
    }

    if (!email.endsWith('@sunrise.net')) {
        return res.status(400).json({ success: false, message: 'Bitte @sunrise.net E-Mail verwenden.' });
    }

    try {
        let user: AuthUser;
        let token: string;

        if (preferredMethod === 'ldap') {
            await initLdapFunctions();
            
            if (!ldapFunctions || !(await ldapFunctions.isLdapServerReachable())) {
                return res.status(503).json({ 
                    success: false, 
                    message: 'LDAP-Server nicht erreichbar. Bitte DAL-Netzwerk verbinden oder lokalen Login nutzen.' 
                });
            }

            console.log('🔵 LDAP authentication...');
            const ldapUser = await ldapFunctions.authenticateLdapUser(email, password);
            
            if (!ldapUser) {
                return res.status(401).json({ success: false, message: 'Ungültige LDAP-Anmeldedaten.' });
            }

            console.log('✅ LDAP success');
            user = await getOrCreateUser(
                ldapUser.email,
                ldapUser.givenName || ldapUser.name.split(' ')[0],
                ldapUser.surname || ldapUser.name.split(' ')[1] || '',
                ldapUser.uid
            );

        } else if (preferredMethod === 'local') {
            console.log('🔵 Local authentication...');
            
            const result = await pool.query(
                'SELECT account_id, first_name, last_name, email, password_hash, role FROM account WHERE email = $1',
                [email]
            );
            
            if (result.rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Benutzer nicht gefunden.' });
            }

            const dbUser = result.rows[0];
            
            if (!dbUser.password_hash) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Kein lokales Passwort. Bitte LDAP-Login nutzen.' 
                });
            }

            if (!(await bcrypt.compare(password, dbUser.password_hash))) {
                return res.status(401).json({ success: false, message: 'Ungültiges Passwort.' });
            }

            console.log('✅ Local success');
            const fullName = `${dbUser.first_name} ${dbUser.last_name}`;
            user = {
                id: dbUser.account_id,
                email: dbUser.email,
                name: fullName,
                role: dbUser.role
            };

        } else {
            return res.status(400).json({ success: false, message: 'Ungültige Login-Methode.' });
        }

        // Create token and send ONLY as cookie
        token = createAuthToken(user);
        
        res.cookie('user', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000
        });
        
        return res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isAdmin: user.role === 'berufsbilder' || user.role === 'developer'
            }
        });

    } catch (err) {
        console.error('❌ Login error:', err);
        return res.status(500).json({ success: false, message: 'Ein Fehler ist aufgetreten.' });
    }
});

router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('user', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    
    console.log('✅ User logged out');
    res.json({ success: true, message: 'Erfolgreich abgemeldet.' });
});

router.get('/me', authRequired, (req: Request, res: Response) => {
    const user = req.user!;
    // Handle both name formats for compatibility
    const fullName = (user as any).name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
    
    return res.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            name: fullName,
            role: user.role,
            isAdmin: user.role === 'berufsbilder' || user.role === 'developer' || false
        }
    });
});

export default router;
