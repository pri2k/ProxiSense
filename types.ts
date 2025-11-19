export type Proximity = 'immediate' | 'near' | 'far' | 'unknown';

export type BeaconCategory =
  | 'Entrance'
  | 'Fashion'
  | 'Electronics'
  | 'Food'
  | 'Grocery'
  | 'Kids'
  | 'Entertainment'
  | string;

export interface Beacon {
  id: string;
  uuid: string;
  major: number;
  minor: number;
  location: string;
  category: BeaconCategory;
  // footprint for the map (coordinates and size within a 0..100 SVG canvas)
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  floor?: number;
  description?: string;
}

export interface DetectedBeacon extends Beacon {
  rssi: number;
  proximity: Proximity;
  detectedAt: number;
}

export interface UserPreferences {
  interests: Set<BeaconCategory>;
  notificationsEnabled?: boolean;
  doNotDisturb?: boolean;
  cooldownSeconds?: number;
  offlineMode?: boolean;
  largeText?: boolean;
}

export interface AppNotification {
  id: number;
  beacon: DetectedBeacon;
  message: string;
  timestamp: number;
  type?: 'in-app' | 'push' | 'sms';
  couponId?: string | null;
  redeemed?: boolean;
}

export interface Coupon {
  id: string;
  beaconId: string;
  title: string;
  code: string;
  description?: string;
  expiresAt?: number | null;
  used?: boolean;
}

export interface QosMetrics {
  latency: number | null;
  notificationCount: number;
  startTime: number;
  signalLogs: { beaconId: string; rssi: number; status: 'online' | 'offline'; timestamp?: number }[];
}
