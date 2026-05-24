'use client';
import { useState, useEffect } from 'react';

export default function PWAStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. ระบบตรวจจับ Offline / Online
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. ระบบตรวจจับ PWA Install Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      // ป้องกันไม่ให้เบราว์เซอร์โชว์แถบติดตั้งเอง (เราจะใช้ Banner ของเราเอง)
      e.preventDefault();
      setDeferredPrompt(e);
      
      // เช็คว่าผู้ใช้เคยกดปิด Banner นี้ไปหรือยัง
      const isDismissed = localStorage.getItem('pwa-dismissed');
      if (!isDismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // ฟังก์ชันเมื่อกด "ติดตั้ง"
  const doInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  // ฟังก์ชันเมื่อกด "กากบาทปิด"
  const dismissInstall = () => {
    setShowInstallBanner(false);
    // จำไว้ในเครื่องว่าเคยกดปิดไปแล้ว จะได้ไม่กวนใจอีก
    localStorage.setItem('pwa-dismissed', 'true');
  };

  return (
    <>
      {/* โชว์ Offline Toast เมื่อไม่มีเน็ต */}
      {isOffline && (
        <div id="offline-toast">
          📡 ออฟไลน์ — บางฟีเจอร์อาจไม่พร้อมใช้งาน
        </div>
      )}

      {/* โชว์ Install Banner เมื่อพร้อมติดตั้ง */}
      {showInstallBanner && (
        <div id="install-banner">
          <div className="banner-icon">🚛</div>
          <div className="banner-text">
            <strong>ติดตั้ง Ezzy Truck</strong>
            <span>เพิ่มลงหน้าจอหลักเพื่อใช้งานแบบแอป</span>
          </div>
          <button className="install-btn" onClick={doInstall}>ติดตั้ง</button>
          <button className="dismiss-btn" onClick={dismissInstall}>✕</button>
        </div>
      )}
    </>
  );
}
