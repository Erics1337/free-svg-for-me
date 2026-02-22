'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useConsent } from '@/components/ConsentProvider';
import { DEFAULT_CONSENT_PREFERENCES, ConsentPreferences } from '@/lib/consent';

export function ConsentNotice() {
  const {
    hydrated,
    hasSavedConsent,
    preferences,
    savePreferences,
    acceptAll,
    rejectAll,
  } = useConsent();

  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentPreferences>(DEFAULT_CONSENT_PREFERENCES);

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  if (!hydrated) {
    return null;
  }

  const isInitialBanner = !hasSavedConsent;
  const showPanel = isInitialBanner || isManagerOpen;

  const closeManager = () => {
    if (isInitialBanner) return;
    setIsManagerOpen(false);
    setIsCustomizeOpen(false);
  };

  const handleAcceptAll = () => {
    acceptAll();
    setIsManagerOpen(false);
    setIsCustomizeOpen(false);
  };

  const handleRejectAll = () => {
    rejectAll();
    setIsManagerOpen(false);
    setIsCustomizeOpen(false);
  };

  const handleSaveSelection = () => {
    savePreferences(draft);
    setIsManagerOpen(false);
    setIsCustomizeOpen(false);
  };

  const openManager = () => {
    setDraft(preferences);
    setIsCustomizeOpen(true);
    setIsManagerOpen(true);
  };

  return (
    <>
      {hasSavedConsent && !showPanel && (
        <button
          type="button"
          onClick={openManager}
          className="fixed bottom-4 left-4 z-40 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-200 shadow-lg shadow-black/30 backdrop-blur hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          Privacy & cookies
        </button>
      )}

      {showPanel && (
        <div
          className="fixed inset-x-0 bottom-4 z-50 px-4"
          role="dialog"
          aria-live="polite"
          aria-modal={!isInitialBanner}
          aria-label="Cookie and advertising preferences"
        >
          <div className="mx-auto max-w-3xl rounded-xl border border-zinc-700 bg-zinc-900/95 shadow-2xl shadow-black/40 backdrop-blur-md">
            <div className="p-4 md:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm md:text-base font-semibold text-zinc-100">
                    Privacy, cookies, and ad preferences
                  </h3>
                  <p className="text-sm text-zinc-300 mt-2 leading-relaxed">
                    We use cookies for essential site functions, analytics (PostHog), and Google AdSense advertising. Choose what you allow.
                    {' '}
                    <Link href="/privacy" className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
                {!isInitialBanner && (
                  <button
                    type="button"
                    onClick={closeManager}
                    className="rounded-md px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                    aria-label="Close privacy preferences"
                  >
                    X
                  </button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Accept all
                </button>
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Reject non-essential
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomizeOpen(open => !open)}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {isCustomizeOpen ? 'Hide options' : 'Customize'}
                </button>
              </div>

              {isCustomizeOpen && (
                <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 md:p-4 space-y-3">
                  <PreferenceRow
                    label="Essential site storage"
                    description="Required for core site behavior and security."
                    checked
                    disabled
                    onChange={() => undefined}
                  />

                  <PreferenceRow
                    label="Analytics (PostHog)"
                    description="Helps us understand usage and improve the tool."
                    checked={draft.analytics}
                    onChange={(checked) => setDraft(prev => ({ ...prev, analytics: checked }))}
                  />

                  <PreferenceRow
                    label="Advertising (Google AdSense)"
                    description="Allows ad-related storage and personalization preferences."
                    checked={draft.ads}
                    onChange={(checked) => setDraft(prev => ({ ...prev, ads: checked }))}
                  />

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveSelection}
                      className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors cursor-pointer"
                    >
                      Save selection
                    </button>
                    {!isInitialBanner && (
                      <button
                        type="button"
                        onClick={closeManager}
                        className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PreferenceRow({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`flex items-start justify-between gap-4 rounded-lg border border-zinc-800 p-3 ${disabled ? 'opacity-80' : ''}`}>
      <div>
        <div className="text-sm font-medium text-zinc-100">{label}</div>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{description}</p>
      </div>
      <span className="shrink-0 pt-0.5">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-indigo-500 cursor-pointer disabled:cursor-not-allowed"
        />
      </span>
    </label>
  );
}
