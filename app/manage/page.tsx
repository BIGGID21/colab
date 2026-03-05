'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Loader2, CheckCircle2, XCircle, 
  Clock, MailOpen, RefreshCcw, ExternalLink, User,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export default function ManageCollaborationsPage() {
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchCollaborations = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetching collaborations with profile and project info
    // We remove the !inner join to prevent the "Join Error" crash
    const { data, error } = await supabase
      .from('collaborations')
      .select(`
        *,
        profiles:user_id(full_name, avatar_url),
        projects:project_id(title, user_id)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fetch error:", error.message);
    } else {
      // Filter locally: Only show requests for projects OWNED by the current user
      const myOwnedRequests = data?.filter(collab => collab.projects?.user_id === user.id);
      setCollaborations(myOwnedRequests || []);
    }
    
    setLoading(false);
    setRefreshing(false);
  }, [supabase]);

  useEffect(() => {
    fetchCollaborations();
  }, [fetchCollaborations]);

  const updateStatus = async (id: string, status: 'accepted' | 'declined') => {
    const { error } = await supabase
      .from('collaborations')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setCollaborations(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      
      // Notify the applicant
      const colab = collaborations.find(c => c.id === id);
      await supabase.from('notifications').insert({
        user_id: colab.user_id, 
        sender_id: (await supabase.auth.getUser()).data.user?.id,
        project_id: colab.project_id,
        type: status,
        message: `has ${status} your request for`
      });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <Loader2 className="animate-spin text-[#9cf822]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 pb-20">
      <div className="max-w-5xl mx-auto px-6 pt-12">
        
        <header className="mb-12 flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-black dark:text-white tracking-tight">Manage Requests</h1>
            <p className="text-zinc-500 text-sm">Review applications for your active ventures.</p>
          </div>
          <button 
            onClick={() => fetchCollaborations(true)}
            className={`p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-full text-zinc-400 hover:text-black dark:hover:text-white transition-all ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCcw size={16} />
          </button>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {collaborations.length > 0 ? (
            collaborations.map((c) => (
              <div 
                key={c.id} 
                className="group p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-[#0a0a0a] transition-all hover:border-zinc-200 dark:hover:border-zinc-700"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {c.profiles?.avatar_url ? (
                        <img src={c.profiles.avatar_url} className="w-full h-full object-cover" alt="Applicant" />
                      ) : (
                        <User className="text-zinc-300" size={24} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-black dark:text-white">
                        {c.profiles?.full_name || 'Anonymous Maker'}
                      </h3>
                      <p className="text-sm text-zinc-500 mb-2">
                        Applied for <span className="font-bold text-[#5a9a00] dark:text-[#ffffff]">"{c.projects?.title || 'Unknown Venture'}"</span>
                      </p>
                      <div className="flex items-center gap-3">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                           c.status === 'accepted' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                           c.status === 'declined' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                           'bg-orange-500/10 text-orange-500 border-orange-500/20'
                         }`}>
                           {c.status}
                         </span>
                         <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                           <Clock size={12} /> {new Date(c.created_at).toLocaleDateString()}
                         </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {c.status === 'pending' ? (
                      <>
                        <button 
                          onClick={() => updateStatus(c.id, 'accepted')}
                          className="flex-1 md:flex-none px-6 py-3 bg-[#9cf822] text-black rounded-2xl text-xs font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={16} /> Accept
                        </button>
                        <button 
                          onClick={() => updateStatus(c.id, 'declined')}
                          className="flex-1 md:flex-none px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white rounded-2xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle size={16} /> Decline
                        </button>
                      </>
                    ) : (
                      <Link 
                        href={`/profile/${c.user_id}`}
                        className="px-6 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-black dark:text-white rounded-2xl text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-2"
                      >
                        View Profile <ExternalLink size={14} />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Pitch Message Box */}
                <div className="mt-8 p-6 bg-white dark:bg-black rounded-3xl border border-zinc-100 dark:border-zinc-900 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={14} className="text-zinc-400" />
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">Applicant Pitch</p>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                    "{c.message || "No pitch provided with this application."}"
                  </p>
                </div>
              </div>
            )
          )) : (
            <div className="py-32 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-900 rounded-[3rem] flex flex-col items-center justify-center">
              <MailOpen size={40} className="text-zinc-200 dark:text-zinc-800 mb-4" />
              <p className="text-zinc-400 text-sm font-semibold tracking-tight">Your collaboration queue is empty</p>
              <p className="text-[10px] text-zinc-500 mt-2">New join requests for your ventures will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}