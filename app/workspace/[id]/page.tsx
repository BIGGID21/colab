'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useTheme } from 'next-themes';
import { 
  Loader2, ArrowLeft, Users, Target, Zap, 
  MessageSquare, Layout, Shield, FileText, 
  CheckCircle2, Circle, Clock, Percent, Plus, 
  X, Send, User, Compass, TrendingUp, 
  Briefcase, Code, PencilRuler, Upload, 
  Wallet, Lock, DollarSign, CreditCard,
  Trash2, Maximize, Minimize,
  ShieldCheck, Image as ImageIcon,
  Paperclip, ArrowUpRight, Pin,
  MousePointer2, Square, Type, PenTool,
  ZoomIn, ZoomOut, Palette, Undo, LayoutDashboard,
  Layers, Eye, EyeOff, Lock as LockIcon, Unlock,
  AlignLeft, AlignCenter, AlignRight,
  Type as TypeIcon, Hand, ImagePlus, Save,
  BringToFront, SendToBack, MonitorSmartphone
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

// ----------------------------------------------------------------------
// TYPES & HELPERS
// ----------------------------------------------------------------------
type ElementType = 'rectangle' | 'ellipse' | 'text' | 'path' | 'frame' | 'image';

interface CanvasElement {
  id: string;
  name: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  text?: string;
  fontSize?: number;
  imageUrl?: string;
  points?: { x: number; y: number }[];
  isVisible: boolean;
  isLocked: boolean;
}

const getCurrencySymbol = (currency: string) => {
  switch (currency?.toUpperCase()) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'NGN': return '₦';
    case 'USD': default: return '$';
  }
};

const ChatWallpaper = () => {
  const icons = [Target, Zap, Layout, FileText, Users, Compass, TrendingUp, Briefcase, Code, PencilRuler];
  return (
    <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06] overflow-hidden select-none z-0">
      <div className="flex flex-wrap gap-12 p-8 justify-around items-center h-full w-full rotate-[-12deg] scale-125">
        {Array.from({ length: 40 }).map((_, i) => {
          const Icon = icons[i % icons.length];
          return <Icon key={i} size={32} strokeWidth={1.5} />;
        })}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();
  const { theme } = useTheme();

  // --- View State ---
  const [activeTab, setActiveTab] = useState<'overview' | 'colab'>('overview'); // Default to overview
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // --- Mobile Constraint State ---
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  // --- Refs ---
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- App State ---
  const [project, setProject] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // --- Chat State ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<File | null>(null);
  const [isChatUploading, setIsChatUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  // --- Advanced Canvas State ---
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [activeTool, setActiveTool] = useState<'select' | 'hand' | 'frame' | 'rectangle' | 'ellipse' | 'text' | 'pen' | 'image'>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  
  // Drag & Resize State
  const [dragState, setDragState] = useState<{ 
    action: 'moving' | 'resizing' | 'drawing';
    handle?: string; 
    startX: number; 
    startY: number; 
    originalElements: CanvasElement[] 
  } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(pattern);
  };

  // --- SCREEN SIZE DETECTION ---
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // 1024px is standard 'lg' breakpoint (laptops/desktops)
    };
    
    checkScreenSize(); // Initial check
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // --- INIT FETCH ---
  useEffect(() => {
    if (!document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
    }

    async function fetchWorkspaceData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return router.push('/login');
      setUser(authUser);

      const { data: projectData } = await supabase.from('projects').select('*, profiles:user_id(full_name, avatar_url, role)').eq('id', projectId).single();
      if (!projectData) return router.push('/dashboard');

      const isOwner = projectData.user_id === authUser.id;
      setIsFounder(isOwner);

      const { data: collaborators } = await supabase.from('collaborations').select('*, profiles:user_id(full_name, avatar_url, role)').eq('project_id', projectId).eq('status', 'accepted');
      const isTeamMember = collaborators?.some(c => c.user_id === authUser.id);
      if (!isOwner && !isTeamMember) return router.push(`/project/${projectId}`); 

      const { data: milestoneData } = await supabase.from('milestones').select('*').eq('project_id', projectId).order('id', { ascending: true });
      const { data: msgData } = await supabase.from('messages').select('*, profiles:user_id(full_name, avatar_url)').eq('project_id', projectId).order('created_at', { ascending: true });

      // Load existing canvas data or defaults
      if (projectData.canvas_data && Array.isArray(projectData.canvas_data) && projectData.canvas_data.length > 0) {
        setElements(projectData.canvas_data);
      } else {
        setElements([
          { id: 'el_1', name: 'Desktop UI', type: 'frame', x: 100, y: 100, width: 800, height: 600, fill: '#ffffff', fillOpacity: 100, stroke: '#e4e4e7', strokeWidth: 1, cornerRadius: 0, isVisible: true, isLocked: false },
          { id: 'el_2', name: 'Hero Button', type: 'rectangle', x: 400, y: 350, width: 200, height: 56, fill: '#9cf822', fillOpacity: 100, stroke: 'transparent', strokeWidth: 0, cornerRadius: 12, isVisible: true, isLocked: false },
        ]);
      }

      setProject(projectData);
      setTeam(collaborators || []);
      setMilestones(milestoneData || []);
      setMessages(msgData || []);
      setLoading(false);
    }
    fetchWorkspaceData();
  }, [projectId, supabase, router]);

  // --- SAVE ENGINE ---
  const handleSaveDesign = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ canvas_data: elements })
        .eq('id', projectId);
      
      if (error) throw error;
      triggerHaptic([10, 50]);
    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to save design.");
    } finally {
      setIsSaving(false);
    }
  };

  // ----------------------------------------------------------------------
  // CANVAS ENGINE (PAN, ZOOM, RESIZE)
  // ----------------------------------------------------------------------
  const getCanvasCoords = (e: React.MouseEvent | React.PointerEvent | WheelEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - canvasTransform.x) / canvasTransform.scale,
      y: (e.clientY - rect.top - canvasTransform.y) / canvasTransform.scale
    };
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const zoomSensitivity = 0.005;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(Math.max(0.1, canvasTransform.scale + delta), 5);
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const newX = mouseX - (mouseX - canvasTransform.x) * (newScale / canvasTransform.scale);
        const newY = mouseY - (mouseY - canvasTransform.y) * (newScale / canvasTransform.scale);
        setCanvasTransform({ x: newX, y: newY, scale: newScale });
      } else {
        setCanvasTransform(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [canvasTransform]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'colab') return;
      if (e.code === 'Space' && !isPanning) setIsPanning(true);
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedIds.length > 0 && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
          setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
          setSelectedIds([]);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsPanning(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [selectedIds, isPanning, activeTab]);

  // Handle Tool Clicks on Canvas
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isPanning || activeTool === 'hand' || e.button === 1) {
      setDragState({ action: 'moving', startX: e.clientX, startY: e.clientY, originalElements: [] });
      return;
    }

    const { x, y } = getCanvasCoords(e);
    
    if (activeTool === 'select') {
      if ((e.target as SVGElement).tagName === 'svg') setSelectedIds([]);
      return;
    }

    if (activeTool === 'image') {
      imageUploadRef.current?.click();
      setActiveTool('select');
      return;
    }

    const newId = `el_${Date.now()}`;
    const baseElement = { id: newId, x, y, fillOpacity: 100, stroke: 'transparent', strokeWidth: 0, cornerRadius: 0, isVisible: true, isLocked: false };

    if (activeTool === 'rectangle') {
      setElements([...elements, { ...baseElement, name: 'Rectangle', type: 'rectangle', width: 100, height: 100, fill: '#d4d4d8' }]);
    } else if (activeTool === 'ellipse') {
      setElements([...elements, { ...baseElement, name: 'Ellipse', type: 'ellipse', width: 100, height: 100, fill: '#d4d4d8' }]);
    } else if (activeTool === 'text') {
      setElements([...elements, { ...baseElement, name: 'Text', type: 'text', width: 150, height: 50, fill: '#000000', text: 'Double click to edit', fontSize: 24 }]);
    } else if (activeTool === 'frame') {
      setElements([{ ...baseElement, name: 'Frame', type: 'frame', width: 375, height: 812, fill: '#ffffff', stroke: '#e4e4e7', strokeWidth: 1 }, ...elements]);
    }
    
    setSelectedIds([newId]);
    setActiveTool('select');
  };

  // Resize and Move Logic
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;

    if (isPanning || activeTool === 'hand' || (dragState.action === 'moving' && dragState.originalElements.length === 0)) {
      // Panning Canvas
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      setCanvasTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setDragState({ ...dragState, startX: e.clientX, startY: e.clientY });
      return;
    }

    const { x, y } = getCanvasCoords(e);

    if (dragState.action === 'moving') {
      const dx = x - dragState.startX;
      const dy = y - dragState.startY;
      setElements(dragState.originalElements.map(el => selectedIds.includes(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el));
    } 
    else if (dragState.action === 'resizing' && dragState.handle) {
      const dx = x - dragState.startX;
      const dy = y - dragState.startY;
      
      setElements(dragState.originalElements.map(el => {
        if (!selectedIds.includes(el.id)) return el;
        
        let newX = el.x, newY = el.y, newW = el.width, newH = el.height;
        const handle = dragState.handle!;

        if (handle.includes('e')) newW = Math.max(10, el.width + dx);
        if (handle.includes('s')) newH = Math.max(10, el.height + dy);
        if (handle.includes('w')) {
          newW = Math.max(10, el.width - dx);
          if (newW > 10) newX = el.x + dx;
        }
        if (handle.includes('n')) {
          newH = Math.max(10, el.height - dy);
          if (newH > 10) newY = el.y + dy;
        }

        // Proportional text scaling
        let newFontSize = el.fontSize;
        if (el.type === 'text' && el.fontSize && el.height) {
          newFontSize = Math.max(8, el.fontSize * (newH / el.height));
        }

        return { ...el, x: newX, y: newY, width: newW, height: newH, fontSize: newFontSize };
      }));
    }
  };

  const handlePointerUp = () => setDragState(null);

  const handleElementPointerDown = (e: React.PointerEvent, el: CanvasElement) => {
    if (activeTool !== 'select' || isPanning || el.isLocked || !el.isVisible) return;
    e.stopPropagation();
    
    const newSelection = e.shiftKey ? (selectedIds.includes(el.id) ? selectedIds.filter(id => id !== el.id) : [...selectedIds, el.id]) : [el.id];
    setSelectedIds(newSelection);
    
    const { x, y } = getCanvasCoords(e);
    setDragState({ action: 'moving', startX: x, startY: y, originalElements: elements });
  };

  const handleResizeHandleDown = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    const { x, y } = getCanvasCoords(e);
    setDragState({ action: 'resizing', handle, startX: x, startY: y, originalElements: elements });
  };

  // Layer Arrangement
  const bringToFront = () => {
    if (!selectedIds.length) return;
    const unselected = elements.filter(el => !selectedIds.includes(el.id));
    const selected = elements.filter(el => selectedIds.includes(el.id));
    setElements([...unselected, ...selected]); 
  };

  const sendToBack = () => {
    if (!selectedIds.length) return;
    const unselected = elements.filter(el => !selectedIds.includes(el.id));
    const selected = elements.filter(el => selectedIds.includes(el.id));
    setElements([...selected, ...unselected]); 
  };

  const updateSelected = (updates: Partial<CanvasElement>) => {
    setElements(elements.map(el => selectedIds.includes(el.id) ? { ...el, ...updates } : el));
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newId = `el_${Date.now()}`;
          const viewCenterX = (-canvasTransform.x + window.innerWidth/2) / canvasTransform.scale;
          const viewCenterY = (-canvasTransform.y + window.innerHeight/2) / canvasTransform.scale;
          
          setElements([...elements, { 
            id: newId, name: 'Image', type: 'image', x: viewCenterX - 150, y: viewCenterY - 150, width: 300, height: 300, 
            fill: 'transparent', fillOpacity: 100, stroke: 'transparent', strokeWidth: 0, cornerRadius: 0, 
            isVisible: true, isLocked: false, imageUrl: event.target.result as string 
          }]);
          setSelectedIds([newId]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ----------------------------------------------------------------------
  // PROJECT HANDLERS (Overview & Chat)
  // ----------------------------------------------------------------------
  const handleToggleMilestone = async (m: any) => {
    if (!isFounder) return; 
    triggerHaptic([10, 30]);
    const newStatus = m.status === 'completed' ? 'pending' : 'completed';
    setMilestones((prev) => prev.map((milestone) => milestone.id === m.id ? { ...milestone, status: newStatus } : milestone));
    await supabase.from('milestones').update({ status: newStatus }).eq('id', m.id);
  };

  const handlePayment = (amount: number, milestoneId: string) => {
    if (!user) return;
    setIsProcessing(milestoneId);
    try {
      // @ts-ignore
      if (typeof window.PaystackPop === 'undefined') { alert("Payment gateway loading."); setIsProcessing(null); return; }
      const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      const finalAmountInKobo = Math.round(amount * 100 * 1500);
      
      // @ts-ignore
      const handler = window.PaystackPop.setup({
        key: paystackKey, email: user.email || 'founder@colab.com', amount: finalAmountInKobo, currency: 'NGN',
        callback: async (response: any) => {
          const { error } = await supabase.from('milestones').update({ payment_status: 'escrow_funded', payment_reference: response.reference }).eq('id', milestoneId);
          if (!error) {
            setMilestones((prev) => prev.map((m) => m.id === milestoneId ? { ...m, payment_status: 'escrow_funded' } : m));
            triggerHaptic([10, 50, 10]);
          }
          setIsProcessing(null);
        },
        onClose: () => setIsProcessing(null)
      });
      handler.openIframe();
    } catch (error: any) { alert(`Gateway Error: ${error.message}`); setIsProcessing(null); }
  };

  const handleProjectPayment = () => {
    if (!user) return;
    setIsProcessing('project_funding');
    try {
      // @ts-ignore
      if (typeof window.PaystackPop === 'undefined') { alert("Payment gateway loading."); setIsProcessing(null); return; }
      const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      const rawBudget = project?.budget || project?.valuation || 0;
      const cleanBudget = typeof rawBudget === 'string' ? rawBudget.replace(/[^0-9.]/g, '') : rawBudget;
      const finalAmountInKobo = Math.round((Number(cleanBudget) || 0) * 100 * 1500);

      // @ts-ignore
      const handler = window.PaystackPop.setup({
        key: paystackKey, email: user.email || 'founder@colab.com', amount: finalAmountInKobo, currency: 'NGN',
        callback: async (response: any) => {
          const { error } = await supabase.from('projects').update({ payment_status: 'escrow_funded', payment_reference: response.reference }).eq('id', projectId);
          if (!error) {
            setProject((prev: any) => ({ ...prev, payment_status: 'escrow_funded' }));
            triggerHaptic([10, 50, 10]);
          }
          setIsProcessing(null);
        },
        onClose: () => setIsProcessing(null)
      });
      handler.openIframe();
    } catch (error: any) { alert(`Gateway Error: ${error.message}`); setIsProcessing(null); }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !pendingAttachment) return;
    setIsSending(true);
    let attachmentUrl = null;

    try {
      if (pendingAttachment) {
        setIsChatUploading(true);
        const fileName = `${Math.random()}.${pendingAttachment.name.split('.').pop()}`;
        const filePath = `${projectId}/chat/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('project_assets').upload(filePath, pendingAttachment);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('project_assets').getPublicUrl(filePath);
        attachmentUrl = publicUrl;
      }

      await supabase.from('messages').insert({
        project_id: projectId, user_id: user.id, content: newMessage.trim(), attachment_url: attachmentUrl,
        attachment_type: pendingAttachment?.type.includes('image') ? 'image' : pendingAttachment ? 'document' : null,
        attachment_name: pendingAttachment?.name
      });

      setNewMessage(''); setPendingAttachment(null);
      if (chatFileInputRef.current) chatFileInputRef.current.value = '';
      triggerHaptic(10);
    } catch (error) {
      alert("Failed to send message.");
    } finally {
      setIsSending(false); setIsChatUploading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    await supabase.from('messages').delete().eq('id', messageId);
  };
  
  const handleTogglePin = async (messageId: string, currentPinStatus: boolean) => {
    const newStatus = !currentPinStatus;
    if (newStatus) await supabase.from('messages').update({ is_pinned: false }).eq('project_id', projectId).neq('id', messageId);
    await supabase.from('messages').update({ is_pinned: newStatus }).eq('id', messageId);
  };

  // ----------------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------------
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black"><Loader2 className="animate-spin text-[#9cf822]" /></div>;

  const totalBudget = project?.budget || project?.valuation || 0;
  const currencySymbol = getCurrencySymbol(project?.currency);
  const displayImage = project?.cover_image_url || project?.image_url;
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const progressPercentage = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;
  const pinnedMessage = messages.find((m: any) => m.is_pinned === true);
  const selectedElement = elements.find(el => selectedIds.includes(el.id));

  return (
    <div className={`transition-colors duration-300 flex flex-col font-sans ${isFullscreen ? 'fixed inset-0 z-[9999] bg-[#1E1E1E]' : 'min-h-screen'} ${activeTab === 'colab' ? 'bg-[#1E1E1E] text-zinc-300 selection:bg-[#9cf822]/30 overflow-hidden' : 'bg-zinc-50 dark:bg-black text-left pb-20 relative'}`}>
      
      {/* ------------------------------------------------------------------ */}
      {/* HEADER */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'overview' && !isFullscreen ? (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-900 shrink-0">
          <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href={isFounder ? "/dashboard" : "/discover"} className="p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors bg-zinc-100 dark:bg-zinc-900 rounded-full">
                <ArrowLeft size={18} />
              </Link>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0">
                    {displayImage ? <img src={displayImage} className="w-full h-full object-cover" alt="Project" /> : <div className="w-full h-full flex items-center justify-center"><Layout size={16} className="text-zinc-400"/></div>}
                 </div>
                 <div>
                    <h1 className="text-base font-bold text-black dark:text-white leading-tight">{project.title}</h1>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5a9a00] dark:text-[#9cf822]">Workspace</span>
                 </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl self-start sm:self-auto">
              <button onClick={() => setActiveTab('overview')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all bg-white dark:bg-black text-black dark:text-white shadow-sm">
                <LayoutDashboard size={14} /> Overview
              </button>
              
              {/* CO-LAB BUTTON WITH MOBILE CHECK */}
              <button 
                onClick={() => {
                  if (isMobile) {
                    setShowMobileWarning(true);
                  } else {
                    setActiveTab('colab');
                  }
                }} 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all text-zinc-500 hover:text-[#9cf822]"
              >
                <PencilRuler size={14} /> Co-Lab
              </button>
            </div>
            
            <button onClick={() => setIsChatOpen(true)} className="hidden sm:flex px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-black/10 dark:shadow-white/10 items-center gap-2">
              <MessageSquare size={16} /> Team Sync
            </button>
          </div>
        </header>
      ) : activeTab === 'colab' && (
        <header className="h-12 bg-[#2C2C2C] border-b border-[#404040] flex items-center justify-between px-4 shrink-0 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => { setIsFullscreen(false); setActiveTab('overview'); }} className="p-1.5 hover:bg-[#404040] rounded-md transition-colors text-zinc-400 hover:text-white">
              <ArrowLeft size={16} />
            </button>
            <div className="text-sm font-medium text-white flex items-center gap-2">
              {project?.title} <span className="bg-[#404040] text-[#9cf822] text-[10px] px-2 py-0.5 rounded font-bold tracking-widest uppercase">Co-Lab</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#1E1E1E] p-1 rounded-lg border border-[#404040]">
            <ToolButton icon={<MousePointer2 size={16} />} active={activeTool === 'select'} onClick={() => setActiveTool('select')} tooltip="Move (V)" />
            <ToolButton icon={<Hand size={16} />} active={activeTool === 'hand' || isPanning} onClick={() => setActiveTool('hand')} tooltip="Hand Tool (H)" />
            <div className="w-px h-4 bg-[#404040] mx-1"></div>
            <ToolButton icon={<Layout size={16} />} active={activeTool === 'frame'} onClick={() => setActiveTool('frame')} tooltip="Frame (F)" />
            <ToolButton icon={<Square size={16} />} active={activeTool === 'rectangle'} onClick={() => setActiveTool('rectangle')} tooltip="Rectangle (R)" />
            <ToolButton icon={<Circle size={16} />} active={activeTool === 'ellipse'} onClick={() => setActiveTool('ellipse')} tooltip="Ellipse (O)" />
            <ToolButton icon={<TypeIcon size={16} />} active={activeTool === 'text'} onClick={() => setActiveTool('text')} tooltip="Text (T)" />
            <ToolButton icon={<ImagePlus size={16} />} active={activeTool === 'image'} onClick={() => setActiveTool('image')} tooltip="Add Image" />
            <input type="file" ref={imageUploadRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 text-zinc-400 hover:text-white rounded-md transition-colors" title="Toggle Fullscreen">
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
            <div className="w-px h-4 bg-[#404040]"></div>
            <button onClick={() => setIsChatOpen(true)} className="px-3 py-1.5 bg-[#404040] hover:bg-[#505050] text-white text-xs font-bold rounded-md transition-colors flex items-center gap-2">
              <MessageSquare size={14} /> Sync
            </button>
            <button onClick={handleSaveDesign} disabled={isSaving} className="px-3 py-1.5 bg-[#9cf822] text-black text-xs font-bold rounded-md hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
            </button>
          </div>
        </header>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB CONTENT */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-grow flex flex-col relative">
        
        {/* ================= OVERVIEW TAB ================= */}
        {activeTab === 'overview' && !isFullscreen && (
          <div className="max-w-[1600px] w-full mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 pb-20">
            {/* ROADMAP COLUMN */}
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-900 rounded-[2rem] p-8 shadow-sm">
                <div className="flex justify-between items-end mb-4">
                   <div>
                     <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2"><Target size={20} className="text-[#9cf822]" /> Project Roadmap</h2>
                     <p className="text-sm text-zinc-500 mt-1">Track deliverables and unlock milestones.</p>
                   </div>
                   <div className="text-right"><span className="text-3xl font-black text-black dark:text-white">{progressPercentage}%</span></div>
                </div>
                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                   <div className="h-full bg-[#9cf822] transition-all duration-1000 ease-out" style={{ width: `${progressPercentage}%` }}/>
                </div>
              </div>

              <div className="space-y-4">
                {milestones.length > 0 ? milestones.map((m, index) => {
                  const mockPrice = m.price || (totalBudget / (milestones.length || 1)).toFixed(0);
                  const isFunded = m.payment_status === 'escrow_funded'; 
                  const isCompleted = m.status === 'completed';

                  return (
                    <div key={m.id} className={`bg-white dark:bg-[#0a0a0a] border rounded-[2rem] p-6 transition-all duration-300 ${isCompleted ? 'border-[#9cf822]/30 bg-[#9cf822]/5 shadow-sm' : 'border-zinc-200 dark:border-zinc-900'}`}>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
                        <div className="flex gap-4">
                          <button onClick={() => handleToggleMilestone(m)} disabled={!isFounder} className={`mt-1 shrink-0 ${isFounder ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}>
                            {isCompleted ? <CheckCircle2 className="text-[#5a9a00] dark:text-[#9cf822] drop-shadow-md" size={28} /> : <Circle className="text-zinc-300 dark:text-zinc-700" size={28} strokeWidth={1.5} />}
                          </button>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Step 0{index + 1}</span>
                              {isFunded && <span className="bg-emerald-500/10 text-emerald-500 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1"><Lock size={8}/> Funded</span>}
                            </div>
                            <h4 className={`font-bold leading-tight ${isCompleted ? 'text-zinc-400 line-through decoration-zinc-300 dark:decoration-zinc-700' : 'text-black dark:text-white text-lg'}`}>{m.title}</h4>
                            <p className={`text-sm mt-1 ${isCompleted ? 'text-zinc-400' : 'text-zinc-500'}`}>{m.description}</p>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                           <div className="text-right">
                             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-0.5">Value</span>
                             <span className={`font-bold ${isCompleted ? 'text-zinc-400' : 'text-black dark:text-white'}`}>{currencySymbol}{Number(mockPrice).toLocaleString()}</span>
                           </div>
                           {isFounder && !isFunded && !isCompleted && (
                             <button disabled={isProcessing === m.id} onClick={() => handlePayment(Number(mockPrice), m.id)} className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
                               {isProcessing === m.id ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={14} />} Fund Escrow
                             </button>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="bg-white dark:bg-[#0a0a0a] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-12 text-center">
                    <Target className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" size={32} />
                    <h3 className="text-base font-bold text-black dark:text-white mb-1">No Roadmap Defined</h3>
                    <p className="text-sm text-zinc-500 max-w-xs mx-auto">The project lead hasn't set up specific deliverables yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* TEAM/FINANCIALS COLUMN */}
            <div className="lg:col-span-4">
              <div className="sticky top-28 space-y-6">
                <section className="bg-black text-white dark:bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                   <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none"><DollarSign size={160} /></div>
                   <div className="relative z-10">
                      <h2 className="text-xs font-bold mb-1 flex items-center gap-2 text-zinc-400 uppercase tracking-widest"><Wallet size={14} className="text-[#9cf822]" /> Total Budget</h2>
                      <p className="text-4xl font-bold tracking-tight mb-6">{currencySymbol}{Number(totalBudget).toLocaleString()}</p>
                      <div className="space-y-4 pt-6 border-t border-zinc-800">
                        <div className="flex justify-between items-center text-sm"><span className="text-zinc-400">Total Equity</span><span className="font-bold">{project?.equity || 0}%</span></div>
                        <div className="flex justify-between items-center text-sm"><span className="text-zinc-400">Available to Distribute</span><span className="font-bold text-[#9cf822]">{project?.available_share || 0}%</span></div>
                      </div>
                      {isFounder && project?.payment_status !== 'escrow_funded' && (
                        <button onClick={handleProjectPayment} disabled={isProcessing === 'project_funding'} className="mt-6 w-full py-3.5 bg-[#9cf822] text-black rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                          {isProcessing === 'project_funding' ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />} Fund Project Escrow
                        </button>
                      )}
                      {isFounder && project?.payment_status === 'escrow_funded' && (
                        <div className="mt-6 w-full py-3 bg-[#9cf822]/10 text-[#9cf822] border border-[#9cf822]/20 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                          <ShieldCheck size={16} /> Project Funded
                        </div>
                      )}
                   </div>
                </section>

                <section className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-900 rounded-[2.5rem] p-8">
                  <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Users size={16} /> Active Roster</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 group">
                       <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 border-2 border-[#9cf822] shrink-0">
                          {project?.profiles?.avatar_url ? <img src={project.profiles.avatar_url} className="w-full h-full object-cover" alt="Founder" /> : <Shield size={20} className="m-auto mt-3 text-zinc-400" />}
                       </div>
                       <div className="flex-grow min-w-0">
                         <p className="text-sm font-bold text-black dark:text-white truncate flex items-center gap-1.5">{project?.profiles?.full_name || 'Project Lead'} {isFounder && <span className="bg-zinc-100 dark:bg-zinc-800 text-[9px] px-1.5 py-0.5 rounded text-zinc-500 uppercase">You</span>}</p>
                         <p className="text-xs text-[#5a9a00] dark:text-[#9cf822] font-semibold flex items-center gap-1 mt-0.5"><ShieldCheck size={12}/> Founder</p>
                       </div>
                    </div>
                    {team.map(member => (
                      <div key={member.id} className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
                            {member.profiles?.avatar_url ? <img src={member.profiles.avatar_url} className="w-full h-full object-cover" alt="Member" /> : <User size={20} className="m-auto mt-3 text-zinc-400" />}
                         </div>
                         <div className="flex-grow min-w-0">
                           <p className="text-sm font-bold text-black dark:text-white truncate flex items-center gap-1.5">{member.profiles?.full_name} {user?.id === member.user_id && <span className="bg-zinc-100 dark:bg-zinc-800 text-[9px] px-1.5 py-0.5 rounded text-zinc-500 uppercase">You</span>}</p>
                           <p className="text-xs text-zinc-500 truncate mt-0.5">{member.assigned_role}</p>
                         </div>
                         <div className="shrink-0 text-right"><span className="text-xs font-bold bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md text-black dark:text-white">{member.equity_share}%</span></div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* ================= CO-LAB WHITEBOARD TAB ================= */}
        {activeTab === 'colab' && (
          <div className="flex-grow flex relative overflow-hidden">
            
            {/* LEFT PANEL: LAYERS */}
            <aside className="w-[240px] bg-[#2C2C2C] border-r border-[#404040] flex flex-col z-20 shrink-0">
              <div className="px-4 py-3 border-b border-[#404040] flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Layers size={14} /> Layers
              </div>
              <div className="flex-grow overflow-y-auto p-2 space-y-0.5">
                {[...elements].reverse().map(el => (
                  <div 
                    key={el.id} 
                    onClick={(e) => { e.stopPropagation(); setActiveTool('select'); setSelectedIds([el.id]); }}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer group ${selectedIds.includes(el.id) ? 'bg-[#9cf822]/10 text-[#9cf822] font-medium' : 'text-zinc-400 hover:bg-[#404040] hover:text-zinc-200'}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {el.type === 'frame' ? <Layout size={12} /> : el.type === 'image' ? <ImageIcon size={12} /> : el.type === 'text' ? <TypeIcon size={12} /> : <Square size={12} />}
                      <span className="truncate">{el.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setElements(elements.map(e => e.id === el.id ? {...e, isLocked: !e.isLocked} : e)) }} className="p-1 hover:text-white">
                        {el.isLocked ? <LockIcon size={12} /> : <Unlock size={12} />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setElements(elements.map(e => e.id === el.id ? {...e, isVisible: !e.isVisible} : e)) }} className="p-1 hover:text-white">
                        {el.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* CENTER: INFINITE CANVAS */}
            <main 
              ref={containerRef}
              className="flex-grow relative overflow-hidden bg-[#1E1E1E]"
              style={{ cursor: isPanning || activeTool === 'hand' ? 'grab' : activeTool !== 'select' ? 'crosshair' : 'default' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                  backgroundSize: `${20 * canvasTransform.scale}px ${20 * canvasTransform.scale}px`,
                  backgroundPosition: `${canvasTransform.x}px ${canvasTransform.y}px`
                }}
              />

              <svg className="w-full h-full absolute inset-0">
                <g transform={`matrix(${canvasTransform.scale}, 0, 0, ${canvasTransform.scale}, ${canvasTransform.x}, ${canvasTransform.y})`}>
                  {elements.map((el) => {
                    if (!el.isVisible) return null;
                    const isSelected = selectedIds.includes(el.id);
                    
                    const props = {
                      x: el.x, y: el.y, width: el.width, height: el.height,
                      fill: el.fill, fillOpacity: el.fillOpacity / 100,
                      stroke: isSelected && el.type !== 'image' ? '#9cf822' : el.stroke,
                      strokeWidth: isSelected && el.type !== 'image' ? Math.max(2 / canvasTransform.scale, 2) : el.strokeWidth,
                      rx: el.cornerRadius, ry: el.cornerRadius,
                      onPointerDown: (e: any) => handleElementPointerDown(e, el),
                      className: `transition-colors duration-100 ${el.isLocked ? 'pointer-events-none' : ''}`
                    };

                    if (el.type === 'frame') {
                      return (
                        <g key={el.id}>
                          <text x={el.x} y={el.y - 8} fontSize={12 / canvasTransform.scale} fill="#a1a1aa" fontWeight="bold">{el.name}</text>
                          <rect {...props} fill={el.fill} stroke={isSelected ? '#9cf822' : '#27272a'} />
                        </g>
                      );
                    } else if (el.type === 'rectangle') {
                      return <rect key={el.id} {...props} />;
                    } else if (el.type === 'image' && el.imageUrl) {
                      return <image key={el.id} href={el.imageUrl} x={el.x} y={el.y} width={el.width} height={el.height} preserveAspectRatio="none" onPointerDown={(e: any) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''} />;
                    } else if (el.type === 'ellipse') {
                      return <ellipse key={el.id} {...props} cx={el.x + el.width/2} cy={el.y + el.height/2} rx={el.width/2} ry={el.height/2} />;
                    } else if (el.type === 'text') {
                      // Note: y + fontSize to properly align baseline within bounding box visually
                      return (
                        <text key={el.id} x={el.x} y={el.y + (el.fontSize || 24)} fill={el.fill} fontSize={el.fontSize} fontFamily="Inter, sans-serif" onPointerDown={(e) => handleElementPointerDown(e, el)} className="select-none cursor-default">
                          {el.text}
                        </text>
                      );
                    }
                    return null;
                  })}

                  {/* INTERACTIVE BOUNDING BOX WITH RESIZE HANDLES */}
                  {selectedElement && activeTool === 'select' && !selectedElement.isLocked && (
                    <g>
                      <rect x={selectedElement.x} y={selectedElement.y} width={selectedElement.width} height={selectedElement.height} fill="none" stroke="#9cf822" strokeWidth={1.5 / canvasTransform.scale} pointerEvents="none" />
                      
                      {/* Corner Handles */}
                      <rect onPointerDown={(e) => handleResizeHandleDown(e, 'nw')} x={selectedElement.x - 4/canvasTransform.scale} y={selectedElement.y - 4/canvasTransform.scale} width={8/canvasTransform.scale} height={8/canvasTransform.scale} fill="white" stroke="#9cf822" strokeWidth={1.5/canvasTransform.scale} className="cursor-nwse-resize" />
                      <rect onPointerDown={(e) => handleResizeHandleDown(e, 'ne')} x={selectedElement.x + selectedElement.width - 4/canvasTransform.scale} y={selectedElement.y - 4/canvasTransform.scale} width={8/canvasTransform.scale} height={8/canvasTransform.scale} fill="white" stroke="#9cf822" strokeWidth={1.5/canvasTransform.scale} className="cursor-nesw-resize" />
                      <rect onPointerDown={(e) => handleResizeHandleDown(e, 'sw')} x={selectedElement.x - 4/canvasTransform.scale} y={selectedElement.y + selectedElement.height - 4/canvasTransform.scale} width={8/canvasTransform.scale} height={8/canvasTransform.scale} fill="white" stroke="#9cf822" strokeWidth={1.5/canvasTransform.scale} className="cursor-nesw-resize" />
                      <rect onPointerDown={(e) => handleResizeHandleDown(e, 'se')} x={selectedElement.x + selectedElement.width - 4/canvasTransform.scale} y={selectedElement.y + selectedElement.height - 4/canvasTransform.scale} width={8/canvasTransform.scale} height={8/canvasTransform.scale} fill="white" stroke="#9cf822" strokeWidth={1.5/canvasTransform.scale} className="cursor-nwse-resize" />
                    </g>
                  )}
                </g>
              </svg>
            </main>

            {/* RIGHT PANEL: ADVANCED INSPECTOR */}
            <aside className="w-[260px] bg-[#2C2C2C] border-l border-[#404040] flex flex-col z-20 shrink-0 overflow-y-auto">
              {selectedElement ? (
                <div className="divide-y divide-[#404040]">
                  
                  {/* Layer Arrangement Tools */}
                  <div className="p-4 flex items-center justify-between text-zinc-400">
                    <button onClick={bringToFront} className="p-1.5 hover:bg-[#404040] hover:text-white rounded flex items-center gap-1 text-[10px] font-bold uppercase"><BringToFront size={14}/> Front</button>
                    <button onClick={sendToBack} className="p-1.5 hover:bg-[#404040] hover:text-white rounded flex items-center gap-1 text-[10px] font-bold uppercase"><SendToBack size={14}/> Back</button>
                  </div>

                  <div className="p-4 grid grid-cols-2 gap-3">
                    <InspectorInput label="X" value={Math.round(selectedElement.x)} onChange={(v: string) => updateSelected({ x: Number(v) })} />
                    <InspectorInput label="Y" value={Math.round(selectedElement.y)} onChange={(v: string) => updateSelected({ y: Number(v) })} />
                    <InspectorInput label="W" value={Math.round(selectedElement.width)} onChange={(v: string) => updateSelected({ width: Math.max(1, Number(v)) })} />
                    <InspectorInput label="H" value={Math.round(selectedElement.height)} onChange={(v: string) => updateSelected({ height: Math.max(1, Number(v)) })} />
                    <InspectorInput label="∠" value={0} onChange={(v: string) => {}} />
                    <InspectorInput label="R" value={selectedElement.cornerRadius} onChange={(v: string) => updateSelected({ cornerRadius: Number(v) })} />
                  </div>

                  {selectedElement.type === 'text' && (
                    <div className="p-4 space-y-3">
                      <div className="text-xs font-bold text-white mb-2">Text</div>
                      <input type="text" value={selectedElement.text} onChange={(e) => updateSelected({ text: e.target.value })} className="w-full bg-[#1E1E1E] border border-[#404040] rounded px-2 py-1.5 text-xs text-white focus:border-[#9cf822] outline-none" />
                      <div className="grid grid-cols-2 gap-3">
                        <InspectorInput label="Size" value={Math.round(selectedElement.fontSize || 16)} onChange={(v: string) => updateSelected({ fontSize: Number(v) })} />
                      </div>
                    </div>
                  )}

                  {selectedElement.type !== 'image' && (
                    <div className="p-4">
                      <div className="text-xs font-bold text-white mb-3 flex items-center justify-between">
                        Fill <button className="hover:text-[#9cf822]"><Plus size={14} /></button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded border border-[#404040] cursor-pointer" style={{ backgroundColor: selectedElement.fill }} />
                        <input type="text" value={selectedElement.fill.toUpperCase()} onChange={(e) => updateSelected({ fill: e.target.value })} className="flex-1 bg-transparent border-none text-xs text-white uppercase outline-none font-mono" />
                        <input type="number" value={selectedElement.fillOpacity} onChange={(e) => updateSelected({ fillOpacity: Number(e.target.value) })} className="w-12 bg-transparent border-none text-xs text-white outline-none text-right font-mono" />%
                      </div>
                    </div>
                  )}
                  
                  {selectedElement.type !== 'image' && (
                    <div className="p-4">
                      <div className="text-xs font-bold text-white mb-3 flex items-center justify-between">
                        Stroke <button className="hover:text-[#9cf822]"><Plus size={14} /></button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded border border-[#404040] cursor-pointer" style={{ backgroundColor: selectedElement.stroke === 'transparent' ? '#000' : selectedElement.stroke }} />
                        <input type="text" value={selectedElement.stroke === 'transparent' ? 'NONE' : selectedElement.stroke.toUpperCase()} onChange={(e) => updateSelected({ stroke: e.target.value })} className="flex-1 bg-transparent border-none text-xs text-white uppercase outline-none font-mono" />
                        <input type="number" value={selectedElement.strokeWidth} onChange={(e) => updateSelected({ strokeWidth: Number(e.target.value) })} className="w-12 bg-transparent border-none text-xs text-white outline-none text-right font-mono" />
                      </div>
                    </div>
                  )}

                  <div className="p-4 pt-6">
                    <button onClick={() => setElements(elements.filter(el => el.id !== selectedElement.id))} className="w-full py-2 border border-red-500/30 text-xs font-bold text-red-500 rounded hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>

                </div>
              ) : (
                <div className="p-6 flex flex-col items-center justify-center h-full text-center text-zinc-500">
                  <div className="w-full h-32 bg-[#1E1E1E] rounded-lg border border-[#404040] mb-4" />
                  <p className="text-xs font-medium">Select a layer to view and edit its properties.</p>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SLIDE-OVER CHAT */}
      {/* ------------------------------------------------------------------ */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[10000] flex justify-end bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md bg-white dark:bg-[#0a0a0a] h-full shadow-2xl flex flex-col relative animate-in slide-in-from-right duration-300 border-l border-zinc-200 dark:border-zinc-900">
            <ChatWallpaper />
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-900 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md relative z-20">
              <div>
                <h3 className="text-sm font-bold text-black dark:text-white flex items-center gap-2"><Zap size={16} className="text-[#9cf822] fill-[#9cf822]" /> Team Sync</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{team.length + 1} Members</p>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-2 text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 rounded-full transition-colors"><X size={16} /></button>
            </div>
            {pinnedMessage && (
               <div className="px-6 py-3 bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 relative z-10 shadow-sm">
                 <div className="flex items-center gap-3 overflow-hidden">
                   <Pin size={14} className="text-[#9cf822] fill-[#9cf822]/20 shrink-0" />
                   <div className="flex-1 min-w-0">
                     <p className="text-[10px] font-bold text-black dark:text-white truncate">Pinned by Lead</p>
                     <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate mt-0.5">{pinnedMessage.content || 'Attached a file'}</p>
                   </div>
                 </div>
               </div>
            )}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                   <MessageSquare size={48} className="text-zinc-300 dark:text-zinc-700 mb-4" strokeWidth={1} />
                   <p className="text-sm font-medium text-black dark:text-white">Workspace initialized.</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.user_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex gap-3 max-w-[85%] group ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-100 dark:border-zinc-900">
                        {msg.profiles?.avatar_url ? <img src={msg.profiles.avatar_url} className="w-full h-full object-cover" alt="User" /> : <User size={14} className="m-auto mt-2 text-zinc-500" />}
                      </div>
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} relative`}>
                        <div className={`p-4 rounded-2xl text-sm mt-1 ${isMe ? 'bg-[#9cf822] text-black rounded-tr-sm' : 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white rounded-tl-sm border border-zinc-200 dark:border-zinc-800'}`}>
                          {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                          {msg.attachment_url && (
                             <div className="mt-2">
                               {msg.attachment_type === 'image' ? <img src={msg.attachment_url} className="w-full max-w-[200px] rounded-xl cursor-pointer hover:opacity-90" onClick={() => setSelectedMedia(msg.attachment_url)} alt="Attachment" /> : <a href={msg.attachment_url} target="_blank" className="font-bold underline text-xs">Download File</a>}
                             </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-[#0a0a0a] border-t border-zinc-200 dark:border-zinc-900 relative z-10">
              <div className="flex items-end gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 focus-within:border-[#9cf822] transition-colors">
                <input type="file" ref={chatFileInputRef} onChange={(e) => { if(e.target.files) setPendingAttachment(e.target.files[0]) }} className="hidden" />
                <button type="button" onClick={() => chatFileInputRef.current?.click()} className="p-3 text-zinc-400 hover:text-black dark:hover:text-white"><Paperclip size={18} /></button>
                <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-transparent text-sm text-black dark:text-white p-3 max-h-32 min-h-[44px] resize-none outline-none" />
                <button type="submit" disabled={isSending || (!newMessage.trim() && !pendingAttachment) || isChatUploading} className="p-3 bg-black text-white dark:bg-white dark:text-black rounded-xl disabled:opacity-50"><Send size={18} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedMedia && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4">
           <button onClick={() => setSelectedMedia(null)} className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full"><X size={24} /></button>
           <img src={selectedMedia} className="max-w-full max-h-full object-contain rounded-lg" alt="Expanded Media" />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MOBILE WARNING MODAL */}
      {/* ------------------------------------------------------------------ */}
      {showMobileWarning && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center relative">
            <div className="w-12 h-12 bg-[#9cf822]/20 text-[#5a9a00] dark:text-[#9cf822] rounded-full flex items-center justify-center mx-auto mb-4">
              <MonitorSmartphone size={24} />
            </div>
            <h3 className="text-lg font-bold text-black dark:text-white mb-2">Desktop Recommended</h3>
            <p className="text-sm text-zinc-500 mb-6">
              The Co-Lab design workspace requires a larger screen for the best experience. Please switch to a desktop or laptop to access this feature.
            </p>
            <button 
              onClick={() => setShowMobileWarning(false)}
              className="w-full py-3 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// --- Helper Components ---
function ToolButton({ icon, active, onClick, tooltip }: any) {
  return (
    <div className="relative group flex items-center justify-center">
      <button onClick={onClick} className={`p-1.5 rounded-md transition-all ${active ? 'bg-[#404040] text-white' : 'text-zinc-400 hover:text-white hover:bg-[#2C2C2C]'}`}>
        {icon}
      </button>
      <div className="absolute top-full mt-2 px-2 py-1 bg-black text-white text-[10px] font-bold rounded opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none whitespace-nowrap z-50">
        {tooltip}
      </div>
    </div>
  );
}

function InspectorInput({ label, value, onChange }: any) {
  return (
    <div className="flex items-center gap-2 bg-[#1E1E1E] border border-[#404040] rounded px-2 py-1.5 focus-within:border-[#9cf822] transition-colors">
      <span className="text-[10px] text-zinc-500 font-bold w-3">{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent border-none text-xs text-white outline-none font-mono" />
    </div>
  );
}