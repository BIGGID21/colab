'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
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

    if (data.user) {
      // === NEW: FIRE THE WELCOME EMAIL HERE ===
      try {
        await fetch('/api/welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: email, 
            name: firstName // Personalizing the email with their first name
          })
        });
      } catch (emailError) {
        console.error("Failed to send welcome email, but user verified successfully:", emailError);
        // We don't block the UI if the email fails. They still get to login!
      }
      // ========================================

      // UPDATED: Push to the new full-screen Onboarding experience!
      router.push('/onboarding');
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setTimer(60); // Reset UI timer
    
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (resendError) {
      setError(resendError.message);
    }
  };

  if (!mounted) return null;

  const isFormValid = firstName && lastName && email && password && confirmPassword && agreeTerms;

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
            <img src="/logo2.png" className="w-8 h-8 object-contain" alt="CoLab Logo" />
            CoLab
          </div>
          <div className="mb-2 lg:mb-8">
            <h1 className="text-white text-3xl lg:text-5xl font-bold leading-[1.15] tracking-tight max-w-sm">
              The ecosystem for elite professionals.
            </h1>
            <p className="hidden lg:block text-white/80 mt-4 text-base font-medium max-w-sm leading-relaxed">
              Join the platform where top-tier talent collaborates, launches projects, and scales their income.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: The Form (Strictly White Background) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative bg-white">
        
        <div className="w-full max-w-[440px]">
          {step === 'form' ? (
            <div className="animate-in fade-in duration-500">
              <div className="mb-10 text-left">
                <h2 className="text-3xl font-black text-black mb-2 tracking-tight">Create Account</h2>
                <p className="text-zinc-500 text-sm font-medium">Join the next generation of professional collaboration.</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 ml-3 mb-2">First Name</label>
                    <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-[#f8f9fa] border border-zinc-200 rounded-full py-3.5 px-5 text-base text-black focus:outline-none focus:ring-2 focus:ring-[#9cf822]/50 focus:border-[#9cf822] placeholder:text-zinc-400 transition-all" placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 ml-3 mb-2">Last Name</label>
                    <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-[#f8f9fa] border border-zinc-200 rounded-full py-3.5 px-5 text-base text-black focus:outline-none focus:ring-2 focus:ring-[#9cf822]/50 focus:border-[#9cf822] placeholder:text-zinc-400 transition-all" placeholder="Doe" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 ml-3 mb-2">Email Address</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#f8f9fa] border border-zinc-200 rounded-full py-3.5 px-5 text-base text-black focus:outline-none focus:ring-2 focus:ring-[#9cf822]/50 focus:border-[#9cf822] placeholder:text-zinc-400 transition-all" placeholder="name@company.com" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 ml-3 mb-2">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#f8f9fa] border border-zinc-200 rounded-full py-3.5 pl-5 pr-12 text-base text-black focus:outline-none focus:ring-2 focus:ring-[#9cf822]/50 focus:border-[#9cf822] placeholder:text-zinc-400 transition-all" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-5 flex items-center text-zinc-400 hover:text-black transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 ml-3 mb-2">Confirm Password</label>
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-[#f8f9fa] border border-zinc-200 rounded-full py-3.5 px-5 text-base text-black focus:outline-none focus:ring-2 focus:ring-[#9cf822]/50 focus:border-[#9cf822] placeholder:text-zinc-400 transition-all" placeholder="••••••••" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 ml-3 mb-2">Location</label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-[#f8f9fa] border border-zinc-200 rounded-full py-3.5 px-5 text-base text-black focus:outline-none focus:ring-2 focus:ring-[#9cf822]/50 focus:border-[#9cf822] appearance-none transition-all">
                    <option value="Nigeria">Nigeria</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-4 ml-2">
                  <input type="checkbox" required checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="accent-black w-4 h-4 cursor-pointer" />
                  <span className="text-xs text-zinc-500 font-medium">
                    I agree to the <Link href="/terms" className="font-bold text-black hover:text-[#9cf822] transition-colors">Terms of Service</Link> and <Link href="/privacy" className="font-bold text-black hover:text-[#9cf822] transition-colors">Privacy Policy</Link>
                  </span>
                </div>

                {error && <p className="text-red-500 text-xs font-bold text-center mt-4 bg-red-50 py-2 rounded-lg border border-red-100">{error}</p>}

                <button type="submit" disabled={!isFormValid || loading} className="w-full bg-black hover:bg-zinc-800 active:scale-[0.98] disabled:bg-zinc-300 text-white font-black uppercase tracking-wider py-4 rounded-full transition-all mt-8 flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Join CoLab'}
                </button>

                <p className="text-center text-zinc-500 text-sm font-medium mt-8">
                  Already a member? <Link href="/login" className="font-bold text-black hover:text-[#9cf822] transition-colors">Sign in</Link>
                </p>
              </form>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-8 duration-500 text-center py-10">
              <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-black" size={36} />
              </div>
              <h2 className="text-3xl font-black text-black mb-2 tracking-tight">Verify Email</h2>
              <p className="text-zinc-500 text-sm mb-10">We sent a 6-digit code to <br/><span className="font-bold text-black">{email}</span></p>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value.slice(0, 6))} className="w-full bg-[#f8f9fa] border border-zinc-200 text-center tracking-[0.5em] font-mono text-2xl rounded-full py-4 focus:outline-none focus:ring-2 focus:ring-black transition-all" placeholder="000000" />
                
                {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg border border-red-100">{error}</p>}

                <button type="submit" disabled={otp.length !== 6 || loading} className="w-full bg-black text-white font-black uppercase tracking-wider py-4 rounded-full hover:bg-zinc-800 transition-colors text-sm disabled:bg-zinc-300">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Code'}
                </button>
                <div className="text-sm font-bold text-zinc-400 pt-4">
                  {timer > 0 ? (
                    `Resend in ${timer}s` 
                  ) : (
                    <button type="button" onClick={handleResendCode} className="text-black hover:text-[#9cf822] transition-colors">
                      Resend Code
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}