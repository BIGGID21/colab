'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useTheme } from 'next-themes';
import { 
  Loader2, ArrowLeft, Users, Target, Zap, 
  MessageSquare, Layout, Shield, FileText, 
  CheckCircle2, Circle, Clock, Percent, Plus, 
  X, Send, User, Compass, TrendingUp, 
  Briefcase, Code, PencilRuler, Upload, 
  Link as LinkIcon, ExternalLink,
  Wallet, Lock, DollarSign, CreditCard,
  Trash2, Maximize2, Sun, Moon,
  ShieldCheck, Image as ImageIcon,
  Paperclip, ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

// ----------------------------------------------------------------------
// CHAT WALLPAPER COMPONENT
// ----------------------------------------------------------------------
const ChatWallpaper = () => {
  const icons = [Target, Zap, Layout, FileText, Users, Compass, TrendingUp, Briefcase, Code, PencilRuler];
  return (
    <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06] overflow-hidden select-none z-0">
      <div className="flex flex-wrap gap-12 p-8 justify-around items-center h-full w-full rotate-[-12deg] scale-125">
        {Array.from({ length: 40 }).map((_, i) => {
          const Icon = icons[i % icons.length];
          return <Icon key={i} size={32} strokeWidth={1.5} />;
        })}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// CURRENCY HELPER
// ----------------------------------------------------------------------
const getCurrencySymbol = (currency: string) => {
  switch (currency?.toUpperCase()) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'NGN': return '₦';
    case 'USD': 
    default: return '$';
  }
};

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();
  
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Refs for Chat
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // App State
  const [project, setProject] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // Track which milestone is processing

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<File | null>(null);
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
    
    // Inject Paystack Script
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

      // 1. Fetch Project & Check Access
      const { data: projectData, error: projError } = await supabase
        .from('projects')
        .select('*, profiles:user_id(full_name, avatar_url, role)')
        .eq('id', projectId)
        .single();
      
      if (projError || !projectData) return router.push('/dashboard');

      const isOwner = projectData.user_id === authUser.id;
      setIsFounder(isOwner);

      // 2. Fetch Team (Accepted Collaborators)
      const { data: collaborators } = await supabase
        .from('collaborations')
        .select('*, profiles:user_id(full_name, avatar_url, role)')
        .eq('project_id', projectId)
        .eq('status', 'accepted');

      // Security Access Check: If not owner and not an accepted collaborator, kick them out.
      const isTeamMember = collaborators?.some(c => c.user_id === authUser.id);
      if (!isOwner && !isTeamMember) {
        return router.push(`/project/${projectId}`); 
      }

      // 3. Fetch Milestones
      const { data: milestoneData } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('id', { ascending: true });

      // 4. Fetch Messages
      const { data: msgData } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      setProject(projectData);
      setTeam(collaborators || []);
      setMilestones(milestoneData || []);
      setMessages(msgData || []);
      setLoading(false);
    }

    fetchWorkspaceData();
  }, [projectId, supabase, router]);

  // Real-time Chat Subscription
  useEffect(() => {
    if (!isChatOpen) return;
    
    const channel = supabase.channel(`workspace_chat_${projectId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `project_id=eq.${projectId}`
      }, async (payload) => {
        // Fetch the profile for the new message
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', payload.new.user_id)
          .single();
          
        const completeMessage = { ...payload.new, profiles: profileData };
        setMessages(prev => [...prev, completeMessage]);
        
        // Auto-scroll
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, isChatOpen, supabase]);

  // Auto-scroll on initial load when opening chat
  useEffect(() => {
    if (isChatOpen && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
      }, 100);
    }
  }, [isChatOpen]);


  // ----------------------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------------------

  // Milestone Progress Handler
  const handleToggleMilestone = async (m: any) => {
    if (!isFounder) return; // Only founders can check off milestones for now
    
    triggerHaptic([10, 30]);
    const newStatus = m.status === 'completed' ? 'pending' : 'completed';
    
    // Optimistic UI
    setMilestones(prev => prev.map(milestone => milestone.id === m.id ? { ...milestone, status: newStatus } : milestone));

    await supabase.from('milestones').update({ status: newStatus }).eq('id', m.id);
  };

  // Payment Handler (Paystack)
  const handlePayment = (amount: number, milestoneId: string) => {
    if (!user) return;
    setIsProcessing(milestoneId);

    // @ts-ignore
    if (typeof window.PaystackPop === 'undefined') {
      alert("Payment gateway is still loading. Please try again in a few seconds.");
      setIsProcessing(null);
      return;
    }

    // @ts-ignore
    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: amount * 100 * 1500, // Standard NGN conversion fallback if needed
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
        setIsProcessing(null);
      },
      onClose: () => setIsProcessing(null)
    });
    handler.openIframe();
  };

  // Chat Submission Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !pendingAttachment) return;

    setIsSending(true);
    let attachmentUrl = null;

    try {
      // 1. Handle File Upload if exists
      if (pendingAttachment) {
        setIsChatUploading(true);
        const fileExt = pendingAttachment.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${projectId}/chat/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project_assets')
          .upload(filePath, pendingAttachment);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project_assets')
          .getPublicUrl(filePath);

        attachmentUrl = publicUrl;
      }

      // 2. Insert Message Record
      await supabase.from('messages').insert({
        project_id: projectId,
        user_id: user.id,
        content: newMessage.trim(),
        attachment_url: attachmentUrl,
        attachment_type: pendingAttachment?.type.includes('image') ? 'image' : 
                         pendingAttachment ? 'document' : null,
        attachment_name: pendingAttachment?.name
      });

      // Reset Input
      setNewMessage('');
      setPendingAttachment(null);
      if (chatFileInputRef.current) chatFileInputRef.current.value = '';
      
      triggerHaptic(10);

    } catch (error) {
      console.error("Message error:", error);
      alert("Failed to send message.");
    } finally {
      setIsSending(false);
      setIsChatUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPendingAttachment(e.target.files[0]);
    }
  };

  // ----------------------------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------------------------

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black"><Loader2 className="animate-spin text-[#9cf822]" /></div>;

  const totalBudget = project?.budget || project?.valuation || 0;
  const currencySymbol = getCurrencySymbol(project?.currency);
  const displayImage = project?.cover_image_url || project?.image_url;

  // Calculate Progress
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const progressPercentage = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black transition-colors duration-300 pb-20 overflow-x-hidden text-left font-sans">
      
      {/* ------------------------------------------------------------------ */}
      {/* APP HEADER */}
      {/* ------------------------------------------------------------------ */}
      <header className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-900 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={isFounder ? "/dashboard" : "/discover"} 
              className="p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors bg-zinc-100 dark:bg-zinc-900 rounded-full"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0">
                  {displayImage ? (
                    <img src={displayImage} className="w-full h-full object-cover" alt="Project" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Layout size={16} className="text-zinc-400"/></div>
                  )}
               </div>
               <div>
                  <h1 className="text-base font-bold text-black dark:text-white leading-tight">{project.title}</h1>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#5a9a00] dark:text-[#9cf822]">Workspace</span>
               </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsChatOpen(true)} 
            className="px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-black/10 dark:shadow-white/10 flex items-center gap-2"
          >
            <MessageSquare size={16} /> <span className="hidden sm:inline">Team Sync</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN CONTENT GRID */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-7xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT COLUMN: ROADMAP & DELIVERABLES */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Progress Header */}
          <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-900 rounded-[2rem] p-8 shadow-sm">
            <div className="flex justify-between items-end mb-4">
               <div>
                 <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                   <Target size={20} className="text-[#9cf822]" /> Project Roadmap
                 </h2>
                 <p className="text-sm text-zinc-500 mt-1">Track deliverables and unlock milestones.</p>
               </div>
               <div className="text-right">
                 <span className="text-3xl font-black text-black dark:text-white">{progressPercentage}%</span>
               </div>
            </div>
            <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-[#9cf822] transition-all duration-1000 ease-out" 
                 style={{ width: `${progressPercentage}%` }}
               />
            </div>
          </div>

          {/* Milestones List */}
          <div className="space-y-4">
            {milestones.length > 0 ? milestones.map((m, index) => {
              const mockPrice = m.price || (totalBudget / (milestones.length || 1)).toFixed(0);
              const isFunded = m.payment_status === 'escrow_funded'; 
              const isCompleted = m.status === 'completed';

              return (
                <div 
                  key={m.id} 
                  className={`bg-white dark:bg-[#0a0a0a] border rounded-[2rem] p-6 transition-all duration-300 ${isCompleted ? 'border-[#9cf822]/30 bg-[#9cf822]/5 shadow-sm' : 'border-zinc-200 dark:border-zinc-900'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
                    
                    <div className="flex gap-4">
                      {/* Interactive Toggle for Founders, Read-only icon for others */}
                      <button 
                        onClick={() => handleToggleMilestone(m)}
                        disabled={!isFounder}
                        className={`mt-1 shrink-0 ${isFounder ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="text-[#5a9a00] dark:text-[#9cf822] drop-shadow-md" size={28} />
                        ) : (
                          <Circle className="text-zinc-300 dark:text-zinc-700" size={28} strokeWidth={1.5} />
                        )}
                      </button>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Step 0{index + 1}</span>
                          {isFunded && <span className="bg-emerald-500/10 text-emerald-500 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1"><Lock size={8}/> Funded</span>}
                        </div>
                        <h4 className={`font-bold leading-tight ${isCompleted ? 'text-zinc-400 line-through decoration-zinc-300 dark:decoration-zinc-700' : 'text-black dark:text-white text-lg'}`}>
                          {m.title}
                        </h4>
                        <p className={`text-sm mt-1 ${isCompleted ? 'text-zinc-400' : 'text-zinc-500'}`}>{m.description}</p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                       {/* Milestone Value */}
                       <div className="text-right">
                         <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-0.5">Value</span>
                         <span className={`font-bold ${isCompleted ? 'text-zinc-400' : 'text-black dark:text-white'}`}>{currencySymbol}{Number(mockPrice).toLocaleString()}</span>
                       </div>

                       {/* Action Button (Fund) - Only for Founders if not funded and not complete */}
                       {isFounder && !isFunded && !isCompleted && (
                         <button 
                           disabled={isProcessing === m.id}
                           onClick={() => handlePayment(Number(mockPrice), m.id)}
                           className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50"
                         >
                           {isProcessing === m.id ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={14} />} 
                           Fund Escrow
                         </button>
                       )}
                    </div>

                  </div>
                </div>
              );
            }) : (
              <div className="bg-white dark:bg-[#0a0a0a] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-12 text-center">
                <Target className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" size={32} />
                <h3 className="text-base font-bold text-black dark:text-white mb-1">No Roadmap Defined</h3>
                <p className="text-sm text-zinc-500 max-w-xs mx-auto">The project lead hasn't set up specific deliverables yet. Use the chat to discuss the plan.</p>
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* RIGHT COLUMN: TEAM & FINANCIALS */}
        {/* ------------------------------------------------------------------ */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Financials Card */}
          <section className="bg-black text-white dark:bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
             {/* Decorative Background */}
             <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
               <DollarSign size={160} />
             </div>
             
             <div className="relative z-10">
                <h2 className="text-xs font-bold mb-1 flex items-center gap-2 text-zinc-400 uppercase tracking-widest">
                  <Wallet size={14} className="text-[#9cf822]" /> Total Budget
                </h2>
                <p className="text-4xl font-bold tracking-tight mb-6">
                  {currencySymbol}{Number(totalBudget).toLocaleString()}
                </p>

                <div className="space-y-4 pt-6 border-t border-zinc-800">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Total Equity</span>
                    <span className="font-bold">{project?.equity || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Available to Distribute</span>
                    <span className="font-bold text-[#9cf822]">{project?.available_share || 0}%</span>
                  </div>
                </div>
             </div>
          </section>

          {/* Active Roster */}
          <section className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-900 rounded-[2.5rem] p-8">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Users size={16} /> Active Roster
            </h2>
            
            <div className="space-y-4">
              {/* Founder Card */}
              <div className="flex items-center gap-4 group">
                 <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 border-2 border-[#9cf822] shrink-0">
                    {project?.profiles?.avatar_url ? (
                      <img src={project.profiles.avatar_url} className="w-full h-full object-cover" alt="Founder" />
                    ) : (
                      <Shield size={20} className="m-auto mt-3 text-zinc-400" />
                    )}
                 </div>
                 <div className="flex-grow min-w-0">
                   <p className="text-sm font-bold text-black dark:text-white truncate flex items-center gap-1.5">
                     {project?.profiles?.full_name || 'Project Lead'} 
                     {isFounder && <span className="bg-zinc-100 dark:bg-zinc-800 text-[9px] px-1.5 py-0.5 rounded text-zinc-500 uppercase">You</span>}
                   </p>
                   <p className="text-xs text-[#5a9a00] dark:text-[#9cf822] font-semibold flex items-center gap-1 mt-0.5">
                     <ShieldCheck size={12}/> Founder
                   </p>
                 </div>
              </div>

              {/* Collaborators */}
              {team.map(member => (
                <div key={member.id} className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
                      {member.profiles?.avatar_url ? (
                        <img src={member.profiles.avatar_url} className="w-full h-full object-cover" alt="Member" />
                      ) : (
                        <User size={20} className="m-auto mt-3 text-zinc-400" />
                      )}
                   </div>
                   <div className="flex-grow min-w-0">
                     <p className="text-sm font-bold text-black dark:text-white truncate flex items-center gap-1.5">
                       {member.profiles?.full_name}
                       {user?.id === member.user_id && <span className="bg-zinc-100 dark:bg-zinc-800 text-[9px] px-1.5 py-0.5 rounded text-zinc-500 uppercase">You</span>}
                     </p>
                     <p className="text-xs text-zinc-500 truncate mt-0.5">{member.assigned_role}</p>
                   </div>
                   <div className="shrink-0 text-right">
                     <span className="text-xs font-bold bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md text-black dark:text-white">{member.equity_share}%</span>
                   </div>
                </div>
              ))}
            </div>
          </section>

          {/* Project Assets Quick Links */}
          {project?.additional_files?.length > 0 && (
            <section className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-900 rounded-[2rem] p-6">
               <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <FileText size={14} /> Shared Assets
               </h2>
               <div className="space-y-2">
                 {project.additional_files.map((file: string, idx: number) => (
                    <a key={idx} href={file} target="_blank" className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors group">
                      <span className="text-sm font-semibold text-black dark:text-white truncate pr-4">Document_{idx + 1}</span>
                      <ArrowUpRight size={14} className="text-zinc-400 group-hover:text-[#9cf822]" />
                    </a>
                 ))}
               </div>
            </section>
          )}

        </div>
      </div>


      {/* ------------------------------------------------------------------ */}
      {/* SLIDE-OVER CHAT INTERFACE */}
      {/* ------------------------------------------------------------------ */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md bg-white dark:bg-[#0a0a0a] h-full shadow-2xl flex flex-col relative animate-in slide-in-from-right duration-300 border-l border-zinc-200 dark:border-zinc-900">
            
            <ChatWallpaper />

            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-900 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md relative z-10">
              <div>
                <h3 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                  <Zap size={16} className="text-[#9cf822] fill-[#9cf822]" /> Team Sync
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{team.length + 1} Members Online</p>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-2 text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 rounded-full transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                   <MessageSquare size={48} className="text-zinc-300 dark:text-zinc-700 mb-4" strokeWidth={1} />
                   <p className="text-sm font-medium text-black dark:text-white">Workspace initialized.</p>
                   <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">Send a message to sync with your team on deliverables.</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.user_id === user?.id;
                  const isFounderMsg = msg.user_id === project.user_id;

                  return (
                    <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-100 dark:border-zinc-900">
                        {msg.profiles?.avatar_url ? (
                          <img src={msg.profiles.avatar_url} className="w-full h-full object-cover" alt="User" />
                        ) : (
                          <User size={14} className="m-auto mt-2 text-zinc-500" />
                        )}
                      </div>
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[10px] font-bold text-zinc-500">{msg.profiles?.full_name || 'User'}</span>
                           {isFounderMsg && <span className="bg-[#9cf822]/20 text-[#5a9a00] dark:text-[#9cf822] text-[8px] font-black px-1.5 rounded uppercase tracking-widest border border-[#9cf822]/30">Lead</span>}
                        </div>
                        <div className={`p-4 rounded-2xl text-sm ${
                          isMe 
                            ? 'bg-[#9cf822] text-black rounded-tr-sm' 
                            : 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white rounded-tl-sm border border-zinc-200 dark:border-zinc-800'
                        }`}>
                          {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                          
                          {/* Attachments rendering */}
                          {msg.attachment_url && (
                            <div className={`mt-2 ${msg.content ? 'pt-2 border-t border-black/10 dark:border-white/10' : ''}`}>
                              {msg.attachment_type === 'image' ? (
                                <img 
                                  src={msg.attachment_url} 
                                  className="w-full max-w-[200px] rounded-xl cursor-pointer hover:opacity-90"
                                  onClick={() => setSelectedMedia(msg.attachment_url)}
                                  alt="Attachment" 
                                />
                              ) : (
                                <a 
                                  href={msg.attachment_url} target="_blank" 
                                  className={`flex items-center gap-2 text-xs font-bold hover:underline ${isMe ? 'text-black/70 hover:text-black' : 'text-zinc-500 hover:text-[#9cf822]'}`}
                                >
                                  <FileText size={14} /> {msg.attachment_name || 'Download File'}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] text-zinc-400 font-medium mt-1 uppercase tracking-wider">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* File Upload Preview */}
            {pendingAttachment && (
               <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-2 overflow-hidden">
                    <Paperclip size={14} className="text-[#9cf822] shrink-0" />
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 truncate">{pendingAttachment.name}</span>
                 </div>
                 <button onClick={() => { setPendingAttachment(null); if (chatFileInputRef.current) chatFileInputRef.current.value = ''; }} className="p-1 text-zinc-400 hover:text-red-500 transition-colors">
                   <X size={14} />
                 </button>
               </div>
            )}

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-[#0a0a0a] border-t border-zinc-200 dark:border-zinc-900 relative z-10">
              <div className="flex items-end gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 focus-within:border-[#9cf822] transition-colors">
                
                <input 
                  type="file" 
                  ref={chatFileInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  accept="image/*,.pdf,.doc,.docx"
                />
                <button 
                  type="button" 
                  onClick={() => chatFileInputRef.current?.click()}
                  className="p-3 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-900 rounded-xl transition-all shrink-0"
                >
                  <Paperclip size={18} />
                </button>

                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-sm text-black dark:text-white p-3 max-h-32 min-h-[44px] resize-none focus:outline-none placeholder:text-zinc-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button 
                  type="submit"
                  disabled={isSending || (!newMessage.trim() && !pendingAttachment) || isChatUploading}
                  className="p-3 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:opacity-80 transition-opacity disabled:opacity-50 shrink-0"
                >
                  {isChatUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
           <button onClick={() => setSelectedMedia(null)} className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors">
             <X size={24} />
           </button>
           <img src={selectedMedia} className="max-w-full max-h-full object-contain rounded-lg" alt="Expanded Media" />
        </div>
      )}
    </div>
  );
}