'use client';

import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-[100]">
      <div className="text-center p-8">
        <div className="text-6xl mb-6">📡</div>
        <h1 className="text-2xl font-bold mb-2">You&apos;re Offline</h1>
        <p className="text-zinc-400 mb-6">
          Check your internet connection and try again.
        </p>
        <div className="animate-pulse text-zinc-500">
          Waiting for connection...
        </div>
      </div>
    </div>
  );
}
