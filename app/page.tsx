'use client';

import React, { useState } from 'react';
import { 
  ArrowRight, Sparkles, Star, Zap, CheckCircle2, 
  ArrowUpRight, Users, Code, Share2 
} from 'lucide-react';
import Link from 'next/link';

// --- Floating Pill Navbar ---
const Navbar = () => (
  <nav className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#0a0a0a] border border-white/10 backdrop-blur-md rounded-full px-8 py-4 flex items-center justify-between gap-12 z-[100] shadow-2xl">
    <div className="flex items-center gap-8">
      <Link href="#about" className="text-xs font-bold text-white/70 hover:text-white transition-colors uppercase tracking-widest">About Us</Link>
      <Link href="#ecosystem" className="text-xs font-bold text-white/70 hover:text-white transition-colors uppercase tracking-widest">Ecosystem</Link>
    </div>
    
    <Link href="/" className="flex items-center gap-2 group">
      <Sparkles size={20} className="text-[#9cf822] group-hover:rotate-12 transition-transform" />
      <span className="text-xl font-black tracking-tight text-white">CoLab</span>
    </Link>
    
    <div className="flex items-center gap-8">
      <Link href="#creators" className="text-xs font-bold text-white/70 hover:text-white transition-colors uppercase tracking-widest">Creators</Link>
      <Link href="/login" className="text-xs font-bold text-white/70 hover:text-white transition-colors uppercase tracking-widest">Login</Link>
    </div>
  </nav>
);

export default function LandingPage() {
  const [activeService, setActiveService] = useState(0);

  const ecosystemItems = [
    { 
      title: "The Designer’s Canvas", 
      desc: "Showcase your visual identity and find trusted devs who bring your UI to life—no pixel lost in translation.",
      icon: Users
    },
    { 
      title: "The Developer’s Engine", 
      desc: "Skip the 'idea guys'. Connect with serious creators with high-fidelity visions ready for robust code.",
      icon: Code
    },
    { 
      title: "The Creator’s Hub", 
      desc: "From AI movies to clothing brands—this is where your concepts become companies. Ship faster.",
      icon: Zap
    },
    { 
      title: "Percentage Sharing", 
      desc: "Unified payout formulas built in. Stop tracking hourly rates, start sharing in the collective success.",
      icon: Share2
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-[#9cf822] selection:text-black font-sans">
      
      {/* CSS for Infinite Marquee */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: 200%;
          animation: marquee 15s linear infinite;
        }
      `}} />

      <Navbar />

      {/* 1. HERO SECTION (White with curved bottom) */}
      <section id="about" className="relative bg-white text-black pt-40 pb-32 px-6 rounded-b-[3rem] lg:rounded-b-[5rem] z-10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Decorative background elements */}
        <div className="absolute top-20 left-10 text-[#9cf822] opacity-50"><Sparkles size={64} strokeWidth={1} /></div>
        <div className="absolute bottom-40 right-10 text-[#9cf822] opacity-50"><Sparkles size={48} strokeWidth={1} /></div>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          <div className="lg:col-span-6 space-y-8">
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1]">
              Vision meets <br/>
              <span className="text-black inline-flex items-center gap-4">
                execution. <Sparkles className="text-[#9cf822] fill-[#9cf822]" size={40} />
              </span>
            </h1>
            <p className="text-lg text-zinc-600 max-w-md font-medium leading-relaxed">
              The premium ecosystem for Designers, Developers, and Creators to collaborate, beat deadlines, and share collective success.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <Link href="/signup" className="px-8 py-4 bg-[#9cf822] text-black font-black text-sm rounded-full hover:scale-105 transition-transform flex items-center gap-2">
                Start Building <ArrowRight size={16} />
              </Link>
              <Link href="/community" className="px-8 py-4 bg-transparent border-2 border-black text-black font-black text-sm rounded-full hover:bg-black hover:text-white transition-colors">
                Explore Community
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
             {/* Hero Image Container */}
             <div className="relative w-full max-w-md aspect-[4/5] rounded-[2rem] overflow-hidden bg-zinc-200">
               <img 
                 src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2940&auto=format&fit=crop" 
                 alt="Creative Collaboration" 
                 className="w-full h-full object-cover"
               />
               
               {/* Floating Badge */}
               <div className="absolute bottom-8 -left-8 bg-white p-4 rounded-2xl shadow-2xl border border-zinc-100 flex flex-col gap-1 hidden md:flex">
                 <div className="flex gap-1 text-[#9cf822]">
                   <Star size={16} fill="currentColor" />
                   <Star size={16} fill="currentColor" />
                   <Star size={16} fill="currentColor" />
                   <Star size={16} fill="currentColor" />
                   <Star size={16} fill="currentColor" />
                 </div>
                 <p className="font-black text-xl text-black">5,000+</p>
                 <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Verified Creators</p>
               </div>
             </div>
          </div>

        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="py-20 max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 divide-x divide-zinc-800 border-b border-zinc-900">
        {[
          { num: "5K+", label: "Active Creators" },
          { num: "50+", label: "Live Projects" },
          { num: "99%", label: "Deadline Success" },
          { num: "$2M+", label: "Value Shared" }
        ].map((stat, i) => (
          <div key={i} className={`flex flex-col items-center justify-center text-center ${i === 0 ? 'pl-0' : ''}`}>
            <h3 className="text-4xl md:text-5xl font-black text-white">{stat.num}</h3>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-2">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* 3. VALUE PROP (Turning Concepts into Companies) */}
      <section className="py-32 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter leading-tight">
              Turning Concepts <br/> Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">Companies.</span>
            </h2>
            <div className="relative rounded-[2rem] overflow-hidden bg-zinc-900 aspect-video group">
              <div className="absolute inset-0 bg-[#9cf822] opacity-0 group-hover:opacity-20 transition-opacity z-10 mix-blend-overlay"></div>
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2940&auto=format&fit=crop" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 transition-all duration-700" alt="Team" />
              <div className="absolute bottom-6 left-6 bg-[#9cf822] text-black px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg z-20">
                A Creative Hub
              </div>
            </div>
          </div>
          
          <div className="flex flex-col justify-between pt-4">
            <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-md">
              We may be a vast network, but our collaboration feels boutique. By working hand-in-hand with trusted experts, we transform raw ideas into shipped products that make a lasting impression.
            </p>
            <div className="relative rounded-[2rem] overflow-hidden bg-zinc-900 aspect-square w-2/3 ml-auto mt-10">
               <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2938&auto=format&fit=crop" className="w-full h-full object-cover grayscale opacity-60" alt="Focus" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE ECOSYSTEM SECTION */}
      <section id="ecosystem" className="py-32 bg-[#0a0a0a] border-y border-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-16">
            <div className="px-4 py-1.5 bg-[#9cf822] text-black text-[10px] font-black uppercase tracking-widest rounded-full">Why us</div>
            <h2 className="text-4xl font-black tracking-tighter">Our <span className="text-[#9cf822]">Ecosystem</span></h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Left Column: Interactive List */}
            <div className="lg:col-span-5 space-y-4">
              <p className="text-zinc-400 mb-8">We offer a robust environment tailored to help you launch faster.</p>
              {ecosystemItems.map((item, idx) => {
                const isActive = activeService === idx;
                return (
                  <button 
                    key={idx}
                    onClick={() => setActiveService(idx)}
                    className={`w-full flex items-center justify-between px-6 py-5 rounded-full transition-all duration-300 border ${
                      isActive 
                        ? 'bg-white text-black border-white scale-[1.02]' 
                        : 'bg-transparent text-white border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black opacity-50">0{idx + 1}</span>
                      <span className="font-bold text-lg tracking-tight">{item.title}</span>
                    </div>
                    <ArrowRight size={20} className={isActive ? 'text-black' : 'text-zinc-600'} />
                  </button>
                )
              })}
            </div>

            {/* Right Column: Dynamic Content Box */}
            <div className="lg:col-span-7 relative">
               <div className="w-full h-[500px] rounded-[2.5rem] bg-zinc-900 overflow-hidden relative border border-zinc-800 group">
                  <img 
                    src={
                      activeService === 0 ? "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop" :
                      activeService === 1 ? "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2000&auto=format&fit=crop" :
                      activeService === 2 ? "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2000&auto=format&fit=crop" :
                      "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?q=80&w=2000&auto=format&fit=crop"
                    }
                    key={activeService} // forces re-render/animation
                    className="w-full h-full object-cover opacity-80 animate-in fade-in duration-700" 
                    alt="Ecosystem Feature" 
                  />
                  
                  {/* Floating Green Card */}
                  <div className="absolute bottom-8 right-8 bg-[#9cf822] text-black p-6 rounded-3xl max-w-[240px] shadow-2xl">
                    <p className="font-black text-sm mb-4 leading-tight">{ecosystemItems[activeService].desc}</p>
                    <Link href="/discover" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">
                      See how we work <ArrowUpRight size={16} />
                    </Link>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INFINITE MARQUEE */}
      <section className="py-8 border-b border-zinc-900 bg-black overflow-hidden flex relative">
        <div className="animate-marquee flex items-center">
           {[...Array(6)].map((_, i) => (
             <div key={i} className="flex items-center whitespace-nowrap">
               <span className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-600 to-zinc-800 uppercase tracking-tighter mx-8">
                 Design <span className="text-white">+</span> Develop <span className="text-white">+</span> Launch
               </span>
               <Sparkles size={32} className="text-[#9cf822] mx-4" />
             </div>
           ))}
        </div>
      </section>

      {/* 6. BRANDS / CREATORS GRID */}
      <section id="creators" className="py-32 max-w-6xl mx-auto px-6 border-b border-zinc-900">
        <div className="flex items-center justify-between mb-16">
           <h2 className="text-4xl lg:text-5xl font-black tracking-tighter flex items-center gap-3">
             Built by <span className="bg-[#9cf822] text-black px-4 py-1 rounded-xl">Elite</span> Creators
           </h2>
           <Link href="/community" className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
             View All <ArrowRight size={16} />
           </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[
             { brand: "Sankofa Lens", type: "AI Movie Production", exp: "Redefining cinematic storytelling through AI." },
             { brand: "CAVIE", type: "Creative Tech", exp: "Building forward-thinking digital experiences." },
             { brand: "Think Verse", type: "Brand Agency", exp: "Where powerful ideas find their true voice." }
           ].map((creator, i) => (
             <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-8 hover:border-[#9cf822] transition-colors group cursor-pointer relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-[#9cf822] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
               <div className="flex items-center justify-between mb-6">
                 <div className="w-12 h-12 bg-black rounded-full border border-zinc-700 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-[#9cf822]" />
                 </div>
                 <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-black px-3 py-1 rounded-full border border-zinc-800">Verified</div>
               </div>
               <h3 className="text-xl font-black text-white mb-1 group-hover:text-[#9cf822] transition-colors">{creator.brand}</h3>
               <p className="text-xs font-bold text-[#9cf822] mb-4 uppercase tracking-widest">{creator.type}</p>
               <p className="text-sm text-zinc-400">{creator.exp}</p>
             </div>
           ))}
        </div>
      </section>

      {/* 7. BOTTOM CTA SECTION */}
      <section className="py-32 max-w-6xl mx-auto px-6">
        <div className="bg-[#9cf822] rounded-[3rem] p-10 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-black opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="lg:w-1/2 z-10">
             <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter leading-tight mb-4">
               Your Next <br/> Collaborator <br/> is Here.
             </h2>
             <p className="text-black/70 font-medium mb-8 max-w-sm">
               Join thousands of verified creators who have stopped dreaming and started shipping. Get in touch today.
             </p>
             <Link href="/signup" className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform">
                Enter App <ArrowRight size={18} />
             </Link>
          </div>

          <div className="lg:w-1/2 z-10">
             <div className="w-full aspect-video rounded-[2rem] overflow-hidden border-4 border-black/10">
                <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2968&auto=format&fit=crop" className="w-full h-full object-cover" alt="Collaborate" />
             </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-black py-12 border-t border-zinc-900 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <Sparkles size={20} className="text-[#9cf822]" />
            <span className="text-xl font-black tracking-tight text-white">CoLab</span>
          </Link>
          <div className="text-xs font-medium text-zinc-500">© 2024 CoLab. Your vision, magnified.</div>
          <div className="flex items-center gap-6">
              {['Terms', 'Privacy', 'Twitter', 'GitHub'].map(item => (
                  <Link key={item} href="#" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-[#9cf822] transition-colors">{item}</Link>
              ))}
          </div>
        </div>
      </footer>

    </div>
  );
}