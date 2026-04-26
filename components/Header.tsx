'use client';

import React, { useState } from 'react';
import { PenTool, Sparkles, Coins, User, LogOut, Zap, Crown } from 'lucide-react';
import { useAuth } from './AuthContext';
import { AuthModal } from './AuthModal';
import { BuyCreditsModal } from './BuyCreditsModal';
import { isProModel, FREE_PRO_GENERATIONS } from '../lib/supabase';

export const Header: React.FC = () => {
  const { user, isAuthenticated, credits, freeProGenerationsUsed, freeProGenerationsRemaining, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBuyCreditsModalOpen, setIsBuyCreditsModalOpen] = useState(false);

  return (
    <>
      <header className="w-full py-4 px-4 border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-purple-500/20">
              <PenTool className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">FreeSVGForMe</h1>
              <p className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                Powered by Gemini <Sparkles className="w-3 h-3 text-amber-400" />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Credits display */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-full border border-zinc-700/50">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-white">{credits}</span>
                  <span className="text-xs text-zinc-500">credits</span>
                </div>

                {/* Free Pro gens indicator */}
                {freeProGenerationsRemaining > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 rounded-full border border-purple-500/20">
                    <Crown className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs text-purple-300">
                      {freeProGenerationsRemaining}/{FREE_PRO_GENERATIONS} free
                    </span>
                  </div>
                )}

                {/* Buy Credits button */}
                <button
                  data-buy-credits-trigger
                  onClick={() => setIsBuyCreditsModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30 text-sm font-medium transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">Buy Credits</span>
                </button>

                {/* User menu */}
                <div className="flex items-center gap-2 pl-3 border-l border-zinc-700">
                  <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                  <button
                    onClick={signOut}
                    className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                data-auth-trigger
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-900 rounded-lg font-medium text-sm transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <BuyCreditsModal isOpen={isBuyCreditsModalOpen} onClose={() => setIsBuyCreditsModalOpen(false)} />
    </>
  );
};