'use client';

import React, { useState } from 'react';
import { Check, Sparkles, Building2, Zap, ArrowLeft, BadgeCheck, BarChart3, Pin, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Add the 'user' prop here so we can get email and ID
export default function BillingPage({ user }: { user: any }) {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(10);
  };

  // --- THE PAYMENT LOGIC ---
  const handleUpgrade = async (planType: 'monthly' | 'annual') => {
    setLoading(planType);
    triggerHaptic();

    try {
      // Set price: $5 for monthly, $50 for annual (2 months free)
      const amountInDollars = planType === 'annual' ? 50 : 5;

      const response = await fetch('/api/paystack/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          amount: amountInDollars,
          userId: user?.id,
          planType: planType
        }),
      });

      const data = await response.json();

      if (data.status && data.data.authorization_url) {
        // Redirect to Paystack secure checkout
        window.location.href = data.data.authorization_url;
      } else {
        alert("Payment initialization failed. Check your Vercel Environment Variables.");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Something went wrong connecting to Paystack.");
    } finally {
      setLoading(null);
    }
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
            Join thousands of professionals standing out and landing clients on CoLab.
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
              <span className="text-4xl font-black text-black dark:text-white">$0</span>
              <span className="text-zinc-500 font-medium">/forever</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <FeatureItem text="Standard Profile & Portfolio" />
              <FeatureItem text="Post to Community Feed" />
              <FeatureItem text="Upload up to 10 Projects" />
            </ul>
            <button className="w-full py-3.5 bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white font-bold rounded-xl opacity-50 cursor-not-allowed">
              Current Plan
            </button>
          </div>

          {/* TIER 2: PRO (THE 5 DOLLAR PLAN) */}
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
              <span className="text-4xl font-black text-black dark:text-white">${isAnnual ? '4' : '5'}</span>
              <span className="text-zinc-500 font-medium">/month</span>
              {isAnnual && <p className="text-xs text-zinc-400 mt-1">Billed $48 yearly</p>}
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <FeatureItem text="Official PRO Verification Badge" icon={<BadgeCheck size={18} className="text-[#9cf822]" />} />
              <FeatureItem text='See "Who Viewed Your Profile"' icon={<BarChart3 size={18} className="text-[#9cf822]" />} />
              <FeatureItem text="Custom colab.com/name URL" icon={<LinkIcon size={18} className="text-[#9cf822]" />} />
              <FeatureItem text="Unlimited High-Res Uploads" />
              <FeatureItem text="Priority visibility in Search" />
            </ul>
            <button 
              onClick={() => handleUpgrade(isAnnual ? 'annual' : 'monthly')}
              disabled={!!loading}
              className="w-full py-3.5 bg-[#9cf822] text-black font-black rounded-xl shadow-lg shadow-[#9cf822]/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              {loading === (isAnnual ? 'annual' : 'monthly') ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Upgrade to PRO"
              )}
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
              <span className="text-4xl font-black text-black dark:text-white">${isAnnual ? '39' : '49'}</span>
              <span className="text-zinc-500 font-medium">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <FeatureItem text="Everything in PRO" />
              <FeatureItem text="Advanced Talent Search Filters" />
              <FeatureItem text="Unlimited Direct Messaging" />
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
