'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Wallet, ArrowUpRight, ArrowDownRight, Clock, 
  ShieldCheck, FileText, Download, Building, 
  CheckCircle2, AlertCircle, ChevronRight, Share2, PlusCircle, X,
  Plus, Loader2, Shield, Lock, Delete, Fingerprint, ArrowLeft
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
        setIsLoading(false);
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
  // RENDER: LOADING
  // ==========================================
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 size={32} className="animate-spin text-zinc-400" /></div>;
  }

  // ==========================================
  // RENDER: SECURITY LOCK SCREEN
  // ==========================================
  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F2F2F7] dark:bg-black text-black dark:text-white px-6 animate-in slide-in-from-bottom-4 duration-300">
        <button onClick={() => router.back()} className="absolute top-12 left-6 text-[#007AFF] font-medium flex items-center gap-1">
          <ArrowLeft size={20} /> Back
        </button>
        
        {/* NEW: Wrapper with negative margin to pull everything up beautifully */}
        <div className="flex flex-col items-center w-full max-w-[280px] -mt-20">
          <div className="w-16 h-16 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-6">
            {isSettingUp ? <Shield size={28} className="text-[#007AFF]" /> : <Lock size={28} className="text-black dark:text-white" />}
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {isSettingUp ? (setupStep === 'create' ? 'Create Wallet PIN' : 'Confirm Wallet PIN') : 'Enter Wallet PIN'}
          </h1>
          <p className="text-zinc-500 text-sm mb-12 text-center">
            {isSettingUp ? 'This 4-digit PIN will secure your funds and escrow contracts.' : 'Your wallet automatically locks after 5 minutes of inactivity.'}
          </p>

          <div className={`flex gap-4 mb-10 ${errorShake ? 'animate-shake' : ''}`}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                  enteredPin.length > i ? 'bg-black border-black dark:bg-white dark:border-white scale-110' : 'bg-transparent border-zinc-300 dark:border-zinc-700'
                }`} 
              />
            ))}
          </div>

          <div className="w-full grid grid-cols-3 gap-x-6 gap-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button key={num} onClick={() => handleNumberClick(num.toString())} className="w-20 h-20 rounded-full bg-white dark:bg-[#1C1C1E] text-3xl font-normal shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors mx-auto flex items-center justify-center border border-zinc-100 dark:border-zinc-800/50">
                {num}
            </button>
            ))}
            <div className="w-20 h-20 mx-auto flex items-center justify-center">
              {!isSettingUp && <Fingerprint size={32} className="text-[#007AFF] opacity-80" />}
            </div>
            <button onClick={() => handleNumberClick('0')} className="w-20 h-20 rounded-full bg-white dark:bg-[#1C1C1E] text-3xl font-normal shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors mx-auto flex items-center justify-center border border-zinc-100 dark:border-zinc-800/50">0</button>
            <button onClick={() => setEnteredPin(prev => prev.slice(0, -1))} className="w-20 h-20 mx-auto flex items-center justify-center text-zinc-600 dark:text-zinc-400 active:text-black dark:active:text-white transition-colors">
              {enteredPin.length > 0 ? <Delete size={28} /> : null}
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
      
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
        <button onClick={handleExportCSV} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium text-sm rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors w-full md:w-auto border border-zinc-200 dark:border-zinc-800">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Available Balance Card */}
        <div className="bg-zinc-900 text-white rounded-[2rem] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl border border-zinc-800 min-h-[260px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#9cf822] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Wallet size={16} className="text-[#9cf822]" /> Available Balance
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl lg:text-5xl font-bold tracking-tight">{balanceParts.dollars}</span>
              <span className="text-lg text-zinc-500 font-medium">{balanceParts.cents}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 relative z-10">
            <button onClick={() => setIsFundModalOpen(true)} className="bg-[#9cf822] text-black font-bold py-3.5 rounded-xl hover:bg-[#8be01d] transition-colors flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]">
              <Plus size={18} /> Fund
            </button>
            <button onClick={() => setIsWithdrawModalOpen(true)} className="bg-zinc-800 text-white font-bold py-3.5 rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 border border-zinc-700 hover:scale-[1.02] active:scale-[0.98]">
              <Building size={18} /> Withdraw
            </button>
          </div>
        </div>

        {/* In Escrow Card */}
        <div className="bg-white dark:bg-[#121212] rounded-[2rem] p-6 md:p-8 flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-500" /> In Escrow
              </span>
              <div className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-full">Secured</div>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">{escrowParts.dollars}</span>
              <span className="text-lg text-zinc-400 font-medium">{escrowParts.cents}</span>
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Locked across active projects.</p>
          </div>
          <div className="mt-8 flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
            <Clock size={16} className="text-zinc-400 shrink-0" />
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Releases automatically upon sign-off.</p>
          </div>
        </div>

        {/* Collective Equity Card */}
        <div className="bg-white dark:bg-[#121212] rounded-[2rem] p-6 md:p-8 flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 shadow-sm group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <Share2 size={16} className="text-purple-500" /> Percentage Shares
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">{contracts.length}</span>
              <span className="text-lg text-zinc-400 font-medium ml-1">Active</span>
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Revenue-generating collective contracts.</p>
          </div>
          <div className="mt-8 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-zinc-500">Total All-Time Yield</span>
              <span className="text-green-600 dark:text-[#9cf822]">+{formatCurrency(totalYield)}</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-1/4 rounded-full"></div>
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
              <button onClick={() => setShowAllTx(!showAllTx)} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                {showAllTx ? 'View less' : 'View all'}
              </button>
            )}
          </div>
          
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] overflow-hidden shadow-sm">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {displayedTransactions.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">No transactions yet. Complete a project to see funds here.</div>
              ) : (
                displayedTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        tx.type === 'credit' || tx.type === 'royalty' ? 'bg-green-100 dark:bg-[#9cf822]/10 text-green-600 dark:text-[#9cf822]' : 
                        tx.type === 'withdrawal' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' : 
                        'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}>
                        {tx.type === 'withdrawal' ? <ArrowDownRight size={18} /> : tx.type === 'escrow' ? <ShieldCheck size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{tx.title}</p>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">{tx.project} • {new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600 dark:text-[#9cf822]' : 'text-zinc-900 dark:text-white'}`}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </span>
                      <div className="flex items-center gap-1">
                        {tx.status === 'completed' ? (
                          <><CheckCircle2 size={12} className="text-zinc-400" /><span className="text-[10px] font-medium text-zinc-500 uppercase">Settled</span></>
                        ) : (
                          <><AlertCircle size={12} className="text-orange-500" /><span className="text-[10px] font-medium text-orange-500 uppercase">Pending</span></>
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
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase rounded-full tracking-wider">Smart</span>
          </div>
          
          <div className="space-y-4">
            {contracts.length === 0 ? (
               <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] p-8 text-center shadow-sm">
                 <Share2 size={32} className="text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                 <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">No active contracts yet.</p>
               </div>
            ) : (
              contracts.map((contract) => (
                <div key={contract.id} className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] p-5 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <FileText size={16} className="text-zinc-500 dark:text-zinc-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[150px]">{contract.project}</h4>
                        <p className="text-xs text-zinc-500 font-medium capitalize">{contract.role}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Contract Type</p>
                      <p className="text-sm font-bold text-purple-600 dark:text-purple-400 leading-none">{contract.share}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Next Payout</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white leading-none">{contract.nextPayout}</p>
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
          <div className="relative bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] w-full max-w-md p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Fund Wallet</h2>
              <button onClick={() => !isProcessing && setIsFundModalOpen(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Deposit Amount</label>
                <div className="relative mt-2 group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400 group-focus-within:text-[#9cf822]">₦</div>
                  <input type="number" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} placeholder="5,000" className="w-full bg-[#f0f4f8] dark:bg-zinc-900 border border-transparent focus:border-[#9cf822] rounded-2xl py-4.5 pl-10 pr-4 text-xl font-bold text-zinc-900 dark:text-white focus:outline-none transition-all"/>
                </div>
                {error && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{error}</p>}
                <p className="text-[10px] text-zinc-400 mt-2 ml-1 uppercase tracking-widest font-bold">Secure checkout via Paystack</p>
              </div>
              <button onClick={handleFundWallet} disabled={isProcessing || !fundAmount} className="w-full py-4.5 bg-[#9cf822] text-black font-extrabold rounded-2xl hover:bg-[#8be01d] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-[#9cf822]/20">
                {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <>Fund Account <ArrowUpRight size={18} /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- WITHDRAWAL MODAL --- */}
      {isWithdrawModalOpen && !isLinkBankModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isProcessing && setIsWithdrawModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] w-full max-w-md p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Withdraw Funds</h2>
              <button onClick={() => !isProcessing && setIsWithdrawModalOpen(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-zinc-500 dark:text-zinc-400">Available to withdraw</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{formatCurrency(balance)}</span>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400">₦</div>
                  <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#f0f4f8] dark:bg-zinc-900 border border-transparent focus:border-[#9cf822] rounded-2xl py-4.5 pl-10 pr-20 text-xl font-bold text-zinc-900 dark:text-white focus:outline-none transition-all appearance-none"/>
                  <button onClick={() => setWithdrawAmount(balance.toString())} className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">MAX</button>
                </div>
                {withdrawError && <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-bold"><AlertCircle size={14} /> {withdrawError}</p>}
              </div>

              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white mb-2 ml-1">Transfer to</p>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {linkedBanks.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic p-2">No banks linked yet.</p>
                  ) : (
                    linkedBanks.map((bank) => (
                      <label key={bank.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${selectedBankId === bank.id ? 'bg-[#9cf822]/5 border-[#9cf822]/30' : 'bg-white dark:bg-[#121212] border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}>
                        <input type="radio" name="bank" value={bank.id} checked={selectedBankId === bank.id} onChange={() => setSelectedBankId(bank.id)} className="w-4 h-4 accent-[#9cf822]"/>
                        <Building size={20} className={selectedBankId === bank.id ? "text-[#9cf822]" : "text-zinc-400"} />
                        <div>
                          <p className={`text-sm font-bold ${selectedBankId === bank.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-900 dark:text-white'}`}>{bank.bank_name}</p>
                          <p className={`text-xs font-medium mt-0.5 ${selectedBankId === bank.id ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                            Ending in •••• {bank.account_number?.slice(-4) || 'XXXX'}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                  
                  <button onClick={() => { setIsWithdrawModalOpen(false); setIsLinkBankModalOpen(true); }} className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                    <PlusCircle size={16} /> Link new bank account
                  </button>
                </div>
              </div>

              <button onClick={executeWithdrawal} disabled={isProcessing || !withdrawAmount || !selectedBankId} className="w-full py-4.5 bg-black dark:bg-white text-white dark:text-black font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isProcessing ? <Loader2 size={24} className="animate-spin" /> : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LINK NEW BANK MODAL --- */}
      {isLinkBankModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isProcessing && setIsLinkBankModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] w-full max-w-md p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Link Bank Account</h2>
              <button onClick={() => { if (!isProcessing) { setIsLinkBankModalOpen(false); setIsWithdrawModalOpen(true); } }} className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleLinkNewBank} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2 ml-1">Select Bank</label>
                <select value={newBankName} onChange={(e) => setNewBankName(e.target.value)} className="w-full bg-[#f0f4f8] dark:bg-zinc-900 border border-transparent focus:border-[#9cf822] rounded-2xl p-4 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none appearance-none">
                  <option value="Access Bank">Access Bank</option>
                  <option value="Guaranty Trust Bank">Guaranty Trust Bank (GTB)</option>
                  <option value="Zenith Bank">Zenith Bank</option>
                  <option value="United Bank for Africa">United Bank for Africa (UBA)</option>
                  <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                  <option value="Kuda Bank">Kuda Bank</option>
                  <option value="Opay">Opay</option>
                  <option value="Moniepoint">Moniepoint</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2 ml-1">Account Number</label>
                <input type="text" maxLength={10} value={newAccountNumber} onChange={(e) => setNewAccountNumber(e.target.value.replace(/\D/g, ''))} placeholder="0000000000" className="w-full bg-[#f0f4f8] dark:bg-zinc-900 border border-transparent focus:border-[#9cf822] rounded-2xl p-4 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none" required />
              </div>

              <div className="bg-[#9cf822]/5 p-4 rounded-xl flex gap-3 mt-2 border border-[#9cf822]/10">
                <ShieldCheck size={20} className="text-[#9cf822] shrink-0" />
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Your account information is securely encrypted. We use this solely to route your payouts.</p>
              </div>

              <button type="submit" disabled={isProcessing || newAccountNumber.length < 10} className="w-full py-4.5 bg-black dark:bg-white text-white dark:text-black font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4">
                {isProcessing ? <Loader2 size={24} className="animate-spin" /> : 'Verify and Link Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}