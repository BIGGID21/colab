'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr'; // Fixed import for functionality

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Logic for Google Signup
  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) alert(error.message);
  };

  // 2. Logic for GitHub Signup
  const handleGitHubSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) alert(error.message);
  };

  // 3. Logic for "Next" Button (Magic Link Signup)
  const handleEmailSignup = async () => {
    if (!email) return alert("Please enter an email");
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true, // Specifically tells Supabase to create a new user
      },
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Verification link sent! Check your inbox to complete signup.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] rounded-[32px] border border-zinc-900 flex flex-col md:flex-row overflow-hidden max-w-4xl w-full min-h-[480px]">
        
        {/* Left Side: Brand Area */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-zinc-900/50">
          <Image src="/icon.png" alt="Logo" width={42} height={42} className="mb-6 opacity-90" />
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Sign Up</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">Join CoLab Studio and <br/>start building today.</p>
        </div>

        {/* Right Side: Form Area */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-[#0d0d0d] flex flex-col justify-center">
          <div className="space-y-6 w-full max-w-xs mx-auto">
            
            {/* Input + Next Button */}
            <div className="relative">
              <input 
                type="email" 
                placeholder="Email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:border-[#9cf822] outline-none text-white text-sm"
              />
              <button 
                onClick={handleEmailSignup}
                disabled={loading}
                className="absolute right-2 top-2 px-4 py-1.5 bg-[#9cf822] text-black rounded-lg text-xs font-black hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? '...' : 'Next'}
              </button>
            </div>

            {/* Link back to Sign In */}
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest px-1">
              <span className="text-zinc-600">Already a creator?</span>
              <Link href="/login" className="text-[#9cf822] hover:text-white transition-colors cursor-pointer">
                Sign In
              </Link>
            </div>

            {/* Visual Separator */}
            <div className="relative py-2 flex items-center">
              <div className="flex-grow border-t border-zinc-900"></div>
              <span className="px-3 text-[9px] font-black text-zinc-700 uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t border-zinc-900"></div>
            </div>

            {/* Social Options */}
            <div className="space-y-3">
              <button 
                onClick={handleGoogleSignup}
                className="w-full flex items-center justify-center gap-3 py-3 bg-[#161616] border border-zinc-800/50 rounded-xl text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-all"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={16} alt="G" />
                Sign up with Google
              </button>
              
              <button 
                onClick={handleGitHubSignup}
                className="w-full flex items-center justify-center gap-3 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all"
              >
                <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" width={16} alt="GH" className="invert" />
                Sign up with GitHub
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}