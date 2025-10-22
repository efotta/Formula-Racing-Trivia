
'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIPad, setIsIPad] = useState(false);

  useEffect(() => {
    // Detect device type
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent;
      const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
      const isIPadDevice = /iPad/.test(userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      setIsIOS(isIOSDevice);
      setIsIPad(isIPadDevice);
      setIsAndroid(/Android/.test(userAgent));
    }

    // Register service worker AFTER page load (better performance)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Wait for page to load
      if (document.readyState === 'complete') {
        registerServiceWorker();
      } else {
        window.addEventListener('load', registerServiceWorker);
      }
    }

    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('✅ PWA was installed successfully');
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsDismissed(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('load', registerServiceWorker);
    };
  }, []);

  const registerServiceWorker = () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);

        // Check for updates periodically (only if registration is active)
        const updateInterval = setInterval(() => {
          if (registration && registration.active) {
            registration.update().catch((error) => {
              console.warn('⚠️ Service Worker update check failed:', error);
            });
          }
        }, 60000); // Check every minute

        // Listen for controller change (new SW activated)
        const controllerChangeHandler = () => {
          console.log('🔄 Service Worker controller changed');
        };
        
        navigator.serviceWorker.addEventListener('controllerchange', controllerChangeHandler);

        // Cleanup function
        return () => {
          clearInterval(updateInterval);
          navigator.serviceWorker.removeEventListener('controllerchange', controllerChangeHandler);
        };
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
        setIsDismissed(true);
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else if (isIOS || isIPad || isAndroid) {
      // Show instructions for iOS, iPad, and Android
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowInstructions(false);
  };

  // Show button on all pages unless dismissed
  if (isDismissed) {
    return null;
  }

  // Instructions modal
  if (showInstructions) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Install Formula Racing Trivia
            </h3>
            <button
              onClick={() => setShowInstructions(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {(isIOS || isIPad) && (
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold">To install on {isIPad ? 'iPad' : 'iPhone'}:</p>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>Tap the <strong>Share</strong> button (square with arrow) in Safari</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li>Tap <strong>"Add"</strong> in the top right corner</li>
              </ol>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Note: This feature only works in Safari browser on iOS/iPadOS
              </p>
            </div>
          )}

          {isAndroid && (
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold">To install on Android:</p>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>Tap the <strong>⋮</strong> menu in Chrome</li>
                <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
                <li>Tap <strong>"Install"</strong> or <strong>"Add"</strong></li>
              </ol>
            </div>
          )}

          {!isIOS && !isIPad && !isAndroid && (
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold">Want quick access on Desktop?</p>
              <p className="mt-3">
                Press <strong>Command+D</strong> (Mac) or <strong>Ctrl+D</strong> (Windows) to bookmark this page.
              </p>
              <p className="mt-2">
                Add it to your Bookmarks Bar so you can return anytime!
              </p>
            </div>
          )}

          <button
            onClick={() => setShowInstructions(false)}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    );
  }

  // Don't show floating button - Download App is now in the navigation menu
  // PWA functionality is handled through the navigation button only
  return null;
}
