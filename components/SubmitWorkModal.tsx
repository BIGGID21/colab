'use client';

import React, { useState } from 'react';
import { X, Link as LinkIcon, FileText, Send, Loader2, CheckCircle } from 'lucide-react';

interface SubmitWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneId: string;
  milestoneTitle: string;
  onSuccess: () => void;
}

export default function SubmitWorkModal({ isOpen, onClose, milestoneId, milestoneTitle, onSuccess }: SubmitWorkModalProps) {
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // FIXED: Added 'number | number[]' so it accepts our heartbeat array pattern
  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const handleSubmit = async () => {
    if (!link) return;
    setLoading(true);
    triggerHaptic([10, 30, 10]); // This will no longer throw a red error!

    // Supabase Update Logic would go here
    // await supabase.from('milestones').update({ ... }).eq('id', milestoneId)
    
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    setLoading(false);
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-end md:items-center justify-center p-0 md:p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0a] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
        
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white uppercase tracking-tight">Submit Work</h2>
            <p className="text-xs text-zinc-500 font-medium">Deliverables for: {milestoneTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors text-zinc-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Submission Link */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Work Link (Figma, GitHub, Loom)</label>
            <div className="relative">
              <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
              <input 
                type="url" value={link} onChange={(e) => setLink(e.target.value)}
                placeholder="https://figma.com/..."
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:border-[#9cf822] dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-white"
              />
            </div>
          </div>

          {/* Submission Notes */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Collaborator Notes</label>
            <textarea 
              rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Briefly describe what you've completed..."
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#9cf822] dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-white resize-none"
            />
          </div>

          <button 
            onClick={handleSubmit} disabled={loading || !link}
            className="w-full flex items-center justify-center gap-3 py-5 bg-black text-[#9cf822] dark:bg-white dark:text-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all font-bold text-sm uppercase tracking-widest shadow-xl shadow-black/10 dark:shadow-white/5"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <><span>Send for Review</span><Send size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}