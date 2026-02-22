'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  CONSENT_STORAGE_KEY,
  DEFAULT_CONSENT_PREFERENCES,
  ConsentPreferences,
  buildGoogleConsentUpdate,
  createConsentRecord,
  parseStoredConsent,
} from '@/lib/consent';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    adsbygoogle?: (unknown[] & { requestNonPersonalizedAds?: number });
  }
}

interface ConsentContextValue {
  hydrated: boolean;
  hasSavedConsent: boolean;
  preferences: ConsentPreferences;
  consentVersion: string;
  savePreferences: (preferences: ConsentPreferences) => void;
  acceptAll: () => void;
  rejectAll: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [record, setRecord] = useState<ReturnType<typeof parseStoredConsent>>(null);

  useEffect(() => {
    try {
      setRecord(parseStoredConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY)));
    } finally {
      setHydrated(true);
    }
  }, []);

  const savePreferences = useCallback((preferences: ConsentPreferences) => {
    const nextRecord = createConsentRecord(preferences);
    setRecord(nextRecord);

    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(nextRecord));
    } catch {
      // Ignore storage failures and keep in-memory state for this session.
    }
  }, []);

  const acceptAll = useCallback(() => {
    savePreferences({ ads: true, analytics: true });
  }, [savePreferences]);

  const rejectAll = useCallback(() => {
    savePreferences({ ads: false, analytics: false });
  }, [savePreferences]);

  useEffect(() => {
    if (!hydrated) return;

    const preferences = record?.preferences ?? DEFAULT_CONSENT_PREFERENCES;

    if (typeof window !== 'undefined') {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.requestNonPersonalizedAds = preferences.ads ? 0 : 1;
    }

    if (!record || typeof window.gtag !== 'function') {
      return;
    }

    window.gtag('set', 'ads_data_redaction', !preferences.ads);
    window.gtag('set', 'url_passthrough', true);
    window.gtag('consent', 'update', buildGoogleConsentUpdate(preferences));
  }, [hydrated, record]);

  const value = useMemo<ConsentContextValue>(() => {
    const preferences = record?.preferences ?? DEFAULT_CONSENT_PREFERENCES;

    return {
      hydrated,
      hasSavedConsent: !!record,
      preferences,
      consentVersion: record?.updatedAt ?? 'pending',
      savePreferences,
      acceptAll,
      rejectAll,
    };
  }, [acceptAll, hydrated, record, rejectAll, savePreferences]);

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const context = useContext(ConsentContext);

  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }

  return context;
}
