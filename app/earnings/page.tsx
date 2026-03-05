'use client';

import React, { useState } from 'react';
import { 
  DollarSign, Briefcase, CheckCircle2, Clock, 
  ArrowUpRight, ArrowDownToLine, Lock, ShieldCheck 
} from 'lucide-react';

export default function EarningsPage() {
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const handleWithdraw = async () => {
    triggerHaptic([10, 20, 50]); 
    setIsWithdrawing(true);
    
    // Simulate API call to payout provider (e.g., Stripe)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsWithdrawing(false);
    triggerHaptic(100); 
    alert("Withdrawal initiated successfully!");
  };

  // Mock data updated for project-based earnings
  const stats = {
    balance: 1250.00,
    escrow: 450.00,
    completedProjects: 7
  };

  // Removed equity transactions, focusing strictly on cash payouts from projects
  const transactions = [
    { id: 1, title: 'CAVIES BRANDING - Final Delivery', type: 'cash', amount: '+ $800.00', date: 'Today', status: 'cleared' },
    { id: 2, title: 'Mamas Kitchen App - Wireframes', type: 'cash', amount: '+ $450.00', date: 'Yesterday', status: 'cleared' },
    { id: 3, title: 'GIDDI Merch Design', type: 'cash', amount: '+ $450.00', date: 'Pending Review', status: 'escrow' },
  ];

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 pb-24">
      <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <header className="mb-10">
          <h1 className="text-3xl font-medium text-black dark:text-white tracking-tight">Earnings</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-8 h-[2px] bg-[#9cf822]" />
            <p className="text-sm text-zinc-500 font-medium">Track your project payouts and available funds</p>
          </div>
        </header>

        {/* Top-Level Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Available Balance Card */}
          <div className="p-8 rounded-[2rem] bg-black text-white dark:bg-white dark:text-black shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#9cf822]/20 blur-3xl rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 opacity-80">
                <DollarSign size={16} />
                <h3 className="text-xs font-bold uppercase tracking-widest">Available Balance</h3>
              </div>
              <p className="text-5xl font-black tracking-tighter mb-6">${stats.balance.toFixed(2)}</p>
              <button 
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="w-full py-4 bg-[#9cf822] text-black rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isWithdrawing ? <span className="animate-pulse">Processing...</span> : <><ArrowDownToLine size={16} /> Withdraw</>}
              </button>
            </div>
          </div>

          {/* Locked in Escrow */}
          <div className="p-8 rounded-[2rem] bg-white border border-zinc-200 dark:bg-[#0a0a0a] dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 text-zinc-500">
                <Lock size={16} />
                <h3 className="text-xs font-bold uppercase tracking-widest">In Escrow</h3>
              </div>
              <p className="text-4xl font-black text-black dark:text-white tracking-tighter">${stats.escrow.toFixed(2)}</p>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium uppercase mt-4">Awaiting client approval</p>
          </div>

          {/* Completed Projects (Replaced Equity) */}
          <div className="p-8 rounded-[2rem] bg-white border border-zinc-200 dark:bg-[#0a0a0a] dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 text-[#5a9a00] dark:text-[#9cf822]">
                <Briefcase size={16} />
                <h3 className="text-xs font-bold uppercase tracking-widest">Completed Projects</h3>
              </div>
              <p className="text-4xl font-black text-black dark:text-white tracking-tighter">{stats.completedProjects}</p>
            </div>
            <div className="flex items-center gap-2 mt-4 text-[10px] text-zinc-400 font-bold uppercase">
              <CheckCircle2 size={12} className="text-[#9cf822]" /> 100% Success Rate
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6">Payment History</h3>
          <div className="bg-white border border-zinc-200 rounded-[2rem] dark:bg-[#0a0a0a] dark:border-zinc-800 overflow-hidden">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.status === 'cleared' ? 'bg-[#9cf822]/10 text-[#5a9a00] dark:text-[#9cf822]' : 'bg-orange-500/10 text-orange-500'}`}>
                      {tx.status === 'escrow' ? <Clock size={18} /> : <ShieldCheck size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-black dark:text-white uppercase tracking-tight">{tx.title}</p>
                      <p className="text-xs text-zinc-500 font-medium">{tx.date} • {tx.status === 'escrow' ? 'Pending Client Review' : 'Funds Cleared'}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-lg font-black tracking-tight text-[#5a9a00] dark:text-[#9cf822]">
                      {tx.amount}
                    </span>
                    <ArrowUpRight size={16} className="text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}