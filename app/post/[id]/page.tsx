'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  Loader2, Heart, MessageSquare, Repeat, Share2, 
  ChevronLeft, User, Send
} from 'lucide-react';
import Link from 'next/link';

export default function SinglePostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(pattern);
  };

  useEffect(() => {
    async function fetchSinglePost() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return router.push('/login');
      setUser(authUser);

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      setProfile(userProfile);

      const { data: postData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(full_name, avatar_url, role),
          likes(user_id),
          comments(
            id,
            content,
            created_at,
            parent_id,
            profiles:user_id(full_name, avatar_url),
            comment_likes(user_id)
          ),
          repost:repost_id(
            id,
            content,
            media,
            image_url,
            created_at,
            profiles:user_id(full_name, avatar_url, role)
          )
        `)
        .eq('id', postId)
        .single();

      if (error) {
        console.error("Error fetching post:", error);
        setLoading(false);
        return;
      }

      if (postData) {
        const hasLiked = postData.likes?.some((like: any) => like.user_id === authUser.id);
        const formattedComments = (postData.comments || []).map((c: any) => ({
          ...c,
          likes_count: c.comment_likes?.length || 0,
          _hasLiked: c.comment_likes?.some((cl: any) => cl.user_id === authUser.id)
        })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        setPost({
          ...postData,
          _hasLiked: hasLiked,
          likes_count: postData.likes?.length || 0,
          comments: formattedComments
        });
      }
      setLoading(false);
    }

    if (postId) fetchSinglePost();
  }, [supabase, postId, router]);

  const handleLike = async () => {
    if (!post) return;
    triggerHaptic(10);
    
    const wasLiked = post._hasLiked;
    const currentLikes = post.likes_count;

    setPost({ ...post, likes_count: wasLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1, _hasLiked: !wasLiked });

    try {
      if (wasLiked) {
        await supabase.from('likes').delete().match({ post_id: post.id, user_id: user.id });
      } else {
        await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
      }
    } catch (err) {
      setPost({ ...post, likes_count: currentLikes, _hasLiked: wasLiked });
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || isSubmittingComment || !post) return;
    setIsSubmittingComment(true);
    triggerHaptic(15);

    const tempId = `temp-comment-${Date.now()}`;
    const newComment = {
      id: tempId,
      content: commentText.trim(),
      created_at: new Date().toISOString(),
      parent_id: null,
      likes_count: 0,
      _hasLiked: false,
      profiles: { full_name: profile?.full_name || 'Me', avatar_url: profile?.avatar_url }
    };

    setPost({ ...post, comments: [...(post.comments || []), newComment] });
    setCommentText('');
    
    try {
      const { data: insertedComment, error } = await supabase.from('comments').insert({ 
        post_id: post.id, 
        user_id: user.id, 
        content: newComment.content,
        parent_id: null
      }).select().single();
      
      if (!error && insertedComment) {
         setPost((prev: any) => ({ 
           ...prev, 
           comments: prev.comments.map((c: any) => c.id === tempId ? { ...c, id: insertedComment.id } : c)
         }));
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><Loader2 className="animate-spin text-[#9cf822]" /></div>;
  if (!post) return <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-zinc-500"><p>Post not found.</p><Link href="/community" className="mt-4 text-[#9cf822] hover:underline">Go back</Link></div>;

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] transition-colors duration-300 pb-20">
      <header className="bg-white dark:bg-[#0a0a0a] border-b border-zinc-200 dark:border-zinc-900 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-black dark:text-white">Post</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-0 sm:px-6 pt-0 sm:pt-8">
        <div className="bg-white dark:bg-[#0a0a0a] sm:rounded-[2rem] p-4 sm:p-6 border-b sm:border border-zinc-200 dark:border-zinc-800 shadow-sm relative">
          
          {post.repost_id && (
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold mb-4 ml-1">
              <Repeat size={14} className="text-[#9cf822]" /> <span>{post.profiles?.full_name} reshared</span>
            </div>
          )}

          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-800">
              <img src={post.repost_id ? post.repost?.profiles?.avatar_url : post.profiles?.avatar_url} className="w-full h-full object-cover" alt="" />
            </div>
            
            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <h4 className="font-bold text-black dark:text-white truncate text-sm sm:text-base">
                    {post.repost_id ? post.repost?.profiles?.full_name : (post.profiles?.full_name || 'Anonymous')}
                  </h4>
                  <span className="hidden sm:inline-block text-[10px] uppercase bg-zinc-100 dark:bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded font-bold whitespace-nowrap shrink-0">
                    {post.repost_id ? post.repost?.profiles?.role : (post.profiles?.role || 'Member')}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 shrink-0 ml-2">{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
              
              <div className={post.repost_id ? "mt-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-900/40" : ""}>
                <p className="text-black dark:text-zinc-300 whitespace-pre-wrap text-base sm:text-lg leading-relaxed mt-1">{post.repost_id ? post.repost?.content : post.content}</p>

                {((post.repost_id ? post.repost?.media : post.media) || []).length > 0 && (
                  <div className={`mt-4 grid gap-1.5 ${((post.repost_id ? post.repost?.media : post.media) || []).length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {((post.repost_id ? post.repost?.media : post.media) || []).map((m: any, idx: number) => (
                      <div key={idx} className="group relative rounded-xl overflow-hidden aspect-[4/5] bg-black">
                        {m.type === 'video' ? <video src={m.url} controls className="w-full h-full object-cover" /> : <img src={m.url} className="w-full h-full object-cover" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 mt-6 pb-4 border-b border-zinc-100 dark:border-zinc-900">
                <button onClick={handleLike} className={`flex items-center gap-1.5 ${post._hasLiked ? 'text-rose-500' : 'text-zinc-400 hover:text-rose-500'}`}>
                  <Heart size={20} fill={post._hasLiked ? 'currentColor' : 'none'} />
                  <span className="text-sm font-bold">{post.likes_count || 0}</span>
                </button>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <MessageSquare size={20} />
                  <span className="text-sm font-bold">{post.comments?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Repeat size={20} />
                  <span className="text-sm font-bold">{post.reposts_count || 0}</span>
                </div>
                <button className="flex items-center text-zinc-400 ml-auto hover:text-emerald-500" onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Copied!"); }}>
                  <Share2 size={20} />
                </button>
              </div>

              <div className="mt-4 pt-2">
                <div className="flex gap-3 items-center mb-6">
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
                    {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User size={16} className="m-auto mt-2 text-zinc-400" />}
                  </div>
                  <input 
                    type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                    placeholder="Post a reply..." className="flex-grow bg-zinc-100 dark:bg-zinc-900 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#9cf822] border border-transparent text-black dark:text-white"
                  />
                  <button onClick={submitComment} disabled={!commentText.trim() || isSubmittingComment} className="text-[#9cf822] p-2 hover:bg-[#9cf822]/10 rounded-full disabled:opacity-50">
                    <Send size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  {post.comments?.filter((c:any) => !c.parent_id).map((c: any) => (
                    <div key={c.id} className="flex gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800">
                        {c.profiles?.avatar_url && <img src={c.profiles.avatar_url} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-2xl rounded-tl-none inline-block max-w-full">
                          <span className="font-bold block text-xs mb-1 text-black dark:text-white truncate">{c.profiles?.full_name}</span>
                          <span className="text-zinc-800 dark:text-zinc-300 break-words">{c.content}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}