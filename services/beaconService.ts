import { Beacon, DetectedBeacon, Proximity, BeaconCategory, UserPreferences } from '../types';

export const MOCK_BEACONS: Beacon[] = [
  { id: 'M001', uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825', major: 100, minor: 1, location: 'Mall Entrance', category: 'Entrance' },
  { id: 'M002', uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825', major: 200, minor: 1, location: 'Fashion Avenue - Zara', category: 'Fashion' },
  { id: 'M003', uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825', major: 200, minor: 2, location: 'ElectroWorld - Ground Floor', category: 'Electronics' },
  { id: 'M004', uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825', major: 300, minor: 1, location: 'Food Court', category: 'Food' },
  { id: 'M005', uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825', major: 300, minor: 2, location: 'FreshMart Grocery', category: 'Grocery' },
  { id: 'M006', uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825', major: 400, minor: 1, location: 'Kids Play Zone', category: 'Kids' },
  { id: 'M007', uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825', major: 400, minor: 2, location: 'Cineplex - Multiplex', category: 'Entertainment' },
];

const getProximity = (rssi: number): Proximity => {
  if (rssi > -60) return 'immediate';
  if (rssi > -75) return 'near';
  if (rssi > -90) return 'far';
  return 'unknown';
};

const generateRandomRssi = (base: number = -75, range: number = 20): number => {
  return Math.floor(base - range / 2 + Math.random() * range);
};

export const generatePersonalizedMessage = (beacon: Beacon, preferences: UserPreferences): string => {
  const isPreferred = preferences.interests.has(beacon.category);
  switch (beacon.category) {
    case 'Entrance':
      return 'Welcome to Grand Mall! Check today’s top deals and maps on the app.';
    case 'Fashion':
      return isPreferred
        ? `Deal for you: Extra 15% off at ${beacon.location}. Tap to view coupon and directions.`
        : `${beacon.location} has new arrivals — tap to view offers and sizes available.`;
    case 'Electronics':
      return isPreferred
        ? `Hot pick: Discount on latest headphones at ${beacon.location}. See specs and price.`
        : `Explore electronics at ${beacon.location}. Exclusive in-store bundles available.`;
    case 'Food':
      return isPreferred
        ? `Hungry? ${beacon.location} has a 2-for-1 lunch combo — show this notification to redeem.`
        : `Check out the Food Court for a variety of cuisines and quick snacks.`;
    case 'Grocery':
      return isPreferred
        ? `Save 20% on fresh produce at ${beacon.location}. Limited time offer today.`
        : `FreshMart Grocery nearby. Get essentials and ready-to-eat meals.`;
    case 'Kids':
      return isPreferred
        ? `Kids zone special: Buy 1 get 1 on selected toys at ${beacon.location}.`
        : `Family-friendly area: ${beacon.location} has supervised playtime and snacks.`;
    case 'Entertainment':
      return isPreferred
        ? `Movies & more: ${beacon.location} is showing a special screening — grab tickets in-app.`
        : `Catch the latest movies at ${beacon.location}. Check showtimes and offers.`;
    default:
      return `You're near ${beacon.location}. Open the app for offers and directions.`;
  }
};

let detected: Map<string, DetectedBeacon> = new Map();
let offlineBeacons: Set<string> = new Set();

export const simulateScan = (callback: (detectedBeacons: DetectedBeacon[], logs: { beaconId: string; rssi: number; status: 'online' | 'offline' }[]) => void) => {
  const logs: { beaconId: string; rssi: number; status: 'online' | 'offline' }[] = [];

  if (Math.random() < 0.1 && detected.size > 0) {
    const beaconToDrop = Array.from(detected.values())[Math.floor(Math.random() * detected.size)];
    detected.delete(beaconToDrop.id);
    offlineBeacons.add(beaconToDrop.id);
    logs.push({ beaconId: beaconToDrop.id, rssi: -100, status: 'offline' });
  }

  if (Math.random() < 0.2 && offlineBeacons.size > 0) {
    const beaconToRevive = Array.from(offlineBeacons)[0];
    offlineBeacons.delete(beaconToRevive);
  }

  if (Math.random() < 0.3 && detected.size < 4) {
    const availableBeacons = MOCK_BEACONS.filter(b => !detected.has(b.id) && !offlineBeacons.has(b.id));
    if (availableBeacons.length > 0) {
      const newBeacon = availableBeacons[Math.floor(Math.random() * availableBeacons.length)];
      const rssi = generateRandomRssi();
      detected.set(newBeacon.id, {
        ...newBeacon,
        rssi,
        proximity: getProximity(rssi),
        detectedAt: Date.now(),
      });
      logs.push({ beaconId: newBeacon.id, rssi: rssi, status: 'online' });
    }
  }

  detected.forEach(beacon => {
    const rssi = generateRandomRssi(beacon.rssi, 5);
    const updatedBeacon: DetectedBeacon = {
      ...beacon,
      rssi,
      proximity: getProximity(rssi),
      detectedAt: Date.now(),
    };
    detected.set(beacon.id, updatedBeacon);
    logs.push({ beaconId: beacon.id, rssi: rssi, status: 'online' });
  });

  callback(Array.from(detected.values()), logs);
};

export const manuallyDetectBeacon = (beaconId: string): DetectedBeacon => {
  const beacon = MOCK_BEACONS.find(b => b.id === beaconId);
  if (!beacon) throw new Error("Beacon not found");

  const rssi = generateRandomRssi(-45, 10);
  const detectedBeacon: DetectedBeacon = {
    ...beacon,
    rssi,
    proximity: getProximity(rssi),
    detectedAt: Date.now(),
  };

  detected.set(beaconId, detectedBeacon);

  return detectedBeacon;
};
