
import { Beacon, DetectedBeacon, Proximity, BeaconCategory, UserPreferences } from '../types';

export const MOCK_BEACONS: Beacon[] = [
  { id: 'B001', uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825', major: 100, minor: 1, location: 'Museum Entrance', category: 'Entrance' },
  { id: 'B002', uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825', major: 200, minor: 1, location: 'Ancient Egypt Exhibit', category: 'History' },
  { id: 'B003', uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825', major: 200, minor: 2, location: 'Roman Empire Hall', category: 'History' },
  { id: 'B004', uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825', major: 300, minor: 1, location: 'Renaissance Art Gallery', category: 'Art' },
  { id: 'B005', uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825', major: 300, minor: 2, location: 'Impressionist Wing', category: 'Art' },
  { id: 'B006', uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825', major: 400, minor: 1, location: 'Dinosaur Fossils', category: 'Science' },
  { id: 'B007', uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825', major: 400, minor: 2, location: 'Space Exploration', category: 'Science' },
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
      return 'Welcome to the Grand Museum! Your journey through time and art begins here.';
    case 'History':
      return isPreferred 
        ? `A special highlight for you in the ${beacon.location}: Don't miss the Rosetta Stone replica!`
        : `You are now in the ${beacon.location}. Discover artifacts from millennia ago.`;
    case 'Art':
      return isPreferred
        ? `Art lover! In the ${beacon.location}, look for "The Starry Night" by Van Gogh.`
        : `Explore the masterpieces in the ${beacon.location}.`;
    case 'Science':
       return isPreferred
        ? `Calling all science enthusiasts! The ${beacon.location} has a new interactive display.`
        : `Uncover the wonders of science in the ${beacon.location}.`;
    default:
      return `You've entered the ${beacon.location} zone.`;
  }
};


let detected: Map<string, DetectedBeacon> = new Map();
let offlineBeacons: Set<string> = new Set();

export const simulateScan = (callback: (detectedBeacons: DetectedBeacon[], logs: { beaconId: string; rssi: number; status: 'online' | 'offline' }[]) => void) => {
    const logs: { beaconId: string; rssi: number; status: 'online' | 'offline' }[] = [];

    // Simulate beacons going offline
    if (Math.random() < 0.1 && detected.size > 0) {
        const beaconToDrop = Array.from(detected.values())[Math.floor(Math.random() * detected.size)];
        detected.delete(beaconToDrop.id);
        offlineBeacons.add(beaconToDrop.id);
        logs.push({ beaconId: beaconToDrop.id, rssi: -100, status: 'offline' });
    }

    // Simulate beacons coming back online
    if (Math.random() < 0.2 && offlineBeacons.size > 0) {
        const beaconToRevive = Array.from(offlineBeacons)[0];
        offlineBeacons.delete(beaconToRevive);
    }
    
    // Simulate detecting a new beacon
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

    // Update existing detected beacons
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

    const rssi = generateRandomRssi(-45, 10); // Simulate close range for manual test
    const detectedBeacon: DetectedBeacon = {
        ...beacon,
        rssi,
        proximity: getProximity(rssi),
        detectedAt: Date.now(),
    };
    
    // Add or update it in the main detected list
    detected.set(beaconId, detectedBeacon);

    return detectedBeacon;
};
