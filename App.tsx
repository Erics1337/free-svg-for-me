
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { InputSection } from './components/InputSection';
import { SvgPreview } from './components/SvgPreview';
import { HistorySection } from './components/HistorySection';
import { AuthProvider } from './components/AuthContext';
import { Header } from './components/Header';
// import { SEOContent } from './components/SEOContent';
import { GeneratedSvg, GenerationStatus, ApiError } from './types';
import { AlertCircle } from 'lucide-react';
import { streamSvgGeneration } from './services/geminiService';

const App: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.0-flash');
  const [currentSvg, setCurrentSvg] = useState<GeneratedSvg | null>(null);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [error, setError] = useState<ApiError | null>(null);
  const [streamedContent, setStreamedContent] = useState<string>('');

  // History state with localStorage persistence
  const [history, setHistory] = useState<GeneratedSvg[]>(() => {
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

  const handleGenerate = async (prompt: string, animate: boolean, transparent: boolean) => {
    setStatus(GenerationStatus.LOADING);
    setError(null);
    setCurrentSvg(null);
    setStreamedContent('');

    try {
      const finalContent = await streamSvgGeneration(
        prompt,
        selectedModel,
        animate,
        transparent,
        (partial) => {
          setStreamedContent(partial);
        }
      );

      const newSvg: GeneratedSvg = {
        id: crypto.randomUUID(),
        content: finalContent,
        prompt: prompt,
        timestamp: Date.now(),
        model: selectedModel
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
    setStreamedContent(''); // Clear any previous stream
    // Scroll to top for better UX on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  // When streaming/loading, we show the temporary streamed content
  const displaySvg = status === GenerationStatus.LOADING ? {
    id: 'streaming',
    content: streamedContent,
    prompt: 'Generating...',
    timestamp: Date.now(),
    model: selectedModel
  } : currentSvg;

  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
        <Header />
        <main className="pb-20 pt-8">
          <InputSection
            onGenerate={handleGenerate}
            status={status}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />

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

          {(status === GenerationStatus.SUCCESS || status === GenerationStatus.LOADING) && displaySvg && (
            <SvgPreview
              data={displaySvg}
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


          <HistorySection
            history={history}
            onSelect={handleSelectHistory}
            onDelete={handleDeleteHistory}
            selectedId={currentSvg?.id}
          />

          {/* <SEOContent /> */}
        </main>
      </div>
    </AuthProvider>
  );
};

export default App;

