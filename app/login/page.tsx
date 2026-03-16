'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function LoginPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push('/discover');
    router.refresh();
  };

  const logoSrc = mounted && resolvedTheme === 'dark' ? '/white.png' : '/logo.png';

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-black font-sans">
      
      {/* ========================================================= */}
      {/* LEFT PANEL: Branding & Graphics (Hidden on Mobile) */}
      {/* ========================================================= */}
      <div className="hidden lg:flex w-1/2 relative bg-[#F9F9F8] dark:bg-[#0a0a0a] border-r border-zinc-200 dark:border-zinc-800 flex-col items-center justify-center overflow-hidden">
        
        {/* Background Decorative Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        
        {/* Abstract Glowing Orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9cf822] rounded-full blur-[150px] opacity-10 dark:opacity-5 pointer-events-none" />

        {/* Floating Element 1 - Top Left */}
        <div className="absolute top-[25%] left-[15%] animate-[bounce_6s_infinite] bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
            <img src="https://i.pravatar.cc/150?u=1" alt="user" className="w-full h-full object-cover" />
          </div>
          <div className="pr-2">
            <p className="text-sm font-bold text-black dark:text-white leading-tight">Steve Dave</p>
            <div className="flex items-center gap-1 text-[#5c960f] dark:text-[#9cf822] text-[10px] font-bold uppercase tracking-wider mt-0.5">
               <Sparkles size={10} /> Top Rated
            </div>
          </div>
        </div>

        {/* Floating Element 2 - Bottom Right */}
        <div className="absolute bottom-[30%] right-[15%] animate-[bounce_8s_infinite_reverse] bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 z-10">
           <div className="pr-2 text-right">
            <p className="text-xs text-zinc-500 font-medium leading-tight mb-0.5">I got my first 6</p>
            <p className="text-sm font-bold text-black dark:text-white leading-tight">figure job on CoLab</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
            <img src="https://i.pravatar.cc/150?u=5" alt="user" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Central Text Content */}
        <div className="relative z-20 text-center max-w-lg px-8 flex flex-col items-center">
          <div className="w-16 h-16 mb-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-3">
             {mounted && <img src={logoSrc} alt="CoLab" className="w-full h-full object-contain" />}
          </div>
          
          <h1 className="text-5xl font-bold text-zinc-900 dark:text-white leading-[1.15] tracking-tight">
            Productivity <br />
            <span className="relative inline-block mt-2">
              <span className="relative z-10 text-black bg-[#9cf822] px-4 py-1.5 rounded-xl shadow-sm transform -rotate-2 inline-block">
                multiplied.
              </span>
            </span>
          </h1>
          
          <p className="text-zinc-500 dark:text-zinc-400 mt-8 text-lg leading-relaxed max-w-md">
            Welcome back to the ecosystem where top-tier professionals collaborate, launch projects, and scale their income.
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT PANEL: The Login Form */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        
        {/* Mobile Logo (Only shows on small screens) */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
             {mounted && <img src={logoSrc} alt="CoLab" className="w-full h-full object-contain" />}
          </div>
          <span className="font-bold text-xl">CoLab</span>
        </div>

        <div className="w-full max-w-[420px] mt-12 lg:mt-0">
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-bold text-black dark:text-white mb-3">Welcome back</h2>
            <div className="flex items-center justify-center lg:justify-start gap-4">
               <span className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1 lg:hidden"></span>
               <p className="text-zinc-500 dark:text-zinc-400 text-sm">Login with your email</p>
               <span className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1 lg:max-w-[100px]"></span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-zinc-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F4F4F5] dark:bg-zinc-900 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 text-black dark:text-white rounded-xl py-3.5 pl-11 pr-4 sm:text-sm focus:outline-none transition-all placeholder:text-zinc-400"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Password</label>
                <Link href="/forgot-password" className="text-xs font-bold text-zinc-500 hover:text-[#9cf822] transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-zinc-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F4F4F5] dark:bg-zinc-900 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 text-black dark:text-white rounded-xl py-3.5 pl-11 pr-12 sm:text-sm focus:outline-none transition-all placeholder:text-zinc-400"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#9cf822] hover:bg-[#8ae01b] text-black font-bold py-3.5 rounded-xl transition-all disabled:opacity-70 mt-6"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>

            <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm mt-8">
              Don't have an account?{' '}
              <Link href="/signup" className="font-bold text-black dark:text-white hover:text-[#9cf822] dark:hover:text-[#9cf822] transition-colors">
                Register here
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}