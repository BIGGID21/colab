'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, DollarSign, ChevronRight, Plus } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'in_review' | 'completed';
}

export default function MilestoneList({ milestones: initialMilestones, isOwner }: { milestones: Milestone[], isOwner: boolean }) {
  const [milestones] = useState(initialMilestones);

  const triggerHaptic = (pattern: number = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-black dark:text-white uppercase tracking-tight">Project Roadmap</h3>
          <p className="text-xs text-zinc-500 font-medium">Track progress and unlock capital</p>
        </div>
        {isOwner && (
          <button 
            onClick={() => triggerHaptic(15)}
            className="p-2 bg-[#9cf822] text-black rounded-full hover:scale-110 transition-transform shadow-lg"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-zinc-200 before:via-zinc-200 before:to-transparent dark:before:from-zinc-800 dark:before:via-zinc-800">
        {milestones.map((m, idx) => (
          <div key={m.id} className="relative flex items-start group">
            {/* Status Icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-zinc-100 shrink-0 z-10 dark:bg-black dark:border-zinc-800 transition-colors group-hover:border-[#9cf822]">
              {m.status === 'completed' ? (
                <CheckCircle2 size={18} className="text-[#5a9a00] dark:text-[#9cf822]" />
              ) : m.status === 'in_review' ? (
                <Clock size={18} className="text-orange-500 animate-pulse" />
              ) : (
                <Circle size={18} className="text-zinc-300" />
              )}
            </div>

            {/* Content Card */}
            <div className="flex-grow ml-6">
              <div className="p-5 rounded-[1.5rem] bg-zinc-50 border border-zinc-100 dark:bg-zinc-900/40 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all cursor-pointer group/card">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-bold text-black dark:text-white uppercase tracking-tight group-hover/card:text-[#5a9a00] dark:group-hover/card:text-[#9cf822] transition-colors">
                    {m.title}
                  </h4>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-black border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <DollarSign size={10} className="text-zinc-400" />
                    <span className="text-[10px] font-black text-zinc-900 dark:text-white">{m.amount}</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed mb-4 line-clamp-2">
                  {m.description}
                </p>
                
                {/* Action Button */}
                <button 
                  onClick={() => triggerHaptic(5)}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover/card:text-black dark:group-hover/card:text-white transition-all"
                >
                  {m.status === 'pending' ? 'Submit Work' : 'View Details'}
                  <ChevronRight size={12} className="group-hover/card:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}