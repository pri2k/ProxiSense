
export type Proximity = 'immediate' | 'near' | 'far' | 'unknown';

export type BeaconCategory = 'History' | 'Art' | 'Science' | 'Entrance';

export interface Beacon {
  id: string;
  uuid: string;
  major: number;
  minor: number;
  location: string;
  category: BeaconCategory;
}

export interface DetectedBeacon extends Beacon {
  rssi: number;
  proximity: Proximity;
  detectedAt: number;
}

export interface AppNotification {
  id: number;
  beacon: Beacon;
  message: string;
  timestamp: number;
}

export interface UserPreferences {
  interests: Set<BeaconCategory>;
}

export interface SignalLog {
  timestamp: number;
  beaconId: string;
  rssi: number;
  status: 'online' | 'offline';
}

export interface QosMetrics {
  latency: number | null;
  notificationCount: number;
  startTime: number;
  signalLogs: SignalLog[];
}
