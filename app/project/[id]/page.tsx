'use client';

import React, { useEffect, useState, use } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Loader2, ArrowLeft, Users, ShieldCheck, 
  Target, Zap, Share2, Bookmark, Heart,
  ChevronRight, Plus, ExternalLink, X, Send, Banknote, Calendar,
  LayoutDashboard, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 1. Currency Helper
const getCurrencySymbol = (currency: string) => {
  switch (currency?.toUpperCase()) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'NGN': return '₦';
    case 'USD': 
    default: return '$';
  }
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'collaborator' | 'applicant' | 'guest'>('guest');
  const [collabStatus, setCollabStatus] = useState<string | null>(null);
  
  // Interaction States
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  useEffect(() => {
    async function fetchProjectAndUserStatus() {
      // 1. Get current logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || null;
      setCurrentUserId(uid);

      // 2. Fetch project + founder profile + milestones
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:user_id(full_name, avatar_url, role, bio),
          milestones(*)
        `)
        .eq('id', projectId)
        .single();
      
      if (!error && data) {
        setProject(data);
        
        // 3. Determine User Relationship to Project
        if (uid) {
          if (data.user_id === uid) {
            setUserRole('owner');
          } else {
            // Check if they have an existing collaboration/application
            const { data: collabData } = await supabase
              .from('collaborations')
              .select('status')
              .eq('project_id', projectId)
              .eq('user_id', uid)
              .single();
            
            if (collabData) {
              setCollabStatus(collabData.status);
              setUserRole(collabData.status === 'accepted' ? 'collaborator' : 'applicant');
            }
          }
        }
      }
      
      setLoading(false);

      // 4. Sync initial interaction state from LocalStorage
      if (typeof window !== 'undefined') {
        const savedLikes = JSON.parse(localStorage.getItem('likedProjects') || '[]');
        const savedBookmarks = JSON.parse(localStorage.getItem('savedProjects') || '[]');
        if (savedLikes.includes(projectId)) setIsLiked(true);
        if (savedBookmarks.includes(projectId)) setIsSaved(true);
      }
    }
    fetchProjectAndUserStatus();
  }, [projectId, supabase]);

  const triggerActivityNotification = async (type: 'like' | 'save' | 'share') => {
    try {
      if (!currentUserId || userRole === 'owner') return;

      await supabase.from('notifications').insert({
        user_id: project.user_id, 
        sender_id: currentUserId,      
        project_id: projectId,
        type: type,
        message: type === 'like' ? 'liked your project' : 
                 type === 'save' ? 'saved your project' : 
                 'shared your project'
      });
    } catch (err) {
      console.error("Activity log failed", err);
    }
  };

  const handleToggleLike = async () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    triggerHaptic(10);
    let liked = JSON.parse(localStorage.getItem('likedProjects') || '[]');
    if (newLiked) liked.push(projectId);
    else liked = liked.filter((id: string) => id !== projectId);
    localStorage.setItem('likedProjects', JSON.stringify(liked));
    if (newLiked) await triggerActivityNotification('like');
  };

  const handleToggleSave = async () => {
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    triggerHaptic(10);
    let saved = JSON.parse(localStorage.getItem('savedProjects') || '[]');
    if (newSaved) saved.push(projectId);
    else saved = saved.filter((id: string) => id !== projectId);
    localStorage.setItem('savedProjects', JSON.stringify(saved));
    if (newSaved) await triggerActivityNotification('save');
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: project?.title,
          text: `Take a look at ${project?.title} on CoLab`,
          url: window.location.href,
        });
      } else {
        throw new Error();
      }
      await triggerActivityNotification('share');
    } catch (err) {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const submitRequest = async () => {
    setIsSending(true);
    try {
      if (!currentUserId) throw new Error('Please sign in to collaborate');

      const { error: collaboError } = await supabase
        .from('collaborations')
        .insert({
          project_id: projectId,
          user_id: currentUserId,
          message: requestMessage,
          status: 'pending'
        });

      if (collaboError) throw collaboError;

      await supabase
        .from('notifications').insert({
          user_id: project.user_id,
          sender_id: currentUserId,      
          project_id: projectId,
          type: 'request',
          message: 'sent a collaboration request for'
        });
      
      alert('Application sent! The project lead has been notified.');
      setShowModal(false);
      setUserRole('applicant');
      setCollabStatus('pending');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <Loader2 className="animate-spin text-[#9cf822]" />
    </div>
  );

  if (!project) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black p-10">
      <p className="text-zinc-500 mb-4">Project not found.</p>
      <Link href="/discover" className="text-[#9cf822] font-medium flex items-center gap-2">
        <ArrowLeft size={16} /> Return to Discover
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 pb-20">
      
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/discover" className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Discover
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={handleToggleLike} className={`p-2 transition-colors ${isLiked ? 'text-red-500' : 'text-zinc-400 hover:text-red-500'}`}>
              <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
            </button>
            <button onClick={handleToggleSave} className={`p-2 transition-colors ${isSaved ? 'text-[#9cf822]' : 'text-zinc-400 hover:text-black dark:hover:text-white'}`}>
              <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
            </button>
            <button onClick={handleShare} className="p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* LEFT: THE VISION */}
          <div className="lg:col-span-7 space-y-12">
            <div className="aspect-video rounded-[2.5rem] overflow-hidden border border-zinc-100 dark:border-zinc-900 shadow-2xl bg-zinc-50 dark:bg-zinc-950 relative">
              {project.image_url ? (
                <img src={project.image_url} className="w-full h-full object-cover" alt={project.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-300 italic font-medium tracking-tight">Project Asset Pending</div>
              )}
            </div>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#9cf822]/10 text-[#5a9a00] dark:text-[#9cf822] rounded-full text-[10px] font-bold tracking-widest uppercase border border-[#9cf822]/20">
                  Active Project
                </span>
                <span className="text-zinc-300 dark:text-zinc-800">•</span>
                <p className="text-xs text-zinc-400 font-medium tracking-tight">Freelance Opportunity</p>
              </div>
              <h1 className="text-4xl md:text-6xl font-semibold text-black dark:text-white tracking-tight leading-tight">
                {project.title}
              </h1>
              <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
                {project.description}
              </p>
            </section>

            <section className="pt-10 border-t border-zinc-100 dark:border-zinc-900">
               <div className="flex items-center gap-2 mb-8">
                 <Target size={18} className="text-[#5a9a00] dark:text-[#9cf822]" />
                 <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Deliverables Roadmap</h3>
               </div>
               
               <div className="space-y-4">
                 {project.milestones && project.milestones.length > 0 ? (
                   project.milestones.map((milestone: any) => (
                     <div key={milestone.id} className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between group relative overflow-hidden">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white dark:bg-black flex items-center justify-center text-zinc-400 shadow-sm shrink-0">
                            <Zap size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-black dark:text-white">{milestone.title}</p>
                            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                              <Calendar size={12} /> {milestone.description?.replace('Timeline: ', '') || 'Timeline TBD'}
                            </p>
                          </div>
                       </div>
                     </div>
                   ))
                 ) : (
                   <p className="text-sm text-zinc-500 italic px-4 py-8 bg-zinc-50 dark:bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                     Roadmap is currently being finalized by the project lead.
                   </p>
                 )}
               </div>
            </section>
          </div>

          {/* RIGHT: THE ENGINE (DETERMINES ACTIONS BASED ON ROLE) */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-8">
              
              <div className="p-8 rounded-[2.5rem] bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                   <ShieldCheck className="text-[#5a9a00] dark:text-[#9cf822] opacity-10" size={80} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Available Share</span>
                      <h2 className="text-4xl font-semibold text-black dark:text-white mt-2">{project.available_share || 0}%</h2>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Budget</span>
                      <div className="flex items-center justify-end gap-1 text-[#5a9a00] dark:text-[#9cf822] mt-2 font-bold text-xl tracking-tight">
                        <Banknote size={18} strokeWidth={2.5} />
                        {getCurrencySymbol(project.currency)} {project.valuation?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-px bg-zinc-200 dark:bg-zinc-900 mb-8" />

                  {/* ACTION BUTTON LOGIC */}
                  <div className="space-y-4">
                    {userRole === 'owner' ? (
                      <Link 
                        href={`/founder/${projectId}`}
                        className="w-full py-4 bg-black text-white dark:bg-white dark:text-black rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl"
                      >
                        <LayoutDashboard size={18} /> Manage Founder Dashboard
                      </Link>
                    ) : userRole === 'collaborator' ? (
                      <Link 
                        href={`/workspace/${projectId}`}
                        className="w-full py-4 bg-[#9cf822] text-black rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#84cc0e] transition-all shadow-lg"
                      >
                        Enter Project Workspace <ArrowRight size={18} />
                      </Link>
                    ) : userRole === 'applicant' ? (
                      <div className="w-full py-4 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 rounded-2xl text-sm font-bold border border-zinc-200 dark:border-zinc-800 text-center uppercase tracking-widest">
                        Application {collabStatus}
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowModal(true)}
                        className="w-full py-4 bg-[#9cf822] text-black rounded-2xl text-sm font-bold hover:bg-[#84cc0e] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Plus size={18} /> Apply to Collaborate
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* FOUNDER BRANDING CARD */}
              <div className="p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-900 flex flex-col gap-6 bg-white dark:bg-black relative">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50">
                      {project.profiles?.avatar_url ? (
                        <img src={project.profiles.avatar_url} className="w-full h-full object-cover" alt="Founder" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900"><Users size={20} className="text-zinc-400" /></div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-black dark:text-white leading-tight">
                        {project.profiles?.full_name || 'Project Lead'}
                      </h4>
                      <p className="text-xs text-[#5a9a00] dark:text-[#9cf822] font-semibold mt-1 uppercase tracking-wider">{project.profiles?.role || 'Project Lead'}</p>
                    </div>
                 </div>
                 {project.profiles?.bio && (
                   <p className="text-xs text-zinc-500 leading-relaxed italic line-clamp-3">"{project.profiles.bio}"</p>
                 )}
                 {userRole !== 'owner' && (
                   <Link href={`/profile/${project.user_id}`} className="w-full py-3 bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white rounded-xl text-xs font-bold text-center border border-zinc-100 dark:border-zinc-800 flex items-center justify-center gap-2">
                     View Full Profile <ExternalLink size={12} />
                   </Link>
                 )}
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* COLLABORATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] border border-zinc-100 dark:border-zinc-900 overflow-hidden shadow-2xl shadow-black/50">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-black dark:text-white">Apply for {project.title}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Professional Pitch</label>
                <textarea 
                  className="w-full h-40 p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-[1.5rem] text-sm focus:outline-none focus:border-[#9cf822] dark:text-white placeholder:text-zinc-500 transition-all shadow-inner"
                  placeholder="Explain your expertise and how you'll execute the deliverables..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                />
              </div>
              <button 
                onClick={submitRequest}
                disabled={isSending || !requestMessage}
                className="w-full py-4 bg-[#9cf822] text-black rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#84cc0e] transition-all"
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Send Application</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}