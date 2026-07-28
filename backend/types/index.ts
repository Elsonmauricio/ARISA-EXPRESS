// backend/src/types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR' | 'CLIENT';
  phone?: string;
  company?: string;
}

export interface Shipment {
  id: string;
  trackingCode: string;
  status: 'PENDING' | 'COLLECTED' | 'IN_TRANSIT' | 'CUSTOMS' | 'IN_PORTUGAL' |'IN_ANGOLA'| 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
    | 'REGISTERED' | 'SHIPPED' | 'IN_CUSTOMS' | 'READY_FOR_PICKUP' | 'PICKED_UP';
  origin: string;
  destination: string;
  route?: string;
  weight: number;
  price?: number;
  freightValue?: number;
  category?: string;
  paymentStatus?: 'PAID' | 'PENDING';
  senderName: string;
  senderContact?: string;
  senderPhone?: string;
  receiverName: string;
  receiverContact?: string;
  receiverPhone?: string;
  shipmentDate?: any;
  cttCode?: string;
  cttLink?: string;
  userId?: string;
  routeId?: string;
  description?: string;
  serviceType?: string;
  createdAt?: any;
  history?: any[];
  currentLocation?: string;
  progress?: number;
}

export interface TrackingUpdate {
  id: string;
  shipmentId: string;
  status: string;
  location: string;
  description: string;
  timestamp: Date;
}