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
  Globe, BadgeCheck, Wallet, ArrowUpRight 
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
  const [fullName, setFullName] = useState<string | null>(null); 
  const [isVerified, setIsVerified] = useState(false); 
  const [unreadCount, setUnreadCount] = useState(0); 
  const [showMenu, setShowMenu] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Mobile Top & Bottom Bar Scroll State
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  
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
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name, is_verified') 
        .eq('id', userId)
        .single();
        
      if (data) {
        setAvatarUrl(data.avatar_url);
        setFullName(data.full_name);
        setIsVerified(data.is_verified);
      }
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

  // Combined Scroll Listener for Mobile UI
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === 'undefined') return;
      
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 60) {
        setIsMobileNavVisible(true);
      } else if (currentScrollY > lastScrollY.current + 5) {
        // Scrolling down -> Hide
        setIsMobileNavVisible(false);
      } else if (currentScrollY < lastScrollY.current - 5) {
        // Scrolling up -> Show
        setIsMobileNavVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const modalContent: Record<string, { title: string, content: React.ReactNode }> = {};

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  
  // LOGIC UPDATE: Hide sidebar on the landing page AND the new marketing/legal pages
  const isMarketingPage = pathname === '/' || pathname === '/about' || pathname === '/terms' || pathname === '/privacy' || pathname === '/blog';
  const showSidebar = !isAuthPage && !isMarketingPage;

  // LOGIC: Only trigger scroll-hide effect on the Community Feed
  const isCommunityFeed = pathname === '/community';

  const navItems = [
    { name: 'Search', icon: Search, onClick: () => setActiveModal('search'), showOnMobileBar: false },
    { name: 'Home', icon: Home, href: '/discover', showOnMobileBar: true }, 
    { name: 'Dashboard', icon: FolderClosed, href: '/my-projects', showOnMobileBar: true },
    { name: 'Create', icon: PlusCircle, href: '/create', showOnMobileBar: true },
    { name: 'Community', icon: Globe, href: '/community', showOnMobileBar: true },
    { name: 'Wallet', icon: Wallet, href: '/wallet', showOnMobileBar: false }, // Added Wallet to Navigation
    { name: 'Notifications', icon: Bell, href: '/notifications', count: unreadCount, showOnMobileBar: true },
    { name: 'Manage', icon: Settings, href: '/manage', showOnMobileBar: false },
  ];

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`min-h-screen antialiased flex flex-col md:flex-row overflow-x-hidden transition-colors duration-500 bg-white dark:bg-black text-zinc-900 dark:text-white`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          
          {isAppLoading && <SplashScreen />}

          {showSidebar && !isAppLoading && (
            <>
              {/* MOBILE TOP BAR (Slides UP on scroll down ONLY on community) */}
              <div 
                className={`md:hidden flex items-center justify-between p-4 h-16 backdrop-blur-md border-b fixed top-0 w-full z-[100] bg-white/90 dark:bg-black/90 border-zinc-200 dark:border-zinc-900 transition-transform duration-300 ease-in-out ${
                  (isCommunityFeed && !isMobileNavVisible) ? '-translate-y-full' : 'translate-y-0'
                }`}
              >
                <BrandLogo isMobile />
                <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
                  <button onClick={() => setActiveModal('search')} aria-label="Search"><Search size={20} /></button>
                  <button onClick={() => setIsMobileMenuOpen(true)} aria-label="Menu"><Menu size={24} /></button>
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
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-white ${isCollapsed && !isMobileMenuOpen ? 'justify-center px-0' : ''}`}>
                        <div className="w-9 flex items-center justify-center shrink-0">
                          <item.icon size={18} />
                        </div>
                        {(!isCollapsed || isMobileMenuOpen) && <span className="text-sm font-medium">{item.name}</span>}
                      </button>
                    );
                  })}
                </nav>

                {/* QUICK-VIEW WALLET WIDGET */}
                {(!isCollapsed || isMobileMenuOpen) && (
                  <div className="px-4 mt-auto mb-2 relative z-10">
                    <Link href="/wallet" className="block bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors group shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                          <Wallet size={12} /> Available Balance
                        </span>
                        <ArrowUpRight size={14} className="text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-[#9cf822] transition-colors" />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-medium text-zinc-900 dark:text-white">$4,250</span>
                        <span className="text-xs text-zinc-500 font-medium">.00</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">In Escrow</span>
                        <span className="text-xs font-medium text-green-600 dark:text-[#9cf822]">$1,200</span>
                      </div>
                    </Link>
                  </div>
                )}

                <div className={`p-4 pb-10 mb-6 relative ${isCollapsed && !isMobileMenuOpen ? 'mt-auto' : ''}`} ref={menuRef}>
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
                        <button onClick={() => { setShowMenu(false); router.push('/faq'); }} className="w-full flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors text-sm font-medium">
                          <HelpCircle size={16} /> FAQ
                        </button>
                        <button onClick={() => { setShowMenu(false); router.push('/terms'); }} className="w-full flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors text-sm font-medium">
                          <FileText size={16} /> Terms
                        </button>
                        <button onClick={() => { setShowMenu(false); router.push('/privacy'); }} className="w-full flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors text-sm font-medium">
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
                      <div className="text-left flex-grow flex items-center gap-1.5 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                          {fullName?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'User'}
                        </p>
                        {isVerified && <BadgeCheck size={14} fill="#9cf822" className="text-white dark:text-black shrink-0" />}
                      </div>
                    )}
                    {(!isCollapsed || isMobileMenuOpen) && <ChevronUp size={16} className={`text-zinc-400 shrink-0 transition-transform ${showMenu ? 'rotate-180' : ''}`} />}
                  </button>
                </div>
              </aside>

              {/* MOBILE BOTTOM NAV */}
              <nav className={`md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-900 z-[100] flex items-center justify-between px-2 pt-2 pb-[calc(12px+env(safe-area-inset-bottom,0px))] transition-transform duration-300 ease-in-out ${
                  (isCommunityFeed && !isMobileNavVisible) ? 'translate-y-full' : 'translate-y-0'
                }`}>
                {navItems.filter(item => item.showOnMobileBar).map((item) => (
                  <Link key={item.name} href={item.href!} className="flex flex-col items-center justify-center w-full py-1">
                    <div className="relative flex items-center justify-center">
                      <div className={`${pathname === item.href ? 'text-black dark:text-white' : 'text-zinc-500'}`}>
                        <item.icon size={22} strokeWidth={pathname === item.href ? 2.5 : 2} />
                      </div>
                      {(item.count !== undefined && item.count > 0) && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-red-500 text-[9px] font-black text-white rounded-full border-2 border-white dark:border-[#0a0a0a]">
                          {item.count > 9 ? '9+' : item.count}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
                {/* Profile Avatar on Far Right */}
                <Link href={`/profile/${user?.id}`} className="flex flex-col items-center justify-center w-full py-1">
                  <div className={`w-6 h-6 rounded-full overflow-hidden border-2 ${pathname.includes('/profile/') ? 'border-[#9cf822]' : 'border-transparent'}`}>
                    {avatarUrl ? (
                      <img src={avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <User size={12} />
                      </div>
                    )}
                  </div>
                </Link>
              </nav>

              {isMobileMenuOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}
            </>
          )}

          {/* MAIN CONTENT AREA */}
          <main className={`flex-grow w-full transition-all duration-500 bg-white dark:bg-black ${showSidebar && !isAppLoading ? 'px-4 md:px-10 pb-24 md:pb-10 pt-20 md:pt-10' : ''}`}>
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