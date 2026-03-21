'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ThemeProvider, useTheme } from 'next-themes';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { 
  Home, Compass, PlusCircle, FolderClosed, Settings, User, 
  LogOut, TrendingUp, ChevronUp, Menu, X, ChevronLeft, ChevronRight,
  HelpCircle, FileText, Shield, Bell, Search, Palette, Sun, Moon, CreditCard,
  Globe, BadgeCheck, Wallet, ArrowUpRight 
} from 'lucide-react';
import Modal from '@/components/Modal'; 
import SearchModal from '@/components/SearchModal'; 
import { UserProvider, useUser } from '@/app/context/UserContext';
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

// --- Layout Inner: The UI that consumes the UserContext ---
function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // 🔥 This is where the magic happens! Everything is reactive now.
  const { user, profile, unreadNotifications, isLoading: isAppLoading } = useUser();
  
  const [showMenu, setShowMenu] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // GLOBAL TOUR STATE
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState<Step[]>([]);
  
  // Mobile Top & Bottom Bar Scroll State
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === 'undefined') return;
      
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 60) {
        setIsMobileNavVisible(true);
      } else if (currentScrollY > lastScrollY.current + 5) {
        setIsMobileNavVisible(false);
      } else if (currentScrollY < lastScrollY.current - 5) {
        setIsMobileNavVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- DYNAMIC TOUR LOGIC ---
  useEffect(() => {
    if (isAppLoading || typeof window === 'undefined') return;

    const seenTours = JSON.parse(localStorage.getItem('colab_tours_seen') || '{}');
    if (seenTours[pathname || '']) {
      setRunTour(false);
      return; 
    }

    const isMobile = window.innerWidth < 768;
    const navPlacement = isMobile ? 'top' : 'right';

    const getStepsForPath = (path: string): Step[] => {
      switch (path) {
        case '/community':
          return [
            { target: isMobile ? '.mobile-sidebar-community' : '.desktop-sidebar-community', content: 'This is the Community Hub. Explore what others are building here.', placement: navPlacement, disableBeacon: true },
            { target: '.composer-section', content: 'Share your progress with the community here.', placement: 'bottom' }
          ];
        case '/discover':
          return [
            { target: isMobile ? '.mobile-sidebar-home' : '.desktop-sidebar-home', content: 'Welcome to Home! Your curated feed of top projects appears here.', placement: navPlacement, disableBeacon: true },
            { target: isMobile ? '.mobile-sidebar-search' : '.desktop-sidebar-search', content: 'Looking for specific skills or projects? Search the entire platform here.', placement: isMobile ? 'bottom' : 'right' }
          ];
        case '/my-projects':
          return [
            { target: isMobile ? '.mobile-sidebar-dashboard' : '.desktop-sidebar-dashboard', content: 'Your Dashboard. Manage all your ongoing builds and collaborations from here.', placement: navPlacement, disableBeacon: true },
            { target: isMobile ? '.mobile-sidebar-create' : '.desktop-sidebar-create', content: 'Got an idea? Click here to spin up a new project.', placement: navPlacement }
          ];
        case '/wallet':
          return [
            { target: isMobile ? '.mobile-sidebar-wallet' : '.desktop-sidebar-wallet', content: 'Track your earnings, payments, and escrow balances securely here.', placement: navPlacement, disableBeacon: true }
          ];
        default:
          return [];
      }
    };

    const newSteps = getStepsForPath(pathname || '');
    
    if (newSteps.length > 0) {
      setTourSteps(newSteps);
      setTimeout(() => setRunTour(true), 600);
    } else {
      setRunTour(false);
    }
  }, [pathname, isAppLoading]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRunTour(false);
      const seenTours = JSON.parse(localStorage.getItem('colab_tours_seen') || '{}');
      seenTours[pathname || ''] = true;
      localStorage.setItem('colab_tours_seen', JSON.stringify(seenTours));
    }
  };

  const modalContent: Record<string, { title: string, content: React.ReactNode }> = {};

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isMarketingPage = pathname === '/' || pathname === '/about' || pathname === '/terms' || pathname === '/privacy' || pathname === '/blog';
  const showSidebar = !isAuthPage && !isMarketingPage;

  const isCommunityFeed = pathname === '/community';
  const isMessagesPage = pathname?.startsWith('/messages');

  const navItems = [
    { name: 'Home', icon: Home, href: '/discover', showOnMobileBar: true, tourClass: 'sidebar-home' }, 
    { name: 'Dashboard', icon: FolderClosed, href: '/my-projects', showOnMobileBar: true, tourClass: 'sidebar-dashboard' },
    { name: 'Create', icon: PlusCircle, href: '/create', showOnMobileBar: true, tourClass: 'sidebar-create' },
    { name: 'Community', icon: Globe, href: '/community', showOnMobileBar: true, tourClass: 'sidebar-community' },
    { name: 'Wallet', icon: Wallet, href: '/wallet', showOnMobileBar: false, tourClass: 'sidebar-wallet' },
    { name: 'Notifications', icon: Bell, href: '/notifications', count: unreadNotifications, showOnMobileBar: true, tourClass: 'sidebar-notifications' },
    { name: 'Search', icon: Search, onClick: () => setActiveModal('search'), showOnMobileBar: false, tourClass: 'sidebar-search' },
  ];

  // We pull these directly from the global profile state now
  const isVerified = profile?.is_verified || false;
  const fullNameStr = profile?.full_name || user?.user_metadata?.full_name || 'User';
  const finalAvatar = profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${fullNameStr}&backgroundColor=9cf822&fontFamily=Arial&fontWeight=bold`;

  return (
    <>
      {isAppLoading && <SplashScreen />}

      <Joyride
        key={pathname} 
        steps={tourSteps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: { primaryColor: '#9cf822', textColor: '#000', zIndex: 10000 },
          tooltipContainer: { textAlign: 'left', borderRadius: '20px' },
          buttonNext: { borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }
        }}
      />

      {showSidebar && !isAppLoading && (
        <>
          {!isMessagesPage && (
            <div 
              className={`md:hidden flex items-center justify-between p-4 h-16 fixed top-0 w-full z-[100] transition-transform duration-300 ease-in-out
                bg-white/60 dark:bg-black/60 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-900/50 shadow-sm
                ${(isCommunityFeed && !isMobileNavVisible) ? '-translate-y-full' : 'translate-y-0'}`}
            >
              <BrandLogo isMobile />
              <div className="flex items-center gap-4 text-zinc-600 dark:text-zinc-300">
                <button className="mobile-sidebar-search" onClick={() => setActiveModal('search')} aria-label="Search"><Search size={20} /></button>
                <button onClick={() => setIsMobileMenuOpen(true)} aria-label="Menu"><Menu size={24} /></button>
              </div>
            </div>
          )}

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
                    className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.tourClass ? `desktop-${item.tourClass}` : ''} ${isActive ? 'text-black dark:text-white bg-black/5 dark:bg-[#9cf822]/10 font-bold' : 'text-zinc-600 dark:text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-white'} ${isCollapsed && !isMobileMenuOpen ? 'justify-center px-0' : ''}`}>
                    <div className="relative w-9 flex items-center justify-center shrink-0">
                      <item.icon size={18} />
                      {(item.count !== undefined && item.count > 0) ? (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-red-500 text-[9px] font-black text-white rounded-full border-2 border-[#F3F2F1] dark:border-[#0a0a0a] animate-in zoom-in">
                          {item.count > 9 ? '9+' : item.count}
                        </span>
                      ) : null}
                    </div>
                    {(!isCollapsed || isMobileMenuOpen) && <span className="text-sm font-medium">{item.name}</span>}
                    
                    {isCollapsed && !isMobileMenuOpen && (
                      <div className="absolute left-full ml-4 px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded-lg opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-[200] shadow-xl">
                        {item.name}
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-[5px] border-transparent border-r-zinc-900 dark:border-r-white"></div>
                      </div>
                    )}
                  </Link>
                ) : (
                  <button key={item.name} onClick={item.onClick}
                    className={`group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.tourClass ? `desktop-${item.tourClass}` : ''} text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-white ${isCollapsed && !isMobileMenuOpen ? 'justify-center px-0' : ''}`}>
                    <div className="w-9 flex items-center justify-center shrink-0">
                      <item.icon size={18} />
                    </div>
                    {(!isCollapsed || isMobileMenuOpen) && <span className="text-sm font-medium">{item.name}</span>}
                    
                    {isCollapsed && !isMobileMenuOpen && (
                      <div className="absolute left-full ml-4 px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded-lg opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-[200] shadow-xl">
                        {item.name}
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-[5px] border-transparent border-r-zinc-900 dark:border-r-white"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>

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
                    <span className="text-2xl font-medium text-zinc-900 dark:text-white">₦4,250</span>
                    <span className="text-xs text-zinc-500 font-medium">.00</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">In Escrow</span>
                    <span className="text-xs font-medium text-green-600 dark:text-[#9cf822]">₦1,200</span>
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
                  <img src={finalAvatar} className="w-full h-full object-cover" alt="Avatar" />
                </div>
                {(!isCollapsed || isMobileMenuOpen) && (
                  <div className="text-left flex-grow flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {fullNameStr.split(' ')[0]}
                    </p>
                    {isVerified && <BadgeCheck size={14} fill="#9cf822" className="text-white dark:text-black shrink-0" />}
                  </div>
                )}
                {(!isCollapsed || isMobileMenuOpen) && <ChevronUp size={16} className={`text-zinc-400 shrink-0 transition-transform ${showMenu ? 'rotate-180' : ''}`} />}
              </button>
            </div>
          </aside>

          {!isMessagesPage && (
            <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-between px-2 pt-2 pb-[calc(12px+env(safe-area-inset-bottom,0px))] transition-transform duration-300 ease-in-out
              bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-xl border-t border-zinc-200/50 dark:border-zinc-900/50 shadow-[0_-4px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_30px_rgba(0,0,0,0.2)]
              ${(isCommunityFeed && !isMobileNavVisible) ? 'translate-y-full' : 'translate-y-0'}`}>
              {navItems.filter(item => item.showOnMobileBar).map((item) => (
                <Link key={item.name} href={item.href!} className={`flex flex-col items-center justify-center w-full py-1 ${item.tourClass ? `mobile-${item.tourClass}` : ''}`}>
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
              <Link href={`/profile/${user?.id}`} className="flex flex-col items-center justify-center w-full py-1">
                <div className={`w-6 h-6 rounded-full overflow-hidden border-2 ${pathname.includes('/profile/') ? 'border-[#9cf822]' : 'border-transparent'}`}>
                  <img src={finalAvatar} className="w-full h-full object-cover" alt="Profile" />
                </div>
              </Link>
            </nav>
          )}

          {isMobileMenuOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}
        </>
      )}

      <main className={`flex-grow w-full transition-all duration-500 bg-white dark:bg-black ${showSidebar && !isAppLoading ? (isMessagesPage ? 'pb-24 md:pb-10' : 'px-4 md:px-10 pb-24 md:pb-10 pt-20 md:pt-10') : ''}`}>
        {!isAppLoading && children}
      </main>

      <SearchModal isOpen={activeModal === 'search'} onClose={() => setActiveModal(null)} />
      <Modal isOpen={!!activeModal && activeModal !== 'search'} onClose={() => setActiveModal(null)} title={activeModal && modalContent[activeModal] ? modalContent[activeModal].title : ""}>
        {activeModal && activeModal !== 'search' && modalContent[activeModal] && modalContent[activeModal].content}
      </Modal>
    </>
  );
}

// --- The Actual Root Component ---
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="min-h-screen antialiased flex flex-col md:flex-row overflow-x-hidden transition-colors duration-500 bg-white dark:bg-black text-zinc-900 dark:text-white">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {/* We wrap everything inside UserProvider so ANY component can grab live data */}
          <UserProvider>
            <LayoutInner>{children}</LayoutInner>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}