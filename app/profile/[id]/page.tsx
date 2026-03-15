'use client';

import React, { useEffect, useState, use } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Loader2, Image as ImageIcon, Plus, Grid, 
  Linkedin, MapPin, Phone, ExternalLink, 
  Facebook, Instagram, Twitter, Video, Trash2, 
  User, Camera, Calendar, Heart, MessageSquare, Repeat, X, BadgeCheck
} from 'lucide-react';
import Link from 'next/link';

import EditProfileModal from './EditProfileModal'; 
import ProjectUploadModal from './ProjectUploadModal'; 

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id; 

  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [projectCount, setProjectCount] = useState(0);
  const [collabCount, setCollabCount] = useState(0);
  const [projects, setProjects] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'work' | 'posts' | 'media'>('work');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(pattern);
  };

  const fetchProfileData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setCurrentUser(authUser);
      
      const isOwn = authUser?.id === userId;
      if (isOwn) setIsOwnProfile(true);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      const mergedProfile = isOwn 
        ? { ...authUser?.user_metadata, ...profileData } 
        : profileData;
        
      setProfile(mergedProfile);

      // Fetch Projects
      const { data: userProjects, count: pCount } = await supabase
        .from('projects') 
        .select('*', { count: 'exact' })
        .eq('user_id', userId);
      
      setProjects(userProjects || []);
      setProjectCount(pCount || 0);

      // Fetch Feed (Posts & Reshares) WITH is_verified INCLUDED
      const { data: feedData } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(full_name, avatar_url, role, is_verified),
          likes(user_id),
          comments(id),
          repost:repost_id(
            id,
            content,
            media,
            created_at,
            profiles:user_id(full_name, avatar_url, role, is_verified)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const formattedPosts = (feedData || []).map(post => ({
        ...post,
        _hasLiked: post.likes?.some((like: any) => like.user_id === authUser?.id),
        likes_count: post.likes?.length || 0,
        comments_count: post.comments?.length || 0
      }));
      setPosts(formattedPosts);

      const { count: cCount } = await supabase
        .from('collaborations') 
        .select('*', { count: 'exact' })
        .eq('user_id', userId);
      
      setCollabCount(cCount || 0);
      
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const handleLike = async (postId: string, currentLikes: number, hasLiked: boolean) => {
    if (!currentUser) return;
    triggerHaptic(10);
    
    setPosts(prev => prev.map(p => p.id === postId ? { 
      ...p, 
      likes_count: hasLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1, 
      _hasLiked: !hasLiked 
    } : p));

    if (hasLiked) {
      await supabase.from('likes').delete().match({ post_id: postId, user_id: currentUser.id });
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: currentUser.id });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("Are you sure?")) return;
    await supabase.from('projects').delete().eq('id', projectId);
    fetchProfileData();
  };

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-[#9cf822]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 pb-20">
      
      {/* FULL BLEED BANNER - Uses negative margins to bypass layout padding */}
      <div className="-mx-4 md:-mx-10 -mt-20 md:-mt-10 h-48 md:h-80 bg-zinc-100 dark:bg-zinc-900 relative overflow-hidden border-b border-zinc-200 dark:border-zinc-900">
        {profile?.header_url ? (
          <img 
            src={profile.header_url} 
            className="w-full h-full object-cover" 
            style={{ 
              objectPosition: `center ${profile.header_y !== undefined && profile.header_y !== null ? profile.header_y : 50}%`,
              transform: `scale(${profile.header_zoom || 1})`
            }}
            alt="Banner" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-50 to-zinc-200 dark:from-[#0a0a0a] dark:to-zinc-900" />
        )}
      </div>

      {/* CONSTRAINED CONTENT AREA */}
      <div className="max-w-5xl mx-auto px-0 md:px-8">
        
        {/* Profile Info */}
        <div className="relative px-4 md:px-10 pb-8 border-b md:border-x border-zinc-200 dark:border-zinc-900 md:rounded-b-[2rem] bg-white dark:bg-black">
          <div className="flex justify-between items-start mb-6 relative">
            <div 
              onClick={() => isOwnProfile && setIsModalOpen(true)}
              className={`group relative w-28 h-28 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-black bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 shadow-lg -mt-14 md:-mt-20 transition-transform ${isOwnProfile ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
            >
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  className="w-full h-full object-cover" 
                  style={{ transform: `scale(${profile.avatar_zoom || 1})` }}
                  alt="Avatar" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400"><User size={48} /></div>
              )}
              {isOwnProfile && <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white"><Camera size={24} /><span className="text-[10px] font-bold uppercase">Edit</span></div>}
            </div>
            {isOwnProfile && <button onClick={() => setIsModalOpen(true)} className="px-5 py-2 md:px-6 md:py-2.5 bg-zinc-100 text-black dark:bg-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all font-medium text-sm mt-4">Edit profile</button>}
          </div>

          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-2xl md:text-4xl font-bold text-black dark:text-white tracking-tight">{profile?.full_name || 'Creator'}</h1>
              {profile?.is_verified && (
                <BadgeCheck size={28} fill="#9cf822" className="text-white dark:text-black shrink-0" />
              )}
            </div>
            <p className="text-[#000000] dark:text-[#ffffff] text-sm md:text-lg font-medium">{profile?.role || 'Creative professional'}</p>
            
            <div className="flex flex-wrap items-center gap-5 text-zinc-500 text-sm md:text-base pt-2">
              {profile?.address && <div className="flex items-center gap-1.5"><MapPin size={16} /> {profile.address}</div>}
            </div>

            {/* Social Links Restoration */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              {profile?.linkedin_url && (
                <Link href={profile.linkedin_url} target="_blank" className="p-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:text-blue-600 transition-colors">
                  <Linkedin size={18} />
                </Link>
              )}
              {profile?.twitter_url && (
                <Link href={profile.twitter_url} target="_blank" className="p-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:text-sky-500 transition-colors">
                  <Twitter size={18} />
                </Link>
              )}
              {profile?.instagram_url && (
                <Link href={profile.instagram_url} target="_blank" className="p-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:text-rose-500 transition-colors">
                  <Instagram size={18} />
                </Link>
              )}
              {profile?.facebook_url && (
                <Link href={profile.facebook_url} target="_blank" className="p-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:text-blue-700 transition-colors">
                  <Facebook size={18} />
                </Link>
              )}
              {profile?.website_url && (
                <Link href={profile.website_url} target="_blank" className="p-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:text-[#9cf822] transition-colors">
                  <ExternalLink size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:flex items-center gap-8 md:gap-20 py-8 border-b md:border-y border-zinc-200 dark:border-zinc-900 mb-0 px-6 md:px-10">
          <div><p className="text-[#5a9a00] dark:text-[#9cf822] text-3xl md:text-4xl font-bold">{projectCount}</p><p className="text-zinc-500 text-xs md:text-sm font-bold title case ">Projects</p></div>
          <div><p className="text-black dark:text-white text-3xl md:text-4xl font-bold">{collabCount}</p><p className="text-zinc-500 text-xs md:text-sm font-bold title case ">Collaborations</p></div>
        </div>

        {/* TABS SYSTEM */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-900 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-30">
          {[
            { id: 'work', label: 'Work', icon: Grid },
            { id: 'posts', label: 'Posts', icon: MessageSquare },
            { id: 'media', label: 'Media', icon: ImageIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-black dark:text-white' : 'text-zinc-500'}`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#9cf822]" />}
            </button>
          ))}
        </div>

        {/* CONTENT RENDERING */}
        <div className="mt-6">
          {activeTab === 'work' && (
            <div className="px-0 md:px-0">
               {isOwnProfile && (
                <div className="flex justify-end mb-6 px-4 md:px-0">
                  <button onClick={() => setIsProjectModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#9cf822] text-black rounded-xl text-sm font-bold hover:shadow-lg transition-all"><Plus size={15} /> Add project</button>
                </div>
              )}
              {projects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[1px] sm:gap-6 pb-24">
                  {projects.map((p, i) => (
                    <div key={i} className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-900 sm:rounded-[2rem] border-b sm:border border-zinc-200 dark:border-zinc-900 overflow-hidden relative group cursor-pointer shadow-sm">
                       {p.cover_image_url || p.image_url ? (
                         <img src={p.cover_image_url || p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.title} />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center">
                           <ImageIcon size={32} className="text-zinc-300 dark:text-zinc-800" />
                         </div>
                       )}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                          <p className="text-sm font-bold text-white">{p.title}</p>
                       </div>
                       {isOwnProfile && <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }} className="absolute top-4 right-4 p-2.5 bg-red-500 text-white rounded-full sm:opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>}
                    </div>
                  ))}
                </div>
              ) : <NoDataMessage title="Portfolio Empty" subtitle="Showcase your best work here." />}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900 max-w-2xl mx-auto pb-24">
              {posts.length > 0 ? posts.map((post) => (
                <div key={post.id} className="p-5 sm:p-8 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                  {post.repost_id && (
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold mb-4 ml-10">
                      <Repeat size={14} className="text-[#9cf822]" /> <span>{isOwnProfile ? 'You' : profile.full_name} reshared</span>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                      <img src={post.repost_id ? post.repost?.profiles?.avatar_url : post.profiles?.avatar_url} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-black dark:text-white text-sm sm:text-base flex items-center gap-1">
                          {post.repost_id ? post.repost?.profiles?.full_name : post.profiles?.full_name}
                          {(post.repost_id ? post.repost?.profiles?.is_verified : post.profiles?.is_verified) && (
                            <BadgeCheck size={16} fill="#9cf822" className="text-white dark:text-black shrink-0" />
                          )}
                        </span>
                        <span className="text-zinc-500 text-xs">· {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <p className="text-zinc-800 dark:text-zinc-200 text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap">{post.repost_id ? post.repost?.content : post.content}</p>
                      
                      {((post.repost_id ? post.repost?.media : post.media) || []).length > 0 && (
                        <div className="mt-4 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                           <img src={(post.repost_id ? post.repost?.media[0]?.url : post.media[0]?.url)} className="w-full h-auto object-cover max-h-96" alt="" />
                        </div>
                      )}

                      <div className="flex items-center gap-8 mt-5 text-zinc-500">
                        <button onClick={() => handleLike(post.id, post.likes_count, post._hasLiked)} className={`flex items-center gap-1.5 transition-colors ${post._hasLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}>
                          <Heart size={18} fill={post._hasLiked ? 'currentColor' : 'none'} />
                          <span className="text-xs font-bold">{post.likes_count}</span>
                        </button>
                        <Link href={`/post/${post.id}`} className="flex items-center gap-1.5 hover:text-blue-500">
                          <MessageSquare size={18} />
                          <span className="text-xs font-bold">{post.comments_count}</span>
                        </Link>
                        <button className="flex items-center gap-1.5 hover:text-[#9cf822]"><Repeat size={18} /><span className="text-xs font-bold">{post.reposts_count || 0}</span></button>
                      </div>
                    </div>
                  </div>
                </div>
              )) : <NoDataMessage title="No Posts" subtitle="Thoughts and updates will appear here." />}
            </div>
          )}

          {activeTab === 'media' && (
            <div className="grid grid-cols-3 gap-1 sm:gap-4 pb-24 px-1 sm:px-0">
              {posts.flatMap(p => p.repost_id ? (p.repost?.media || []) : (p.media || [])).map((m, idx) => (
                <div key={idx} className="aspect-square bg-zinc-900 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                  <img src={m.url} className="w-full h-full object-cover" alt="" />
                </div>
              ))}
              {posts.flatMap(p => p.repost_id ? (p.repost?.media || []) : (p.media || [])).length === 0 && (
                <div className="col-span-3"><NoDataMessage title="No Media" subtitle="Images and videos from posts appear here." /></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isOwnProfile && (
        <>
          <EditProfileModal user={currentUser} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUpdate={fetchProfileData} />
          <ProjectUploadModal userId={userId} isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onSuccess={fetchProfileData} />
        </>
      )}
    </div>
  );
}

// Helper Components
function NoDataMessage({ title, subtitle }: { title: string, subtitle: string }) {
  return (
    <div className="mx-6 md:mx-0 py-24 border-2 border-dashed border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-[2rem] flex flex-col items-center justify-center text-zinc-500">
      <p className="text-sm font-bold text-black dark:text-white mb-1">{title}</p>
      <p className="text-xs text-center max-w-[200px] leading-relaxed">{subtitle}</p>
    </div>
  );
}