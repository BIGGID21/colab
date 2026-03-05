'use client';

import React from 'react';
import { ShieldCheck, Eye, Lock, Database, UserCheck, Clock } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const sections = [
    { id: 'collection', title: '1. Data Collection' },
    { id: 'usage', title: '2. How We Use Data' },
    { id: 'sharing', title: '3. Data Sharing' },
    { id: 'security', title: '4. Data Security' },
    { id: 'rights', title: '5. Your Rights' },
    { id: 'retention', title: '6. Data Retention' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      <div className="max-w-5xl mx-auto p-4 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <header className="mb-12 border-b border-zinc-100 dark:border-zinc-800 pb-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-[#9cf822]/10 rounded-lg">
                <Lock size={20} className="text-[#5a9a00] dark:text-[#9cf822]" />
             </div>
             <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Privacy Standards</span>
          </div>
          <h1 className="text-4xl font-semibold text-black dark:text-white tracking-tight">Privacy Policy</h1>
          <div className="flex items-center gap-4 mt-4 text-sm text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Clock size={14} /> Last updated: March 1, 2026
            </div>
            <span>•</span>
            <span>Version 1.4</span>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* STICKY TABLE OF CONTENTS */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-12 space-y-6">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-4">Navigation</h4>
              <nav className="flex flex-col gap-1">
                {sections.map((s) => (
                  <a 
                    key={s.id}
                    href={`#${s.id}`}
                    className="px-4 py-2 text-sm text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-all"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
              
              <div className="p-6 bg-[#9cf822]/5 border border-[#9cf822]/10 rounded-[1.5rem]">
                <ShieldCheck className="text-[#5a9a00] dark:text-[#9cf822] mb-3" size={20} />
                <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                  Your venture data is encrypted and protected by Row Level Security.
                </p>
              </div>
            </div>
          </aside>

          {/* CONTENT AREA */}
          <main className="flex-1 max-w-2xl space-y-12 pb-24">
            
            <section id="collection" className="scroll-mt-12">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">1. Information We Collect</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                We collect information necessary to facilitate high-stakes professional collaboration. This includes:
              </p>
              <ul className="space-y-4">
                <li className="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <UserCheck size={18} className="text-[#5a9a00] shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-black dark:text-white">Account Data</p>
                    <p className="text-xs text-zinc-500 mt-1">Name, professional role, and linked social handles used to verify your collaborator identity.</p>
                  </div>
                </li>
                <li className="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <Database size={18} className="text-[#5a9a00] shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-black dark:text-white">Project Assets</p>
                    <p className="text-xs text-zinc-500 mt-1">Venture descriptions, pitch decks, and creative uploads provided during initialization.</p>
                  </div>
                </li>
              </ul>
            </section>

            <section id="usage" className="scroll-mt-12">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">2. How We Use Your Data</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                CoLab uses your data to power our AI-driven ColPal engine. This allows us to:
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  'Calculate suggested equity splits based on project scope.',
                  'Match your skills with ventures on the Discover feed.',
                  'Notify you of incoming collaboration requests or milestone completions.',
                  'Prevent fraudulent project initializations and maintain platform integrity.'
                ].map((text, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="text-[#9cf822]">•</span> {text}
                  </li>
                ))}
              </ul>
            </section>

            <section id="sharing" className="scroll-mt-12">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">3. Data Sharing</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We do not sell your personal or venture data to third parties. Your data is only shared in the following contexts:
              </p>
              <div className="mt-4 p-5 border-l-2 border-[#9cf822] bg-zinc-50 dark:bg-zinc-900/30">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mb-2">Collaboration Privacy</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  When you request to join a project, your professional profile and portfolio are shared with the Project Owner to facilitate their review process.
                </p>
              </div>
            </section>

            <section id="security" className="scroll-mt-12">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">4. Data Security</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                CoLab employs industry-standard encryption protocols. Our infrastructure, powered by Supabase, utilizes Row Level Security (RLS) to ensure that venture-specific data is only accessible to the authenticated owner and their approved collaborators.
              </p>
              <div className="mt-6">
                
              </div>
            </section>

            <section id="rights" className="scroll-mt-12">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">5. Your Rights</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                You maintain full control over your data. You may access, correct, or request the deletion of your personal information at any time via the **Settings** menu. For security reasons, venture data associated with active equity agreements may require a dissolution request before full deletion.
              </p>
            </section>

            <section id="retention" className="scroll-mt-12">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">6. Data Retention</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We retain your information as long as your account is active. If you choose to delete your account, your personal data will be purged from our active databases within 30 days, unless required for legal compliance or existing equity ledger records.
              </p>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}