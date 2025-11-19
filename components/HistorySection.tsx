
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { GeneratedSvg } from '../types';
import { Clock, Trash2 } from 'lucide-react';

interface HistorySectionProps {
  history: GeneratedSvg[];
  onSelect: (item: GeneratedSvg) => void;
  onDelete: (id: string) => void;
  selectedId?: string;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ history, onSelect, onDelete, selectedId }) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mt-20 px-4 border-t border-white/10 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
      <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-2 text-zinc-100">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-semibold tracking-tight">Recent Generations</h2>
         </div>
         <span className="text-xs text-zinc-500 font-medium">{history.length} items</span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {history.map((item) => (
          <div
            key={item.id}
            className={`
              group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300
              ${selectedId === item.id 
                ? 'bg-zinc-900 border-indigo-500 ring-1 ring-indigo-500/50' 
                : 'bg-zinc-900/40 border-white/5 hover:border-white/20 hover:bg-zinc-900'}
            `}
          >
            <button
               onClick={() => onSelect(item)}
               className="flex-1 text-left w-full flex flex-col h-full"
            >
                {/* Thumbnail Container */}
                <div className="aspect-square w-full p-4 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-zinc-950/50 overflow-hidden relative">
                   <div 
                     className="w-full h-full flex items-center justify-center pointer-events-none opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 [&>svg]:w-full [&>svg]:h-full"
                     dangerouslySetInnerHTML={{ __html: item.content }} 
                   />
                   
                   {/* Overlay on Hover */}
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                
                {/* Caption */}
                <div className="p-3 w-full border-t border-white/5 bg-zinc-900/80 backdrop-blur-sm flex-1">
                  <p className="text-xs font-medium text-zinc-300 line-clamp-2 mb-1">
                    {item.prompt}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-auto">
                    {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
            </button>
            
            {/* Delete Button (Visible on Hover) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 text-white/70 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-md"
                title="Remove from history"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
