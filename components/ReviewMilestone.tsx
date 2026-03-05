'use client';

import React, { useState } from 'react';
import { CheckCircle, RotateCcw, ExternalLink, MessageSquare, Loader2, ShieldCheck } from 'lucide-react';

interface ReviewMilestoneProps {
  milestone: any;
  onApprove: (id: string) => void;
  onReject: (id: string, feedback: string) => void;
}

export default function ReviewMilestone({ milestone, onApprove, onReject }: ReviewMilestoneProps) {
  const [feedback, setFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    triggerHaptic([20, 50, 20]); // A rhythmic "victory" vibration
    await onApprove(milestone.id);
    setIsProcessing(false);
  };

  return (
    <div className="mt-4 p-6 bg-white dark:bg-black rounded-[2rem] border-2 border-[#9cf822]/30 shadow-xl animate-in zoom-in-95 duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#9cf822]/10 rounded-xl">
          <ShieldCheck size={18} className="text-[#5a9a00] dark:text-[#9cf822]" />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-black dark:text-white">Review Submission</h4>
          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tight">Milestone: {milestone.title}</p>
        </div>
      </div>

      {/* Submission Link Preview */}
      <a 
        href={milestone.submission_link} 
        target="_blank" 
        className="flex items-center justify-between p-4 mb-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-[#9cf822] transition-all group"
      >
        <div className="flex items-center gap-3">
          <ExternalLink size={16} className="text-zinc-400 group-hover:text-[#5a9a00]" />
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]">
            {milestone.submission_link}
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase text-[#5a9a00]">View Work</span>
      </a>

      {/* Feedback Area */}
      <div className="mb-6">
        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Review Notes (Optional)</label>
        <textarea 
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Great work, or list required changes..."
          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#9cf822] transition-all resize-none"
          rows={3}
        />
      </div>

      {/* Dual Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => { triggerHaptic(10); onReject(milestone.id, feedback); }}
          className="flex items-center justify-center gap-2 py-4 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-all"
        >
          <RotateCcw size={14} /> Request Changes
        </button>
        
        <button 
          onClick={handleApprove}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 py-4 bg-[#9cf822] text-black rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#9cf822]/20"
        >
          {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle size={14} /> Approve & Release</>}
        </button>
      </div>
    </div>
  );
}