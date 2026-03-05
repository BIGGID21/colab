'use client';

import React, { useState } from 'react';
import { X, Target, DollarSign, Calendar, Loader2, Sparkles } from 'lucide-react';

interface AddMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

export default function AddMilestoneModal({ isOpen, onClose, projectId, onSuccess }: AddMilestoneModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const triggerHaptic = (pattern: number = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const handleCreate = async () => {
    if (!title || !amount) return;
    setLoading(true);
    triggerHaptic(50); // Significant "Commitment" thump

    // Here you would normally run your Supabase insert logic
    // const { error } = await supabase.from('milestones').insert({ ... })
    
    await new Promise(resolve => setTimeout(resolve, 800)); // Mock delay
    setLoading(false);
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white uppercase tracking-tight">Define Milestone</h2>
            <p className="text-xs text-zinc-500 font-medium">Set a target for your collaborators</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors text-zinc-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Milestone Title */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Milestone Goal</label>
            <div className="relative">
              <Target size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
              <input 
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Phase 1: High-Fidelity UI Design"
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:border-[#9cf822] dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-white"
              />
            </div>
          </div>

          {/* Budget / Payout */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Allocation (USD)</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
              <input 
                type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:outline-none focus:border-[#9cf822] dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Description & Scope</label>
            <textarea 
              rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What specifically needs to be delivered to complete this phase?"
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#9cf822] dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-white resize-none"
            />
          </div>

          <button 
            onClick={handleCreate} disabled={loading || !title || !amount}
            className="w-full flex items-center justify-center gap-3 py-5 bg-[#9cf822] text-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all font-bold text-sm uppercase tracking-widest shadow-xl shadow-[#9cf822]/10"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <><span>Lock Milestone</span><Sparkles size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}