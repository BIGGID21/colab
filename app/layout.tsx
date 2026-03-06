'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ThemeProvider, useTheme } from 'next-themes';
import { 
  Home, Compass, PlusCircle, FolderClosed, Settings, User, 
  LogOut, TrendingUp, ChevronUp, Menu, X, ChevronLeft, ChevronRight,
  HelpCircle, FileText, Shield, Bell, Search, Palette, Sun, Moon, CreditCard,
  Globe 
} from 'lucide-react';
import Modal from '@/components/Modal'; 
import SearchModal from '@/components/SearchModal'; 
import './globals.css';

// --- BrandLogo: Grid-Aligned with Fail-Safe Loading ---
const BrandLogo = ({ collapsed, isMobile = false }: { collapsed?: boolean, isMobile?: boolean }) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = (mounted && resolvedTheme === 'dark' && !imgError) ? '/white.png' : '/logo.png';
  
  const containerSize = isMobile ? "w-8" : "w-9"; 
  const iconSize = isMobile ? "h-6 w-6" : "h-6 w-6"; 

  return (
    <div className={`flex items-center gap-3 ${collapsed ? 'w-full justify-center' : ''}`}>
      <div className={`${containerSize} flex items-center justify-center shrink-0`}>
        <img 
          src={logoSrc} 
          alt="CoLab Logo" 
          onError={() => {
            console.error("Logo failed to load:", logoSrc);
            setImgError(true);
          }}
          className={`${iconSize} object-contain transition-opacity duration-300`} 
        />
      </div>
      {(!collapsed) && (
        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white leading-none mb-0.5">
          CoLab
        </span>
      )}
    </div>
  );
};

// --- LinkedIn Style SplashScreen ---
const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white dark:bg-black animate-out fade-out duration-1000 fill-mode-forwards">
      <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <BrandLogo />
        <div className="w-32 h-0.5 bg-zinc-100 dark:bg-zinc-900 mt-8 overflow-hidden rounded-full">
          <div className="h-full bg-[#9cf822] w-full origin-left animate-splash-progress" />
        </div>
      </div>
      <style jsx>{`
        @keyframes splash-progress {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); }
        }
        .animate-splash-progress {
          animation: splash-progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-9 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />;

  const isDark = theme === 'dark';

  return (
    <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-all group">
      <div className="flex items-center gap-3">
        <Palette size={16} className="text-zinc-500 group-hover:text-[#9cf822]" />
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Theme</span>
      </div>
      <div className={`border px-2 py-1 rounded-md flex items-center gap-2 ${isDark ? 'bg-black border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
        {isDark ? (
          <><Moon size={12} className="text-[#9cf822]" /><span className="text-xs font-medium text-white">Dark</span></>
        ) : (
          <><Sun size={12} className="text-orange-500" /><span className="text-xs font-medium text-zinc-900">Light</span></>
        )}
      </div>
    </button>
  );
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); 
  const [unreadCount, setUnreadCount] = useState(0); 
  const [showMenu, setShowMenu] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const initApp = async () => {
      try {
        const { data: { user: activeUser } } = await supabase.auth.getUser();
        setUser(activeUser);
        if (activeUser) {
          await Promise.all([
            fetchInitialUnread(activeUser.id),
            fetchProfileData(activeUser.id)
          ]);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setTimeout(() => setIsAppLoading(false), 800);
      }
    };

    const fetchProfileData = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('avatar_url').eq('id', userId).single();
      if (data) setAvatarUrl(data.avatar_url);
    };

    const fetchInitialUnread = async (userId: string) => {
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      setUnreadCount(notifCount || 0);
    };

    initApp();
    
    const channel = supabase
      .channel('global_system_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload.eventType === 'INSERT') setUnreadCount(prev => prev + 1);
        else if (user?.id) fetchInitialUnread(user.id);
      })
      .subscribe();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      supabase.removeChannel(channel);
    };
  }, [supabase, user?.id]);

  const modalContent: Record<string, { title: string, content: React.ReactNode }> = {
    faq: { title: "FAQ", content: <p>Find answers to common questions about project creation.</p> },
    help: { title: "Help center", content: <p>Contact support for technical issues or account recovery.</p> },
    terms: { title: "Terms of use", content: <p>Read our guidelines for project management and platform use.</p> },
    privacy: { title: "Privacy policy", content: <p>Learn how we handle your metadata and security.</p> }
  };

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const showSidebar = !isAuthPage && pathname !== '/';

  const navItems = [
    { name: 'Search', icon: Search, onClick: () => setActiveModal('search'), showOnMobileBar: false },
    { name: 'Home', icon: Home, href: '/discover', showOnMobileBar: true }, 
    { name: 'Dashboard', icon: FolderClosed, href: '/my-projects', showOnMobileBar: true },
    { name: 'Create', icon: PlusCircle, href: '/create', showOnMobileBar: true, highlight: true },
    { name: 'Community', icon: Globe, href: '/community', showOnMobileBar: true },
    { name: 'Notifications', icon: Bell, href: '/notifications', count: unreadCount, showOnMobileBar: true },
    { name: 'Manage', icon: Settings, href: '/manage', showOnMobileBar: false },
  ];

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Adds support for Safe Areas and prevents auto-zoom on input focus for mobile devices */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`min-h-screen antialiased flex flex-col md:flex-row overflow-x-hidden transition-colors duration-500 bg-white dark:bg-black text-zinc-900 dark:text-white`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          
          {isAppLoading && <SplashScreen />}

          {showSidebar && !isAppLoading && (
            <>
              {/* MOBILE TOP BAR */}
              <div className="md:hidden flex items-center justify-between p-4 h-16 backdrop-blur-md border-b sticky top-0 z-[100] w-full transition-colors bg-white/90 dark:bg-black/90 border-zinc-200 dark:border-zinc-900">
                <BrandLogo isMobile />
                <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
                    <button onClick={() => setActiveModal('search')}><Search size={20} /></button>
                    <button onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} /></button>
                </div>
              </div>

              {/* DESKTOP SIDEBAR */}
              <aside className={`fixed md:sticky left-0 top-0 h-screen border-r flex flex-col z-[110] transition-all duration-300 bg-[#F3F2F1] dark:bg-[#0a0a0a] border-zinc-200 dark:border-zinc-900
                ${isMobileMenuOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full w-64'} 
                ${isCollapsed ? 'md:w-20' : 'md:w-64'} md:translate-x-0`}>
                
                <div className="px-4 py-8 flex items-center justify-between min-h-[80px]">
                  <div className="px-4 w-full flex items-center justify-between">
                    <BrandLogo collapsed={isCollapsed && !isMobileMenuOpen} />
                    {!isCollapsed && (
                      <button onClick={() => isMobileMenuOpen ? setIsMobileMenuOpen(false) : setIsCollapsed(!isCollapsed)} className="text-zinc-400 hover:text-[#9cf822] transition-colors p-1">
                        {isMobileMenuOpen ? <X size={20} /> : <ChevronLeft size={18} />}
                      </button>
                    )}
                  </div>
                  {isCollapsed && !isMobileMenuOpen && (
                    <button onClick={() => setIsCollapsed(false)} className="absolute -right-3 top-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full p-1 text-zinc-400 hover:text-[#9cf822] shadow-sm">
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                <nav className="px-4 space-y-1 flex-grow">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const handleNavClick = (e: React.MouseEvent) => {
                      if (item.name === 'Home' && isActive) {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                      setIsMobileMenuOpen(false);
                    };

                    return item.href ? (
                      <Link key={item.name} href={item.href} onClick={handleNavClick}
                        className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'text-black dark:text-white bg-black/5 dark:bg-[#9cf822]/10 font-bold' : 'text-zinc-600 dark:text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-white'} ${isCollapsed && !isMobileMenuOpen ? 'justify-center px-0' : ''}`}>
                        <div className="relative w-9 flex items-center justify-center shrink-0">
                          <item.icon size={18} />
                          {(item.count !== undefined && item.count > 0) ? (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-red-500 text-[9px] font-black text-white rounded-full border-2 border-[#F3F2F1] dark:border-[#0a0a0a] animate-in zoom-in">
                              {item.count > 9 ? '9+' : item.count}
                            </span>
                          ) : null}
                        </div>
                        {(!isCollapsed || isMobileMenuOpen) && <span className="text-sm font-medium">{item.name}</span>}
                      </Link>
                    ) : (
                      <button key={item.name} onClick={item.onClick}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-zinc-600 dark:text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-white ${isCollapsed && !isMobileMenuOpen ? 'justify-center px-0' : ''}`}>
                        <div className="w-9 flex items-center justify-center shrink-0">
                          <item.icon size={18} />
                        </div>
                        {(!isCollapsed || isMobileMenuOpen) && <span className="text-sm font-medium">{item.name}</span>}
                      </button>
                    )
                  })}
                </nav>

                <div className="p-4 mt-auto relative" ref={menuRef}>
                  {showMenu && (
                    <div className={`absolute bottom-20 border rounded-2xl py-2 z-[120] shadow-xl bg-white dark:bg-[#121212] border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-2 duration-200 ${isCollapsed && !isMobileMenuOpen ? 'left-4 w-64' : 'left-4 right-4'}`}>
                      <div className="px-2 pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-900">
                        <button onClick={() => { setShowMenu(false); router.push(`/profile/${user?.id}`); }} className="w-full flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors text-sm font-medium">
                          <User size={16} /> Profile
                        </button>
                        <button onClick={() => { setShowMenu(false); router.push('/settings'); }} className="w-full flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors text-sm font-medium">
                          <Settings size={16} /> Settings
                        </button>
                        <button onClick={() => { setShowMenu(false); router.push('/billing'); }} className="w-full flex items-center gap-3 px-3 py-2 text-[#9cf822] hover:bg-[#9cf822]/10 rounded-lg transition-colors text-sm font-medium">
                          <CreditCard size={16} /> Billing
                        </button>
                      </div>
                      <div className="px-2 pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-900">
                        <ThemeToggle />
                      </div>
                      <div className="px-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
                        <button onClick={() => { setShowMenu(false); setActiveModal('faq'); }} className="w-full flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors text-sm font-medium">
                          <HelpCircle size={16} /> FAQ
                        </button>
                        <button onClick={() => { setShowMenu(false); setActiveModal('terms'); }} className="w-full flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors text-sm font-medium">
                          <FileText size={16} /> Terms
                        </button>
                        <button onClick={() => { setShowMenu(false); setActiveModal('privacy'); }} className="w-full flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors text-sm font-medium">
                          <Shield size={16} /> Privacy
                        </button>
                      </div>
                      <div className="px-2 pt-1">
                        <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 text-red-600 text-sm font-medium rounded-lg hover:bg-red-500/20 transition-all">
                          <LogOut size={16} /> Sign out
                        </button>
                      </div>
                    </div>
                  )}

                  <button onClick={() => setShowMenu(!showMenu)} className={`w-full flex items-center gap-3 p-2 px-4 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 transition-all ${isCollapsed && !isMobileMenuOpen ? 'justify-center' : ''}`}>
                    <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" /> : <User size={18} className="text-zinc-400" />}
                    </div>
                    {(!isCollapsed || isMobileMenuOpen) && (
                      <div className="text-left flex-grow">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                          {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}
                        </p>
                      </div>
                    )}
                    {(!isCollapsed || isMobileMenuOpen) && <ChevronUp size={16} className={`text-zinc-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />}
                  </button>
                </div>
              </aside>

              {/* MOBILE BOTTOM NAV - Updated with Safe Area Padding */}
              <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-900 z-[100] flex items-center justify-between px-2 pt-2 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
                {navItems.filter(item => item.showOnMobileBar).map((item) => (
                  <Link key={item.name} href={item.href!} className="flex flex-col items-center justify-center w-full py-1">
                    <div className={`relative flex items-center justify-center ${item.highlight ? '-mt-6' : ''}`}>
                      <div className={`${item.highlight ? 'bg-[#ffffff] text-black rounded-full p-3 shadow-lg' : pathname === item.href ? 'text-black dark:text-white' : 'text-zinc-500'}`}>
                        <item.icon size={item.highlight ? 24 : 22} strokeWidth={pathname === item.href || item.highlight ? 2.5 : 2} />
                      </div>
                      {(item.count !== undefined && item.count > 0) && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-red-500 text-[9px] font-black text-white rounded-full border-2 border-white dark:border-[#0a0a0a]">
                          {item.count > 9 ? '9+' : item.count}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </nav>

              {isMobileMenuOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}
            </>
          )}

          <main className={`flex-grow w-full transition-all duration-500 bg-white dark:bg-black ${showSidebar && !isAppLoading ? 'px-4 md:px-10 pb-24 md:pb-10 pt-4 md:pt-10' : ''}`}>
            {!isAppLoading && children}
          </main>

          <SearchModal isOpen={activeModal === 'search'} onClose={() => setActiveModal(null)} />
          <Modal isOpen={!!activeModal && activeModal !== 'search'} onClose={() => setActiveModal(null)} title={activeModal && modalContent[activeModal] ? modalContent[activeModal].title : ""}>
            {activeModal && activeModal !== 'search' && modalContent[activeModal] && modalContent[activeModal].content}
          </Modal>
        </ThemeProvider>
      </body>
    </html>
  );
}
