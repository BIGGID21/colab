'use client';

import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Building2, Zap, ArrowLeft, BadgeCheck, BarChart3, Pin, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr'; 

export default function BillingPage() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize Supabase correctly for Next.js App Router (No red lines!)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Fetch Session & Load Paystack Script on Mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser(); 
      setUser(user);
      setIsCheckingAuth(false);
    };

    fetchUser();

    // Inject Paystack Script for the popup
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [supabase.auth]);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(10);
  };

  // 2. The Paystack Checkout Logic
  const handleUpgrade = () => {
    if (isCheckingAuth) return;

    if (!user) {
      alert("Please log in to upgrade to PRO.");
      router.push('/login');
      return;
    }

    setIsProcessing(true);

    // Set prices in Naira: ₦5000 monthly or ₦48000 annually
    const amountToCharge = isAnnual ? 48000 : 5000;
    const amountInSubunits = amountToCharge * 100; // Paystack requires kobo

    // @ts-ignore
    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, 
      email: user.email,
      amount: amountInSubunits,
      currency: 'NGN', // <-- THE FIX: Changed to Naira to match your account
      metadata: {
        userId: user.id // Sends to your Webhook!
      },
      callback: function(response: any) {
         setIsProcessing(false);
         alert("Payment successful! Your badge will appear in a few seconds.");
         router.push('/dashboard'); 
      },
      onClose: function() {
         setIsProcessing(false);
      }
    });

    handler.openIframe();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black transition-colors duration-300 pb-24">
      
      {/* HEADER NAV */}
      <header className="bg-white dark:bg-[#0a0a0a] border-b border-zinc-200 dark:border-zinc-900 px-4 sm:px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors text-sm font-bold"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="text-sm font-bold text-zinc-400">Manage Billing</div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 md:pt-20">
        
        {/* TITLE & TOGGLE */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-20">
          <h1 className="text-3xl md:text-5xl font-black text-black dark:text-white tracking-tight mb-4">
            Level up your creative career.
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg mb-8">
            Join thousands of professionals standing out, landing clients, and growing their network on CoLab.
          </p>

          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-bold ${!isAnnual ? 'text-black dark:text-white' : 'text-zinc-400'}`}>Monthly</span>
            <button 
              onClick={() => { triggerHaptic(); setIsAnnual(!isAnnual); }}
              className="w-14 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full relative p-1 transition-colors"
            >
              <div className={`w-6 h-6 bg-black dark:bg-white rounded-full shadow-md transition-transform duration-300 ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-bold flex items-center gap-1.5 ${isAnnual ? 'text-black dark:text-white' : 'text-zinc-400'}`}>
              Annually <span className="text-[10px] bg-[#9cf822]/20 text-[#65a30d] dark:text-[#9cf822] px-2 py-0.5 rounded uppercase tracking-wider">Save 20%</span>
            </span>
          </div>
        </div>

        {/* PRICING CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* TIER 1: FREE */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-[2rem] p-8 border border-zinc-200 dark:border-zinc-800 flex flex-col relative overflow-hidden">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-black dark:text-white mb-2">Basic</h3>
              <p className="text-sm text-zinc-500 min-h-[40px]">Perfect for getting started and sharing your portfolio.</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-black text-black dark:text-white">₦0</span>
              <span className="text-zinc-500 font-medium">/forever</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <FeatureItem text="Standard Profile & Portfolio" />
              <FeatureItem text="Post to Community Feed" />
              <FeatureItem text="Upload up to 10 Projects" />
              <FeatureItem text="Basic Engagement Analytics" />
            </ul>
            <button className="w-full py-3.5 bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
              Current Plan
            </button>
          </div>

          {/* TIER 2: PRO */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-[2rem] p-8 border-2 border-[#9cf822] shadow-[0_0_40px_-15px_rgba(156,248,34,0.3)] flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#9cf822] text-black text-xs font-black px-4 py-1 rounded-b-xl uppercase tracking-widest">
              Most Popular
            </div>
            <div className="mb-6 mt-2">
              <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2 mb-2">
                CoLab PRO <Sparkles size={18} className="text-[#9cf822]" />
              </h3>
              <p className="text-sm text-zinc-500 min-h-[40px]">For serious creators who want to stand out and get hired.</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-black text-black dark:text-white">{isAnnual ? '₦4,000' : '₦5,000'}</span>
              <span className="text-zinc-500 font-medium">/month</span>
              {isAnnual && <p className="text-xs text-zinc-400 mt-1">Billed ₦48,000 yearly</p>}
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <FeatureItem text="Official PRO Verification Badge" icon={<BadgeCheck size={18} className="text-[#9cf822]" />} />
              <FeatureItem text='See "Who Viewed Your Profile"' icon={<BarChart3 size={18} className="text-[#9cf822]" />} />
              <FeatureItem text="Custom colab.com/name URL" icon={<LinkIcon size={18} className="text-[#9cf822]" />} />
              <FeatureItem text="Pin top projects to your profile" icon={<Pin size={18} className="text-[#9cf822]" />} />
              <FeatureItem text="Unlimited High-Res Uploads" />
              <FeatureItem text="Priority visibility in Search" />
            </ul>
            
            <button 
              onClick={handleUpgrade}
              disabled={isCheckingAuth || isProcessing}
              className="w-full py-3.5 bg-[#9cf822] text-black font-black rounded-xl shadow-lg shadow-[#9cf822]/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {isCheckingAuth ? "Loading..." : isProcessing ? "Processing..." : "Upgrade to PRO"}
            </button>
          </div>

          {/* TIER 3: TEAMS / AGENCY */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-[2rem] p-8 border border-zinc-200 dark:border-zinc-800 flex flex-col relative overflow-hidden">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2 mb-2">
                Agency <Building2 size={18} className="text-zinc-400" />
              </h3>
              <p className="text-sm text-zinc-500 min-h-[40px]">For recruiters and teams sourcing top creative talent.</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-black text-black dark:text-white">{isAnnual ? '₦39,000' : '₦49,000'}</span>
              <span className="text-zinc-500 font-medium">/month</span>
              {isAnnual && <p className="text-xs text-zinc-400 mt-1">Billed ₦468,000 yearly</p>}
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <FeatureItem text="Everything in PRO" />
              <FeatureItem text="Advanced Talent Search Filters" />
              <FeatureItem text="Unlimited Direct Messaging" />
              <FeatureItem text="Export Portfolio PDFs" />
              <FeatureItem text="Dedicated Account Manager" />
            </ul>
            <button className="w-full py-3.5 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl hover:opacity-80 transition-opacity">
              Contact Sales
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text, icon }: { text: string, icon?: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <div className="shrink-0 mt-0.5">
        {icon ? icon : <Check size={18} className="text-zinc-400 dark:text-zinc-500" />}
      </div>
      <span className="text-sm text-zinc-700 dark:text-zinc-300 leading-tight">{text}</span>
    </li>
  );
}
