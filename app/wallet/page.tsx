'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Wallet, ArrowUpRight, ArrowDownRight, Clock, 
  ShieldCheck, FileText, Download, Building, 
  CheckCircle2, AlertCircle, ChevronRight, Share2, PlusCircle, X, CreditCard
} from 'lucide-react';

// --- Fallback Mock Data ---
const FALLBACK_TRANSACTIONS = [
  { id: 'tx-1', type: 'credit', title: 'Milestone 2: UI Kit Approved', project: 'CAVIE Tech Platform', amount: 850.00, date: 'Today, 10:42 AM', status: 'completed' },
  { id: 'tx-2', type: 'withdrawal', title: 'Withdrawal to Bank', project: 'Ending in **0492', amount: -1200.00, date: 'Mar 12, 2026', status: 'completed' },
  { id: 'tx-3', type: 'escrow', title: 'Funds Locked in Escrow', project: 'CoLab Native App', amount: 2400.00, date: 'Mar 10, 2026', status: 'pending' },
  { id: 'tx-4', type: 'royalty', title: 'Revenue Share Distribution', project: 'Sankofa Lens MV', amount: 142.50, date: 'Mar 01, 2026', status: 'completed' },
];

const FALLBACK_CONTRACTS = [
  { id: 'c-1', project: 'CAVIE Tech Platform', role: 'Lead UI/UX', share: '5%', status: 'Active', nextPayout: 'Q2 2026' },
  { id: 'c-2', project: 'Sankofa Lens', role: 'Brand Identity', share: '2.5%', status: 'Generating Revenue', nextPayout: 'Monthly' },
];

// Initial mock bank
const INITIAL_BANKS = [
  { id: 'b-1', bankName: 'Guaranty Trust Bank', accountNumber: '0123450492', accountName: 'CoLab Creator' }
];

export default function WalletPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- Real-Time State ---
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState(4250.00); 
  const [escrow, setEscrow] = useState(1200.00);
  const [totalYield, setTotalYield] = useState(142.50);
  const [transactions, setTransactions] = useState<any[]>(FALLBACK_TRANSACTIONS);
  const [contracts, setContracts] = useState<any[]>(FALLBACK_CONTRACTS);
  const [linkedBanks, setLinkedBanks] = useState<any[]>(INITIAL_BANKS);
  const [showAllTx, setShowAllTx] = useState(false);

  // --- Modal State ---
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isLinkBankModalOpen, setIsLinkBankModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [selectedBankId, setSelectedBankId] = useState<string>('b-1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  // --- New Bank Form State ---
  const [newBankName, setNewBankName] = useState('Access Bank');
  const [newAccountNumber, setNewAccountNumber] = useState('');

  // --- Fetch Real-Time Data ---
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const { data: { user: activeUser } } = await supabase.auth.getUser();
        if (activeUser) {
          setUser(activeUser);
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('wallet_balance, escrow_balance, total_yield')
            .eq('id', activeUser.id)
            .single();

          if (profile) {
            if (profile.wallet_balance !== undefined) setBalance(profile.wallet_balance);
            if (profile.escrow_balance !== undefined) setEscrow(profile.escrow_balance);
            if (profile.total_yield !== undefined) setTotalYield(profile.total_yield);
          }

          const { data: txs } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', activeUser.id)
            .order('created_at', { ascending: false });
            
          if (txs && txs.length > 0) setTransactions(txs);

          const { data: activeCtrs } = await supabase
            .from('contracts')
            .select('*')
            .eq('user_id', activeUser.id);
            
          if (activeCtrs && activeCtrs.length > 0) setContracts(activeCtrs);
          
          // Fetch linked banks (assuming a 'linked_accounts' table exists)
          const { data: banks } = await supabase
            .from('linked_accounts')
            .select('*')
            .eq('user_id', activeUser.id);
            
          if (banks && banks.length > 0) {
            setLinkedBanks(banks);
            setSelectedBankId(banks[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching wallet data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, [supabase]);

  // --- Utility Functions ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // Note: Can be changed to NGN based on your payment gateway later
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getAmountParts = (amount: number) => {
    const formatted = formatCurrency(amount);
    const [dollars, cents] = formatted.split('.');
    return { dollars, cents: `.${cents}` };
  };

  const balanceParts = getAmountParts(balance);
  const escrowParts = getAmountParts(escrow);

  // --- Button Handlers ---
  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['ID', 'Type', 'Title', 'Project', 'Amount', 'Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(tx => `"${tx.id}","${tx.type}","${tx.title}","${tx.project}","${tx.amount}","${tx.date}","${tx.status}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'colab_transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeWithdrawal = () => {
    const amount = parseFloat(withdrawAmount);
    setWithdrawError('');

    if (isNaN(amount) || amount <= 0) {
      setWithdrawError('Please enter a valid amount.');
      return;
    }
    if (amount > balance) {
      setWithdrawError('Insufficient funds.');
      return;
    }
    if (!selectedBankId) {
      setWithdrawError('Please select a receiving bank account.');
      return;
    }

    setIsProcessing(true);
    const selectedBank = linkedBanks.find(b => b.id === selectedBankId);

    setTimeout(() => {
      setBalance(prev => prev - amount);
      const newTx = {
        id: `tx-new-${Date.now()}`,
        type: 'withdrawal',
        title: 'Withdrawal to Bank',
        project: `Ending in **${selectedBank.accountNumber.slice(-4)}`,
        amount: -Math.abs(amount),
        date: 'Just now',
        status: 'pending'
      };
      setTransactions([newTx, ...transactions]);
      setIsProcessing(false);
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      alert(`Success! ${formatCurrency(amount)} withdrawal initiated to ${selectedBank.bankName}.`);
    }, 1500);
  };

  const handleLinkNewBank = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate bank account verification (e.g., via Paystack API)
    setTimeout(() => {
      const newBank = {
        id: `b-${Date.now()}`,
        bankName: newBankName,
        accountNumber: newAccountNumber,
        accountName: 'Verified User'
      };
      
      setLinkedBanks([...linkedBanks, newBank]);
      setSelectedBankId(newBank.id);
      setIsProcessing(false);
      setIsLinkBankModalOpen(false);
      setNewAccountNumber('');
      setIsWithdrawModalOpen(true); // Return to withdrawal modal
    }, 1500);
  };

  const displayedTransactions = showAllTx ? transactions : transactions.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">Financial Terminal</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1 text-sm md:text-base">
            Manage your execution payouts, escrowed funds, and collective equity.
          </p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium text-sm rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors w-full md:w-auto border border-zinc-200 dark:border-zinc-800"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Available Balance Card */}
        <div className="bg-zinc-900 text-white rounded-[2rem] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl border border-zinc-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#9cf822] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Wallet size={16} className="text-[#9cf822]" /> Available Balance
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-bold tracking-tight">{balanceParts.dollars}</span>
              <span className="text-lg text-zinc-500 font-medium">{balanceParts.cents}</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsWithdrawModalOpen(true)}
            className="w-full relative z-10 bg-[#9cf822] text-black font-bold py-3.5 rounded-xl hover:bg-[#8be01d] transition-colors flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <Building size={18} /> Withdraw to Bank
          </button>
        </div>

        {/* In Escrow Card */}
        <div className="bg-white dark:bg-[#121212] rounded-[2rem] p-6 md:p-8 flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-500" /> In Escrow
              </span>
              <div className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                Secured
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">{escrowParts.dollars}</span>
              <span className="text-lg text-zinc-400 font-medium">{escrowParts.cents}</span>
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Locked across active projects.</p>
          </div>
          
          <div className="mt-8 flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
            <Clock size={16} className="text-zinc-400 shrink-0" />
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Releases automatically upon milestone sign-off.</p>
          </div>
        </div>

        {/* Collective Equity Card */}
        <div className="bg-white dark:bg-[#121212] rounded-[2rem] p-6 md:p-8 flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 shadow-sm group cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <Share2 size={16} className="text-purple-500" /> Percentage Shares
              </span>
              <ArrowUpRight size={18} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
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
              <button 
                onClick={() => setShowAllTx(!showAllTx)}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                {showAllTx ? 'View less' : 'View all'}
              </button>
            )}
          </div>
          
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] overflow-hidden shadow-sm">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {displayedTransactions.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">No transactions yet.</div>
              ) : (
                displayedTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        tx.type === 'credit' || tx.type === 'royalty' ? 'bg-green-100 dark:bg-[#9cf822]/10 text-green-600 dark:text-[#9cf822]' : 
                        tx.type === 'withdrawal' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' : 
                        'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}>
                        {tx.type === 'withdrawal' ? <ArrowDownRight size={18} /> : 
                         tx.type === 'escrow' ? <ShieldCheck size={18} /> : 
                         <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{tx.title}</p>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">{tx.project} • {tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className={`text-sm font-bold ${
                        tx.amount > 0 ? 'text-green-600 dark:text-[#9cf822]' : 'text-zinc-900 dark:text-white'
                      }`}>
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
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{contract.project}</h4>
                        <p className="text-xs text-zinc-500 font-medium">{contract.role}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Your Share</p>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400 leading-none">{contract.share}</p>
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

      {/* --- WITHDRAWAL MODAL --- */}
      {isWithdrawModalOpen && !isLinkBankModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isProcessing && setIsWithdrawModalOpen(false)}></div>
          
          <div className="relative bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] w-full max-w-md p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Withdraw Funds</h2>
              <button 
                onClick={() => !isProcessing && setIsWithdrawModalOpen(false)}
                className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-zinc-500 dark:text-zinc-400">Available to withdraw</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{formatCurrency(balance)}</span>
                </div>
                
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-zinc-500">$</div>
                  <input 
                    type="number" 
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl py-4 pl-8 pr-20 text-xl font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9cf822] transition-shadow appearance-none"
                  />
                  <button 
                    onClick={() => setWithdrawAmount(balance.toString())}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                  >
                    MAX
                  </button>
                </div>
                {withdrawError && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle size={14} /> {withdrawError}
                  </p>
                )}
              </div>

              {/* Linked Bank Selection */}
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Transfer to</p>
                <div className="space-y-2">
                  {linkedBanks.map((bank) => (
                    <label key={bank.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${selectedBankId === bank.id ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30' : 'bg-white dark:bg-[#121212] border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}>
                      <input 
                        type="radio" 
                        name="bank_selection" 
                        value={bank.id}
                        checked={selectedBankId === bank.id}
                        onChange={() => setSelectedBankId(bank.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <Building size={20} className={selectedBankId === bank.id ? "text-blue-500" : "text-zinc-400"} />
                      <div>
                        <p className={`text-sm font-bold ${selectedBankId === bank.id ? 'text-blue-900 dark:text-blue-400' : 'text-zinc-900 dark:text-white'}`}>{bank.bankName}</p>
                        <p className={`text-xs font-medium mt-0.5 ${selectedBankId === bank.id ? 'text-blue-600 dark:text-blue-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                          Ending in •••• {bank.accountNumber.slice(-4)}
                        </p>
                      </div>
                    </label>
                  ))}
                  
                  <button 
                    onClick={() => {
                      setIsWithdrawModalOpen(false);
                      setIsLinkBankModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <PlusCircle size={16} /> Link new bank account
                  </button>
                </div>
              </div>

              <button 
                onClick={executeWithdrawal}
                disabled={isProcessing || !withdrawAmount || !selectedBankId}
                className="w-full py-4 bg-[#9cf822] text-black font-bold rounded-xl hover:bg-[#8be01d] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  'Confirm Withdrawal'
                )}
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
              <button 
                onClick={() => {
                  if (!isProcessing) {
                    setIsLinkBankModalOpen(false);
                    setIsWithdrawModalOpen(true);
                  }
                }}
                className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLinkNewBank} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2">Select Bank</label>
                <select 
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9cf822]"
                >
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
                <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2">Account Number</label>
                <input 
                  type="text" 
                  maxLength={10}
                  value={newAccountNumber}
                  onChange={(e) => setNewAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="0000000000"
                  className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9cf822]"
                  required
                />
              </div>

              <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-xl flex gap-3 mt-2">
                <ShieldCheck size={20} className="text-zinc-500 shrink-0" />
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Your account information is securely encrypted. We use this solely to route your payouts.
                </p>
              </div>

              <button 
                type="submit"
                disabled={isProcessing || newAccountNumber.length < 10}
                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify and Link Account'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}