'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Rocket, AlignLeft, Users, DollarSign, Percent, 
  Plus, Trash2, ShieldCheck, Info, ArrowRight, Sparkles, CheckCircle2
} from 'lucide-react';

export default function CreateProjectPage() {
  const router = useRouter();
  
  // --- Form State ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roles, setRoles] = useState([{ id: 1, title: '', type: 'Developer' }]);
  
  // Compensation State
  const [compType, setCompType] = useState<'fixed' | 'percentage' | 'both'>('both');
  const [budget, setBudget] = useState('');
  const [equity, setEquity] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // --- Handlers ---
  const handleAddRole = () => {
    setRoles([...roles, { id: Date.now(), title: '', type: 'Designer' }]);
  };

  const handleRemoveRole = (id: number) => {
    if (roles.length > 1) {
      setRoles(roles.filter(r => r.id !== id));
    }
  };

  const handleUpdateRole = (id: number, field: string, value: string) => {
    setRoles(roles.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API/Database call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Redirect to the community feed after success
      setTimeout(() => {
        router.push('/community');
      }, 2000);
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-10 bg-zinc-900 rounded-[2rem] text-center animate-in zoom-in-95 duration-500 border border-zinc-800 shadow-2xl">
        <div className="w-20 h-20 bg-[#9cf822]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-[#9cf822]" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Project Live!</h2>
        <p className="text-zinc-400 font-medium mb-8">
          Your project has been published to the CoLab ecosystem. We're matching you with verified creators now.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
          <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
          Redirecting to community feed...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#9cf822]/10 text-[#9cf822] text-xs font-bold uppercase tracking-wider rounded-full mb-4">
          <Sparkles size={14} /> Creation Engine
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Launch a Project
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-2 text-lg">
          Define your vision, lock in the escrow, and attract top-tier talent.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Main Form */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECTION 1: Basic Info */}
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <AlignLeft size={20} className="text-[#9cf822]" /> Basic Details
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2">Project Title</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., CAVIE Fintech App Redesign"
                  className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9cf822] transition-shadow"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2">Project Brief</label>
                <textarea 
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the problem, your solution, and what you expect from collaborators..."
                  className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9cf822] transition-shadow resize-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Roles Required */}
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Users size={20} className="text-[#9cf822]" /> Roles Needed
              </h2>
              <span className="text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                {roles.length} Role{roles.length > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="space-y-4">
              {roles.map((role, index) => (
                <div key={role.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      required
                      value={role.title}
                      onChange={(e) => handleUpdateRole(role.id, 'title', e.target.value)}
                      placeholder="e.g., Senior Frontend Dev"
                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-zinc-900 dark:text-white focus:ring-0 placeholder-zinc-400"
                    />
                  </div>
                  <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-zinc-200 dark:border-zinc-800 pt-3 sm:pt-0 sm:pl-3">
                    <select 
                      value={role.type}
                      onChange={(e) => handleUpdateRole(role.id, 'type', e.target.value)}
                      className="bg-transparent text-sm font-medium text-zinc-600 dark:text-zinc-400 focus:ring-0 border-none p-0 cursor-pointer"
                    >
                      <option>Developer</option>
                      <option>Designer</option>
                      <option>Creator</option>
                      <option>Marketing</option>
                    </select>
                    {roles.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveRole(role.id)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <button 
                type="button"
                onClick={handleAddRole}
                className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add another role
              </button>
            </div>
          </div>

          {/* SECTION 3: Compensation & Escrow */}
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#9cf822]" /> Compensation Engine
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-6">
              Funds are held securely in CoLab Escrow until milestones are met.
            </p>
            
            {/* Comp Type Toggle */}
            <div className="flex p-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl mb-6">
              {['fixed', 'percentage', 'both'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCompType(type as any)}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all capitalize ${
                    compType === type 
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-5">
              {(compType === 'fixed' || compType === 'both') && (
                <div>
                  <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2">Total Fixed Budget (USD)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"><DollarSign size={18} /></div>
                    <input 
                      type="number" 
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="5,000"
                      className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl py-4 pl-10 pr-4 text-lg font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9cf822] transition-shadow"
                    />
                  </div>
                </div>
              )}

              {(compType === 'percentage' || compType === 'both') && (
                <div>
                  <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2">Percentage Share (Equity/Revenue)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"><Percent size={18} /></div>
                    <input 
                      type="number" 
                      max="100"
                      value={equity}
                      onChange={(e) => setEquity(e.target.value)}
                      placeholder="15"
                      className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl py-4 pl-10 pr-4 text-lg font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9cf822] transition-shadow"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium">This is the total % pool available to split among collaborators.</p>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* RIGHT COLUMN: Summary & Actions */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            
            {/* Review Card */}
            <div className="bg-zinc-900 text-white rounded-[2rem] p-6 shadow-2xl border border-zinc-800">
              <h3 className="text-lg font-bold mb-4">Project Overview</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Title</p>
                  <p className="text-sm font-medium line-clamp-1">{title || 'Untitled Project'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Roles Needed</p>
                  <p className="text-sm font-medium">{roles.length} Openings</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Total Pool</p>
                  <div className="flex items-center gap-2">
                    {budget && <span className="text-lg font-bold text-[#9cf822]">${budget}</span>}
                    {budget && equity && <span className="text-zinc-500">+</span>}
                    {equity && <span className="text-lg font-bold text-purple-400">{equity}%</span>}
                    {!budget && !equity && <span className="text-sm font-medium text-zinc-400">Not set</span>}
                  </div>
                </div>
              </div>

              <div className="bg-black/50 p-4 rounded-xl flex gap-3 border border-zinc-800">
                <Info size={20} className="text-[#9cf822] shrink-0" />
                <p className="text-xs font-medium text-zinc-400 leading-relaxed">
                  Upon publishing, this project will appear in the Community Feed. Escrow funding will be required before work begins.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button 
                type="submit"
                disabled={isSubmitting || !title || (!budget && !equity)}
                className="w-full py-4 bg-[#9cf822] text-black font-bold rounded-xl hover:bg-[#8be01d] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[#9cf822]/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Publishing...
                  </div>
                ) : (
                  <>Publish Project <Rocket size={18} /></>
                )}
              </button>
              <button 
                type="button"
                onClick={() => router.back()}
                className="w-full py-4 bg-transparent border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                Save as Draft
              </button>
            </div>

          </div>
        </div>

      </form>
    </div>
  );
}