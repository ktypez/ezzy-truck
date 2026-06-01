import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Check if app is already installed (standalone mode)
function isInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// Detect iOS Safari
function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// Detect Android Chrome
function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

export default function PWAStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Skip if already installed
    if (isInstalled()) {
      setInstalled(true);
      return;
    }

    setIsOffline(!navigator.onLine);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for beforeinstallprompt (Android Chrome native prompt)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      const dismissed = localStorage.getItem('pwa-dismissed-android');
      if (!dismissed) setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

    // If beforeinstallprompt hasn't fired after 3s, show install banner anyway
    // (covers iOS, desktop, or unsupported browsers)
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt && !isInstalled()) {
        const dismissed = localStorage.getItem(isIOS() ? 'pwa-dismissed-ios' : 'pwa-dismissed-other');
        if (!dismissed) setShowInstallBanner(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      clearTimeout(fallbackTimer);
    };
  }, [deferredPrompt]);

  const doInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      setInstalled(true);
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const dismissInstall = () => {
    setShowInstallBanner(false);
    const key = deferredPrompt
      ? 'pwa-dismissed-android'
      : isIOS()
        ? 'pwa-dismissed-ios'
        : 'pwa-dismissed-other';
    localStorage.setItem(key, 'true');
  };

  // Don't show anything if already installed
  if (installed) return null;

  return (
    <>
      {isOffline && (
        <div id="offline-toast">
          📡 ออฟไลน์ — บางฟีเจอร์อาจไม่พร้อมใช้งาน
        </div>
      )}

      {showInstallBanner && (
        <div id="install-banner">
          <div className="banner-icon">🚛</div>
          <div className="banner-text">
            <strong>ติดตั้ง Ezzy Truck</strong>
            {deferredPrompt ? (
              <span>ติดตั้งเพื่อใช้งานแบบแอป บวกความสะดวก</span>
            ) : isIOS() ? (
              <span>กดแชร์ <span className="ios-share-icon">⎋</span> แล้วเลือก &ldquo;เพิ่มที่หน้าจอโฮม&rdquo;</span>
            ) : (
              <span>เพิ่มลงหน้าจอหลักเพื่อใช้งานแบบแอป</span>
            )}
          </div>
          <button className="install-btn" onClick={deferredPrompt ? doInstall : dismissInstall}>
            {deferredPrompt ? 'ติดตั้ง' : 'ปิด'}
          </button>
          <button className="dismiss-btn" onClick={dismissInstall}>✕</button>
        </div>
      )}
    </>
  );
}
