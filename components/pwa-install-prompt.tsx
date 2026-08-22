'use client';

import React, { useEffect, useState } from 'react';
import { Download, Share, X, Smartphone } from 'lucide-react';
import { Surface, NeuButton } from '@/components/neu';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Check if already installed
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(isStandaloneMode);

      // Detect iOS Safari
      const ua = window.navigator.userAgent;
      const isAppleIOS = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
      setIsIOS(isAppleIOS);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isStandalone || dismissed) return null;
  if (!installPrompt && !isIOS) return null;

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md animate-rise">
      <Surface className="p-4 bg-white/95 border border-slate-200 shadow-xl backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-slate-900 text-white shrink-0">
              <Smartphone className="size-5" />
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Install Outbreak Radar</h4>
              {isIOS ? (
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  To receive alert push notifications on iPhone, tap <Share className="inline size-3 text-blue-500 mx-0.5" /> <strong>Share</strong> and select <strong>Add to Home Screen</strong>.
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Install as an app on your phone for instant outbreak warning banners and fast offline reporting.
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="size-4" />
          </button>
        </div>

        {!isIOS && installPrompt && (
          <div className="mt-3 flex justify-end gap-2">
            <NeuButton
              variant="primary"
              onClick={handleInstallClick}
              className="py-1.5 px-3 text-xs flex items-center gap-1.5"
            >
              <Download className="size-3.5" /> Add to Phone
            </NeuButton>
          </div>
        )}
      </Surface>
    </div>
  );
}
