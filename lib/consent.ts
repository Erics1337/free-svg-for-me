export type ConsentDecision = 'granted' | 'denied';

export interface ConsentPreferences {
  ads: boolean;
  analytics: boolean;
}

export interface StoredConsentRecord {
  version: 1;
  updatedAt: string;
  preferences: ConsentPreferences;
}

export const CONSENT_STORAGE_KEY = 'freesvgforme_cmp_v1';

export const DEFAULT_CONSENT_PREFERENCES: ConsentPreferences = {
  ads: false,
  analytics: false,
};

export function createConsentRecord(preferences: ConsentPreferences): StoredConsentRecord {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    preferences,
  };
}

export function parseStoredConsent(raw: string | null): StoredConsentRecord | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredConsentRecord> & {
      preferences?: Partial<ConsentPreferences>;
    };

    if (parsed.version !== 1 || !parsed.updatedAt || !parsed.preferences) {
      return null;
    }

    if (
      typeof parsed.preferences.ads !== 'boolean' ||
      typeof parsed.preferences.analytics !== 'boolean'
    ) {
      return null;
    }

    return {
      version: 1,
      updatedAt: parsed.updatedAt,
      preferences: {
        ads: parsed.preferences.ads,
        analytics: parsed.preferences.analytics,
      },
    };
  } catch {
    return null;
  }
}

export function buildGoogleConsentUpdate(preferences: ConsentPreferences) {
  const adDecision: ConsentDecision = preferences.ads ? 'granted' : 'denied';
  const analyticsDecision: ConsentDecision = preferences.analytics ? 'granted' : 'denied';

  return {
    ad_storage: adDecision,
    ad_user_data: adDecision,
    ad_personalization: adDecision,
    analytics_storage: analyticsDecision,
    functionality_storage: 'granted' as const,
    personalization_storage: 'denied' as const,
    security_storage: 'granted' as const,
  };
}
