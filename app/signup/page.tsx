'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SignupPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Step Management
  const [step, setStep] = useState<'form' | 'otp'>('form');
  
  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // OTP State
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  // Timer for OTP countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          country: country,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setStep('otp');
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      router.push(`/profile/${data.user.id}?setupProfile=true`);
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

  const isFormValid = firstName && lastName && email && password && confirmPassword && agreeTerms;

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-[#0a0a0a] font-sans">
      
      {/* LEFT PANEL: Immersive Image (Top on Mobile, Left on Desktop) */}
      <div className="relative w-full lg:w-[45%] h-[35vh] lg:h-auto lg:m-4 lg:rounded-[2.5rem] rounded-b-[2.5rem] overflow-hidden shrink-0 shadow-2xl">
        <img 
          src="/image1.jpg" 
          alt="Exploring new frontiers" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 lg:to-transparent" />
        
        <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
          <div className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
            {/* Using a white version of your logo or forcing it white */}
            <img src="/white.png" className="w-8 h-8 object-contain" alt="CoLab Logo" />
            CoLab
          </div>
          <div className="mb-2 lg:mb-8">
            <h1 className="text-white text-3xl lg:text-5xl font-bold leading-[1.15] tracking-tight max-w-sm">
              Exploring new frontiers, one step at a Time.
            </h1>
            <p className="hidden lg:block text-white/80 mt-4 text-sm font-medium">
              Productivity multiplied.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: The Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
        
        {/* Desktop Top-Right Login Link */}
        <div className="hidden lg:block absolute top-10 right-12 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
          Already a member? <Link href="/login" className="text-black dark:text-white font-bold hover:underline ml-1">Sign in ↗</Link>
        </div>

        <div className="w-full max-w-[440px]">
          {step === 'form' ? (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-3xl font-bold text-black dark:text-white mb-6 tracking-tight">Create Account</h2>
              
              {/* Social Login Button */}
              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-3 bg-[#f4f4f5] dark:bg-zinc-900 border border-transparent dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-black dark:text-white font-bold py-3.5 px-6 rounded-full transition-all mb-8 disabled:opacity-50"
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
                    Sign up with Google
                  </>
                )}
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800"></div>
                <span className="text-xs text-zinc-500 font-medium tracking-wide">Or signup using your email address</span>
                <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800"></div>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-black dark:text-zinc-300 ml-2 mb-1.5">First Name</label>
                    <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-[#f4f4f5] dark:bg-zinc-900 border-none rounded-full py-3.5 px-5 text-base focus:outline-none focus:ring-2 focus:ring-[#9cf822]/50 placeholder:text-zinc-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-black dark:text-zinc-300 ml-2 mb-1.5">Last Name</label>
                    <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-[#f4f4f5] dark:bg-zinc-900 border-none rounded-full py-3.5 px-5 text-base focus:outline-none focus:ring-2 focus:ring-[#9cf822]/50 placeholder:text-zinc-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-black dark:text-zinc-300 ml-2 mb-1.5">Email or Phone no.</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#f4f4f5] dark:bg-zinc-900 border-none rounded-full py-3.5 px-5 text-base focus:outline-none focus:ring-2 focus:ring-[#9cf822]/50 placeholder:text-zinc-400" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black dark:text-zinc-300 ml-2 mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#f4f4f5] dark:bg-zinc-900 border-none rounded-full py-3.5 pl-5 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-[#9cf822]/50 placeholder:text-zinc-400" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-5 flex items-center text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-black dark:text-zinc-300 ml-2 mb-1.5">Confirm Password</label>
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-[#f4f4f5] dark:bg-zinc-900 border-none rounded-full py-3.5 px-5 text-base focus:outline-none focus:ring-2 focus:ring-[#9cf822]/50 placeholder:text-zinc-400" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black dark:text-zinc-300 ml-2 mb-1.5">Country</label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-[#f4f4f5] dark:bg-zinc-900 border-none rounded-full py-3.5 px-5 text-base focus:outline-none focus:ring-2 focus:ring-[#9cf822]/50 appearance-none">
                    <option value="Nigeria">Nigeria</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-4 ml-1">
                  <input type="checkbox" required checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="accent-[#110f1e] dark:accent-[#9cf822] w-4 h-4 cursor-pointer" />
                  <span className="text-xs text-zinc-500 font-medium">
                    I agree to all <Link href="/terms" className="font-bold underline text-black dark:text-white hover:text-[#9cf822]">terms</Link> and <Link href="/privacy" className="font-bold underline text-black dark:text-white hover:text-[#9cf822]">Privacy Policy</Link>
                  </span>
                </div>

                {error && <p className="text-red-500 text-xs font-bold text-center mt-2">{error}</p>}

                <button type="submit" disabled={!isFormValid || loading || googleLoading} className="w-full bg-[#110f1e] dark:bg-white hover:opacity-90 active:scale-[0.98] disabled:bg-zinc-300 disabled:dark:bg-zinc-800 text-white dark:text-black font-bold py-4 rounded-full transition-all mt-6 flex items-center justify-center gap-2 text-base">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign up'}
                </button>

                <p className="lg:hidden text-center text-zinc-500 text-sm font-medium mt-8">
                  Already a member? <Link href="/login" className="font-bold text-black dark:text-white hover:text-[#9cf822] underline">Sign in</Link>
                </p>
              </form>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-8 duration-500 text-center py-10">
              <div className="w-20 h-20 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-[#110f1e] dark:text-white" size={36} />
              </div>
              <h2 className="text-3xl font-bold text-black dark:text-white mb-2 tracking-tight">Verify Email</h2>
              <p className="text-zinc-500 text-sm mb-10">We sent a 6-digit code to <br/><span className="font-bold text-black dark:text-white">{email}</span></p>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value.slice(0, 6))} className="w-full bg-[#f4f4f5] dark:bg-zinc-900 border-none text-center tracking-[0.5em] font-mono text-2xl rounded-full py-4 focus:outline-none focus:ring-2 focus:ring-[#110f1e] dark:focus:ring-white" placeholder="000000" />
                <button type="submit" disabled={otp.length !== 6 || loading} className="w-full bg-[#110f1e] dark:bg-white text-white dark:text-black font-bold py-4 rounded-full hover:opacity-90 transition-opacity">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Code'}
                </button>
                <div className="text-sm font-bold text-zinc-400 pt-4">
                  {timer > 0 ? `Resend in ${timer}s` : <button type="button" onClick={() => setTimer(60)} className="text-black dark:text-white underline hover:text-[#9cf822]">Resend Code</button>}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}