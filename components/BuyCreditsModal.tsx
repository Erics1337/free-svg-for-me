'use client';

import React, { useState } from 'react';
import { X, Zap, Sparkles, Rocket, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  icon: React.ReactNode;
  popular?: boolean;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 20,
    price: 4,
    pricePerCredit: 0.20,
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 100,
    price: 15,
    pricePerCredit: 0.15,
    icon: <Sparkles className="w-6 h-6" />,
    popular: true,
  },
  {
    id: 'power',
    name: 'Power',
    credits: 500,
    price: 60,
    pricePerCredit: 0.12,
    icon: <Rocket className="w-6 h-6" />,
  },
];

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onClose }) => {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async (pkg: CreditPackage) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('You must be signed in to purchase credits.');

      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          packageId: pkg.id,
          credits: pkg.credits,
          amount: pkg.price,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create checkout session';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          const text = await response.text().catch(() => response.statusText);
          console.error(`Checkout error ${response.status}:`, text);
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const { url } = data;

      // Redirect to Stripe checkout
      if (!url) {
        console.error('No checkout URL returned. Response:', data);
        throw new Error('No checkout URL returned from server. Please try again.');
      }
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl w-full max-w-lg mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Buy Credits</h2>
          <p className="text-zinc-400 text-sm">
            Purchase credits to generate SVGs with premium models
          </p>
        </div>

        {/* Cost breakdown */}
        <div className="mb-6 p-3 bg-zinc-800/50 rounded-lg">
          <p className="text-xs text-zinc-400 text-center">
            <span className="text-zinc-300 font-medium">Credit costs:</span>{' '}
            Flash: 1 credit | 3.0 Pro: 3 credits | 3.1 Pro: 5 credits
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Credit packages */}
        <div className="space-y-3 mb-6">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => !isLoading && setSelectedPackage(pkg)}
              className={`
                relative p-4 rounded-xl border-2 cursor-pointer transition-all
                ${selectedPackage?.id === pkg.id
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {pkg.popular && (
                <div className="absolute -top-2 right-4 px-2 py-0.5 bg-indigo-500 text-white text-xs font-medium rounded-full">
                  Popular
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${selectedPackage?.id === pkg.id ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-700 text-zinc-400'}`}>
                  {pkg.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">{pkg.name}</h3>
                    <span className="text-xl font-bold text-white">${pkg.price}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-zinc-400">{pkg.credits} credits</span>
                    <span className="text-xs text-zinc-500">${pkg.pricePerCredit.toFixed(2)}/credit</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Purchase button */}
        <button
          onClick={() => selectedPackage && handlePurchase(selectedPackage)}
          disabled={!selectedPackage || isLoading}
          className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            selectedPackage ? `Buy ${selectedPackage.name} Package` : 'Select a Package'
          )}
        </button>

        {/* Secure payment note */}
        <p className="mt-4 text-center text-xs text-zinc-500 flex items-center justify-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  );
};
