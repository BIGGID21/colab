'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Plus, ArrowRight, PartyPopper, Wallet, Sparkles, X } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [onboardingStep, setOnboardingStep] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Auto-advance the story every 5 seconds (just like Instagram/Bamboo)
  useEffect(() => {
    if (onboardingStep < 2) {
      const timer = setTimeout(() => {
        setOnboardingStep((prev) => prev + 1);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [onboardingStep]);

  const completeOnboarding = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem(`colab_onboarding_${user.id}`, 'true');
    }
    // Push them into the app to the correct route!
    router.push('/my-projects');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <div className="w-full max-w-md h-full sm:h-[90vh] sm:rounded-[40px] bg-zinc-950 relative overflow-hidden flex flex-col shadow-2xl border-0 sm:border-4 border-zinc-900">
        
        {/* Story Progress Bars */}
        <div className="absolute top-8 left-4 right-4 flex gap-2 z-20">
          {[0, 1, 2].map((step) => (
            <div key={step} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-white transition-all duration-300 ${onboardingStep > step ? 'w-full' : onboardingStep === step ? 'w-full animate-progress' : 'w-0'}`}
                style={{ animationDuration: '5s', animationTimingFunction: 'linear' }}
              />
            </div>
          ))}
        </div>

        {/* Skip Button */}
        <button onClick={completeOnboarding} className="absolute top-12 left-4 z-20 p-2 text-white/50 hover:text-white transition-colors">
          <X size={24} />
        </button>

        {/* Slide Content */}
        <div className="flex-1 flex flex-col pt-28 px-6 pb-8 relative z-10 h-full">
          {onboardingStep === 0 && (
            <div className="flex-1 flex flex-col animate-in slide-in-from-right fade-in duration-500">
              <div className="flex-1 flex items-center justify-center">
                {/* Simulated App Mockup */}
                <div className="w-48 h-64 bg-[#1C1C1E] rounded-[24px] border-4 border-zinc-800 p-3 shadow-2xl rotate-[-5deg] transform hover:rotate-0 transition-transform duration-500">
                  <div className="w-12 h-12 bg-[#34C759] rounded-xl mb-3 flex items-center justify-center text-white"><Plus size={20}/></div>
                  <div className="w-full h-3 bg-zinc-800 rounded-full mb-2"></div>
                  <div className="w-2/3 h-3 bg-zinc-800 rounded-full mb-6"></div>
                  <div className="grid grid-cols-2 gap-2">
                     <div className="aspect-square bg-[#007AFF] rounded-lg"></div>
                     <div className="aspect-square bg-[#FF2D55] rounded-lg"></div>
                  </div>
                </div>
              </div>
              <div className="text-center mt-auto pb-4">
                <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Your New Workspace</h2>
                <p className="text-[15px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
                  Manage all your projects, track your collaborations, and see your saved ideas at a glance.
                </p>
              </div>
            </div>
          )}

          {onboardingStep === 1 && (
            <div className="flex-1 flex flex-col animate-in slide-in-from-right fade-in duration-500">
              <div className="flex-1 flex items-center justify-center">
                <div className="w-48 h-64 bg-[#1C1C1E] rounded-[24px] border-4 border-zinc-800 p-3 shadow-2xl rotate-[5deg] transform hover:rotate-0 transition-transform duration-500 flex flex-col items-center justify-center gap-4">
                   <div className="flex -space-x-3">
                     <div className="w-12 h-12 rounded-full bg-zinc-700 border-2 border-[#1C1C1E]"></div>
                     <div className="w-12 h-12 rounded-full bg-[#9cf822] border-2 border-[#1C1C1E] flex items-center justify-center text-black font-bold">+</div>
                     <div className="w-12 h-12 rounded-full bg-zinc-700 border-2 border-[#1C1C1E]"></div>
                   </div>
                   <div className="w-3/4 h-3 bg-zinc-800 rounded-full mt-2"></div>
                </div>
              </div>
              <div className="text-center mt-auto pb-4">
                <h2 className="text-3xl font-bold text-[#9cf822] mb-3 tracking-tight">Find Your Squad</h2>
                <p className="text-[15px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
                  Browse open briefs in the Discover feed and apply to join exciting projects matching your skills.
                </p>
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="flex-1 flex flex-col animate-in slide-in-from-right fade-in duration-500">
              <div className="flex-1 flex items-center justify-center relative">
                <div className="w-48 h-64 bg-[#1C1C1E] rounded-[24px] border-4 border-zinc-800 p-3 shadow-2xl transform transition-transform duration-500 flex flex-col items-center justify-center">
                   <Wallet size={48} className="text-[#007AFF] mb-4" strokeWidth={1.5}/>
                   <div className="text-2xl font-bold text-white mb-1">₦0.00</div>
                   <div className="w-1/2 h-2 bg-zinc-800 rounded-full"></div>
                </div>
                {/* Floating elements */}
                <div className="absolute top-1/4 -right-4 w-12 h-12 bg-[#FF9500] rounded-full flex items-center justify-center text-white shadow-lg animate-bounce"><Sparkles size={16}/></div>
              </div>
              <div className="text-center mt-auto pb-4">
                <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Get Paid Safely</h2>
                <p className="text-[15px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
                  Use the built-in Wallet and Escrow system to guarantee payment for your hard work.
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button 
            onClick={() => {
              if (onboardingStep < 2) setOnboardingStep(prev => prev + 1);
              else completeOnboarding();
            }}
            className="w-full py-4 mt-6 bg-[#9cf822] hover:bg-[#8be01d] text-black font-bold rounded-[20px] text-lg transition-colors flex items-center justify-center gap-2"
          >
            {onboardingStep < 2 ? 'Next' : 'Dive In'} {onboardingStep < 2 ? <ArrowRight size={20} /> : <PartyPopper size={20} />}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
        .animate-progress { animation-name: progress; }
      `}</style>
    </div>
  );
}