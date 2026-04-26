import React, { useState, useCallback, useEffect } from 'react';
import { Send, Loader2, Wand2, Coins, Crown, AlertCircle } from 'lucide-react';
import { GenerationStatus } from '../types';
import { experimental_useObject as useObject } from 'ai/react';
import { z } from 'zod';
import { useAuth } from './AuthContext';
import { getCreditCost, isProModel, FREE_PRO_GENERATIONS } from '../lib/supabase';

interface InputSectionProps {
  onGenerate: (prompt: string, animate: boolean, transparent: boolean) => void;
  status: GenerationStatus;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, status, selectedModel, onModelChange }) => {
  const [input, setInput] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const { isAuthenticated, credits, freeProGenerationsRemaining, freeProGenerationsUsed } = useAuth();

  const [isAnimated, setIsAnimated] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vectorcraft_animated') === 'true';
    }
    return false;
  });

  const [isTransparent, setIsTransparent] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vectorcraft_transparent') === 'true';
    }
    return false;
  });

  // Calculate if user can afford selected model
  const creditCost = getCreditCost(selectedModel);
  const isPro = isProModel(selectedModel);
  const canUseFreePro = isPro && freeProGenerationsRemaining > 0;
  const hasEnoughCredits = credits >= creditCost;
  const canGenerate = !isAuthenticated || canUseFreePro || hasEnoughCredits;

  useEffect(() => {
    localStorage.setItem('vectorcraft_animated', String(isAnimated));
  }, [isAnimated]);

  useEffect(() => {
    localStorage.setItem('vectorcraft_transparent', String(isTransparent));
  }, [isTransparent]);

  // Auto-switch to flash if can't afford pro and no free gens left
  useEffect(() => {
    if (isAuthenticated && isPro && !canUseFreePro && !hasEnoughCredits) {
      onModelChange('gemini-2.0-flash');
    }
  }, [isAuthenticated, isPro, canUseFreePro, hasEnoughCredits, onModelChange]);

  const { object, submit, isLoading: isSuggestionsLoading } = useObject({
    api: '/api/suggestions',
    schema: z.object({
      suggestions: z.array(z.string()),
    }),
  });

  const suggestions = object?.suggestions || [];
  const loadingSuggestions = isSuggestionsLoading && suggestions.length === 0;

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    submit({});
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (input.trim() && status !== GenerationStatus.LOADING && cooldown === 0 && canGenerate) {
      onGenerate(input.trim(), isAnimated, isTransparent);
      setCooldown(30); // 30 second cooldown to match rate limit (2 req/min)
    }
  }, [input, status, onGenerate, cooldown, isAnimated, isTransparent, isAuthenticated, canGenerate]);

  const isLoading = status === GenerationStatus.LOADING;
  const isRateLimited = cooldown > 0;
  
  // Get button state text
  const getButtonText = () => {
    if (isLoading) return { text: 'Crafting...', icon: <Loader2 className="w-5 h-5 animate-spin" /> };
    if (isRateLimited) return { text: `Wait ${cooldown}s`, icon: null };
    if (!canGenerate) return { text: 'Buy Credits', icon: <Coins className="w-5 h-5" /> };
    return { text: 'Generate', icon: <Send className="w-5 h-5" /> };
  };
  
  const buttonState = getButtonText();

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-white via-zinc-200 to-zinc-400 mb-3">
          What do you want to create?
        </h2>
        <p className="text-zinc-400 text-lg">
          Describe an object, icon, or scene, and we'll render it as vector art.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur-lg"></div>
        <div className="relative flex flex-col gap-2 bg-zinc-900 rounded-xl border border-white/10 shadow-2xl p-2">
          <div className="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0">
            <div className="flex items-center flex-1 w-full gap-2">
              <div className="pl-4 text-zinc-500">
                <Wand2 className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. A futuristic cyberpunk helmet with neon lights..."
                className="flex-1 w-full bg-transparent border-none outline-none text-white placeholder-zinc-500 px-2 py-3 text-lg"
                disabled={isLoading}
              />
            </div>
            <div className="flex w-full sm:w-auto">
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isRateLimited}
                className={`
                  flex items-center justify-center gap-2 px-6 py-3 rounded-l-lg font-semibold transition-all duration-200 flex-1
                  ${!input.trim() || isLoading || isRateLimited
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : !isAuthenticated 
                      ? 'bg-indigo-500 text-white hover:bg-indigo-600 active:scale-95 shadow-lg shadow-indigo-500/20 cursor-pointer'
                      : !canGenerate
                        ? 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer'
                        : 'bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95 shadow-lg shadow-white/10 cursor-pointer'}
                `}
              >
                {buttonState.icon}
                <span className="hidden sm:inline">{buttonState.text}</span>
                <span className="sm:hidden">{isRateLimited ? `${cooldown}s` : buttonState.text.split(' ')[0]}</span>
              </button>
              <button
                type="button"
                disabled={isLoading || isRateLimited}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModelMenuOpen(open => !open);
                }}
                className={`
                  px-3 py-3 rounded-r-lg border-l text-sm flex items-center justify-center
                  ${isLoading || isRateLimited
                    ? 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                    : 'bg-white text-zinc-950 border-zinc-300 hover:bg-zinc-200 cursor-pointer'}
                `}
              >
                <span className="text-xs">▼</span>
              </button>
            </div>
          </div>

          {/* Options Menu */}
          {isModelMenuOpen && (
            <>
              {/* Invisible overlay to handle click-outside */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsModelMenuOpen(false)}
              />

              <div className="px-2 pb-1 relative z-20">
                <div className="absolute right-2 top-0 mt-1 w-64 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
                  <div className="p-2 space-y-2">
                    <div className="text-xs font-semibold text-zinc-500 px-2 uppercase tracking-wider">Model</div>
                    <button
                      type="button"
                      onClick={() => onModelChange('gemini-2.0-flash')}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group ${selectedModel === 'gemini-2.0-flash' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'}`}
                    >
                      <span className="flex flex-col">
                        <span>Gemini 2.0 Flash</span>
                        <span className="text-[10px] text-zinc-500">
                          {isAuthenticated ? `${getCreditCost('gemini-2.0-flash')} credit` : '1 credit'}
                        </span>
                      </span>
                      {selectedModel === 'gemini-2.0-flash' && <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onModelChange('gemini-3-pro-preview')}
                      disabled={isAuthenticated && freeProGenerationsRemaining <= 0 && credits < getCreditCost('gemini-3-pro-preview')}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group ${
                        isAuthenticated && freeProGenerationsRemaining <= 0 && credits < getCreditCost('gemini-3-pro-preview') ? 'opacity-50 cursor-not-allowed' : ''
                      } ${selectedModel === 'gemini-3-pro-preview' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'}`}
                    >
                      <span className="flex flex-col">
                        <span className="flex items-center gap-1">
                          Gemini 3.0 Pro
                          {canUseFreePro && selectedModel === 'gemini-3-pro-preview' && (
                            <Crown className="w-3 h-3 text-amber-400" />
                          )}
                        </span>
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                          {getCreditCost('gemini-3-pro-preview')} credits
                          {canUseFreePro && <span className="text-amber-400/80">(free: {freeProGenerationsRemaining}/{FREE_PRO_GENERATIONS})</span>}
                        </span>
                      </span>
                      {selectedModel === 'gemini-3-pro-preview' && <div className="w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.5)]" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onModelChange('gemini-3.1-pro-preview')}
                      disabled={isAuthenticated && freeProGenerationsRemaining <= 0 && credits < getCreditCost('gemini-3.1-pro-preview')}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group ${
                        isAuthenticated && freeProGenerationsRemaining <= 0 && credits < getCreditCost('gemini-3.1-pro-preview') ? 'opacity-50 cursor-not-allowed' : ''
                      } ${selectedModel === 'gemini-3.1-pro-preview' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'}`}
                    >
                      <span className="flex flex-col">
                        <span className="flex items-center gap-1">
                          Gemini 3.1 Pro
                          {canUseFreePro && selectedModel === 'gemini-3.1-pro-preview' && (
                            <Crown className="w-3 h-3 text-amber-400" />
                          )}
                        </span>
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                          {getCreditCost('gemini-3.1-pro-preview')} credits
                          {canUseFreePro && <span className="text-amber-400/80">(free: {freeProGenerationsRemaining}/{FREE_PRO_GENERATIONS})</span>}
                        </span>
                      </span>
                      {selectedModel === 'gemini-3.1-pro-preview' && <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]" />}
                    </button>

                    <div className="h-px bg-zinc-800 my-2" />

                    <div className="text-xs font-semibold text-zinc-500 px-2 uppercase tracking-wider">Settings</div>

                    <button
                      type="button"
                      onClick={() => setIsAnimated(!isAnimated)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group ${isAnimated ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'}`}
                    >
                      <span>Animate SVG</span>
                      <div className={`w-9 h-5 rounded-full relative transition-colors ${isAnimated ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${isAnimated ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsTransparent(!isTransparent)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group ${isTransparent ? 'bg-blue-500/20 text-blue-300' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'}`}
                    >
                      <span>Transparent BG</span>
                      <div className={`w-9 h-5 rounded-full relative transition-colors ${isTransparent ? 'bg-blue-500' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${isTransparent ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </form>

      {/* Quick suggestions */}
      <div className="mt-6 flex flex-wrap justify-center gap-2 min-h-[32px]">
        {loadingSuggestions ? (
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 w-24 bg-zinc-800/50 rounded-full animate-pulse" />
            ))}
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-800/50 border border-white/5 rounded-full hover:bg-zinc-800 hover:text-white hover:border-white/20 transition-all cursor-pointer"
              disabled={isLoading}
            >
              {suggestion.replace(/\.$/, '')}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
