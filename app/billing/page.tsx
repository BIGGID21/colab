'use client';

import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Building2, ArrowLeft, BadgeCheck, BarChart3, Pin, Link as LinkIcon, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr'; 

export default function BillingPage() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser(); 
      setUser(user);
      setIsCheckingAuth(false);
    };
    fetchUser();

    if (!document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [supabase.auth]);

  const handleUpgrade = () => {
    if (isCheckingAuth || !user) return;

    // @ts-ignore
    if (typeof window.PaystackPop === 'undefined') {
      alert("Paystack is still loading...");
      return;
    }

    setIsProcessing(true);

    try {
      // @ts-ignore
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, 
        email: user.email,
        amount: (isAnnual ? 48000 : 5000) * 100, 
        currency: 'NGN', 
        metadata: { userId: user.id },
        callback: function(response: any) {
          // 1. Trigger the background badge flip
          fetch('/api/upgrade-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          })
          .then(() => {
            // 2. THE ABSOLUTE REDIRECT: Bypass all 404s by forcing a clean page load
            // We use window.location.assign for the most reliable cross-browser redirect
            window.location.assign('/dashboard');
          })
          .catch(() => {
            // Fallback: take them home anyway
            window.location.assign('/dashboard');
          });
        },
        onClose: () => setIsProcessing(false)
      });

      handler.openIframe();
    } catch (err: any) {
      setIsProcessing(false);
      alert(`Gateway Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black transition-colors duration-300 pb-24 font-sans text-black dark:text-white">
      <header className="bg-white dark:bg-[#0a0a0a] border-b border-zinc-200 dark:border-zinc-900 px-6 py-4 sticky top-0 z-40 text-left">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors text-sm font-bold">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="text-sm font-bold text-zinc-400">Manage Billing</div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 md:pt-20 text-center">
        <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight text-left">
          Level up your creative career.
        </h1>
        
        <div className="flex items-center justify-start gap-3 mt-8 mb-12 md:mb-20">
          <span className={`text-sm font-bold ${!isAnnual ? 'text-black dark:text-white' : 'text-zinc-400'}`}>Monthly</span>
          <button onClick={() => setIsAnnual(!isAnnual)} className="w-14 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full relative p-1 transition-colors">
            <div className={`w-6 h-6 bg-black dark:bg-white rounded-full shadow-md transition-transform duration-300 ${isAnnual ? 'translate-x-6' : ''}`} />
          </button>
          <span className={`text-sm font-bold flex items-center gap-1.5 ${isAnnual ? 'text-black dark:text-white' : 'text-zinc-400'}`}>
            Annually <span className="text-[10px] bg-[#9cf822] text-black px-2 py-0.5 rounded uppercase tracking-wider font-bold ml-1">Save 20%</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
          {/* BASIC */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-[2rem] p-8 border border-zinc-200 dark:border-zinc-800 flex flex-col">
            <h3 className="text-xl font-bold mb-2">Basic</h3>
            <div className="mb-8 font-black text-4xl">₦0</div>
            <ul className="space-y-4 mb-8 flex-grow">
              <FeatureItem text="Standard Profile & Portfolio" />
              <FeatureItem text="Post to Community Feed" />
              <FeatureItem text="Upload up to 10 Projects" />
              <FeatureItem text="Basic Engagement Analytics" />
            </ul>
            <button disabled className="w-full py-3.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 font-bold rounded-xl cursor-not-allowed">Current Plan</button>
          </div>

          {/* PRO */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-[2rem] p-8 border-2 border-[#9cf822] shadow-[0_0_40px_-15px_rgba(156,248,34,0.3)] flex flex-col relative md:-translate-y-4 transition-all">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#9cf822] text-black text-[10px] font-black px-4 py-1 rounded-b-xl uppercase tracking-widest">Most Popular</div>
             <h3 className="text-xl font-bold mt-2 mb-2 flex items-center gap-2">CoLab PRO <Sparkles size={18} className="text-[#9cf822]" /></h3>
             <div className="mb-8 font-black text-4xl">{isAnnual ? '₦4,000' : '₦5,000'}<span className="text-sm text-zinc-500 font-medium">/mo</span></div>
             <ul className="space-y-4 mb-8 flex-grow">
               <FeatureItem text="Official PRO Verification Badge" icon={<BadgeCheck size={18} className="text-[#9cf822]" />} />
               <FeatureItem text='See "Who Viewed Your Profile"' icon={<BarChart3 size={18} className="text-[#9cf822]" />} />
               <FeatureItem text="Custom colab.com/name URL" icon={<LinkIcon size={18} className="text-[#9cf822]" />} />
               <FeatureItem text="Pin top projects to profile" icon={<Pin size={18} className="text-[#9cf822]" />} />
               <FeatureItem text="Unlimited High-Res Uploads" />
            </ul>
            <button onClick={handleUpgrade} disabled={isProcessing} className="w-full py-4 bg-[#9cf822] text-black font-black rounded-xl shadow-lg shadow-[#9cf822]/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
               {isProcessing ? <Loader2 size={18} className="animate-spin" /> : "Upgrade to PRO"}
            </button>
            <div className="mt-4 flex items-center justify-center gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <ShieldCheck size={12} /> Secured by Paystack
            </div>
          </div>

          {/* AGENCY */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-[2rem] p-8 border border-zinc-200 dark:border-zinc-800 flex flex-col">
            <h3 className="text-xl font-bold mb-2">Agency</h3>
            <div className="mb-8 font-black text-4xl">{isAnnual ? '₦39,000' : '₦49,000'}</div>
            <ul className="space-y-4 mb-8 flex-grow">
               <FeatureItem text="Everything in PRO" />
               <FeatureItem text="Advanced Talent Search" />
               <FeatureItem text="Unlimited Messaging" />
               <FeatureItem text="Portfolio PDF Exports" />
            </ul>
            <button className="w-full py-3.5 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl">Contact Sales</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text, icon }: { text: string, icon?: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <div className="mt-0.5">{icon ? icon : <Check size={18} className="text-zinc-400" />}</div>
      <span className="text-zinc-600 dark:text-zinc-300 leading-tight">{text}</span>
    </li>
  );
}