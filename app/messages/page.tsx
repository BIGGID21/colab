'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Loader2, ArrowLeft, Send, Search, User, 
  MessageSquare, BadgeCheck, Lock, Sparkles, X, Crown,
  Trash2, Reply, Info, Paperclip, FileText
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

// Custom WhatsApp-style collaboration doodle background
const CHAT_WALLPAPER_SVG = `data:image/svg+xml,%3Csvg width='150' height='150' viewBox='0 0 150 150' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='rgba(128,128,128,0.06)' stroke-width='2' fill='none' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M25 25h10v10H25zM110 30c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10-10-4.48-10-10zM30 110l10-10 10 10M115 110h-10v-10h10v10zm-15-5h-10m-5 0h-5m25-5v-10m0-5v-5M45 45l10-10 10 10m-10-10v20M95 95a15 15 0 1 0 0-30 15 15 0 0 0 0 30zM90 80h10M95 75v10M25 85a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM120 70l10-10 10 10M55 125v-10h10v10H55z'/%3E%3C/g%3E%3C/svg%3E`;

function InboxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlUserId = searchParams.get('u') || searchParams.get('compose');

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Chat State
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<any>(null);
  const activeChatUserRef = useRef<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Paywall State
  const [showProModal, setShowProModal] = useState(false);
  const [initiatedCount, setInitiatedCount] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(pattern);
  };

  useEffect(() => {
    activeChatUserRef.current = activeChatUser;
  }, [activeChatUser]);

  // Bulletproof Initialization Sequence
  useEffect(() => {
    const initializeInbox = async () => {
      setLoading(true);
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return router.push('/login');
      setUser(authUser);

      // 1. Fetch Contact List Data
      let { data: dms, error: dmsError } = await supabase
        .from('direct_messages')
        .select(`*, sender:profiles!sender_id(id, full_name, avatar_url, is_verified), receiver:profiles!receiver_id(id, full_name, avatar_url, is_verified)`)
        .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`)
        .order('created_at', { ascending: false });

      if (dmsError || !dms) {
        const { data: rawDms } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`)
          .order('created_at', { ascending: false });

        if (rawDms && rawDms.length > 0) {
          const uniqueUserIds = Array.from(new Set(rawDms.flatMap(dm => [dm.sender_id, dm.receiver_id])));
          const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url, is_verified').in('id', uniqueUserIds);
          
          dms = rawDms.map(dm => ({
            ...dm,
            sender: profiles?.find(p => p.id === dm.sender_id) || { id: dm.sender_id, full_name: 'User' },
            receiver: profiles?.find(p => p.id === dm.receiver_id) || { id: dm.receiver_id, full_name: 'User' }
          }));
        } else {
          dms = [];
        }
      }

      const contactMap = new Map();
      const uniqueSentReceivers = new Set();

      (dms || []).forEach(dm => {
        const isMeSender = dm.sender_id === authUser.id;
        const otherUser = isMeSender ? dm.receiver : dm.sender;
        
        if (!otherUser || !otherUser.id) return;
        if (isMeSender) uniqueSentReceivers.add(otherUser.id);

        if (!contactMap.has(otherUser.id)) {
          contactMap.set(otherUser.id, {
            user: otherUser,
            lastMessage: dm,
            unread: !isMeSender && !dm.is_read
          });
        }
      });

      setInitiatedCount(uniqueSentReceivers.size);
      const sortedContacts = Array.from(contactMap.values());
      setContacts(sortedContacts);

      // 2. Resolve Active Chat User
      let currentActiveUser = null;
      if (urlUserId) {
        const existingContact = sortedContacts.find(c => c.user.id === urlUserId);
        if (existingContact) {
          currentActiveUser = existingContact.user;
        } else {
          const { data: targetProfile } = await supabase.from('profiles').select('*').eq('id', urlUserId).single();
          if (targetProfile) currentActiveUser = targetProfile;
        }
      } else if (sortedContacts.length > 0 && typeof window !== 'undefined' && window.innerWidth > 768) {
        currentActiveUser = sortedContacts[0].user;
        router.replace(`?u=${currentActiveUser.id}`, { scroll: false });
      }

      // 3. Fetch Messages for the Resolved User
      if (currentActiveUser) {
        setActiveChatUser(currentActiveUser);
        await fetchMessages(authUser.id, currentActiveUser.id);
      } else {
        setLoading(false);
      }
    };

    initializeInbox();
  }, [urlUserId]);

  const fetchMessages = async (myId: string, targetId: string) => {
    const { data, error } = await supabase
      .from('direct_messages')
      .select(`*, reply_to:reply_to_id(id, content, sender_id, file_name)`)
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true });
    
    if (error) {
      const { data: fallbackData } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${myId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${myId})`)
        .order('created_at', { ascending: true });
      
      setMessages(fallbackData || []);
    } else {
      setMessages(data || []);
    }
    
    scrollToBottom();
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`dms_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (activeChatUserRef.current && (activeChatUserRef.current.id === payload.new.sender_id || user.id === payload.new.sender_id)) {
             fetchMessages(user.id, activeChatUserRef.current.id); 
          }
        }
        if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleSelectContact = (contactUser: any) => {
    if (activeChatUser?.id === contactUser.id) return; 
    setLoading(true); 
    router.push(`?u=${contactUser.id}`, { scroll: false });
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  };

  const handleSendMessage = async (e?: React.FormEvent, fileUrl?: string, fileName?: string, fileType?: string) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !fileUrl) || !activeChatUser || !user) return;

    const hasMessagedBefore = contacts.some(c => c.user.id === activeChatUser.id && c.lastMessage.sender_id === user.id);
    if (!user.is_pro && !hasMessagedBefore && initiatedCount >= 3) {
      setShowProModal(true);
      triggerHaptic([10, 30, 10]);
      return;
    }

    setIsSending(true);
    const messageContent = newMessage.trim();
    const currentReply = replyingTo;
    
    setNewMessage(''); 
    setReplyingTo(null);

    const tempId = Math.random().toString();
    const tempMessage = {
      id: tempId,
      sender_id: user.id,
      receiver_id: activeChatUser.id,
      content: messageContent,
      file_url: fileUrl || null,
      file_name: fileName || null,
      file_type: fileType || null,
      reply_to_id: currentReply?.id || null,
      reply_to: currentReply ? { id: currentReply.id, content: currentReply.content, sender_id: currentReply.sender_id, file_name: currentReply.file_name } : null,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    const { error } = await supabase.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: activeChatUser.id,
      content: messageContent,
      file_url: fileUrl || null,
      file_name: fileName || null,
      file_type: fileType || null,
      reply_to_id: currentReply?.id || null
    });

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId)); 
    }
    
    setIsSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activeChatUser) return;

    setIsUploading(true);
    triggerHaptic(10);

    const fileExt = file.name.split('.').pop();
    const safeFileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat_attachments')
      .upload(filePath, file);

    if (uploadError) {
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('chat_attachments').getPublicUrl(filePath);
    await handleSendMessage(undefined, publicUrl, file.name, file.type);
    
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = ''; 
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("Delete this message?")) return;
    triggerHaptic(10);
    setMessages(prev => prev.filter(m => m.id !== msgId)); 
    await supabase.from('direct_messages').delete().eq('id', msgId).eq('sender_id', user?.id);
  };

  const handleUpgradeToPro = async () => {
    await supabase.from('profiles').update({ is_pro: true }).eq('id', user.id);
    setUser({ ...user, is_pro: true });
    setShowProModal(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><Loader2 className="animate-spin text-[#9cf822]" /></div>;

  return (
    <div className="flex flex-col md:flex-row w-full h-screen bg-white dark:bg-black overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR */}
      <div className={`w-full md:w-80 lg:w-[400px] flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black flex flex-col h-full ${activeChatUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-4 py-3 shrink-0 bg-white/90 dark:bg-black/90 backdrop-blur-md z-10">
          <div className="flex items-center justify-between mb-4 mt-2">
             <h1 className="text-xl font-bold text-black dark:text-white">Messages</h1>
             <div className="flex gap-2">
               {user?.is_pro ? (
                 <Crown size={20} className="text-[#9cf822]" />
               ) : (
                 <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-full uppercase tracking-widest border border-zinc-200 dark:border-zinc-800">
                   {initiatedCount}/3 Free
                 </span>
               )}
             </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Direct Messages" 
              className="w-full bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#9cf822] transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {contacts.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <p className="text-xl font-bold text-black dark:text-white mb-2">Welcome to your inbox!</p>
              <p className="text-sm">Drop a line, share a project, or start a collaboration.</p>
            </div>
          ) : (
            contacts.map((contact) => (
              <button
                key={contact.user.id}
                onClick={() => handleSelectContact(contact.user)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors ${activeChatUser?.id === contact.user.id ? 'bg-zinc-50 dark:bg-zinc-900 border-r-2 border-[#9cf822]' : ''}`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 relative mt-1">
                  {contact.user.avatar_url ? (
                    <img src={contact.user.avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <User size={20} className="m-auto mt-3 text-zinc-400" />
                  )}
                  {contact.unread && <div className="absolute top-0 right-0 w-3 h-3 bg-[#9cf822] border-2 border-white dark:border-black rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[15px] text-black dark:text-white truncate flex items-center gap-1">
                      {contact.user.full_name}
                      {contact.user.is_verified && <BadgeCheck size={14} fill="#9cf822" className="text-white dark:text-black shrink-0" />}
                    </span>
                    <span className="text-[12px] text-zinc-500 shrink-0">
                      {formatDistanceToNow(new Date(contact.lastMessage.created_at), { addSuffix: false }).replace('about ', '')}
                    </span>
                  </div>
                  <p className={`text-[14px] truncate leading-snug mt-0.5 ${contact.unread ? 'font-bold text-black dark:text-white' : 'text-zinc-500'}`}>
                    {contact.lastMessage.sender_id === user.id ? 'You: ' : ''}
                    {contact.lastMessage.file_url ? '📎 Attachment' : contact.lastMessage.content}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div 
        className={`
          flex-col bg-zinc-50 dark:bg-[#0a0a0a] min-h-0 w-full h-full
          ${!activeChatUser 
            ? 'hidden md:flex flex-1 relative' 
            : 'flex fixed inset-0 z-[70] md:relative md:flex-1 md:z-auto'
          }
        `}
      >
        {!activeChatUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black w-full h-full">
            <h2 className="text-3xl font-bold text-black dark:text-white mb-2">Select a message</h2>
            <p className="text-zinc-500 text-[15px] max-w-sm">Choose from your existing conversations, or start a new one to begin collaborating.</p>
          </div>
        ) : (
          <>
            {/* Active Chat Header */}
            <div className="w-full h-16 min-h-[64px] px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-black/95 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
              <div className="flex items-center gap-4">
                <button onClick={() => { setActiveChatUser(null); router.replace('/messages'); }} className="md:hidden p-2 -ml-2 text-black dark:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <Link href={`/profile/${activeChatUser.id}`} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 relative">
                    {activeChatUser.avatar_url ? (
                      <img src={activeChatUser.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <User size={16} className="m-auto mt-2 text-zinc-400" />
                    )}
                  </div>
                  <h3 className="font-bold text-[17px] text-black dark:text-white flex items-center gap-1 group-hover:underline">
                    {activeChatUser.full_name}
                    {activeChatUser.is_verified && <BadgeCheck size={16} fill="#9cf822" className="text-white dark:text-black shrink-0" />}
                  </h3>
                </Link>
              </div>
              <button className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors">
                <Info size={20} />
              </button>
            </div>

            {/* Chat Messages Area */}
            <div 
              className="flex-1 overflow-y-auto min-h-0 w-full p-4 md:p-6 space-y-6 relative" 
              ref={scrollRef}
              style={{
                backgroundImage: `url("${CHAT_WALLPAPER_SVG}")`,
                backgroundSize: '300px',
                backgroundRepeat: 'repeat',
              }}
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center relative z-10">
                   <div className="w-16 h-16 rounded-full overflow-hidden mb-4 shadow-lg">
                      {activeChatUser.avatar_url ? <img src={activeChatUser.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-200" />}
                   </div>
                   <p className="text-[15px] text-black dark:text-white bg-white/80 dark:bg-black/80 px-4 py-2 rounded-full backdrop-blur-md border border-zinc-200 dark:border-zinc-800">
                     This is the beginning of your direct message history with <span className="font-bold">{activeChatUser.full_name}</span>.
                   </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user?.id;
                  const showDate = idx === 0 || new Date(msg.created_at).getDate() !== new Date(messages[idx-1].created_at).getDate();

                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-6 relative z-10">
                          <span className="text-[12px] font-bold text-zinc-600 dark:text-zinc-400 bg-white/90 dark:bg-black/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-800">
                            {new Date(msg.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative z-10`}>
                        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'right-full mr-2' : 'left-full ml-2'}`}>
                           <button onClick={() => setReplyingTo(msg)} className="p-1.5 text-zinc-500 hover:text-black dark:hover:text-white bg-white dark:bg-zinc-800 rounded-full transition-colors shadow-sm" title="Reply">
                             <Reply size={14} />
                           </button>
                           {isMe && (
                             <button onClick={() => handleDeleteMessage(msg.id)} className="p-1.5 text-zinc-500 hover:text-red-500 bg-white dark:bg-zinc-800 rounded-full transition-colors shadow-sm" title="Delete">
                               <Trash2 size={14} />
                             </button>
                           )}
                        </div>

                        <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {msg.reply_to && (
                            <div className="mb-1 flex items-center gap-1.5 opacity-90 cursor-pointer">
                              <Reply size={12} className="text-zinc-500" />
                              <div className="text-[12px] text-zinc-600 dark:text-zinc-300 line-clamp-1 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 max-w-[250px] shadow-sm">
                                <span className="font-bold mr-1 text-black dark:text-white">{msg.reply_to.sender_id === user?.id ? 'You' : activeChatUser.full_name}:</span>
                                {msg.reply_to.file_name ? '📎 Attachment' : msg.reply_to.content}
                              </div>
                            </div>
                          )}

                          <div className={`shadow-sm overflow-hidden ${
                            isMe 
                              ? 'bg-[#9cf822] text-black rounded-2xl rounded-br-sm' 
                              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white rounded-2xl rounded-bl-sm'
                          }`}>
                            {msg.file_url && (
                              <div className="p-1">
                                {msg.file_type?.startsWith('image/') ? (
                                  <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                                    <img src={msg.file_url} alt="attachment" className="w-full max-w-sm rounded-xl object-cover" />
                                  </a>
                                ) : (
                                  <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 rounded-xl m-1 ${isMe ? 'bg-black/10 hover:bg-black/20' : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'} transition-colors`}>
                                    <div className={`p-2 rounded-lg ${isMe ? 'bg-black text-[#9cf822]' : 'bg-zinc-200 dark:bg-zinc-950 text-zinc-500'}`}>
                                      <FileText size={20} />
                                    </div>
                                    <span className="text-sm font-bold underline truncate max-w-[150px]">{msg.file_name}</span>
                                  </a>
                                )}
                              </div>
                            )}
                            {msg.content && (
                              <div className="px-4 py-2.5 text-[15px] leading-relaxed">
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-zinc-500 mt-1.5 px-1 uppercase tracking-wider bg-white/50 dark:bg-black/50 rounded-full backdrop-blur-sm">
                            {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Optimized Chat Input Container */}
            <div className="w-full bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 shrink-0 z-20 px-3 pt-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
              
              {replyingTo && (
                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-t-2xl border-x border-t border-zinc-200 dark:border-zinc-800 -mb-4 pb-6">
                  <div className="flex items-center gap-2 overflow-hidden text-sm">
                    <Reply size={14} className="text-[#9cf822] shrink-0" />
                    <span className="font-bold text-black dark:text-white shrink-0">Replying to {replyingTo.sender_id === user?.id ? 'yourself' : activeChatUser.full_name}:</span>
                    <span className="text-zinc-500 truncate">{replyingTo.file_name ? '📎 Attachment' : replyingTo.content}</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className={`relative z-10 flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-[24px] px-2 py-1.5 shadow-sm border border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-colors ${replyingTo ? 'rounded-t-none border-x border-b border-zinc-200 dark:border-zinc-800' : ''}`}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*,.pdf,.doc,.docx,.zip"
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50 ml-1"
                >
                  <Paperclip size={20} className="-rotate-45" />
                </button>

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Start a new message"
                  className="flex-1 bg-transparent text-[15px] text-black dark:text-white px-2 py-2 focus:outline-none placeholder:text-zinc-500 min-w-0"
                />
                
                <button 
                  type="submit"
                  disabled={isSending || isUploading || (!newMessage.trim() && !isUploading)}
                  className="w-10 h-10 rounded-full bg-zinc-500 hover:bg-zinc-600 dark:bg-zinc-600 flex items-center justify-center text-[#9cf822] transition-colors shrink-0 disabled:opacity-50 ml-1"
                >
                  {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* PAYWALL MODAL */}
      {showProModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-md rounded-[2rem] border border-zinc-200 dark:border-zinc-800 p-8 relative shadow-2xl overflow-hidden">
              <button onClick={() => setShowProModal(false)} className="absolute top-6 right-6 p-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors z-10">
                <X size={16} />
              </button>
              <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg relative">
                <Sparkles className="text-[#9cf822] absolute -top-2 -right-2 animate-pulse" size={24} />
                <Lock className="text-white dark:text-black" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Unlock Unlimited Networking</h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-8 leading-relaxed">
                You've reached your free limit of 3 new conversations. Upgrade to CoLab Pro to send unlimited messages, close more deals, and scale your income.
              </p>
              <button onClick={handleUpgradeToPro} className="w-full py-4 bg-[#9cf822] text-black rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-xl shadow-[#9cf822]/20">
                Upgrade Now - ₦5,000/mo
              </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#9cf822]" /></div>}>
      <InboxContent />
    </Suspense>
  );
}