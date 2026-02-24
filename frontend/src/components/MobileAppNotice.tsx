import React, { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';

const STORAGE_KEY = 'chess-mobile-notice-dismissed';

export default function MobileAppNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    const isMobile = window.innerWidth < 768;
    if (!dismissed && isMobile) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-chess-panel border-t border-chess-border px-4 py-3 flex items-start gap-3 shadow-lg md:hidden">
      <Smartphone size={18} className="text-chess-accent shrink-0 mt-0.5" />
      <p className="flex-1 text-xs text-chess-panel-fg">
        <strong>No APK available.</strong> This is a web app — tap your browser's menu and choose{' '}
        <strong>"Add to Home Screen"</strong> for an app-like experience!
      </p>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded hover:bg-chess-hover transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
