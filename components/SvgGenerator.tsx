'use client';

import React, { useState, useEffect } from 'react';
import { InputSection } from './InputSection';
import { SvgPreview } from './SvgPreview';
import { HistorySection } from './HistorySection';
import { BuyMeCoffee } from './BuyMeCoffee';
import { GeneratedSvg, GenerationStatus, ApiError } from '../types';
import { AlertCircle } from 'lucide-react';
import { useChat } from 'ai/react';

export const SvgGenerator: React.FC = () => {
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [currentSvg, setCurrentSvg] = useState<GeneratedSvg | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vectorcraft_model') || 'gemini-2.0-flash';
    }
    return 'gemini-2.0-flash';
  });

  useEffect(() => {
    localStorage.setItem('vectorcraft_model', selectedModel);
  }, [selectedModel]);

  // History state with localStorage persistence
  const [history, setHistory] = useState<GeneratedSvg[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Use the Lambda URL directly to bypass Next.js serverless timeouts (30s)
  // We use a public env var or fallback to the known deployed URL
  const LAMBDA_URL = process.env.NEXT_PUBLIC_LAMBDA_FUNCTION_URL || "https://mcvufgsro4ha4raizlfmzspvvq0xqfgz.lambda-url.us-east-1.on.aws/";

  const { messages, append, isLoading, error: streamError } = useChat({
    api: LAMBDA_URL,
    onFinish: (message) => {
      const completion = message.content;
      // Clean up the SVG content
      let cleanSvg = completion;
      const svgMatch = completion.match(/<svg[\s\S]*?<\/svg>/i);
      if (svgMatch && svgMatch[0]) {
        cleanSvg = svgMatch[0];
      } else {
        cleanSvg = completion.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
      }

      // Extract prompt from the message role (not ideal, but we can't easily get the user prompt here without state)
      // Better approach: Use the last user message from the messages array, but onFinish only gives the assistant message.
      // We'll rely on the fact that we just appended a user message.
      // Actually, let's just use a generic prompt or try to find it.
      // For now, let's assume the user prompt is available via other means or just don't save it here?
      // Wait, we can just save it when we trigger generation? No, we want to save on success.
      // Let's look at the messages array.
    },
    onError: (err) => {
      setStatus(GenerationStatus.ERROR);
      setError({
        message: "Generation Failed",
        details: err.message || "An unexpected error occurred."
      });
    }
  });

  // We need to handle onFinish differently because useChat doesn't pass the prompt.
  // We can use a useEffect to watch for the finish.

  // Actually, let's simplify. We can just use the `messages` array to render the SVG if it's the last message.
  // But we want to maintain our `currentSvg` state for the preview.

  // Let's stick to the plan: useChat.

  const handleGenerate = async (prompt: string, animate: boolean, transparent: boolean) => {
    setStatus(GenerationStatus.LOADING);
    setError(null);
    setCurrentSvg(null);

    // Trigger the chat
    await append({
      role: 'user',
      content: prompt,
    }, {
      body: { model: selectedModel, animate, transparent }
    });
  };

  // Effect to handle completion and history saving
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        const completion = lastMessage.content;

        let cleanSvg = completion;
        const svgMatch = completion.match(/<svg[\s\S]*?<\/svg>/i);
        if (svgMatch && svgMatch[0]) {
          cleanSvg = svgMatch[0];
        } else {
          cleanSvg = completion.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
        }

        // If we are loading, we just want to show the preview
        if (isLoading) {
          // Only update if it looks like it might be an SVG (starts with <svg)
          // or if we want to show the raw text streaming
          if (cleanSvg.includes('<svg') || cleanSvg.length > 10) {
            setCurrentSvg({
              id: 'streaming',
              content: cleanSvg,
              prompt: 'Generating...',
              timestamp: Date.now(),
              model: selectedModel
            });
          }
        } else {
          // Finished loading, save to history
          if (cleanSvg.includes('<svg')) {
            // Find the prompt (the message before this one)
            const promptMessage = messages[messages.length - 2];
            const prompt = promptMessage?.content || "Generated SVG";

            const newSvg: GeneratedSvg = {
              id: lastMessage.id, // Use message ID for stability
              content: cleanSvg,
              prompt: prompt,
              timestamp: Date.now(),
              model: selectedModel
            };

            // Only set if different ID or if we were in streaming mode
            if (currentSvg?.id !== newSvg.id || currentSvg?.id === 'streaming') {
              setCurrentSvg(newSvg);
              setHistory(prev => {
                // Prevent duplicates in history
                if (prev.some(item => item.id === newSvg.id)) return prev;
                return [newSvg, ...prev];
              });
              setStatus(GenerationStatus.SUCCESS);
            }
          }
        }
      }
    }
  }, [isLoading, messages, selectedModel]); // Depend on isLoading to trigger when finished

  useEffect(() => {
    if (isLoading) {
      setStatus(GenerationStatus.LOADING);
    }
  }, [isLoading]);

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
      {/* Header with Coffee Button */}
      <div className="absolute top-4 right-4 z-10">
        <BuyMeCoffee username="erics1337" />
      </div>

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
