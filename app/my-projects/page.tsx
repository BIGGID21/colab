'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Folder, Users, Plus, Activity, 
  ArrowRight, Settings, Image as ImageIcon,
  Bookmark, BadgeCheck, Zap, Eye, TrendingUp, X, PartyPopper, Sparkles,
  Wand2, DownloadCloud
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatDistanceToNow } from 'date-fns';

// Helper to generate consistent, vibrant gradients for missing cover images
const getVibrantGradient = (id: string) => {
  const gradients = [
    'from-violet-500 via-purple-500 to-fuchsia-500',
    'from-blue-500 via-cyan-400 to-teal-400',
    'from-rose-400 via-fuchsia-500 to-indigo-500',
    'from-amber-400 via-orange-500 to-rose-500',
    'from-emerald-400 via-teal-500 to-cyan-500'
  ];
  const charCodeSum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[charCodeSum % gradients.length];
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'owned' | 'collaborations' | 'saved'>('owned');
  
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

      const { data: profileData } = await supabase.from('profiles').select('is_verified').eq('id', authUser.id).single();
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
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#050505] p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex justify-between items-center">
          <div>
            <div className="w-48 h-10 bg-zinc-200 dark:bg-zinc-900 rounded-lg animate-pulse mb-2"></div>
            <div className="w-32 h-4 bg-zinc-200 dark:bg-zinc-900 rounded animate-pulse"></div>
          </div>
          <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-900 rounded-full animate-pulse"></div>
        </div>
        <div className="flex gap-4 overflow-hidden">
           {[1,2,3].map(i => <div key={i} className="w-64 h-20 bg-zinc-200 dark:bg-zinc-900 rounded-2xl animate-pulse shrink-0"></div>)}
        </div>
        <div className="flex gap-3"><div className="w-20 h-8 bg-zinc-200 dark:bg-zinc-900 rounded-full animate-pulse"></div><div className="w-24 h-8 bg-zinc-200 dark:bg-zinc-900 rounded-full animate-pulse"></div></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-[280px] bg-zinc-200 dark:bg-zinc-900 rounded-3xl animate-pulse"></div>)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#050505] text-zinc-900 dark:text-white p-6 md:p-10 font-sans selection:bg-[#9cf822] selection:text-black transition-colors duration-500 relative">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black dark:text-white">Workspace</h1>
              {isVerified && <BadgeCheck size={28} fill="#9cf822" className="text-white dark:text-black shrink-0" />}
            </div>
            <p className="text-[15px] text-zinc-500 font-medium">Create, manage, and collaborate on your best ideas.</p>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Total Views</p>
              <p className="text-xl font-bold">{isVerified ? totalViews : '—'}</p>
            </div>
            <button onClick={() => setIsInsightsOpen(true)} className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
              <TrendingUp size={18} className="text-zinc-600 dark:text-zinc-300" />
            </button>
          </div>
        </header>

        {/* QUICK ACTIONS (Modeled after SpaceWork image) */}
        <div className="flex flex-wrap gap-4 mb-12">
          <button onClick={() => router.push('/create')} className="flex items-center gap-4 p-4 pr-8 bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={20} strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-bold text-black dark:text-white leading-tight">Start new project</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Blank canvas or template</p>
            </div>
          </button>

          <button onClick={() => router.push('/community')} className="flex items-center gap-4 p-4 pr-8 bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wand2 size={20} strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-bold text-black dark:text-white leading-tight">Find collaborators</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Post to community feed</p>
            </div>
          </button>

          <button onClick={() => router.push('/discover')} className="flex items-center gap-4 p-4 pr-8 bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DownloadCloud size={20} strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-bold text-black dark:text-white leading-tight">Browse briefs</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Apply to open projects</p>
            </div>
          </button>
        </div>

        {/* PILL NAVIGATION (Modeled after SpaceWork image) */}
        <nav className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'owned', label: 'By me', count: myProjects.length },
            { id: 'collaborations', label: 'Collaborations', count: myCollaborations.length },
            { id: 'saved', label: 'Saved', count: savedProjects.length }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-5 py-2.5 text-[13px] font-bold rounded-full transition-all whitespace-nowrap flex items-center gap-2
                ${activeTab === tab.id 
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-md' 
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white/20 dark:bg-black/10' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>

        {/* CONTENT GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          
          {/* TAB: OWNED PROJECTS */}
          {activeTab === 'owned' && myProjects.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                <Folder size={32} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">Create your first project</h3>
              <p className="text-sm text-zinc-500 mb-6 max-w-sm">Whether it's an app, a clothing brand, or an AI startup, start building it here.</p>
              <button onClick={() => router.push('/create')} className="px-6 py-3 bg-[#9cf822] text-black rounded-xl text-sm font-bold shadow-[0_8px_30px_rgba(156,248,34,0.3)] hover:scale-105 transition-transform">
                Start Building
              </button>
            </div>
          )}
          {activeTab === 'owned' && myProjects.map(p => (
            <div key={p.id} onClick={() => router.push(`/studio/${p.id}`)} className="group bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-[24px] overflow-hidden hover:shadow-xl dark:hover:border-zinc-700 transition-all cursor-pointer flex flex-col p-2">
              <div className={`aspect-[16/10] rounded-[18px] overflow-hidden relative bg-gradient-to-br ${getVibrantGradient(p.id)} flex items-center justify-center`}>
                {p.cover_image_url || p.image_url ? (
                  <img src={p.cover_image_url || p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                ) : (
                  <span className="text-white/80 font-black text-3xl mix-blend-overlay tracking-tighter px-6 text-center line-clamp-2 leading-tight">
                    {p.title}
                  </span>
                )}
                
                {/* Hover overlay actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                   <button onClick={(e) => { e.stopPropagation(); router.push(`/studio/${p.id}`); }} className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full hover:scale-105 transition-transform">Manage Studio</button>
                   <button onClick={(e) => { e.stopPropagation(); router.push(`/project/${p.id}`); }} className="p-2 bg-black/50 text-white rounded-full hover:bg-black transition-colors"><Eye size={16}/></button>
                </div>
              </div>
              
              <div className="p-4 pt-5 pb-3">
                <h3 className="font-bold text-[17px] text-black dark:text-white leading-tight mb-1 truncate">{p.title}</h3>
                <p className="text-[13px] text-zinc-500 truncate">Updated {formatDistanceToNow(new Date(p.created_at))} ago</p>
              </div>
            </div>
          ))}

          {/* TAB: COLLABORATIONS */}
          {activeTab === 'collaborations' && myCollaborations.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                <Users size={32} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">Join a team</h3>
              <p className="text-sm text-zinc-500 mb-6 max-w-sm">Bring your skills to open projects and start collaborating.</p>
              <button onClick={() => router.push('/discover')} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:scale-105 transition-transform">
                Browse Projects
              </button>
            </div>
          )}
          {activeTab === 'collaborations' && myCollaborations.map(c => {
            const p = c.projects;
            if (!p) return null;
            return (
              <div key={c.id} onClick={() => router.push(`/project/${p.id}`)} className="group bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-[24px] overflow-hidden hover:shadow-xl dark:hover:border-zinc-700 transition-all cursor-pointer flex flex-col p-2">
                <div className={`aspect-[16/10] rounded-[18px] overflow-hidden relative bg-gradient-to-br ${getVibrantGradient(p.id)} flex items-center justify-center`}>
                  {p.cover_image_url || p.image_url ? (
                    <img src={p.cover_image_url || p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  ) : (
                    <span className="text-white/80 font-black text-3xl mix-blend-overlay tracking-tighter px-6 text-center line-clamp-2 leading-tight">
                      {p.title}
                    </span>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${c.status === 'accepted' ? 'text-[#9cf822]' : c.status === 'rejected' ? 'text-rose-400' : 'text-amber-400'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 pt-5 pb-3">
                  <h3 className="font-bold text-[17px] text-black dark:text-white leading-tight mb-1 truncate">{p.title}</h3>
                  <div className="flex items-center justify-between text-[13px] text-zinc-500 mt-1">
                    <span className="capitalize">Role: <strong className="text-black dark:text-white">{c.role}</strong></span>
                    <span className="flex items-center gap-1 group-hover:text-[#9cf822] transition-colors">View <ArrowRight size={12}/></span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* TAB: SAVED PROJECTS */}
          {activeTab === 'saved' && savedProjects.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                <Bookmark size={32} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">No saved ideas</h3>
              <p className="text-sm text-zinc-500 mb-6 max-w-sm">When you find a brief that sparks your interest, hit save.</p>
              <button onClick={() => router.push('/discover')} className="px-6 py-3 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white rounded-xl text-sm font-bold hover:scale-105 transition-transform">
                Explore Discover
              </button>
            </div>
          )}
          {activeTab === 'saved' && savedProjects.map(p => (
            <div key={p.id} onClick={() => router.push(`/project/${p.id}`)} className="group bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-[24px] overflow-hidden hover:shadow-xl dark:hover:border-zinc-700 transition-all cursor-pointer flex flex-col p-2">
              <div className={`aspect-[16/10] rounded-[18px] overflow-hidden relative bg-gradient-to-br ${getVibrantGradient(p.id)} flex items-center justify-center`}>
                {p.cover_image_url || p.image_url ? (
                  <img src={p.cover_image_url || p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                ) : (
                  <span className="text-white/80 font-black text-3xl mix-blend-overlay tracking-tighter px-6 text-center line-clamp-2 leading-tight">
                    {p.title}
                  </span>
                )}
                
                <div className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-md rounded-full shadow-lg border border-white/10">
                   <Bookmark size={14} fill="currentColor" className="text-[#9cf822]" />
                </div>
              </div>
              
              <div className="p-4 pt-5 pb-3">
                <h3 className="font-bold text-[17px] text-black dark:text-white leading-tight mb-1 truncate">{p.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                   <img src={p.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${p.profiles?.full_name || 'User'}&background=random`} className="w-5 h-5 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
                   <span className="text-[12px] font-medium text-zinc-500 truncate">{p.profiles?.full_name || 'Creator'}</span>
                </div>
              </div>
            </div>
          ))}

        </section>
      </div>

      {/* --- WELCOME TO PRO CELEBRATION MODAL --- */}
      {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0a0a0a] border-2 border-[#9cf822] rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-[0_0_50px_-12px_rgba(156,248,34,0.5)] relative overflow-hidden">
            <button onClick={() => setShowWelcome(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
              <X size={20} />
            </button>
            <div className="mb-6 inline-flex p-4 bg-[#9cf822]/20 rounded-full text-[#9cf822] animate-bounce">
              <BadgeCheck size={40} />
            </div>
            <h2 className="text-3xl font-black mb-2 flex items-center justify-center gap-2">
              You're PRO! <Sparkles className="text-[#9cf822]" size={24} />
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium leading-relaxed">
              Welcome to the inner circle. Your badge is live, your search ranking is boosted, and the creative world is watching.
            </p>
            <button 
              onClick={() => setShowWelcome(false)}
              className="w-full py-4 bg-[#9cf822] text-black font-black rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              <PartyPopper size={20} /> Let's Go!
            </button>
          </div>
        </div>
      )}

      {/* INSIGHTS MODAL */}
      {isInsightsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[24px] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Analytics</h3>
              <button onClick={() => setIsInsightsOpen(false)} className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              <div className="p-5 bg-[#9cf822]/5 rounded-2xl border border-[#9cf822]/10 mb-4">
                <p className="text-[10px] font-semibold text-[#9cf822] uppercase tracking-wider mb-1">Total Profile Views</p>
                <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{totalViews}</p>
              </div>
              <div className="space-y-3">
                {viewers.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                    <img src={v.viewer?.avatar_url || `https://ui-avatars.com/api/?name=${v.viewer?.full_name}`} className="w-9 h-9 rounded-full border border-zinc-100 dark:border-zinc-800" />
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{v.viewer?.full_name}</p>
                      <p className="text-[10px] text-zinc-500 font-medium lowercase tracking-tight">{v.viewer?.role || 'Creator'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}