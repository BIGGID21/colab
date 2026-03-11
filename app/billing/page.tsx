'use client';

import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Building2, ArrowLeft, BadgeCheck, BarChart3, Link as LinkIcon, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 1. Initialize Supabase
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 2. Ironclad User Detection with Loading State
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          setUser(session.user);
          console.log("✅ Session found:", session.user.email);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        if (mounted) setIsCheckingAuth(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user || null);
        setIsCheckingAuth(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(10);
  };

  // 3. Payment logic (Updated to ₦5,000 one-time)
  const handleUpgrade = async () => {
    if (!user) {
      alert("You must be logged in to upgrade. Please sign in!");
      router.push('/login');
      return;
    }

    setLoading(true);
    triggerHaptic();

    try {
      const response = await fetch('/api/paystack/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          amount: 5000, // Naira
          userId: user.id,
          planType: 'lifetime' // Switched from monthly/annual to lifetime
        }),
      });

      const data = await response.json();

      if (data.status && data.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        alert("Payment gateway failed to initialize.");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Connection error.");
    } finally {
      setLoading(false);
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
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <h1 className="text-3xl md:text-5xl font-black text-black dark:text-white tracking-tight mb-4">
            Level up your creative career.
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg mb-8">
            Join thousands of professionals standing out and landing clients on CoLab.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* FREE */}
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
            </ul>
            <button className="w-full py-3.5 bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white font-bold rounded-xl opacity-50 cursor-not-allowed">
              Current Plan
            </button>
          </div>

          {/* PRO (Updated to ₦5000 One-time) */}
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
              <span className="text-4xl font-black text-black dark:text-white">₦5,000</span>
              <span className="text-zinc-500 font-medium">/one-time</span>
              <p className="text-xs text-zinc-400 mt-1">Lifetime access to all PRO features</p>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <FeatureItem text="Official PRO Verification Badge" icon={<BadgeCheck size={18} className="text-[#9cf822]" />} />
              <FeatureItem text='See "Who Viewed Your Profile"' icon={<BarChart3 size={18} className="text-[#9cf822]" />} />
              <FeatureItem text="Custom colab.com/name URL" icon={<LinkIcon size={18} className="text-[#9cf822]" />} />
              <FeatureItem text="Unlimited High-Res Uploads" />
              <FeatureItem text="Priority visibility in Search" />
            </ul>
            <button 
              onClick={handleUpgrade}
              disabled={loading || isCheckingAuth}
              className="w-full py-3.5 bg-[#9cf822] text-black font-black rounded-xl shadow-lg shadow-[#9cf822]/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isCheckingAuth ? (
                <Loader2 size={18} className="animate-spin text-black/70" />
              ) : loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Pay with Paystack"
              )}
            </button>
            <p className="text-center text-[10px] text-zinc-500 mt-4 uppercase tracking-widest font-bold flex items-center justify-center gap-1">
              <ShieldCheck size={12} /> Secured by Paystack
            </p>
          </div>

          {/* AGENCY */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-[2rem] p-8 border border-zinc-200 dark:border-zinc-800 flex flex-col relative overflow-hidden">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2 mb-2">
                Agency <Building2 size={18} className="text-zinc-400" />
              </h3>
              <p className="text-sm text-zinc-500 min-h-[40px]">For recruiters and teams sourcing top creative talent.</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-black text-black dark:text-white">₦50,000</span>
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
