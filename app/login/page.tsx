'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (googleError) {
      setError(googleError.message);
      setGoogleLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans text-black">
      
      {/* LEFT PANEL: Immersive Image (Top on Mobile, Left on Desktop) */}
      <div className="relative w-full lg:w-[45%] h-[35vh] lg:h-auto lg:m-4 lg:rounded-[2.5rem] rounded-b-[2.5rem] overflow-hidden shrink-0 shadow-xl">
        <img 
          src="/image1.jpg" 
          alt="CoLab - Elite Professional Ecosystem" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 lg:to-transparent" />
        
        <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
          <div className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
            <img src="/white.png" className="w-8 h-8 object-contain" alt="CoLab Logo" />
            CoLab
          </div>
          <div className="mb-2 lg:mb-8">
            <h1 className="text-white text-3xl lg:text-5xl font-bold leading-[1.15] tracking-tight max-w-sm">
              Welcome back to the network.
            </h1>
            <p className="hidden lg:block text-white/80 mt-4 text-base font-medium max-w-sm leading-relaxed">
              Log in to collaborate, launch projects, and scale your income with top-tier professionals.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: The Form (Strictly White Background) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative bg-white">
        
        {/* Desktop Top-Right Register Link */}
        <div className="hidden lg:block absolute top-10 right-12 text-sm text-zinc-500 font-medium">
          Don't have an account? <Link href="/signup" className="text-black font-bold hover:text-[#9cf822] transition-colors ml-1">Register ↗</Link>
        </div>

        <div className="w-full max-w-[440px]">
          <div className="animate-in fade-in duration-500">
            {/* Left-aligned header for all devices */}
            <div className="mb-10 text-left">
              <h2 className="text-3xl font-black text-black mb-2 tracking-tight">Sign in</h2>
              <p className="text-zinc-500 text-sm font-medium">Welcome back! Please enter your details.</p>
            </div>

            {/* Social Login Button */}
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-zinc-200 hover:bg-[#f8f9fa] text-black font-bold py-3.5 px-6 rounded-full transition-all mb-8 disabled:opacity-50 text-sm"
            >
              {googleLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Log in with Google
                </>
              )}
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 border-t border-zinc-100"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Or log in with email</span>
              <div className="flex-1 border-t border-zinc-100"></div>
            </div>

            {/* Input Fields using subtle gray (#f8f9fa) background */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 ml-3 mb-2">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full bg-[#f8f9fa] border border-zinc-200 rounded-full py-3.5 px-5 text-base text-black focus:outline-none focus:ring-2 focus:ring-[#9cf822]/50 focus:border-[#9cf822] placeholder:text-zinc-400 transition-all" 
                  placeholder="name@company.com" 
                />
              </div>

              <div>
                <div className="flex justify-between items-center ml-3 mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500">Password</label>
                  <Link href="/forgot-password" className="text-[11px] font-bold text-black hover:text-[#9cf822] transition-all mr-1">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-[#f8f9fa] border border-zinc-200 rounded-full py-3.5 pl-5 pr-12 text-base text-black focus:outline-none focus:ring-2 focus:ring-[#9cf822]/50 focus:border-[#9cf822] placeholder:text-zinc-400 transition-all" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-zinc-400 hover:text-black transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-xs font-bold text-center animate-shake mt-4">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || googleLoading} 
                className="w-full bg-black hover:bg-zinc-800 active:scale-[0.98] disabled:bg-zinc-300 text-white font-black uppercase tracking-wider py-4 rounded-full transition-all mt-8 flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Log In'}
              </button>

              {/* Visible on all devices, placed at the bottom */}
              <p className="text-center text-zinc-500 text-sm font-medium mt-8">
                Don't have an account? <Link href="/signup" className="font-bold text-black hover:text-[#9cf822] transition-colors">Register</Link>
              </p>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}