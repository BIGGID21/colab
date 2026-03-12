'use client';

import React from 'react';
import { 
  Globe, Sparkles, TrendingUp, Users, BadgeCheck, Zap, 
  Clock, PackageCheck, Briefcase, Share2 
} from 'lucide-react';
import Link from 'next/link';

// --- Simplified BrandLogo matching the app ---
const BrandLogo = () => (
  <div className="flex items-center gap-3">
    <img src="/logo.png" alt="CoLab Logo" className="h-6 w-6 object-contain" />
    <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">CoLab</span>
  </div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-500 overflow-x-hidden text-zinc-900 dark:text-white">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-900 z-[100] px-6 sm:px-10 flex items-center justify-between">
        <BrandLogo />
        <div className="hidden sm:flex items-center gap-8">
          <Link href="#about" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-[#9cf822] transition-colors">About</Link>
          <Link href="#value" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-[#9cf822] transition-colors">Why us?</Link>
          <Link href="#how" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-[#9cf822] transition-colors">How it works?</Link>
          <Link href="#proof" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-[#9cf822] transition-colors">Creators</Link>
        </div>
        <Link href="/discover" className="px-6 py-2.5 bg-[#9cf822] text-black font-black text-xs rounded-xl transition-all shadow-lg shadow-[#9cf822]/20 uppercase tracking-widest active:scale-95">
          Enter App
        </Link>
      </nav>

      <main className="pt-20">
        {/* HERO SECTION */}
        <section id="about" className="relative bg-white dark:bg-black text-center pt-20 pb-20 border-b border-zinc-100 dark:border-zinc-900">
          <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-10">
            <div className="w-16 h-16 bg-white dark:bg-black rounded-full border border-white/10 p-2 relative shadow-inner overflow-hidden flex items-center justify-center">
                <BrandLogo />
            </div>
            <div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black dark:text-white tracking-tighter flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Zap className="text-[#9cf822] fill-[#9cf822]" size={36} /> Vision
                    </div> 
                    meets execution.
                </h1>
                <p className="max-w-xl mx-auto text-lg text-zinc-600 dark:text-zinc-400 mt-6 leading-relaxed">
                  The ecosystem for Designers, Developers, and Creators to find trusted collaborators and share success.
                </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href="/get-started" className="px-10 py-4 bg-[#9cf822] text-black font-black text-sm rounded-2xl transition-all shadow-lg shadow-[#9cf822]/30 uppercase tracking-widest active:scale-95">
                    Start building — it’s free
                </Link>
                <Link href="/community" className="px-8 py-4 bg-zinc-100 dark:bg-zinc-900 text-sm font-bold rounded-2xl text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    explore community feed
                </Link>
            </div>
          </div>
        </section>

        {/* PROOF SECTION (Brand Showcase) */}
        <section id="proof" className="bg-zinc-50 dark:bg-black py-20 border-b border-zinc-100 dark:border-zinc-900 text-left">
          <div className="max-w-5xl mx-auto px-6">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Sparkles size={14} className="text-[#9cf822]" /> Powering the next generation of brands
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Sankofa Lens', 'CAVIE', 'Think Verse', 'Meta Weaver'].map(brand => (
                    <div key={brand} className="bg-white dark:bg-black p-6 rounded-2xl border border-zinc-100 dark:border-zinc-900 flex flex-col justify-between group cursor-pointer transition-all hover:border-[#9cf822]">
                        <p className="font-bold text-black dark:text-white group-hover:text-[#9cf822] truncate">{brand}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">AI Film, Tech, Web3</p>
                    </div>
                ))}
            </div>
          </div>
        </section>

        {/* VALUE PROP SECTION */}
        <section id="value" className="py-20 border-b border-zinc-100 dark:border-zinc-900 text-left">
            <div className="max-w-5xl mx-auto px-6 flex flex-col lg:flex-row gap-10 items-start">
                <div className="lg:col-span-4 w-full lg:w-96 shrink-0 relative lg:sticky lg:top-24">
                  <PackageCheck size={18} className="text-[#9cf822] mb-2" />
                  <h3 className="font-bold text-black dark:text-white text-3xl tracking-tight leading-snug">Built for the Modern Creator.</h3>
                  <p className="text-zinc-600 dark:text-zinc-500 text-sm mt-3 italic">Stopped dreaming, start shipping.</p>
                </div>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-50 dark:bg-black rounded-[2.5rem] p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                        <Users size={20} className="text-[#9cf822]" />
                        <p className="font-black text-black dark:text-white text-lg tracking-tight mt-4">The Designer’s canvas.</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                            Showcase your visual identity and find trusted devs who bring your UI to life—no pixel lost in translation.
                        </p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-black rounded-[2.5rem] p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                        <Users size={20} className="text-[#9cf822]" />
                        <p className="font-black text-black dark:text-white text-lg tracking-tight mt-4">The Developer’s engine.</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                            Skip the idea guys. Connect with serious creators and designers with high-fidelity visions ready for code.
                        </p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-black rounded-[2.5rem] p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                        <Users size={20} className="text-[#9cf822]" />
                        <p className="font-black text-black dark:text-white text-lg tracking-tight mt-4">The Creator’s hub.</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                            From AI movies to clothing brands—this is where your concepts become companies. Ship faster than ever.
                        </p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-black rounded-[2.5rem] p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                        <Share2 size={20} className="text-[#9cf822]" />
                        <p className="font-black text-black dark:text-white text-lg tracking-tight mt-4">Percentage sharing.</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                            Unified payout formulas built into the ecosystem. Stop tracking hours, start sharing in the collective success.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* HOW IT WORKS / HIGHLIGHTS SECTION */}
        <section id="how" className="py-20 border-b border-zinc-100 dark:border-zinc-900 text-left bg-zinc-50 dark:bg-black">
          <div className="max-w-5xl mx-auto px-6 space-y-12">
            <h2 className="text-xl font-black text-black dark:text-white tracking-tighter flex items-center gap-2">
              <Globe className="text-[#9cf822]" size={20} /> Take on More Jobs, Beat Every Deadline.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {icon: Zap, title: "Trusted network", copy: "Connect with proven builders. Let the community show you verified profiles you can rely on."},
                  {icon: Briefcase, title: "Collaborator pulse", copy: "See real-time activity in the feed. Stay on top of what's being built and shared globally."},
                  {icon: BadgeCheck, title: "Verified excellence", copy: "Your ট্র্যাক record matters. Showcase your validated projects and attract top-tier partners."}
                ].map(item => (
                    <div key={item.title} className="bg-white dark:bg-black rounded-[2rem] p-8 border border-zinc-100 dark:border-zinc-800 group hover:border-[#9cf822]">
                        <item.icon size={20} className="text-[#9cf822]"/>
                        <p className="font-black text-black dark:text-white tracking-tight mt-4">{item.title}</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">{item.copy}</p>
                    </div>
                ))}
            </div>
          </div>
        </section>

        {/* FINAL CALL TO ACTION (The Close) */}
        <section id="close" className="py-32 bg-white dark:bg-black text-center relative overflow-hidden">
            <div className="max-w-5xl mx-auto px-6 relative z-10">
              <h2 className="text-5xl md:text-6xl font-black text-black dark:text-white tracking-tighter">Your next collaborator is here.</h2>
              <p className="max-w-xl mx-auto text-lg text-zinc-600 dark:text-zinc-400 mt-6 leading-relaxed mb-10">
                Join the network of over 5,000 verified creators who have stopped dreaming and started shipping.
              </p>
              <Link href="/get-started" className="px-10 py-4 bg-[#9cf822] text-black font-black text-sm rounded-2xl transition-all shadow-lg shadow-[#9cf822]/30 uppercase tracking-widest active:scale-95">
                  Enter the app shell
              </Link>
            </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-zinc-50 dark:bg-black py-10 border-t border-zinc-100 dark:border-zinc-900 px-6 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-500">
        <BrandLogo />
        <div className="text-xs font-medium text-center">© 2024 CoLab. All rights reserved. Your vision, magnified.</div>
        <div className="flex items-center gap-6">
            {['Terms', 'FAQ', 'Twitter', 'GitHub'].map(item => (
                <Link key={item} href="#" className="text-xs hover:text-[#9cf822]">{item}</Link>
            ))}
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;