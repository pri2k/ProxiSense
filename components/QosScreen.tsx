import React from 'react';
import { QosMetrics } from '../types';

interface QosScreenProps {
  metrics: QosMetrics;
}

export const QosScreen: React.FC<QosScreenProps> = ({ metrics }) => {
  const throughput = metrics.notificationCount / ((Date.now() - metrics.startTime) / 60000) || 0;
  const onlineBeacons = new Set(metrics.signalLogs.filter(log => log.status === 'online').map(log => log.beaconId)).size;
  const totalBeacons = new Set(metrics.signalLogs.map(log => log.beaconId)).size;

  return (
    <div className="p-4 md:p-6 space-y-6 text-light-text dark:text-dark-text">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-semibold text-light-subtext dark:text-dark-subtext">Latency</h3>
          <p className="text-3xl font-bold text-light-primary dark:text-dark-primary">{metrics.latency ?? 'N/A'}<span className="text-xl"> ms</span></p>
          <p className="text-xs text-light-subtext dark:text-dark-subtext">Detection to Notification</p>
        </div>
        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-semibold text-light-subtext dark:text-dark-subtext">Throughput</h3>
          <p className="text-3xl font-bold text-light-primary dark:text-dark-primary">{throughput.toFixed(2)}</p>
          <p className="text-xs text-light-subtext dark:text-dark-subtext">Notifications / Minute</p>
        </div>
        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-semibold text-light-subtext dark:text-dark-subtext">Availability</h3>
          <p className="text-3xl font-bold text-light-primary dark:text-dark-primary">{onlineBeacons} / {totalBeacons}</p>
          <p className="text-xs text-light-subtext dark:text-dark-subtext">Online Beacons</p>
        </div>
      </div>
      <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-3">Beacon Signal Strength Logs</h2>
        <div className="h-96 overflow-y-auto font-mono text-sm border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-light-bg dark:bg-dark-bg">
          {metrics.signalLogs.slice().reverse().map((log) => (
            <div key={log.timestamp} className={`flex justify-between p-1 rounded ${log.status === 'offline' ? 'text-red-500' : ''}`}>
              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span>Beacon {log.beaconId}</span>
              <span>{log.status === 'online' ? `${log.rssi} dBm` : 'OFFLINE'}</span>
              <span className={`font-bold ${log.status === 'online' ? 'text-green-500' : 'text-red-500'}`}>{log.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
