'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Loader2, Grid, Search, User, 
  Heart, Share2, ArrowUpRight, Bookmark,
  Percent, Banknote, Sparkles, Filter
} from 'lucide-react';
import Link from 'next/link';

const getCurrencySymbol = (currency: string) => {
  switch (currency?.toUpperCase()) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'NGN': return '₦';
    case 'USD': 
    default: return '$';
  }
};

export default function DiscoverPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [likedProjects, setLikedProjects] = useState<string[]>([]);
  const [savedProjects, setSavedProjects] = useState<string[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(pattern);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLikedProjects(JSON.parse(localStorage.getItem('likedProjects') || '[]'));
      setSavedProjects(JSON.parse(localStorage.getItem('savedProjects') || '[]'));
    }

    async function fetchProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select(`*, profiles:user_id(full_name, avatar_url, role)`)
        .order('created_at', { ascending: false });
      
      if (!error) setProjects(data || []);
      setLoading(false);
    }
    fetchProjects();

    const channel = supabase
      .channel('public:projects')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'projects' }, (payload) => {
        setProjects((currentProjects) => 
          currentProjects.map((p) => p.id === payload.new.id ? { ...p, ...payload.new } : p)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const toggleLike = async (e: React.MouseEvent, project: any) => {
    e.preventDefault();
    triggerHaptic(10);
    const isLiked = likedProjects.includes(project.id);
    const newLikedProjects = isLiked ? likedProjects.filter(id => id !== project.id) : [...likedProjects, project.id];
    setLikedProjects(newLikedProjects);
    localStorage.setItem('likedProjects', JSON.stringify(newLikedProjects));
    const newCount = isLiked ? Math.max(0, (project.like_count || 0) - 1) : (project.like_count || 0) + 1;
    setProjects(current => current.map(p => p.id === project.id ? { ...p, like_count: newCount } : p));
    await supabase.from('projects').update({ like_count: newCount }).eq('id', project.id);
  };

  const toggleSave = async (e: React.MouseEvent, project: any) => {
    e.preventDefault();
    triggerHaptic(10);
    const isSaved = savedProjects.includes(project.id);
    const newSavedProjects = isSaved ? savedProjects.filter(id => id !== project.id) : [...savedProjects, project.id];
    setSavedProjects(newSavedProjects);
    localStorage.setItem('savedProjects', JSON.stringify(newSavedProjects));
    const newCount = isSaved ? Math.max(0, (project.save_count || 0) - 1) : (project.save_count || 0) + 1;
    setProjects(current => current.map(p => p.id === project.id ? { ...p, save_count: newCount } : p));
    await supabase.from('projects').update({ save_count: newCount }).eq('id', project.id);
  };

  const handleShare = async (e: React.MouseEvent, project: any) => {
    e.preventDefault();
    triggerHaptic([10, 30]);
    const newCount = (project.share_count || 0) + 1;
    setProjects(current => current.map(p => p.id === project.id ? { ...p, share_count: newCount } : p));
    await supabase.from('projects').update({ share_count: newCount }).eq('id', project.id);
    navigator.clipboard.writeText(`${window.location.origin}/project/${project.id}`);
    alert("Link copied!");
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><Loader2 className="animate-spin text-[#9cf822]" /></div>;

  return (
    // UPDATED: Changed bg-zinc-50 to bg-white and dark:bg-[#050505] to dark:bg-black
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 pb-24">
      
      {/* Search Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-10 pt-8 sm:pt-16 mb-8 sm:mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-bold text-black dark:text-white tracking-tight flex items-center gap-3">
              Discover <Sparkles className="text-[#9cf822]" size={28} />
            </h1>
            <p className="text-zinc-500 text-sm md:text-base max-w-md">Browse high-impact projects looking for early collaborators.</p>
          </div>
          
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text"
              placeholder="Search by title, role, or lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9cf822]/20 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-0 sm:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-8 lg:gap-10">
          {filteredProjects.map((project) => {
            const isLiked = likedProjects.includes(project.id);
            const isSaved = savedProjects.includes(project.id);

            return (
              <div 
                key={project.id} 
                className="group bg-white dark:bg-[#0a0a0a] sm:rounded-[2.5rem] border-b sm:border border-zinc-200 dark:border-zinc-900 overflow-hidden flex flex-col transition-all duration-500 sm:hover:shadow-2xl sm:hover:-translate-y-1"
              >
                {/* Visual Area */}
                <div className="aspect-[16/10] sm:aspect-[4/3] relative overflow-hidden sm:m-4 sm:rounded-[1.8rem] z-10">
                  <Link href={`/project/${project.id}`} className="absolute inset-0 z-20" />
                  {project.image_url ? (
                    <img src={project.image_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={project.title} />
                  ) : (
                    <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-300"><Grid size={48} strokeWidth={1} /></div>
                  )}
                  
                  {/* Glassmorphism Badge */}
                  <div className="absolute top-4 left-4 z-30 px-3 py-1.5 backdrop-blur-md bg-black/40 border border-white/10 rounded-full flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#9cf822] animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Active</span>
                  </div>
                </div>

                <div className="px-5 sm:px-8 pb-8 pt-4 sm:pt-2 space-y-6">
                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-black dark:text-white tracking-tight line-clamp-1 group-hover:text-[#5a9a00] dark:group-hover:text-[#9cf822] transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">
                      {project.description || "Looking for strategic partners to scale development and market reach."}
                    </p>
                  </div>

                  {/* Budget/Share Info */}
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Budget Range</span>
                      <p className="text-base font-bold text-black dark:text-white">
                        {getCurrencySymbol(project.currency)}{project.valuation?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
                    <div className="space-y-0.5 text-right">
                      <span className="text-[10px] font-bold text-[#5a9a00] dark:text-[#9cf822] uppercase tracking-tight">Equity/Share</span>
                      <p className="text-base font-bold text-black dark:text-white">
                        {project.available_share || 45}%
                      </p>
                    </div>
                  </div>

                  {/* User Profile Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0">
                        {project.profiles?.avatar_url ? (
                          <img src={project.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <User size={16} className="m-auto mt-2 text-zinc-400" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-black dark:text-white leading-none">
                          {project.profiles?.full_name || 'Lead'}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-medium">
                          {project.profiles?.role || 'Founder'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => toggleLike(e, project)} className={`p-2 transition-all ${isLiked ? 'text-rose-500' : 'text-zinc-400 hover:scale-110'}`}>
                        <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                      </button>
                      <button onClick={(e) => toggleSave(e, project)} className={`p-2 transition-all ${isSaved ? 'text-[#9cf822]' : 'text-zinc-400 hover:scale-110'}`}>
                        <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
                      </button>
                      <button onClick={(e) => handleShare(e, project)} className="p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-all">
                        <Share2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link 
                    href={`/project/${project.id}`}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-black text-white dark:bg-white dark:text-black rounded-2xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-black/10 dark:shadow-white/5"
                  >
                    View Details <ArrowUpRight size={18} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}