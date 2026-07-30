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
  status: 'PENDING' | 'COLLECTED' | 'IN_TRANSIT' | 'CUSTOMS' | 'IN_PORTUGAL' |'IN_ANGOLA'| 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'READY_FOR_PICKUP' | 'PICKED_UP';
  origin: string;
  destination: string;
  weight: number;
  price?: number;
  readyForPickupAt?: Date;
  pickupDeadline?: Date;
  calculatedFine?: number;
  daysUntilDeadline?: number;
  senderName?: string;
  receiverName?: string;
  receiverPhone?: string;
}

export interface TrackingUpdate {
  id: string;
  shipmentId: string;
  status: string;
  location: string;
  description: string;
  timestamp: Date;
}
