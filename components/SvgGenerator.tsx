'use client';

import React, { useState, useEffect } from 'react';
import { InputSection } from './InputSection';
import { SvgPreview } from './SvgPreview';
import { HistorySection } from './HistorySection';
import { AdUnit } from './AdUnit';
import { BuyMeCoffee } from './BuyMeCoffee';
import { generateSvgFromPrompt } from '../services/geminiService';
import { GeneratedSvg, GenerationStatus, ApiError } from '../types';
import { AlertCircle } from 'lucide-react';

export const SvgGenerator: React.FC = () => {
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [currentSvg, setCurrentSvg] = useState<GeneratedSvg | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  
  // History state with localStorage persistence
  const [history, setHistory] = useState<GeneratedSvg[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('vectorcraft_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
      return [];
    }
  });

  // Save history whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('vectorcraft_history', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  }, [history]);

  const handleGenerate = async (prompt: string) => {
    setStatus(GenerationStatus.LOADING);
    setError(null);
    setCurrentSvg(null);

    try {
      const svgContent = await generateSvgFromPrompt(prompt);
      
      const newSvg: GeneratedSvg = {
        id: crypto.randomUUID(),
        content: svgContent,
        prompt: prompt,
        timestamp: Date.now()
      };
      
      setCurrentSvg(newSvg);
      setHistory(prev => [newSvg, ...prev]);
      setStatus(GenerationStatus.SUCCESS);
    } catch (err: any) {
      setStatus(GenerationStatus.ERROR);
      setError({
        message: "Generation Failed",
        details: err.message || "An unexpected error occurred while contacting Gemini."
      });
    }
  };

  const handleSelectHistory = (item: GeneratedSvg) => {
    setCurrentSvg(item);
    setStatus(GenerationStatus.SUCCESS);
    setError(null);
    // Scroll to top for better UX on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <main className="pb-20 pt-8">
      {/* Header with Coffee Button */}
      <div className="absolute top-4 right-4 z-10">
        <BuyMeCoffee username="yourusername" />
      </div>

      <InputSection onGenerate={handleGenerate} status={status} />
      
      {status === GenerationStatus.ERROR && error && (
        <div className="max-w-2xl mx-auto mt-8 px-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-200">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-400">{error.message}</h4>
              <p className="text-sm text-red-300/70 mt-1 break-words whitespace-pre-wrap font-mono bg-red-950/30 p-2 rounded mt-2 border border-red-500/10">
                {error.details}
              </p>
            </div>
          </div>
        </div>
      )}

      {status === GenerationStatus.SUCCESS && currentSvg && (
        <SvgPreview 
          data={currentSvg} 
        />
      )}
      
      {/* Empty State / Placeholder */}
      {status === GenerationStatus.IDLE && (
        <div className="max-w-2xl mx-auto mt-16 text-center px-4 opacity-50 pointer-events-none select-none">
           <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-zinc-900/50 border border-white/5 mb-4">
              <svg className="w-12 h-12 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                 <circle cx="8.5" cy="8.5" r="1.5" />
                 <polyline points="21 15 16 10 5 21" />
              </svg>
           </div>
           <p className="text-zinc-600 text-sm">Generated artwork will appear here</p>
        </div>
      )}

      {/* Ad Unit - Main Content */}
      <div className="max-w-2xl mx-auto mt-12 mb-12 px-4">
        <AdUnit 
          client="YOUR_ADSENSE_CLIENT_ID" 
          slot="YOUR_AD_SLOT_ID" 
          className="min-h-[250px]"
        />
      </div>

      <HistorySection 
        history={history}
        onSelect={handleSelectHistory}
        onDelete={handleDeleteHistory}
        selectedId={currentSvg?.id}
      />
    </main>
  );
};
