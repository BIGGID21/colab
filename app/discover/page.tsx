'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Search, Bookmark, CheckCircle2, 
  Code, Palette, Megaphone, Bot, Boxes, Smartphone, Star, 
  Briefcase
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
  { name: 'For you', icon: Star },
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
  const [activeCategory, setActiveCategory] = useState('For you');
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

        const enhancedProjects = projectsData.map(project => {
          const projectRoles = rolesData?.filter(r => r.project_id === project.id) || [];
          return { ...project, project_roles: projectRoles };
        });

        setProjects(enhancedProjects);
      }
      setLoading(false);
    }
    
    fetchProjects();
  }, [supabase]);

  const toggleSave = async (e: React.MouseEvent, project: any) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic(10);
    const isSaved = savedProjects.includes(project.id);
    const newSavedProjects = isSaved ? savedProjects.filter(id => id !== project.id) : [...savedProjects, project.id];
    setSavedProjects(newSavedProjects);
    localStorage.setItem('savedProjects', JSON.stringify(newSavedProjects));
    
    // Update backend save count
    const newCount = isSaved ? Math.max(0, (project.save_count || 0) - 1) : (project.save_count || 0) + 1;
    setProjects(current => current.map(p => p.id === project.id ? { ...p, save_count: newCount } : p));
    await supabase.from('projects').update({ save_count: newCount }).eq('id', project.id);
  };

  const filteredProjects = projects
    .filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'For you' || 
        (p.title + ' ' + (p.description || '')).toLowerCase().includes(activeCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] pt-4 px-0">
       <div className="max-w-2xl mx-auto px-4 mt-20">
         <div className="w-48 h-6 bg-zinc-800 rounded animate-pulse mb-2"></div>
         <div className="w-full h-4 bg-zinc-800 rounded animate-pulse mb-6"></div>
         {[1,2,3,4].map(i => (
           <div key={i} className="flex gap-3 py-4 border-b border-zinc-800/50 animate-pulse">
             <div className="w-14 h-14 bg-zinc-800 rounded-sm shrink-0"></div>
             <div className="flex-grow space-y-2">
               <div className="w-3/4 h-5 bg-zinc-800 rounded"></div>
               <div className="w-1/2 h-4 bg-zinc-800 rounded"></div>
               <div className="w-1/3 h-4 bg-zinc-800 rounded mt-2"></div>
             </div>
           </div>
         ))}
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300 pb-24 font-sans text-black dark:text-white">
      
      {/* SEARCH BAR HEADER */}
      <div className="sticky top-0 z-50 bg-white dark:bg-[#0a0a0a] pt-4 sm:pt-6 pb-2 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text"
            placeholder="Start a project search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-[#1a1a1a] border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 rounded-lg text-sm font-medium focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* LINKEDIN STYLE TOP NAVIGATION TABS */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-zinc-200 dark:border-zinc-800/80 px-2 sm:px-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className="flex flex-col items-center gap-1.5 min-w-[72px] py-3 px-2 relative transition-opacity hover:opacity-80"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-[#1a3a1a] dark:bg-[#9cf822]/10' : 'bg-zinc-100 dark:bg-[#1a1a1a]'}`}>
                  <Icon size={18} className={isActive ? 'text-[#5a9a00] dark:text-[#9cf822]' : 'text-zinc-500'} />
                </div>
                <span className={`text-[11px] whitespace-nowrap ${isActive ? 'font-bold text-black dark:text-white' : 'font-medium text-zinc-500'}`}>
                  {cat.name}
                </span>
                {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black dark:bg-white rounded-t-full" />}
              </button>
            );
          })}
        </div>

        {/* FEED HEADER */}
        <div className="px-4 sm:px-6 pt-6 pb-2">
          <h1 className="text-xl font-bold tracking-tight mb-1">Top project picks for you</h1>
          <p className="text-[13px] text-zinc-500 leading-snug">
            Matched to your skills and previous collaboration history.
          </p>
          <div className="mt-4 text-[13px] text-zinc-500 font-medium">
            {filteredProjects.length} active projects
          </div>
        </div>

        {/* JOBS/PROJECTS LIST */}
        <div className="flex flex-col">
          {filteredProjects.map((project) => {
            const displayImage = project.cover_image_url || project.image_url;
            const displayBudget = project.budget || project.valuation || 0;
            const displayEquity = project.equity || project.available_share || 0;
            const openRolesCount = project.project_roles?.filter((r: any) => r.status === 'open' || !r.status).length || 0;
            const isSaved = savedProjects.includes(project.id);
            
            // Format relative time
            const projectDate = new Date(project.created_at);
            const daysAgo = Math.floor((new Date().getTime() - projectDate.getTime()) / (1000 * 3600 * 24));
            let timeString = `${daysAgo}d ago`;
            if (daysAgo === 0) timeString = 'Today';
            if (daysAgo > 30) timeString = `${Math.floor(daysAgo/30)}mo ago`;
            else if (daysAgo > 7) timeString = `${Math.floor(daysAgo/7)}w ago`;

            return (
              <Link 
                href={`/project/${project.id}`} 
                key={project.id} 
                className="flex gap-3 px-4 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-[#121212] transition-colors relative group"
              >
                {/* SQUARE LOGO */}
                <div className="w-14 h-14 shrink-0 bg-zinc-100 dark:bg-[#1a1a1a] rounded flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-800/50 mt-1">
                  {displayImage ? (
                    <img src={displayImage} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-xl font-bold text-zinc-400">{project.title.charAt(0)}</span>
                  )}
                </div>

                {/* CONTENT */}
                <div className="flex flex-col flex-grow min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-[16px] font-bold text-[#0a66c2] dark:text-white leading-snug group-hover:underline decoration-1 underline-offset-2">
                      {project.title}
                    </h3>
                    <button 
                      onClick={(e) => toggleSave(e, project)}
                      className={`p-1.5 -mt-1 -mr-1 rounded-full transition-colors shrink-0 ${isSaved ? 'text-[#057642] dark:text-[#9cf822] bg-[#057642]/10 dark:bg-[#9cf822]/10' : 'text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                      aria-label={isSaved ? "Remove from saved" : "Save for later"}
                    >
                      <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                  </div>
                  
                  <div className="text-[14px] text-zinc-800 dark:text-zinc-200 mt-0.5">
                    {project.profiles?.full_name || 'Project Lead'}
                  </div>
                  
                  <div className="text-[14px] text-zinc-500 mt-0.5 flex items-center gap-1 truncate">
                    Nigeria (Remote)
                  </div>

                  <div className="text-[13px] text-zinc-500 mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5">
                    <span>{getCurrencySymbol(project.currency)}{displayBudget.toLocaleString()} Budget</span>
                    {displayEquity > 0 && <span className="hidden sm:inline"> • </span>}
                    {displayEquity > 0 && <span>{displayEquity}% Equity</span>}
                  </div>

                  {openRolesCount > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <CheckCircle2 size={14} className="text-[#057642] dark:text-[#9cf822] shrink-0" />
                      <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
                        Actively reviewing builders
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] sm:text-[12px] text-zinc-500">
                    {daysAgo < 7 && <span className="text-[#057642] dark:text-[#9cf822] font-semibold">Early applicant</span>}
                    {daysAgo < 7 && <span className="text-zinc-700 dark:text-zinc-500 hidden sm:inline">•</span>}
                    <span>{timeString}</span>
                    <span className="text-zinc-700 dark:text-zinc-500">•</span>
                    <div className="flex items-center gap-1">
                      <Briefcase size={12} className="shrink-0" /> Apply
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {filteredProjects.length === 0 && !loading && (
            <div className="py-20 text-center px-4">
              <h3 className="text-lg font-bold mb-2">No projects found</h3>
              <p className="text-sm text-zinc-500">Try adjusting your filters to find open collaborations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}