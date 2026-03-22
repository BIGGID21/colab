'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useTheme } from 'next-themes';
import { 
  Loader2, ArrowLeft, Users, Target, Zap, 
  MessageSquare, Layout, Shield, FileText, 
  CheckCircle2, Circle, Clock, Plus, 
  X, Send, User, Compass, TrendingUp, 
  Briefcase, Code, PencilRuler, Upload, 
  Wallet, Lock, DollarSign, CreditCard,
  Trash2, Maximize, Minimize,
  ShieldCheck, Image as ImageIcon,
  Paperclip, Pin, MousePointer2, Square, 
  Type, PenTool, LayoutDashboard, Layers, 
  Eye, EyeOff, Lock as LockIcon, Unlock,
  Type as TypeIcon, Hand, ImagePlus, Save,
  BringToFront, SendToBack, MonitorSmartphone,
  Pipette, MoveUp, MoveDown, Scissors,
  Unlink, Link2, Monitor, Smartphone, LayoutGrid, Home
} from 'lucide-react';
import Link from 'next/link';

// ----------------------------------------------------------------------
// TYPES
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
  strokeDasharray?: string;
  cornerRadius: number;
  text?: string;
  fontSize?: number;
  imageUrl?: string;
  isVisible: boolean;
  isLocked: boolean;
  groupId?: string;
  clipMaskId?: string;
  isMask?: boolean;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'colab'>('overview');
  const [colabView, setColabView] = useState<'home' | 'canvas'>('home');
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
  const [dragState, setDragState] = useState<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const colorPresets = ['#000000', '#ffffff', '#9cf822', '#ff4d4d', '#4d94ff', '#ffbe0b', '#7209b7', '#4895ef'];

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(pattern);
  };

  // --- SCREEN SIZE DETECTION ---
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 1024);
    checkScreenSize();
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

      if (projectData.canvas_data && Array.isArray(projectData.canvas_data) && projectData.canvas_data.length > 0) {
        setElements(projectData.canvas_data);
      } else {
        setElements([]);
      }

      setProject(projectData);
      setTeam(collaborators || []);
      setMilestones(milestoneData || []);
      setMessages(msgData || []);
      setLoading(false);
    }
    fetchWorkspaceData();
  }, [projectId, supabase, router]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'colab' || colabView !== 'canvas' || ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'v') setActiveTool('select');
      if (e.key === 'r') setActiveTool('rectangle');
      if (e.key === 'o') setActiveTool('ellipse');
      if (e.key === 't') setActiveTool('text');
      if (e.key === 'h') setActiveTool('hand');
      
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSaveDesign(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') { e.preventDefault(); handleGroup(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'g') { e.preventDefault(); handleUngroup(); }
      
      if (e.key === '[') sendToBack();
      if (e.key === ']') bringToFront();
      if (e.key === 'Backspace' || e.key === 'Delete') {
        setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, colabView, selectedIds, elements]);

  // --- ADVANCED ACTIONS (Group & Mask) ---
  const handleGroup = () => {
    if (selectedIds.length < 2) return;
    const newGroupId = `group_${Date.now()}`;
    setElements(elements.map(el => selectedIds.includes(el.id) ? { ...el, groupId: newGroupId } : el));
  };

  const handleUngroup = () => {
    if (!selectedIds.length) return;
    setElements(elements.map(el => selectedIds.includes(el.id) ? { ...el, groupId: undefined } : el));
  };

  const handleMakeMask = () => {
    if (selectedIds.length < 2) return;
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    const maskEl = selectedElements[0]; 
    setElements(elements.map(el => {
      if (el.id === maskEl.id) return { ...el, isMask: true };
      if (selectedIds.includes(el.id)) return { ...el, clipMaskId: maskEl.id };
      return el;
    }));
  };

  const handleReleaseMask = () => {
    setElements(elements.map(el => {
      if (selectedIds.includes(el.id)) {
        if (el.isMask) return { ...el, isMask: false };
        if (el.clipMaskId) return { ...el, clipMaskId: undefined };
      }
      return el;
    }));
  };

  // --- TEMPLATE STARTER ---
  const startWithTemplate = (name: string, w: number, h: number) => {
    const newId = `el_${Date.now()}`;
    const newFrame: CanvasElement = {
      id: newId, name: name, type: 'frame', x: 100, y: 100, width: w, height: h, 
      fill: '#ffffff', fillOpacity: 100, stroke: '#e4e4e7', strokeWidth: 1, 
      cornerRadius: 0, isVisible: true, isLocked: false
    };
    setElements([...elements, newFrame]);
    setColabView('canvas');
  };

  // --- CANVAS ENGINE ---
  const getCanvasCoords = (e: any) => {
    if (!containerRef.current) return {x: 0, y: 0};
    const rect = containerRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left - canvasTransform.x) / canvasTransform.scale, y: (e.clientY - rect.top - canvasTransform.y) / canvasTransform.scale };
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || colabView !== 'canvas') return;

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
  }, [canvasTransform, colabView]);


  const handlePointerDown = (e: React.PointerEvent) => {
    if (isPanning || activeTool === 'hand' || e.button === 1) {
      setDragState({ action: 'panning', startX: e.clientX, startY: e.clientY });
      return;
    }
    const { x, y } = getCanvasCoords(e);
    if (activeTool === 'select' && (e.target as HTMLElement).tagName === 'svg') {
      setSelectedIds([]);
    } else if (activeTool !== 'select' && activeTool !== 'image') {
      const newId = `el_${Date.now()}`;
      setElements([...elements, { id: newId, name: activeTool.charAt(0).toUpperCase() + activeTool.slice(1), type: activeTool as any, x, y, width: 100, height: 100, fill: '#d4d4d8', fillOpacity: 100, stroke: 'transparent', strokeWidth: 0, cornerRadius: 0, isVisible: true, isLocked: false, text: activeTool === 'text' ? 'New Text' : undefined, fontSize: activeTool === 'text' ? 24 : undefined }]);
      setSelectedIds([newId]);
      setActiveTool('select');
    }
  };

  const handleElementPointerDown = (e: React.PointerEvent, el: CanvasElement) => {
    if (activeTool !== 'select' || isPanning || el.isLocked || !el.isVisible) return;
    e.stopPropagation();
    
    const groupIdsToSelect = el.groupId ? elements.filter(e => e.groupId === el.groupId).map(e => e.id) : [el.id];
    let newSelection = [...selectedIds];
    
    if (e.shiftKey) {
      const isAlreadySelected = groupIdsToSelect.every(id => selectedIds.includes(id));
      if (isAlreadySelected) {
        newSelection = selectedIds.filter(id => !groupIdsToSelect.includes(id));
      } else {
        newSelection = Array.from(new Set([...selectedIds, ...groupIdsToSelect]));
      }
    } else {
      if (!selectedIds.includes(el.id)) newSelection = groupIdsToSelect;
    }
    
    setSelectedIds(newSelection);
    const { x, y } = getCanvasCoords(e);
    setDragState({ action: 'moving', startX: x, startY: y, originalElements: elements });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;

    if (activeTool === 'hand' || dragState.action === 'panning') {
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
      setElements(dragState.originalElements.map((el: CanvasElement) => selectedIds.includes(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el));
    } 
    else if (dragState.action === 'resizing' && dragState.handle) {
      const dx = x - dragState.startX;
      const dy = y - dragState.startY;
      
      setElements(dragState.originalElements.map((el: CanvasElement) => {
        if (!selectedIds.includes(el.id)) return el;
        let newX = el.x, newY = el.y, newW = el.width, newH = el.height;
        const handle = dragState.handle!;

        if (handle.includes('e')) newW = Math.max(10, el.width + dx);
        if (handle.includes('s')) newH = Math.max(10, el.height + dy);
        if (handle.includes('w')) { newW = Math.max(10, el.width - dx); if (newW > 10) newX = el.x + dx; }
        if (handle.includes('n')) { newH = Math.max(10, el.height - dy); if (newH > 10) newY = el.y + dy; }

        let newFontSize = el.fontSize;
        if (el.type === 'text' && el.fontSize && el.height) newFontSize = Math.max(8, el.fontSize * (newH / el.height));
        return { ...el, x: newX, y: newY, width: newW, height: newH, fontSize: newFontSize };
      }));
    }
  };

  const handlePointerUp = () => setDragState(null);

  const handleResizeHandleDown = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    const { x, y } = getCanvasCoords(e);
    setDragState({ action: 'resizing', handle, startX: x, startY: y, originalElements: elements });
  };

  const handleSaveDesign = async () => {
    setIsSaving(true);
    await supabase.from('projects').update({ canvas_data: elements }).eq('id', projectId);
    setIsSaving(false);
  };

  const bringToFront = () => {
    const unselected = elements.filter(el => !selectedIds.includes(el.id));
    const selected = elements.filter(el => selectedIds.includes(el.id));
    setElements([...unselected, ...selected]);
  };

  const sendToBack = () => {
    const unselected = elements.filter(el => !selectedIds.includes(el.id));
    const selected = elements.filter(el => selectedIds.includes(el.id));
    setElements([...selected, ...unselected]);
  };

  const getSelectionBounds = () => {
    if (selectedIds.length === 0) return null;
    const selectedEls = elements.filter(el => selectedIds.includes(el.id));
    const minX = Math.min(...selectedEls.map(el => el.x));
    const minY = Math.min(...selectedEls.map(el => el.y));
    const maxX = Math.max(...selectedEls.map(el => el.x + el.width));
    const maxY = Math.max(...selectedEls.map(el => el.y + el.height));
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  // --- OVERVIEW / MISC HANDLERS ---
  const handleToggleMilestone = async (m: any) => {
    if (!isFounder) return; 
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
        key: paystackKey, email: user.email || 'founder@labx.com', amount: finalAmountInKobo, currency: 'NGN',
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
        key: paystackKey, email: user.email || 'founder@labx.com', amount: finalAmountInKobo, currency: 'NGN',
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
      await supabase.from('messages').insert({ project_id: projectId, user_id: user.id, content: newMessage.trim(), attachment_url: attachmentUrl, attachment_type: pendingAttachment?.type.includes('image') ? 'image' : pendingAttachment ? 'document' : null, attachment_name: pendingAttachment?.name });
      setNewMessage(''); setPendingAttachment(null);
      if (chatFileInputRef.current) chatFileInputRef.current.value = '';
    } finally {
      setIsSending(false); setIsChatUploading(false);
    }
  };

  // ----------------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------------
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black"><Loader2 className="animate-spin text-[#9cf822]" /></div>;

  const totalBudget = project?.budget || project?.valuation || 0;
  const currencySymbol = getCurrencySymbol(project?.currency);
  const displayImage = project?.cover_image_url || project?.image_url;
  const completedMilestones = milestones?.filter(m => m.status === 'completed').length || 0;
  const progressPercentage = milestones?.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;
  const pinnedMessage = messages.find((m: any) => m.is_pinned === true);

  const bounds = getSelectionBounds();
  const isMultiSelect = selectedIds.length > 1;
  const singleSelectedElement = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null;

  return (
    <div className={`transition-colors duration-300 flex flex-col font-sans ${isFullscreen ? 'fixed inset-0 z-[9999] bg-[#1E1E1E]' : 'min-h-screen'} ${activeTab === 'colab' ? 'bg-[#121212] text-zinc-300 selection:bg-[#9cf822]/30 overflow-hidden' : 'bg-zinc-50 dark:bg-black text-left pb-20 relative'}`}>
      
      {/* ------------------------------------------------------------------ */}
      {/* HEADER (OVERVIEW vs CANVAS) */}
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
              
              <button 
                onClick={() => {
                  if (isMobile) {
                    setShowMobileWarning(true);
                  } else {
                    setActiveTab('colab');
                    setColabView('home'); 
                  }
                }} 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all text-zinc-500 hover:text-[#9cf822]"
              >
                <img src="/lab x.svg" className="w-4 h-4" alt="Lab X" /> Lab X
              </button>
            </div>
            
            <button onClick={() => setIsChatOpen(true)} className="hidden sm:flex px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-black/10 dark:shadow-white/10 items-center gap-2">
              <MessageSquare size={16} /> Team Sync
            </button>
          </div>
        </header>
      ) : activeTab === 'colab' && colabView === 'canvas' && (
        <header className="h-12 bg-[#1E1E1E] border-b border-[#2C2C2C] flex items-center justify-between px-4 shrink-0 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setColabView('home')} className="p-1.5 hover:bg-[#2C2C2C] rounded-md transition-colors text-zinc-400 hover:text-white" title="Back to Home">
              <Home size={16} />
            </button>
            <div className="h-4 w-px bg-[#2C2C2C]" />
            <div className="text-sm font-medium text-white flex items-center gap-2">
              {project?.title} <span className="bg-[#2C2C2C] text-[#9cf822] text-[10px] px-2 py-0.5 rounded font-bold tracking-widest uppercase">Canvas</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-lg border border-[#2C2C2C]">
            <ToolBtn icon={<MousePointer2 size={16}/>} active={activeTool === 'select'} onClick={() => setActiveTool('select')} tip="Select (V)" />
            <ToolBtn icon={<Hand size={16}/>} active={activeTool === 'hand'} onClick={() => setActiveTool('hand')} tip="Hand (H)" />
            <div className="w-px h-4 bg-[#2C2C2C] mx-1"></div>
            <ToolBtn icon={<Square size={16}/>} active={activeTool === 'rectangle'} onClick={() => setActiveTool('rectangle')} tip="Rectangle (R)" />
            <ToolBtn icon={<Circle size={16}/>} active={activeTool === 'ellipse'} onClick={() => setActiveTool('ellipse')} tip="Ellipse (O)" />
            <ToolBtn icon={<TypeIcon size={16}/>} active={activeTool === 'text'} onClick={() => setActiveTool('text')} tip="Text (T)" />
            <ToolBtn icon={<ImagePlus size={16}/>} onClick={() => { setActiveTool('image'); imageUploadRef.current?.click(); }} tip="Image" />
            <input type="file" ref={imageUploadRef} className="hidden" accept="image/*" onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  if (ev.target?.result) {
                    const newId = `el_${Date.now()}`;
                    setElements([...elements, { id: newId, name: 'Image', type: 'image', x: -canvasTransform.x / canvasTransform.scale + 100, y: -canvasTransform.y / canvasTransform.scale + 100, width: 300, height: 300, fill: 'transparent', fillOpacity: 100, stroke: 'transparent', strokeWidth: 0, cornerRadius: 0, isVisible: true, isLocked: false, imageUrl: ev.target.result as string }]);
                    setSelectedIds([newId]);
                    setActiveTool('select');
                  }
                };
                reader.readAsDataURL(e.target.files[0]);
              }
            }} />
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 text-zinc-400 hover:text-white rounded-md transition-colors" title="Toggle Fullscreen">
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
            <div className="w-px h-4 bg-[#2C2C2C]"></div>
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
                     <p className="text-sm text-zinc-500 mt-1">Overview loaded. Switch to Lab X to design.</p>
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

        {/* ================= CO-LAB HOME (ILLUSTRATOR VIBE) ================= */}
        {activeTab === 'colab' && colabView === 'home' && (
          <div className="flex-grow flex bg-[#121212] text-zinc-300 relative h-full">
            
            {/* Sidebar */}
            <div className="w-64 bg-[#18181b] border-r border-[#27272a] flex flex-col p-6 hidden md:flex shrink-0">
              <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => setActiveTab('overview')}>
                <img src="/lab x.svg" className="w-8 h-8 hover:opacity-80 transition-opacity" alt="Lab X" />
                <span className="font-bold text-white tracking-widest text-sm uppercase">Lab X</span>
              </div>
              <div className="space-y-1">
                 <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#27272a] text-white rounded-lg text-sm font-medium"><Home size={16}/> Home</button>
                 <button className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:text-white hover:bg-[#27272a]/50 rounded-lg text-sm font-medium transition-colors"><Clock size={16}/> Recent</button>
                 <button className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:text-white hover:bg-[#27272a]/50 rounded-lg text-sm font-medium transition-colors"><Users size={16}/> Shared with you</button>
              </div>
              
              <div className="mt-auto">
                <button onClick={() => setActiveTab('overview')} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-[#27272a] text-zinc-400 hover:text-white hover:bg-[#27272a]/50 rounded-lg text-sm font-medium transition-colors">
                  <ArrowLeft size={16}/> Exit to Overview
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow p-8 md:p-12 overflow-y-auto">
              <div className="max-w-6xl mx-auto space-y-16">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                   <h1 className="text-3xl font-semibold text-white tracking-tight">Let's create something.</h1>
                   <button onClick={() => setColabView('canvas')} className="px-5 py-2.5 bg-[#9cf822] text-black font-bold rounded-lg text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(156,248,34,0.15)]"><Plus size={16}/> New Canvas</button>
                </div>

                {/* Templates Grid */}
                <div>
                   <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Start a new design</h2>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <TemplateCard name="Web Large" size="1440 x 1024 px" icon={<Monitor size={28} strokeWidth={1.5}/>} onClick={() => startWithTemplate('Web Large', 1440, 1024)} />
                      <TemplateCard name="iPhone 14 Pro" size="390 x 844 px" icon={<Smartphone size={28} strokeWidth={1.5}/>} onClick={() => startWithTemplate('iPhone 14 Pro', 390, 844)} />
                      <TemplateCard name="Instagram Post" size="1080 x 1080 px" icon={<LayoutGrid size={28} strokeWidth={1.5}/>} onClick={() => startWithTemplate('Instagram Post', 1080, 1080)} />
                      <TemplateCard name="Blank Canvas" size="Infinite" icon={<Square size={28} strokeWidth={1.5}/>} onClick={() => setColabView('canvas')} />
                   </div>
                </div>

                {/* Recent Workspace */}
                <div>
                   <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Current Workspace</h2>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     <div onClick={() => setColabView('canvas')} className="group cursor-pointer">
                        <div className="h-52 bg-[#18181b] border border-[#27272a] group-hover:border-[#9cf822] transition-colors rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
                           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                           <img src="/lab x.svg" className="w-12 h-12 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 relative z-10" alt="Icon" />
                        </div>
                        <div className="flex items-start justify-between px-1">
                           <div>
                             <h3 className="text-white font-medium text-sm">{project?.title || 'Untitled'} Canvas</h3>
                             <p className="text-xs text-zinc-500 mt-1">{elements.length} layers • Edited recently</p>
                           </div>
                        </div>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= CO-LAB CANVAS EDITOR ================= */}
        {activeTab === 'colab' && colabView === 'canvas' && (
          <div className="flex-grow flex relative overflow-hidden">
            
            {/* LEFT PANEL: LAYERS */}
            <aside className="w-[240px] bg-[#18181b] border-r border-[#27272a] flex flex-col z-20 shrink-0">
              <div className="px-4 py-3 border-b border-[#27272a] flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Layers size={14} /> Layers
              </div>
              <div className="flex-grow overflow-y-auto p-2 space-y-0.5">
                {[...elements].reverse().map(el => (
                  <div 
                    key={el.id} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTool('select');
                      if (e.shiftKey) {
                        setSelectedIds(Array.from(new Set([...selectedIds, el.id])));
                      } else {
                        setSelectedIds([el.id]);
                      }
                    }} 
                    className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer group ${selectedIds.includes(el.id) ? 'bg-[#9cf822]/10 text-[#9cf822] font-medium' : 'text-zinc-400 hover:bg-[#27272a] hover:text-zinc-200'}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {el.isMask ? <Scissors size={12} className="text-[#9cf822]" /> : el.type === 'text' ? <TypeIcon size={12}/> : el.type === 'image' ? <ImageIcon size={12}/> : el.type === 'frame' ? <Layout size={12}/> : <Square size={12}/>}
                      <span className="truncate flex-grow">{el.name} {el.groupId && <span className="opacity-50 ml-1 text-[9px]">(Grouped)</span>}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setElements(elements.map(item => item.id === el.id ? {...item, isVisible: !item.isVisible} : item)) }} className="p-1 hover:text-white">
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
              className="flex-grow bg-[#121212] relative cursor-crosshair overflow-hidden"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: `${20 * canvasTransform.scale}px ${20 * canvasTransform.scale}px`, backgroundPosition: `${canvasTransform.x}px ${canvasTransform.y}px` }} />

              <svg className="w-full h-full absolute inset-0">
                <defs>
                  {elements.filter(e => e.isMask).map(maskEl => (
                    <clipPath id={`clip_${maskEl.id}`} key={`clip_${maskEl.id}`}>
                       {maskEl.type === 'rectangle' && <rect x={maskEl.x} y={maskEl.y} width={maskEl.width} height={maskEl.height} rx={maskEl.cornerRadius} />}
                       {maskEl.type === 'ellipse' && <ellipse cx={maskEl.x + maskEl.width/2} cy={maskEl.y + maskEl.height/2} rx={maskEl.width/2} ry={maskEl.height/2} />}
                    </clipPath>
                  ))}
                </defs>

                <g transform={`matrix(${canvasTransform.scale}, 0, 0, ${canvasTransform.scale}, ${canvasTransform.x}, ${canvasTransform.y})`}>
                  {elements.map(el => {
                    if (!el.isVisible) return null;
                    const isSelected = selectedIds.includes(el.id);
                    
                    return (
                      <g key={el.id} opacity={el.fillOpacity / 100} clipPath={el.clipMaskId ? `url(#clip_${el.clipMaskId})` : undefined}>
                        {el.type === 'frame' && (
                          <g>
                            <text x={el.x} y={el.y - 8} fontSize={12 / canvasTransform.scale} fill="#71717a" fontWeight="bold">{el.name}</text>
                            <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill} stroke={isSelected ? '#9cf822' : '#27272a'} strokeWidth={isSelected ? 2/canvasTransform.scale : 1} onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''}/>
                          </g>
                        )}
                        {el.type === 'rectangle' && <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill} rx={el.cornerRadius} stroke={el.stroke} strokeWidth={el.strokeWidth} strokeDasharray={el.strokeDasharray} onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''}/>}
                        {el.type === 'ellipse' && <ellipse cx={el.x + el.width/2} cy={el.y + el.height/2} rx={el.width/2} ry={el.height/2} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} strokeDasharray={el.strokeDasharray} onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''} />}
                        {el.type === 'text' && <text x={el.x} y={el.y + (el.fontSize || 24)} fill={el.fill} fontSize={el.fontSize} fontFamily="Inter, sans-serif" onPointerDown={(e) => handleElementPointerDown(e, el)} className="select-none cursor-default">{el.text}</text>}
                        {el.type === 'image' && el.imageUrl && <image href={el.imageUrl} x={el.x} y={el.y} width={el.width} height={el.height} preserveAspectRatio="none" onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''} />}
                      </g>
                    );
                  })}

                  {/* BOUNDING BOX */}
                  {bounds && activeTool === 'select' && (
                    <g>
                      <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill="none" stroke="#9cf822" strokeWidth={1.5 / canvasTransform.scale} pointerEvents="none" />
                      {!isMultiSelect && (
                        <>
                          <rect onPointerDown={(e) => handleResizeHandleDown(e, 'nw')} x={bounds.x - 4/canvasTransform.scale} y={bounds.y - 4/canvasTransform.scale} width={8/canvasTransform.scale} height={8/canvasTransform.scale} fill="white" stroke="#9cf822" strokeWidth={1.5/canvasTransform.scale} className="cursor-nwse-resize" />
                          <rect onPointerDown={(e) => handleResizeHandleDown(e, 'ne')} x={bounds.x + bounds.width - 4/canvasTransform.scale} y={bounds.y - 4/canvasTransform.scale} width={8/canvasTransform.scale} height={8/canvasTransform.scale} fill="white" stroke="#9cf822" strokeWidth={1.5/canvasTransform.scale} className="cursor-nesw-resize" />
                          <rect onPointerDown={(e) => handleResizeHandleDown(e, 'sw')} x={bounds.x - 4/canvasTransform.scale} y={bounds.y + bounds.height - 4/canvasTransform.scale} width={8/canvasTransform.scale} height={8/canvasTransform.scale} fill="white" stroke="#9cf822" strokeWidth={1.5/canvasTransform.scale} className="cursor-nesw-resize" />
                          <rect onPointerDown={(e) => handleResizeHandleDown(e, 'se')} x={bounds.x + bounds.width - 4/canvasTransform.scale} y={bounds.y + bounds.height - 4/canvasTransform.scale} width={8/canvasTransform.scale} height={8/canvasTransform.scale} fill="white" stroke="#9cf822" strokeWidth={1.5/canvasTransform.scale} className="cursor-nwse-resize" />
                        </>
                      )}
                    </g>
                  )}
                </g>
              </svg>
            </main>

            {/* RIGHT PANEL: INSPECTOR */}
            <aside className="w-[260px] bg-[#18181b] border-l border-[#27272a] overflow-y-auto z-20 shrink-0">
              {isMultiSelect ? (
                <div className="p-5 space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Multiple Selection</div>
                  <p className="text-xs text-zinc-400 mb-4">{selectedIds.length} layers selected.</p>
                  <button onClick={handleGroup} className="w-full py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white rounded text-[10px] font-bold flex items-center justify-center gap-2 transition-colors"><Link2 size={14}/> GROUP SELECTION</button>
                  <button onClick={handleMakeMask} className="w-full py-2 bg-[#9cf822]/10 hover:bg-[#9cf822]/20 text-[#9cf822] border border-[#9cf822]/20 rounded text-[10px] font-bold flex items-center justify-center gap-2 transition-colors"><Scissors size={14}/> MAKE CLIPPING MASK</button>
                  <p className="text-[10px] text-zinc-500 text-center mt-1">Bottom layer will act as the mask.</p>
                  <div className="pt-4 border-t border-[#27272a] space-y-2 mt-4">
                     {elements.some(el => selectedIds.includes(el.id) && el.groupId) && (
                        <button onClick={handleUngroup} className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded text-[10px] font-bold flex items-center justify-center gap-2 transition-colors"><Unlink size={14}/> UNGROUP ALL</button>
                     )}
                     {elements.some(el => selectedIds.includes(el.id) && (el.isMask || el.clipMaskId)) && (
                        <button onClick={handleReleaseMask} className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded text-[10px] font-bold flex items-center justify-center gap-2 transition-colors"><Scissors size={14}/> RELEASE MASKS</button>
                     )}
                  </div>
                </div>
              ) : singleSelectedElement ? (
                <div className="divide-y divide-[#27272a]">
                  <div className="p-5 space-y-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex justify-between items-center">
                      Transform {singleSelectedElement.groupId && <span className="bg-[#27272a] px-1.5 py-0.5 rounded text-[9px] text-white">Grouped</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <InspectorField label="X" value={Math.round(singleSelectedElement.x)} />
                      <InspectorField label="Y" value={Math.round(singleSelectedElement.y)} />
                      <InspectorField label="W" value={Math.round(singleSelectedElement.width)} />
                      <InspectorField label="H" value={Math.round(singleSelectedElement.height)} />
                    </div>
                  </div>

                  {singleSelectedElement.type === 'text' && (
                    <div className="p-5 space-y-3">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Text Properties</div>
                      <input type="text" value={singleSelectedElement.text} onChange={(e) => setElements(elements.map(el => el.id === singleSelectedElement.id ? {...el, text: e.target.value} : el))} className="w-full bg-[#121212] border border-[#27272a] rounded px-3 py-2 text-xs text-white focus:border-[#9cf822] outline-none" />
                    </div>
                  )}

                  {singleSelectedElement.type !== 'image' && (
                    <div className="p-5 space-y-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center justify-between">Fill <Plus size={12}/></div>
                      <div className="flex flex-wrap gap-2">
                        {colorPresets.map(c => (
                          <button key={c} onClick={() => setElements(elements.map(e => e.id === singleSelectedElement.id ? {...e, fill: c} : e))} className="w-6 h-6 rounded-full border border-[#27272a] hover:scale-110 transition-transform" style={{ background: c }} />
                        ))}
                      </div>
                      <div className="flex items-center gap-3 bg-[#121212] p-1.5 rounded-lg border border-[#27272a]">
                         <Pipette size={14} className="text-zinc-500 ml-1" />
                         <input type="text" value={singleSelectedElement.fill.toUpperCase()} onChange={(e) => setElements(elements.map(el => el.id === singleSelectedElement.id ? {...el, fill: e.target.value} : el))} className="bg-transparent text-[11px] font-mono outline-none w-full uppercase text-zinc-300" />
                         <input type="number" value={singleSelectedElement.fillOpacity} onChange={(e) => setElements(elements.map(el => el.id === singleSelectedElement.id ? {...el, fillOpacity: Number(e.target.value)} : el))} className="w-12 bg-transparent text-[11px] font-mono outline-none text-right text-zinc-300 mr-1" />%
                      </div>
                    </div>
                  )}

                  <div className="p-5 space-y-2">
                    <button onClick={bringToFront} className="w-full py-2.5 bg-[#27272a] hover:bg-[#3f3f46] rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 text-white transition-colors"><MoveUp size={12}/> BRING TO FRONT</button>
                    <button onClick={sendToBack} className="w-full py-2.5 bg-[#27272a] hover:bg-[#3f3f46] rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 text-white transition-colors"><MoveDown size={12}/> SEND TO BACK</button>
                    
                    <div className="pt-4 mt-2">
                       <button onClick={() => setElements(elements.filter(el => el.id !== singleSelectedElement.id))} className="w-full py-2 border border-red-500/20 text-xs font-bold text-red-500 rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"><Trash2 size={14} /> Delete Layer</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 p-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#27272a] flex items-center justify-center mb-4"><MousePointer2 size={24} className="text-zinc-500"/></div>
                  <p className="text-xs font-medium">Select a layer to view and edit its properties.</p>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SLIDE-OVER CHAT (Available in Overview Mode) */}
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
            <div className="w-12 h-12 bg-[#9cf822]/20 text-[#5a9a00] dark:text-[#9cf822] rounded-full flex items-center justify-center mx-auto mb-4"><MonitorSmartphone size={24} /></div>
            <h3 className="text-lg font-bold text-black dark:text-white mb-2">Desktop Recommended</h3>
            <p className="text-sm text-zinc-500 mb-6">The Lab X workspace requires a larger screen. Please switch to a desktop or laptop to access this feature.</p>
            <button onClick={() => setShowMobileWarning(false)} className="w-full py-3 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl hover:opacity-90">Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Helper Components ---
function ToolBtn({ icon, active, onClick, tip }: any) {
  return (
    <button onClick={onClick} className={`p-2 rounded-md transition-all group relative ${active ? 'bg-[#9cf822] text-black' : 'text-zinc-400 hover:text-white hover:bg-[#27272a]'}`}>
      {icon}
      <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[9px] text-white font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100]">{tip}</span>
    </button>
  );
}

function InspectorField({ label, value }: any) {
  return (
    <div className="bg-[#121212] border border-[#27272a] rounded-lg p-2 flex items-center gap-2">
      <span className="text-[9px] font-bold text-zinc-600 w-3">{label}</span>
      <input type="text" readOnly value={value} className="bg-transparent text-[11px] font-mono outline-none w-full text-zinc-300" />
    </div>
  );
}

function TemplateCard({ name, size, icon, onClick }: any) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center justify-center p-6 bg-[#18181b] border border-[#27272a] hover:border-[#9cf822] rounded-2xl transition-all duration-300 text-left hover:shadow-[0_0_20px_rgba(156,248,34,0.05)] w-full">
      <div className="h-16 flex items-center justify-center text-zinc-500 group-hover:text-[#9cf822] transition-colors mb-4 group-hover:scale-110 duration-300">
        {icon}
      </div>
      <span className="text-sm font-semibold text-white w-full text-center">{name}</span>
      <span className="text-[10px] font-medium text-zinc-500 w-full text-center mt-1">{size}</span>
    </button>
  );
}