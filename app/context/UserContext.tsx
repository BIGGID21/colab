'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface UserContextType {
  user: any | null;
  profile: any | null;
  unreadNotifications: number;
  unreadMessages: number;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  unreadNotifications: 0,
  unreadMessages: 0,
  isLoading: true,
  refreshProfile: async () => {},
});

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const refreshProfile = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) setProfile(data);
  };

  useEffect(() => {
    let notificationsChannel: any;
    let messagesChannel: any;
    let profilesChannel: any;

    const initData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      if (authUser) {
        // 1. Initial Data Fetch
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        setProfile(userProfile);

        const { count: notifCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id)
          .eq('read', false);
        setUnreadNotifications(notifCount || 0);

        // Assume you have a messages table with a recipient_id and read status
        const { count: msgCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', authUser.id)
          .eq('read', false);
        setUnreadMessages(msgCount || 0);

        // 2. Setup Real-Time Listeners
        notificationsChannel = supabase
          .channel('public:notifications')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${authUser.id}` }, () => {
            setUnreadNotifications(prev => prev + 1);
          })
          .subscribe();

        messagesChannel = supabase
          .channel('public:messages')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${authUser.id}` }, () => {
            setUnreadMessages(prev => prev + 1);
          })
          .subscribe();

        profilesChannel = supabase
          .channel('public:profiles')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${authUser.id}` }, (payload) => {
            setProfile(payload.new);
          })
          .subscribe();
      }
      
      // Artificial delay just for the smooth splash screen animation
      setTimeout(() => setIsLoading(false), 800);
    };

    initData();

    return () => {
      if (notificationsChannel) supabase.removeChannel(notificationsChannel);
      if (messagesChannel) supabase.removeChannel(messagesChannel);
      if (profilesChannel) supabase.removeChannel(profilesChannel);
    };
  }, [supabase]);

  return (
    <UserContext.Provider value={{ user, profile, unreadNotifications, unreadMessages, isLoading, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}