'use client';

import React from 'react';
import { Shield, Scale, FileText, Clock, AlertCircle } from 'lucide-react';

export default function TermsOfUsePage() {
  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'ventures', title: '2. Venture Initialization' },
    { id: 'equity', title: '3. Equity & Collaboration' },
    { id: 'ip', title: '4. Intellectual Property' },
    { id: 'conduct', title: '5. User Conduct' },
    { id: 'termination', title: '6. Account Termination' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      <div className="max-w-5xl mx-auto p-4 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <header className="mb-12 border-b border-zinc-100 dark:border-zinc-800 pb-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-[#9cf822]/10 rounded-lg">
                <Scale size={20} className="text-[#5a9a00] dark:text-[#9cf822]" />
             </div>
             <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Legal Documentation</span>
          </div>
          <h1 className="text-4xl font-semibold text-black dark:text-white tracking-tight">Terms of Use</h1>
          <div className="flex items-center gap-4 mt-4 text-sm text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Clock size={14} /> Last updated: March 1, 2026
            </div>
            <span>•</span>
            <span>Version 2.1</span>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* STICKY TABLE OF CONTENTS */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-12 space-y-6">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-4">On this page</h4>
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
              
              <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-[1.5rem] dark:bg-[#1D2226] dark:border-zinc-800">
                <AlertCircle className="text-[#5a9a00] dark:text-[#9cf822] mb-3" size={20} />
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  By using CoLab, you acknowledge that you have read and understood these terms.
                </p>
              </div>
            </div>
          </aside>

          {/* CONTENT AREA */}
          <main className="flex-1 max-w-2xl space-y-12 pb-24">
            
            <section id="acceptance" className="scroll-mt-12">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                By accessing or using the CoLab platform, you agree to be bound by these Terms of Use and our Privacy Policy. These terms apply to all visitors, users, and others who access the Service. If you disagree with any part of the terms, you may not access the Service.
              </p>
            </section>

            <section id="ventures" className="scroll-mt-12">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">2. Venture Initialization</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                When you initialize a venture on CoLab, you represent that you have the legal right to the assets, names, and intellectual property associated with that project. CoLab serves as a tracking ledger for venture development and does not verify external trademark status.
              </p>
            </section>

            <section id="equity" className="scroll-mt-12">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">3. Equity & Collaboration</h2>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 p-6 rounded-2xl mb-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                  "Equity shares assigned on CoLab constitute a Digital Memorandum of Understanding (MOU) between the Founder and the Collaborator."
                </p>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Assigning equity via the CoLab dashboard creates a record of intent. Users agree that CoLab is not a legal firm or financial institution. Final equity agreements should be finalized through formal legal documentation once a venture reaches significant valuation or funding.
              </p>
            </section>

            <section id="ip" className="scroll-mt-12">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">4. Intellectual Property</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Project Owners retain all rights to their pre-existing IP. Collaborators retain rights to their specific contributions until those contributions are "Milestone Released" to the Project Owner in exchange for the agreed-upon equity share.
              </p>
            </section>

            <section id="conduct" className="scroll-mt-12">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">5. User Conduct</h2>
              <ul className="space-y-3">
                {[
                  'No fraudulent "Ghost" ventures for the purpose of misleading collaborators.',
                  'No harassment or discriminatory behavior in collaboration requests.',
                  'No unauthorized scraping or distribution of CoLab project assets.'
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#9cf822] mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section id="termination" className="scroll-mt-12">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">6. Account Termination</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}