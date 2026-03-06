'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  Loader2, Heart, MessageSquare, Repeat, 
  Bell, User
} from 'lucide-react'; 

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(pattern);
  };

  useEffect(() => {
    async function fetchInitialData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);

      const { data: notifsData, error: notifsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (notifsError) {
        console.error("Error fetching notifications:", notifsError);
        setLoading(false);
        return;
      }

      if (notifsData && notifsData.length > 0) {
        const actorIds = Array.from(new Set(notifsData.map(n => n.actor_id).filter(Boolean)));
        
        let profileMap: Record<string, any> = {};

        if (actorIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role')
            .in('id', actorIds);
            
          if (profilesError) console.error("Error fetching profiles for notifs:", profilesError);

          profileMap = (profilesData || []).reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);
        }

        const enrichedNotifications = notifsData.map(n => ({
          ...n,
          actor: profileMap[n.actor_id] || null
        }));

        setNotifications(enrichedNotifications);
      } else {
        setNotifications([]);
      }
      
      setLoading(false);
    }
    
    fetchInitialData();

    const channel = supabase
      .channel('realtime_notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications'
      }, (payload) => {
        if (payload.new.user_id === user?.id) {
          refreshNewNotification(payload.new.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, user?.id]);

  const refreshNewNotification = async (notifId: string) => {
    const { data: newNotif, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notifId)
      .single();
    
    if (error) {
      console.error("Error fetching real-time notif:", error);
      return;
    }

    if (newNotif && newNotif.actor_id) {
      const { data: actorProfile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .eq('id', newNotif.actor_id)
        .single();
        
      const enrichedNotif = { ...newNotif, actor: actorProfile || null };
      
      setNotifications(prev => [enrichedNotif, ...prev]);
      triggerHaptic([20, 10, 20]);
    }
  };

  const handleNotificationClick = async (e: React.MouseEvent, notification: any) => {
    e.preventDefault(); 
    
    // Instantly clear the green dot locally
    if (!notification.read) {
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      ));
      
      // Update database in the background
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);
    }

    // Route to the post page
    router.push(`/post/${notification.post_id}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><Loader2 className="animate-spin text-[#9cf822]" /></div>;

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] pb-24">
      <header className="bg-white dark:bg-[#0a0a0a] border-b border-zinc-200 dark:border-zinc-900 px-6 py-5 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <Bell size={20} className="text-[#9cf822]" /> Notifications
          </h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-0 sm:px-6 pt-0 sm:pt-6">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-900 bg-white dark:bg-[#0a0a0a] sm:rounded-[2rem] sm:border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          {notifications.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-zinc-500">
              <Bell size={48} className="opacity-10 mb-4" />
              <p className="text-sm font-medium">Your activity will appear here</p>
            </div>
          ) : (
            notifications.map((n) => (
              <a 
                key={n.id} 
                href={`/post/${n.post_id}`} 
                onClick={(e) => handleNotificationClick(e, n)}
                className={`cursor-pointer flex items-start gap-4 p-5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50 ${!n.read ? 'bg-[#9cf822]/5 dark:bg-[#9cf822]/5' : ''}`}
              >
                <div className="mt-1 shrink-0">
                  {n.type === 'like' && <Heart size={18} className="text-rose-500" fill="currentColor" />}
                  {n.type === 'comment' && <MessageSquare size={18} className="text-blue-500" fill="currentColor" />}
                  {n.type === 'reshare' && <Repeat size={18} className="text-[#9cf822]" />}
                </div>

                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-800">
                  {n.actor?.avatar_url ? (
                    <img src={n.actor.avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <User size={16} className="m-auto mt-2.5 text-zinc-400" />
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <p className="text-sm text-zinc-900 dark:text-zinc-200 leading-snug">
                    <span className="font-bold text-black dark:text-white">{n.actor?.full_name || 'Someone'}</span>
                    {n.type === 'like' && ' liked your post.'}
                    {n.type === 'reshare' && ' reshared your update.'}
                    {n.type === 'comment' && ' commented on your post.'}
                  </p>
                  
                  {n.content && (
                    <p className="text-xs text-zinc-500 mt-1.5 italic line-clamp-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-2">
                      "{n.content}"
                    </p>
                  )}
                  
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight mt-2 block">
                    {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-[#9cf822] mt-2 shadow-[0_0_10px_#9cf822]" />
                )}
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
