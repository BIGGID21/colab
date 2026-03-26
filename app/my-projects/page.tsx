'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Folder, Users, Plus, Activity, 
  ArrowRight, Settings, Image as ImageIcon,
  Bookmark, BadgeCheck, Zap, Eye, TrendingUp, X, PartyPopper, Sparkles,
  MoreHorizontal, ChevronRight, Edit3, Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatDistanceToNow } from 'date-fns';

// Authentic iOS Shortcuts Colors
const getAppleColor = (id: string) => {
  const colors = [
    'bg-[#34C759]', // Green
    'bg-[#007AFF]', // Blue
    'bg-[#FF2D55]', // Pink
    'bg-[#FF9500]', // Orange
    'bg-[#5856D6]', // Purple
    'bg-[#FFCC00]', // Yellow (Text needs to be carefully handled, but we'll use white with text-shadow)
  ];
  const charCodeSum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[charCodeSum % colors.length];
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [myCollaborations, setMyCollaborations] = useState<any[]>([]);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [viewers, setViewers] = useState<any[]>([]); 
  const [totalViews, setTotalViews] = useState(0);
  
  const [isVerified, setIsVerified] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }

      if (searchParams.get('payment') === 'success') {
        setShowWelcome(true);
        triggerConfetti();
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_verified')
        .eq('id', authUser.id)
        .single();
      
      setIsVerified(profileData?.is_verified || false);

      const { data: viewerData, count } = await supabase
          .from('profile_views')
          .select('*, viewer:viewer_id(id, full_name, avatar_url, role)', { count: 'exact' })
          .eq('profile_id', authUser.id)
          .order('viewed_at', { ascending: false });
      
      setTotalViews(count || 0);
      setViewers(viewerData || []);

      const { data: projectsData } = await supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false });
      setMyProjects(projectsData || []);

      const { data: collabsData } = await supabase.from('collaborations').select('*, projects(*, profiles(*))').eq('user_id', authUser.id);
      setMyCollaborations(collabsData || []);

      if (typeof window !== 'undefined') {
        const userSavedKey = `savedProjects_${authUser.id}`;
        const savedIds = JSON.parse(localStorage.getItem(userSavedKey) || '[]');
        if (savedIds.length > 0) {
          const { data: savedData } = await supabase.from('projects').select('*, profiles:user_id(full_name, avatar_url)').in('id', savedIds);
          setSavedProjects(savedData || []);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#9cf822', '#ffffff'] });
      confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#9cf822', '#ffffff'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  useEffect(() => { fetchData(); }, [router, searchParams]);

  if (loading) return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="w-48 h-10 bg-zinc-300 dark:bg-[#1C1C1E] rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[4/3] bg-zinc-300 dark:bg-[#1C1C1E] rounded-[24px] animate-pulse"></div>)}
        </div>
        <div className="w-32 h-8 bg-zinc-300 dark:bg-[#1C1C1E] rounded-lg animate-pulse mt-8"></div>
        <div className="h-32 bg-zinc-300 dark:bg-[#1C1C1E] rounded-[24px] animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black text-black dark:text-white p-4 md:p-8 font-sans selection:bg-[#007AFF] selection:text-white transition-colors duration-500 pb-24">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] md:text-[34px] font-bold tracking-tight">Workspace</h1>
            {isVerified && <BadgeCheck size={24} fill="#007AFF" className="text-white dark:text-black mt-1" />}
          </div>
          <button onClick={() => router.push('/create')} className="p-2 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-full transition-colors">
            <Plus size={28} />
          </button>
        </header>

        {/* QUICK ACTIONS (Modeled exactly like Shortcuts top grid) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <button onClick={() => router.push('/create')} className="relative aspect-[4/3] rounded-[24px] p-4 text-white flex flex-col justify-between bg-[#34C759] overflow-hidden group hover:opacity-90 transition-opacity text-left shadow-sm">
            <div className="flex justify-between items-start w-full">
               <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                 <Plus size={18} strokeWidth={3} />
               </div>
               <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                 <MoreHorizontal size={14} />
               </div>
            </div>
            <span className="font-bold text-[16px] leading-tight">New<br/>Project</span>
          </button>

          <button onClick={() => router.push('/discover')} className="relative aspect-[4/3] rounded-[24px] p-4 text-white flex flex-col justify-between bg-[#007AFF] overflow-hidden group hover:opacity-90 transition-opacity text-left shadow-sm">
            <div className="flex justify-between items-start w-full">
               <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                 <Compass size={18} strokeWidth={2.5} />
               </div>
               <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                 <MoreHorizontal size={14} />
               </div>
            </div>
            <span className="font-bold text-[16px] leading-tight">Browse<br/>Briefs</span>
          </button>

          <button onClick={() => router.push('/community')} className="relative aspect-[4/3] rounded-[24px] p-4 text-white flex flex-col justify-between bg-[#FF2D55] overflow-hidden group hover:opacity-90 transition-opacity text-left shadow-sm">
            <div className="flex justify-between items-start w-full">
               <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                 <Users size={18} strokeWidth={2.5} />
               </div>
               <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                 <MoreHorizontal size={14} />
               </div>
            </div>
            <span className="font-bold text-[16px] leading-tight">Find<br/>Teammates</span>
          </button>

          <button onClick={() => isVerified && setIsInsightsOpen(true)} className={`relative aspect-[4/3] rounded-[24px] p-4 text-white flex flex-col justify-between bg-[#FF9500] overflow-hidden group transition-opacity text-left shadow-sm ${!isVerified ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}>
            <div className="flex justify-between items-start w-full">
               <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                 <TrendingUp size={18} strokeWidth={2.5} />
               </div>
               <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                 <MoreHorizontal size={14} />
               </div>
            </div>
            <span className="font-bold text-[16px] leading-tight drop-shadow-sm">{totalViews}<br/>Profile Views</span>
          </button>
        </div>

        {/* SECTION: MY PROJECTS */}
        <div className="mb-8">
          <div className="flex items-center gap-1 px-2 mb-3 cursor-pointer group w-max">
            <Folder size={20} className="text-black dark:text-white group-hover:text-[#007AFF] transition-colors" fill="currentColor" />
            <h2 className="text-[20px] font-bold text-black dark:text-white group-hover:text-[#007AFF] transition-colors flex items-center">
              Owned <ChevronRight size={20} className="text-zinc-400 group-hover:text-[#007AFF] ml-0.5" />
            </h2>
          </div>
          
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-4 shadow-sm">
            {myProjects.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 font-medium">No projects yet.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {myProjects.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => router.push(`/studio/${p.id}`)}
                    className={`relative aspect-[4/3] rounded-[18px] p-3 text-white flex flex-col justify-between overflow-hidden group text-left hover:scale-[0.98] transition-transform ${!p.cover_image_url && !p.image_url ? getAppleColor(p.id) : 'bg-zinc-800'}`}
                  >
                    {/* Background Image if exists */}
                    {(p.cover_image_url || p.image_url) && (
                      <>
                        <img src={p.cover_image_url || p.image_url} className="absolute inset-0 w-full h-full object-cover z-0" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0" />
                      </>
                    )}
                    
                    <div className="flex justify-between items-start w-full relative z-10">
                       <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                         <Edit3 size={14} strokeWidth={2.5} />
                       </div>
                       <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md hover:bg-white/40 transition-colors" onClick={(e) => { e.stopPropagation(); router.push(`/project/${p.id}`); }}>
                         <Eye size={12} />
                       </div>
                    </div>
                    <span className="font-bold text-[14px] leading-tight relative z-10 drop-shadow-md line-clamp-2">{p.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION: COLLABORATIONS */}
        <div className="mb-8">
          <div className="flex items-center gap-1 px-2 mb-3 cursor-pointer group w-max">
            <Users size={20} className="text-black dark:text-white group-hover:text-[#007AFF] transition-colors" fill="currentColor" />
            <h2 className="text-[20px] font-bold text-black dark:text-white group-hover:text-[#007AFF] transition-colors flex items-center">
              Collaborations <ChevronRight size={20} className="text-zinc-400 group-hover:text-[#007AFF] ml-0.5" />
            </h2>
          </div>
          
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-4 shadow-sm">
            {myCollaborations.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 font-medium">No active collaborations.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {myCollaborations.map(c => {
                  const p = c.projects;
                  if (!p) return null;
                  return (
                    <button 
                      key={c.id} 
                      onClick={() => router.push(`/project/${p.id}`)}
                      className={`relative aspect-[4/3] rounded-[18px] p-3 text-white flex flex-col justify-between overflow-hidden group text-left hover:scale-[0.98] transition-transform ${!p.cover_image_url && !p.image_url ? getAppleColor(p.id) : 'bg-zinc-800'}`}
                    >
                      {(p.cover_image_url || p.image_url) && (
                        <>
                          <img src={p.cover_image_url || p.image_url} className="absolute inset-0 w-full h-full object-cover z-0" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0" />
                        </>
                      )}
                      
                      <div className="flex justify-between items-start w-full relative z-10">
                         <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                           <Users size={14} strokeWidth={2.5} />
                         </div>
                         <div className={`px-2 py-0.5 rounded-full backdrop-blur-md text-[9px] font-bold uppercase tracking-wider ${c.status === 'accepted' ? 'bg-[#34C759]/80' : c.status === 'rejected' ? 'bg-[#FF2D55]/80' : 'bg-[#FF9500]/80'}`}>
                           {c.status}
                         </div>
                      </div>
                      <div className="relative z-10 drop-shadow-md">
                        <span className="font-bold text-[14px] leading-tight line-clamp-2">{p.title}</span>
                        <span className="text-[10px] text-white/80 capitalize line-clamp-1">{c.role}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SECTION: SAVED */}
        <div className="mb-8">
          <div className="flex items-center gap-1 px-2 mb-3 cursor-pointer group w-max">
            <Bookmark size={20} className="text-black dark:text-white group-hover:text-[#007AFF] transition-colors" fill="currentColor" />
            <h2 className="text-[20px] font-bold text-black dark:text-white group-hover:text-[#007AFF] transition-colors flex items-center">
              Saved <ChevronRight size={20} className="text-zinc-400 group-hover:text-[#007AFF] ml-0.5" />
            </h2>
          </div>
          
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-4 shadow-sm">
            {savedProjects.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 font-medium">No saved projects yet.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {savedProjects.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => router.push(`/project/${p.id}`)}
                    className={`relative aspect-[4/3] rounded-[18px] p-3 text-white flex flex-col justify-between overflow-hidden group text-left hover:scale-[0.98] transition-transform ${!p.cover_image_url && !p.image_url ? getAppleColor(p.id) : 'bg-zinc-800'}`}
                  >
                    {(p.cover_image_url || p.image_url) && (
                      <>
                        <img src={p.cover_image_url || p.image_url} className="absolute inset-0 w-full h-full object-cover z-0" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0" />
                      </>
                    )}
                    
                    <div className="flex justify-between items-start w-full relative z-10">
                       <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                         <Bookmark size={14} fill="currentColor" />
                       </div>
                       <img src={p.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${p.profiles?.full_name || 'User'}`} className="w-6 h-6 rounded-full border border-white/20 object-cover" />
                    </div>
                    <span className="font-bold text-[14px] leading-tight relative z-10 drop-shadow-md line-clamp-2">{p.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* --- WELCOME TO PRO CELEBRATION MODAL --- */}
      {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[32px] p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl">
            <button onClick={() => setShowWelcome(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-black dark:hover:text-white transition-colors bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full">
              <X size={16} strokeWidth={3} />
            </button>
            <div className="mb-6 inline-flex p-4 bg-[#007AFF] rounded-full text-white shadow-lg shadow-[#007AFF]/30">
              <BadgeCheck size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2 text-black dark:text-white">
              You're PRO
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium leading-relaxed">
              Welcome to the inner circle. Your badge is live, your search ranking is boosted, and the creative world is watching.
            </p>
            <button 
              onClick={() => setShowWelcome(false)}
              className="w-full py-4 bg-[#007AFF] text-white font-bold rounded-2xl hover:bg-[#007AFF]/90 transition-colors flex items-center justify-center gap-2 text-lg"
            >
              Let's Go
            </button>
          </div>
        </div>
      )}

      {/* INSIGHTS MODAL (iOS Style Modal) */}
      {isInsightsOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 shadow-2xl">
            <div className="p-4 flex justify-between items-center bg-white dark:bg-[#1C1C1E] border-b border-zinc-200 dark:border-zinc-800">
              <button onClick={() => setIsInsightsOpen(false)} className="text-[#007AFF] font-medium px-2">Close</button>
              <h3 className="font-bold text-black dark:text-white">Insights</h3>
              <div className="w-12"></div> {/* Spacer for centering */}
            </div>
            
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-white dark:bg-black rounded-[20px] p-4 mb-4 text-center">
                <p className="text-[13px] font-medium text-zinc-500 uppercase tracking-widest mb-1">Profile Views</p>
                <p className="text-4xl font-bold text-black dark:text-white">{totalViews}</p>
              </div>

              <div className="bg-white dark:bg-black rounded-[20px] overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50 dark:bg-black">
                   <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Recent Viewers</p>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {viewers.length > 0 ? viewers.map((v, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                      <img src={v.viewer?.avatar_url || `https://ui-avatars.com/api/?name=${v.viewer?.full_name}`} className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 object-cover" />
                      <div className="flex-grow">
                        <p className="text-[15px] font-semibold text-black dark:text-white leading-tight">{v.viewer?.full_name}</p>
                        <p className="text-[13px] text-zinc-500 leading-tight">{v.viewer?.role || 'Creator'}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="p-6 text-center text-sm text-zinc-500">No recent activity.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}