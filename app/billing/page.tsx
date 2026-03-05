'use client';

import React, { useState } from 'react';
import { 
  CreditCard, Check, Zap, Clock, 
  ArrowUpRight, Download, ShieldCheck 
} from 'lucide-react';

export default function BillingPage() {
  const [loading, setLoading] = useState(false);

  // Mock data for the UI
  const invoices = [
    { id: 'INV-001', date: 'Oct 12, 2025', amount: '$12.00', status: 'Paid' },
    { id: 'INV-002', date: 'Sep 12, 2025', amount: '$12.00', status: 'Paid' },
    { id: 'INV-003', date: 'Aug 12, 2025', amount: '$0.00', status: 'Trial' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-4 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <header className="mb-10">
          <h1 className="text-3xl font-semibold text-black dark:text-white tracking-tight">Billing</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage your plan, payment methods, and download invoices.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* LEFT: Current Plan & Payment Method */}
          <div className="md:col-span-2 space-y-8">
            
            {/* CURRENT PLAN CARD */}
            <section className="p-6 rounded-[2rem] bg-zinc-50 border border-zinc-100 dark:bg-[#1D2226] dark:border-zinc-800">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="px-2.5 py-1 rounded-md bg-[#9cf822]/10 text-[#5a9a00] dark:text-[#9cf822] text-[10px] font-bold uppercase tracking-wider">Active Plan</span>
                  <h2 className="text-2xl font-semibold text-black dark:text-white mt-2">CoLab Pro</h2>
                  <p className="text-sm text-zinc-500 mt-1">Next renewal on Nov 12, 2025</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-black dark:text-white">$12.00</p>
                  <p className="text-xs text-zinc-500">per month</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-y border-zinc-200 dark:border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white dark:bg-black rounded-lg shadow-sm">
                    <Check size={14} className="text-[#5a9a00] dark:text-[#9cf822]" />
                  </div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Unlimited ventures</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white dark:bg-black rounded-lg shadow-sm">
                    <Check size={14} className="text-[#5a9a00] dark:text-[#9cf822]" />
                  </div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">AI Collaboration Engine</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button className="flex-1 py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-sm">
                  Change plan
                </button>
                <button className="flex-1 py-3 bg-white border border-zinc-200 text-black rounded-xl text-sm font-medium hover:bg-zinc-50 transition-all dark:bg-transparent dark:border-zinc-800 dark:text-white">
                  Cancel subscription
                </button>
              </div>
            </section>

            {/* PAYMENT METHOD */}
            <section>
              <h3 className="text-lg font-medium text-black dark:text-white mb-4 ml-1">Payment Method</h3>
              <div className="p-5 flex items-center justify-between bg-white border border-zinc-200 rounded-2xl dark:bg-transparent dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-zinc-100 rounded-md flex items-center justify-center dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <CreditCard size={18} className="text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black dark:text-white">Visa ending in 4242</p>
                    <p className="text-xs text-zinc-500 font-medium tracking-tight">Expires 12/26</p>
                  </div>
                </div>
                <button className="text-xs font-semibold text-[#5a9a00] dark:text-[#9cf822] hover:underline">
                  Edit
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT: Sidebar Stats / Info */}
          <div className="space-y-6">
            <div className="p-6 bg-[#9cf822]/5 border border-[#9cf822]/20 rounded-2xl">
              <ShieldCheck className="text-[#5a9a00] dark:text-[#9cf822] mb-3" size={24} />
              <h4 className="text-sm font-semibold text-black dark:text-white">Secure Payments</h4>
              <p className="text-xs text-zinc-500 leading-relaxed mt-1">All transactions are encrypted and processed securely via Stripe.</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest ml-1">Recent Invoices</h3>
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div key={inv.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-black dark:text-white">{inv.date}</p>
                      <p className="text-[10px] text-zinc-400 font-bold">{inv.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-black dark:text-white">{inv.amount}</span>
                      <Download size={14} className="text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}