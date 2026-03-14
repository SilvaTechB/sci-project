import { useState, useEffect } from 'react';

type Platform = 'android' | 'ios' | 'desktop' | 'unknown';

interface PWAInstallState {
  isStandalone: boolean;
  platform: Platform;
  canInstall: boolean;
  promptInstall: () => Promise<boolean>;
}

let deferredPrompt: any = null;

export const usePWAInstall = (): PWAInstallState => {
  const [canInstall, setCanInstall] = useState(false);

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
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also check if already capturable
    if (deferredPrompt) setCanInstall(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setCanInstall(false);
    return outcome === 'accepted';
  };

  return {
    isStandalone,
    platform: getPlatform(),
    canInstall,
    promptInstall,
  };
};
