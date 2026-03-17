'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Eye, EyeOff, Loader2, Sparkles, BadgeCheck, CheckCircle2, ArrowRight } from 'lucide-react';
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

    // FIXED: Redirecting to the dynamic [id] path instead of a static /profile
    if (data.user) {
      router.push(`/profile/${data.user.id}?setupProfile=true`);
    }
  };

  if (!mounted) return null;

  const logoSrc = resolvedTheme === 'dark' ? '/white.png' : '/logo.png';
  const isFormValid = firstName && lastName && email && password && confirmPassword && agreeTerms;

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-black font-sans">
      
      {/* LEFT PANEL: Branding & Graphics */}
      <div className="hidden lg:flex w-1/2 relative bg-[#F9F9F8] dark:bg-[#0a0a0a] border-r border-zinc-200 dark:border-zinc-800 flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9cf822] rounded-full blur-[150px] opacity-10 dark:opacity-5 pointer-events-none" />

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

        <div className="relative z-20 text-center max-w-lg px-8 flex flex-col items-center">
          <div className="w-16 h-16 mb-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-3">
             <img src={logoSrc} alt="CoLab" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-5xl font-bold text-zinc-900 dark:text-white leading-[1.15] tracking-tight text-center">
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

      {/* RIGHT PANEL: Signup Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-zinc-50 dark:bg-black relative">
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
           <img src={logoSrc} alt="CoLab" className="w-8 h-8 object-contain" />
           <span className="font-bold text-xl">CoLab</span>
        </div>

        <div className="w-full max-w-lg bg-white dark:bg-[#121212] rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8 sm:p-10">
          {step === 'form' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-black dark:text-white mb-2">Create Account</h2>
                <p className="text-zinc-500 text-sm">Register with your email below</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">First Name</label>
                    <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#9cf822]/20" placeholder="John" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Last Name</label>
                    <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#9cf822]/20" placeholder="Doe" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Email Address</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#9cf822]/20" placeholder="john@example.com" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#9cf822]/20" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Confirm Password</label>
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#9cf822]/20" placeholder="••••••••" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Country</label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none appearance-none">
                    <option value="Nigeria">Nigeria</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" required checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="accent-[#9cf822] w-4 h-4" />
                  <span className="text-xs text-zinc-500">
                    I agree to the <Link href="/terms" className="font-bold underline text-black dark:text-white">Terms</Link> and <Link href="/privacy" className="font-bold underline text-black dark:text-white">Privacy Policy</Link>
                  </span>
                </div>

                {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

                <button type="submit" disabled={!isFormValid || loading} className="w-full bg-[#9cf822] hover:bg-[#8ae01b] disabled:bg-zinc-200 text-black font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#9cf822]/10 mt-4 flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <>Create Account <ArrowRight size={18} /></>}
                </button>

                <p className="text-center text-zinc-500 text-sm mt-6">
                  Already have an account? <Link href="/login" className="font-bold text-black dark:text-white hover:text-[#9cf822]">Sign In</Link>
                </p>
              </form>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-8 duration-500 text-center">
              <div className="w-16 h-16 bg-[#9cf822]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-[#9cf822]" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Verify Email</h2>
              <p className="text-zinc-500 text-sm mb-8">We sent a 6-digit code to <span className="font-bold text-black dark:text-white">{email}</span></p>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value.slice(0, 6))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center tracking-[0.5em] font-mono text-2xl rounded-xl py-4 focus:outline-none focus:ring-2 focus:ring-[#9cf822]" placeholder="000000" />
                <button type="submit" disabled={otp.length !== 6 || loading} className="w-full bg-[#9cf822] text-black font-bold py-4 rounded-xl shadow-lg shadow-[#9cf822]/10">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Code'}
                </button>
                <div className="text-sm font-bold text-zinc-400">
                  {timer > 0 ? `Resend in ${timer}s` : <button type="button" onClick={() => setTimer(60)} className="text-[#9cf822]">Resend Code</button>}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}