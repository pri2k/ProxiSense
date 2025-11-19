import { Beacon, DetectedBeacon, Proximity, UserPreferences, Coupon } from '../types';

export const MOCK_BEACONS: Beacon[] = [
  // Floor 1 (Ground)
  {
    id: 'M001',
    uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825',
    major: 100,
    minor: 1,
    location: 'Main Entrance',
    category: 'Entrance',
    x: 8,
    y: 8,
    w: 18,
    h: 12,
    floor: 1,
    description: 'Main entrance lobby with info desk and directory kiosks.',
  },
  {
    id: 'M002',
    uuid: 'FDA...7825',
    major: 200,
    minor: 1,
    location: 'Fashion Avenue - Zara',
    category: 'Fashion',
    x: 30,
    y: 10,
    w: 22,
    h: 14,
    floor: 1,
    description: 'Women & men clothing, new season arrivals.',
  },
  {
    id: 'M003',
    uuid: 'FDA...7825',
    major: 200,
    minor: 2,
    location: 'ElectroWorld',
    category: 'Electronics',
    x: 58,
    y: 8,
    w: 28,
    h: 18,
    floor: 1,
    description: 'Phones, laptops, accessories and in-store demos.',
  },
  {
    id: 'M004',
    uuid: 'FDA...7825',
    major: 300,
    minor: 1,
    location: 'Food Court',
    category: 'Food',
    x: 20,
    y: 35,
    w: 60,
    h: 20,
    floor: 1,
    description: 'Multiple cuisines, seating area, and restrooms nearby.',
  },

  // Floor 2
  {
    id: 'M005',
    uuid: 'FDA...7825',
    major: 300,
    minor: 2,
    location: 'FreshMart',
    category: 'Grocery',
    x: 10,
    y: 10,
    w: 24,
    h: 16,
    floor: 2,
    description: 'Daily essentials and fresh produce.',
  },
  {
    id: 'M006',
    uuid: 'FDA...7825',
    major: 400,
    minor: 1,
    location: 'Kids Play Zone',
    category: 'Kids',
    x: 40,
    y: 10,
    w: 30,
    h: 20,
    floor: 2,
    description: 'Supervised play area and family services.',
  },
  {
    id: 'M007',
    uuid: 'FDA...7825',
    major: 400,
    minor: 2,
    location: 'Cineplex',
    category: 'Entertainment',
    x: 10,
    y: 40,
    w: 72,
    h: 28,
    floor: 2,
    description: 'Multiplex with several screens and ticket counters.',
  },
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
      return 'Welcome to Grand Mall! See today’s highlights and an interactive map.';
    case 'Fashion':
      return isPreferred
        ? `Special: Extra 15% off at ${beacon.location}. Tap for coupon & directions.`
        : `Visit ${beacon.location} for latest fashion.`;
    case 'Electronics':
      return isPreferred
        ? `Deal: Accessories on discount at ${beacon.location}.`
        : `Explore electronics at ${beacon.location}.`;
    case 'Food':
      return isPreferred
        ? `Today’s special at Food Court: 2-for-1 on selected meals.`
        : `Food Court: many options available nearby.`;
    case 'Grocery':
      return isPreferred
        ? `FreshMart: 20% off produce today.`
        : `FreshMart: groceries and essentials.`;
    case 'Kids':
      return isPreferred
        ? `Kids Play Zone: discounted entry for families today.`
        : `Kids Play Zone: family-friendly activities.`;
    case 'Entertainment':
      return isPreferred
        ? `Cineplex: special screening & offers on tickets.`
        : `Cineplex: check showtimes and book in-app.`;
    default:
      return `Nearby: ${beacon.location}. Open the app for details and directions.`;
  }
};

let detected: Map<string, DetectedBeacon> = new Map();
let offlineBeacons: Set<string> = new Set();

// coupons (unchanged from previous example)
export const MOCK_COUPONS: Coupon[] = [
  { id: 'C-FASH-1', beaconId: 'M002', title: '15% off at Fashion Avenue', code: 'FASH15', description: 'Valid today in-store', expiresAt: null, used: false },
  { id: 'C-FOOD-1', beaconId: 'M004', title: '2-for-1 Lunch Combo', code: 'LUNCH2', description: 'Redeem at Food Court counter', expiresAt: null, used: false },
  { id: 'C-GROC-1', beaconId: 'M005', title: '20% off Fresh Produce', code: 'FRESH20', description: 'Show app at checkout', expiresAt: null, used: false },
];

export const getCouponForBeacon = (beaconId: string): Coupon | undefined => {
  return MOCK_COUPONS.find(c => c.beaconId === beaconId && !c.used);
};

export const redeemCoupon = (couponId: string): Coupon | undefined => {
  const c = MOCK_COUPONS.find(x => x.id === couponId);
  if (c) c.used = true;
  return c;
};

export const simulateScan = (callback: (detectedBeacons: DetectedBeacon[], logs: { beaconId: string; rssi: number; status: 'online' | 'offline' }[]) => void) => {
  const logs: { beaconId: string; rssi: number; status: 'online' | 'offline' }[] = [];

  if (Math.random() < 0.08 && detected.size > 0) {
    const beaconToDrop = Array.from(detected.values())[Math.floor(Math.random() * detected.size)];
    detected.delete(beaconToDrop.id);
    offlineBeacons.add(beaconToDrop.id);
    logs.push({ beaconId: beaconToDrop.id, rssi: -100, status: 'offline' });
  }

  if (Math.random() < 0.18 && offlineBeacons.size > 0) {
    const beaconToRevive = Array.from(offlineBeacons)[0];
    offlineBeacons.delete(beaconToRevive);
  }

  if (Math.random() < 0.35 && detected.size < 4) {
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

// helper: get beacon by id
export const getBeaconById = (id: string): Beacon | undefined => {
  return MOCK_BEACONS.find(b => b.id === id);
};
