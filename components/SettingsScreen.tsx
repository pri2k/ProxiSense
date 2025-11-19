import React from 'react';
import { UserPreferences, BeaconCategory } from '../types';

interface Props {
  prefs: UserPreferences;
  onUpdate: (prefs: UserPreferences) => void;
}

export const SettingsScreen: React.FC<Props> = ({ prefs, onUpdate }) => {
  const toggleCategory = (cat: BeaconCategory) => {
    const newInterests = new Set(prefs.interests);
    if (newInterests.has(cat)) newInterests.delete(cat);
    else newInterests.add(cat);
    onUpdate({ ...prefs, interests: newInterests });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 text-light-text dark:text-dark-text">
      <h2 className="text-xl font-bold">Notification Preferences</h2>

      <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg">
        <label className="flex items-center justify-between">
          <span>Enable Notifications</span>
          <input type="checkbox" checked={!!prefs.notificationsEnabled} onChange={(e) => onUpdate({ ...prefs, notificationsEnabled: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between mt-3">
          <span>Do Not Disturb</span>
          <input type="checkbox" checked={!!prefs.doNotDisturb} onChange={(e) => onUpdate({ ...prefs, doNotDisturb: e.target.checked })} />
        </label>
        <label className="mt-3 block">
          <span>Cooldown (seconds)</span>
          <input type="number" className="w-32 p-1 border rounded mt-1" value={prefs.cooldownSeconds || 30} onChange={(e) => onUpdate({ ...prefs, cooldownSeconds: Number(e.target.value) })} />
        </label>
        <label className="mt-3 flex items-center justify-between">
          <span>Offline Mode (simulate)</span>
          <input type="checkbox" checked={!!prefs.offlineMode} onChange={(e) => onUpdate({ ...prefs, offlineMode: e.target.checked })} />
        </label>
        <label className="mt-3 flex items-center justify-between">
          <span>Large text (accessibility)</span>
          <input type="checkbox" checked={!!prefs.largeText} onChange={(e) => onUpdate({ ...prefs, largeText: e.target.checked })} />
        </label>
      </div>

      <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Interest Categories</h3>
        <div className="flex flex-wrap gap-2">
          {(['Fashion','Electronics','Food','Grocery','Entertainment','Kids'] as BeaconCategory[]).map(c => (
            <button key={c} onClick={() => toggleCategory(c)} className={`px-3 py-1 rounded-full text-sm ${prefs.interests.has(c) ? 'bg-light-primary text-white' : 'bg-gray-200'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
