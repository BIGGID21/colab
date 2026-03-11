'use client';

import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Building2, ArrowLeft, BadgeCheck, BarChart3, Pin, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr'; 

export default function BillingPage() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  const handleUpgrade = () => {
    if (!user) return router.push('/login');
    // @ts-ignore
    if (typeof window.PaystackPop === 'undefined') return alert("Loading...");

    setIsProcessing(true);

    // @ts-ignore
    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, 
      email: user.email,
      amount: (isAnnual ? 48000 : 5000) * 100, 
      currency: 'NGN', 
      callback: async function() {
        // CALL OUR HELPER API TO FLIP THE SWITCH
        await fetch('/api/upgrade-user', {
          method: 'POST',
          body: JSON.stringify({ userId: user.id }),
        });
        setIsProcessing(false);
        router.push('/dashboard?payment=success');
      },
      onClose: () => setIsProcessing(false)
    });
    handler.openIframe();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-24 font-sans">
      <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-900 sticky top-0 bg-white dark:bg-black z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 font-bold text-sm"><ArrowLeft size={16}/> Back</button>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-20 text-center">
        <h1 className="text-4xl md:text-6xl font-black mb-4">Level up your career.</h1>
        
        <div className="flex items-center justify-center gap-3 mt-12 mb-20">
          <span className={!isAnnual ? 'font-bold' : 'text-zinc-400'}>Monthly</span>
          <button onClick={() => setIsAnnual(!isAnnual)} className="w-14 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full p-1">
            <div className={`w-6 h-6 bg-black dark:bg-white rounded-full transition-transform ${isAnnual ? 'translate-x-6' : ''}`} />
          </button>
          <span className={isAnnual ? 'font-bold' : 'text-zinc-400'}>Annually <span className="text-[10px] bg-[#9cf822] text-black px-2 py-0.5 rounded">Save 20%</span></span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* BASIC */}
          <div className="p-8 border rounded-[2rem] dark:bg-[#0a0a0a]">
            <h3 className="text-xl font-bold mb-2">Basic</h3>
            <div className="text-4xl font-black mb-8">₦0</div>
            <ul className="space-y-4 mb-8 flex-grow">
              <FeatureItem text="Standard Profile" />
              <FeatureItem text="Post to Feed" />
              <FeatureItem text="10 Projects Max" />
            </ul>
            <button className="w-full py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-bold opacity-50">Current Plan</button>
          </div>

          {/* PRO */}
          <div className="p-8 border-2 border-[#9cf822] rounded-[2rem] dark:bg-[#0a0a0a] relative md:-translate-y-4 shadow-xl shadow-[#9cf822]/10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#9cf822] text-black text-[10px] font-black px-4 py-1 rounded-b-xl uppercase">Most Popular</div>
            <h3 className="text-xl font-bold mt-4 mb-2 flex items-center gap-2">CoLab PRO <Sparkles size={18} className="text-[#9cf822]" /></h3>
            <div className="text-4xl font-black mb-8">{isAnnual ? '₦4,000' : '₦5,000'}<span className="text-sm font-medium text-zinc-500">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-grow">
               <FeatureItem text="Verification Badge" icon={<BadgeCheck size={18} className="text-[#9cf822]" />} />
               <FeatureItem text="Profile View Insights" icon={<BarChart3 size={18} className="text-[#9cf822]" />} />
               <FeatureItem text="Custom Profile URL" icon={<LinkIcon size={18} className="text-[#9cf822]" />} />
               <FeatureItem text="Pin Projects" icon={<Pin size={18} className="text-[#9cf822]" />} />
               <FeatureItem text="Unlimited Uploads" />
            </ul>
            <button onClick={handleUpgrade} disabled={isProcessing} className="w-full py-4 bg-[#9cf822] text-black font-black rounded-xl hover:scale-105 transition-transform flex items-center justify-center">
              {isProcessing ? <Loader2 className="animate-spin" /> : "Upgrade to PRO"}
            </button>
          </div>

          {/* AGENCY */}
          <div className="p-8 border rounded-[2rem] dark:bg-[#0a0a0a]">
            <h3 className="text-xl font-bold mb-2">Agency</h3>
            <div className="text-4xl font-black mb-8">{isAnnual ? '₦39,000' : '₦49,000'}</div>
            <ul className="space-y-4 mb-8 flex-grow">
               <FeatureItem text="Everything in PRO" />
               <FeatureItem text="Talent Search Filters" />
               <FeatureItem text="Team Management" />
            </ul>
            <button className="w-full py-3 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl">Contact Sales</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text, icon }: { text: string, icon?: any }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      {icon ? icon : <Check size={18} className="text-zinc-400" />}
      {text}
    </li>
  );
}