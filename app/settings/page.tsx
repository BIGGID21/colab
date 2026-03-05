'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  User, Shield, Bell, Moon, Sun, 
  Trash2, LogOut, ChevronRight, Loader2, Check 
} from 'lucide-react';

type SettingsTab = 'account' | 'security' | 'preferences';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const notifySaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-4 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <header className="mb-10">
          <h1 className="text-3xl font-semibold text-black dark:text-white tracking-tight">Settings</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage your account settings and set e-mail preferences.</p>
        </header>

        <div className="flex flex-col md:flex-row gap-12">
          
          {/* SIDEBAR NAVIGATION */}
          <aside className="w-full md:w-56 shrink-0">
            <nav className="flex flex-col gap-1">
              <button 
                onClick={() => setActiveTab('account')}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'account' ? 'bg-[#9cf822]/10 text-black dark:text-[#9cf822]' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
              >
                <User size={18} /> Account
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'security' ? 'bg-[#9cf822]/10 text-black dark:text-[#9cf822]' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
              >
                <Shield size={18} /> Security
              </button>
              <button 
                onClick={() => setActiveTab('preferences')}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'preferences' ? 'bg-[#9cf822]/10 text-black dark:text-[#9cf822]' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
              >
                <Bell size={18} /> Preferences
              </button>
              
              <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-4" />
              
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              >
                <LogOut size={18} /> Sign out
              </button>
            </nav>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 max-w-xl">
            
            {activeTab === 'account' && (
              <section className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">Public Profile</h3>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-zinc-500 ml-1">Email address</label>
                      <input 
                        disabled 
                        value={user?.email || ''} 
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-400 dark:bg-zinc-900/50 dark:border-zinc-800"
                      />
                      <p className="text-[11px] text-zinc-400 ml-1">Email cannot be changed at this time.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-medium text-red-500 border-b border-zinc-100 dark:border-zinc-800 pb-2">Danger Zone</h3>
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100 dark:bg-red-500/5 dark:border-red-500/10">
                    <h4 className="text-sm font-semibold text-red-600 dark:text-red-500">Delete Account</h4>
                    <p className="text-xs text-red-500/80 mt-1">Once you delete your account, there is no going back. Please be certain.</p>
                    <button className="mt-4 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-all">
                      Delete account
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'security' && (
              <section className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">Password</h3>
                  <p className="text-sm text-zinc-500">Update your password to keep your account secure.</p>
                  <button className="w-full py-3 bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all">
                    Reset password via email
                  </button>
                </div>
              </section>
            )}

            {activeTab === 'preferences' && (
              <section className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">Appearance</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-black rounded-lg shadow-sm">
                        <Moon size={18} className="text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black dark:text-white">Dark mode</p>
                        <p className="text-xs text-zinc-500">Adjust the app's visual appearance</p>
                      </div>
                    </div>
                    {/* Toggle button placeholder */}
                    <div className="w-10 h-6 bg-[#9cf822] rounded-full relative">
                       <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              </section>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}