// backend/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './api/routes/auth';
import userRoutes from './api/routes/users'; 
import routeRoutes from './api/routes/routes';
import shipmentRoutes from './api/routes/shipments';
import quotationRoutes from './api/routes/quotations';
import adminRoutes from './api/routes/admin';
import trackingRoutes from './api/routes/tracking';
import contactRoutes from './api/routes/contact';

import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimit';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173' )
  .split(';')
  .map((o: string) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(morgan('combined'));
app.use(rateLimiter);

// Serve frontend assets (images for WhatsApp notifications)
const frontendAssetsPath = path.resolve(process.cwd(), '../frontend/src/assets');
app.use('/api/assets/images', express.static(frontendAssetsPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);     
app.use('/api/shipments', shipmentRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/routes', routeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

export default app;