'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Wallet, ArrowUpRight, ArrowDownRight, Clock, 
  ShieldCheck, FileText, Download, Building, 
  CheckCircle2, AlertCircle, ChevronRight, Share2, PlusCircle, X,
  Plus, Loader2, Shield, Lock, Delete, Fingerprint, ArrowLeft,
  Coins, Vault
} from 'lucide-react';

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function WalletPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- Real-Time DB State ---
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState(0); 
  const [escrow, setEscrow] = useState(0);
  const [totalYield, setTotalYield] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [linkedBanks, setLinkedBanks] = useState<any[]>([]);
  const [showAllTx, setShowAllTx] = useState(false);

  // --- Security / PIN State ---
  const [isLocked, setIsLocked] = useState(true);
  const [hasPinSetup, setHasPinSetup] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [tempPin, setTempPin] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);

  // --- Modal State ---
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isLinkBankModalOpen, setIsLinkBankModalOpen] = useState(false);
  
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [fundAmount, setFundAmount] = useState<string>('');
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  // --- New Bank Form State ---
  const [newBankName, setNewBankName] = useState('Access Bank');
  const [newAccountNumber, setNewAccountNumber] = useState('');

  // ==========================================
  // DATA FETCHING & SECURITY INIT
  // ==========================================
  useEffect(() => {
    const initWallet = async () => {
      try {
        const { data: { user: activeUser } } = await supabase.auth.getUser();
        if (!activeUser) {
          router.push('/login');
          return;
        }
        setUser(activeUser);

        // 1. PIN Security Check
        const savedPin = localStorage.getItem(`colab_pin_${activeUser.id}`);
        if (!savedPin) {
          setHasPinSetup(false);
          setIsSettingUp(true);
          setIsLocked(true);
        } else {
          setHasPinSetup(true);
          const lastAccess = localStorage.getItem(`colab_last_access_${activeUser.id}`);
          if (lastAccess && (Date.now() - parseInt(lastAccess, 10) < LOCK_TIMEOUT_MS)) {
            setIsLocked(false);
          } else {
            setIsLocked(true);
          }
        }

        // 2. Fetch Wallet Balances
        const { data: walletData } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', activeUser.id)
          .single();

        if (walletData) {
          setBalance(Number(walletData.balance || 0));
          setEscrow(Number(walletData.escrow_balance || 0));
          setTotalYield(Number(walletData.total_yield || 0));
        }

        // 3. Fetch Transactions
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', activeUser.id)
          .order('created_at', { ascending: false });
        if (txs) setTransactions(txs);

        // 4. Fetch Linked Banks
        const { data: banks } = await supabase
          .from('linked_accounts')
          .select('*')
          .eq('user_id', activeUser.id);
        if (banks && banks.length > 0) {
          setLinkedBanks(banks);
          setSelectedBankId(banks[0].id);
        }

       // 5. Fetch Active Contracts (Collaborations that are accepted)
        const { data: collabs } = await supabase
          .from('collaborations')
          .select('id, role, status, projects(title)')
          .eq('user_id', activeUser.id)
          .eq('status', 'accepted');
        
        if (collabs) {
          const formattedContracts = collabs.map((c: any) => {
            const projectData = Array.isArray(c.projects) ? c.projects[0] : c.projects;
            
            return {
              id: c.id,
              project: projectData?.title || 'Unknown Project',
              role: c.role,
              share: 'Equity / Fiat', 
              nextPayout: 'Milestone based'
            };
          });
          setContracts(formattedContracts);
        }

      } catch (error) {
        console.error('Error fetching wallet data:', error);
      } finally {
        // Simulate a slight delay so the beautiful skeleton shows!
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    initWallet();
  }, [supabase, router]);

  // Keep Session Alive while Unlocked
  useEffect(() => {
    if (!isLocked && user) {
      const interval = setInterval(() => {
        localStorage.setItem(`colab_last_access_${user.id}`, Date.now().toString());
      }, 30000); // Update every 30 secs
      return () => clearInterval(interval);
    }
  }, [isLocked, user]);

  // ==========================================
  // PIN PAD LOGIC
  // ==========================================
  const handleNumberClick = (num: string) => {
    if (enteredPin.length < 4) {
      const newPin = enteredPin + num;
      setEnteredPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => processPin(newPin), 150);
      }
    }
  };

  const processPin = (submitPin: string) => {
    if (!user) return;

    if (isSettingUp) {
      if (setupStep === 'create') {
        setTempPin(submitPin);
        setEnteredPin('');
        setSetupStep('confirm');
      } else {
        if (submitPin === tempPin) {
          localStorage.setItem(`colab_pin_${user.id}`, submitPin);
          unlockWallet();
        } else {
          triggerError();
          setEnteredPin('');
          setSetupStep('create');
        }
      }
    } else {
      const savedPin = localStorage.getItem(`colab_pin_${user.id}`);
      if (submitPin === savedPin) {
        unlockWallet();
      } else {
        triggerError();
      }
    }
  };

  const unlockWallet = () => {
    if(user) localStorage.setItem(`colab_last_access_${user.id}`, Date.now().toString());
    setIsLocked(false);
    setIsSettingUp(false);
  };

  const triggerError = () => {
    setErrorShake(true);
    setEnteredPin('');
    setTimeout(() => setErrorShake(false), 500);
  };

  // ==========================================
  // FUNCTIONAL ACTIONS (DB WRITES)
  // ==========================================
  const handleFundWallet = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, amount: parseFloat(fundAmount), userId: user?.id }),
      });
      const data = await response.json();
      if (data.status && data.data.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        setError(data.message || "Failed to initialize payment");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);
    setWithdrawError('');

    if (isNaN(amount) || amount <= 0) return setWithdrawError('Enter a valid amount.');
    if (amount > balance) return setWithdrawError('Insufficient funds.');
    if (!selectedBankId) return setWithdrawError('Select a receiving bank.');

    setIsProcessing(true);
    const selectedBank = linkedBanks.find(b => b.id === selectedBankId);

    try {
      // 1. Insert Transaction Record
      const { data: newTx, error: txError } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'withdrawal',
        title: 'Withdrawal to Bank',
        project: `Ending in **${selectedBank.account_number?.slice(-4) || 'XXXX'}`,
        amount: -Math.abs(amount),
        status: 'pending' // Pending until admin/cron job approves
      }).select().single();

      if (txError) throw txError;

      // 2. Deduct from Wallet Balance
      const newBalance = balance - amount;
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      if (walletError) throw walletError;

      // Update UI
      setBalance(newBalance);
      setTransactions([newTx, ...transactions]);
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      alert(`Success! ${formatCurrency(amount)} withdrawal initiated to ${selectedBank.bank_name}.`);
    } catch (err: any) {
      setWithdrawError(err.message || 'Failed to process withdrawal.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLinkNewBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const { data: newBank, error } = await supabase.from('linked_accounts').insert({
        user_id: user.id,
        bank_name: newBankName,
        account_number: newAccountNumber,
        account_name: user.user_metadata?.full_name || 'Verified User'
      }).select().single();

      if (error) throw error;

      setLinkedBanks([...linkedBanks, newBank]);
      setSelectedBankId(newBank.id);
      setIsLinkBankModalOpen(false);
      setNewAccountNumber('');
      setIsWithdrawModalOpen(true);
    } catch (err: any) {
      console.error(err);
      alert("Failed to link bank account. " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['ID', 'Type', 'Title', 'Project', 'Amount', 'Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(tx => `"${tx.id}","${tx.type}","${tx.title}","${tx.project}","${tx.amount}","${new Date(tx.created_at).toLocaleDateString()}","${tx.status}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'colab_transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Utility Formatting ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(amount || 0);
  };

  const getAmountParts = (amount: number) => {
    const formatted = formatCurrency(amount);
    const [main, cents] = formatted.split('.');
    return { dollars: main, cents: cents ? `.${cents}` : '.00' };
  };

  const balanceParts = getAmountParts(balance);
  const escrowParts = getAmountParts(escrow);
  const displayedTransactions = showAllTx ? transactions : transactions.slice(0, 4);

  // ==========================================
  // RENDER: LOADING SKELETON (MATCHING NEW UI)
  // ==========================================
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="w-48 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse"></div>
            <div className="w-64 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse"></div>
          </div>
          <div className="w-32 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-[280px] bg-zinc-200 dark:bg-zinc-800 rounded-[2rem] animate-pulse"></div>
          <div className="h-[280px] bg-zinc-200 dark:bg-zinc-800 rounded-[2rem] animate-pulse"></div>
          <div className="h-[280px] bg-zinc-200 dark:bg-zinc-800 rounded-[2rem] animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
             <div className="w-48 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse mb-4"></div>
             <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-[1.5rem] animate-pulse"></div>
          </div>
          <div className="space-y-4">
             <div className="w-32 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse mb-4"></div>
             <div className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-[1.5rem] animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: SECURITY LOCK SCREEN
  // ==========================================
  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F2F2F7] dark:bg-black text-black dark:text-white px-4 animate-in slide-in-from-bottom-4 duration-300">
        <button onClick={() => router.back()} className="absolute top-12 left-6 text-[#007AFF] font-medium flex items-center gap-1">
          <ArrowLeft size={20} /> Back
        </button>
        
        {/* Adjusted to guarantee everything fits without cutoffs on smaller phones */}
        <div className="flex flex-col items-center w-full max-w-[300px] -mt-10">
          <div className="w-16 h-16 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-6">
            {isSettingUp ? <Shield size={28} className="text-[#007AFF]" /> : <Lock size={28} className="text-black dark:text-white" />}
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {isSettingUp ? (setupStep === 'create' ? 'Create Wallet PIN' : 'Confirm Wallet PIN') : 'Enter Wallet PIN'}
          </h1>
          <p className="text-zinc-500 text-sm mb-10 text-center px-4">
            {isSettingUp ? 'This 4-digit PIN secures your funds.' : 'Wallet automatically locked for security.'}
          </p>

          <div className={`flex gap-5 mb-12 ${errorShake ? 'animate-shake' : ''}`}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                  enteredPin.length > i ? 'bg-[#9cf822] border-[#9cf822] scale-125 shadow-[0_0_10px_rgba(156,248,34,0.5)]' : 'bg-transparent border-zinc-300 dark:border-zinc-700'
                }`} 
              />
            ))}
          </div>

          {/* Keypad Grid */}
          <div className="w-full grid grid-cols-3 gap-x-6 gap-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button key={num} onClick={() => handleNumberClick(num.toString())} className="w-20 h-20 rounded-full bg-white dark:bg-[#1C1C1E] text-3xl font-medium shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all mx-auto flex items-center justify-center border border-zinc-100 dark:border-zinc-800/50">
                {num}
            </button>
            ))}
            
            {/* Bottom Row */}
            <div className="w-20 h-20 mx-auto flex items-center justify-center">
              {!isSettingUp && <Fingerprint size={32} className="text-[#007AFF] opacity-80" />}
            </div>
            <button onClick={() => handleNumberClick('0')} className="w-20 h-20 rounded-full bg-white dark:bg-[#1C1C1E] text-3xl font-medium shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all mx-auto flex items-center justify-center border border-zinc-100 dark:border-zinc-800/50">0</button>
            
            {/* DELETE BUTTON FIXED: Text + Icon so it's unmistakably obvious */}
            <button onClick={() => setEnteredPin(prev => prev.slice(0, -1))} className="w-20 h-20 mx-auto flex flex-col items-center justify-center text-zinc-600 dark:text-zinc-400 active:scale-95 transition-all">
              {enteredPin.length > 0 && (
                <>
                  <Delete size={28} className="mb-1 text-black dark:text-white" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">Del</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes shake { 0%, 100% { transform: translateX(0); } 25%, 75% { transform: translateX(-10px); } 50% { transform: translateX(10px); } }
          .animate-shake { animation: shake 0.4s ease-in-out; }
        `}</style>
      </div>
    );
  }

  // ==========================================
  // RENDER: MAIN WALLET
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 relative pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Terminal 
            <button onClick={() => { localStorage.setItem(`colab_last_access_${user?.id}`, '0'); setIsLocked(true); }} className="ml-2 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-full text-zinc-400 hover:text-black dark:hover:text-white transition-colors" title="Lock Wallet">
              <Lock size={16} />
            </button>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1 text-sm md:text-base">Manage your execution payouts, escrowed funds, and equity.</p>
        </div>
        <button onClick={handleExportCSV} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold text-sm rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors w-full md:w-auto border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* NEW: PREMIUM METRICS GRID (Matching UI Screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Main Balance Card (Dark Theme Style) */}
        <div className="bg-[#1C1C1E] text-white rounded-[2rem] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-800 min-h-[280px]">
          {/* Subtle Background Glow/Gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#9cf822] opacity-10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Wallet size={16} className="text-[#9cf822]" /> Available Balance
              </span>
              <span className="px-2.5 py-1 bg-[#9cf822]/10 text-[#9cf822] text-[10px] font-bold uppercase tracking-wider rounded-full border border-[#9cf822]/20">Active</span>
            </div>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-black tracking-tight">{balanceParts.dollars}</span>
              <span className="text-xl text-zinc-500 font-medium">{balanceParts.cents}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <button onClick={() => setIsFundModalOpen(true)} className="bg-[#9cf822] text-black font-extrabold py-3.5 rounded-xl hover:bg-[#8be01d] transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]">
              <Plus size={18} /> Fund
            </button>
            <button onClick={() => setIsWithdrawModalOpen(true)} className="bg-zinc-800 text-white font-bold py-3.5 rounded-xl hover:bg-zinc-700 transition-all flex items-center justify-center gap-2 border border-zinc-700 hover:scale-[1.02] active:scale-[0.98]">
              <Building size={18} /> Withdraw
            </button>
          </div>
        </div>

        {/* 2. Escrow Card (Light Theme Style with Vault Icon) */}
        <div className="bg-[#f8f9fa] dark:bg-[#121212] rounded-[2rem] p-6 md:p-8 flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden min-h-[280px]">
           {/* Background Vault Illustration */}
          <Vault size={160} className="absolute -bottom-10 -right-10 text-zinc-200 dark:text-zinc-900/50 opacity-50 rotate-[-15deg]" strokeWidth={1} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-2 uppercase tracking-wider">
                 In Escrow
              </span>
              <ShieldCheck size={20} className="text-[#007AFF]" />
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{escrowParts.dollars}</span>
              <span className="text-lg text-zinc-400 font-medium">{escrowParts.cents}</span>
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Locked across active project milestones.</p>
          </div>

          <div className="relative z-10 mt-8 flex items-center justify-between p-4 bg-white dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <Clock size={14} className="text-blue-500" />
              </div>
              <p className="text-xs text-zinc-900 dark:text-zinc-300 font-bold">Auto-Release</p>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">On Approval</span>
          </div>
        </div>

        {/* 3. Yield / Equity Card (Gradient Style) */}
        <div className="bg-gradient-to-br from-[#fdfbfb] to-[#ebedee] dark:from-[#1a1a1a] dark:to-[#0a0a0a] rounded-[2rem] p-6 md:p-8 flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group min-h-[280px]">
          {/* Background Coins Illustration */}
          <Coins size={140} className="absolute -top-10 -right-6 text-zinc-200 dark:text-zinc-800 opacity-40 rotate-[15deg] group-hover:scale-110 transition-transform duration-700" strokeWidth={1} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-2 uppercase tracking-wider">
                Equity Yield
              </span>
              <Share2 size={18} className="text-purple-500" />
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{contracts.length}</span>
              <span className="text-lg text-zinc-400 font-medium ml-1">Active</span>
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Revenue-generating collective contracts.</p>
          </div>
          
          <div className="relative z-10 mt-8 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-500">Total All-Time Yield</span>
              <span className="text-green-600 dark:text-[#9cf822] text-sm">+{formatCurrency(totalYield)}</span>
            </div>
            <div className="w-full h-2 bg-white dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 w-1/3 rounded-full"></div>
            </div>
          </div>
        </div>

      </div>

      {/* TWO COLUMN LAYOUT FOR TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        
        {/* Left Column: Transaction Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Transaction Ledger</h3>
            {transactions.length > 4 && (
              <button onClick={() => setShowAllTx(!showAllTx)} className="text-sm font-bold text-[#007AFF] hover:text-blue-600 transition-colors">
                {showAllTx ? 'View Less' : 'View All'}
              </button>
            )}
          </div>
          
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] overflow-hidden shadow-sm">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {displayedTransactions.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center">
                   <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                      <FileText size={24} className="text-zinc-400" />
                   </div>
                   <p className="text-zinc-900 dark:text-white font-bold mb-1">No Transactions Yet</p>
                   <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs mx-auto">Complete a project milestone or fund your wallet to see activity here.</p>
                </div>
              ) : (
                displayedTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors cursor-default">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                        tx.type === 'credit' || tx.type === 'royalty' ? 'bg-green-50 dark:bg-[#9cf822]/10 text-green-600 dark:text-[#9cf822] border-green-100 dark:border-[#9cf822]/20' : 
                        tx.type === 'withdrawal' ? 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700' : 
                        'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20'
                      }`}>
                        {tx.type === 'withdrawal' ? <ArrowDownRight size={20} /> : tx.type === 'escrow' ? <ShieldCheck size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{tx.title}</p>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">{tx.project} • {new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className={`text-sm font-black tracking-tight ${tx.amount > 0 ? 'text-green-600 dark:text-[#9cf822]' : 'text-zinc-900 dark:text-white'}`}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </span>
                      <div className="flex items-center gap-1">
                        {tx.status === 'completed' ? (
                          <><CheckCircle2 size={12} className="text-zinc-400" /><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Settled</span></>
                        ) : (
                          <><AlertCircle size={12} className="text-[#FF9500]" /><span className="text-[10px] font-bold text-[#FF9500] uppercase tracking-wider">Pending</span></>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Contracts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Active Contracts</h3>
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase rounded-full tracking-wider border border-purple-200 dark:border-purple-500/20">Smart</span>
          </div>
          
          <div className="space-y-4">
            {contracts.length === 0 ? (
               <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] p-10 text-center shadow-sm">
                 <div className="w-16 h-16 bg-purple-50 dark:bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Share2 size={24} className="text-purple-400" />
                 </div>
                 <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold">No Active Contracts</p>
               </div>
            ) : (
              contracts.map((contract) => (
                <div key={contract.id} className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center border border-purple-100 dark:border-purple-500/20">
                        <FileText size={18} className="text-purple-500 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[160px]">{contract.project}</h4>
                        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{contract.role}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center group-hover:bg-[#9cf822] transition-colors">
                      <ChevronRight size={16} className="text-zinc-400 group-hover:text-black transition-colors" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Contract Type</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-white leading-none">{contract.share}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Next Payout</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white leading-none">{contract.nextPayout}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- FUND WALLET MODAL --- */}
      {isFundModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isProcessing && setIsFundModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] w-full max-w-md p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Fund Wallet</h2>
              <button onClick={() => !isProcessing && setIsFundModalOpen(false)} className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Deposit Amount</label>
                <div className="relative mt-2 group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400 group-focus-within:text-[#007AFF] transition-colors">₦</div>
                  <input type="number" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} placeholder="5,000" className="w-full bg-[#f8f9fa] dark:bg-black border border-zinc-200 dark:border-zinc-800 focus:border-[#007AFF] dark:focus:border-[#007AFF] rounded-2xl py-5 pl-12 pr-4 text-2xl font-black text-zinc-900 dark:text-white focus:outline-none transition-all shadow-sm"/>
                </div>
                {error && <p className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1"><AlertCircle size={14}/>{error}</p>}
                <div className="flex items-center gap-2 mt-3 ml-1">
                   <ShieldCheck size={14} className="text-green-500" />
                   <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Secure checkout via Paystack</p>
                </div>
              </div>
              <button onClick={handleFundWallet} disabled={isProcessing || !fundAmount} className="w-full py-5 bg-black dark:bg-white text-white dark:text-black font-extrabold text-lg rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] shadow-lg mt-8">
                {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <>Continue to Payment <ArrowUpRight size={20} /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- WITHDRAWAL MODAL --- */}
      {isWithdrawModalOpen && !isLinkBankModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isProcessing && setIsWithdrawModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] w-full max-w-md p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Withdraw Funds</h2>
              <button onClick={() => !isProcessing && setIsWithdrawModalOpen(false)} className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Available</span>
                  <span className="font-black text-[#9cf822] bg-[#9cf822]/10 px-2.5 py-1 rounded-lg text-sm">{formatCurrency(balance)}</span>
                </div>
                <div className="relative group mt-2">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">₦</div>
                  <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#f8f9fa] dark:bg-black border border-zinc-200 dark:border-zinc-800 focus:border-black dark:focus:border-white rounded-2xl py-5 pl-12 pr-20 text-2xl font-black text-zinc-900 dark:text-white focus:outline-none transition-all appearance-none shadow-sm"/>
                  <button onClick={() => setWithdrawAmount(balance.toString())} className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-black dark:bg-white text-xs font-black text-white dark:text-black rounded-xl hover:scale-105 active:scale-95 transition-all">MAX</button>
                </div>
                {withdrawError && <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-bold ml-1"><AlertCircle size={14} /> {withdrawError}</p>}
              </div>

              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 ml-1">Transfer Destination</p>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {linkedBanks.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                       <p className="text-sm text-zinc-500 font-medium">No banks linked yet.</p>
                    </div>
                  ) : (
                    linkedBanks.map((bank) => (
                      <label key={bank.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedBankId === bank.id ? 'bg-black/5 dark:bg-white/5 border-black dark:border-white shadow-sm' : 'bg-white dark:bg-[#121212] border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedBankId === bank.id ? 'border-black dark:border-white' : 'border-zinc-300 dark:border-zinc-700'}`}>
                           {selectedBankId === bank.id && <div className="w-2.5 h-2.5 bg-black dark:bg-white rounded-full"></div>}
                        </div>
                        <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center shrink-0">
                           <Building size={18} className="text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{bank.bank_name}</p>
                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                            •••• {bank.account_number?.slice(-4) || 'XXXX'}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                  
                  <button onClick={() => { setIsWithdrawModalOpen(false); setIsLinkBankModalOpen(true); }} className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-500 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
                    <PlusCircle size={18} /> Add New Bank Account
                  </button>
                </div>
              </div>

              <button onClick={executeWithdrawal} disabled={isProcessing || !withdrawAmount || !selectedBankId} className="w-full py-5 bg-[#9cf822] text-black font-extrabold text-lg rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 active:scale-[0.98] shadow-lg mt-4">
                {isProcessing ? <Loader2 size={24} className="animate-spin" /> : 'Confirm & Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LINK NEW BANK MODAL --- */}
      {isLinkBankModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isProcessing && setIsLinkBankModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] w-full max-w-md p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Link Bank Account</h2>
              <button onClick={() => { if (!isProcessing) { setIsLinkBankModalOpen(false); setIsWithdrawModalOpen(true); } }} className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white rounded-full transition-colors"><ArrowLeft size={20} /></button>
            </div>

            <form onSubmit={handleLinkNewBank} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1 block">Select Bank</label>
                <div className="relative">
                   <select value={newBankName} onChange={(e) => setNewBankName(e.target.value)} className="w-full bg-[#f8f9fa] dark:bg-black border border-zinc-200 dark:border-zinc-800 focus:border-black dark:focus:border-white rounded-2xl p-4.5 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none appearance-none transition-all shadow-sm">
                     <option value="Access Bank">Access Bank</option>
                     <option value="Guaranty Trust Bank">Guaranty Trust Bank (GTB)</option>
                     <option value="Zenith Bank">Zenith Bank</option>
                     <option value="United Bank for Africa">United Bank for Africa (UBA)</option>
                     <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                     <option value="Kuda Bank">Kuda Bank</option>
                     <option value="Opay">Opay</option>
                     <option value="Moniepoint">Moniepoint</option>
                   </select>
                   <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1 block">Account Number</label>
                <input type="text" maxLength={10} value={newAccountNumber} onChange={(e) => setNewAccountNumber(e.target.value.replace(/\D/g, ''))} placeholder="10-digit account number" className="w-full bg-[#f8f9fa] dark:bg-black border border-zinc-200 dark:border-zinc-800 focus:border-black dark:focus:border-white rounded-2xl p-4.5 text-lg font-bold text-zinc-900 dark:text-white focus:outline-none transition-all shadow-sm tracking-widest" required />
              </div>

              <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl flex gap-3 mt-4 border border-blue-100 dark:border-blue-500/20">
                <ShieldCheck size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-blue-800 dark:text-blue-300 leading-relaxed">
                  Your bank details are encrypted using bank-grade security. We only use this information to route your withdrawals.
                </p>
              </div>

              <button type="submit" disabled={isProcessing || newAccountNumber.length < 10} className="w-full py-5 bg-black dark:bg-white text-white dark:text-black font-extrabold text-lg rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 active:scale-[0.98] shadow-lg mt-8">
                {isProcessing ? <Loader2 size={24} className="animate-spin" /> : 'Verify & Link Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Needed for the select dropdown arrow
function ChevronDown(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}