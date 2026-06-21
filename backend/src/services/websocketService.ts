// backend/src/services/websocketService.ts
import { Server } from 'socket.io';
import { io } from '../server';

export class WebSocketService {
  static sendTrackingUpdate(trackingCode: string, data: any) {
    io.to(`shipment:${trackingCode}`).emit('tracking-update', data);
  }
  
  static notifyAdmin(adminId: string, event: string, data: any) {
    io.to(`admin:${adminId}`).emit(event, data);
  }
}