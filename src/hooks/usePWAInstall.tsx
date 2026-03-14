import { useState, useEffect, useRef } from 'react';

type Platform = 'android' | 'ios' | 'desktop' | 'unknown';

interface PWAInstallState {
  isStandalone: boolean;
  platform: Platform;
  promptInstall: () => void;
}

let deferredPrompt: any = null;
const pendingCallbacks: (() => void)[] = [];

export const usePWAInstall = (): PWAInstallState => {
  const [, forceUpdate] = useState(0);
  const pendingRef = useRef(false);

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  const getPlatform = (): Platform => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    if (/windows|macintosh|linux/.test(ua)) return 'desktop';
    return 'unknown';
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      forceUpdate(n => n + 1);
      // If user already clicked while we were waiting, fire immediately
      if (pendingRef.current) {
        pendingRef.current = false;
        triggerPrompt();
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerPrompt = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    forceUpdate(n => n + 1);
  };

  const promptInstall = () => {
    if (deferredPrompt) {
      triggerPrompt();
    } else {
      // Queue: trigger as soon as the browser fires the event
      pendingRef.current = true;
    }
  };

  return {
    isStandalone,
    platform: getPlatform(),
    promptInstall,
  };
};
