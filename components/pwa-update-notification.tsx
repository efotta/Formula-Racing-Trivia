
'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export default function PWAUpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('🔔 New app version available:', event.data.version);
        setShowUpdate(true);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Check for waiting service worker
    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);
      
      if (reg.waiting) {
        console.log('🔔 Update already waiting');
        setShowUpdate(true);
      }

      // Listen for new service worker
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔔 New service worker installed');
              setShowUpdate(true);
            }
          });
        }
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the waiting service worker to activate
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // Just reload if no waiting worker
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in slide-in-from-top duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-2xl p-4 flex items-center gap-3">
        <div className="flex-shrink-0">
          <RefreshCw className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">New Version Available!</p>
          <p className="text-xs text-blue-100 mt-0.5">
            Click reload to get the latest features
          </p>
        </div>

        <button
          onClick={handleUpdate}
          className="flex-shrink-0 bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
        >
          Reload
        </button>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-white hover:text-blue-100 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
