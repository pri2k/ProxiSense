import React from 'react';
import { Coupon } from '../types';

interface Props {
  coupon: Coupon | null;
  onClose: () => void;
  onUse: (couponId: string) => void;
}

export const CouponModal: React.FC<Props> = ({ coupon, onClose, onUse }) => {
  if (!coupon) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg z-10 max-w-md w-full">
        <h3 className="text-lg font-bold mb-2">{coupon.title}</h3>
        <p className="mb-2">{coupon.description}</p>
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-mono">{coupon.code}</div>
          <div className="text-sm text-light-subtext">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleString() : 'No expiry'}</div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 rounded border">Close</button>
          <button onClick={() => onUse(coupon.id)} className="px-3 py-1 bg-light-accent text-white rounded">Use Coupon</button>
        </div>
      </div>
    </div>
  );
};
