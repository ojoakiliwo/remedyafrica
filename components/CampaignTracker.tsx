'use client';

import { useEffect } from 'react';
import { paramsFromSearch, persistCampaignParams, hasCampaignParams } from '@/lib/campaign';

export default function CampaignTracker() {
  useEffect(() => {
    const incoming = paramsFromSearch(window.location.search);
    if (hasCampaignParams(incoming)) persistCampaignParams(incoming);
  }, []);

  return null;
}
