'use client';

import React, { useEffect, useState, useRef, use, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useTheme } from 'next-themes';
import { 
  Loader2, ArrowLeft, Users, Target, Zap, 
  MessageSquare, Layout, Shield, FileText, 
  CheckCircle2, Circle, Clock, Plus, Minus,
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
  Unlink, Link2, Monitor, Smartphone, LayoutGrid, Home,
  AlignLeft, AlignCenter, AlignRight, ChevronDown, MoreHorizontal,
  Grid
} from 'lucide-react';
import Link from 'next/link';

// ----------------------------------------------------------------------
// TYPES & CONFIGURATIONS
// ----------------------------------------------------------------------
type ElementType = 'rectangle' | 'ellipse' | 'text' | 'path' | 'frame' | 'image' | 'arrow';

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
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  imageUrl?: string;
  isVisible: boolean;
  isLocked: boolean;
  groupId?: string;
  clipMaskId?: string;
  isMask?: boolean;
  frameId?: string; 
  startId?: string;
  endId?: string;   
}

interface CursorData {
  x: number;
  y: number;
  name: string;
  color: string;
  lastSeen: number;
}

// DYNAMIC TOOL REGISTRY
const DESIGN_TOOLS = [
  { id: 'select', icon: MousePointer2, tip: 'Move (V)', key: 'v' },
  { id: 'frame', icon: Layout, tip: 'Artboard/Frame (F)', key: 'f' },
  { id: 'rectangle', icon: Square, tip: 'Rectangle (R)', key: 'r' },
  { id: 'ellipse', icon: Circle, tip: 'Ellipse (O)', key: 'o' },
  { id: 'text', icon: TypeIcon, tip: 'Text (T)', key: 't' },
  { id: 'pen', icon: PenTool, tip: 'Pen/Draw (P)', key: 'p' }, 
  { id: 'hand', icon: Hand, tip: 'Hand (H)', key: 'h' }
] as const;

type ToolId = typeof DESIGN_TOOLS[number]['id'] | 'image';

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
  const [homeSidebarView, setHomeSidebarView] = useState<'home' | 'recent' | 'shared'>('home');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  
  // --- Export State ---
  const [exportFormat, setExportFormat] = useState<'PNG' | 'JPG' | 'SVG'>('PNG');
  const [exportScale, setExportScale] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);

  // --- Mobile Constraint State ---
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  // --- Refs ---
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const lastCursorUpdate = useRef(0);

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
  const [appMode, setAppMode] = useState<'design' | 'prototype'>('design'); 
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [past, setPast] = useState<CanvasElement[][]>([]);
  const [future, setFuture] = useState<CanvasElement[][]>([]);
  const [clipboard, setClipboard] = useState<CanvasElement[]>([]);
  const [cursors, setCursors] = useState<Record<string, CursorData>>({});
  
  const [activeTool, setActiveTool] = useState<ToolId>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragState, setDragState] = useState<any>(null);
  const [prototypeDrag, setPrototypeDrag] = useState<{ startId: string, x: number, y: number } | null>(null); 
  const [snapLines, setSnapLines] = useState<Array<{type: 'v'|'h', val: number, start: number, end: number}>>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(pattern);
  };

  const myColor = useMemo(() => {
    if (!user) return '#9cf822';
    let hash = 0;
    for (let i = 0; i < user.id.length; i++) { hash = user.id.charCodeAt(i) + ((hash << 5) - hash); }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  }, [user]);

  // --- REALTIME ENGINE ---
  useEffect(() => {
    if (!projectId || !user) return;
    const channel = supabase.channel(`room-${projectId}`, { config: { broadcast: { ack: false } } });
    channel
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        setCursors(prev => ({ ...prev, [payload.userId]: { x: payload.x, y: payload.y, name: payload.name, color: payload.color, lastSeen: Date.now() } }));
      })
      .on('broadcast', { event: 'update_elements' }, ({ payload }) => { setElements(payload.elements); })
      .subscribe();
    channelRef.current = channel;

    const interval = setInterval(() => {
      const now = Date.now();
      setCursors(prev => {
        let changed = false; const next = { ...prev };
        for (const id in next) { if (now - next[id].lastSeen > 5000) { delete next[id]; changed = true; } }
        return changed ? next : prev;
      });
    }, 2000);

    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, [projectId, user, supabase]);

  const broadcastElements = useCallback((newElements: CanvasElement[]) => {
    if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'update_elements', payload: { elements: newElements } });
  }, []);

  const pushToHistory = useCallback((newElements: CanvasElement[]) => {
    setPast(prev => [...prev, elements]); setFuture([]); setElements(newElements); broadcastElements(newElements);
  }, [elements, broadcastElements]);

  // --- CLIPBOARD ENGINE ---
  const handleCopy = () => { const selected = elements.filter(el => selectedIds.includes(el.id)); if (selected.length > 0) setClipboard(selected); };
  const handleCut = () => { handleCopy(); pushToHistory(elements.filter(el => !selectedIds.includes(el.id))); setSelectedIds([]); };
  const handlePaste = () => {
    if (clipboard.length === 0) return;
    const newIds: string[] = [];
    const pasted = clipboard.map(el => {
      const newId = `el_${Math.random().toString(36).substr(2, 9)}`; newIds.push(newId);
      return { ...el, id: newId, x: el.x + 20, y: el.y + 20 };
    });
    pushToHistory([...elements, ...pasted]); setSelectedIds(newIds);
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
      const script = document.createElement('script'); script.src = 'https://js.paystack.co/v1/inline.js'; script.async = true; document.body.appendChild(script);
    }
    async function fetchWorkspaceData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return router.push('/login');
      setUser(authUser);
      const { data: projectData } = await supabase.from('projects').select('*, profiles:user_id(full_name, avatar_url, role)').eq('id', projectId).single();
      if (!projectData) return router.push('/dashboard');
      const isOwner = projectData.user_id === authUser.id; setIsFounder(isOwner);
      const { data: collaborators } = await supabase.from('collaborations').select('*, profiles:user_id(full_name, avatar_url, role)').eq('project_id', projectId).eq('status', 'accepted');
      if (!isOwner && !collaborators?.some(c => c.user_id === authUser.id)) return router.push(`/project/${projectId}`); 
      const { data: milestoneData } = await supabase.from('milestones').select('*').eq('project_id', projectId).order('id', { ascending: true });
      const { data: msgData } = await supabase.from('messages').select('*, profiles:user_id(full_name, avatar_url)').eq('project_id', projectId).order('created_at', { ascending: true });
      if (projectData.canvas_data && Array.isArray(projectData.canvas_data) && projectData.canvas_data.length > 0) setElements(projectData.canvas_data);
      setProject(projectData); setTeam(collaborators || []); setMilestones(milestoneData || []); setMessages(msgData || []); setLoading(false);
    }
    fetchWorkspaceData();
  }, [projectId, supabase, router]);

  // --- KEYBOARD & PASTE SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'colab' || colabView !== 'canvas') return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const tool = DESIGN_TOOLS.find(t => t.key === e.key);
      if (tool) setActiveTool(tool.id);
      
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key === 'c') { e.preventDefault(); handleCopy(); }
        if (e.key === 'x') { e.preventDefault(); handleCut(); }
        if (e.key === 'v') { if(clipboard.length > 0) { e.preventDefault(); handlePaste(); } }
        if (e.key === 'z') {
           e.preventDefault();
           if (e.shiftKey) { if (future.length) { const n = future[0]; setFuture(f => f.slice(1)); setPast(p => [...p, elements]); setElements(n); broadcastElements(n); } }
           else { if (past.length) { const p = past[past.length - 1]; setPast(prev => prev.slice(0, prev.length - 1)); setFuture(f => [elements, ...f]); setElements(p); broadcastElements(p); } }
        }
        if (e.key === 's') { e.preventDefault(); handleSaveDesign(); }
      } else {
        if (e.key === 'Backspace' || e.key === 'Delete') { pushToHistory(elements.filter(el => !selectedIds.includes(el.id))); setSelectedIds([]); }
        if (e.key === '[') pushToHistory([...elements.filter(el => selectedIds.includes(el.id)), ...elements.filter(el => !selectedIds.includes(el.id))]);
        if (e.key === ']') pushToHistory([...elements.filter(el => !selectedIds.includes(el.id)), ...elements.filter(el => selectedIds.includes(el.id))]);
      }
    };

    const handlePasteEvent = (e: ClipboardEvent) => {
      if (activeTab !== 'colab' || colabView !== 'canvas') return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      const items = e.clipboardData?.items; if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault(); const file = items[i].getAsFile();
          if (file) processImageFile(file, window.innerWidth / 2, window.innerHeight / 2);
          break; 
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('paste', handlePasteEvent);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('paste', handlePasteEvent); };
  }, [activeTab, colabView, selectedIds, elements, clipboard, past, future, canvasTransform, pushToHistory, broadcastElements]);

  // --- IMAGE ENGINE ---
  const processImageFile = async (file: File, clientX: number, clientY: number) => {
    const localUrl = URL.createObjectURL(file);
    const tempId = `img_${Date.now()}`;
    const img = new Image();
    img.onload = async () => {
       let w = img.width; let h = img.height; const maxDim = 800;
       if (w > maxDim || h > maxDim) { const ratio = Math.min(maxDim / w, maxDim / h); w *= ratio; h *= ratio; }
       const rect = containerRef.current?.getBoundingClientRect();
       const x = rect ? (clientX - rect.left - canvasTransform.x) / canvasTransform.scale : 0;
       const y = rect ? (clientY - rect.top - canvasTransform.y) / canvasTransform.scale : 0;

       const newImg: CanvasElement = { id: tempId, name: `Image ${file.name.substring(0, 10)}`, type: 'image', x, y, width: w, height: h, fill: 'transparent', fillOpacity: 100, stroke: 'transparent', strokeWidth: 0, cornerRadius: 0, isVisible: true, isLocked: false, imageUrl: localUrl };
       setElements(prev => { const newElements = [...prev, newImg]; setPast(p => [...p, prev]); setFuture([]); broadcastElements(newElements); return newElements; });
       setSelectedIds([tempId]);

       const fileExt = file.name.split('.').pop() || 'png';
       const filePath = `${projectId}/canvas/${tempId}.${fileExt}`;
       const { error: uploadError } = await supabase.storage.from('project_assets').upload(filePath, file);
       
       if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('project_assets').getPublicUrl(filePath);
          setElements(prev => { const finalElements = prev.map(el => el.id === tempId ? { ...el, imageUrl: publicUrlData.publicUrl } : el); broadcastElements(finalElements); return finalElements; });
       }
    };
    img.src = localUrl;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (activeTab !== 'colab' || colabView !== 'canvas') return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       const file = e.dataTransfer.files[0];
       if (file.type.startsWith('image/')) processImageFile(file, e.clientX, e.clientY);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault(); 

  // --- ADVANCED ACTIONS ---
  const handleGroup = () => {
    if (selectedIds.length < 2) return;
    const newGroupId = `group_${Date.now()}`;
    pushToHistory(elements.map(el => selectedIds.includes(el.id) ? { ...el, groupId: newGroupId } : el));
  };

  const handleUngroup = () => {
    if (!selectedIds.length) return;
    pushToHistory(elements.map(el => selectedIds.includes(el.id) ? { ...el, groupId: undefined } : el));
  };

  const handleMakeMask = () => {
    if (selectedIds.length < 2) return;
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    const maskEl = selectedElements[0]; 
    pushToHistory(elements.map(el => {
      if (el.id === maskEl.id) return { ...el, isMask: true };
      if (selectedIds.includes(el.id)) return { ...el, clipMaskId: maskEl.id };
      return el;
    }));
  };

  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedIds.length < 2) return;
    const selected = elements.filter(el => selectedIds.includes(el.id));
    const minX = Math.min(...selected.map(el => el.x));
    const maxX = Math.max(...selected.map(el => el.x + el.width));
    const minY = Math.min(...selected.map(el => el.y));
    const maxY = Math.max(...selected.map(el => el.y + el.height));
    const midX = minX + (maxX - minX) / 2;
    const midY = minY + (maxY - minY) / 2;

    const updated = elements.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      let newX = el.x;
      let newY = el.y;
      if (type === 'left') newX = minX;
      if (type === 'center') newX = midX - el.width / 2;
      if (type === 'right') newX = maxX - el.width;
      if (type === 'top') newY = minY;
      if (type === 'middle') newY = midY - el.height / 2;
      if (type === 'bottom') newY = maxY - el.height;
      return { ...el, x: newX, y: newY };
    });
    pushToHistory(updated);
  };

  const updateSelected = (updates: Partial<CanvasElement>) => pushToHistory(elements.map(el => selectedIds.includes(el.id) ? { ...el, ...updates } : el));

  const getSelectionBounds = () => {
    if (selectedIds.length === 0) return null;
    const s = elements.filter(el => selectedIds.includes(el.id) && el.type !== 'arrow');
    if(s.length === 0) return null;
    const minX = Math.min(...s.map(el => el.x)); const minY = Math.min(...s.map(el => el.y));
    const maxX = Math.max(...s.map(el => el.x + el.width)); const maxY = Math.max(...s.map(el => el.y + el.height));
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  const handleExport = async () => {
    const bounds = getSelectionBounds();
    if (!bounds) return alert("Select a layer or frame to export.");
    setIsExporting(true);
    try {
      const svgElement = containerRef.current?.querySelector('svg');
      if (!svgElement) throw new Error("SVG not found");

      const clone = svgElement.cloneNode(true) as SVGSVGElement;
      clone.querySelectorAll('.selection-ui, .prototype-ui, .multiplayer-ui').forEach(el => el.remove());

      const mainG = clone.querySelector('g[data-transform-wrapper="true"]');
      if (mainG) mainG.setAttribute('transform', `matrix(1, 0, 0, 1, 0, 0)`);
      
      clone.setAttribute('viewBox', `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);
      clone.setAttribute('width', `${bounds.width * exportScale}`);
      clone.setAttribute('height', `${bounds.height * exportScale}`);

      const svgData = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const fileName = `${singleSelectedElement?.name || 'export'}-${Date.now()}`;

      if (exportFormat === 'SVG') {
        const a = document.createElement('a'); a.href = url; a.download = `${fileName}.svg`; a.click(); URL.revokeObjectURL(url); setIsExporting(false); return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = bounds.width * exportScale;
        canvas.height = bounds.height * exportScale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        if (exportFormat === 'JPG') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const a = document.createElement('a'); a.href = canvas.toDataURL(exportFormat === 'JPG' ? 'image/jpeg' : 'image/png', 1.0); a.download = `${fileName}.${exportFormat.toLowerCase()}`; a.click(); URL.revokeObjectURL(url); setIsExporting(false);
      };
      img.onerror = () => { alert("Error generating image."); setIsExporting(false); };
      img.crossOrigin = 'anonymous'; img.src = url;
    } catch (err) { alert("Export failed."); setIsExporting(false); }
  };

  const startWithTemplate = (name: string, w: number, h: number) => {
    let finalW = w; let finalH = h; let finalName = name;
    if (name === 'Blank Canvas') { finalW = 1440; finalH = 1024; finalName = 'Desktop'; }
    const newFrame: CanvasElement = { id: `el_${Date.now()}`, name: finalName, type: 'frame', x: 100, y: 100, width: finalW, height: finalH, fill: '#ffffff', fillOpacity: 100, stroke: 'transparent', strokeWidth: 0, cornerRadius: 0, isVisible: true, isLocked: false, fontFamily: 'Inter', fontWeight: 'Normal', textAlign: 'left' };
    pushToHistory([...elements, newFrame]); setColabView('canvas'); setActiveTool('select');
  };

  // --- CANVAS ENGINE ---
  const getCanvasCoords = (e: any) => {
    if (!containerRef.current) return {x: 0, y: 0};
    const rect = containerRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left - canvasTransform.x) / canvasTransform.scale, y: (e.clientY - rect.top - canvasTransform.y) / canvasTransform.scale };
  };

  useEffect(() => {
    const container = containerRef.current; if (!container || colabView !== 'canvas') return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const delta = -e.deltaY * 0.005; const newScale = Math.min(Math.max(0.1, canvasTransform.scale + delta), 5);
        const rect = container.getBoundingClientRect();
        const newX = (e.clientX - rect.left) - ((e.clientX - rect.left) - canvasTransform.x) * (newScale / canvasTransform.scale);
        const newY = (e.clientY - rect.top) - ((e.clientY - rect.top) - canvasTransform.y) * (newScale / canvasTransform.scale);
        setCanvasTransform({ x: newX, y: newY, scale: newScale });
      } else {
        setCanvasTransform(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false }); return () => container.removeEventListener('wheel', handleWheel);
  }, [canvasTransform, colabView]);


  const handlePointerDown = (e: React.PointerEvent) => {
    if (editingTextId) return; 
    if (appMode === 'prototype') { if (activeTool === 'select' && (e.target as HTMLElement).tagName === 'svg') setSelectedIds([]); return; }
    if (isPanning || activeTool === 'hand' || e.button === 1) { setDragState({ action: 'panning', startX: e.clientX, startY: e.clientY }); return; }
    const { x, y } = getCanvasCoords(e);
    if (activeTool === 'select' && (e.target as HTMLElement).tagName === 'svg') {
      setSelectedIds([]);
    } else if (activeTool !== 'select' && activeTool !== 'image' && activeTool !== 'pen') {
      const isFrame = activeTool === 'frame';
      const containingFrame = isFrame ? undefined : [...elements].reverse().find(f => f.type === 'frame' && x >= f.x && x <= (f.x + f.width) && y >= f.y && y <= (f.y + f.height));
      pushToHistory([...elements, { id: `el_${Date.now()}`, name: activeTool.charAt(0).toUpperCase() + activeTool.slice(1), type: activeTool as any, x, y, width: isFrame ? 400 : 100, height: isFrame ? 300 : 100, fill: isFrame ? '#ffffff' : '#d4d4d8', fillOpacity: 100, stroke: 'transparent', strokeWidth: 0, cornerRadius: 0, isVisible: true, isLocked: false, text: activeTool === 'text' ? 'New Text' : undefined, fontSize: activeTool === 'text' ? 24 : undefined, fontFamily: 'Inter', fontWeight: 'Normal', textAlign: 'left', frameId: containingFrame ? containingFrame.id : undefined }]);
      setSelectedIds([`el_${Date.now()}`]); setActiveTool('select');
    }
  };

  const handleElementPointerDown = (e: React.PointerEvent, el: CanvasElement) => {
    if (activeTool !== 'select' || isPanning || el.isLocked || !el.isVisible || editingTextId === el.id) return;
    e.stopPropagation();
    const groupIdsToSelect = el.groupId ? elements.filter(e => e.groupId === el.groupId).map(e => e.id) : [el.id];
    let newSelection = [...selectedIds];
    if (e.shiftKey) {
      const isAlreadySelected = groupIdsToSelect.every(id => selectedIds.includes(id));
      newSelection = isAlreadySelected ? selectedIds.filter(id => !groupIdsToSelect.includes(id)) : [...selectedIds, ...groupIdsToSelect].filter((value, index, self) => self.indexOf(value) === index);
    } else { if (!selectedIds.includes(el.id)) newSelection = groupIdsToSelect; }
    setSelectedIds(newSelection);
    setDragState({ action: 'moving', startX: getCanvasCoords(e).x, startY: getCanvasCoords(e).y, originalElements: elements, hasDragged: false });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const { x, y } = getCanvasCoords(e);

    if (Date.now() - lastCursorUpdate.current > 50 && channelRef.current && user) {
       channelRef.current.send({ type: 'broadcast', event: 'cursor', payload: { userId: user.id, name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member', color: myColor, x, y } });
       lastCursorUpdate.current = Date.now();
    }

    if (prototypeDrag) { setPrototypeDrag({ ...prototypeDrag, x, y }); return; }
    if (!dragState) return;

    if (activeTool === 'hand' || dragState.action === 'panning') {
      setCanvasTransform(prev => ({ ...prev, x: prev.x + (e.clientX - dragState.startX), y: prev.y + (e.clientY - dragState.startY) }));
      setDragState({ ...dragState, startX: e.clientX, startY: e.clientY }); return;
    }

    if (!dragState.hasDragged) setDragState({ ...dragState, hasDragged: true });

    if (dragState.action === 'moving') {
      let dx = x - dragState.startX;
      let dy = y - dragState.startY;

      // -------------------------------------------------------------
      // SMART ALIGNMENT ENGINE
      // -------------------------------------------------------------
      const activeLines: Array<{type: 'v'|'h', val: number, start: number, end: number}> = [];
      const SNAP_TOLERANCE = 5 / canvasTransform.scale;
      
      if (selectedIds.length === 1) {
        const primaryEl = dragState.originalElements.find((el: CanvasElement) => el.id === selectedIds[0]);
        if (primaryEl && primaryEl.type !== 'arrow') {
          let tempCX = primaryEl.x + dx + primaryEl.width / 2;
          let tempCY = primaryEl.y + dy + primaryEl.height / 2;

          dragState.originalElements.forEach((target: CanvasElement) => {
            if (target.id === primaryEl.id || !target.isVisible || target.type === 'arrow') return;
            const tCX = target.x + target.width / 2;
            const tCY = target.y + target.height / 2;

            if (Math.abs(tempCX - tCX) < SNAP_TOLERANCE) {
              dx = tCX - primaryEl.width / 2 - primaryEl.x;
              activeLines.push({ type: 'v', val: tCX, start: Math.min(primaryEl.y + dy, target.y) - 50, end: Math.max(primaryEl.y + dy + primaryEl.height, target.y + target.height) + 50 });
            }
            if (Math.abs(tempCY - tCY) < SNAP_TOLERANCE) {
              dy = tCY - primaryEl.height / 2 - primaryEl.y;
              activeLines.push({ type: 'h', val: tCY, start: Math.min(primaryEl.x + dx, target.x) - 50, end: Math.max(primaryEl.x + dx + primaryEl.width, target.x + target.width) + 50 });
            }
          });
        }
      }
      setSnapLines(activeLines);

      const explicitlySelected = dragState.originalElements.filter((el: CanvasElement) => selectedIds.includes(el.id));
      const explicitlySelectedFrameIds = explicitlySelected.filter((el: CanvasElement) => el.type === 'frame').map((el: CanvasElement) => el.id);
      const childIds = dragState.originalElements.filter((el: CanvasElement) => el.frameId && explicitlySelectedFrameIds.includes(el.frameId)).map((el: CanvasElement) => el.id);
      const allMovingIds = [...selectedIds, ...childIds];

      const updated = dragState.originalElements.map((el: CanvasElement) => allMovingIds.includes(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el);
      setElements(updated); broadcastElements(updated);
    } 
    else if (dragState.action === 'resizing' && dragState.handle && appMode === 'design') {
      const dx = x - dragState.startX; const dy = y - dragState.startY;
      const updated = dragState.originalElements.map((el: CanvasElement) => {
        if (!selectedIds.includes(el.id)) return el;
        let newX = el.x, newY = el.y, newW = el.width, newH = el.height;
        const handle = dragState.handle!;
        if (handle.includes('e')) newW = Math.max(10, el.width + dx);
        if (handle.includes('s')) newH = Math.max(10, el.height + dy);
        if (handle.includes('w')) { newW = Math.max(10, el.width - dx); if (newW > 10) newX = el.x + dx; }
        if (handle.includes('n')) { newH = Math.max(10, el.height - dy); if (newH > 10) newY = el.y + dy; }
        return { ...el, x: newX, y: newY, width: newW, height: newH, fontSize: el.type === 'text' && el.fontSize && el.height ? Math.max(8, el.fontSize * (newH / el.height)) : el.fontSize };
      });
      setElements(updated); broadcastElements(updated);
    }
  };

  const handlePointerUp = () => {
    setSnapLines([]); 
    if (prototypeDrag) {
      const { x, y } = prototypeDrag;
      const target = [...elements].reverse().find(el => el.id !== prototypeDrag.startId && el.type !== 'arrow' && x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height);
      if (target) pushToHistory([...elements, { id: `el_${Date.now()}`, name: 'Interaction', type: 'arrow', startId: prototypeDrag.startId, endId: target.id, x: 0, y: 0, width: 0, height: 0, fill: 'transparent', fillOpacity: 100, stroke: '#3b82f6', strokeWidth: 2, cornerRadius: 0, isVisible: true, isLocked: false }]);
      setPrototypeDrag(null); return;
    }

    if (dragState && dragState.action !== 'panning' && dragState.hasDragged) {
      let finalElements = [...elements];
      if (dragState.action === 'moving') {
         const frames = finalElements.filter(el => el.type === 'frame');
         finalElements = finalElements.map(el => {
            if (selectedIds.includes(el.id) && el.type !== 'frame' && el.type !== 'arrow') {
               const centerX = el.x + el.width / 2; const centerY = el.y + el.height / 2;
               const containingFrame = [...frames].reverse().find(f => centerX >= f.x && centerX <= (f.x + f.width) && centerY >= f.y && centerY <= (f.y + f.height));
               return { ...el, frameId: containingFrame ? containingFrame.id : undefined };
            }
            return el;
         });
      }
      setPast(prev => [...prev, finalElements]); setFuture([]); setElements(finalElements); broadcastElements(finalElements);
    }
    setDragState(null);
  };

  const handleResizeHandleDown = (e: React.PointerEvent, handle: string) => { e.stopPropagation(); setDragState({ action: 'resizing', handle, startX: getCanvasCoords(e).x, startY: getCanvasCoords(e).y, originalElements: elements, hasDragged: false }); };
  const handleSaveDesign = async () => { setIsSaving(true); await supabase.from('projects').update({ canvas_data: elements }).eq('id', projectId); setIsSaving(false); };
  
  // --- OVERVIEW / MISC HANDLERS ---
  const handleToggleMilestone = async (m: any) => {
    if (!isFounder) return; 
    const newStatus = m.status === 'completed' ? 'pending' : 'completed';
    setMilestones((prev) => prev.map((milestone) => milestone.id === m.id ? { ...milestone, status: newStatus } : milestone));
    await supabase.from('milestones').update({ status: newStatus }).eq('id', m.id);
  };
  
  const handlePayment = (amount: number, milestoneId: string) => {
    if (!user) return; setIsProcessing(milestoneId);
    try {
      // @ts-ignore
      if (typeof window.PaystackPop === 'undefined') { alert("Payment gateway loading."); setIsProcessing(null); return; }
      // @ts-ignore
      const handler = window.PaystackPop.setup({ key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, email: user.email || 'founder@labx.com', amount: Math.round(amount * 100 * 1500), currency: 'NGN', callback: async (response: any) => {
          const { error } = await supabase.from('milestones').update({ payment_status: 'escrow_funded', payment_reference: response.reference }).eq('id', milestoneId);
          if (!error) { setMilestones((prev) => prev.map((m) => m.id === milestoneId ? { ...m, payment_status: 'escrow_funded' } : m)); triggerHaptic([10, 50, 10]); }
          setIsProcessing(null);
        }, onClose: () => setIsProcessing(null)
      }); handler.openIframe();
    } catch (error: any) { alert(`Gateway Error: ${error.message}`); setIsProcessing(null); }
  };

  const handleProjectPayment = () => {
    if (!user) return; setIsProcessing('project_funding');
    try {
      // @ts-ignore
      if (typeof window.PaystackPop === 'undefined') { alert("Payment gateway loading."); setIsProcessing(null); return; }
      const cleanBudget = typeof (project?.budget || project?.valuation) === 'string' ? (project?.budget || project?.valuation).replace(/[^0-9.]/g, '') : (project?.budget || project?.valuation);
      // @ts-ignore
      const handler = window.PaystackPop.setup({ key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, email: user.email || 'founder@labx.com', amount: Math.round((Number(cleanBudget) || 0) * 100 * 1500), currency: 'NGN', callback: async (response: any) => {
          const { error } = await supabase.from('projects').update({ payment_status: 'escrow_funded', payment_reference: response.reference }).eq('id', projectId);
          if (!error) { setProject((prev: any) => ({ ...prev, payment_status: 'escrow_funded' })); triggerHaptic([10, 50, 10]); }
          setIsProcessing(null);
        }, onClose: () => setIsProcessing(null)
      }); handler.openIframe();
    } catch (error: any) { alert(`Gateway Error`); setIsProcessing(null); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newMessage.trim() && !pendingAttachment) return;
    setIsSending(true); let attachmentUrl = null;
    try {
      if (pendingAttachment) {
        setIsChatUploading(true);
        const filePath = `${projectId}/chat/${Math.random()}.${pendingAttachment.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('project_assets').upload(filePath, pendingAttachment);
        if (uploadError) throw uploadError;
        attachmentUrl = supabase.storage.from('project_assets').getPublicUrl(filePath).data.publicUrl;
      }
      await supabase.from('messages').insert({ project_id: projectId, user_id: user.id, content: newMessage.trim(), attachment_url: attachmentUrl, attachment_type: pendingAttachment?.type.includes('image') ? 'image' : pendingAttachment ? 'document' : null, attachment_name: pendingAttachment?.name });
      setNewMessage(''); setPendingAttachment(null); if (chatFileInputRef.current) chatFileInputRef.current.value = '';
    } finally { setIsSending(false); setIsChatUploading(false); }
  };

  // --- RENDER HELPERS ---
  const topLevelElements = [...elements].reverse().filter(el => !el.frameId && el.type !== 'arrow');
  const renderLayerItem = (el: CanvasElement, depth: number) => {
    return (
      <div 
        key={el.id} 
        onClick={(e) => { e.stopPropagation(); setActiveTool('select'); if (e.shiftKey) setSelectedIds([...selectedIds, el.id].filter((v, i, a) => a.indexOf(v) === i)); else setSelectedIds([el.id]); }} 
        onDoubleClick={(e) => { e.stopPropagation(); if (el.type === 'text') { setEditingTextId(el.id); setActiveTool('select'); } }}
        className={`flex items-center justify-between py-1.5 pr-2 rounded text-[11px] cursor-pointer group ${selectedIds.includes(el.id) ? 'bg-[#9cf822]/10 text-[#9cf822] font-medium' : 'text-zinc-300 hover:bg-[#383838]'}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <div className="flex items-center gap-2 truncate">
          {el.isMask ? <Scissors size={10} className="text-[#9cf822]" /> : el.type === 'text' ? <TypeIcon size={10}/> : el.type === 'image' ? <ImageIcon size={10}/> : el.type === 'frame' ? <Layout size={10}/> : <Square size={10}/>}
          <span className={`truncate flex-grow ${el.type === 'frame' ? 'font-bold text-white' : ''}`}>{el.name} {el.groupId && <span className="opacity-50 ml-1 text-[9px]">(Grouped)</span>}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); pushToHistory(elements.map(item => item.id === el.id ? {...item, isVisible: !item.isVisible} : item)); }} className="p-1 hover:text-white">
            {el.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black"><Loader2 className="animate-spin text-[#9cf822]" /></div>;

  const totalBudget = project?.budget || project?.valuation || 0;
  const currencySymbol = getCurrencySymbol(project?.currency);
  const displayImage = project?.cover_image_url || project?.image_url;
  const progressPercentage = milestones?.length > 0 ? Math.round((milestones?.filter(m => m.status === 'completed').length / milestones.length) * 100) : 0;
  const pinnedMessage = messages.find((m: any) => m.is_pinned === true);

  const bounds = getSelectionBounds();
  const isMultiSelect = selectedIds.length > 1;
  const singleSelectedElement = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null;

  return (
    <div className={`transition-colors duration-300 flex flex-col font-sans ${isFullscreen ? 'fixed inset-0 z-[9999] bg-[#1E1E1E]' : 'min-h-screen'} ${activeTab === 'colab' ? 'bg-[#1E1E1E] text-zinc-300 selection:bg-[#9cf822]/30 overflow-hidden' : 'bg-zinc-50 dark:bg-black text-left pb-20 relative'}`}>
      
      {/* OVERVIEW HEADER */}
      {activeTab === 'overview' && !isFullscreen ? (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-900 shrink-0">
          <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href={isFounder ? "/dashboard" : "/discover"} className="p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors bg-zinc-100 dark:bg-zinc-900 rounded-full"><ArrowLeft size={18} /></Link>
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
              <button onClick={() => setActiveTab('overview')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all bg-white dark:bg-black text-black dark:text-white shadow-sm"><LayoutDashboard size={14} /> Overview</button>
              <button onClick={() => isMobile ? setShowMobileWarning(true) : setActiveTab('colab')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all text-zinc-600 hover:text-[#9cf822]">Lab X</button>
            </div>
            
            <button onClick={() => setIsChatOpen(true)} className="hidden sm:flex px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-black/10 dark:shadow-white/10 items-center gap-2"><MessageSquare size={16} /> Team Sync</button>
          </div>
        </header>
      ) : activeTab === 'colab' && colabView === 'canvas' && (
        <header className="h-11 bg-[#2C2C2C] border-b border-[#383838] flex items-center justify-between px-4 shrink-0 z-50">
          <div className="flex items-center gap-3 w-[240px]">
            <button onClick={() => setColabView('home')} className="p-1 hover:bg-[#383838] rounded transition-colors text-zinc-400 hover:text-white" title="Back to Home"><Home size={14} /></button>
            <div className="h-3 w-px bg-[#383838]" />
            <div className="text-xs font-medium text-white flex items-center gap-2 cursor-pointer hover:bg-[#383838] px-2 py-1 rounded truncate">
              {project?.title} 
              <span className="text-zinc-500">/</span> 
              <span className="opacity-80">Draft</span> 
              <ChevronDown size={12} className="text-zinc-500"/>
              <div className="flex items-center gap-1 ml-2 bg-[#9cf822]/10 px-1.5 py-0.5 rounded border border-[#9cf822]/20 text-[#9cf822]"><div className="w-1.5 h-1.5 rounded-full bg-[#9cf822] animate-pulse"></div><span className="text-[9px] uppercase tracking-wider font-bold">Live</span></div>
            </div>
          </div>

          <div className="flex items-center justify-center flex-1 gap-4">
             <div className="flex bg-[#1E1E1E] rounded-md p-0.5 border border-[#383838]">
                <button onClick={() => setAppMode('design')} className={`px-3 py-1 text-[11px] font-bold rounded-sm transition-colors ${appMode === 'design' ? 'bg-[#383838] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Design</button>
                <button onClick={() => setAppMode('prototype')} className={`px-3 py-1 text-[11px] font-bold rounded-sm transition-colors flex items-center gap-1 ${appMode === 'prototype' ? 'bg-[#383838] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><Zap size={10} className={appMode === 'prototype' ? 'text-[#3b82f6] fill-[#3b82f6]' : ''}/> Prototype</button>
             </div>

             {/* DYNAMIC TOOLBAR */}
             {appMode === 'design' && (
               <div className="flex items-center gap-0.5 border-l border-[#383838] pl-4">
                 {DESIGN_TOOLS.map(tool => (
                   <ToolBtn key={tool.id} icon={<tool.icon size={14}/>} active={activeTool === tool.id} onClick={() => setActiveTool(tool.id)} tip={tool.tip} />
                 ))}
               </div>
             )}
          </div>

          <div className="flex items-center justify-end gap-3 w-[240px]">
            <div className="flex items-center gap-2 mr-2">
               {team.slice(0, 3).map((m, i) => (
                 <div key={i} className="w-6 h-6 rounded-full bg-[#18181b] border border-[#383838] overflow-hidden">
                    {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} className="w-full h-full object-cover"/> : <User size={12} className="m-auto mt-1.5 text-zinc-500" />}
                 </div>
               ))}
               <button onClick={() => alert('Sharing link copied to clipboard!')} className="px-3 py-1 bg-[#9cf822] text-black text-[11px] font-bold rounded hover:opacity-90 transition-opacity">Share</button>
            </div>
            <div className="w-px h-4 bg-[#383838]"></div>
            <button onClick={() => setShowGrid(!showGrid)} className={`p-1 rounded transition-colors ${showGrid ? 'text-[#9cf822]' : 'text-zinc-400 hover:text-white'}`}><Grid size={14} /></button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1 text-zinc-400 hover:text-white rounded transition-colors">{isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}</button>
            <button onClick={handleSaveDesign} disabled={isSaving} className="p-1 text-zinc-400 hover:text-[#9cf822] rounded transition-colors disabled:opacity-50">{isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}</button>
          </div>
        </header>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow flex flex-col relative">
        
        {/* OVERVIEW TAB CONTENT */}
        {activeTab === 'overview' && !isFullscreen && (
          <div className="max-w-[1600px] w-full mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 pb-20">
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
                  const isFunded = m.payment_status === 'escrow_funded'; const isCompleted = m.status === 'completed';
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

        {/* LAB X HOME VIEW */}
        {activeTab === 'colab' && colabView === 'home' && (
          <div className="flex-grow flex bg-[#1E1E1E] text-zinc-300 relative h-full">
            <div className="w-60 bg-[#2C2C2C] border-r border-[#383838] flex flex-col p-4 hidden md:flex shrink-0">
              <div className="flex items-center gap-3 mb-8 cursor-pointer px-2" onClick={() => setActiveTab('overview')}>
                <img src="/lab x.png" className="w-8 h-8 hover:opacity-80 transition-opacity object-contain" alt="Lab X" />
              </div>

              <div className="space-y-0.5">
                 <button onClick={() => setHomeSidebarView('home')} className={`w-full flex items-center gap-3 px-2 py-2 rounded text-sm font-medium transition-colors ${homeSidebarView === 'home' ? 'bg-[#383838] text-white' : 'text-zinc-400 hover:text-white hover:bg-[#383838]/50'}`}><Home size={16}/> Home</button>
                 <button onClick={() => setHomeSidebarView('recent')} className={`w-full flex items-center gap-3 px-2 py-2 rounded text-sm font-medium transition-colors ${homeSidebarView === 'recent' ? 'bg-[#383838] text-white' : 'text-zinc-400 hover:text-white hover:bg-[#383838]/50'}`}><Clock size={16}/> Recent</button>
                 <button onClick={() => setHomeSidebarView('shared')} className={`w-full flex items-center gap-3 px-2 py-2 rounded text-sm font-medium transition-colors ${homeSidebarView === 'shared' ? 'bg-[#383838] text-white' : 'text-zinc-400 hover:text-white hover:bg-[#383838]/50'}`}><Users size={16}/> Shared with you</button>
              </div>
              <div className="mt-auto"><button onClick={() => setActiveTab('overview')} className="w-full flex items-center justify-center gap-2 px-2 py-2 border border-[#383838] text-zinc-400 hover:text-white hover:bg-[#383838]/50 rounded text-sm font-medium transition-colors"><ArrowLeft size={16}/> Exit to Overview</button></div>
            </div>

            <div className="flex-grow p-8 md:p-12 overflow-y-auto">
              <div className="max-w-5xl mx-auto space-y-12">
                <div className="flex items-center justify-between">
                   <h1 className="text-2xl font-semibold text-white tracking-tight">Let's create something.</h1>
                   <button onClick={() => startWithTemplate('Blank Canvas', 800, 600)} className="px-4 py-2 bg-[#9cf822] text-black font-bold rounded text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"><Plus size={16}/> New design file</button>
                </div>
                {homeSidebarView === 'home' && (
                  <>
                    <div>
                       <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Start a new file fast</h2>
                       <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <TemplateCard name="Web Large" size="1440 x 1024" icon={<Monitor size={24} strokeWidth={1.5}/>} onClick={() => startWithTemplate('Web Large', 1440, 1024)} />
                          <TemplateCard name="iPhone 14 Pro" size="390 x 844" icon={<Smartphone size={24} strokeWidth={1.5}/>} onClick={() => startWithTemplate('iPhone 14 Pro', 390, 844)} />
                          <TemplateCard name="Instagram Post" size="1080 x 1080" icon={<LayoutGrid size={24} strokeWidth={1.5}/>} onClick={() => startWithTemplate('Instagram Post', 1080, 1080)} />
                          <TemplateCard name="Blank Canvas" size="Infinite" icon={<Square size={24} strokeWidth={1.5}/>} onClick={() => setColabView('canvas')} />
                          <TemplateCard name="More Presets" size="Explore" icon={<MoreHorizontal size={24} strokeWidth={1.5}/>} onClick={() => alert("Loading more presets...")} />
                       </div>
                    </div>
                    <div>
                       <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Recent</h2>
                       <div className="bg-[#2C2C2C] border border-[#383838] rounded-lg overflow-hidden">
                          <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-[#383838] text-[10px] font-bold text-zinc-500 tracking-wider">
                            <div className="col-span-6">NAME</div><div className="col-span-3">TYPE</div><div className="col-span-3">RECENT</div>
                          </div>
                          <div onClick={() => setColabView('canvas')} className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-[#383838]/50 cursor-pointer transition-colors items-center">
                            <div className="col-span-6 flex items-center gap-3"><div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center shrink-0 border border-zinc-700"><img src="/lab x.png" className="w-4 h-4 object-contain opacity-50" alt="Lab X" /></div><span className="text-sm font-medium text-white">{project?.title || 'Lab X Draft'}</span></div>
                            <div className="col-span-3 text-xs text-zinc-400">Design</div><div className="col-span-3 text-xs text-zinc-400">Just now</div>
                          </div>
                       </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LAB X CANVAS EDITOR */}
        {activeTab === 'colab' && colabView === 'canvas' && (
          <div className="flex-grow flex relative overflow-hidden">
            
            <aside className="w-[240px] bg-[#2C2C2C] border-r border-[#383838] flex flex-col z-20 shrink-0">
              <div className="px-3 py-2.5 border-b border-[#383838] flex items-center gap-2 text-[11px] font-bold text-white"><Layers size={12} /> Layers</div>
              <div className="flex-grow overflow-y-auto p-2 space-y-0.5">
                 {topLevelElements.map(el => {
                    const children = el.type === 'frame' ? [...elements].reverse().filter(c => c.frameId === el.id && c.type !== 'arrow') : [];
                    return (
                       <React.Fragment key={el.id}>
                          {renderLayerItem(el, 0)}
                          {children.map(child => renderLayerItem(child, 1))}
                       </React.Fragment>
                    );
                 })}
              </div>
            </aside>

            <main 
              ref={containerRef} 
              className="flex-grow bg-[#1E1E1E] relative cursor-crosshair overflow-hidden" 
              onPointerDown={handlePointerDown} 
              onPointerMove={handlePointerMove} 
              onPointerUp={handlePointerUp} 
              onPointerLeave={handlePointerUp}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {showGrid && <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: `${20 * canvasTransform.scale}px ${20 * canvasTransform.scale}px`, backgroundPosition: `${canvasTransform.x}px ${canvasTransform.y}px` }} />}

              <svg className="w-full h-full absolute inset-0">
                <defs>
                  <filter id="artboard-shadow" x="-20%" y="-20%" width="140%" height="140%">
                     <feDropShadow dx="0" dy="8" stdDeviation="24" floodOpacity="0.08" floodColor="#000000"/>
                     <feDropShadow dx="0" dy="2" stdDeviation="6" floodOpacity="0.04" floodColor="#000000"/>
                  </filter>
                  {elements.filter(e => e.type === 'frame').map(f => (<clipPath id={`clip_frame_${f.id}`} key={`clip_frame_${f.id}`}><rect x={f.x} y={f.y} width={f.width} height={f.height} /></clipPath>))}
                  {elements.filter(e => e.isMask).map(maskEl => (<clipPath id={`clip_${maskEl.id}`} key={`clip_${maskEl.id}`}>{maskEl.type === 'rectangle' && <rect x={maskEl.x} y={maskEl.y} width={maskEl.width} height={maskEl.height} rx={maskEl.cornerRadius} />}{maskEl.type === 'ellipse' && <ellipse cx={maskEl.x + maskEl.width/2} cy={maskEl.y + maskEl.height/2} rx={maskEl.width/2} ry={maskEl.height/2} />}</clipPath>))}
                </defs>

                <g data-transform-wrapper="true" transform={`matrix(${canvasTransform.scale}, 0, 0, ${canvasTransform.scale}, ${canvasTransform.x}, ${canvasTransform.y})`}>
                  {elements.map(el => {
                    if (!el.isVisible || el.type === 'arrow') return null; 
                    const isSelected = selectedIds.includes(el.id);
                    const isEditing = editingTextId === el.id;
                    
                    if (el.type === 'frame') {
                       return (
                         <g key={el.id}>
                           <text x={el.x} y={el.y - 8} fontSize={12 / canvasTransform.scale} fill="#a1a1aa" fontWeight="600" className="select-none pointer-events-none">{el.name}</text>
                           <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill} filter="url(#artboard-shadow)" stroke={isSelected ? '#9cf822' : 'transparent'} strokeWidth={isSelected ? 2/canvasTransform.scale : 0} onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''}/>
                         </g>
                       );
                    }

                    return (
                      <g key={el.id} clipPath={el.frameId ? `url(#clip_frame_${el.frameId})` : undefined}>
                        <g opacity={el.fillOpacity / 100} clipPath={el.clipMaskId ? `url(#clip_${el.clipMaskId})` : undefined}>
                          {el.type === 'rectangle' && <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill} rx={el.cornerRadius} stroke={el.stroke} strokeWidth={el.strokeWidth} strokeDasharray={el.strokeDasharray} onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''}/>}
                          {el.type === 'ellipse' && <ellipse cx={el.x + el.width/2} cy={el.y + el.height/2} rx={el.width/2} ry={el.height/2} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} strokeDasharray={el.strokeDasharray} onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''} />}
                          {el.type === 'text' && (
                             isEditing ? (
                                <foreignObject x={el.x} y={el.y} width={Math.max(300, el.width * 2)} height={(el.fontSize || 24) * 2} className="overflow-visible pointer-events-auto"><input autoFocus defaultValue={el.text} onPointerDown={(e) => e.stopPropagation()} onBlur={(e) => { updateSelected({text: e.target.value}); setEditingTextId(null); }} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); }} style={{ fontSize: el.fontSize, fontFamily: el.fontFamily, color: el.fill, background: 'transparent', outline: '1px solid #9cf822', border: 'none', margin: 0, padding: 0, width: '100%', lineHeight: 1, fontWeight: el.fontWeight, textAlign: el.textAlign }} /></foreignObject>
                             ) : (
                                <text x={el.x} y={el.y + (el.fontSize || 24) * 0.85} fill={el.fill} fontSize={el.fontSize} fontFamily={el.fontFamily} fontWeight={el.fontWeight} textAnchor={el.textAlign === 'center' ? 'middle' : el.textAlign === 'right' ? 'end' : 'start'} dx={el.textAlign === 'center' ? el.width/2 : el.textAlign === 'right' ? el.width : 0} onPointerDown={(e) => handleElementPointerDown(e, el)} onDoubleClick={(e) => { e.stopPropagation(); setEditingTextId(el.id); setActiveTool('select'); }} className="select-none cursor-default">{el.text}</text>
                             )
                          )}
                          {el.type === 'image' && el.imageUrl && <image href={el.imageUrl} x={el.x} y={el.y} width={el.width} height={el.height} preserveAspectRatio="none" onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''} clipPath={`inset(0 0 0 0 round ${el.cornerRadius || 0}px)`} />}
                        </g>
                      </g>
                    );
                  })}

                  {/* PROTOTYPE ENGINE */}
                  {appMode === 'prototype' && elements.filter(el => el.type === 'arrow').map(arrow => {
                     const startEl = elements.find(e => e.id === arrow.startId);
                     const endEl = elements.find(e => e.id === arrow.endId);
                     if (!startEl || !endEl || !startEl.isVisible || !endEl.isVisible) return null;
                     const sx = startEl.x + startEl.width; const sy = startEl.y + startEl.height / 2;
                     const ex = endEl.x; const ey = endEl.y + endEl.height / 2;
                     const dist = Math.abs(ex - sx);
                     const cpX = sx + Math.max(50, dist / 2);
                     return (
                        <g key={arrow.id} className="prototype-ui">
                           <path d={`M ${sx} ${sy} C ${cpX} ${sy}, ${ex - Math.max(50, dist / 2)} ${ey}, ${ex} ${ey}`} fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.8" />
                           <polygon points={`${ex},${ey} ${ex-6},${ey-4} ${ex-6},${ey+4}`} fill="#3b82f6" opacity="0.8" />
                        </g>
                     )
                  })}

                  {prototypeDrag && (() => {
                      const startEl = elements.find(e => e.id === prototypeDrag.startId);
                      if (!startEl) return null;
                      const sx = startEl.x + startEl.width; const sy = startEl.y + startEl.height / 2;
                      const ex = prototypeDrag.x; const ey = prototypeDrag.y;
                      const dist = Math.abs(ex - sx);
                      return (
                         <g className="prototype-ui pointer-events-none">
                            <path d={`M ${sx} ${sy} C ${sx + Math.max(50, dist / 2)} ${sy}, ${ex - Math.max(50, dist / 2)} ${ey}, ${ex} ${ey}`} fill="none" stroke="#3b82f6" strokeWidth="2" />
                            <polygon points={`${ex},${ey} ${ex-6},${ey-4} ${ex-6},${ey+4}`} fill="#3b82f6" />
                         </g>
                      );
                  })()}

                  {appMode === 'prototype' && singleSelectedElement && singleSelectedElement.type !== 'arrow' && (
                     <g transform={`translate(${singleSelectedElement.x + singleSelectedElement.width + 10}, ${singleSelectedElement.y + singleSelectedElement.height / 2})`} className="cursor-pointer prototype-ui" onPointerDown={(e) => { e.stopPropagation(); setPrototypeDrag({ startId: singleSelectedElement.id, x: getCanvasCoords(e).x, y: getCanvasCoords(e).y }) }}>
                        <circle cx="0" cy="0" r="7" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                        <path d="M -3 0 L 3 0 M 0 -3 L 0 3" stroke="#ffffff" strokeWidth="1.5" />
                     </g>
                  )}

                  {/* ALIGNMENT GUIDES RENDERER */}
                  {snapLines.map((line, i) => (
                    line.type === 'v' 
                      ? <line key={`snap-v-${i}`} x1={line.val} y1={line.start} x2={line.val} y2={line.end} stroke="#ff3b30" strokeWidth={1/canvasTransform.scale} strokeDasharray="4" opacity={0.8} />
                      : <line key={`snap-h-${i}`} x1={line.start} y1={line.val} x2={line.end} y2={line.val} stroke="#ff3b30" strokeWidth={1/canvasTransform.scale} strokeDasharray="4" opacity={0.8} />
                  ))}

                  {/* BOUNDING BOX */}
                  {appMode === 'design' && bounds && activeTool === 'select' && (
                    <g className="selection-ui">
                      <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill="none" stroke="#9cf822" strokeWidth={1.5 / canvasTransform.scale} pointerEvents="none" />
                      {!isMultiSelect && (
                        <>
                          <rect onPointerDown={(e) => handleResizeHandleDown(e, 'nw')} x={bounds.x - 3/canvasTransform.scale} y={bounds.y - 3/canvasTransform.scale} width={6/canvasTransform.scale} height={6/canvasTransform.scale} fill="white" stroke="#9cf822" strokeWidth={1/canvasTransform.scale} className="cursor-nwse-resize" />
                          <rect onPointerDown={(e) => handleResizeHandleDown(e, 'ne')} x={bounds.x + bounds.width - 3/canvasTransform.scale} y={bounds.y - 3/canvasTransform.scale} width={6/canvasTransform.scale} height={6/canvasTransform.scale} fill="white" stroke="#9cf822" strokeWidth={1/canvasTransform.scale} className="cursor-nesw-resize" />
                          <rect onPointerDown={(e) => handleResizeHandleDown(e, 'sw')} x={bounds.x - 3/canvasTransform.scale} y={bounds.y + bounds.height - 3/canvasTransform.scale} width={6/canvasTransform.scale} height={6/canvasTransform.scale} fill="white" stroke="#9cf822" strokeWidth={1/canvasTransform.scale} className="cursor-nesw-resize" />
                          <rect onPointerDown={(e) => handleResizeHandleDown(e, 'se')} x={bounds.x + bounds.width - 3/canvasTransform.scale} y={bounds.y + bounds.height - 3/canvasTransform.scale} width={6/canvasTransform.scale} height={6/canvasTransform.scale} fill="white" stroke="#9cf822" strokeWidth={1/canvasTransform.scale} className="cursor-nwse-resize" />
                        </>
                      )}
                    </g>
                  )}

                  {/* MULTIPLAYER CURSORS */}
                  {Object.entries(cursors).map(([id, cursor]) => {
                    if (id === user?.id) return null;
                    return (
                      <g key={id} className="pointer-events-none multiplayer-ui transition-all duration-75 ease-linear" transform={`translate(${cursor.x}, ${cursor.y})`}>
                        <path d="M5.65376 21.2586L1 1L21.2586 5.65376L13.7118 10.4357L18.8927 15.6165L15.6165 18.8927L10.4357 13.7118L5.65376 21.2586Z" fill={cursor.color} stroke="white" strokeWidth="1.5" />
                        <rect x="12" y="20" width={cursor.name.length * 7 + 10} height="20" fill={cursor.color} rx="4" />
                        <text x="17" y="33" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">{cursor.name}</text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </main>

            {/* RIGHT PANEL: INSPECTOR */}
            <aside className="w-[240px] bg-[#2C2C2C] border-l border-[#383838] overflow-y-auto z-20 shrink-0 text-white select-none">
              
              {appMode === 'prototype' ? (
                 <div className="p-6 text-center text-zinc-500 h-full flex flex-col items-center justify-center">
                   <Zap size={32} className="mb-4 opacity-20 text-[#3b82f6]" />
                   <h3 className="text-white text-[13px] font-semibold mb-2">Prototype Mode</h3>
                   <p className="text-[11px] leading-relaxed">Select a frame or element, then drag the blue node to connect it to another screen.</p>
                 </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 border-b border-[#383838] text-zinc-400">
                    <div className="flex gap-2"><button onClick={() => handleAlign('left')} className="hover:text-white transition-colors" title="Align left"><AlignLeft size={14}/></button><button onClick={() => handleAlign('center')} className="hover:text-white transition-colors" title="Align horizontal centers"><AlignCenter size={14}/></button><button onClick={() => handleAlign('right')} className="hover:text-white transition-colors" title="Align right"><AlignRight size={14}/></button></div>
                    <div className="flex gap-2"><button onClick={() => handleAlign('top')} className="hover:text-white transition-colors rotate-90" title="Align top"><AlignLeft size={14}/></button><button onClick={() => handleAlign('middle')} className="hover:text-white transition-colors rotate-90" title="Align vertical centers"><AlignCenter size={14}/></button><button onClick={() => handleAlign('bottom')} className="hover:text-white transition-colors rotate-90" title="Align bottom"><AlignRight size={14}/></button></div>
                  </div>

                  {isMultiSelect ? (
                    <div className="p-3 border-b border-[#383838] space-y-3">
                      <div className="text-[11px] font-medium text-white">Selection</div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-2 bg-[#383838]/50 p-2 rounded"><Layers size={12}/> {selectedIds.length} layers selected</div>
                      <div className="grid grid-cols-2 gap-2 mt-4"><button onClick={handleGroup} className="py-1.5 bg-[#383838] hover:bg-[#444] rounded flex items-center justify-center gap-1.5 text-[10px] font-medium transition-colors"><Link2 size={12}/> Group</button><button onClick={handleMakeMask} className="py-1.5 bg-[#383838] hover:bg-[#444] rounded flex items-center justify-center gap-1.5 text-[10px] font-medium transition-colors"><Scissors size={12}/> Mask</button></div>
                    </div>
                  ) : singleSelectedElement ? (
                    <>
                      <div className="p-3 border-b border-[#383838]">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2"><FigmaInput icon="X" value={Math.round(singleSelectedElement.x)} onChange={(v: string) => updateSelected({x: Number(v)})} /><FigmaInput icon="Y" value={Math.round(singleSelectedElement.y)} onChange={(v: string) => updateSelected({y: Number(v)})} /><FigmaInput icon="W" value={Math.round(singleSelectedElement.width)} onChange={(v: string) => updateSelected({width: Math.max(1, Number(v) || 1)})} /><FigmaInput icon="H" value={Math.round(singleSelectedElement.height)} onChange={(v: string) => updateSelected({height: Math.max(1, Number(v) || 1)})} /><FigmaInput icon="∠" value={"0°"} onChange={() => {}} /><FigmaInput icon="R" value={singleSelectedElement.cornerRadius || 0} onChange={(v: string) => updateSelected({cornerRadius: Number(v) || 0})} /></div>
                      </div>

                      {/* CORNER RADIUS TOOL */}
                      {(singleSelectedElement.type === 'rectangle' || singleSelectedElement.type === 'image' || singleSelectedElement.type === 'frame') && (
                         <div className="p-3 border-b border-[#383838] space-y-3">
                            <div className="flex items-center justify-between text-[11px] font-medium text-zinc-300">
                               Corner Radius
                               <span className="bg-[#1E1E1E] px-1.5 py-0.5 rounded border border-[#383838]">{singleSelectedElement.cornerRadius || 0}</span>
                            </div>
                            <input 
                               type="range" min="0" max={Math.min(singleSelectedElement.width, singleSelectedElement.height) / 2} 
                               value={singleSelectedElement.cornerRadius || 0} 
                               onChange={(e) => updateSelected({cornerRadius: Number(e.target.value)})} 
                               className="w-full h-1 bg-[#383838] rounded-lg appearance-none cursor-pointer accent-[#9cf822]" 
                            />
                         </div>
                      )}

                      {singleSelectedElement.type === 'text' && (
                        <div className="p-3 border-b border-[#383838] space-y-2">
                           <div className="text-[11px] font-medium mb-2">Text</div>
                           <div className="flex items-center gap-2">
                              <div className="flex-1 flex items-center justify-between border border-transparent hover:border-[#383838] px-2 py-1 rounded cursor-pointer group relative"><span className="text-[11px]">{singleSelectedElement.fontFamily}</span><ChevronDown size={12} className="text-zinc-500 group-hover:text-white" /><select className="absolute inset-0 opacity-0 cursor-pointer" value={singleSelectedElement.fontFamily} onChange={(e) => updateSelected({fontFamily: e.target.value})}><option value="Inter">Inter</option><option value="Arial">Arial</option><option value="Helvetica">Helvetica</option><option value="Times New Roman">Times New Roman</option></select></div>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center justify-between border border-transparent hover:border-[#383838] px-2 py-1 rounded cursor-pointer group relative"><span className="text-[11px]">{singleSelectedElement.fontWeight}</span><ChevronDown size={12} className="text-zinc-500 group-hover:text-white" /><select className="absolute inset-0 opacity-0 cursor-pointer" value={singleSelectedElement.fontWeight} onChange={(e) => updateSelected({fontWeight: e.target.value})}><option value="Normal">Normal</option><option value="Bold">Bold</option><option value="Bolder">Bolder</option><option value="Lighter">Lighter</option></select></div>
                              <FigmaInput icon={<TypeIcon size={12}/>} value={singleSelectedElement.fontSize || 16} onChange={(v: string) => updateSelected({fontSize: Number(v) || 16})} />
                           </div>
                           <div className="flex items-center gap-1 mt-2 text-zinc-400"><button onClick={() => updateSelected({textAlign: 'left'})} className={`p-1.5 rounded hover:text-white ${singleSelectedElement.textAlign === 'left' ? 'bg-[#383838] text-white' : ''}`}><AlignLeft size={12}/></button><button onClick={() => updateSelected({textAlign: 'center'})} className={`p-1.5 rounded hover:text-white ${singleSelectedElement.textAlign === 'center' ? 'bg-[#383838] text-white' : ''}`}><AlignCenter size={12}/></button><button onClick={() => updateSelected({textAlign: 'right'})} className={`p-1.5 rounded hover:text-white ${singleSelectedElement.textAlign === 'right' ? 'bg-[#383838] text-white' : ''}`}><AlignRight size={12}/></button></div>
                        </div>
                      )}

                      {singleSelectedElement.type !== 'image' && (
                        <div className="p-3 border-b border-[#383838]">
                          <div className="flex items-center justify-between group cursor-pointer mb-2"><span className="text-[11px] font-medium">Fill</span><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button className="p-1 hover:bg-[#383838] rounded text-zinc-400 hover:text-white"><Plus size={12}/></button></div></div>
                          <div className="flex items-center gap-2 group">
                             <div className="w-4 h-4 rounded-sm border border-[#444] cursor-pointer shadow-sm relative overflow-hidden flex-shrink-0" style={{ background: singleSelectedElement.fill }}>
                                {singleSelectedElement.fillOpacity < 100 && <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '8px 8px', backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px', zIndex: -1}}/>}
                                <input type="color" value={singleSelectedElement.fill} onChange={(e) => updateSelected({fill: e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150" />
                             </div>
                             <input type="text" value={singleSelectedElement.fill.toUpperCase()} onChange={(e) => updateSelected({fill: e.target.value})} className="flex-1 bg-transparent border border-transparent hover:border-[#383838] focus:border-[#9cf822] rounded px-1.5 py-1 text-[11px] uppercase font-mono outline-none w-16" />
                             <input type="number" value={singleSelectedElement.fillOpacity} onChange={(e) => updateSelected({fillOpacity: Number(e.target.value) || 0})} className="w-10 bg-transparent border border-transparent hover:border-[#383838] focus:border-[#9cf822] rounded px-1.5 py-1 text-[11px] text-right outline-none" /><span className="text-[10px] text-zinc-500">%</span>
                             <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => updateSelected({fillOpacity: singleSelectedElement.fillOpacity === 0 ? 100 : 0})} className="p-1 text-zinc-400 hover:text-white">{singleSelectedElement.fillOpacity === 0 ? <EyeOff size={12}/> : <Eye size={12}/>}</button><button className="p-1 text-zinc-400 hover:text-white"><Minus size={12}/></button></div>
                          </div>
                        </div>
                      )}

                      {singleSelectedElement.type !== 'image' && (
                        <div className="p-3 border-b border-[#383838]">
                          <div className="flex items-center justify-between group cursor-pointer mb-2"><span className="text-[11px] font-medium">Stroke</span><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button className="p-1 hover:bg-[#383838] rounded text-zinc-400 hover:text-white" onClick={() => updateSelected({stroke: '#000000', strokeWidth: 1})}><Plus size={12}/></button></div></div>
                          {singleSelectedElement.stroke && singleSelectedElement.stroke !== 'transparent' && singleSelectedElement.strokeWidth > 0 ? (
                            <>
                              <div className="flex items-center gap-2 group mb-2">
                                 <div className="w-4 h-4 rounded-sm border border-[#444] cursor-pointer shadow-sm relative overflow-hidden flex-shrink-0" style={{ background: singleSelectedElement.stroke }}><input type="color" value={singleSelectedElement.stroke} onChange={(e) => updateSelected({stroke: e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150" /></div>
                                 <input type="text" value={singleSelectedElement.stroke.toUpperCase()} onChange={(e) => updateSelected({stroke: e.target.value})} className="flex-1 bg-transparent border border-transparent hover:border-[#383838] focus:border-[#9cf822] rounded px-1.5 py-1 text-[11px] uppercase font-mono outline-none w-16" />
                                 <div className="w-10 text-right text-[11px]">100%</div>
                                 <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity"><button className="p-1 text-zinc-400 hover:text-white"><Eye size={12}/></button><button className="p-1 text-zinc-400 hover:text-white" onClick={() => updateSelected({strokeWidth: 0})}><Minus size={12}/></button></div>
                              </div>
                              <div className="flex items-center gap-2 pl-6">
                                <div className="flex items-center gap-2 bg-transparent border border-transparent hover:border-[#383838] px-1.5 py-1 rounded w-16 cursor-text"><Minus size={10} className="text-zinc-500"/><input type="number" value={singleSelectedElement.strokeWidth} onChange={(e) => updateSelected({strokeWidth: Number(e.target.value) || 0})} className="bg-transparent text-[11px] w-full outline-none" /></div>
                                <div className="flex items-center justify-between border border-transparent hover:border-[#383838] px-2 py-1 rounded cursor-pointer group w-16"><span className="text-[11px]">Inside</span><ChevronDown size={10} className="text-zinc-500 group-hover:text-white" /></div><button className="p-1 hover:bg-[#383838] rounded ml-auto text-zinc-400"><MoreHorizontal size={12}/></button>
                              </div>
                            </>
                          ) : ( <div className="text-[10px] text-zinc-500 pl-1">No strokes applied.</div> )}
                        </div>
                      )}

                      <div className="p-3">
                        <div className="text-[11px] font-medium mb-3">Export</div>
                        <div className="flex gap-2 mb-3">
                           <div className="flex items-center justify-between border border-[#383838] hover:border-[#555] px-2 py-1.5 rounded cursor-pointer group w-16 bg-[#1E1E1E] relative"><span className="text-[11px]">{exportScale}x</span><ChevronDown size={10} className="text-zinc-500 group-hover:text-white" /><select className="absolute opacity-0 inset-0 cursor-pointer" value={exportScale} onChange={(e) => setExportScale(Number(e.target.value))}><option value={1}>1x</option><option value={2}>2x</option><option value={3}>3x</option><option value={4}>4x</option></select></div>
                           <div className="flex-1 flex items-center justify-between border border-[#383838] hover:border-[#555] px-2 py-1.5 rounded cursor-pointer group bg-[#1E1E1E] relative"><span className="text-[11px]">{exportFormat}</span><ChevronDown size={10} className="text-zinc-500 group-hover:text-white" /><select className="absolute opacity-0 inset-0 cursor-pointer" value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)}><option value="PNG">PNG</option><option value="JPG">JPG</option><option value="SVG">SVG</option></select></div>
                        </div>
                        <button onClick={handleExport} disabled={isExporting} className="w-full py-1.5 bg-[#1E1E1E] hover:bg-[#383838] text-white rounded text-[11px] font-medium transition-colors border border-[#383838] flex justify-center items-center gap-2">{isExporting ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12}/>} Export {singleSelectedElement.name}</button>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 p-6"><MousePointer2 size={24} className="mb-4 opacity-20"/><p className="text-[11px]">Select a layer to view properties.</p></div>
                  )}
                </>
              )}
            </aside>
          </div>
        )}
      </div>

      {/* CHAT INTERFACE */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[10000] flex justify-end bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md bg-white dark:bg-[#0a0a0a] h-full shadow-2xl flex flex-col relative animate-in slide-in-from-right duration-300 border-l border-zinc-200 dark:border-zinc-900">
            <ChatWallpaper />
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-900 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md relative z-20">
              <div><h3 className="text-sm font-bold text-black dark:text-white flex items-center gap-2"><Zap size={16} className="text-[#9cf822] fill-[#9cf822]" /> Team Sync</h3><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{team.length + 1} Members</p></div>
              <button onClick={() => setIsChatOpen(false)} className="p-2 text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 rounded-full transition-colors"><X size={16} /></button>
            </div>
            {pinnedMessage && (
               <div className="px-6 py-3 bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 relative z-10 shadow-sm">
                 <div className="flex items-center gap-3 overflow-hidden"><Pin size={14} className="text-[#9cf822] fill-[#9cf822]/20 shrink-0" /><div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-black dark:text-white truncate">Pinned by Lead</p><p className="text-xs text-zinc-600 dark:text-zinc-400 truncate mt-0.5">{pinnedMessage.content || 'Attached a file'}</p></div></div>
               </div>
            )}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50"><MessageSquare size={48} className="text-zinc-300 dark:text-zinc-700 mb-4" strokeWidth={1} /><p className="text-sm font-medium text-black dark:text-white">Workspace initialized.</p></div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.user_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex gap-3 max-w-[85%] group ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-100 dark:border-zinc-900">{msg.profiles?.avatar_url ? <img src={msg.profiles.avatar_url} className="w-full h-full object-cover" alt="User" /> : <User size={14} className="m-auto mt-2 text-zinc-500" />}</div>
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} relative`}>
                        <div className={`p-4 rounded-2xl text-sm mt-1 ${isMe ? 'bg-[#9cf822] text-black rounded-tr-sm' : 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white rounded-tl-sm border border-zinc-200 dark:border-zinc-800'}`}>
                          {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                          {msg.attachment_url && (<div className="mt-2">{msg.attachment_type === 'image' ? <img src={msg.attachment_url} className="w-full max-w-[200px] rounded-xl cursor-pointer hover:opacity-90" onClick={() => setSelectedMedia(msg.attachment_url)} alt="Attachment" /> : <a href={msg.attachment_url} target="_blank" className="font-bold underline text-xs">Download File</a>}</div>)}
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
    <button onClick={onClick} className={`p-1.5 rounded transition-all group relative ${active ? 'bg-[#9cf822] text-black' : 'text-zinc-400 hover:text-white hover:bg-[#383838]'}`}>
      {icon}
      <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[9px] text-white font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] shadow-xl">{tip}</span>
    </button>
  );
}

function FigmaInput({ icon, value, onChange }: any) {
  return (
    <div className="flex items-center gap-1.5 border border-transparent hover:border-[#383838] focus-within:border-[#9cf822] rounded px-1.5 py-1 transition-colors cursor-text group">
      <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 w-3 flex-shrink-0 flex items-center justify-center">{icon}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent text-[11px] outline-none w-full text-white" />
    </div>
  );
}

function TemplateCard({ name, size, icon, onClick }: any) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center justify-center p-6 bg-[#2C2C2C] border border-[#383838] hover:border-[#9cf822] rounded-lg transition-all duration-300 text-left w-full">
      <div className="h-12 flex items-center justify-center text-zinc-500 group-hover:text-[#9cf822] transition-colors mb-3 group-hover:scale-110 duration-300">{icon}</div>
      <span className="text-[13px] font-medium text-white w-full text-center">{name}</span>
      <span className="text-[10px] text-zinc-500 w-full text-center mt-0.5">{size}</span>
    </button>
  );
}