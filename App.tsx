import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { QosScreen } from './components/QosScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { NotificationsPanel } from './components/NotificationsPanel';
import { CouponModal } from './components/CoupanModal';
import { MallMap } from './components/MallMap';

import { DetectedBeacon, AppNotification, UserPreferences, QosMetrics, BeaconCategory, Beacon, Coupon } from './types';
import { simulateScan, generatePersonalizedMessage, manuallyDetectBeacon, MOCK_BEACONS, getCouponForBeacon, redeemCoupon, getBeaconById } from './services/beaconService';

type Theme = 'light' | 'dark';
type ActiveTab = 'home' | 'map' | 'notifications' | 'settings' | 'qos';

const defaultPrefs: UserPreferences = {
  interests: new Set(['Fashion']),
  notificationsEnabled: true,
  doNotDisturb: false,
  cooldownSeconds: 20,
  offlineMode: false,
  largeText: false,
};

const ThemeToggle: React.FC<{ theme: Theme; toggleTheme: () => void }> = ({ theme, toggleTheme }) => {
  return (
      <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-light-text dark:text-dark-text">
          {theme === 'light' ? '🌞' : '🌙'}
      </button>
  );
};

function App() {
  const [theme, setTheme] = useState<Theme>('light');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  const [detectedBeacons, setDetectedBeacons] = useState<DetectedBeacon[]>([]);
  const [nearestBeacon, setNearestBeacon] = useState<DetectedBeacon | null>(null);
  const [lastNotification, setLastNotification] = useState<AppNotification | null>(null);

  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    try {
      const raw = localStorage.getItem('prefs');
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.interests = new Set(parsed.interests || []);
        return { ...defaultPrefs, ...parsed };
      }
    } catch {}
    return defaultPrefs;
  });

  const [notificationsHistory, setNotificationsHistory] = useState<AppNotification[]>(() => {
    try {
      const raw = localStorage.getItem('notifications');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const [couponToShow, setCouponToShow] = useState<Coupon | null>(null);

  const [qosMetrics, setQosMetrics] = useState<QosMetrics>({
    latency: null,
    notificationCount: 0,
    startTime: Date.now(),
    signalLogs: [],
  });

  // map highlight id used to center map on request
  const [mapHighlightId, setMapHighlightId] = useState<string | null>(null);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // persist preferences & notifications
  useEffect(() => {
    try {
      const toSave = { ...userPreferences, interests: Array.from(userPreferences.interests) };
      localStorage.setItem('prefs', JSON.stringify(toSave));
    } catch {}
  }, [userPreferences]);

  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notificationsHistory));
    } catch {}
  }, [notificationsHistory]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const applyCooldownFilter = useCallback((prefs: UserPreferences, existing: AppNotification[]) => {
    if (!prefs.cooldownSeconds) return true;
    const last = existing.length > 0 ? existing[existing.length - 1] : null;
    if (!last) return true;
    return (Date.now() - last.timestamp) / 1000 > (prefs.cooldownSeconds || 0);
  }, []);

  const handleNewBeaconState = useCallback((beacons: DetectedBeacon[], detectionTime: number) => {
    beacons.sort((a,b) => b.rssi - a.rssi);
    setDetectedBeacons(beacons);
    const newNearest = beacons.length > 0 ? beacons[0] : null;

    if (!userPreferences.notificationsEnabled || userPreferences.doNotDisturb) {
      setNearestBeacon(newNearest);
      return;
    }

    if (userPreferences.offlineMode) {
      setNearestBeacon(newNearest);
      return;
    }

    if (newNearest && newNearest.id !== nearestBeacon?.id) {
      setNearestBeacon(newNearest);

      // check cooldown
      if (!applyCooldownFilter(userPreferences, notificationsHistory)) return;

      const message = generatePersonalizedMessage(newNearest, userPreferences);
      const coupon = getCouponForBeacon(newNearest.id);

      const notification: AppNotification = {
        id: Date.now(),
        beacon: newNearest,
        message,
        timestamp: Date.now(),
        type: 'in-app',
        couponId: coupon?.id ?? null,
        redeemed: false,
      };
      setLastNotification(notification);
      setNotificationsHistory(prev => [...prev, notification]);
      setQosMetrics(prev => ({
        ...prev,
        latency: Date.now() - detectionTime,
        notificationCount: prev.notificationCount + 1,
      }));

      // auto-open coupon modal if coupon present
      if (coupon) {
        setCouponToShow(coupon);
      }
    } else if (!newNearest) {
      setNearestBeacon(null);
    } else if (newNearest) {
      setNearestBeacon(newNearest);
    }
  }, [nearestBeacon, userPreferences, notificationsHistory, applyCooldownFilter]);

  useEffect(() => {
    const scanInterval = setInterval(() => {
      const detectionTime = Date.now();
      simulateScan((beacons, logs) => {
        setQosMetrics(prev => ({
          ...prev,
          signalLogs: [...prev.signalLogs, ...logs.map(l => ({ ...l, timestamp: Date.now() }))].slice(-200),
        }));
        handleNewBeaconState(beacons, detectionTime);
      });
    }, 3000);

    return () => clearInterval(scanInterval);
  }, [handleNewBeaconState]);

  const handleManualDetect = (beaconId: string) => {
    const detectionTime = Date.now();
    const beacon = manuallyDetectBeacon(beaconId);
    setQosMetrics(prev => ({
      ...prev,
      signalLogs: [...prev.signalLogs, { beaconId: beacon.id, rssi: beacon.rssi, status: 'online', timestamp: Date.now() }].slice(-200),
    }));
    handleNewBeaconState(detectedBeacons.filter(b => b.id !== beacon.id).concat(beacon), detectionTime);
  };

  const handleUpdatePreferences = (category: BeaconCategory) => {
    setUserPreferences(prev => {
      const newInterests = new Set(prev.interests);
      if (newInterests.has(category)) newInterests.delete(category);
      else newInterests.add(category);
      return { ...prev, interests: newInterests };
    });
  };

  const handlePrefsChange = (prefs: UserPreferences) => {
    setUserPreferences(prefs);
  };

  const handleDismissNotification = (id: number) => {
    setNotificationsHistory(prev => prev.filter(n => n.id !== id));
  };

  const handleRedeem = (couponId: string) => {
    const used = redeemCoupon(couponId);
    setNotificationsHistory(prev => prev.map(n => n.couponId === couponId ? { ...n, redeemed: true } : n));
    setCouponToShow(used ?? null);
    alert('Coupon redeemed (simulated).');
  };

  const handleShowCoupon = (beaconId: string) => {
    const c = getCouponForBeacon(beaconId);
    setCouponToShow(c ?? null);
    if (!c) alert('No coupon available for this store right now.');
  };

  // NEW: navigate to map & highlight/center on store
  const handleNavigateTo = (beaconId: string) => {
    const b = getBeaconById(beaconId);
    if (b && b.floor) {
      setMapHighlightId(beaconId);
      setActiveTab('map');
      // map component will pick up mapHighlightId and center/highlight automatically
    } else {
      setMapHighlightId(beaconId);
      setActiveTab('map');
    }
  };

  const recommendations = useMemo(() => {
    return MOCK_BEACONS.filter(b => userPreferences.interests.has(b.category) && b.category !== 'Entrance');
  }, [userPreferences.interests]);

  return (
    <div className={`${userPreferences.largeText ? 'text-lg' : ''} min-h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-300`}>
      <div className="max-w-3xl mx-auto">
        <header className="flex justify-between items-center p-4 sticky top-0 bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-sm z-10 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">Mall Beacon Navigator</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} />
            <div className="hidden sm:flex gap-2">
              <button onClick={() => setActiveTab('home')} className={`px-3 py-1 ${activeTab === 'home' ? 'underline' : ''}`}>Home</button>
              <button onClick={() => setActiveTab('map')} className={`px-3 py-1 ${activeTab === 'map' ? 'underline' : ''}`}>Map</button>
              <button onClick={() => setActiveTab('notifications')} className={`px-3 py-1 ${activeTab === 'notifications' ? 'underline' : ''}`}>History</button>
              <button onClick={() => setActiveTab('settings')} className={`px-3 py-1 ${activeTab === 'settings' ? 'underline' : ''}`}>Settings</button>
              <button onClick={() => setActiveTab('qos')} className={`px-3 py-1 ${activeTab === 'qos' ? 'underline' : ''}`}>QoS</button>
            </div>
          </div>
        </header>

        <main>
          {activeTab === 'home' && (
            <HomeScreen
              nearestBeacon={nearestBeacon}
              lastNotification={notificationsHistory[notificationsHistory.length - 1] ?? null}
              userPreferences={userPreferences}
              onUpdatePreferences={handleUpdatePreferences}
              onManualDetect={handleManualDetect}
              onShowCoupon={handleShowCoupon}
              onNavigateTo={handleNavigateTo} // pass navigate function
              recommendations={recommendations}
            />
          )}

          {activeTab === 'map' && (
            <MallMap beacons={MOCK_BEACONS} onSelect={(id) => { handleManualDetect(id); }} highlightedBeaconId={mapHighlightId} />
          )}

          {activeTab === 'notifications' && (
            <NotificationsPanel notifications={notificationsHistory} onDismiss={handleDismissNotification} onRedeem={handleRedeem} />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen prefs={userPreferences} onUpdate={handlePrefsChange} />
          )}

          {activeTab === 'qos' && <QosScreen metrics={qosMetrics} />}

        </main>
      </div>

      <CouponModal coupon={couponToShow} onClose={() => setCouponToShow(null)} onUse={(id) => handleRedeem(id)} />
    </div>
  );
}

export default App;
