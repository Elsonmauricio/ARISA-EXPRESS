// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import shipmentRoutes from './routes/shipments';
import quotationRoutes from './routes/quotations';
import adminRoutes from './routes/admin';
import trackingRoutes from './routes/tracking';
import contactRoutes from './routes/contact';

import { errorHandler } from './middleware/errorHandler';
import { db } from './config/firebase';
import { rateLimiter } from './middleware/rateLimit';
import { logger } from './utils/logger';

dotenv.config();

export let io: Server;

const app = express();
const httpServer = createServer(app);

// Socket.IO
io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(morgan('combined'));
app.use(rateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/contact', contactRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// WebSocket connection
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('track-shipment', (trackingCode: string) => {
    socket.join(`shipment:${trackingCode}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  
  // Verificação básica de conectividade com o Firestore
  db.collection('health_check').doc('status').get()
    .then(() => logger.info('✅ Conectado ao Cloud Firestore com sucesso'))
    .catch((err: any) => {
      logger.error('❌ Falha ao conectar ao Cloud Firestore:', err.message);
    });
});