'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
// REMOVED: import { PaystackButton } from 'react-paystack'; 
import { useTheme } from 'next-themes';
import { 
  Loader2, ArrowLeft, Users, Target, Zap, 
  MessageSquare, Layout, Shield, FileText, 
  CheckCircle2, Circle, Clock, Percent, Plus, 
  X, Send, User, Compass, TrendingUp, 
  Briefcase, Code, PencilRuler, Upload, 
  Link as LinkIcon, ExternalLink,
  Wallet, Lock, DollarSign, CreditCard,
  Trash2, Maximize2, Sun, Moon
} from 'lucide-react';
import Link from 'next/link';

const ChatWallpaper = () => {
  const icons = [Target, Zap, Layout, FileText, Users, Compass, TrendingUp, Briefcase, Code, PencilRuler];
  return (
    <div className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.08] overflow-hidden select-none z-0">
      <div className="flex flex-wrap gap-12 p-8 justify-around items-center h-full w-full rotate-[-12deg] scale-125">
        {Array.from({ length: 40 }).map((_, i) => {
          const Icon = icons[i % icons.length];
          return <Icon key={i} size={32} strokeWidth={1.5} />;
        })}
      </div>
    </div>
  );
};

export default function WorkspacePage({ params }: { params: any }) {
  // Fix for the params type error
  const resolvedParams = React.use(params) as { id: string };
  const projectId = resolvedParams.id;
  const router = useRouter();
  
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<any>(null);
  const [isChatUploading, setIsChatUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(pattern);
  };

  useEffect(() => {
    setMounted(true);
    
    // Inject Paystack Script if missing
    if (!document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
    }

    async function fetchWorkspaceData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return router.push('/login');
      setUser(authUser);

      const { data: projectData } = await supabase.from('projects').select('*, profiles:user_id(full_name, avatar_url)').eq('id', projectId).single();
      if (!projectData) return router.push('/dashboard');

      const founderStatus = projectData.user_id === authUser.id;
      setIsFounder(founderStatus);

      const { data: collaborators } = await supabase.from('collaborations').select('*, profiles:user_id(full_name, avatar_url)').eq('project_id', projectId).eq('status', 'accepted');
      const { data: milestoneData } = await supabase.from('milestones').select('*').eq('project_id', projectId).order('id', { ascending: true });
      const { data: msgData } = await supabase.from('messages').select('*, profiles:user_id(full_name, avatar_url)').eq('project_id', projectId).order('created_at', { ascending: true });

      setProject(projectData);
      setTeam(collaborators || []);
      setMilestones(milestoneData || []);
      setMessages(msgData || []);
      setLoading(false);
    }

    fetchWorkspaceData();
  }, [projectId, supabase, router]);

  // FIXED: Manual Paystack Trigger
  const handlePayment = (amount: number, milestoneId: string) => {
    if (!user) return;
    setIsProcessing(true);

    // @ts-ignore
    if (typeof window.PaystackPop === 'undefined') {
      alert("Paystack is still loading...");
      setIsProcessing(false);
      return;
    }

    // @ts-ignore
    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: amount * 100 * 1500, // Conversion logic
      currency: 'NGN',
      callback: async (response: any) => {
        const { error } = await supabase.from('milestones').update({ 
          payment_status: 'escrow_funded', 
          payment_reference: response.reference 
        }).eq('id', milestoneId);
        
        if (!error) {
          setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, payment_status: 'escrow_funded' } : m));
          triggerHaptic([10, 50, 10]);
        }
        setIsProcessing(false);
      },
      onClose: () => setIsProcessing(false)
    });
    handler.openIframe();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><Loader2 className="animate-spin text-[#9cf822]" /></div>;

  const totalBudget = project?.budget || 2500;

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 pb-20 overflow-x-hidden text-left">
      <header className="bg-white dark:bg-[#0a0a0a] border-b border-zinc-200 dark:border-zinc-900 px-6 py-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 text-zinc-500"><ArrowLeft size={20} /></Link>
            <h1 className="text-xl font-bold text-black dark:text-white">{project.title}</h1>
          </div>
          <button onClick={() => setIsChatOpen(true)} className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-bold hover:opacity-80 transition-opacity">
            <MessageSquare size={14} className="inline mr-2" /> Team Chat
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <section>
            <h2 className="text-lg font-bold text-black dark:text-white mb-6 flex items-center gap-2"><Target size={20} className="text-[#9cf822]" /> Roadmap</h2>
            <div className="space-y-4">
              {milestones.map((m) => {
                const mockPrice = m.price || (totalBudget / (milestones.length || 1)).toFixed(0);
                const isFunded = m.payment_status === 'escrow_funded'; 
                return (
                  <div key={m.id} className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 text-left">
                    <div className="flex justify-between items-center gap-6">
                      <div className="flex gap-4">
                        <div className="mt-1">
                          {m.status === 'completed' ? <CheckCircle2 className="text-[#9cf822]" size={22} /> : <Circle className="text-zinc-300 dark:text-zinc-700" size={22} />}
                        </div>
                        <div>
                          <h4 className="font-bold text-black dark:text-white leading-tight">{m.title}</h4>
                          <p className="text-sm text-zinc-500 mt-1">{m.description}</p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isFounder && !isFunded && m.status !== 'completed' && (
                           <button 
                             disabled={isProcessing}
                             onClick={() => handlePayment(Number(mockPrice), m.id)}
                             className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50"
                           >
                             {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={14} />} 
                             Deposit ${mockPrice}
                           </button>
                        )}
                        {isFunded && (
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full"><Lock size={10}/> Escrowed</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4">
          <section className="bg-black text-white dark:bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-left"><Wallet size={20} className="text-[#9cf822]" /> Budget</h2>
            <p className="text-3xl font-bold text-left">${totalBudget.toLocaleString()}</p>
          </section>
        </div>
      </div>
    </div>
  );
}