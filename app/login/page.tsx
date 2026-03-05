'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
// CORRECT IMPORT: This fixes the "Export not found" crash
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize the Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. FUNCTIONAL: Google Login
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/discover`,
      },
    });
    if (error) alert(error.message);
  };

  // 2. FUNCTIONAL: Email "Next" Button (Magic Link)
  const handleEmailLogin = async () => {
    if (!email) return alert("Please enter your email");
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(true); // Keep loading state until redirected or error
    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      alert("Check your email for the login link!");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] rounded-[32px] border border-zinc-900 flex flex-col md:flex-row overflow-hidden max-w-4xl w-full min-h-[480px]">
        
        {/* Left Side: Brand */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-zinc-900/50">
          <Image src="/icon.png" alt="Logo" width={42} height={42} className="mb-6 opacity-90" />
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Sign In</h1>
          <p className="text-zinc-500 text-sm">Welcome back to CoLab Studio</p>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-10 bg-[#0d0d0d] flex flex-col justify-center">
          <div className="space-y-6 w-full max-w-xs mx-auto">
            
            {/* INPUT + NEXT BUTTON */}
            <div className="relative">
              <input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:border-[#9cf822] outline-none text-white text-sm"
              />
              <button 
                onClick={handleEmailLogin}
                disabled={loading}
                className="absolute right-2 top-2 px-4 py-1.5 bg-[#9cf822] text-black rounded-lg text-xs font-black hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? '...' : 'Next'}
              </button>
            </div>

            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest px-1">
              <button className="text-zinc-600 hover:text-zinc-400">Forgot email?</button>
              <Link href="/signup" className="text-[#9cf822] hover:text-white transition-colors">
                Create Account
              </Link>
            </div>

            <div className="relative py-2 flex items-center">
              <div className="flex-grow border-t border-zinc-900"></div>
              <span className="px-3 text-[9px] font-black text-zinc-700 uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t border-zinc-900"></div>
            </div>

            {/* SOCIAL BUTTONS */}
            <div className="space-y-3">
              <button 
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 bg-[#161616] border border-zinc-800/50 rounded-xl text-zinc-300 text-sm font-medium hover:bg-zinc-800"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={16} alt="G" />
                Continue with Google
              </button>
              
              <button className="w-full flex items-center justify-center gap-3 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-200">
                <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" width={16} alt="GH" className="invert" />
                Continue with GitHub
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}