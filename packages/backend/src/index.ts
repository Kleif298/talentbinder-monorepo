import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⚡ CRITICAL: Load ALL environment variables BEFORE any other imports!
// This ensures db.ts and other modules have access to process.env

// 1️⃣ Load base .env (common settings like PORT, JWT)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 2️⃣ ALWAYS load LDAP config (separate concern)
dotenv.config({ path: path.resolve(__dirname, '../.env.ldap'), override: true });

// 3️⃣ Load environment-specific config based on NODE_ENV
const NODE_ENV = process.env.NODE_ENV || 'development';

switch (NODE_ENV) {
  case 'development':
    dotenv.config({ path: path.resolve(__dirname, '../.env.development'), override: true });
    console.log('🟢 Development mode - Local database');
    break;
  case 'render':
    dotenv.config({ path: path.resolve(__dirname, '../.env.render'), override: true });
    console.log('☁️ Render mode - Cloud database (your server)');
    break;
  case 'production':
    dotenv.config({ path: path.resolve(__dirname, '../.env.dal'), override: true });
    console.log('🚀 Production mode - DAL final production');
    break;
  default:
    console.log('⚠️  Unknown environment, using development defaults');
}

console.log(`📌 Environment: ${NODE_ENV}`);
console.log(`🔌 Port: ${process.env.PORT}`);
console.log(`🔗 Frontend: ${process.env.FRONTEND_URL}`);
console.log(`💾 Database: ${process.env.DB_URL ? 'Using DB_URL' : `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`}`);
console.log(`🔐 LDAP: ${process.env.LDAP_URL}`);

// NOW import routes (after env is loaded!)
import authRouter from './routes/auth.js';
import eventsRouter from './routes/events.js';
import candidatesRouter from './routes/candidates.js';
import accountRouter from './routes/account.js';
import lookupRouter from './routes/lookup.js';
import loggingRouter from './routes/logging.js';

import { requestLogger } from './middleware/logging.js';

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:3022',
  'http://localhost:3024',
  'http://localhost:4173',
  'http://localhost:5173',
  'https://talentbinder-frontend.onrender.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow tools like Postman or same-origin
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.get('/api/data', (req: Request, res: Response) => {
  res.json({ message: 'Backend läuft!' });
});

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/candidates', candidatesRouter);
app.use('/api/lookups', lookupRouter);
app.use('/api/users', accountRouter);
app.use('/api/logging', loggingRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
