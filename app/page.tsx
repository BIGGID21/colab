'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Sparkles, Zap, 
  ArrowUpRight, Users, Code, Share2, 
  PenTool, Rocket, Layout, 
  CheckCircle2, CreditCard, PieChart
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

  // Integrated the new screenshots and messaging with the vertical card structure
  const ecosystemItems = [
    { 
      title: "Lab X Design Suite", 
      desc: "Our custom-built vector engine. Infinite canvas, multiplayer editing, and direct asset handoff for developers.",
      icon: Layout,
      img: "/lab x screen.png",
      link: "/lab/new" 
    },
    { 
      title: "The Financial Terminal", 
      desc: "Real-time payout tracking, escrow management, and collective equity dashboards for every project.",
      icon: PieChart,
      img: "/wallet.png",
      link: "/wallet"
    },
    { 
      title: "Pro Creator Network", 
      desc: "Verified badges, custom URLs, and unlimited high-res uploads to level up your professional creative career.",
      icon: CreditCard,
      img: "/billing.png",
      link: "/pricing"
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
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          <div className="lg:col-span-6 space-y-8">
            <h1 className="text-5xl lg:text-7xl font-medium leading-[1.1]">
              Now you can  <br/>
              <span className="text-black inline-flex items-center gap-4">
                take More Jobs.
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

          <div className="lg:col-span-6 relative flex justify-center lg:justify-end mt-12 lg:mt-0">
             {/* Hero Image Container with Crossfade Images */}
             <div className="relative w-full max-w-md aspect-[4/5] rounded-[2rem] bg-zinc-200 shadow-2xl">
               {heroImages.map((src, idx) => (
                 <img 
                   key={src}
                   src={src} 
                   alt={`Collaborator ${idx + 1}`} 
                   className={`absolute inset-0 w-full h-full object-cover rounded-[2rem] transition-opacity duration-1000 ease-in-out ${
                     currentHeroImg === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'
                   }`}
                 />
               ))}
               
               {/* Floating Badge - Positioned to show on mobile without overflow */}
               <div className="absolute -bottom-6 left-6 md:bottom-8 md:-left-8 bg-white p-3 md:p-4 rounded-2xl shadow-2xl border border-zinc-100 flex flex-col gap-1 z-20">
                 <p className="font-medium text-lg md:text-xl text-black">5,000+</p>
                 <p className="text-[10px] md:text-xs text-zinc-500 font-medium">Verified creators</p>
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

      {/* NEW ADDITION: LAB X SHOWCASE */}
      <section className="py-32 px-6 max-w-7xl mx-auto border-b border-zinc-900">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9cf822]/10 border border-[#9cf822]/20 text-xs font-bold uppercase tracking-widest text-[#9cf822] mb-6">
                  <Sparkles size={14} /> The New Standard
               </div>
               <h2 className="text-4xl lg:text-6xl font-medium tracking-tight mb-8">
                 Designed for <span className="text-[#9cf822]">Speed.</span> <br/>
                 Built for Creators.
               </h2>
               <div className="space-y-6 mb-10">
                  {[
                    "Custom vector engine with Lab X integration",
                    "Multiplayer canvas with real-time feedback",
                    "One-click handoff for developer implementation",
                    "Infinite version history & asset management"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <CheckCircle2 size={20} className="text-[#9cf822]" />
                       <span className="text-zinc-400 font-medium">{text}</span>
                    </div>
                  ))}
               </div>
               {/* UPDATED LINK: Pointing to a valid /lab/[id] route pattern. Assuming 'new' creates a session. */}
               <Link href="/lab/new" className="inline-flex items-center gap-2 text-[#9cf822] font-medium hover:opacity-80 transition-opacity">
                  Try Lab X now <ArrowRight size={16} />
               </Link>
            </div>
            <div className="relative group">
               <div className="absolute -inset-4 bg-[#9cf822]/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <img src="/lab x screen.png" className="relative rounded-2xl border border-zinc-800 shadow-2xl group-hover:border-[#9cf822]/50 transition-colors" alt="Lab X Interface" />
            </div>
         </div>
      </section>

      {/* 4. VERTICAL ECOSYSTEM SECTION (Updated Layout based on reference image) */}
      <section id="ecosystem" className="py-32 bg-[#0a0a0a] border-b border-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-24">
            <div className="px-4 py-1.5 bg-[#9cf822] text-black text-[10px] font-medium rounded-full mb-6">Why us</div>
            <h2 className="text-5xl lg:text-6xl font-medium tracking-tight max-w-2xl">
              Our <span className="text-[#9cf822]">ecosystem</span> is built for scale.
            </h2>
            <p className="text-zinc-400 mt-6 max-w-xl text-lg">We offer a robust environment tailored to help you launch faster, track earnings, and collaborate seamlessly.</p>
          </div>

          {/* Vertical Stacked Cards */}
          <div className="flex flex-col gap-24">
            {ecosystemItems.map((item, idx) => (
              <div key={idx} className="flex flex-col group">
                
                {/* Image Container with premium frame effect */}
                <div className="w-full aspect-video rounded-[2.5rem] bg-zinc-900 border border-zinc-800 p-2 md:p-4 mb-8 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                  <div className="w-full h-full rounded-[2rem] overflow-hidden relative bg-black">
                     <img 
                        src={item.img}
                        className="w-full h-full object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-100" 
                        alt={item.title} 
                     />
                     <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[2rem]"></div>
                  </div>
                </div>

                {/* Text Content Below Image */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start px-4">
                   <div className="md:col-span-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-[#9cf822]">
                         <item.icon size={24} />
                      </div>
                      <h3 className="text-2xl font-medium text-white">{item.title}</h3>
                   </div>
                   <div className="md:col-span-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <p className="text-zinc-400 text-lg leading-relaxed max-w-lg">{item.desc}</p>
                      <Link href={item.link} className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-zinc-700 hover:border-[#9cf822] hover:bg-[#9cf822] hover:text-black transition-all text-white shrink-0">
                         <ArrowUpRight size={20} />
                      </Link>
                   </div>
                </div>
                
              </div>
            ))}
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
            <span className="text-xl font-medium text-white">CoLab™</span>
          </Link>
          <div className="text-xs font-medium text-zinc-500">&copy; 2026 CoLab. All rights reserved.</div>
          <div className="flex items-center gap-6">
              {['About', 'Terms', 'Privacy', 'Blog'].map(item => (
                  <Link key={item} href={`/${item.toLowerCase()}`} className="text-xs font-medium text-zinc-500 hover:text-[#9cf822] transition-colors">{item}</Link>
              ))}
          </div>
        </div>
      </footer>

    </div>
  );
}