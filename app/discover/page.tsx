'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Skeleton from '@/components/Skeleton';
import { 
  Grid, Search, User, 
  Heart, Share2, ArrowUpRight, Bookmark,
  SlidersHorizontal, Flame, Clock,
  ChevronDown, Code, Palette, Megaphone, Bot, Boxes, Smartphone,
  ShieldCheck, Users, MessageSquare, Globe
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
        const { data: rolesData, error: rolesError } = await supabase
          .from('project_roles')
          .select('project_id, status');

        if (rolesError) {
          console.warn("Could not fetch roles. Supabase RLS might be blocking this:", rolesError.message);
        }

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
    e.stopPropagation();
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
    e.stopPropagation();
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
    e.stopPropagation();
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

  // --- NEW SKELETON LOADING STATE ---
  if (loading) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] pt-16 px-4 sm:px-10">
      <div className="max-w-3xl mx-auto space-y-6">
         <div className="h-12 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse mb-8"></div>
         <Skeleton type="feed" count={3} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] transition-colors duration-300 pb-24 relative overflow-hidden font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-10 pt-8 sm:pt-16 mb-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white tracking-tighter flex items-center gap-3">
              Discover
            </h1>
            <p className="text-zinc-500 text-sm md:text-base max-w-md font-medium">
              Explore high-impact projects. Find your next great collaboration.
            </p>
          </div>
        </div>

        {/* SEARCH & SORT HEADER */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text"
              placeholder="Search by title, role, or lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-black dark:text-white focus:outline-none focus:border-[#9cf822] focus:ring-1 focus:ring-[#9cf822] transition-all shadow-sm"
            />
          </div>

          <div className="relative shrink-0 z-20">
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="w-full lg:w-48 flex items-center justify-between px-5 py-3 bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-black dark:text-white hover:border-[#9cf822] transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2">
                {sortBy === 'newest' ? <Clock size={16} className="text-zinc-400" /> : <Flame size={16} className="text-rose-500" />}
                {sortBy === 'newest' ? 'Newest First' : 'Most Popular'}
              </div>
              <ChevronDown size={16} className={`text-zinc-400 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isSortOpen && (
              <div className="absolute top-full right-0 mt-2 w-full bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50">
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

        {/* HORIZONTAL FILTERS */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mask-linear-fade">
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
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border ${
                  activeCategory === cat.name 
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black dark:border-white shadow-md' 
                    : 'bg-white dark:bg-[#121212] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                <Icon size={14} className={activeCategory === cat.name ? '' : 'text-zinc-400'} />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* FEED CONTENT */}
      <div className="max-w-3xl mx-auto px-4 sm:px-0 relative z-10 pb-20">
        {filteredProjects.length === 0 ? (
          <div className="w-full py-24 flex flex-col items-center justify-center text-center bg-white dark:bg-[#121212] rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
            <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
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
          <div className="flex flex-col gap-6">
            {filteredProjects.map((project) => {
              const isLiked = likedProjects.includes(project.id);
              const isSaved = savedProjects.includes(project.id);

              const displayImage = project.cover_image_url || project.image_url;
              const displayBudget = project.budget || project.valuation || 0;
              const displayEquity = project.equity || project.available_share || 0;

              const openRolesCount = project.project_roles?.filter((r: any) => r.status === 'open' || !r.status).length || 0;

              return (
                <div 
                  key={project.id} 
                  className="group bg-white dark:bg-[#121212] sm:rounded-2xl rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col shadow-sm"
                >
                  {/* LINKEDIN-STYLE HEADER */}
                  <div className="p-4 flex items-start justify-between">
                    <Link href={`/profile/${project.user_id}`} className="flex items-center gap-3 group/author">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700 relative flex items-center justify-center">
                        <User size={20} className="text-zinc-400 absolute" />
                        <img 
                          src={project.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${project.profiles?.full_name || 'User'}&backgroundColor=9cf822&fontFamily=Arial&fontWeight=bold`} 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                          className="w-full h-full object-cover relative z-10" 
                          alt="" 
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-black dark:text-white group-hover/author:text-[#9cf822] transition-colors flex items-center gap-1">
                          {project.profiles?.full_name || 'Project Lead'}
                          <span className="text-zinc-400 text-xs font-normal">• 1st</span>
                        </span>
                        <span className="text-xs text-zinc-500 capitalize line-clamp-1">
                          {project.profiles?.role || 'Founder'}
                        </span>
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                           {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})} • <Globe size={10} />
                        </span>
                      </div>
                    </Link>
                    
                    <button className="text-zinc-400 hover:text-black dark:hover:text-white p-1">
                       {/* Context menu icon could go here */}
                    </button>
                  </div>

                  {/* POST CONTENT */}
                  <Link href={`/project/${project.id}`} className="px-4 pb-3 flex flex-col cursor-pointer">
                    <h3 className="text-base font-bold text-black dark:text-white tracking-tight mb-1 group-hover:text-[#9cf822] transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                      {project.description || "Looking for strategic partners to scale development and market reach."}
                    </p>
                  </Link>

                  {/* FULL WIDTH MEDIA */}
                  <Link href={`/project/${project.id}`} className="w-full bg-zinc-100 dark:bg-zinc-900 aspect-video relative overflow-hidden block cursor-pointer">
                    {displayImage ? (
                      <img src={displayImage} className="w-full h-full object-cover" alt={project.title} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-2">
                        <Grid size={32} strokeWidth={1.5} />
                        <span className="text-xs font-medium uppercase tracking-widest">No Media</span>
                      </div>
                    )}
                  </Link>

                  {/* BADGES / DATA ROW */}
                  <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/50">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <div className="flex items-center gap-1 px-2 py-1 bg-[#9cf822]/10 text-[#5a9a00] dark:text-[#9cf822] rounded text-[11px] font-bold">
                        <ShieldCheck size={12} strokeWidth={2.5} /> Secured
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded text-[11px] font-bold">
                        <Users size={12} strokeWidth={2.5} /> {openRolesCount} Open {openRolesCount === 1 ? 'Role' : 'Roles'}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs font-bold text-black dark:text-white">
                       <span>Budget: <span className="text-zinc-500 font-medium">{getCurrencySymbol(project.currency)}{displayBudget.toLocaleString()}</span></span>
                       <span className="text-zinc-300 dark:text-zinc-700">•</span>
                       <span>Equity: <span className="text-zinc-500 font-medium">{displayEquity}%</span></span>
                    </div>
                  </div>

                  {/* LINKEDIN-STYLE ACTION BAR */}
                  <div className="px-2 py-1 flex items-center justify-between">
                    <button 
                      onClick={(e) => toggleLike(e, project)} 
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-colors ${
                        isLiked 
                          ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' 
                          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                      <span>{project.like_count > 0 ? project.like_count : 'Like'}</span>
                    </button>

                    <Link 
                      href={`/project/${project.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <MessageSquare size={18} />
                      <span>Comment</span>
                    </Link>

                    <button 
                      onClick={(e) => toggleSave(e, project)} 
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-colors ${
                        isSaved 
                          ? 'text-[#9cf822] bg-[#9cf822]/10' 
                          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
                      <span>Save</span>
                    </button>

                    <button 
                      onClick={(e) => handleShare(e, project)} 
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Share2 size={18} />
                      <span>Share</span>
                    </button>
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