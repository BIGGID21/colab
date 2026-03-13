'use client';

import React from 'react';
import { 
  ArrowRight, Sparkles, Users, Code, Zap, Target, Briefcase, CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';

// --- Reusable Navbar (Matches Landing Page) ---
const Navbar = () => (
  <nav className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#0a0a0a] border border-white/10 backdrop-blur-md rounded-full px-6 py-3 flex items-center justify-between z-[100] shadow-2xl w-[90%] max-w-5xl">
    <Link href="/" className="flex items-center gap-3 group">
      <img src="/white.png" alt="CoLab Logo" className="w-6 h-6 object-contain group-hover:rotate-12 transition-transform" />
      <span className="text-xl font-medium text-white">CoLab</span>
    </Link>
    
    <Link href="/community" className="text-sm font-medium text-black bg-[#9cf822] hover:bg-[#8be01d] transition-colors px-6 py-2 rounded-full">
      Enter App
    </Link>
  </nav>
);

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-[#9cf822] selection:text-black font-sans pb-20">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-48 pb-20 px-6 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-40 left-10 text-[#9cf822] opacity-30"><Sparkles size={64} strokeWidth={1} /></div>
        <div className="absolute top-20 right-20 text-[#9cf822] opacity-20"><Sparkles size={32} strokeWidth={1} /></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-[#9cf822] text-xs font-medium mb-8">
            <Target size={14} /> Our Mission
          </div>
          <h1 className="text-5xl md:text-7xl font-medium leading-[1.1] mb-8">
            The refinery for <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-600">elite builders.</span>
          </h1>
        </div>
      </section>

      {/* THE PROBLEM & THE REFINERY */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden">
            <h2 className="text-3xl font-medium mb-6 flex items-center gap-3">
               You've been there.
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed font-medium">
              You have a vision, a client, or a massive project—but you don’t have enough hands. You’re turning down work because you’re a solo act in a world that moves too fast. You’re tired of the "idea guys" and the flaky freelancers. You need execution.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-medium mb-6">Welcome to the refinery.</h2>
              <p className="text-lg text-zinc-400 leading-relaxed font-medium">
                CoLab™ isn't just another freelance marketplace or a generic networking site. It’s a high-fidelity refinery where vision meets execution. We’ve built a premium ecosystem designed strictly for one thing: <strong className="text-white font-medium">shipping.</strong>
              </p>
            </div>
            <div className="aspect-square rounded-[2.5rem] bg-zinc-900 overflow-hidden border border-zinc-800">
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2940&auto=format&fit=crop" className="w-full h-full object-cover grayscale opacity-70 hover:grayscale-0 transition-all duration-700" alt="Team collaborating" />
            </div>
          </div>

        </div>
      </section>

      {/* WHO WE ARE FOR */}
      <section className="py-24 px-6 bg-black border-y border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-medium mb-4">The go-to home base.</h2>
            <p className="text-zinc-500 font-medium">Built exclusively for the world's elite builders.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "For Designers",
                desc: "Stop compromising your UI. Find trusted developers who respect the grid, understand your visual identity, and build exactly what you draw—no pixel lost in translation."
              },
              {
                icon: Code,
                title: "For Developers",
                desc: "Skip the noise. Connect with serious designers and creators who provide high-fidelity visions ready for robust, scalable code."
              },
              {
                icon: Zap,
                title: "For Creators",
                desc: "Transform raw concepts into market-ready companies. We don't just 'collaborate'—we build empires with shared upside."
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] hover:bg-zinc-900 transition-colors group">
                <div className="w-12 h-12 rounded-full bg-[#9cf822]/10 flex items-center justify-center mb-6 group-hover:bg-[#9cf822] transition-colors">
                  <item.icon size={24} className="text-[#9cf822] group-hover:text-black transition-colors" />
                </div>
                <h3 className="text-xl font-medium text-white mb-4">{item.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE BOTTOM LINE / CTA */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white text-black mb-4 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            <Briefcase size={32} />
          </div>
          <h2 className="text-4xl md:text-6xl font-medium leading-tight">
            Now you can <br/> take more jobs.
          </h2>
          <p className="text-xl text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
            CoLab connects you with trusted, verified collaborators to ensure you never miss a deadline. We handle the network so you can focus on the craft.
          </p>
          
          <div className="pt-8 flex flex-col items-center gap-6">
            <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold">
              Stop dreaming in silos. Stay ahead of the game.
            </p>
            <Link href="/create" className="inline-flex items-center gap-3 bg-[#9cf822] text-black px-10 py-5 rounded-full font-medium hover:scale-105 transition-transform shadow-[0_0_30px_rgba(156,248,34,0.3)]">
              Let's build something real <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black py-12 border-t border-zinc-900 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/white.png" alt="CoLab Logo" className="w-6 h-6 object-contain group-hover:rotate-12 transition-transform" />
            <span className="text-xl font-medium text-white">CoLab™</span>
          </Link>
          <div className="text-xs font-medium text-zinc-500">CoLab 2026, all rights reserved</div>
          <div className="flex items-center gap-6">
              {['About', 'Terms', 'Privacy', 'Blog'].map(item => (
                  <Link key={item} href="#" className="text-xs font-medium text-zinc-500 hover:text-[#9cf822] transition-colors">{item}</Link>
              ))}
          </div>
        </div>
      </footer>

    </div>
  );
}