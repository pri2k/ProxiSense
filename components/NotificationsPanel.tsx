import React from 'react';
import { AppNotification, Coupon } from '../types';

interface Props {
  notifications: AppNotification[];
  onDismiss: (id: number) => void;
  onRedeem: (couponId: string) => void;
}

export const NotificationsPanel: React.FC<Props> = ({ notifications, onDismiss, onRedeem }) => {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <h2 className="text-xl font-bold">Notification History</h2>
      <div className="space-y-2">
        {notifications.length === 0 && <p className="text-light-subtext">No notifications yet.</p>}
        {notifications.slice().reverse().map(n => (
          <div key={n.id} className="bg-light-card dark:bg-dark-card p-3 rounded-md flex justify-between items-start">
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="font-semibold">{n.beacon.location}</span>
                <span className="text-xs text-light-subtext">{new Date(n.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="mt-1 italic">{n.message}</p>
              {n.couponId && !n.redeemed && (
                <button onClick={() => onRedeem(n.couponId!)} className="mt-2 px-3 py-1 bg-light-accent text-white rounded">Redeem Coupon</button>
              )}
              {n.couponId && n.redeemed && <span className="ml-2 text-sm text-green-600 font-semibold">Coupon redeemed</span>}
            </div>
            <div className="flex flex-col items-end">
              <button onClick={() => onDismiss(n.id)} className="text-sm text-light-subtext hover:text-light-primary">Dismiss</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
