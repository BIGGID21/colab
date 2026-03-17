'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, Mail, ArrowRight, Sparkles, CheckCircle2, BadgeCheck } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SignupPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => setMounted(true), []);

  // Initialize the Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. FUNCTIONAL: Google Signup
  const handleGoogleSignup = async () => {
    setOauthLoading('google');
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    
    if (authError) {
      setError(authError.message);
      setOauthLoading(null);
    }
  };

  // 2. FUNCTIONAL: GitHub Signup
  const handleGitHubSignup = async () => {
    setOauthLoading('github');
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    
    if (authError) {
      setError(authError.message);
      setOauthLoading(null);
    }
  };

  // 3. FUNCTIONAL: Email Magic Link Signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true, // Specifically tells Supabase to create a new user
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
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

        {/* Floating Element 1 - Top Left (Steve) */}
        <div className="absolute top-12 xl:top-[15%] left-4 xl:left-[10%] scale-75 xl:scale-100 origin-top-left animate-[bounce_6s_infinite] bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 z-10">
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

        {/* Floating Element 2 - Top Right (New Hire) */}
        <div className="absolute top-32 xl:top-[25%] right-4 xl:right-[5%] scale-75 xl:scale-100 origin-top-right animate-[bounce_7s_infinite_reverse] bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 z-10">
           <div className="pr-2 text-right">
            <p className="text-xs text-zinc-500 font-medium leading-tight mb-0.5">Just hired a</p>
            <p className="text-sm font-bold text-black dark:text-white leading-tight">Brilliant Developer!</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
            <img src="https://i.pravatar.cc/150?u=9" alt="user" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Floating Element 3 - Bottom Left (Amara) */}
        <div className="absolute bottom-28 xl:bottom-[22%] left-4 xl:left-[6%] scale-75 xl:scale-100 origin-bottom-left animate-[bounce_9s_infinite] bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden">
            <img src="https://i.pravatar.cc/150?u=12" alt="user" className="w-full h-full object-cover" />
          </div>
          <div className="pr-2">
            <p className="text-sm font-bold text-black dark:text-white leading-tight flex items-center gap-1">
              Amara D. <BadgeCheck size={14} fill="#9cf822" className="text-white dark:text-zinc-900" />
            </p>
            <div className="flex items-center gap-1 text-zinc-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">
               UI/UX Designer
            </div>
          </div>
        </div>

        {/* Floating Element 4 - Bottom Right (6 Figure Review) */}
        <div className="absolute bottom-12 xl:bottom-[12%] right-4 xl:right-[10%] scale-75 xl:scale-100 origin-bottom-right animate-[bounce_8s_infinite_reverse] bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 z-10">
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
          
          <p className="text-zinc-500 dark:text-zinc-400 mt-8 text-lg leading-relaxed max-w-md bg-[#F9F9F8]/80 dark:bg-[#0a0a0a]/80 backdrop-blur-sm rounded-xl p-2">
            Join the ecosystem where top-tier professionals collaborate, launch projects, and scale their income.
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT PANEL: The Signup Form */}
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
            <h2 className="text-3xl font-bold text-black dark:text-white mb-3">Create an account</h2>
            <div className="flex items-center justify-center lg:justify-start gap-4">
               <span className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1 lg:hidden"></span>
               <p className="text-zinc-500 dark:text-zinc-400 text-sm">Join CoLab Studio today</p>
               <span className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1 lg:max-w-[100px]"></span>
            </div>
          </div>

          {success ? (
            <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-6 text-center animate-in zoom-in duration-300">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">Check your email</h3>
              <p className="text-green-600 dark:text-green-500/80 text-sm">
                We sent a secure sign-up link to <span className="font-bold">{email}</span>. Click the link to instantly create your account.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="mt-6 text-sm font-bold text-green-700 dark:text-green-400 hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Magic Link Form */}
              <form onSubmit={handleEmailSignup} className="space-y-5">
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

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || oauthLoading !== null}
                  className="w-full flex items-center justify-center gap-2 bg-[#9cf822] hover:bg-[#8ae01b] text-black font-bold py-3.5 rounded-xl transition-all disabled:opacity-70"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : (
                    <>Send Magic Link <ArrowRight size={18} /></>
                  )}
                </button>
              </form>

              {/* OR Divider */}
              <div className="relative py-2 flex items-center">
                <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                <span className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">OR</span>
                <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              </div>

              {/* Social Signup Buttons */}
              <div className="space-y-3">
                <button 
                  onClick={handleGoogleSignup}
                  disabled={loading || oauthLoading !== null}
                  className="w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-[#161616] border border-zinc-200 dark:border-zinc-800/50 rounded-xl text-black dark:text-zinc-300 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {oauthLoading === 'google' ? (
                    <Loader2 size={18} className="animate-spin text-zinc-400" />
                  ) : (
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={18} alt="Google" />
                  )}
                  Sign up with Google
                </button>
                
                <button 
                  onClick={handleGitHubSignup}
                  disabled={loading || oauthLoading !== null}
                  className="w-full flex items-center justify-center gap-3 py-3.5 bg-zinc-900 text-white dark:bg-white dark:text-black rounded-xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {oauthLoading === 'github' ? (
                    <Loader2 size={18} className="animate-spin text-zinc-400" />
                  ) : (
                    <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" width={18} alt="GitHub" className="dark:invert" />
                  )}
                  Sign up with GitHub
                </button>
              </div>

              <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm mt-8">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-black dark:text-white hover:text-[#9cf822] dark:hover:text-[#9cf822] transition-colors">
                  Login here
                </Link>
              </p>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}