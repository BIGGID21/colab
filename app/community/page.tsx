'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  Loader2, Send, MapPin, Coffee, Image as ImageIcon, 
  Heart, MessageSquare, Share2, Sparkles, TrendingUp, 
  Code, Briefcase, Globe, X, Trash2, Repeat, Maximize2, User,
  BadgeCheck, PartyPopper
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
            id,
            content,
            created_at,
            parent_id,
            user_id,
            profiles:user_id(full_name, avatar_url, is_verified),
            comment_likes(user_id)
          ),
          repost:repost_id(
            id,
            content,
            media,
            image_url,
            created_at,
            user_id,
            profiles:user_id(full_name, avatar_url, role, is_verified)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) console.error("Error fetching feed:", error);

      const formattedPosts = (postData || []).map(post => {
        const hasLiked = post.likes?.some((like: any) => like.user_id === authUser.id);
        
        const formattedComments = (post.comments || []).map((c: any) => ({
          ...c,
          likes_count: c.comment_likes?.length || 0,
          _hasLiked: c.comment_likes?.some((cl: any) => cl.user_id === authUser.id)
        })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        return {
          ...post,
          _hasLiked: hasLiked,
          likes_count: post.likes?.length || 0,
          comments: formattedComments
        };
      });

      setPosts(formattedPosts);
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
    } catch (err: any) {
      alert("Failed to upload media.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
    const tempId = `temp-${Date.now()}`;
    
    const optimisticPost = {
      id: tempId,
      user_id: user.id,
      content: postContent,
      media: postMedia,
      created_at: new Date().toISOString(),
      likes_count: 0,
      reposts_count: 0,
      comments: [],
      _hasLiked: false,
      profiles: {
        full_name: profile?.full_name || 'Anonymous',
        avatar_url: profile?.avatar_url,
        role: profile?.role || 'Member',
        is_verified: profile?.is_verified
      }
    };
    
    setPosts(prev => [optimisticPost, ...prev]);
    setNewPost('');
    setPostMedia([]); 

    const { data: insertedPost, error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: postContent,
      media: postMedia
    }).select().single();

    if (error) {
      console.error("Failed to post:", error);
      setPosts(prev => prev.filter(p => p.id !== tempId));
    } else {
      setPosts(prev => prev.map(p => p.id === tempId ? { ...p, id: insertedPost.id } : p));
    }
    
    setIsPosting(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (postId.startsWith('temp-')) return; 
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    triggerHaptic([10, 20]);
    const previousPosts = [...posts]; 
    setPosts(prev => prev.filter(p => p.id !== postId));
    
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
    } catch (err: any) {
       alert(`Failed to delete post: ${err.message || 'Database error'}`);
       setPosts(previousPosts); 
    }
  };

  const handleRepost = async (originalPost: any) => {
    triggerHaptic(20);
    const originalId = originalPost.repost_id || originalPost.id;
    const originalContent = originalPost.repost || originalPost;

    const tempId = `temp-repost-${Date.now()}`;
    const optimisticPost = {
      id: tempId,
      user_id: user.id,
      content: '',
      media: [],
      created_at: new Date().toISOString(),
      likes_count: 0,
      reposts_count: 0,
      comments: [],
      repost_id: originalId,
      repost: originalContent,
      profiles: {
        full_name: profile?.full_name || 'Me',
        avatar_url: profile?.avatar_url,
        is_verified: profile?.is_verified
      }
    };

    const previousPosts = [...posts];
    setPosts(prev => [
      optimisticPost, 
      ...prev.map(p => p.id === originalId ? { ...p, reposts_count: (p.reposts_count || 0) + 1 } : p)
    ]);

    try {
      const { data: insertedRepost, error: insertError } = await supabase.from('posts').insert({ 
        user_id: user.id, 
        repost_id: originalId, 
        content: '' 
      }).select().single();
      
      if (insertError) throw insertError;
      if (insertedRepost) {
         setPosts(prev => prev.map(p => p.id === tempId ? { ...p, id: insertedRepost.id } : p));
      }
      
      const { error: updateError } = await supabase.from('posts').update({ reposts_count: (originalPost.reposts_count || 0) + 1 }).eq('id', originalId);
      if (updateError) throw updateError;

    } catch (err: any) {
      alert(`Failed to repost: ${err.message || 'Check database permissions'}`);
      setPosts(previousPosts); 
    }
  };

  const handleLike = async (postId: string, currentLikes: number, hasLiked: boolean) => {
    if (postId.startsWith('temp-')) return;
    triggerHaptic(10);
    
    setPosts(prev => prev.map(p => p.id === postId ? { 
      ...p, 
      likes_count: hasLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1, 
      _hasLiked: !hasLiked 
    } : p));

    try {
      if (hasLiked) {
        const { error } = await supabase.from('likes').delete().match({ post_id: postId, user_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    } catch (err: any) {
      setPosts(prev => prev.map(p => p.id === postId ? { 
        ...p, 
        likes_count: currentLikes, 
        _hasLiked: hasLiked 
      } : p));
    }
  };

  const handleCommentLike = async (postId: string, commentId: string, currentLikes: number, hasLiked: boolean) => {
    if (commentId.startsWith('temp-')) return;
    triggerHaptic(10);
    
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      comments: p.comments.map((c: any) => c.id === commentId ? {
        ...c,
        likes_count: hasLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1,
        _hasLiked: !hasLiked
      } : c)
    } : p));

    try {
      if (hasLiked) {
        const { error } = await supabase.from('comment_likes').delete().match({ comment_id: commentId, user_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id });
        if (error) throw error;
      }
    } catch (err: any) {
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        comments: p.comments.map((c: any) => c.id === commentId ? {
          ...c, likes_count: currentLikes, _hasLiked: hasLiked
        } : c)
      } : p));
    }
  };

  const submitComment = async (postId: string) => {
    if (!commentText.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    triggerHaptic(15);

    const tempId = `temp-comment-${Date.now()}`;
    const newComment = {
      id: tempId,
      content: commentText.trim(),
      created_at: new Date().toISOString(),
      parent_id: replyTo?.commentId || null,
      user_id: user.id, 
      likes_count: 0,
      _hasLiked: false,
      profiles: { 
        full_name: profile?.full_name || 'Me', 
        avatar_url: profile?.avatar_url,
        is_verified: profile?.is_verified
      }
    };

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), newComment] } : p));
    setCommentText('');
    
    const targetParentId = replyTo?.commentId || null;
    setReplyTo(null); 
    
    try {
      const { data: insertedComment, error } = await supabase.from('comments').insert({ 
        post_id: postId, 
        user_id: user.id, 
        content: newComment.content,
        parent_id: targetParentId
      }).select().single();
      
      if (error) throw error;
      if (insertedComment) {
         setPosts(prev => prev.map(p => p.id === postId ? { 
           ...p, 
           comments: p.comments.map((c: any) => c.id === tempId ? { ...c, id: insertedComment.id } : c)
         } : p));
      }
    } catch (err: any) {
       setPosts(prev => prev.map(p => p.id === postId ? {
         ...p, comments: p.comments.filter((c: any) => c.id !== tempId)
       } : p));
    } finally {
      setIsSubmittingComment(false);
    }
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
            <button onClick={() => handleCommentLike(postId, c.id, c.likes_count, c._hasLiked)} className={`flex items-center gap-1 transition-colors hover:text-rose-500 ${c._hasLiked ? 'text-rose-500' : ''}`}>
               <Heart size={12} fill={c._hasLiked ? 'currentColor' : 'none'} />
               {c.likes_count > 0 && <span>{c.likes_count}</span>}
            </button>
            <button onClick={() => setReplyTo({ commentId: c.id, userName: c.profiles?.full_name })} className="hover:text-black dark:hover:text-white transition-colors">
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
    <div className="min-h-screen bg-white dark:bg-[#050505] transition-colors duration-300 pb-24">
      
      {/* Media Overlay */}
      {expandedMedia && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setExpandedMedia(null)}>
          <button className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32} /></button>
          <img src={expandedMedia} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Enlarged" />
        </div>
      )}

      {/* Desktop Header */}
      <header className="hidden sm:block bg-white dark:bg-[#0a0a0a] border-b border-zinc-200 dark:border-zinc-900 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="text-left">
            <h1 className="text-xl font-bold text-black dark:text-white tracking-tight flex items-center gap-2">
              <Globe className="text-[#9cf822]" size={20} /> Community Feed
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">CoLab Global Network</p>
          </div>
          <Link href="/dashboard" className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 text-sm font-bold rounded-xl text-black dark:text-white transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800">
            Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-0 sm:px-6 pt-0 sm:pt-8 grid grid-cols-1 lg:grid-cols-12 gap-0 sm:gap-8">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-0 sm:space-y-6 order-2 lg:order-1">
          
          {/* Mobile Header */}
          <div className="sm:hidden px-4 py-6 bg-white dark:bg-black border-b border-zinc-100 dark:border-zinc-900 text-left">
             <h1 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
               <Globe className="text-[#9cf822]" size={20} /> Community Feed
             </h1>
          </div>

          {/* Post Composer */}
          <div className="bg-white dark:bg-[#0a0a0a] sm:rounded-[2rem] p-4 sm:p-6 border-b sm:border border-zinc-200 dark:border-zinc-800 shadow-sm text-left">
            <form onSubmit={handlePost}>
              <div className="flex gap-4">
                <Link href={`/profile/${user?.id}`} className="shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:opacity-80 transition-opacity">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <User size={20} />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex-grow">
                  <textarea 
                    ref={textAreaRef}
                    value={newPost} onChange={(e) => setNewPost(e.target.value)}
                    placeholder="What are you building today?"
                    className="w-full bg-transparent resize-none text-black dark:text-white text-base sm:text-lg focus:outline-none min-h-[60px] sm:min-h-[80px]"
                  />
                  {postMedia.length > 0 && (
                    <div className={`mt-2 grid gap-2 ${postMedia.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {postMedia.map((media, index) => (
                        <div key={index} className="relative aspect-[4/5] w-full bg-black rounded-xl overflow-hidden">
                          {media.type === 'video' ? <video src={media.url} className="w-full h-full object-cover" /> : <img src={media.url} className="w-full h-full object-cover" />}
                          <button type="button" onClick={() => removeMedia(index)} className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white p-1.5 rounded-full"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <div className="flex items-center gap-1">
                  <input type="file" ref={fileInputRef} onChange={handleMediaUpload} accept="image/*,video/*" multiple className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-[#9cf822] hover:bg-[#9cf822]/10 rounded-full transition-colors"><ImageIcon size={20} /></button>
                  <button type="button" onClick={() => setNewPost(p => p + " 📍 ")} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors"><MapPin size={20} /></button>
                  <button type="button" onClick={() => setNewPost(p => p + " ☕ ")} className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-full transition-colors"><Coffee size={20} /></button>
                </div>
                <button type="submit" disabled={isPosting || isUploadingImage} className="px-6 py-2 bg-[#9cf822] text-black font-black text-sm rounded-xl transition-all active:scale-95 disabled:opacity-50">
                  {isPosting ? <Loader2 size={16} className="animate-spin" /> : "Post"}
                </button>
              </div>
            </form>
          </div>

          {/* Posts List */}
          <div className="space-y-0 sm:space-y-4">
            {posts.map((post) => {
              const targetUserId = post.repost_id ? post.repost?.user_id : post.user_id;

              return (
                <div key={post.id} className="bg-white dark:bg-[#0a0a0a] sm:rounded-[2rem] p-4 sm:p-6 border-b sm:border border-zinc-200 dark:border-zinc-800 transition-colors text-left relative">
                  
                  {post.repost_id && (
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold mb-4 ml-1">
                      <Repeat size={14} className="text-[#9cf822]" /> 
                      <Link href={`/profile/${post.user_id}`} className="hover:underline flex items-center gap-1">
                        <span>{post.profiles?.full_name} reshared</span>
                        {post.profiles?.is_verified && <BadgeCheck size={12} fill="#9cf822" className="text-white dark:text-black shrink-0" />}
                      </Link>
                    </div>
                  )}

                  <div className="flex items-start gap-3 sm:gap-4">
                    <Link href={`/profile/${targetUserId}`} className="shrink-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-zinc-800 border border-zinc-200 dark:border-zinc-800 hover:opacity-80 transition-opacity">
                        <img src={post.repost_id ? post.repost?.profiles?.avatar_url : post.profiles?.avatar_url} className="w-full h-full object-cover" alt="" />
                      </div>
                    </Link>
                    
                    <div className="flex-grow w-full overflow-hidden">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Link href={`/profile/${targetUserId}`} className="hover:underline truncate flex items-center gap-1">
                            <h4 className="font-bold text-black dark:text-white truncate text-sm sm:text-base">
                              {post.repost_id ? post.repost?.profiles?.full_name : (post.profiles?.full_name || 'Anonymous')}
                            </h4>
                            {(post.repost_id ? post.repost?.profiles?.is_verified : post.profiles?.is_verified) && (
                              <BadgeCheck size={16} fill="#9cf822" className="text-white dark:text-black shrink-0" />
                            )}
                          </Link>
                          <span className="hidden sm:inline-block text-[10px] uppercase bg-zinc-100 dark:bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded font-bold whitespace-nowrap shrink-0">
                            {post.repost_id ? post.repost?.profiles?.role : (post.profiles?.role || 'Member')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className="text-[10px] text-zinc-400">{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          {user?.id === post.user_id && (
                            <button onClick={() => handleDeletePost(post.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className={post.repost_id ? "mt-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-900/40" : ""}>
                        <p className="text-black dark:text-zinc-300 whitespace-pre-wrap text-sm sm:text-[15px] leading-relaxed mt-1">{post.repost_id ? post.repost?.content : post.content}</p>

                        {((post.repost_id ? post.repost?.media : post.media) || []).length > 0 && (
                          <div className={`mt-3 grid gap-1.5 ${((post.repost_id ? post.repost?.media : post.media) || []).length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {((post.repost_id ? post.repost?.media : post.media) || []).map((m: any, idx: number) => (
                              <div key={idx} className="group relative rounded-xl overflow-hidden aspect-[4/5] bg-black cursor-pointer" onClick={() => m.type !== 'video' && setExpandedMedia(m.url)}>
                                {m.type === 'video' ? (
                                  <video src={m.url} controls className="w-full h-full object-cover" />
                                ) : (
                                  <>
                                    <img src={m.url} alt="Community update" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                                      <Maximize2 size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-6 mt-4 pb-1">
                        <button onClick={() => handleLike(post.id, post.likes_count || 0, post._hasLiked)} className={`flex items-center gap-1.5 ${post._hasLiked ? 'text-rose-500' : 'text-zinc-400 hover:text-rose-500'}`}>
                          <Heart size={18} fill={post._hasLiked ? 'currentColor' : 'none'} />
                          <span className="text-xs font-bold">{post.likes_count || 0}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-zinc-400 hover:text-blue-500" onClick={() => {
                          setActiveCommentPost(activeCommentPost === post.id ? null : post.id);
                          setReplyTo(null);
                        }}>
                          <MessageSquare size={18} />
                          <span className="text-xs font-bold">{post.comments?.length || 0}</span>
                        </button>
                        <button onClick={() => handleRepost(post)} className="flex items-center gap-1.5 text-zinc-400 hover:text-[#9cf822]">
                          <Repeat size={18} />
                          <span className="text-xs font-bold">{post.reposts_count || 0}</span>
                        </button>
                        <button className="flex items-center text-zinc-400 ml-auto hover:text-emerald-500" onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }}>
                          <Share2 size={18} />
                        </button>
                      </div>

                      {activeCommentPost === post.id && (
                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 animate-in slide-in-from-top-2">
                          <div className="mb-6">{renderComments(post.id, post.comments, null, 0)}</div>
                          {replyTo && (
                            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 mb-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg inline-flex">
                              <span>Replying to <span className="text-black dark:text-white">{replyTo.userName}</span></span>
                              <button onClick={() => setReplyTo(null)} className="ml-3 hover:text-black dark:hover:text-white"><X size={12}/></button>
                            </div>
                          )}
                          <div className="flex gap-2 items-center">
                            <input 
                              type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
                              placeholder={replyTo ? `Reply...` : `Write a comment...`} 
                              className="flex-grow bg-zinc-100 dark:bg-zinc-900 rounded-full px-4 py-2.5 text-sm outline-none border border-transparent focus:border-[#9cf822] text-black dark:text-white"
                            />
                            <button onClick={() => submitComment(post.id)} disabled={!commentText.trim()} className="text-[#9cf822] p-2 hover:bg-[#9cf822]/10 rounded-full">
                              <Send size={18} />
                            </button>
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

        {/* Community Hub Column (First on Mobile, Right on Desktop) */}
        <div className="lg:col-span-4 space-y-6 order-1 lg:order-2 px-4 sm:px-0 py-6 sm:py-0">
          <div className="w-full bg-gradient-to-br from-[#1a2e05] to-[#0a1401] rounded-[2rem] p-8 border border-white/5 shadow-2xl overflow-hidden relative group transition-all hover:border-[#9cf822]/20 text-left">
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#9cf822]/10 blur-[80px] rounded-full group-hover:bg-[#9cf822]/20 transition-all duration-700" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-[#9cf822]" />
                <h3 className="font-bold text-white text-lg tracking-tight">Community Hub</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-8 font-medium">Engaging increases visibility by <span className="text-[#9cf822] font-bold">40%.</span></p>

              <button 
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  textAreaRef.current?.focus();
                }}
                className="w-full py-4 bg-zinc-200 hover:bg-white text-black font-black rounded-2xl transition-all active:scale-95 shadow-lg mb-8 text-sm uppercase tracking-wider"
              >
                Share Update
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-zinc-500 mb-4">
                  <TrendingUp size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Trending Now</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button className="flex items-center gap-3 group/tag w-full text-left">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 transition-transform group-hover/tag:scale-110"><Code size={14} /></div>
                    <span className="text-sm font-bold text-zinc-300 group-hover/tag:text-white">#BuildInPublic</span>
                  </button>
                  <button className="flex items-center gap-3 group/tag w-full text-left">
                    <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 transition-transform group-hover/tag:scale-110"><Briefcase size={14} /></div>
                    <span className="text-sm font-bold text-zinc-300 group-hover/tag:text-white">#HiringCreators</span>
                  </button>
                  <button className="flex items-center gap-3 group/tag w-full text-left">
                    <div className="p-2 rounded-xl bg-[#9cf822]/20 text-[#9cf822] transition-transform group-hover/tag:scale-110"><PartyPopper size={14} /></div>
                    <span className="text-sm font-bold text-zinc-300 group-hover/tag:text-white">#CoLabVerified</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Sidebar Info */}
          <div className="hidden lg:block bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 text-left">
            <h4 className="font-bold text-black dark:text-white mb-4 text-sm uppercase tracking-widest">Global Network</h4>
            <div className="flex items-center gap-2 text-zinc-500 text-xs">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>482 creators active online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}