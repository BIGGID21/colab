'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
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
  const [agreePromos, setAgreePromos] = useState(false);
  
  // OTP State
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    if (!agreeTerms) {
      setError("You must agree to the Terms and Privacy Policy");
      return;
    }

    setLoading(true);

    // Register the user with Supabase
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

    // Move to OTP step
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

    // Success! Route them to their new profile setup
    if (data.user) {
      router.push(`/profile?setupProfile=true`);
    }
  };

  const logoSrc = mounted && resolvedTheme === 'dark' ? '/white.png' : '/logo.png';
  const isFormValid = firstName && lastName && email && password && confirmPassword && country && agreeTerms;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#0a0a0a] font-sans p-4">
      
      <div className="w-full max-w-lg bg-white dark:bg-[#121212] rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8 sm:p-10 overflow-hidden relative">
        
        {/* Logo Header (Matches Chaise OTP screen style) */}
        <div className="flex justify-center mb-10">
          <div className="h-8 flex items-center justify-center">
             {mounted && <img src={logoSrc} alt="CoLab" className="h-full object-contain" />}
          </div>
        </div>

        {/* ========================================= */}
        {/* STEP 1: REGISTRATION FORM */}
        {/* ========================================= */}
        {step === 'form' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
               <span className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></span>
               <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Register with your email</p>
               <span className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></span>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              
              {/* Name Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">First Name</label>
                  <input
                    type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-transparent border border-zinc-300 dark:border-zinc-700 focus:border-[#9cf822] dark:focus:border-[#9cf822] text-black dark:text-white rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors placeholder:text-zinc-400"
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Last Name</label>
                  <input
                    type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-transparent border border-zinc-300 dark:border-zinc-700 focus:border-[#9cf822] dark:focus:border-[#9cf822] text-black dark:text-white rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors placeholder:text-zinc-400"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Address</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border border-zinc-300 dark:border-zinc-700 focus:border-[#9cf822] dark:focus:border-[#9cf822] text-black dark:text-white rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors placeholder:text-zinc-400"
                  placeholder="Enter email address"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border border-zinc-300 dark:border-zinc-700 focus:border-[#9cf822] dark:focus:border-[#9cf822] text-black dark:text-white rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none transition-colors placeholder:text-zinc-400"
                    placeholder="Enter Password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Re-enter password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-transparent border border-zinc-300 dark:border-zinc-700 focus:border-[#9cf822] dark:focus:border-[#9cf822] text-black dark:text-white rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none transition-colors placeholder:text-zinc-400"
                    placeholder="Re-enter Password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Country */}
              <div className="space-y-1.5 pb-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Country</label>
                <select 
                  value={country} onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-transparent border border-zinc-300 dark:border-zinc-700 focus:border-[#9cf822] dark:focus:border-[#9cf822] text-black dark:text-white rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors appearance-none"
                >
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="mt-0.5 w-4 h-4 rounded border border-zinc-300 dark:border-zinc-600 flex items-center justify-center group-hover:border-[#9cf822] transition-colors">
                    <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="hidden" />
                    {agreeTerms && <div className="w-2.5 h-2.5 rounded-sm bg-[#9cf822]"></div>}
                  </div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    I've read and agree to CoLab <Link href="/terms" className="text-[#9cf822] hover:underline">Terms</Link> and <Link href="/privacy" className="text-[#9cf822] hover:underline">Privacy</Link> Policy
                  </span>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="mt-0.5 w-4 h-4 rounded border border-zinc-300 dark:border-zinc-600 flex items-center justify-center group-hover:border-[#9cf822] transition-colors">
                    <input type="checkbox" checked={agreePromos} onChange={(e) => setAgreePromos(e.target.checked)} className="hidden" />
                    {agreePromos && <div className="w-2.5 h-2.5 rounded-sm bg-[#9cf822]"></div>}
                  </div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    I'd like to receive CoLab updates and promotions
                  </span>
                </label>
              </div>

              {error && (
                <div className="text-red-500 text-sm font-medium text-center">{error}</div>
              )}

              {/* Register Button */}
              <button
                type="submit"
                disabled={!isFormValid || loading}
                className="w-full flex items-center justify-center gap-2 bg-[#9cf822] hover:bg-[#8ae01b] disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-black font-bold py-3.5 rounded-xl transition-all mt-4"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Register'}
              </button>

              <p className="text-center text-zinc-600 dark:text-zinc-400 text-sm mt-6">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-[#9cf822] hover:underline">
                  Log in
                </Link>
              </p>
            </form>
          </div>
        )}

        {/* ========================================= */}
        {/* STEP 2: OTP VERIFICATION */}
        {/* ========================================= */}
        {step === 'otp' && (
          <div className="animate-in slide-in-from-right-8 duration-500 text-center">
            <h2 className="text-3xl font-bold text-black dark:text-white mb-2">Please check your email.</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">
              We've sent an OTP to <br />
              <span className="font-medium text-black dark:text-white">{email}</span>
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-6 text-left">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Enter OTP</label>
                <input
                  type="text" required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-transparent border border-zinc-300 dark:border-zinc-700 focus:border-[#9cf822] dark:focus:border-[#9cf822] text-black dark:text-white text-center tracking-[0.5em] font-mono text-lg rounded-xl py-3 px-4 focus:outline-none transition-colors"
                  placeholder="------"
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm font-medium text-center">{error}</div>
              )}

              <button
                type="submit"
                disabled={otp.length !== 6 || loading}
                className="w-full flex items-center justify-center gap-2 bg-[#9cf822] hover:bg-[#8ae01b] disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-black font-bold py-3.5 rounded-xl transition-all"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm'}
              </button>
            </form>

            <div className="mt-8 text-center">
              {timer > 0 ? (
                <p className="font-bold text-zinc-500">0:{timer.toString().padStart(2, '0')}</p>
              ) : (
                <button 
                  onClick={() => { setTimer(60); /* Logic to resend OTP goes here */ }} 
                  className="text-sm font-bold text-[#9cf822] hover:underline"
                >
                  Resend Code
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}