'use client';

import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
      {/* Backdrop with Blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-zinc-800 rounded-[32px] overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between p-8 border-b border-zinc-900">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9cf822]">{title}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto custom-scrollbar text-zinc-400 text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}