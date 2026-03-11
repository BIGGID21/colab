'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  Loader2, Send, MapPin, Coffee, Image as ImageIcon, 
  Heart, MessageSquare, Share2, Sparkles, TrendingUp, 
  Code, Briefcase, Globe, X, Trash2, Repeat, Maximize2, User,
  BadgeCheck, PartyPopper, Zap, Clock
} from 'lucide-react';
import Link from 'next/link';

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
  const [expandedMedia, setExpandedMedia] = useState<string | null>(null);
  
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);

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
            id, content, media, image_url, created_at, user_id,
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

      setPosts(formattedPosts);
      
      // Calculate real trending and recent activity
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
      setPosts(prev => [formattedInserted, ...prev]);
      setRecentActivity(prev => [formattedInserted, ...prev.slice(0, 4)]);
      setNewPost('');
      setPostMedia([]); 
    }
    setIsPosting(false);
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
            <button onClick={() => setReplyTo({ commentId: c.id, userName: c.profiles?.full_name })} className="hover:text-black dark:hover:text-white transition-colors">Reply</button>
            <span className="text-[10px] text-zinc-400 font-medium">{new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
          {renderComments(postId, comments, c.id, depth + 1)}
        </div>
      </div>
    ));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><Loader2 className="animate-spin text-[#9cf822]" /></div>;

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] transition-colors duration-300 pb-24">
      
      {/* Media Overlay */}
      {expandedMedia && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4" onClick={() => setExpandedMedia(null)}>
          <button className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32} /></button>
          <img src={expandedMedia} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Enlarged" />
        </div>
      )}

      {/* MOBILE LIVE PULSE TICKER: Twitter style what's happening for mobile */}
      <div className="sm:hidden w-full bg-white dark:bg-black border-b border-zinc-100 dark:border-zinc-900 py-3 overflow-hidden">
        <div className="px-4 flex items-center gap-2 mb-2">
          <Zap size={14} className="text-[#9cf822] fill-[#9cf822]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">What's Happening</span>
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

      <header className="hidden sm:block bg-white dark:bg-[#0a0a0a] border-b border-zinc-200 dark:border-zinc-900 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="text-left">
            <h1 className="text-xl font-bold text-black dark:text-white tracking-tight flex items-center gap-2">
              <Globe className="text-[#9cf822]" size={20} /> Community Feed
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Global Activity</p>
          </div>
          <Link href="/dashboard" className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 text-sm font-bold rounded-xl text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
            Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-0 sm:px-6 pt-0 sm:pt-8 grid grid-cols-1 lg:grid-cols-12 gap-0 sm:gap-10">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-0 sm:space-y-6 order-2 lg:order-1">
          {/* Post Composer */}
          <div className="bg-white dark:bg-[#0a0a0a] sm:rounded-[2.5rem] p-4 sm:p-8 border-b sm:border border-zinc-200 dark:border-zinc-800 shadow-sm text-left">
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
                  {postMedia.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {postMedia.map((m, idx) => (
                        <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden bg-black">
                          <img src={m.url} className="w-full h-full object-cover" />
                          <button onClick={() => removeMedia(idx)} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white"><X size={14}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <div className="flex items-center gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleMediaUpload} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-[#9cf822] hover:bg-[#9cf822]/10 rounded-full transition-colors"><ImageIcon size={20} /></button>
                </div>
                <button type="submit" disabled={isPosting || (!newPost.trim() && postMedia.length === 0)} className="px-8 py-3 bg-[#9cf822] text-black font-black text-xs rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#9cf822]/20 uppercase tracking-widest">
                  Post Update
                </button>
              </div>
            </form>
          </div>

          {/* Posts List */}
          <div className="space-y-0 sm:space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white dark:bg-[#0a0a0a] sm:rounded-[2.5rem] p-4 sm:p-8 border-b sm:border border-zinc-200 dark:border-zinc-800 transition-colors text-left">
                <div className="flex items-start gap-4">
                  <Link href={`/profile/${post.user_id}`} className="shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border-2 border-transparent hover:border-[#9cf822] transition-colors">
                      <img src={post.profiles?.avatar_url} className="w-full h-full object-cover" />
                    </div>
                  </Link>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 truncate">
                        <Link href={`/profile/${post.user_id}`} className="font-black text-black dark:text-white hover:underline truncate flex items-center gap-1.5">
                          {post.profiles?.full_name}
                          {post.profiles?.is_verified && <BadgeCheck size={16} fill="#9cf822" className="text-white dark:text-black" />}
                        </Link>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                    <p className="text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap text-[15px] leading-relaxed mt-2">{post.content}</p>
                    
                    {post.media?.length > 0 && (
                       <div className={`mt-4 grid gap-2 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {post.media.map((m: any, i: number) => (
                            <div key={i} className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-black cursor-pointer" onClick={() => setExpandedMedia(m.url)}>
                              <img src={m.url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                            </div>
                          ))}
                       </div>
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
                    </div>

                    {activeCommentPost === post.id && (
                      <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-900 animate-in slide-in-from-top-2">
                        <div className="mb-4">{renderComments(post.id, post.comments)}</div>
                        <div className="flex gap-2 items-center">
                          <input 
                            type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
                            placeholder="Write a comment..." 
                            className="flex-grow bg-zinc-100 dark:bg-zinc-900 rounded-full px-4 py-2.5 text-sm outline-none border border-transparent focus:border-[#9cf822] text-black dark:text-white"
                          />
                          <button onClick={() => submitComment(post.id)} disabled={!commentText.trim()} className="text-[#9cf822] p-2">
                            <Send size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STATIC DESKTOP SIDEBAR */}
        <div className="lg:col-span-4 space-y-8 order-1 lg:order-2 hidden lg:block">
          <div className="sticky top-24 space-y-8">
            
            {/* COMMUNITY HUB: TRENDING TAGS */}
            <div className="w-full bg-gradient-to-br from-[#1a2e05] to-[#0a1401] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden text-left">
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#9cf822]/10 blur-[80px] rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={18} className="text-[#9cf822]" />
                  <h3 className="font-bold text-white text-lg tracking-tight uppercase tracking-widest">Community Hub</h3>
                </div>
                <p className="text-zinc-400 text-sm mb-8 font-medium italic">Join the conversation</p>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-zinc-500 mb-2">
                    <TrendingUp size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Trending Now</span>
                  </div>
                  {trendingTags.length > 0 ? trendingTags.map((tag, idx) => (
                    <div key={idx} className="flex flex-col gap-0.5 group cursor-pointer">
                       <span className="text-sm font-black text-white group-hover:text-[#9cf822] transition-colors">{tag.tag}</span>
                       <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{tag.count} Posts</span>
                    </div>
                  )) : <p className="text-xs text-zinc-600 font-bold">Waiting for updates...</p>}
                </div>
              </div>
            </div>

            {/* WHAT'S HAPPENING SIDEBAR */}
            <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 text-left shadow-sm">
               <h4 className="text-[10px] font-black text-[#9cf822] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <Clock size={12} /> What's Happening
               </h4>
               <div className="space-y-6">
                  {recentActivity.slice(0, 4).map((activity, i) => (
                    <div key={i} className="flex items-start gap-4 group cursor-pointer" onClick={() => router.push(`/profile/${activity.user_id}`)}>
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 group-hover:border-[#9cf822] transition-colors">
                        <img src={activity.profiles?.avatar_url} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-black text-black dark:text-white truncate group-hover:text-[#9cf822] transition-colors">{activity.profiles?.full_name}</p>
                          {activity.profiles?.is_verified && <BadgeCheck size={12} fill="#9cf822" className="text-white dark:text-black shrink-0" />}
                        </div>
                        <p className="text-[11px] text-zinc-500 line-clamp-1">{activity.content}</p>
                      </div>
                    </div>
                  ))}
               </div>
               <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="mt-8 text-[11px] font-black text-zinc-400 uppercase tracking-widest hover:text-[#9cf822] transition-colors">
                 Back to Top
               </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}