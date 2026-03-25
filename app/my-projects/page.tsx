'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Folder, Users, Plus, Activity, 
  ArrowRight, Settings, Image as ImageIcon,
  Bookmark, BadgeCheck, Zap, Eye, TrendingUp, X, PartyPopper, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

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

      // Check for success flag in URL to show celebration
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
        // Scoped to the specific authenticated user
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
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#9cf822', '#ffffff']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#9cf822', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  useEffect(() => { fetchData(); }, [router, searchParams]);

  // --- SKELETON LOADING STATE ---
  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-black p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <div className="w-48 h-8 bg-zinc-200 dark:bg-zinc-900 rounded animate-pulse mb-2"></div>
            <div className="w-32 h-4 bg-zinc-200 dark:bg-zinc-900 rounded animate-pulse"></div>
          </div>
          <div className="w-32 h-10 bg-zinc-200 dark:bg-zinc-900 rounded-lg animate-pulse"></div>
        </div>
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-900 rounded-2xl animate-pulse"></div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-8 border-b border-zinc-200 dark:border-zinc-900 mb-10 pb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-24 h-6 bg-zinc-200 dark:bg-zinc-900 rounded animate-pulse"></div>
          ))}
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[280px] bg-zinc-200 dark:bg-zinc-900 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white p-6 md:p-10 font-sans selection:bg-[#9cf822] selection:text-black transition-colors duration-500 relative">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-medium tracking-tight">My dashboard</h1>
              {isVerified && <span className="text-[10px] font-bold bg-[#9cf822]/10 text-[#9cf822] px-2 py-0.5 rounded-full border border-[#9cf822]/20 tracking-widest">PRO</span>}
            </div>
            <p className="text-sm text-zinc-500 mt-1">Manage your work and insights.</p>
          </div>
          <button 
            onClick={() => router.push('/create')}
            className="flex items-center gap-2 px-4 py-2 bg-[#9cf822] text-black rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={16}/> <span className="hidden sm:inline">New project</span>
          </button>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <StatCard title="Total projects" value={myProjects.length} />
          <StatCard 
            title="Profile views" 
            value={isVerified ? totalViews : '—'} 
            isPro={isVerified}
            icon={isVerified ? <TrendingUp size={14} className="text-[#9cf822]"/> : null}
          />
          <StatCard title="Active collaborations" value={myCollaborations.filter(c => c.status === 'accepted').length} accent />
        </div>

        {/* RECENT VIEWERS */}
        {isVerified && (
          <section className="mb-16 animate-in fade-in slide-in-from-bottom-2 duration-1000">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                Recent Viewers <Zap size={14} className="text-[#9cf822] fill-[#9cf822]"/>
              </h2>
              <button onClick={() => setIsInsightsOpen(true)} className="text-[11px] font-semibold text-[#9cf822] hover:underline">View All Insights</button>
            </div>
            <div className="bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl overflow-hidden">
              {viewers.length > 0 ? (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                  {viewers.slice(0, 3).map((v, i) => (
                    <div 
                      key={i} 
                      onClick={() => router.push(`/profile/${v.viewer?.id}`)}
                      className="flex items-center justify-between p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <img src={v.viewer?.avatar_url || `https://ui-avatars.com/api/?name=${v.viewer?.full_name}`} className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800" />
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-[#9cf822] transition-colors">{v.viewer?.full_name}</p>
                          <p className="text-xs text-zinc-500">{v.viewer?.role || 'Creator'}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-400 transition-all transform group-hover:translate-x-0.5" />
                    </div>
                  ))}
                </div>
              ) : <div className="p-10 text-center text-xs text-zinc-400">No recent activity.</div>}
            </div>
          </section>
        )}

        {/* TABS NAVIGATION WITH ICONS */}
        <nav className="flex items-center gap-6 sm:gap-8 border-b border-zinc-200 dark:border-zinc-900 mb-10">
          {[
            { id: 'owned', label: 'My projects', icon: Folder },
            { id: 'collaborations', label: 'Collaborations', icon: Users },
            { id: 'saved', label: 'Saved projects', icon: Bookmark }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                title={tab.label}
                className={`pb-4 text-sm font-medium transition-all relative flex items-center gap-2 ${activeTab === tab.id ? 'text-black dark:text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9cf822] rounded-full" />}
              </button>
            );
          })}
        </nav>

        {/* CONTENT GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          
          {/* TAB: OWNED PROJECTS */}
          {activeTab === 'owned' && myProjects.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800/50 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/10">
              <Folder size={32} className="text-zinc-300 dark:text-zinc-700 mb-4" />
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">No projects yet</h3>
              <p className="text-sm text-zinc-500 mb-4">Start building your next big idea today.</p>
              <button onClick={() => router.push('/create')} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold hover:scale-105 transition-transform">
                Create Project
              </button>
            </div>
          )}
          {activeTab === 'owned' && myProjects.map(p => (
            <div key={p.id} className="group bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col">
              <div className="aspect-[16/10] bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                {p.cover_image_url || p.image_url ? (
                  <img src={p.cover_image_url || p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : <ImageIcon size={24} className="text-zinc-300 dark:text-zinc-800" />}
              </div>
              <div className="p-6">
                <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-1 line-clamp-1">{p.title}</h3>
                <p className="text-xs text-zinc-500 line-clamp-1 mb-6 font-normal">{p.description}</p>
                <div className="flex items-center gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800/50">
                  <button onClick={() => router.push(`/studio/${p.id}`)} className="flex-1 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-xs font-semibold rounded-md hover:opacity-90 transition-opacity">Manage</button>
                  <button onClick={() => router.push(`/project/${p.id}`)} className="p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"><Eye size={16}/></button>
                </div>
              </div>
            </div>
          ))}

          {/* TAB: COLLABORATIONS */}
          {activeTab === 'collaborations' && myCollaborations.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800/50 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/10">
              <Users size={32} className="text-zinc-300 dark:text-zinc-700 mb-4" />
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">No active collaborations</h3>
              <p className="text-sm text-zinc-500 mb-4">Apply for projects on the Discover page to join a team.</p>
              <button onClick={() => router.push('/discover')} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold hover:scale-105 transition-transform">
                Browse Projects
              </button>
            </div>
          )}
          {activeTab === 'collaborations' && myCollaborations.map(c => {
            const p = c.projects;
            if (!p) return null;
            return (
              <div key={c.id} className="group bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col">
                <div className="aspect-[16/10] bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden relative">
                  {p.cover_image_url || p.image_url ? (
                    <img src={p.cover_image_url || p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : <ImageIcon size={24} className="text-zinc-300 dark:text-zinc-800" />}
                  <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${c.status === 'accepted' ? 'text-[#9cf822]' : c.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-1 line-clamp-1">{p.title}</h3>
                  <p className="text-xs text-zinc-500 mb-4 font-normal">Role: <span className="text-zinc-800 dark:text-zinc-300 capitalize font-medium">{c.role}</span></p>
                  <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800/50 flex items-center justify-between">
                     <button onClick={() => router.push(`/project/${p.id}`)} className="text-xs font-semibold text-black dark:text-white hover:text-[#9cf822] transition-colors flex items-center gap-1">
                       View Team <ArrowRight size={12}/>
                     </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* TAB: SAVED PROJECTS */}
          {activeTab === 'saved' && savedProjects.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800/50 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/10">
              <Bookmark size={32} className="text-zinc-300 dark:text-zinc-700 mb-4" />
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">No saved projects</h3>
              <p className="text-sm text-zinc-500 mb-4">Hit the bookmark icon on the Discover page to save projects for later.</p>
              <button onClick={() => router.push('/discover')} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold hover:scale-105 transition-transform">
                Explore Discover
              </button>
            </div>
          )}
          {activeTab === 'saved' && savedProjects.map(p => (
            <div key={p.id} className="group bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col">
              <div className="aspect-[16/10] bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden relative">
                {p.cover_image_url || p.image_url ? (
                  <img src={p.cover_image_url || p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : <ImageIcon size={24} className="text-zinc-300 dark:text-zinc-800" />}
                
                {/* Active Bookmark Badge */}
                <div className="absolute top-3 right-3 p-1.5 bg-black/60 backdrop-blur-md rounded-full text-white shadow-lg">
                   <Bookmark size={14} fill="currentColor" className="text-[#9cf822]" />
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-1 line-clamp-1">{p.title}</h3>
                <p className="text-xs text-zinc-500 line-clamp-2 mb-4 font-normal leading-relaxed">{p.description}</p>
                
                <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800/50 flex items-center justify-between">
                  {/* Creator Info Mini-badge */}
                  <div className="flex items-center gap-2">
                     <img src={p.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${p.profiles?.full_name || 'User'}&background=random`} className="w-5 h-5 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
                     <span className="text-[10px] font-medium text-zinc-500 truncate max-w-[100px]">{p.profiles?.full_name || 'Creator'}</span>
                  </div>
                  
                  <button onClick={() => router.push(`/project/${p.id}`)} className="text-[11px] font-bold uppercase tracking-wider text-black dark:text-white hover:text-[#9cf822] transition-colors">
                    View Details
                  </button>
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

      {/* INSIGHTS MODAL (Apple Style) */}
      {isInsightsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
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

function StatCard({ title, value, accent, isPro, icon }: any) {
  return (
    <div className={`p-6 bg-zinc-50/50 dark:bg-zinc-900/40 border rounded-2xl transition-all ${accent ? 'border-[#9cf822]/20' : 'border-zinc-200 dark:border-zinc-800/50'}`}>
      <div className="flex justify-between items-start mb-1">
        <p className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">{title}</p>
        {icon}
      </div>
      <p className={`text-3xl font-semibold ${accent ? 'text-[#9cf822]' : 'text-zinc-900 dark:text-zinc-100'}`}>{value}</p>
    </div>
  );
}