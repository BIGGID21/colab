'use client';

import React, { useState } from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownRight, Clock, 
  ShieldCheck, FileText, Download, Building, 
  CheckCircle2, AlertCircle, ChevronRight, Share2, PlusCircle
} from 'lucide-react';

// --- Mock Data ---
const transactions = [
  { id: 'tx-1', type: 'credit', title: 'Milestone 2: UI Kit Approved', project: 'CAVIE Tech Platform', amount: '+$850.00', date: 'Today, 10:42 AM', status: 'completed' },
  { id: 'tx-2', type: 'withdrawal', title: 'Withdrawal to Bank', project: 'Ending in **4092', amount: '-$1,200.00', date: 'Mar 12, 2026', status: 'completed' },
  { id: 'tx-3', type: 'escrow', title: 'Funds Locked in Escrow', project: 'CoLab Native App', amount: '$2,400.00', date: 'Mar 10, 2026', status: 'pending' },
  { id: 'tx-4', type: 'royalty', title: 'Revenue Share Distribution', project: 'Sankofa Lens MV', amount: '+$142.50', date: 'Mar 01, 2026', status: 'completed' },
];

const activeContracts = [
  { id: 'c-1', project: 'CAVIE Tech Platform', role: 'Lead UI/UX', share: '5%', status: 'Active', nextPayout: 'Q2 2026' },
  { id: 'c-2', project: 'Sankofa Lens', role: 'Brand Identity', share: '2.5%', status: 'Generating Revenue', nextPayout: 'Monthly' },
];

export default function WalletPage() {
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = () => {
    setIsWithdrawing(true);
    setTimeout(() => {
      alert("Withdrawal initiated via Stripe Connect. Funds will arrive in 1-2 business days.");
      setIsWithdrawing(false);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">Financial Terminal</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1 text-sm md:text-base">
            Manage your execution payouts, escrowed funds, and collective equity.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium text-sm rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors w-full md:w-auto border border-zinc-200 dark:border-zinc-800">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Available Balance Card */}
        <div className="bg-zinc-900 text-white rounded-[2rem] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl border border-zinc-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#9cf822] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Wallet size={16} className="text-[#9cf822]" /> Available Balance
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-bold tracking-tight">$4,250</span>
              <span className="text-lg text-zinc-500 font-medium">.00</span>
            </div>
          </div>
          
          <button 
            onClick={handleWithdraw}
            disabled={isWithdrawing}
            className="w-full relative z-10 bg-[#9cf822] text-black font-bold py-3.5 rounded-xl hover:bg-[#8be01d] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isWithdrawing ? 'Processing...' : <><Building size={18} /> Withdraw to Bank</>}
          </button>
        </div>

        {/* In Escrow Card */}
        <div className="bg-white dark:bg-[#121212] rounded-[2rem] p-6 md:p-8 flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-500" /> In Escrow
              </span>
              <div className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                Secured
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">$1,200</span>
              <span className="text-lg text-zinc-400 font-medium">.00</span>
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Locked across 2 active projects.</p>
          </div>
          
          <div className="mt-8 flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
            <Clock size={16} className="text-zinc-400 shrink-0" />
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Releases automatically upon milestone sign-off.</p>
          </div>
        </div>

        {/* Collective Equity Card */}
        <div className="bg-white dark:bg-[#121212] rounded-[2rem] p-6 md:p-8 flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 shadow-sm group cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <Share2 size={16} className="text-purple-500" /> Percentage Shares
              </span>
              <ArrowUpRight size={18} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">2</span>
              <span className="text-lg text-zinc-400 font-medium ml-1">Active</span>
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Revenue-generating collective contracts.</p>
          </div>
          
          <div className="mt-8 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-zinc-500">Total All-Time Yield</span>
              <span className="text-green-600 dark:text-[#9cf822]">+$142.50</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-1/4 rounded-full"></div>
            </div>
          </div>
        </div>

      </div>

      {/* TWO COLUMN LAYOUT FOR TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        
        {/* Left Column: Transaction Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Transaction Ledger</h3>
            <button className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">View all</button>
          </div>
          
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] overflow-hidden shadow-sm">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'credit' || tx.type === 'royalty' ? 'bg-green-100 dark:bg-[#9cf822]/10 text-green-600 dark:text-[#9cf822]' : 
                      tx.type === 'withdrawal' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' : 
                      'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                      {tx.type === 'withdrawal' ? <ArrowDownRight size={18} /> : 
                       tx.type === 'escrow' ? <ShieldCheck size={18} /> : 
                       <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{tx.title}</p>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">{tx.project} • {tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className={`text-sm font-bold ${
                      tx.type === 'credit' || tx.type === 'royalty' ? 'text-green-600 dark:text-[#9cf822]' : 
                      'text-zinc-900 dark:text-white'
                    }`}>
                      {tx.amount}
                    </span>
                    <div className="flex items-center gap-1">
                      {tx.status === 'completed' ? (
                        <><CheckCircle2 size={12} className="text-zinc-400" /><span className="text-[10px] font-medium text-zinc-500 uppercase">Settled</span></>
                      ) : (
                        <><AlertCircle size={12} className="text-orange-500" /><span className="text-[10px] font-medium text-orange-500 uppercase">Pending</span></>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Contracts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Active Contracts</h3>
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase rounded-full tracking-wider">Smart</span>
          </div>
          
          <div className="space-y-4">
            {activeContracts.map((contract) => (
              <div key={contract.id} className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] p-5 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <FileText size={16} className="text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{contract.project}</h4>
                      <p className="text-xs text-zinc-500 font-medium">{contract.role}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Your Share</p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400 leading-none">{contract.share}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Next Payout</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white leading-none">{contract.nextPayout}</p>
                  </div>
                </div>
              </div>
            ))}

            <button className="w-full py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] text-sm font-bold text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-all flex items-center justify-center gap-2">
              <PlusCircle size={18} /> Import External Contract
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}