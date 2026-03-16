'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Loader2, ArrowLeft, Send, Search, User, 
  MessageSquare, BadgeCheck, Lock, Sparkles, X, Crown,
  Trash2, Reply, Info, Paperclip, FileText, Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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

  useEffect(() => {
    fetchInboxData(true);
  }, [urlUserId]);

  const fetchInboxData = async (isInitialLoad = false) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return router.push('/login');

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
    const currentUser = { ...authUser, ...profile };
    setUser(currentUser);

    const { data: dms } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender:sender_id(id, full_name, avatar_url, is_verified),
        receiver:receiver_id(id, full_name, avatar_url, is_verified)
      `)
      .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`)
      .order('created_at', { ascending: false });

    const contactMap = new Map();
    const uniqueSentReceivers = new Set();

    (dms || []).forEach(dm => {
      const isMeSender = dm.sender_id === authUser.id;
      const otherUser = isMeSender ? dm.receiver : dm.sender;
      
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

    if (isInitialLoad) {
      if (urlUserId) {
        const existingContact = sortedContacts.find(c => c.user.id === urlUserId);
        if (existingContact) {
          handleSelectContact(existingContact.user, false, currentUser); 
        } else {
          const { data: targetProfile } = await supabase.from('profiles').select('id, full_name, avatar_url, is_verified').eq('id', urlUserId).single();
          if (targetProfile) {
            setActiveChatUser(targetProfile);
            setMessages([]);
          }
          setLoading(false); 
        }
      } else if (sortedContacts.length > 0 && window.innerWidth > 768) {
        handleSelectContact(sortedContacts[0].user, true, currentUser);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`dms_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, (payload) => {
        fetchInboxData(false); 
        
        if (payload.eventType === 'INSERT') {
          if (activeChatUserRef.current && (activeChatUserRef.current.id === payload.new.sender_id || user.id === payload.new.sender_id)) {
             fetchMessagesForActiveChat(activeChatUserRef.current.id, user); 
          }
        }

        if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchMessagesForActiveChat = async (targetUserId: string, activeAuthUser?: any) => {
    const validUser = activeAuthUser || user;
    if (!validUser) return;
    
    const { data } = await supabase
      .from('direct_messages')
      .select(`
        *,
        reply_to:reply_to_id(id, content, sender_id, file_name)
      `)
      .or(`and(sender_id.eq.${validUser.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${validUser.id})`)
      .order('created_at', { ascending: true });
    
    setMessages(data || []);
    scrollToBottom();
    setLoading(false);
  };

  const handleSelectContact = (contactUser: any, updateUrl = true, activeAuthUser?: any) => {
    setActiveChatUser(contactUser);
    setReplyingTo(null);
    fetchMessagesForActiveChat(contactUser.id, activeAuthUser);
    
    if (updateUrl) {
      router.replace(`?u=${contactUser.id}`, { scroll: false });
    }
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
      console.error("Supabase Insert Error:", error);
      alert("Failed to send message. Make sure you ran the Supabase SQL script!");
      setMessages(prev => prev.filter(m => m.id !== tempId)); 
    } else {
      triggerHaptic(10);
      fetchInboxData(false); 
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
      alert("Error uploading file. Make sure the storage bucket exists.");
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('chat_attachments').getPublicUrl(filePath);

    // Auto-send the message with the file attached
    await handleSendMessage(undefined, publicUrl, file.name, file.type);
    
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("Delete this message?")) return;
    
    triggerHaptic(10);
    setMessages(prev => prev.filter(m => m.id !== msgId)); // Optimistic UI
    
    await supabase.from('direct_messages').delete().eq('id', msgId).eq('sender_id', user?.id);
    fetchInboxData(false);
  };

  const handleUpgradeToPro = async () => {
    await supabase.from('profiles').update({ is_pro: true }).eq('id', user.id);
    setUser({ ...user, is_pro: true });
    setShowProModal(false);
    alert("🎉 You are now a Pro Member! Unlimited messaging unlocked.");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><Loader2 className="animate-spin text-[#9cf822]" /></div>;

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-black flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* ------------------------------------------------------------------ */}
      {/* LEFT SIDEBAR: Contacts List */}
      {/* ------------------------------------------------------------------ */}
      <div className={`w-full md:w-80 lg:w-[400px] flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black flex flex-col h-[100dvh] ${activeChatUser ? 'hidden md:flex' : 'flex'}`}>
        
        <div className="px-4 py-3 sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-md z-10">
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

        <div className="flex-1 overflow-y-auto">
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

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT PANEL: Active Chat with Collaboration Wallpaper */}
      {/* ------------------------------------------------------------------ */}
      <div 
        className={`flex-1 flex flex-col bg-white dark:bg-black h-[100dvh] relative ${!activeChatUser ? 'hidden md:flex' : 'flex'}`}
      >
        {!activeChatUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-l border-zinc-200 dark:border-zinc-800 relative z-10">
            <h2 className="text-3xl font-bold text-black dark:text-white mb-2">Select a message</h2>
            <p className="text-zinc-500 text-[15px] max-w-sm">Choose from your existing conversations, or start a new one to begin collaborating.</p>
          </div>
        ) : (
          <>
            {/* Active Chat Header */}
            <div className="h-16 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-black/95 backdrop-blur-md flex items-center justify-between shrink-0 z-20 sticky top-0">
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

            {/* Chat Messages Area + Wallpaper Matrix */}
            <div 
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative" 
              ref={scrollRef}
              style={{
                // Subtle WhatsApp-style tech blueprint grid wallpaper
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(156, 248, 34, 0.15) 1px, transparent 0)`,
                backgroundSize: `24px 24px`
              }}
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center relative z-10">
                   <div className="w-16 h-16 rounded-full overflow-hidden mb-4 shadow-lg">
                      {activeChatUser.avatar_url ? <img src={activeChatUser.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-200" />}
                   </div>
                   <p className="text-[15px] text-black dark:text-white bg-white/50 dark:bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
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
                          <span className="text-[12px] font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-800">
                            {new Date(msg.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative z-10`}>
                        {/* Hover Actions */}
                        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'right-full mr-2' : 'left-full ml-2'}`}>
                           <button onClick={() => setReplyingTo(msg)} className="p-1.5 text-zinc-500 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-full transition-colors shadow-sm" title="Reply">
                             <Reply size={14} />
                           </button>
                           {isMe && (
                             <button onClick={() => handleDeleteMessage(msg.id)} className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-800 rounded-full transition-colors shadow-sm" title="Delete">
                               <Trash2 size={14} />
                             </button>
                           )}
                        </div>

                        <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          
                          {/* Replied Message Context */}
                          {msg.reply_to && (
                            <div className="mb-1 flex items-center gap-1.5 opacity-80 cursor-pointer">
                              <Reply size={12} className="text-zinc-500" />
                              <div className="text-[12px] text-zinc-600 dark:text-zinc-300 line-clamp-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-[250px]">
                                <span className="font-bold mr-1">{msg.reply_to.sender_id === user?.id ? 'You' : activeChatUser.full_name}:</span>
                                {msg.reply_to.file_name ? '📎 Attachment' : msg.reply_to.content}
                              </div>
                            </div>
                          )}

                          {/* Chat Bubble & File Attachment */}
                          <div className={`shadow-sm overflow-hidden ${
                            isMe 
                              ? 'bg-[#9cf822] text-black rounded-2xl rounded-br-sm' 
                              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white rounded-2xl rounded-bl-sm'
                          }`}>
                            
                            {/* Render Image or File */}
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

                            {/* Text Content */}
                            {msg.content && (
                              <div className="px-4 py-2.5 text-[15px] leading-relaxed">
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Timestamp */}
                          <span className="text-[10px] font-bold text-zinc-400 mt-1.5 px-1 uppercase tracking-wider">
                            {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 shrink-0 z-20">
              
              {/* Replying Indicator */}
              {replyingTo && (
                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-t-2xl border-x border-t border-zinc-200 dark:border-zinc-800 -mb-2 pb-4">
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

              <form onSubmit={handleSendMessage} className={`flex items-end gap-2 bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-2 ${replyingTo ? 'rounded-t-none border border-zinc-200 dark:border-zinc-800' : ''}`}>
                
                {/* File Upload Button */}
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
                  className="p-3 text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-50"
                  title="Attach File"
                >
                  {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                </button>

                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Start a new message"
                  className="flex-1 bg-transparent text-[15px] text-black dark:text-white px-2 py-2.5 max-h-32 min-h-[40px] resize-none focus:outline-none placeholder:text-zinc-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                
                <button 
                  type="submit"
                  disabled={isSending || isUploading || (!newMessage.trim())}
                  className="p-3 bg-black text-[#9cf822] dark:bg-white dark:text-black rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shrink-0 flex items-center justify-center shadow-md"
                >
                  <Send size={18} className="-ml-0.5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* PAYWALL MODAL */}
      {/* ------------------------------------------------------------------ */}
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