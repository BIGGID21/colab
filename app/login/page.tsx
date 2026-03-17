'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Eye, EyeOff, Loader2, Sparkles, BadgeCheck, Mail, Lock } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function LoginPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      router.push('/discover');
    }
  };

  if (!mounted) return null;

  const logoSrc = resolvedTheme === 'dark' ? '/white.png' : '/logo.png';

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-black font-sans">
      
      {/* ========================================================= */}
      {/* LEFT PANEL: Branding & Graphics (Chaise Style) */}
      {/* ========================================================= */}
      <div className="hidden lg:flex w-1/2 relative bg-[#F9F9F8] dark:bg-[#0a0a0a] border-r border-zinc-200 dark:border-zinc-800 flex-col items-center justify-center overflow-hidden">
        
        {/* Background Decorative Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        
        {/* Abstract Glowing Orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9cf822] rounded-full blur-[150px] opacity-10 dark:opacity-5 pointer-events-none" />

        {/* Floating Ecosystem Profiles */}
        <div className="absolute top-12 xl:top-[15%] left-4 xl:left-[10%] scale-75 xl:scale-100 origin-top-left animate-[bounce_6s_infinite] bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 z-10">
          <img src="https://i.pravatar.cc/150?u=1" className="w-10 h-10 rounded-full" alt="Steve" />
          <div className="pr-2">
            <p className="text-sm font-bold text-black dark:text-white leading-tight">Steve Dave</p>
            <div className="flex items-center gap-1 text-[#5c960f] dark:text-[#9cf822] text-[10px] font-bold uppercase tracking-wider mt-0.5">
               <Sparkles size={10} /> Top Rated
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 xl:bottom-[15%] right-4 xl:right-[10%] scale-75 xl:scale-100 origin-bottom-right animate-[bounce_8s_infinite_reverse] bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 z-10">
          <div className="pr-2 text-right">
            <p className="text-xs text-zinc-500 font-medium leading-tight mb-0.5">Verified Expert</p>
            <p className="text-sm font-bold text-black dark:text-white leading-tight flex items-center justify-end gap-1">
              Amara D. <BadgeCheck size={14} className="text-[#9cf822]" fill="currentColor" />
            </p>
          </div>
          <img src="https://i.pravatar.cc/150?u=12" className="w-10 h-10 rounded-full" alt="Amara" />
        </div>

        {/* Central Text Content */}
        <div className="relative z-20 text-center max-w-lg px-8 flex flex-col items-center">
          <div className="w-16 h-16 mb-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-3">
             <img src={logoSrc} alt="CoLab" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-5xl font-bold text-zinc-900 dark:text-white leading-[1.15] tracking-tight">
            Productivity <br />
            <span className="relative inline-block mt-2">
              <span className="relative z-10 text-black bg-[#9cf822] px-4 py-1.5 rounded-xl shadow-sm transform -rotate-2 inline-block">
                multiplied.
              </span>
            </span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-8 text-lg leading-relaxed max-w-md bg-[#F9F9F8]/80 dark:bg-[#0a0a0a]/80 backdrop-blur-sm rounded-xl p-2">
            Welcome back to the ecosystem where top-tier professionals collaborate, launch projects, and scale their income.
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT PANEL: The Login Card (Exact Chaise Style) */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-zinc-50 dark:bg-black relative">
        
        {/* Mobile Logo Only (Floating) */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
           <img src={logoSrc} alt="CoLab" className="w-8 h-8 object-contain" />
           <span className="font-bold text-xl">CoLab</span>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-[#121212] rounded-[40px] shadow-2xl border border-zinc-200 dark:border-zinc-800 p-8 sm:p-12">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="text-center mb-10">
              {/* Logo inside card matches reference */}
              <img src={logoSrc} alt="CoLab" className="h-10 mx-auto mb-6 object-contain" />
              <h2 className="text-4xl font-bold text-black dark:text-white tracking-tight mb-2">Welcome back!</h2>
              <p className="text-zinc-500 text-sm font-medium">Login with your email</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Mail size={18} className="text-zinc-400 group-focus-within:text-[#9cf822] transition-colors" />
                  </div>
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-[#f0f4f8] dark:bg-zinc-900/50 border border-transparent focus:border-[#9cf822] rounded-[22px] py-4.5 pl-13 pr-4 text-sm focus:outline-none transition-all placeholder:text-zinc-400" 
                    placeholder="Enter email address" 
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Password</label>
                  <Link href="/forgot-password" className="text-xs font-bold text-orange-400 dark:text-[#9cf822] hover:underline transition-all">
                    Forgot Password ?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Lock size={18} className="text-zinc-400 group-focus-within:text-[#9cf822] transition-colors" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-[#f0f4f8] dark:bg-zinc-900/50 border border-transparent focus:border-[#9cf822] rounded-[22px] py-4.5 pl-13 pr-14 text-sm focus:outline-none transition-all placeholder:text-zinc-400" 
                    placeholder="Enter Password" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute inset-y-0 right-0 pr-6 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center animate-shake">
                  {error}
                </div>
              )}

              {/* Action Button */}
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-[#9cf822] hover:bg-[#8ae01b] active:scale-[0.98] disabled:bg-zinc-200 text-black font-extrabold py-5 rounded-[22px] transition-all shadow-xl shadow-[#9cf822]/20 mt-4 flex items-center justify-center gap-2 text-lg"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : 'Login'}
              </button>

              {/* Bottom Navigation */}
              <p className="text-center text-zinc-500 text-sm font-medium pt-4">
                Don't have an account? <Link href="/signup" className="font-bold text-orange-400 dark:text-[#9cf822] hover:underline transition-all">Register</Link>
              </p>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}