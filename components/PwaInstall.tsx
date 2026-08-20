'use client';

import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

const DISMISS_KEY = 'ra-install-banner-dismissed-at';
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandaloneDisplay() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isIosDevice() {
  const ua = window.navigator.userAgent;
  const iPhone = /iPhone|iPad|iPod/i.test(ua);
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iPhone || iPadOs;
}

export default function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const [androidHelp, setAndroidHelp] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch (error) {
        console.warn('Service worker registration failed', error);
      }
    };

    if (document.readyState === 'complete') {
      void register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, []);

  useEffect(() => {
    if (isStandaloneDisplay()) return;

    const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_MS) return;

    setVisible(true);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setIosHelp(false);
    setAndroidHelp(false);
  };

  const install = async () => {
    if (isIosDevice()) {
      setIosHelp(true);
      return;
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === 'accepted') setVisible(false);
      return;
    }
    setAndroidHelp(true);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-lg md:hidden">
      <div className="rounded-3xl border border-forest/10 bg-forest p-4 text-cream shadow-lift">
        <div className="flex items-start gap-3">
          <img
            src="/icons/icon-192.png?v=2"
            alt=""
            className="h-12 w-12 rounded-2xl bg-white object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="font-serif text-lg leading-tight">Install RemedyAfrica</p>
            <p className="mt-1 text-sm text-cream/75">
              Add it to your home screen. Phones do not show Chrome&apos;s desktop download icon.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full p-1 text-cream/70 hover:bg-white/10 hover:text-cream"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {iosHelp ? (
          <p className="mt-3 rounded-2xl bg-white/10 px-3 py-2 text-sm leading-relaxed text-cream/90">
            On iPhone: tap the <Share className="mx-0.5 inline h-4 w-4" aria-hidden="true" /> Share
            button, then <strong>Add to Home Screen</strong>.
          </p>
        ) : null}

        {androidHelp ? (
          <p className="mt-3 rounded-2xl bg-white/10 px-3 py-2 text-sm leading-relaxed text-cream/90">
            Open Chrome&apos;s menu (three dots) and tap <strong>Install app</strong> or{' '}
            <strong>Add to Home screen</strong>. Use Chrome, not Instagram or WhatsApp&apos;s in-app
            browser.
          </p>
        ) : null}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={install}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-cream px-4 py-2.5 text-sm font-medium text-forest hover:bg-white"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {iosHelp ? 'How to install' : 'Install app'}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full px-4 py-2.5 text-sm text-cream/80 hover:text-cream"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
