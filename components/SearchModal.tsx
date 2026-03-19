'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Search, X, Command, Rocket, User, ArrowRight, 
  Loader2, Sparkles, LayoutGrid, Zap, Briefcase, BadgeCheck 
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ projects: any[], profiles: any[] }>({ projects: [], profiles: [] });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Haptic Feedback Helper for Mobile
  const triggerHaptic = (pattern: number = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  // Real-time Supabase Search with Debounce
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults({ projects: [], profiles: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const performSearch = async () => {
      try {
        const searchQuery = `%${query}%`;

        // 1. Search Projects (by title or description)
        const { data: projects } = await supabase
          .from('projects')
          .select('id, title, description, budget, equity, currency, image_url, cover_image_url')
          .or(`title.ilike.${searchQuery},description.ilike.${searchQuery}`)
          .limit(4);

        // 2. Search Profiles (by name, role, or skills)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, role, avatar_url, is_verified')
          .or(`full_name.ilike.${searchQuery},role.ilike.${searchQuery},skills.ilike.${searchQuery}`)
          .limit(4);

        setResults({
          projects: projects || [],
          profiles: profiles || []
        });
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    // 400ms debounce to prevent spamming the database on every keystroke
    const timer = setTimeout(() => {
      performSearch();
    }, 400);

    return () => clearTimeout(timer);
  }, [query, supabase]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleNavigate = (path: string) => {
    triggerHaptic(20);
    onClose();
    router.push(path);
  };

  if (!isOpen) return null;

  const hasResults = results.projects.length > 0 || results.profiles.length > 0;

  return (
    <div 
      className="fixed inset-0 z-[300] flex items-start justify-center pt-[12vh] px-4 bg-zinc-950/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-top-4 duration-500 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple-style Search Bar */}
        <div className="flex items-center px-8 py-6 gap-4 border-b border-zinc-100 dark:border-zinc-900 shrink-0">
          <Search size={20} className="text-zinc-400 shrink-0" />
          <input 
            autoFocus
            placeholder="Search ventures, roles, or skills..."
            className="flex-grow bg-transparent text-lg font-medium outline-none text-black dark:text-white placeholder:text-zinc-400"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              triggerHaptic(5);
            }}
          />
          <div className="flex items-center gap-3 shrink-0">
            {isSearching ? (
              <Loader2 size={18} className="animate-spin text-zinc-400" />
            ) : (
              <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[11px] font-bold text-zinc-400">
                <Command size={10} /> Esc
              </div>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-all text-zinc-400 hover:text-black dark:hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Dynamic Results Content */}
        <div className="overflow-y-auto p-4 custom-scrollbar flex-grow">
          {query.length === 0 ? (
            <div className="py-8 space-y-6">
              <div className="px-4">
                <p className="text-xs font-bold text-zinc-400 mb-4">Quick Navigation</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Branding', icon: Rocket, color: 'text-blue-500' },
                    { label: 'Designers', icon: User, color: 'text-purple-500' },
                    { label: 'Tech Stack', icon: Zap, color: 'text-orange-500' },
                    { label: 'Founders', icon: Sparkles, color: 'text-[#9cf822]' }
                  ].map((item) => (
                    <button 
                      key={item.label} 
                      onClick={() => {
                        triggerHaptic(10);
                        setQuery(item.label); // Acts as a quick search shortcut
                      }}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 transition-all text-left group"
                    >
                      <item.icon size={18} className={`${item.color} group-hover:scale-110 transition-transform`} />
                      <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 p-2">
              {!isSearching && !hasResults && query.length > 0 && (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <Search size={32} className="text-zinc-300 dark:text-zinc-700 mb-3" />
                  <p className="text-sm font-bold text-black dark:text-white">No results found</p>
                  <p className="text-xs text-zinc-500 mt-1">Try searching for different keywords</p>
                </div>
              )}

              {/* People Results */}
              {results.profiles.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-zinc-400 mb-3 px-2">People</p>
                  <div className="space-y-1">
                    {results.profiles.map((profile) => (
                      <div 
                        key={profile.user_id}
                        onClick={() => handleNavigate(`/profile/${profile.user_id}`)}
                        className="p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 flex items-center justify-between group cursor-pointer transition-all border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0">
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <User size={16} className="m-auto mt-2.5 text-zinc-400" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="text-sm font-bold text-black dark:text-white truncate flex items-center gap-1.5">
                              {profile.full_name || 'Anonymous User'}
                              {profile.is_verified && <BadgeCheck size={14} fill="#9cf822" className="text-white dark:text-black shrink-0" />}
                            </p>
                            <p className="text-[11px] text-zinc-500 font-medium capitalize truncate">{profile.role || 'Member'}</p>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Results */}
              {results.projects.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-zinc-400 mb-3 px-2">Ventures</p>
                  <div className="space-y-1">
                    {results.projects.map((project) => (
                      <div 
                        key={project.id}
                        onClick={() => handleNavigate(`/project/${project.id}`)}
                        className="p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 flex items-center justify-between group cursor-pointer transition-all border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                            {project.cover_image_url || project.image_url ? (
                              <img src={project.cover_image_url || project.image_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <Briefcase size={20} className="text-zinc-400" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 pr-4">
                            <p className="text-sm font-bold text-black dark:text-white truncate">{project.title}</p>
                            <p className="text-[11px] text-zinc-500 font-medium truncate">
                              Active Venture {(project.equity || project.budget) && '•'} {project.equity && `Equity ${project.equity}%`} {project.budget && `Budget ${project.budget}`}
                            </p>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-8 py-4 bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <LayoutGrid size={12} className="text-zinc-400" />
            <span className="text-[10px] font-bold text-zinc-400">CoLab Search v1.2</span>
          </div>
          <p className="text-[10px] font-medium text-zinc-400 italic">Collaborate and build the future.</p>
        </div>
      </div>
    </div>
  );
}