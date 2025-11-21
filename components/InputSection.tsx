/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect } from 'react';
import { Send, Loader2, Wand2 } from 'lucide-react';
import { GenerationStatus } from '../types';

interface InputSectionProps {
  onGenerate: (prompt: string) => void;
  status: GenerationStatus;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, status, selectedModel, onModelChange }) => {
  const [input, setInput] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  // Cooldown timer effect
  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch('/api/suggestions', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        } else {
          // Fallback if API fails
          setSuggestions(['Retro Camera', 'Space Rocket', 'Origami Bird', 'Isometric House']);
        }
      } catch (e) {
        console.error("Failed to fetch suggestions", e);
        setSuggestions(['Retro Camera', 'Space Rocket', 'Origami Bird', 'Isometric House']);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status !== GenerationStatus.LOADING && cooldown === 0) {
      onGenerate(input.trim());
      setCooldown(5); // 5 second cooldown
    }
  }, [input, status, onGenerate, cooldown]);

  const isLoading = status === GenerationStatus.LOADING;
  const isRateLimited = cooldown > 0;

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
                    : 'bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95 shadow-lg shadow-white/10 cursor-pointer'}
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="hidden sm:inline">Crafting...</span>
                  </>
                ) : isRateLimited ? (
                  <>
                    <span className="hidden sm:inline">Wait {cooldown}s</span>
                    <span className="sm:hidden">{cooldown}s</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Generate</span>
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isLoading || isRateLimited}
                onClick={() => setIsModelMenuOpen(open => !open)}
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

          {/* Model Selector */}
          {isModelMenuOpen && (
            <div className="px-2 pb-1 relative">
              <div className="absolute right-2 top-0 mt-1 z-20 w-56 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    onModelChange('gemini-2.0-flash');
                    setIsModelMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-t-lg hover:bg-zinc-800 cursor-pointer ${selectedModel === 'gemini-2.0-flash' ? 'text-white' : 'text-zinc-300'}`}
                >
                  Gemini 2.0 Flash (Fast)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onModelChange('gemini-3-pro-preview');
                    setIsModelMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-b-lg hover:bg-zinc-800 cursor-pointer ${selectedModel === 'gemini-3-pro-preview' ? 'text-white' : 'text-zinc-300'}`}
                >
                  Gemini 3.0 Pro Preview (High Quality)
                </button>
              </div>
            </div>
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
              {suggestion}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
