'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, X, Command, Rocket, User, ArrowRight, 
  Loader2, Sparkles, LayoutGrid, Zap 
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Haptic Feedback Helper for Mobile
  const triggerHaptic = (pattern: number = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  // Apple-style search simulation
  useEffect(() => {
    if (query.length > 0) {
      setIsSearching(true);
      const timer = setTimeout(() => setIsSearching(false), 500);
      return () => clearTimeout(timer);
    }
  }, [query]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[300] flex items-start justify-center pt-[12vh] px-4 bg-zinc-950/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-top-4 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple-style Search Bar */}
        <div className="flex items-center px-8 py-6 gap-4 border-b border-zinc-100 dark:border-zinc-900">
          <Search size={20} className="text-zinc-400 shrink-0" />
          <input 
            autoFocus
            placeholder="Search ventures, roles, or skills..."
            className="flex-grow bg-transparent text-lg font-medium outline-none text-black dark:text-white placeholder:text-zinc-400"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              triggerHaptic(5); // Tactile "click" on every keystroke
            }}
          />
          <div className="flex items-center gap-3">
            {isSearching ? (
              <Loader2 size={18} className="animate-spin text-zinc-400" />
            ) : (
              <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                <Command size={10} /> Esc
              </div>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-all text-zinc-400 hover:text-black dark:hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Dynamic Results Content */}
        <div className="max-h-[55vh] overflow-y-auto p-4 custom-scrollbar">
          {query.length === 0 ? (
            <div className="py-8 space-y-6">
              <div className="px-4">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">Quick Navigation</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Branding', icon: Rocket, color: 'text-blue-500' },
                    { label: 'Designers', icon: User, color: 'text-purple-500' },
                    { label: 'Tech Stack', icon: Zap, color: 'text-orange-500' },
                    { label: 'Founders', icon: Sparkles, color: 'text-[#9cf822]' }
                  ].map((item) => (
                    <button 
                      key={item.label} 
                      onClick={() => triggerHaptic(10)}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 transition-all text-left group"
                    >
                      <item.icon size={18} className={`${item.color} group-hover:scale-110 transition-transform`} />
                      <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {/* This is where your Supabase map logic will go */}
              <div className="p-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 flex items-center justify-between group cursor-pointer transition-all border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#9cf822]/10 flex items-center justify-center text-[#5a9a00] dark:text-[#9cf822]">
                    <img src="/icon.png" className="w-6 h-6 object-contain" alt="CoLab Logo" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-black dark:text-white uppercase tracking-tight">CAVIES BRANDING</p>
                    <p className="text-xs text-zinc-500 font-medium">Active Venture • Equity 15%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">View</span>
                  <ArrowRight size={14} className="text-zinc-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-8 py-4 bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <LayoutGrid size={12} className="text-zinc-400" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">CoLab Search v1.2</span>
          </div>
          <p className="text-[10px] font-medium text-zinc-400 italic">Collaborate and build the future.</p>
        </div>
      </div>
    </div>
  );
}