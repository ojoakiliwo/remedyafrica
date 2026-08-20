'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Camera, Check, Copy, Download, Share2, Smartphone } from 'lucide-react';
import { DisclaimerNote } from '@/components/editorial/PageHero';
import {
  GET_THE_APP_PATH,
  shareUrl,
  trackCampaignEvent,
  withCampaignParams,
} from '@/lib/campaign';
import {
  consumeDeferredInstallPrompt,
  getDeferredInstallPrompt,
  isIosDevice,
  isStandaloneDisplay,
  subscribeInstallPrompt,
  type BeforeInstallPromptEvent,
} from '@/lib/pwa-prompt';

export default function GetTheAppActions() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const [androidHelp, setAndroidHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [identifyHref, setIdentifyHref] = useState('/identify');

  useEffect(() => {
    setInstalled(isStandaloneDisplay());
    setIdentifyHref(withCampaignParams('/identify'));
    trackCampaignEvent('landing_view');
    return subscribeInstallPrompt(setPrompt);
  }, []);

  const install = async () => {
    trackCampaignEvent('install_click');
    if (isIosDevice()) {
      setIosHelp(true);
      trackCampaignEvent('install_help_ios');
      return;
    }
    const deferred = prompt || getDeferredInstallPrompt();
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      consumeDeferredInstallPrompt();
      if (choice.outcome === 'accepted') {
        setInstalled(true);
        trackCampaignEvent('install_accepted');
      }
      return;
    }
    setAndroidHelp(true);
    trackCampaignEvent('install_help_android');
  };

  const shareMessage = () =>
    `Identify African herbs on your phone: ${shareUrl({
      utm_source: 'whatsapp',
      utm_medium: 'share',
      utm_campaign: 'get_the_app',
    })}`;

  const shareWhatsApp = () => {
    trackCampaignEvent('share_whatsapp');
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage())}`, '_blank', 'noopener,noreferrer');
  };

  const shareNative = async () => {
    const url = shareUrl({ utm_source: 'share', utm_medium: 'native', utm_campaign: 'get_the_app' });
    if (navigator.share) {
      trackCampaignEvent('share_native');
      try {
        await navigator.share({
          title: 'RemedyAfrica',
          text: 'Identify African herbs on your phone.',
          url,
        });
      } catch {
        // user cancelled
      }
      return;
    }
    await copyLink();
  };

  const copyLink = async () => {
    const url = `${window.location.origin}${withCampaignParams(GET_THE_APP_PATH, {
      utm_source: 'copy',
      utm_medium: 'share',
      utm_campaign: 'get_the_app',
    })}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackCampaignEvent('share_copy');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', url);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_18rem]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-forest/10 bg-white p-6 shadow-soft sm:p-8">
            <div className="flex items-center gap-4">
              <img
                src="/icons/icon-192.png?v=2"
                alt="RemedyAfrica app icon"
                className="h-16 w-16 rounded-2xl border border-forest/10 bg-white object-cover"
              />
              <div>
                <p className="eyebrow">On your phone</p>
                <h2 className="font-serif text-2xl text-forest">Add it like an app</h2>
              </div>
            </div>

            {installed ? (
              <p className="mt-6 rounded-2xl bg-cream px-4 py-3 text-sm text-forest">
                This phone already has RemedyAfrica on the home screen. Open Identify when you are ready.
              </p>
            ) : (
              <button
                type="button"
                onClick={install}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-5 py-3.5 text-sm font-medium text-cream hover:bg-forest-mist sm:w-auto"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {iosHelp ? 'iPhone install steps' : 'Install on this phone'}
              </button>
            )}

            {iosHelp ? (
              <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-sm leading-relaxed text-ink-muted">
                On iPhone, open this page in <strong>Safari</strong>, tap the Share button, then{' '}
                <strong>Add to Home Screen</strong>. Chrome on iPhone cannot add it the same way.
              </p>
            ) : null}

            {androidHelp ? (
              <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-sm leading-relaxed text-ink-muted">
                Open this page in <strong>Chrome</strong> — not Instagram, WhatsApp, or Facebook. Tap the
                three dots, then <strong>Install app</strong> or <strong>Add to Home screen</strong>.
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={identifyHref}
                onClick={() => trackCampaignEvent('identify_cta')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/20 px-5 py-3 text-sm font-medium text-forest hover:bg-cream"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                Identify a plant
              </Link>
              <button
                type="button"
                onClick={shareWhatsApp}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/20 px-5 py-3 text-sm font-medium text-forest hover:bg-cream"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                Share on WhatsApp
              </button>
              <button
                type="button"
                onClick={shareNative}
                className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-ink-muted hover:text-forest"
              >
                {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copied ? 'Link copied' : 'Copy link'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-forest/10 bg-white p-6 shadow-soft">
              <Smartphone className="h-5 w-5 text-bronze" aria-hidden="true" />
              <h3 className="mt-3 font-serif text-xl text-forest">Android</h3>
              <ol className="mt-3 space-y-2 text-sm leading-relaxed text-ink-muted">
                <li>1. Open this page in Chrome.</li>
                <li>2. Tap Install on this phone, or Chrome menu → Install app.</li>
                <li>3. The gold leaf on white is the home-screen icon.</li>
              </ol>
            </div>
            <div className="rounded-3xl border border-forest/10 bg-white p-6 shadow-soft">
              <Share2 className="h-5 w-5 text-bronze" aria-hidden="true" />
              <h3 className="mt-3 font-serif text-xl text-forest">iPhone</h3>
              <ol className="mt-3 space-y-2 text-sm leading-relaxed text-ink-muted">
                <li>1. Open this page in Safari.</li>
                <li>2. Tap Share, then Add to Home Screen.</li>
                <li>3. Instagram and WhatsApp in-app browsers will not show install.</li>
              </ol>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-forest/10 bg-white p-6 shadow-soft">
            <p className="eyebrow mb-4">For ads</p>
            <p className="text-sm leading-relaxed text-ink-muted">
              Point Meta, TikTok, and Google ads here:
            </p>
            <p className="mt-3 break-all rounded-2xl bg-cream px-3 py-2 text-xs text-forest">
              https://www.remedyafrica.com/get-the-app?utm_source=meta&utm_campaign=identify
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              We keep the campaign tags when someone then opens Identify or shares WhatsApp.
            </p>
          </div>
          <DisclaimerNote>
            Identification is a starting point, not a diagnosis. Confirm plants with a trusted source before use.
          </DisclaimerNote>
        </aside>
      </div>
    </div>
  );
}
