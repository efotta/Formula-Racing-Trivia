'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function PWAUpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Listen for service worker updates (registration managed by PWAInstaller)
    navigator.serviceWorker.ready.then((registration) => {
      // Only listen for updatefound, don't trigger updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        // Add null safety check
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is installed but waiting to activate
              console.log('[PWA] New version available!');
              setUpdateAvailable(true);
              setShowUpdate(true);
            }
          });
        }
      });
    }).catch((error) => {
      console.error('[PWA] Service Worker not ready:', error);
    });

    // Listen for messages from service worker
    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('[PWA] Service Worker updated:', event.data.version);
        setUpdateAvailable(true);
        setShowUpdate(true);
      }
    };

    navigator.serviceWorker.addEventListener('message', messageHandler);

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener('message', messageHandler);
    };
  }, []);

  const handleUpdate = () => {
    if (!updateAvailable) return;

    // Tell service worker to skip waiting
    navigator.serviceWorker.ready.then((registration) => {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    });

    // Reload the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 flex items-start gap-3">
        <RefreshCw className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold mb-1">New Version Available!</h4>
          <p className="text-sm text-blue-100 mb-3">
            A new version of Formula Trivia Challenge is ready.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleUpdate}
              size="sm"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              Update Now
            </Button>
            <Button
              onClick={() => setShowUpdate(false)}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-blue-700"
            >
              Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
