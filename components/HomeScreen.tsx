import React from 'react';
import { DetectedBeacon, AppNotification, UserPreferences, Beacon, BeaconCategory } from '../types';
import { MOCK_BEACONS } from '../services/beaconService';

interface HomeScreenProps {
  nearestBeacon: DetectedBeacon | null;
  lastNotification: AppNotification | null;
  userPreferences: UserPreferences;
  onUpdatePreferences: (category: BeaconCategory) => void;
  onManualDetect: (beaconId: string) => void;
  onShowCoupon: (beaconId: string) => void;
  onNavigateTo: (beaconId: string) => void; // NEW: navigate user to map & center
  recommendations: Beacon[];
}

const ProximityIndicator: React.FC<{ proximity: string }> = ({ proximity }) => {
  const baseClasses = "w-4 h-4 rounded-full";
  let color = "bg-gray-400";
  if (proximity === 'immediate') color = "bg-green-500";
  else if (proximity === 'near') color = "bg-yellow-500";
  else if (proximity === 'far') color = "bg-red-500";

  return <div className={`${baseClasses} ${color}`} title={proximity}></div>;
};

const SignalStrength: React.FC<{ rssi: number }> = ({ rssi }) => {
  const bars = 4;
  const threshold = -90;
  const range = 40;
  const strength = Math.max(0, Math.min(bars, Math.ceil(((rssi - threshold) / range) * bars)));

  return (
    <div className="flex items-end space-x-0.5 h-5">
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} className={`w-1.5 ${i < strength ? 'bg-light-primary dark:bg-dark-primary' : 'bg-gray-300 dark:bg-gray-600'}`} style={{ height: `${(i + 1) * 25}%` }}></div>
      ))}
    </div>
  );
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ nearestBeacon, lastNotification, userPreferences, onUpdatePreferences, onManualDetect, onShowCoupon, onNavigateTo, recommendations }) => {
  const [manualBeaconId, setManualBeaconId] = React.useState<string>(MOCK_BEACONS[0]?.id || '');

  const handleManualDetect = () => {
    if (manualBeaconId) {
      onManualDetect(manualBeaconId);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 text-light-text dark:text-dark-text">
      <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-3">Nearest Store / Spot</h2>
        {nearestBeacon ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">{nearestBeacon.location}</span>
              <span className="text-sm px-2 py-1 bg-light-primary/10 text-light-primary dark:bg-dark-primary/20 dark:text-dark-primary rounded-full">{nearestBeacon.category}</span>
            </div>
            <div className="text-sm text-light-subtext dark:text-dark-subtext">
              <p>ID: {nearestBeacon.id} (Major: {nearestBeacon.major}, Minor: {nearestBeacon.minor})</p>
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center space-x-2">
                <ProximityIndicator proximity={nearestBeacon.proximity} />
                <span className="capitalize">{nearestBeacon.proximity}</span>
              </div>
              <div className="flex items-center space-x-2">
                <SignalStrength rssi={nearestBeacon.rssi} />
                <span className="text-sm font-mono">{nearestBeacon.rssi} dBm</span>
              </div>
            </div>
            <div className="flex gap-2 pt-3">
              <button onClick={() => onShowCoupon(nearestBeacon.id)} className="px-3 py-1 bg-light-accent text-white rounded">View Coupon</button>
              <button onClick={() => onNavigateTo(nearestBeacon.id)} className="px-3 py-1 border rounded">Get Directions</button>
            </div>
          </div>
        ) : (
          <p className="text-light-subtext dark:text-dark-subtext">No stores detected nearby. Move around or simulate a detection.</p>
        )}
      </div>

      <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-3">Last Offer / Notification</h2>
        {lastNotification ? (
          <div>
            <p className="italic">"{lastNotification.message}"</p>
            <p className="text-right text-xs text-light-subtext dark:text-dark-subtext mt-2">
              For {lastNotification.beacon.location} at {new Date(lastNotification.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <p className="text-light-subtext dark:text-dark-subtext">No notifications received yet.</p>
        )}
      </div>

      <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-3">Personalized Mall Recommendations</h2>
        <p className="text-sm text-light-subtext dark:text-dark-subtext mb-4">Select categories to receive offers relevant to you:</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {(['Fashion', 'Electronics', 'Food', 'Grocery', 'Entertainment', 'Kids'] as BeaconCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => onUpdatePreferences(cat)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                userPreferences.interests.has(cat)
                  ? 'bg-light-primary text-white dark:bg-dark-primary dark:text-dark-bg'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <ul className="space-y-2">
          {recommendations.length > 0 ? recommendations.map(rec => (
            <li key={rec.id} className="text-light-subtext dark:text-dark-subtext p-2 rounded-md bg-light-bg dark:bg-dark-bg">
              <span className="font-semibold text-light-primary dark:text-dark-primary">{rec.category}:</span> {rec.location}
            </li>
          )) : <li className="text-light-subtext dark:text-dark-subtext">Select a category to see recommendations.</li>}
        </ul>
      </div>

      <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-3">Manual Beacon Test</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={manualBeaconId}
            onChange={(e) => setManualBeaconId(e.target.value)}
            className="flex-grow p-2 border border-gray-300 rounded-md bg-light-bg dark:bg-dark-bg dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-light-primary"
          >
            {MOCK_BEACONS.map(beacon => (
              <option key={beacon.id} value={beacon.id}>{beacon.location} ({beacon.id})</option>
            ))}
          </select>
          <button
            onClick={handleManualDetect}
            className="px-4 py-2 bg-light-accent text-white rounded-md hover:bg-green-600 dark:bg-dark-accent dark:hover:bg-green-500 transition-colors font-semibold"
          >
            Simulate Detection
          </button>
        </div>
      </div>
    </div>
  );
};
