'use client';

import React, { useState, useEffect } from 'react';
import { InputSection } from './InputSection';
import { SvgPreview } from './SvgPreview';
import { HistorySection } from './HistorySection';

import { GeneratedSvg, GenerationStatus, ApiError } from '../types';
import { AlertCircle } from 'lucide-react';
import { useChat } from 'ai/react'; // Keep for types if needed, or remove if unused. Actually remove it.
// import { useChat } from 'ai/react';

import { AdUnit } from './AdUnit';

export const SvgGenerator: React.FC = () => {
  const MODEL_MARKER_REGEX = /\[\[MODEL:([^\]]+)\]\]/g;
  const LEGACY_MODEL_MAP: Record<string, string> = {
    'gemini-3.1-pro': 'gemini-3.1-pro-preview',
  };

  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [currentSvg, setCurrentSvg] = useState<GeneratedSvg | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem('vectorcraft_model');
      if (!savedModel) return 'gemini-3.1-pro-preview';
      return LEGACY_MODEL_MAP[savedModel] || savedModel;
    }
    return 'gemini-3.1-pro-preview';
  });

  useEffect(() => {
    localStorage.setItem('vectorcraft_model', selectedModel);
  }, [selectedModel]);

  // History state with localStorage persistence
  const [history, setHistory] = useState<GeneratedSvg[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Use the Lambda URL directly to bypass Next.js serverless timeouts (30s)
  // We use a public env var or fallback to the known deployed URL
  const LAMBDA_URL = process.env.NEXT_PUBLIC_LAMBDA_FUNCTION_URL || "https://h6klx2wgfbzwpi3yvnl34xj4pi0fxtqv.lambda-url.us-east-1.on.aws/";

  const handleGenerate = async (prompt: string, animate: boolean, transparent: boolean) => {
    setStatus(GenerationStatus.LOADING);
    setIsLoading(true);
    setError(null);
    setCurrentSvg(null);

    try {
      const response = await fetch(LAMBDA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          animate,
          transparent
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body received");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let usedModel = selectedModel;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Filter out our custom keep-alive and initialization messages
        // "initialized" is followed by 4096 spaces
        let cleanChunk = chunk.replace(/initialized\s{4096}/g, '');
        cleanChunk = cleanChunk.replace(/keep-alive/g, '');

        if (cleanChunk) {
          fullContent += cleanChunk;
          let detectedModel: string | null = null;
          fullContent = fullContent.replace(MODEL_MARKER_REGEX, (_match, modelId: string) => {
            detectedModel = modelId;
            return '';
          });
          if (detectedModel) usedModel = detectedModel;

          // Update preview with whatever we have so far
          // We try to find the start of the SVG to make it look better
          const svgStartIndex = fullContent.indexOf('<svg');
          const displayContent = svgStartIndex >= 0 ? fullContent.substring(svgStartIndex) : fullContent;

          setCurrentSvg({
            id: 'streaming',
            content: displayContent,
            prompt: 'Generating...',
            timestamp: Date.now(),
            model: usedModel
          });
        }
      }

      // Final processing
      fullContent = fullContent.replace(MODEL_MARKER_REGEX, '');
      let cleanSvg = fullContent;
      const svgMatch = fullContent.match(/<svg[\s\S]*?<\/svg>/i);
      if (svgMatch && svgMatch[0]) {
        cleanSvg = svgMatch[0];
      } else {
        cleanSvg = fullContent.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
      }

      if (cleanSvg.includes('<svg')) {
        const newSvg: GeneratedSvg = {
          id: Date.now().toString(),
          content: cleanSvg,
          prompt: prompt,
          timestamp: Date.now(),
          model: usedModel
        };

        setCurrentSvg(newSvg);
        setHistory(prev => {
          // Prevent duplicates
          if (prev.some(item => item.id === newSvg.id)) return prev;
          return [newSvg, ...prev];
        });
        setStatus(GenerationStatus.SUCCESS);
      } else {
        throw new Error("No valid SVG found in the response.");
      }

    } catch (err: any) {
      console.error("Generation Error:", err);
      setStatus(GenerationStatus.ERROR);
      setError({
        message: "Generation Failed",
        details: err.message || "An unexpected error occurred."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vectorcraft_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    if (!historyLoaded) return;
    try {
      localStorage.setItem('vectorcraft_history', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  }, [history, historyLoaded]);

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

      {(status === GenerationStatus.SUCCESS || (status === GenerationStatus.LOADING && currentSvg)) && currentSvg && (
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

      {/* AdSense Unit - Tool Bottom */}
      <div className="max-w-4xl mx-auto mt-12 mb-8 px-4">
        <AdUnit 
          slot="3342167915" // FreeSVG Tool Bottom
          className="min-h-[100px] w-full flex justify-center bg-zinc-900/30 rounded-lg overflow-hidden"
        />
      </div>

      {historyLoaded && (
        <HistorySection
          history={history}
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
          selectedId={currentSvg?.id}
        />
      )}
    </main>
  );
};
