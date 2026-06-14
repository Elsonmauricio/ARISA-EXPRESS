// backend/src/services/websocketService.ts
import { Server as SocketServer } from 'socket.io';
import { prisma } from '../server';

export class WebSocketService {
  private io: SocketServer;
  
  constructor(io: SocketServer) {
    this.io = io;
  }
  
  async sendTrackingUpdate(trackingCode: string, data: any) {
    this.io.to(`shipment:${trackingCode}`).emit('tracking-update', data);
    
    // Store in Redis for persistence (optional)
    // await redisClient.setex(`tracking:${trackingCode}`, 3600, JSON.stringify(data));
  }
  
  async notifyAdmin(adminId: string, event: string, data: any) {
    this.io.to(`admin:${adminId}`).emit(event, data);
  }
  
  async broadcastDashboardUpdate(stats: any) {
    this.io.emit('dashboard-update', stats);
  }
}