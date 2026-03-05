import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="bg-black min-h-screen text-white font-sans selection:bg-[#9cf822] selection:text-black">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 px-8 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#9cf822]/5 blur-[120px] rounded-full -z-10" />
        
        {/* Creative Community Tag */}
        <div className="flex -space-x-2 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-12 h-12 rounded-full border-4 border-black bg-zinc-800 overflow-hidden">
              <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="user" />
            </div>
          ))}
        </div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9cf822]" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-400">Create • Collaborate • Share</span>
        </div>

        <h1 className="text-3xl md:text-[4.5rem] font-medium tracking-tighter leading-[1] mb-8 max-w-4xl">
          Collaborate with creatives. <br /> 
          Build together. <span className="text-[#9cf822]">Earn together.</span>
        </h1>
        
        <p className="text-zinc-500 max-w-2xl text-lg leading-relaxed mb-12">
          CoLab helps designers, developers, and creators find trusted collaborators, 
          work on projects together, and share profits transparently.
        </p>

        <Link href="/login">
          <button className="px-12 py-5 bg-white text-black rounded-full font-bold uppercase text-xs tracking-widest hover:bg-[#9cf822] transition-all">
            Get Started
          </button>
        </Link>
      </section>

      {/* 2. HOW IT WORKS SECTION (CoLab Specific) */}
      <section className="py-32 px-8 border-t border-zinc-900 bg-zinc-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-medium tracking-tighter mb-4">How CoLab Works</h2>
            <div className="h-1 w-20 bg-[#9cf822] mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {/* Step 1: Profile */}
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="text-5xl font-light text-zinc-800">01</div>
              <h3 className="text-2xl font-semibold">Showcase Your Craft</h3>
              <p className="text-zinc-500 leading-relaxed">
                Create a professional profile and upload your portfolio. Let the community 
                see your expertise in design, code, or branding.
              </p>
            </div>

            {/* Step 2: Projects */}
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="text-5xl font-light text-zinc-800">02</div>
              <h3 className="text-2xl font-semibold">Join or Launch Projects</h3>
              <p className="text-zinc-500 leading-relaxed">
                Explore live projects looking for talent or launch your own. Find the missing 
                piece to your creative puzzle.
              </p>
            </div>

            {/* Step 3: Collaborate */}
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="text-5xl font-light text-zinc-800">03</div>
              <h3 className="text-2xl font-semibold">Transparent Success</h3>
              <p className="text-zinc-500 leading-relaxed">
                Work together using our integrated tools. When the project succeeds, 
                profits are shared transparently among collaborators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FINAL CTA SECTION */}
      <section className="py-40 flex flex-col items-center text-center px-8">
         <h2 className="text-3xl md:text-7xl font-medium tracking-tighter mb-12 max-w-3xl">
           Worried about heavy deadlines? Not any more!. <br /> 
           Start <span className="text-[#9cf822] italic">CoLab-ing.</span>
         </h2>
         
         <Link href="/login">
           <button className="px-16 py-6 bg-[#9cf822] text-black rounded-full font-black uppercase text-sm tracking-[0.2em] shadow-[0_0_50px_rgba(156,248,34,0.2)] hover:scale-105 transition-transform active:scale-95">
             Get Started Now
           </button>
         </Link>

         <p className="mt-8 text-zinc-600 text-[10px] uppercase tracking-widest font-bold">
           Free to join • Secure collaboration • Profit sharing
         </p>
      </section>

      {/* Footer Placeholder */}
      <footer className="py-12 border-t border-zinc-900 text-center">
        <p className="text-zinc-700 text-[10px] uppercase tracking-widest">© 2026 CoLab Studio. All rights reserved.</p>
      </footer>

    </main>
  );
}