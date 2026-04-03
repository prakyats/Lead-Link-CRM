import React from 'react';
import { useUI } from '../contexts/UIContext';
import { Loader2 } from 'lucide-react';

export function GlobalLoader() {
  const { isGlobalLoading, coldStartMessage } = useUI();

  if (!isGlobalLoading && !coldStartMessage) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3 pointer-events-none animate-in slide-in-from-bottom-5 duration-300">
      {coldStartMessage && (
        <div className="bg-[#0b1120]/90 backdrop-blur-md border border-[#00d4aa]/30 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm pointer-events-auto overflow-hidden relative">
          {/* Progress bar animation */}
          <div className="absolute bottom-0 left-0 h-1 bg-[#00d4aa]/20 w-full overflow-hidden">
             <div className="h-full bg-[#00d4aa] animate-shimmer scale-x-[.3] origin-left" style={{ width: '200%' }} />
          </div>
          
          <div className="w-10 h-10 rounded-xl bg-[#00d4aa]/10 flex items-center justify-center shrink-0">
            <Loader2 className="w-5 h-5 text-[#00d4aa] animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white leading-tight">System Initialization</p>
            <p className="text-xs text-[#94a3b8] font-medium leading-relaxed">{coldStartMessage}</p>
          </div>
        </div>
      )}

      {/* Subtle spinner for regular loading when message isn't shown yet */}
      {!coldStartMessage && isGlobalLoading && (
        <div className="w-12 h-12 rounded-2xl bg-[#0b1120]/80 backdrop-blur-md border border-white/5 flex items-center justify-center shadow-xl">
          <Loader2 className="w-5 h-5 text-[#00d4aa] animate-spin opacity-60" />
        </div>
      )}
    </div>
  );
}
