import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { QosScreen } from './components/QosScreen';
import { DetectedBeacon, AppNotification, UserPreferences, QosMetrics, SignalLog, BeaconCategory, Beacon } from './types';
import { simulateScan, generatePersonalizedMessage, manuallyDetectBeacon, MOCK_BEACONS } from './services/beaconService';

type Theme = 'light' | 'dark';
type ActiveTab = 'home' | 'qos';

const ThemeToggle: React.FC<{ theme: Theme; toggleTheme: () => void }> = ({ theme, toggleTheme }) => {
    return (
        <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-light-text dark:text-dark-text">
            {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )}
        </button>
    );
};


function App() {
    const [theme, setTheme] = useState<Theme>('light');
    const [activeTab, setActiveTab] = useState<ActiveTab>('home');

    const [detectedBeacons, setDetectedBeacons] = useState<DetectedBeacon[]>([]);
    const [nearestBeacon, setNearestBeacon] = useState<DetectedBeacon | null>(null);
    const [lastNotification, setLastNotification] = useState<AppNotification | null>(null);
    const [userPreferences, setUserPreferences] = useState<UserPreferences>({ interests: new Set(['History']) });
    const [qosMetrics, setQosMetrics] = useState<QosMetrics>({
        latency: null,
        notificationCount: 0,
        startTime: Date.now(),
        signalLogs: [],
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const handleNewBeaconState = useCallback((beacons: DetectedBeacon[], detectionTime: number) => {
        beacons.sort((a, b) => b.rssi - a.rssi);
        setDetectedBeacons(beacons);

        const newNearest = beacons.length > 0 ? beacons[0] : null;

        if (newNearest && newNearest.id !== nearestBeacon?.id) {
            setNearestBeacon(newNearest);
            
            const message = generatePersonalizedMessage(newNearest, userPreferences);
            const notification: AppNotification = {
                id: Date.now(),
                beacon: newNearest,
                message,
                timestamp: Date.now(),
            };
            setLastNotification(notification);
            
            const latency = Date.now() - detectionTime;
            setQosMetrics(prev => ({
                ...prev,
                latency: latency,
                notificationCount: prev.notificationCount + 1,
            }));
        } else if (!newNearest) {
            setNearestBeacon(null);
        } else if (newNearest) {
             // Update nearest beacon info even if it's the same one
             setNearestBeacon(newNearest);
        }
    }, [nearestBeacon, userPreferences]);


    useEffect(() => {
        const scanInterval = setInterval(() => {
            const detectionTime = Date.now();
            simulateScan((beacons, logs) => {
                setQosMetrics(prev => ({
                    ...prev,
                    signalLogs: [...prev.signalLogs, ...logs.map(log => ({...log, timestamp: Date.now()}))].slice(-100),
                }));
                handleNewBeaconState(beacons, detectionTime);
            });
        }, 3000);

        return () => clearInterval(scanInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleNewBeaconState]);

    const handleManualDetect = (beaconId: string) => {
        const detectionTime = Date.now();
        const beacon = manuallyDetectBeacon(beaconId);
        // FIX: The `status` property was being inferred as `string`, causing a type mismatch.
        // Using `as const` ensures it's treated as the literal type 'online', satisfying the `SignalLog` interface.
        setQosMetrics(prev => ({
            ...prev,
            signalLogs: [...prev.signalLogs, { beaconId: beacon.id, rssi: beacon.rssi, status: 'online' as const, timestamp: Date.now() }].slice(-100),
        }));
        handleNewBeaconState(detectedBeacons.filter(b => b.id !== beacon.id).concat(beacon), detectionTime);
    };
    
    const handleUpdatePreferences = (category: BeaconCategory) => {
        setUserPreferences(prev => {
            const newInterests = new Set(prev.interests);
            if (newInterests.has(category)) {
                newInterests.delete(category);
            } else {
                newInterests.add(category);
            }
            return { interests: newInterests };
        });
    };
    
    const recommendations = useMemo(() => {
        return MOCK_BEACONS.filter(beacon => userPreferences.interests.has(beacon.category) && beacon.category !== 'Entrance');
    }, [userPreferences.interests]);


    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-300">
            <div className="max-w-2xl mx-auto">
                <header className="flex justify-between items-center p-4 sticky top-0 bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-sm z-10 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">
                        Proximity Navigator
                    </h1>
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                </header>
                <nav className="flex justify-center border-b border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={() => setActiveTab('home')}
                        className={`px-6 py-3 font-semibold ${activeTab === 'home' ? 'text-light-primary dark:text-dark-primary border-b-2 border-light-primary dark:border-dark-primary' : 'text-light-subtext dark:text-dark-subtext'}`}
                    >
                        Home
                    </button>
                    <button 
                        onClick={() => setActiveTab('qos')}
                        className={`px-6 py-3 font-semibold ${activeTab === 'qos' ? 'text-light-primary dark:text-dark-primary border-b-2 border-light-primary dark:border-dark-primary' : 'text-light-subtext dark:text-dark-subtext'}`}
                    >
                        QoS Dashboard
                    </button>
                </nav>
                <main>
                    {activeTab === 'home' && (
                        <HomeScreen 
                            nearestBeacon={nearestBeacon} 
                            lastNotification={lastNotification} 
                            userPreferences={userPreferences}
                            onUpdatePreferences={handleUpdatePreferences}
                            onManualDetect={handleManualDetect}
                            recommendations={recommendations}
                        />
                    )}
                    {activeTab === 'qos' && <QosScreen metrics={qosMetrics} />}
                </main>
            </div>
        </div>
    );
}

export default App;
