'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Folder, Users, Plus, Activity, 
  ArrowRight, Settings, Image as ImageIcon,
  Bookmark, BadgeCheck, Zap, Eye, TrendingUp, X, PartyPopper, Sparkles,
  LayoutGrid
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatDistanceToNow } from 'date-fns';

// Helper to generate consistent, vibrant SpaceWork-style gradients
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
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0a0a0a] p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex justify-between items-center">
          <div>
            <div className="w-48 h-8 bg-zinc-200 dark:bg-zinc-900 rounded-lg animate-pulse mb-2"></div>
            <div className="w-32 h-4 bg-zinc-200 dark:bg-zinc-900 rounded animate-pulse"></div>
          </div>
          <div className="w-32 h-10 bg-zinc-200 dark:bg-zinc-900 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-900 rounded-[20px] animate-pulse"></div>)}
        </div>
        <div className="w-72 h-12 bg-zinc-200 dark:bg-zinc-900 rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-[280px] bg-zinc-200 dark:bg-zinc-900 rounded-3xl animate-pulse"></div>)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0a0a0a] text-zinc-900 dark:text-white p-6 md:p-10 font-sans selection:bg-[#9cf822] selection:text-black transition-colors duration-500 relative">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[28px] font-bold tracking-tight text-black dark:text-white">My dashboard</h1>
              {isVerified && <span className="text-[10px] font-bold bg-[#9cf822]/10 text-[#9cf822] px-2 py-0.5 rounded-full border border-[#9cf822]/20 tracking-widest translate-y-0.5">PRO</span>}
            </div>
            <p className="text-[15px] text-zinc-500 mt-1">Manage your work and insights.</p>
          </div>
          <button 
            onClick={() => router.push('/create')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#9cf822] text-black rounded-xl text-sm font-bold shadow-[0_8px_20px_rgba(156,248,34,0.25)] hover:scale-105 transition-transform"
          >
            <Plus size={18} strokeWidth={2.5}/> <span className="hidden sm:inline">New project</span>
          </button>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <StatCard title="Total projects" value={myProjects.length} />
          <StatCard 
            title="Profile views" 
            value={isVerified ? totalViews : '—'} 
            isPro={isVerified}
            icon={isVerified ? <TrendingUp size={16} className="text-[#9cf822]"/> : null}
            onClick={() => isVerified && setIsInsightsOpen(true)}
            clickable={isVerified}
          />
          <StatCard title="Active collaborations" value={myCollaborations.filter(c => c.status === 'accepted').length} accent />
        </div>

        {/* RECENT VIEWERS (Only visible to PRO) */}
        {isVerified && viewers.length > 0 && (
          <section className="mb-12 animate-in fade-in slide-in-from-bottom-2 duration-1000">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                Recent Viewers <Zap size={14} className="text-[#9cf822] fill-[#9cf822]"/>
              </h2>
            </div>
            <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800/80 rounded-[20px] shadow-sm overflow-hidden">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {viewers.slice(0, 3).map((v, i) => (
                    <div 
                      key={i} 
                      onClick={() => router.push(`/profile/${v.viewer?.id}`)}
                      className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <img src={v.viewer?.avatar_url || `https://ui-avatars.com/api/?name=${v.viewer?.full_name}`} className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800" />
                        <div>
                          <p className="text-[15px] font-bold text-zinc-900 dark:text-white group-hover:text-[#9cf822] transition-colors">{v.viewer?.full_name}</p>
                          <p className="text-xs text-zinc-500">{v.viewer?.role || 'Creator'}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-400 transition-all transform group-hover:translate-x-1" />
                    </div>
                  ))}
                </div>
            </div>
          </section>
        )}

        {/* SPACEWORK STYLE SEGMENTED PILLS */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <div className="flex items-center p-1.5 bg-zinc-100 dark:bg-zinc-900/60 rounded-xl overflow-x-auto no-scrollbar">
            {[
              { id: 'owned', label: 'By me', count: myProjects.length },
              { id: 'collaborations', label: 'Collaborations', count: myCollaborations.length },
              { id: 'saved', label: 'Saved', count: savedProjects.length }
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-5 py-2 text-[14px] font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-2
                  ${activeTab === tab.id 
                    ? 'bg-white text-black dark:bg-[#1f1f1f] dark:text-white shadow-[0_2px_10px_rgba(0,0,0,0.04)]' 
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT GRID - SPACEWORK CARD STYLE */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 gap-y-10 pb-20">
          
          {/* TAB: OWNED PROJECTS */}
          {activeTab === 'owned' && myProjects.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                <Folder size={28} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-1">Create your first project</h3>
              <p className="text-sm text-zinc-500 mb-6 max-w-sm">Bring your ideas to life and start collaborating.</p>
              <button onClick={() => router.push('/create')} className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:scale-105 transition-transform shadow-lg">
                Start Building
              </button>
            </div>
          )}
          {activeTab === 'owned' && myProjects.map(p => (
            <div key={p.id} className="group cursor-pointer flex flex-col">
              {/* Card Thumbnail */}
              <div className={`aspect-[16/10] rounded-[24px] overflow-hidden relative shadow-sm group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 bg-gradient-to-br ${getVibrantGradient(p.id)}`}>
                {p.cover_image_url || p.image_url ? (
                  <img src={p.cover_image_url || p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                    <span className="text-white/90 font-black text-2xl tracking-tight leading-tight mix-blend-overlay drop-shadow-sm">{p.title}</span>
                  </div>
                )}
                
                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                   <button onClick={(e) => { e.stopPropagation(); router.push(`/studio/${p.id}`); }} className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:scale-105 transition-transform shadow-xl">Manage</button>
                   <button onClick={(e) => { e.stopPropagation(); router.push(`/project/${p.id}`); }} className="p-2.5 bg-black/60 text-white rounded-full hover:bg-black transition-colors shadow-xl backdrop-blur-md"><Eye size={18}/></button>
                </div>
              </div>
              
              {/* Card Metadata Below */}
              <div className="pt-4 px-1">
                <h3 className="font-bold text-[17px] text-black dark:text-white leading-tight mb-1 truncate group-hover:text-[#9cf822] transition-colors">{p.title}</h3>
                <p className="text-[13px] text-zinc-500 font-medium">Updated {formatDistanceToNow(new Date(p.created_at))} ago</p>
              </div>
            </div>
          ))}

          {/* TAB: COLLABORATIONS */}
          {activeTab === 'collaborations' && myCollaborations.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                <Users size={28} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-1">No active collaborations</h3>
              <p className="text-sm text-zinc-500 mb-6 max-w-sm">Apply for projects on the Discover page to join a team.</p>
              <button onClick={() => router.push('/discover')} className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:scale-105 transition-transform shadow-lg">
                Browse Projects
              </button>
            </div>
          )}
          {activeTab === 'collaborations' && myCollaborations.map(c => {
            const p = c.projects;
            if (!p) return null;
            return (
              <div key={c.id} onClick={() => router.push(`/project/${p.id}`)} className="group cursor-pointer flex flex-col">
                <div className={`aspect-[16/10] rounded-[24px] overflow-hidden relative shadow-sm group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 bg-gradient-to-br ${getVibrantGradient(p.id)}`}>
                  {p.cover_image_url || p.image_url ? (
                    <img src={p.cover_image_url || p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                      <span className="text-white/90 font-black text-2xl tracking-tight leading-tight mix-blend-overlay drop-shadow-sm">{p.title}</span>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full shadow-lg">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${c.status === 'accepted' ? 'text-[#9cf822]' : c.status === 'rejected' ? 'text-rose-400' : 'text-amber-400'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 px-1">
                  <h3 className="font-bold text-[17px] text-black dark:text-white leading-tight mb-1 truncate group-hover:text-[#9cf822] transition-colors">{p.title}</h3>
                  <p className="text-[13px] text-zinc-500 font-medium capitalize">
                    Role: <span className="text-black dark:text-white">{c.role}</span>
                  </p>
                </div>
              </div>
            );
          })}

          {/* TAB: SAVED PROJECTS */}
          {activeTab === 'saved' && savedProjects.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                <Bookmark size={28} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-1">No saved projects</h3>
              <p className="text-sm text-zinc-500 mb-6 max-w-sm">Hit the bookmark icon on the Discover page to save projects for later.</p>
              <button onClick={() => router.push('/discover')} className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:scale-105 transition-transform shadow-lg">
                Explore Discover
              </button>
            </div>
          )}
          {activeTab === 'saved' && savedProjects.map(p => (
            <div key={p.id} onClick={() => router.push(`/project/${p.id}`)} className="group cursor-pointer flex flex-col">
              <div className={`aspect-[16/10] rounded-[24px] overflow-hidden relative shadow-sm group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 bg-gradient-to-br ${getVibrantGradient(p.id)}`}>
                {p.cover_image_url || p.image_url ? (
                  <img src={p.cover_image_url || p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                    <span className="text-white/90 font-black text-2xl tracking-tight leading-tight mix-blend-overlay drop-shadow-sm">{p.title}</span>
                  </div>
                )}
                
                {/* Active Bookmark Badge */}
                <div className="absolute top-4 right-4 p-2.5 bg-black/60 backdrop-blur-md rounded-full text-white shadow-xl hover:scale-110 transition-transform">
                   <Bookmark size={16} fill="currentColor" className="text-[#9cf822]" />
                </div>
              </div>
              
              <div className="pt-4 px-1 flex items-start justify-between">
                <div className="min-w-0 flex-1 pr-4">
                  <h3 className="font-bold text-[17px] text-black dark:text-white leading-tight mb-1.5 truncate group-hover:text-[#9cf822] transition-colors">{p.title}</h3>
                  <div className="flex items-center gap-2">
                     <img src={p.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${p.profiles?.full_name || 'User'}&background=random`} className="w-5 h-5 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
                     <span className="text-[12px] font-medium text-zinc-500 truncate">{p.profiles?.full_name || 'Creator'}</span>
                  </div>
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
          <div className="bg-white dark:bg-[#111] w-full max-w-sm rounded-[24px] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
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

// SPACEWORK STYLE STAT CARD
function StatCard({ title, value, accent, isPro, icon, onClick, clickable }: any) {
  return (
    <div 
      onClick={onClick}
      className={`p-6 bg-white dark:bg-[#111] rounded-[20px] transition-all border
        ${accent ? 'border-[#9cf822]/30 shadow-[0_4px_20px_rgba(156,248,34,0.08)]' : 'border-zinc-200 dark:border-zinc-800/80 shadow-sm'}
        ${clickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="text-zinc-400 dark:text-zinc-500 text-[11px] font-bold uppercase tracking-widest">{title}</p>
        {icon}
      </div>
      <p className={`text-[32px] font-black tracking-tight ${accent ? 'text-[#9cf822]' : 'text-zinc-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}