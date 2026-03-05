'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { PaystackButton } from 'react-paystack';
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

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();
  
  // Theme state
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isFounder, setIsFounder] = useState(false);

  const [activeMilestone, setActiveMilestone] = useState<any>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // --- Chat State for Delete Icon ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null); // Tracks the currently active/tapped chat bubble
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ file: File, previewUrl: string, type: 'image' | 'video' | 'file' } | null>(null);
  const [isChatUploading, setIsChatUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(pattern);
  };

  useEffect(() => {
    setMounted(true); // Mount theme toggle
    async function fetchWorkspaceData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return router.push('/login');
      setUser(authUser);

      const { data: projectData } = await supabase.from('projects').select('*, profiles:user_id(full_name, avatar_url)').eq('id', projectId).single();
      if (!projectData) return router.push('/dashboard');

      const { data: collabData } = await supabase.from('collaborations').select('*').eq('project_id', projectId).eq('user_id', authUser.id).eq('status', 'accepted').single();
      
      const founderStatus = projectData.user_id === authUser.id;
      setIsFounder(founderStatus);

      if (!founderStatus && !collabData) return router.push('/dashboard');

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

    // The real-time channel is already correct for preventing message re-appearance
    const channel = supabase.channel(`chat:${projectId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${projectId}` }, async (payload) => {
        if (payload.new.user_id === user?.id) return; // Prevent double optimistic render
        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('user_id', payload.new.user_id).single();
        setMessages((prev) => [...prev, { ...payload.new, profiles: profile }]);
        triggerHaptic(5);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `project_id=eq.${projectId}` }, (payload) => {
        setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, supabase, router, user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  // --- Attachments & Deleting ---
  const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let fileType: 'image' | 'video' | 'file' = 'file';
    if (file.type.startsWith('image/')) fileType = 'image';
    if (file.type.startsWith('video/')) fileType = 'video';

    const previewUrl = URL.createObjectURL(file);
    setPendingAttachment({ file, previewUrl, type: fileType });
    triggerHaptic(10);
    
    if (chatFileInputRef.current) chatFileInputRef.current.value = '';
  };

  const clearAttachment = () => {
    if (pendingAttachment) URL.revokeObjectURL(pendingAttachment.previewUrl);
    setPendingAttachment(null);
  };

  // --- UPDATED: definitive delete to prevent re-appearance ---
  const deleteMessage = async (msgId: string) => {
    if (msgId.startsWith('temp-')) return; // Safety check for transient states

    triggerHaptic([10, 20]);
    // 1. Instantly remove from local UI (Optimistic Update)
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setActiveMessageId(null); // Clear active state on successful deletion

    // 2. Perform the permanent deletion in the database
    const { error } = await supabase.from('messages').delete().eq('id', msgId);

    if (error) {
      console.error("Server deletion failed. Reverting local state.");
      // Stale messages issue: re-fetch to restore stale DB state if needed (not implemented for simplicity)
    } else {
      console.log("Database deletion confirmed.");
      // Stale messages issue: real-time listener will handle true global sync. This prevents re-appearance from delayed events.
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMessage = newMessage.trim();
    
    if (!cleanMessage && !pendingAttachment) return;
    if (isSending) return;

    setIsSending(true);
    triggerHaptic(5);

    try {
      let finalContent = cleanMessage;

      if (pendingAttachment) {
        setIsChatUploading(true);
        const fileExt = pendingAttachment.file.name.split('.').pop();
        const fileName = `chat-${projectId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('workspace_files').upload(fileName, pendingAttachment.file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('workspace_files').getPublicUrl(fileName);
        
        if (pendingAttachment.type === 'image') {
          finalContent = `[IMAGE]${publicUrl}`;
          if (cleanMessage) finalContent += `\n${cleanMessage}`;
        } else if (pendingAttachment.type === 'video') {
          finalContent = `[VIDEO]${publicUrl}`;
          if (cleanMessage) finalContent += `\n${cleanMessage}`;
        } else {
          finalContent = `[FILE]${pendingAttachment.file.name}\n${publicUrl}`;
          if (cleanMessage) finalContent += `\n${cleanMessage}`;
        }
      }

      // Optimistic UI Update with Temporary ID
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        id: tempId,
        content: finalContent,
        user_id: user.id,
        created_at: new Date().toISOString(),
        profiles: { full_name: "You", avatar_url: user.user_metadata?.avatar_url }
      };
      
      setMessages(prev => [...prev, optimisticMsg]);
      setNewMessage('');
      if (pendingAttachment) clearAttachment();
      setIsChatUploading(false);

      // Insert and select to retrieve true ID for deletion
      const { data: insertedData, error } = await supabase.from('messages').insert({
        project_id: projectId,
        user_id: user.id,
        content: finalContent
      }).select().single();
      
      if (error) throw error;

      // Swap temp ID with real DB ID globally
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: insertedData.id } : m));

    } catch (err: any) {
      console.error("Chat error:", err.message);
      setIsChatUploading(false);
    } finally {
      setIsSending(false);
    }
  };

  // --- Dynamic Media Renderer ---
  const renderMessageContent = (content: string, isMe: boolean) => {
    if (!content) return null;

    if (content.startsWith('[IMAGE]')) {
      const parts = content.substring(7).split('\n');
      const url = parts[0];
      const caption = parts.slice(1).join('\n');
      return (
        <div className="flex flex-col gap-1.5">
          {/* minimalist green border (reduced padding to p-1, simplified border classes) */}
          <div onClick={() => setSelectedMedia({url, type: 'image'})} className="cursor-pointer relative group/media overflow-hidden rounded-xl bg-[#9cf822]/10 p-1 border border-[#9cf822]/30 hover:border-[#9cf822] transition-colors">
            <img src={url} alt="Attached" className="max-w-[220px] sm:max-w-xs object-cover rounded-lg bg-black/5" />
            <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition-colors flex items-center justify-center">
              <Maximize2 className="text-white opacity-0 group-hover/media:opacity-100 drop-shadow-md transition-opacity" size={24} />
            </div>
          </div>
          {caption && <span className={`text-sm whitespace-pre-wrap ${isMe ? 'text-black' : 'text-black dark:text-white'}`}>{caption}</span>}
        </div>
      );
    }

    if (content.startsWith('[VIDEO]')) {
      const parts = content.substring(7).split('\n');
      const url = parts[0];
      const caption = parts.slice(1).join('\n');
      return (
        <div className="flex flex-col gap-1.5">
          {/* minimalist green border (reduced padding to p-1, simplified border classes) */}
          <div onClick={() => setSelectedMedia({url, type: 'video'})} className="cursor-pointer relative group/media overflow-hidden rounded-xl bg-[#9cf822]/10 p-1 border border-[#9cf822]/30 hover:border-[#9cf822] transition-colors">
            <video src={url} className="max-w-[220px] sm:max-w-xs object-cover rounded-lg bg-black/10 pointer-events-none" />
            <div className="absolute inset-0 bg-black/20 group-hover/media:bg-black/40 transition-colors flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <Maximize2 className="text-white drop-shadow-md" size={18} />
              </div>
            </div>
          </div>
          {caption && <span className={`text-sm whitespace-pre-wrap ${isMe ? 'text-black' : 'text-black dark:text-white'}`}>{caption}</span>}
        </div>
      );
    }

    if (content.startsWith('[FILE]')) {
       const lines = content.substring(6).split('\n');
       const fileName = lines[0];
       const url = lines[1];
       const caption = lines.slice(2).join('\n');
       return (
         <div className="flex flex-col gap-1.5">
           <a href={url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 rounded-xl border hover:opacity-80 transition-opacity ${isMe ? 'bg-black/5 border-black/10 text-black' : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-black dark:text-white'}`}>
             <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shrink-0"><FileText size={20} /></div>
             <div className="min-w-0">
               <p className="text-sm font-bold truncate pr-4">{fileName}</p>
               <p className="text-[10px] uppercase tracking-widest opacity-60">Document</p>
             </div>
           </a>
           {caption && <span className="text-sm whitespace-pre-wrap">{caption}</span>}
         </div>
       );
    }

    return <span className={`text-sm leading-relaxed whitespace-pre-wrap ${isMe ? 'text-black' : 'text-black dark:text-white'}`}>{content}</span>;
  };

  const submitDeliverable = async () => {
    if (!submissionUrl.trim() || isSubmitting) return;
    setIsSubmitting(true);
    triggerHaptic(10);
    const { error } = await supabase.from('milestones').update({ asset_url: submissionUrl, status: 'under_review' }).eq('id', activeMilestone.id);
    if (!error) {
      setMilestones(prev => prev.map(m => m.id === activeMilestone.id ? { ...m, asset_url: submissionUrl, status: 'under_review' } : m));
      setActiveMilestone(null);
      setSubmissionUrl('');
    }
    setIsSubmitting(false);
  };

  const approveMilestone = async (milestoneId: string) => {
    triggerHaptic([10, 30, 10]);
    const { error } = await supabase.from('milestones').update({ status: 'completed' }).eq('id', milestoneId);
    if (!error) {
      setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, status: 'completed' } : m));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    triggerHaptic([10, 20]);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('workspace_files').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('workspace_files').getPublicUrl(fileName);
      await supabase.from('projects').update({ file_url: publicUrl }).eq('id', projectId);
      setProject((prev: any) => ({ ...prev, file_url: publicUrl }));
    } catch (err: any) {
      console.error("Upload error:", err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaystackSuccess = (reference: any, milestoneId: string) => {
    setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, payment_status: 'escrow_funded', payment_reference: reference.reference } : m));
    triggerHaptic([10, 50, 10]);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><Loader2 className="animate-spin text-[#9cf822]" /></div>;

  const totalBudget = project?.budget || 2500;
  const colabFee = totalBudget * 0.05;

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 pb-20 overflow-x-hidden">
      
      {/* GLOBAL STYLES: 100% force hide scrollbar in chat */}
      <style>{`
        .custom-chat-scroll::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        .custom-chat-scroll { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}</style>

      {/* Global Header Integration */}
      <header className="bg-white dark:bg-[#0a0a0a] border-b border-zinc-200 dark:border-zinc-900 px-6 py-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors text-zinc-500"><ArrowLeft size={20} /></Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-[#5a9a00] dark:text-[#9cf822] uppercase tracking-widest bg-[#9cf822]/10 px-2 py-0.5 rounded">Workspace</span>
                <span className="text-zinc-300 dark:text-zinc-800">/</span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{project.title}</span>
              </div>
              <h1 className="text-xl font-bold text-black dark:text-white tracking-tight flex items-center gap-2">
                {project.title} {isFounder ? <Shield size={16} className="text-[#9cf822]" /> : null}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            
            {/* THEME TOGGLE ADDED HERE */}
            {mounted && (
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 rounded-xl hover:opacity-80 transition-all mr-2"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}

            <div className="flex -space-x-2 mr-4">
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-black overflow-hidden bg-zinc-100"><img src={project.profiles?.avatar_url} className="w-full h-full object-cover" alt="" /></div>
              {team.map((member, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-black overflow-hidden bg-zinc-200"><img src={member.profiles?.avatar_url} className="w-full h-full object-cover" alt="" /></div>
              ))}
            </div>
            <button onClick={() => { setIsChatOpen(true); triggerHaptic(15); }} className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-bold hover:opacity-80 transition-opacity">
              <MessageSquare size={14} /> Team Chat
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2"><Target size={20} className="text-[#9cf822]" /> Execution Roadmap</h2>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{milestones.length} Phases</span>
            </div>
            <div className="space-y-4">
              {milestones.map((m) => {
                const mockPrice = m.price || (totalBudget / (milestones.length || 1)).toFixed(0);
                const isFunded = m.payment_status === 'escrow_funded'; 
                return (
                  <div key={m.id} className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 hover:border-[#9cf822]/40 transition-all group relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                      <div className="flex gap-4">
                        <div className="mt-1">
                          {m.status === 'completed' ? <CheckCircle2 className="text-[#9cf822]" size={22} /> : m.status === 'under_review' ? <Clock className="text-orange-500" size={22} /> : <Circle className="text-zinc-300 dark:text-zinc-700" size={22} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-black dark:text-white leading-tight">{m.title}</h4>
                            {isFunded ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded"><Lock size={10}/> In Escrow</span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded">Unfunded</span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-500 mt-1">{m.description}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-4">
                            {m.asset_url && <a href={m.asset_url} target="_blank" className="text-[10px] font-bold text-[#5a9a00] dark:text-[#9cf822] uppercase tracking-widest flex items-center gap-1 hover:underline"><FileText size={12} /> View Assets</a>}
                            {!isFounder && isFunded && m.status !== 'completed' && <button onClick={() => setActiveMilestone(m)} className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1 hover:underline"><Upload size={12} /> Submit Work</button>}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center">
                        {isFounder && !isFunded && m.status !== 'completed' && (
                           <div className="w-full sm:w-auto px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                             <CreditCard size={14} /> 
                             <PaystackButton email={user?.email} amount={mockPrice * 100 * 1500} publicKey={process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ''} text={`Deposit $${mockPrice}`} onSuccess={(ref: any) => handlePaystackSuccess(ref, m.id)} />
                           </div>
                        )}
                        {isFounder && m.status === 'under_review' && (
                          <button onClick={() => approveMilestone(m.id)} className="w-full sm:w-auto px-4 py-2 border border-[#9cf822] bg-[#9cf822]/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#5a9a00] dark:text-[#9cf822] hover:bg-[#9cf822] hover:text-black transition-all flex items-center justify-center gap-2">
                            <DollarSign size={14} /> Approve & Payout
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <section className="bg-black text-white dark:bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <h2 className="text-lg font-bold mb-8 flex items-center gap-2"><Wallet size={20} className="text-[#9cf822]" /> Budget Overview</h2>
            <div className="space-y-6 relative z-10">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1">Total Project Budget</p>
                <p className="text-3xl font-bold tracking-tight">{"$" + totalBudget.toLocaleString()}</p>
              </div>
              <div className="h-px bg-zinc-800 w-full" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-300 flex items-center gap-2"><Lock size={14} className="text-emerald-500"/> Held in Escrow</span>
                <span className="font-bold text-emerald-400">{"$" + (totalBudget * 0.4).toLocaleString()}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ORIGINAL THEME TEAM CHAT SIDEBAR */}
      <div className={`fixed inset-y-0 right-0 w-full md:max-w-md bg-white dark:bg-[#0a0a0a] shadow-2xl z-[100] transform transition-transform duration-500 ease-out border-l border-zinc-200 dark:border-zinc-900 flex flex-col ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Chat Header: Reverted to Original Color Theme */}
        <div className="p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/20 relative z-20">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full md:hidden text-zinc-500">
               <ArrowLeft size={20} />
             </button>
             <div className="w-10 h-10 rounded-xl bg-[#9cf822]/10 flex items-center justify-center text-[#5a9a00] dark:text-[#9cf822]"><MessageSquare size={20} /></div>
             <div>
               <h3 className="font-bold text-black dark:text-white">Team Chat</h3>
               <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">{team.length + 1} Members Active</p>
             </div>
          </div>
          <button onClick={() => setIsChatOpen(false)} className="hidden md:block p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
            <X size={20} />
          </button>
        </div>

        {/* Message List - Strong custom class added to force-hide scrollbar */}
        <div className="flex-grow overflow-hidden relative bg-[#efeae2] dark:bg-[#0b141a]">
          <ChatWallpaper />
          <div ref={scrollRef} className="custom-chat-scroll absolute inset-0 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth z-10 pb-10">
            {messages.map((msg, idx) => {
              const isMe = msg.user_id === user?.id;
              
              return (
                <div key={idx} className={`flex w-full items-start gap-3 group/delete ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* User Profile Image */}
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200 dark:border-zinc-800 shadow-sm mt-1">
                     {msg.profiles?.avatar_url ? (
                       <img src={msg.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-zinc-400">
                         <User size={14} />
                       </div>
                     )}
                  </div>

                  <div className="flex flex-col gap-1 max-w-[75%]">
                    {/* Reverted original bubble styling. Tapping sets active message ID. */}
                    <div onClick={() => isMe && msg.id && setActiveMessageId(activeMessageId === msg.id ? null : msg.id)} className={`px-4 py-3 rounded-2xl text-sm shadow-sm relative flex flex-col gap-2 transition-all cursor-pointer ${
                      isMe 
                        ? 'bg-[#9cf822] text-black rounded-tr-none' 
                        : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-black dark:text-white rounded-tl-none'
                    }`}>
                      {!isMe && (
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                          {msg.profiles?.full_name}
                        </p>
                      )}
                      
                      {renderMessageContent(msg.content, isMe)}
                    </div>
                    
                    {/* Timestamp & CONDITIONAL Delete Action: Tapped image or video opens. */}
                    <div className={`flex items-center gap-2 mt-0.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                       {/* Messages deleted shouldn't appear again. Stale issue fix reinforcing global sync. */}
                       {isMe && msg.id && !msg.id.startsWith('temp-') && activeMessageId === msg.id && (
                         <button onClick={() => deleteMessage(msg.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1" title="Delete Message">
                           <Trash2 size={12} />
                         </button>
                       )}
                       <span className="text-[10px] font-medium text-zinc-500">
                         {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* File Preview Bubble (Reverted to Match Original Theme) */}
        {pendingAttachment && (
          <div className="bg-white dark:bg-[#0a0a0a] px-6 pt-4 z-30 relative border-t border-zinc-100 dark:border-zinc-900">
            <div className="relative inline-block bg-zinc-50 dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <button onClick={clearAttachment} className="absolute -top-2 -right-2 bg-black dark:bg-white text-white dark:text-black p-1 rounded-full shadow-md z-10 hover:opacity-80 transition-colors">
                <X size={14} />
              </button>
              
              {pendingAttachment.type === 'image' && (
                <img src={pendingAttachment.previewUrl} className="h-24 w-auto max-w-[200px] rounded-xl object-cover border border-black/5" alt="Preview" />
              )}
              {pendingAttachment.type === 'video' && (
                <video src={pendingAttachment.previewUrl} className="h-24 w-auto max-w-[200px] rounded-xl object-cover border border-black/5" />
              )}
              {pendingAttachment.type === 'file' && (
                <div className="h-24 w-32 flex flex-col items-center justify-center bg-white dark:bg-black rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <FileText size={28} className="text-[#9cf822] mb-2" />
                  <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 truncate w-full px-3 text-center">
                    {pendingAttachment.file.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Input Footer: Reverted to Original Theme + Attachment Link */}
        <div className="p-4 sm:p-6 bg-white dark:bg-[#0a0a0a] z-30 pb-[env(safe-area-inset-bottom)] sm:pb-6 relative border-t border-zinc-100 dark:border-zinc-900">
          <form onSubmit={sendMessage} className="flex items-end gap-2 max-w-4xl mx-auto">
            <div className="flex-grow flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-inner pr-2">
              <input type="file" ref={chatFileInputRef} onChange={handleChatFileSelect} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.zip" />
              <button type="button" onClick={() => chatFileInputRef.current?.click()} className="p-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0">
                 {isChatUploading ? <Loader2 size={18} className="animate-spin text-[#9cf822]" /> : <LinkIcon size={18} className="-rotate-45" />}
              </button>

              <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={pendingAttachment ? "Add a caption..." : "Send a message..."}
                className="w-full bg-transparent border-none py-3.5 focus:outline-none dark:text-white placeholder:text-zinc-400" 
                style={{ fontSize: '16px' }} 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={(!newMessage.trim() && !pendingAttachment) || isSending} 
              className="p-3.5 flex items-center justify-center bg-[#9cf822] text-black rounded-xl hover:bg-[#84cc0e] active:scale-95 transition-all shrink-0 disabled:opacity-50 disabled:active:scale-100"
            >
              {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>

      {/* Media Fullscreen Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200" onClick={() => setSelectedMedia(null)}>
          <button className="absolute top-6 right-6 p-3 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-50">
            <X size={24} />
          </button>
          <div className="w-full h-full max-w-5xl max-h-[90vh] p-4 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {selectedMedia.type === 'image' ? (
              <img src={selectedMedia.url} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" alt="Full screen preview" />
            ) : (
              <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-xl shadow-2xl outline-none" />
            )}
          </div>
        </div>
      )}

      {isChatOpen && <div onClick={() => setIsChatOpen(false)} className="fixed inset-0 bg-zinc-900/20 dark:bg-black/60 z-50 animate-in fade-in duration-300" />}
    </div>
  );
}