'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Sparkles, Star, Zap, 
  ArrowUpRight, Users, Code, Share2, 
  PenTool, Rocket 
} from 'lucide-react';
import Link from 'next/link';

// --- Animated Stat Counter ---
const AnimatedStat = ({ prefix, end, suffix }: { prefix: string, end: number, suffix: string }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
      }
    }, { threshold: 0.1 });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    let startTimestamp: number | null = null;
    const duration = 2000; // 2 seconds animation
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutQuad easing function for a smooth slow-down effect at the end
      const easeProgress = progress * (2 - progress); 
      setCount(Math.floor(easeProgress * end));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [isVisible, end]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
};

// --- Floating Pill Navbar ---
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

export default function LandingPage() {
  const [activeService, setActiveService] = useState(0);
  const [currentHeroImg, setCurrentHeroImg] = useState(0);

  // Rotating images for the hero section
  const heroImages = [
    "/image1.jpg",
    "/image2.jpg",
    "/image3.jpg",
    "/image4.jpg",
    "/image5.jpg",
    "/image6.jpg"
  ];

  // Effect to handle the hero image rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImg((prev) => (prev + 1) % heroImages.length);
    }, 4000); // Rotates every 4 seconds
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const ecosystemItems = [
    { 
      title: "The designer’s canvas", 
      desc: "Showcase your visual identity and find trusted devs who bring your UI to life—no pixel lost in translation.",
      icon: Users
    },
    { 
      title: "The developer’s engine", 
      desc: "Skip the idea guys. Connect with serious creators with high-fidelity visions ready for robust code.",
      icon: Code
    },
    { 
      title: "The creator’s hub", 
      desc: "From AI movies to clothing brands—this is where your concepts become companies. Ship faster.",
      icon: Zap
    },
    { 
      title: "Percentage sharing", 
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
            <h1 className="text-5xl lg:text-7xl font-medium leading-[1.1]">
              Now you can  <br/>
              <span className="text-black inline-flex items-center gap-4">
                take More Jobs. <Sparkles className="text-[#9cf822] fill-[#9cf822]" size={40} />
              </span>
            </h1>
            <p className="text-lg text-zinc-600 max-w-md font-medium leading-relaxed">
              The premium ecosystem for designers, developers, and creators to collaborate, beat deadlines, and share collective success.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <Link href="/create" className="px-8 py-4 bg-[#9cf822] text-black font-medium text-sm rounded-full hover:scale-105 transition-transform flex items-center gap-2">
                Create a project <ArrowRight size={16} />
              </Link>
              <Link href="/community" className="px-8 py-4 bg-transparent border-2 border-black text-black font-medium text-sm rounded-full hover:bg-black hover:text-white transition-colors">
                Explore community feed
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
             {/* Hero Image Container with Crossfade Images */}
             <div className="relative w-full max-w-md aspect-[4/5] rounded-[2rem] overflow-hidden bg-zinc-200 shadow-2xl">
               {heroImages.map((src, idx) => (
                 <img 
                   key={src}
                   src={src} 
                   alt={`Collaborator ${idx + 1}`} 
                   className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                     currentHeroImg === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'
                   }`}
                 />
               ))}
               
               {/* Floating Badge */}
               <div className="absolute bottom-8 -left-8 bg-white p-4 rounded-2xl shadow-2xl border border-zinc-100 flex flex-col gap-1 hidden md:flex z-20">
                 <p className="font-medium text-xl text-black">5,000+</p>
                 <p className="text-xs text-zinc-500 font-medium">Verified creators</p>
               </div>
             </div>
          </div>

        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="py-20 max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 divide-x divide-zinc-800 border-b border-zinc-900">
        {[
          { prefix: "", end: 5, suffix: "K+", label: "Active creators" },
          { prefix: "", end: 50, suffix: "+", label: "Live projects" },
          { prefix: "", end: 99, suffix: "%", label: "Deadline success" },
          { prefix: "$", end: 2, suffix: "M+", label: "Value shared" }
        ].map((stat, i) => (
          <div key={i} className={`flex flex-col items-center justify-center text-center ${i === 0 ? 'pl-0' : ''}`}>
            <h3 className="text-4xl md:text-5xl font-medium text-white">
              <AnimatedStat prefix={stat.prefix} end={stat.end} suffix={stat.suffix} />
            </h3>
            <p className="text-xs text-zinc-500 font-medium mt-2">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* 3. VALUE PROP */}
      <section className="py-32 max-w-6xl mx-auto px-6 border-b border-zinc-900">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-6xl font-medium leading-tight">
              Stay ahead <br/> of the <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">game.</span>
            </h2>
            <div className="relative rounded-[2rem] overflow-hidden bg-zinc-900 aspect-video group">
              <div className="absolute inset-0 bg-[#9cf822] opacity-0 group-hover:opacity-20 transition-opacity z-10 mix-blend-overlay"></div>
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2940&auto=format&fit=crop" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 transition-all duration-700" alt="Team" />
              <div className="absolute bottom-6 left-6 bg-[#9cf822] text-black px-4 py-2 text-xs font-medium rounded-lg z-20">
                A creative hub
              </div>
            </div>
          </div>
          
          <div className="flex flex-col justify-between pt-4">
            <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-md">
              CoLab connects you with trusted collaborators to ensure you never miss a deadline.
            </p>
            <div className="relative rounded-[2rem] overflow-hidden bg-zinc-900 aspect-square w-2/3 ml-auto mt-10">
               <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2938&auto=format&fit=crop" className="w-full h-full object-cover grayscale opacity-60" alt="Focus" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE ECOSYSTEM SECTION */}
      <section id="ecosystem" className="py-32 bg-[#0a0a0a] border-b border-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-16">
            <div className="px-4 py-1.5 bg-[#9cf822] text-black text-[10px] font-medium rounded-full">Why us</div>
            <h2 className="text-4xl font-medium">Our <span className="text-[#9cf822]">ecosystem</span></h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Left Column: Interactive List */}
            <div className="lg:col-span-5 space-y-4">
              <p className="text-zinc-400 mb-8 font-medium">We offer a robust environment tailored to help you launch faster.</p>
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
                      <span className="text-xs font-medium opacity-50">0{idx + 1}</span>
                      <span className="font-medium text-lg">{item.title}</span>
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
                    <p className="font-medium text-sm mb-4 leading-tight">{ecosystemItems[activeService].desc}</p>
                    <Link href="/community" className="flex items-center gap-2 text-xs font-medium hover:opacity-70 transition-opacity">
                      See how we work <ArrowUpRight size={16} />
                    </Link>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INFINITE MARQUEE */}
      <section className="py-12 border-b border-zinc-900 bg-black overflow-hidden flex relative">
        <div className="animate-marquee flex items-center">
           {[...Array(6)].map((_, i) => (
             <div key={i} className="flex items-center whitespace-nowrap">
               <span className="text-4xl md:text-6xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-zinc-600 to-zinc-800 flex items-center gap-6 mx-8">
                 Design <PenTool size={40} className="text-zinc-600" /> Develop <Code size={40} className="text-zinc-600" /> Launch <Rocket size={40} className="text-zinc-600" />
               </span>
               <Sparkles size={32} className="text-[#9cf822] mx-4" />
             </div>
           ))}
        </div>
      </section>

      {/* 6. BOTTOM CTA SECTION */}
      <section className="py-32 max-w-6xl mx-auto px-6">
        <div className="bg-white rounded-[3rem] p-10 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-100 opacity-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="lg:w-1/2 z-10">
             <h2 className="text-4xl md:text-5xl font-medium text-black leading-tight mb-4">
               Your next <br/> collaborator <br/> is here.
             </h2>
             <p className="text-black/70 font-medium mb-8 max-w-sm">
               Join thousands of verified creators who have stopped dreaming and started shipping. Get in touch today.
             </p>
             <Link href="/community" className="inline-flex items-center gap-3 bg-[#9cf822] text-black px-8 py-4 rounded-full font-medium text-sm hover:scale-105 transition-transform">
                Enter app <ArrowRight size={18} />
             </Link>
          </div>

          <div className="lg:w-1/2 z-10">
             <div className="w-full aspect-video rounded-[2rem] overflow-hidden border border-zinc-200">
                <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2968&auto=format&fit=crop" className="w-full h-full object-cover" alt="Collaborate" />
             </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-black py-12 border-t border-zinc-900 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/white.png" alt="CoLab Logo" className="w-6 h-6 object-contain group-hover:rotate-12 transition-transform" />
            <span className="text-xl font-medium text-white">CoLab</span>
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