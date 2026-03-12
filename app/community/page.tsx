'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  Loader2, Send, MapPin, Coffee, Image as ImageIcon, 
  Heart, MessageSquare, Share2, Sparkles, TrendingUp, 
  Code, Briefcase, Globe, X, Trash2, Repeat, Maximize2, User,
  BadgeCheck, PartyPopper, Zap, Clock, Edit, Home, Search, Plus, Bell
} from 'lucide-react';
import Link from 'next/link';

// Custom component to handle video play states and the "Watch Again" overlay
function FeedVideo({ url, onExpand }: { url: string, onExpand: () => void }) {
  const [isEnded, setIsEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div 
      className="relative bg-black w-full flex justify-center items-center h-auto max-h-[800px] cursor-pointer rounded-2xl overflow-hidden group"
      onClick={onExpand}
    >
      <video 
        ref={videoRef}
        src={url} 
        className="w-full h-auto max-h-[800px] object-contain rounded-2xl" 
        autoPlay muted playsInline
        onEnded={() => setIsEnded(true)}
        onPlay={() => setIsEnded(false)}
      />
      
      {/* WATCH AGAIN OVERLAY */}
      {isEnded && (
        <div 
          className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center transition-all z-10"
          onClick={(e) => {
            e.stopPropagation(); // Prevent opening the modal
            setIsEnded(false);
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              videoRef.current.play();
            }
          }}
        >
           <div className="p-4 bg-white/10 rounded-full backdrop-blur-md mb-3 group-hover:bg-[#9cf822] group-hover:text-black transition-colors text-white">
             <Repeat size={32} />
           </div>
           <span className="text-sm font-black text-white uppercase tracking-widest group-hover:text-[#9cf822] transition-colors">Watch Again</span>
        </div>
      )}
    </div>
  );
}

export default function CommunityFeedPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  
  // Real Data States
  const [trendingTags, setTrendingTags] = useState<{tag: string, count: number}[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  // Media States
  const [postMedia, setPostMedia] = useState<{url: string, type: string}[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [expandedMedia, setExpandedMedia] = useState<{url: string, type: string} | null>(null);
  
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Nav Visibility States (Kept for the FAB button logic)
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Edit States
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Comment States
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyTo, setReplyTo] = useState<{commentId: string, userName: string} | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(pattern);
  };

  // Scroll logic for hiding/showing the Floating Action Button
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsNavVisible(true);
      } else if (currentScrollY > 70 && currentScrollY > lastScrollY) {
        setIsNavVisible(false);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    async function fetchFeed() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return router.push('/login');
      setUser(authUser);

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();
      setProfile(userProfile);

      const { data: postData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(full_name, avatar_url, role, is_verified),
          likes(user_id),
          comments(
            id, content, created_at, parent_id, user_id,
            profiles:user_id(full_name, avatar_url, is_verified),
            comment_likes(user_id)
          ),
          repost:repost_id(
            id, content, media, created_at, user_id,
            profiles:user_id(full_name, avatar_url, role, is_verified)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) console.error("Error fetching feed:", error);

      const formattedPosts = (postData || []).map(post => ({
        ...post,
        _hasLiked: post.likes?.some((like: any) => like.user_id === authUser.id),
        likes_count: post.likes?.length || 0,
        comments: (post.comments || []).map((c: any) => ({
          ...c,
          likes_count: c.comment_likes?.length || 0,
          _hasLiked: c.comment_likes?.some((cl: any) => cl.user_id === authUser.id)
        })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }));

      // Sort: Official posts first, then by date
      const sortedPosts = formattedPosts.sort((a, b) => {
        const aOfficial = a.profiles?.role === 'official' ? 1 : 0;
        const bOfficial = b.profiles?.role === 'official' ? 1 : 0;
        if (aOfficial !== bOfficial) return bOfficial - aOfficial;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setPosts(sortedPosts);
      
      const tagMap: Record<string, number> = {};
      formattedPosts.forEach(p => {
        const tags = p.content?.match(/#\w+/g);
        if (tags) tags.forEach((t: string) => tagMap[t] = (tagMap[t] || 0) + 1);
      });
      setTrendingTags(Object.entries(tagMap).map(([tag, count]) => ({tag, count})).sort((a,b) => b.count - a.count).slice(0,3));
      setRecentActivity(formattedPosts.slice(0, 5));
      
      setLoading(false);
    }

    fetchFeed();
  }, [supabase, router]);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploadingImage(true);
    triggerHaptic([10, 20]);
    const uploadedFiles: {url: string, type: string}[] = [];
    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `community-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const fileType = file.type.startsWith('video/') ? 'video' : 'image';
        const { error: uploadError } = await supabase.storage.from('workspace_files').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('workspace_files').getPublicUrl(fileName);
        uploadedFiles.push({ url: publicUrl, type: fileType });
      }
      setPostMedia(prev => [...prev, ...uploadedFiles]);
    } catch (err: any) { alert("Failed to upload media."); } finally { setIsUploadingImage(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const removeMedia = (indexToRemove: number) => {
    setPostMedia(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newPost.trim() && postMedia.length === 0) || isPosting) return;
    setIsPosting(true);
    triggerHaptic(50);
    const postContent = newPost.trim();
    const { data: insertedPost, error } = await supabase.from('posts').insert({
      user_id: user.id, content: postContent, media: postMedia
    }).select('*, profiles:user_id(full_name, avatar_url, role, is_verified)').single();

    if (!error) {
      const formattedInserted = { ...insertedPost, likes_count: 0, comments: [], _hasLiked: false };
      // Maintain Official Pinned State: keep official posts at the top even after a new post
      setPosts(prev => {
        const updated = [formattedInserted, ...prev];
        return updated.sort((a, b) => {
          const aOfficial = a.profiles?.role === 'official' ? 1 : 0;
          const bOfficial = b.profiles?.role === 'official' ? 1 : 0;
          if (aOfficial !== bOfficial) return bOfficial - aOfficial;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      });
      setRecentActivity(prev => [formattedInserted, ...prev.slice(0, 4)]);
      setNewPost('');
      setPostMedia([]); 
    }
    setIsPosting(false);
  };

  const handleRepost = async (postId: string) => {
    triggerHaptic(40);
    const { data: insertedRepost, error } = await supabase.from('posts').insert({
      user_id: user.id,
      repost_id: postId,
      content: ''
    }).select(`
      *,
      profiles:user_id(full_name, avatar_url, role, is_verified),
      repost:repost_id(
        id, content, media, created_at, user_id,
        profiles:user_id(full_name, avatar_url, role, is_verified)
      )
    `).single();

    if (!error) {
      setPosts(prev => [insertedRepost, ...prev]);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    triggerHaptic([10, 20]);
    setPosts(prev => prev.filter(p => p.id !== postId));
    setRecentActivity(prev => prev.filter(p => p.id !== postId));
    await supabase.from('posts').delete().match({ id: postId, user_id: user.id });
  };

  const handleSaveEdit = async (postId: string) => {
    if (!editContent.trim()) return;
    triggerHaptic(10);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: editContent } : p));
    setEditingPostId(null);
    await supabase.from('posts').update({ content: editContent }).match({ id: postId, user_id: user.id });
  };

  const handleLike = async (postId: string, currentLikes: number, hasLiked: boolean) => {
    triggerHaptic(10);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: hasLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1, _hasLiked: !hasLiked } : p));
    if (hasLiked) await supabase.from('likes').delete().match({ post_id: postId, user_id: user.id });
    else await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
  };

  const submitComment = async (postId: string) => {
    if (!commentText.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    const { data: insertedComment } = await supabase.from('comments').insert({ 
      post_id: postId, user_id: user.id, content: commentText.trim(), parent_id: replyTo?.commentId || null 
    }).select('*, profiles:user_id(full_name, avatar_url, is_verified)').single();
    if (insertedComment) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), insertedComment] } : p));
      setCommentText('');
      setReplyTo(null);
    }
    setIsSubmittingComment(false);
  };

  const renderComments = (postId: string, comments: any[], parentId: string | null = null, depth = 0) => {
    return comments.filter(c => c.parent_id === parentId).map(c => (
      <div key={c.id} className={`flex gap-3 text-sm ${depth > 0 ? 'ml-8 mt-3' : 'mt-4 text-left'}`}>
        <Link href={`/profile/${c.user_id}`} className="shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-100 dark:border-zinc-800 hover:opacity-80 transition-opacity">
            {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} className="w-full h-full object-cover" /> : <User size={16} className="m-auto mt-2 text-zinc-400" />}
          </div>
        </Link>
        <div className="flex-grow min-w-0">
          <div className="bg-zinc-100 dark:bg-zinc-900 p-2.5 rounded-xl rounded-tl-none inline-block max-w-full overflow-hidden">
            <Link href={`/profile/${c.user_id}`} className="hover:underline flex items-center gap-1 mb-0.5">
              <span className="font-bold block text-xs text-black dark:text-white truncate">{c.profiles?.full_name}</span>
              {c.profiles?.is_verified && <BadgeCheck size={12} fill="#9cf822" className="text-white dark:text-black shrink-0" />}
            </Link>
            <span className="text-zinc-800 dark:text-zinc-300 break-words">{c.content}</span>
          </div>
          <div className="flex items-center gap-4 mt-1.5 ml-1 text-xs font-bold text-zinc-500">
            <button 
              onClick={() => {
                setReplyTo({ commentId: c.id, userName: c.profiles?.full_name });
                document.getElementById(`comment-input-${postId}`)?.focus();
              }} 
              className="hover:text-black dark:hover:text-white transition-colors"
            >
              Reply
            </button>
            <span className="text-[10px] text-zinc-400 font-medium">{new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
          {renderComments(postId, comments, c.id, depth + 1)}
        </div>
      </div>
    ));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><Loader2 className="animate-spin text-[#9cf822]" /></div>;

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 pb-28 sm:pb-24">
      
      {/* Media Overlay */}
      {expandedMedia && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4" onClick={() => setExpandedMedia(null)}>
          <button className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-50">
            <X size={32} />
          </button>
          {expandedMedia.type === 'video' ? (
             <video src={expandedMedia.url} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" controls autoPlay playsInline onClick={(e) => e.stopPropagation()} />
          ) : (
             <img src={expandedMedia.url} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Enlarged" onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}

      {/* MOBILE LIVE PULSE TICKER */}
      <div className="sm:hidden w-full bg-white dark:bg-black border-b border-zinc-100 dark:border-zinc-900 py-3 overflow-hidden">
        <div className="px-4 flex items-center gap-2 mb-2">
          <Zap size={14} className="text-[#9cf822] fill-[#9cf822]" />
          <span className="text-xs font-normal text-zinc-500 tracking-tight">What is happening</span>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar pb-1">
          {recentActivity.map((activity, i) => (
            <div key={i} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800 min-w-[180px]">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#9cf822]/20">
                <img src={activity.profiles?.avatar_url} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-black dark:text-white truncate">{activity.profiles?.full_name}</p>
                <p className="text-[9px] text-zinc-500 truncate line-clamp-1">{activity.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-0 sm:px-6 pt-0 sm:pt-8 grid grid-cols-1 lg:grid-cols-12 gap-0 sm:gap-10">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-0 sm:space-y-6 order-2 lg:order-1">
          {/* Post Composer */}
          <div className="bg-white dark:bg-black sm:rounded-[2.5rem] p-4 sm:p-8 border-b sm:border border-zinc-200 dark:border-zinc-800 shadow-sm text-left">
            <form onSubmit={handlePost}>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200 dark:border-zinc-800">
                  <img src={profile?.avatar_url} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow">
                  <textarea 
                    ref={textAreaRef}
                    value={newPost} onChange={(e) => setNewPost(e.target.value)}
                    placeholder="What are you building today?"
                    className="w-full bg-transparent resize-none text-black dark:text-white text-lg focus:outline-none min-h-[80px]"
                  />
                  
                  {/* COMPOSER MEDIA PREVIEW */}
                  {postMedia.length > 0 && (
                    <div className={`mt-3 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 ${postMedia.length > 1 ? 'grid gap-0.5 grid-cols-2 bg-zinc-200 dark:bg-zinc-800' : ''}`}>
                      {postMedia.map((m, idx) => {
                        const isVideo = m.type === 'video' || m.url.includes('.mp4');
                        return (
                          <div 
                            key={idx} 
                            className={`relative bg-black w-full flex justify-center items-center rounded-2xl overflow-hidden ${isVideo ? 'h-auto max-h-[800px]' : 'aspect-[4/5]'}`} 
                          >
                            {isVideo ? (
                              <video src={m.url} className="w-full h-auto max-h-[800px] object-contain rounded-2xl" autoPlay muted loop playsInline />
                            ) : (
                              <img src={m.url} className="w-full h-full object-cover" />
                            )}
                            <button type="button" onClick={() => removeMedia(idx)} className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full text-white transition-colors z-10">
                              <X size={14}/>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <div className="flex items-center gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleMediaUpload} accept="image/*,video/*" className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-[#9cf822] hover:bg-[#9cf822]/10 rounded-full transition-colors"><ImageIcon size={20} /></button>
                </div>
                <button type="submit" disabled={isPosting || (!newPost.trim() && postMedia.length === 0)} className="px-8 py-3 bg-[#9cf822] text-black font-normal text-xs rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#9cf822]/20 tracking-tight">
                  Post update
                </button>
              </div>
            </form>
          </div>

          {/* Posts List */}
          <div className="space-y-0 sm:space-y-6">
            {posts.map((post) => {
              const isOfficial = post.profiles?.role === 'official';
              const isRepost = !!post.repost_id;
              
              return (
                <div 
                  key={post.id} 
                  className={`sm:rounded-[2.5rem] p-4 sm:p-8 border-b sm:border transition-all text-left relative overflow-hidden ${
                    isOfficial 
                      ? 'bg-zinc-50 dark:bg-[#9cf822]/[0.02] border-[#9cf822] dark:border-[#9cf822]/40 shadow-[0_0_20px_rgba(156,248,34,0.05)]' 
                      : 'bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 shadow-sm'
                  }`}
                >
                  {isOfficial && <div className="absolute top-0 left-0 w-full h-1.5 bg-[#9cf822]"></div>}

                  {/* REPOST HEADER */}
                  {isRepost && (
                    <div className="flex items-center gap-2 mb-3 text-zinc-400 font-normal text-[10px] tracking-tight ml-12">
                      <Repeat size={12} strokeWidth={2} /> New member reshared
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* User Avatar: Locked if Official */}
                    {isOfficial ? (
                      <div className="shrink-0 mt-1">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border-2 border-[#9cf822]">
                          <img src={post.profiles?.avatar_url} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    ) : (
                      <Link href={`/profile/${post.user_id}`} className="shrink-0 mt-1">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border-2 border-transparent hover:border-[#9cf822] transition-colors">
                          <img src={post.profiles?.avatar_url} className="w-full h-full object-cover" />
                        </div>
                      </Link>
                    )}

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 truncate">
                          {isOfficial ? (
                            <div className="font-black text-black dark:text-white truncate flex items-center gap-1.5 cursor-default">
                              {post.profiles?.full_name}
                              {post.profiles?.is_verified && <BadgeCheck size={16} fill="#9cf822" className="text-white dark:text-black" />}
                            </div>
                          ) : (
                            <Link href={`/profile/${post.user_id}`} className="font-black text-black dark:text-white hover:underline truncate flex items-center gap-1.5">
                              {post.profiles?.full_name}
                              {post.profiles?.is_verified && <BadgeCheck size={16} fill="#9cf822" className="text-white dark:text-black" />}
                            </Link>
                          )}
                          <span className="text-[10px] text-zinc-400 font-normal tracking-tight"></span>
                        </div>
                        
                        {user?.id === post.user_id && (
                          <div className="flex items-center gap-3 shrink-0 ml-2">
                            {profile?.role?.toLowerCase() === 'pro' && (
                              <button onClick={() => { setEditingPostId(post.id); setEditContent(post.content); }} className="text-zinc-400 hover:text-[#9cf822] transition-colors"><Edit size={14} /></button>
                            )}
                            <button onClick={() => handleDeletePost(post.id)} className="text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        )}
                      </div>

                      {editingPostId === post.id ? (
                        <div className="mt-2 mb-3">
                          <textarea 
                            value={editContent} 
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl p-3 text-sm text-black dark:text-white focus:outline-none border border-transparent focus:border-[#9cf822] resize-none"
                            rows={3}
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => handleSaveEdit(post.id)} className="px-4 py-1.5 bg-[#9cf822] text-black text-xs font-bold rounded-lg hover:scale-95 transition-transform">Save</button>
                            <button onClick={() => setEditingPostId(null)} className="px-4 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white text-xs font-bold rounded-lg hover:opacity-80 transition-opacity">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap text-[15px] leading-relaxed mt-2">{post.content}</p>
                      )}
                      
                      {/* POST MEDIA / REPOSTED CONTENT */}
                      {isRepost && post.repost ? (
                        <div className="mt-4 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-black/40">
                          <div className="flex items-center gap-2 mb-2">
                             <div className="w-5 h-5 rounded-full overflow-hidden bg-zinc-800">
                               <img src={post.repost.profiles?.avatar_url} className="w-full h-full object-cover" />
                             </div>
                             <span className="font-bold text-xs text-black dark:text-white">{post.repost.profiles?.full_name}</span>
                          </div>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3">{post.repost.content}</p>
                          {post.repost.media?.length > 0 && <div className="mt-2 text-[10px] text-[#9cf822] font-black uppercase flex items-center gap-1"><ImageIcon size={10}/> Attached Media</div>}
                        </div>
                      ) : (
                        post.media?.length > 0 && (
                          <div className={`mt-3 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 ${post.media.length > 1 ? 'grid gap-0.5 grid-cols-2 bg-zinc-200 dark:bg-zinc-800' : ''}`}>
                            {post.media.map((m: any, i: number) => {
                              const isVideo = m.type === 'video' || m.url.includes('.mp4');
                              return isVideo ? (
                                <FeedVideo key={i} url={m.url} onExpand={() => setExpandedMedia({url: m.url, type: 'video'})} />
                              ) : (
                                <div key={i} className="relative bg-black w-full flex justify-center items-center aspect-[4/5] cursor-pointer rounded-2xl overflow-hidden" onClick={() => setExpandedMedia({url: m.url, type: 'image'})}>
                                  <img src={m.url} className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                                </div>
                              );
                            })}
                          </div>
                        )
                      )}

                      <div className="flex items-center gap-8 mt-6">
                        <button onClick={() => handleLike(post.id, post.likes_count, post._hasLiked)} className={`flex items-center gap-2 ${post._hasLiked ? 'text-rose-500' : 'text-zinc-400'}`}>
                           <Heart size={20} fill={post._hasLiked ? 'currentColor' : 'none'} />
                           <span className="text-xs font-bold">{post.likes_count}</span>
                        </button>
                        <button onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)} className="flex items-center gap-2 text-zinc-400">
                           <MessageSquare size={20} />
                           <span className="text-xs font-bold">{post.comments?.length || 0}</span>
                        </button>
                        <button onClick={() => handleRepost(post.id)} className="flex items-center gap-2 text-zinc-400 hover:text-[#9cf822] transition-colors">
                           <Repeat size={20} />
                           <span className="text-xs font-normal">Reshare</span>
                        </button>
                      </div>

                      {activeCommentPost === post.id && (
                        <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-900 animate-in slide-in-from-top-2">
                          <div className="mb-4">{renderComments(post.id, post.comments)}</div>
                          <div className="flex gap-2 items-end">
                            <div className="flex-grow flex flex-col gap-2">
                              {replyTo && (
                                <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-xs w-fit">
                                  <span className="text-zinc-500 font-medium">Replying to <span className="font-bold text-black dark:text-white">@{replyTo.userName}</span></span>
                                  <button onClick={() => setReplyTo(null)} className="ml-3 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"><X size={12}/></button>
                                </div>
                              )}
                              <input 
                                id={`comment-input-${post.id}`}
                                type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
                                placeholder="Write a comment..." 
                                className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full px-4 py-2.5 text-sm outline-none border border-transparent focus:border-[#9cf822] text-black dark:text-white"
                              />
                            </div>
                            <button onClick={() => submitComment(post.id)} disabled={!commentText.trim()} className="text-[#9cf822] p-2 self-end mb-1"><Send size={18} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8 order-1 lg:order-2 hidden lg:block">
          <div className="sticky top-24 space-y-8 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-8 text-left">
            <div className="w-full bg-gradient-to-br from-[#1a2e05] to-[#0a1401] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
              <Sparkles size={18} className="text-[#9cf822] mb-2" />
              <h3 className="font-bold text-white text-lg uppercase tracking-widest">Community Hub</h3>
              <p className="text-zinc-400 text-sm mb-8 italic">Join the conversation</p>
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-zinc-500 mb-2"><TrendingUp size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Trending Now</span></div>
                {trendingTags.map((tag, idx) => (
                  <div key={idx} className="flex flex-col gap-0.5 group cursor-pointer">
                    <span className="text-sm font-black text-white group-hover:text-[#9cf822] transition-colors">{tag.tag}</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">{tag.count} Posts</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
               <h4 className="text-[10px] font-normal text-[#9cf822] tracking-tight mb-6 flex items-center gap-2"><Clock size={12} /> What is happening</h4>
               <div className="space-y-6">
                  {recentActivity.slice(0, 4).map((activity, i) => (
                    <div key={i} className="flex items-start gap-4 group cursor-pointer" onClick={() => activity.profiles?.role !== 'official' && router.push(`/profile/${activity.user_id}`)}>
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 group-hover:border-[#9cf822] transition-colors"><img src={activity.profiles?.avatar_url} className="w-full h-full object-cover" /></div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1"><p className="text-sm font-black text-black dark:text-white truncate group-hover:text-[#9cf822]">{activity.profiles?.full_name}</p>{activity.profiles?.is_verified && <BadgeCheck size={12} fill="#9cf822" className="text-white shrink-0" />}</div>
                        <p className="text-[11px] text-zinc-500 line-clamp-1">New member</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* TWITTER-STYLE FLOATING ACTION BUTTON */}
      <button 
        onClick={() => { window.scrollTo({top: 0, behavior: 'smooth'}); textAreaRef.current?.focus(); }}
        className={`sm:hidden fixed right-6 bottom-24 bg-[#9cf822] text-black p-4 rounded-full shadow-[0_8px_30px_rgba(156,248,34,0.4)] z-50 transition-all duration-300 active:scale-90 ${
          isNavVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        }`}
      >
        <Plus size={24} strokeWidth={3} />
      </button>

    </div>
  );
}