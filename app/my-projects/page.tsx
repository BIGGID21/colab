'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Folder, Users, Plus, Activity, 
  Clock, ArrowRight, Settings, Image as ImageIcon,
  Bookmark // Added Bookmark icon for the new empty state
} from 'lucide-react';

export default function MyProjectsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'owned' | 'collaborations' | 'saved'>('owned'); // Added 'saved' tab
  
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [myCollaborations, setMyCollaborations] = useState<any[]>([]);
  const [savedProjects, setSavedProjects] = useState<any[]>([]); // New state for saved projects
  const [user, setUser] = useState<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push('/login');
          return;
        }
        setUser(authUser);

        // Fetch projects the user owns
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        setMyProjects(projectsData || []);

        // Fetch projects the user is collaborating on
        const { data: collabsData } = await supabase
          .from('collaborations')
          .select('*, projects(*, profiles(*))')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        setMyCollaborations(collabsData || []);

        // Fetch saved projects based on LocalStorage IDs synced from Discover/Details
        if (typeof window !== 'undefined') {
          const savedIds = JSON.parse(localStorage.getItem('savedProjects') || '[]');
          
          if (savedIds.length > 0) {
            const { data: savedData } = await supabase
              .from('projects')
              .select('*, profiles:user_id(full_name, avatar_url)')
              .in('id', savedIds)
              .order('created_at', { ascending: false });
              
            setSavedProjects(savedData || []);
          } else {
            setSavedProjects([]);
          }
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router, supabase]);

  // Calculate some basic stats
  const pendingCollabs = myCollaborations.filter(c => c.status === 'pending').length;
  const activeCollabs = myCollaborations.filter(c => c.status === 'accepted').length;

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto p-4 md:p-8 animate-in fade-in duration-700">
        
        {/* HEADER */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium text-black dark:text-white">My dashboard</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-8 h-[2px] bg-[#9cf822]" />
              <p className="text-sm text-zinc-500">Manage your projects and collaborations</p>
            </div>
          </div>
          
          <button 
            onClick={() => router.push('/create')}
            className="flex items-center gap-2 px-4 py-2 bg-[#9cf822] text-black rounded-lg hover:bg-[#84cc0e] transition-all shadow-sm shrink-0"
          >
            <Plus size={16} />
            <span className="text-sm font-medium">New project</span>
          </button>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#9cf822] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* STATS OVERVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="p-5 bg-zinc-50 border border-zinc-200/80 rounded-2xl dark:bg-[#1D2226] dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-2 text-zinc-500 dark:text-zinc-400">
                  <Folder size={16} />
                  <h3 className="text-sm font-medium">Total projects</h3>
                </div>
                <p className="text-3xl font-medium text-black dark:text-white">{myProjects.length}</p>
              </div>

              <div className="p-5 bg-zinc-50 border border-zinc-200/80 rounded-2xl dark:bg-[#1D2226] dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-2 text-zinc-500 dark:text-zinc-400">
                  <Activity size={16} />
                  <h3 className="text-sm font-medium">Active collaborations</h3>
                </div>
                <p className="text-3xl font-medium text-[#5a9a00] dark:text-[#9cf822]">{activeCollabs}</p>
              </div>

              <div className="p-5 bg-zinc-50 border border-zinc-200/80 rounded-2xl dark:bg-[#1D2226] dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-2 text-zinc-500 dark:text-zinc-400">
                  <Clock size={16} />
                  <h3 className="text-sm font-medium">Pending requests</h3>
                </div>
                <p className="text-3xl font-medium text-orange-500">{pendingCollabs}</p>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800 mb-8 overflow-x-auto hide-scrollbar">
              <button 
                onClick={() => setActiveTab('owned')}
                className={`pb-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'owned' ? 'border-black text-black dark:border-white dark:text-white' : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'}`}
              >
                My projects
              </button>
              <button 
                onClick={() => setActiveTab('collaborations')}
                className={`pb-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'collaborations' ? 'border-black text-black dark:border-white dark:text-white' : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'}`}
              >
                Collaborations
              </button>
              <button 
                onClick={() => setActiveTab('saved')}
                className={`pb-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'saved' ? 'border-black text-black dark:border-white dark:text-white' : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'}`}
              >
                Saved projects
              </button>
            </div>

            {/* TAB CONTENT: OWNED PROJECTS */}
            {activeTab === 'owned' && (
              myProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myProjects.map((project) => (
                    <div key={project.id} className="group flex flex-col bg-zinc-50 border border-zinc-200/80 rounded-2xl overflow-hidden hover:shadow-md transition-all dark:bg-[#1D2226] dark:border-zinc-800 dark:shadow-none">
                      <div className="aspect-video bg-zinc-200/50 border-b border-zinc-200/80 relative overflow-hidden flex items-center justify-center dark:bg-zinc-900 dark:border-zinc-800">
                        {project.image_url || project.cover_url ? (
                          <>
                            <span className="absolute text-sm font-medium text-zinc-400">Image unavailable</span>
                            <img 
                              src={project.image_url || project.cover_url} 
                              alt="" 
                              className="absolute inset-0 w-full h-full object-cover z-10" 
                              onError={(e) => (e.currentTarget.style.opacity = '0')}
                            />
                          </>
                        ) : (
                          <ImageIcon size={24} className="text-zinc-400" />
                        )}
                      </div>
                      
                      <div className="p-5 flex flex-col flex-grow">
                        <h3 className="text-lg font-medium text-black mb-1 truncate dark:text-white">{project.title}</h3>
                        <p className="text-sm text-zinc-500 line-clamp-2 mb-6 dark:text-zinc-400">{project.description}</p>
                        
                        <div className="mt-auto flex items-center gap-2 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/50">
                          <button 
                            onClick={() => router.push(`/studio/${project.id}`)}
                            className="flex-1 py-2 bg-white border border-zinc-200 text-black text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors dark:bg-black dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
                          >
                            Manage
                          </button>
                          <button className="p-2 border border-zinc-200 rounded-lg text-zinc-500 hover:text-black hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900">
                            <Settings size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-24 border border-dashed border-zinc-300 rounded-2xl flex flex-col items-center justify-center text-zinc-500 bg-zinc-50/50 dark:border-zinc-800 dark:bg-[#1D2226]/50">
                  <Folder size={32} className="mb-4 text-zinc-400" />
                  <p className="text-sm font-medium text-black dark:text-white mb-1">No project deployed yet</p>
                  <p className="text-sm mb-6 text-center max-w-sm">Initialize your first project to start recruiting collaborators and tracking equity.</p>
                  <button onClick={() => router.push('/create')} className="px-5 py-2.5 bg-[#9cf822] text-black text-sm font-medium rounded-lg hover:bg-[#84cc0e] transition-all shadow-sm">
                    Deploy project
                  </button>
                </div>
              )
            )}

            {/* TAB CONTENT: COLLABORATIONS */}
            {activeTab === 'collaborations' && (
              myCollaborations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myCollaborations.map((collab) => (
                    <div key={collab.id} className="group flex flex-col bg-zinc-50 border border-zinc-200/80 rounded-2xl overflow-hidden hover:shadow-md transition-all dark:bg-[#1D2226] dark:border-zinc-800 dark:shadow-none">
                      <div className="p-5 flex flex-col flex-grow">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                            collab.status === 'accepted' ? 'bg-[#5a9a00]/10 text-[#5a9a00] dark:bg-[#9cf822]/10 dark:text-[#9cf822]' : 
                            collab.status === 'pending' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 
                            'bg-red-500/10 text-red-600 dark:text-red-400'
                          }`}>
                            {collab.status.charAt(0).toUpperCase() + collab.status.slice(1)}
                          </div>
                          <span className="text-xs text-zinc-500">{new Date(collab.created_at).toLocaleDateString()}</span>
                        </div>

                        <h3 className="text-lg font-medium text-black mb-1 truncate dark:text-white">{collab.projects?.title || 'Unknown Project'}</h3>
                        <p className="text-sm text-zinc-500 mb-6 dark:text-zinc-400">Lead by {collab.projects?.profiles?.full_name || 'Unknown User'}</p>
                        
                        <div className="mt-auto pt-4 border-t border-zinc-200/80 dark:border-zinc-800/50">
                          <button 
                            onClick={() => router.push(collab.status === 'accepted' ? `/workspace/${collab.project_id}` : `/project/${collab.project_id}`)} 
                            className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-zinc-200 text-black text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors dark:bg-black dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
                          >
                            {collab.status === 'accepted' ? 'Enter workspace' : 'View details'} <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-24 border border-dashed border-zinc-300 rounded-2xl flex flex-col items-center justify-center text-zinc-500 bg-zinc-50/50 dark:border-zinc-800 dark:bg-[#1D2226]/50">
                  <Users size={32} className="mb-4 text-zinc-400" />
                  <p className="text-sm font-medium text-black dark:text-white mb-1">No active collaborations</p>
                  <p className="text-sm mb-6 text-center max-w-sm">Head over to the Discover page to find ventures looking for your skills.</p>
                  <button onClick={() => router.push('/discover')} className="px-5 py-2.5 bg-white border border-zinc-200 text-black text-sm font-medium rounded-lg hover:bg-zinc-50 transition-all shadow-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800">
                    Explore Discover
                  </button>
                </div>
              )
            )}

            {/* TAB CONTENT: SAVED PROJECTS */}
            {activeTab === 'saved' && (
              savedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedProjects.map((project) => (
                    <div key={project.id} className="group flex flex-col bg-zinc-50 border border-zinc-200/80 rounded-2xl overflow-hidden hover:shadow-md transition-all dark:bg-[#1D2226] dark:border-zinc-800 dark:shadow-none">
                      <div className="aspect-video bg-zinc-200/50 border-b border-zinc-200/80 relative overflow-hidden flex items-center justify-center dark:bg-zinc-900 dark:border-zinc-800">
                        {project.image_url || project.cover_url ? (
                          <>
                            <span className="absolute text-sm font-medium text-zinc-400">Image unavailable</span>
                            <img 
                              src={project.image_url || project.cover_url} 
                              alt="" 
                              className="absolute inset-0 w-full h-full object-cover z-10" 
                              onError={(e) => (e.currentTarget.style.opacity = '0')}
                            />
                          </>
                        ) : (
                          <ImageIcon size={24} className="text-zinc-400" />
                        )}
                        {/* Status Overlay */}
                        <div className="absolute top-3 right-3 z-20">
                          <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white rounded-md text-[10px] font-medium tracking-wide border border-white/10">
                            Saved
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-5 flex flex-col flex-grow">
                        <h3 className="text-lg font-medium text-black mb-1 truncate dark:text-white">{project.title}</h3>
                        <p className="text-sm text-zinc-500 line-clamp-2 mb-3 dark:text-zinc-400">{project.description}</p>
                        
                        <div className="flex items-center gap-2 mb-6">
                           <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0">
                             {project.profiles?.avatar_url ? (
                               <img src={project.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                             ) : (
                               <Users size={10} className="m-auto mt-1 text-zinc-400" />
                             )}
                           </div>
                           <span className="text-xs font-medium text-zinc-500 truncate dark:text-zinc-400">
                             {project.profiles?.full_name || 'Project Lead'}
                           </span>
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-zinc-200/80 dark:border-zinc-800/50">
                          <button 
                            onClick={() => router.push(`/project/${project.id}`)}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-zinc-200 text-black text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors dark:bg-black dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
                          >
                            View details <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-24 border border-dashed border-zinc-300 rounded-2xl flex flex-col items-center justify-center text-zinc-500 bg-zinc-50/50 dark:border-zinc-800 dark:bg-[#1D2226]/50">
                  <Bookmark size={32} className="mb-4 text-zinc-400" />
                  <p className="text-sm font-medium text-black dark:text-white mb-1">No saved project</p>
                  <p className="text-sm mb-6 text-center max-w-sm">You haven't bookmarked any projects yet. Discover exciting new ventures to follow and collaborate on.</p>
                  <button onClick={() => router.push('/discover')} className="px-5 py-2.5 bg-white border border-zinc-200 text-black text-sm font-medium rounded-lg hover:bg-zinc-50 transition-all shadow-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800">
                    Explore Discover
                  </button>
                </div>
              )
            )}

          </>
        )}
      </div>
    </div>
  );
}