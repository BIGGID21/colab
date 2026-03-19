'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Loader2, Grid, Search, User, 
  Heart, Share2, ArrowUpRight, Bookmark,
  SlidersHorizontal, Flame, Clock,
  ChevronDown, Code, Palette, Megaphone, Bot, Boxes, Smartphone,
  ShieldCheck, Users
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

const CATEGORIES = [
  { name: 'All', icon: Grid },
  { name: 'Tech', icon: Code },
  { name: 'Design', icon: Palette },
  { name: 'Marketing', icon: Megaphone },
  { name: 'AI', icon: Bot },
  { name: 'Web3', icon: Boxes },
  { name: 'Mobile', icon: Smartphone }
];

export default function DiscoverPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [isSortOpen, setIsSortOpen] = useState(false);
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
      // 1. Primary Query: Fetch projects without the problematic join
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`*, profiles:user_id(full_name, avatar_url, role)`)
        .order('created_at', { ascending: false });
      
      if (projectsError) {
        console.error("Error fetching projects:", projectsError);
        setLoading(false);
        return;
      }

      if (projectsData) {
        // 2. Secondary Query: Fetch roles independently (Graceful Degradation)
        const { data: rolesData, error: rolesError } = await supabase
          .from('project_roles')
          .select('project_id, status');

        if (rolesError) {
          console.warn("Could not fetch roles. Supabase RLS might be blocking this:", rolesError.message);
        }

        // 3. Merge: Attach roles to their respective projects safely
        const enhancedProjects = projectsData.map(project => {
          const projectRoles = rolesData?.filter(r => r.project_id === project.id) || [];
          return { ...project, project_roles: projectRoles };
        });

        setProjects(enhancedProjects);
      }
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

  const filteredProjects = projects
    .filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || 
        (p.title + ' ' + (p.description || '')).toLowerCase().includes(activeCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return (b.like_count || 0) - (a.like_count || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><Loader2 className="animate-spin text-[#9cf822]" /></div>;

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 pb-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-10 pt-8 sm:pt-16 mb-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-black text-black dark:text-white tracking-tighter flex items-center gap-3">
              Discover
            </h1>
            <p className="text-zinc-500 text-sm md:text-base max-w-md font-medium">
              Explore high-impact projects. Find your next great collaboration.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text"
              placeholder="Search by title, role, or lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-zinc-50/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-medium text-black dark:text-white focus:outline-none focus:border-[#9cf822] focus:ring-1 focus:ring-[#9cf822] transition-all shadow-sm"
            />
          </div>

          <div className="relative shrink-0 z-20">
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="w-full lg:w-48 flex items-center justify-between px-5 py-3.5 bg-zinc-50/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-black dark:text-white hover:border-[#9cf822] transition-colors"
            >
              <div className="flex items-center gap-2">
                {sortBy === 'newest' ? <Clock size={16} className="text-[#9cf822]" /> : <Flame size={16} className="text-rose-500" />}
                {sortBy === 'newest' ? 'Newest First' : 'Most Popular'}
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isSortOpen && (
              <div className="absolute top-full right-0 mt-2 w-full bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
                <button 
                  onClick={() => { setSortBy('newest'); setIsSortOpen(false); }}
                  className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors flex items-center gap-2 ${sortBy === 'newest' ? 'bg-zinc-50 dark:bg-zinc-900 text-[#9cf822]' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white'}`}
                >
                  <Clock size={16} /> Newest First
                </button>
                <button 
                  onClick={() => { setSortBy('popular'); setIsSortOpen(false); }}
                  className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors flex items-center gap-2 ${sortBy === 'popular' ? 'bg-zinc-50 dark:bg-zinc-900 text-rose-500' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white'}`}
                >
                  <Flame size={16} /> Most Popular
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-linear-fade">
          <div className="flex items-center gap-2 px-1 text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 pr-4 mr-2 shrink-0">
             <SlidersHorizontal size={16} />
             <span className="text-xs font-bold">Filter</span>
          </div>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`shrink-0 flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                  activeCategory === cat.name 
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' 
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon size={14} className={activeCategory === cat.name ? '' : 'text-zinc-500'} />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-10 relative z-10">
        {filteredProjects.length === 0 ? (
          <div className="w-full py-24 flex flex-col items-center justify-center text-center bg-zinc-50 dark:bg-zinc-900/20 rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
              <Search className="text-zinc-400" size={32} />
            </div>
            <h3 className="text-2xl font-black text-black dark:text-white mb-2 tracking-tight">No projects found</h3>
            <p className="text-zinc-500 max-w-sm font-medium mb-6">We couldn't find any projects matching your current filters.</p>
            <button 
              onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-bold hover:scale-105 transition-transform"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProjects.map((project) => {
              const isLiked = likedProjects.includes(project.id);
              const isSaved = savedProjects.includes(project.id);

              const displayImage = project.cover_image_url || project.image_url;
              const displayBudget = project.budget || project.valuation || 0;
              const displayEquity = project.equity || project.available_share || 0;

              // Calculate open roles safely
              const openRolesCount = project.project_roles?.filter((r: any) => r.status === 'open' || !r.status).length || 0;

              return (
                <div 
                  key={project.id} 
                  className="group bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl hover:shadow-[#9cf822]/5 hover:-translate-y-1 hover:border-zinc-300 dark:hover:border-zinc-700"
                >
                  <div className="aspect-[4/3] relative overflow-hidden m-2 sm:m-3 rounded-[2rem] z-10 bg-zinc-100 dark:bg-zinc-900">
                    <Link href={`/project/${project.id}`} className="absolute inset-0 z-20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 z-10 opacity-60 group-hover:opacity-40 transition-opacity" />

                    {displayImage ? (
                      <img src={displayImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={project.title} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                        <Grid size={48} strokeWidth={1} />
                      </div>
                    )}
                    
                    <div className="absolute top-4 left-4 z-30 px-3 py-1.5 backdrop-blur-md bg-black/40 border border-white/10 rounded-full flex items-center gap-2 shadow-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#9cf822] animate-pulse shadow-[0_0_8px_#9cf822]" />
                      <span className="text-[9px] font-black text-white">Active</span>
                    </div>

                    <button 
                      onClick={(e) => toggleLike(e, project)} 
                      className="absolute top-4 right-4 z-30 px-3 py-1.5 backdrop-blur-md bg-black/40 border border-white/10 rounded-full text-white hover:bg-black/60 transition-colors shadow-lg flex items-center gap-1.5"
                    >
                      <Heart size={14} fill={isLiked ? "#f43f5e" : "none"} className={isLiked ? "text-rose-500" : ""} />
                      <span className="text-[10px] font-bold tracking-wider">{project.like_count || 0}</span>
                    </button>
                  </div>

                  <div className="px-6 pb-6 pt-2 flex flex-col flex-grow">
                    <div className="space-y-1.5 mb-4 flex-grow">
                      <h3 className="text-xl font-black text-black dark:text-white tracking-tight line-clamp-1 group-hover:text-[#5a9a00] dark:group-hover:text-[#9cf822] transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed font-medium">
                        {project.description || "Looking for strategic partners to scale development and market reach."}
                      </p>
                    </div>

                    {/* NEW TAGS SECTION */}
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#9cf822]/10 border border-[#9cf822]/20 text-[#5a9a00] dark:text-[#9cf822] rounded-lg text-[10px] font-black">
                        <ShieldCheck size={12} strokeWidth={2.5} /> Payment Secured
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-[10px] font-black">
                        <Users size={12} strokeWidth={2.5} /> {openRolesCount} {openRolesCount === 1 ? 'Role' : 'Roles'} Available
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-6">
                      <div className="bg-zinc-50 dark:bg-zinc-900/80 rounded-2xl p-3 border border-zinc-100 dark:border-zinc-800">
                        <span className="block text-[10px] font-black text-zinc-400 mb-1">Budget</span>
                        <span className="block text-sm font-black text-black dark:text-white truncate">
                          {getCurrencySymbol(project.currency)}{displayBudget.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-zinc-50 dark:bg-[#9cf822]/5 rounded-2xl p-3 border border-zinc-100 dark:border-[#9cf822]/20">
                        <span className="block text-[10px] font-black text-[#5a9a00] dark:text-[#9cf822] mb-1">Equity/Share</span>
                        <span className="block text-sm font-black text-black dark:text-white">
                          {displayEquity}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                          {project.profiles?.avatar_url ? (
                            <img src={project.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <User size={16} className="m-auto mt-2.5 text-zinc-400" />
                          )}
                        </div>
                        <div className="flex flex-col truncate pr-2">
                          <span className="text-xs font-black text-black dark:text-white truncate">
                            {project.profiles?.full_name || 'Project Lead'}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-500 truncate capitalize">
                            {project.profiles?.role || 'Founder'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={(e) => toggleSave(e, project)} className={`p-2 rounded-full transition-all ${isSaved ? 'text-[#9cf822] bg-[#9cf822]/10' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
                          <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
                        </button>
                        <button onClick={(e) => handleShare(e, project)} className="p-2 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white transition-all">
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}