'use client';

import React, { useEffect, useState, useRef, use, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Loader2, ArrowLeft, Users, Zap, 
  Layout, Circle, Clock, Plus, Minus,
  User, PencilRuler, Upload,
  Maximize, Minimize, Image as ImageIcon,
  MousePointer2, Square, Type as TypeIcon, PenTool, 
  Layers, Eye, EyeOff, Lock as LockIcon, Unlock,
  Hand, Save, MoveUp, MoveDown, Scissors,
  Link2, Monitor, Smartphone, LayoutGrid, Home,
  AlignLeft, AlignCenter, AlignRight, ChevronDown, 
  MoreHorizontal, Grid, ZoomIn, ZoomOut, Copy
} from 'lucide-react';

type ElementType = 'rectangle' | 'ellipse' | 'text' | 'path' | 'frame' | 'image' | 'arrow' | 'line' | 'draw';

interface CanvasElement {
  id: string;
  name: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number; 
  fill: string;
  fillOpacity: number;
  fillType?: 'solid' | 'gradient';
  gradientColors?: [string, string];
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
  points?: { x: number, y: number }[]; 
  shadowEnabled?: boolean;
  shadowType?: 'drop' | 'glow' | 'none'; 
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
}

interface CursorData {
  x: number;
  y: number;
  name: string;
  color: string;
  lastSeen: number;
}

const DESIGN_TOOLS = [
  { id: 'select', icon: MousePointer2, tip: 'Move (V)', key: 'v' },
  { id: 'frame', icon: Layout, tip: 'Artboard (F)', key: 'f' },
  { id: 'rectangle', icon: Square, tip: 'Rectangle (R)', key: 'r' },
  { id: 'ellipse', icon: Circle, tip: 'Ellipse (O)', key: 'o' },
  { id: 'line', icon: Minus, tip: 'Line (L)', key: 'l' },
  { id: 'text', icon: TypeIcon, tip: 'Text (T)', key: 't' },
  { id: 'draw', icon: PenTool, tip: 'Draw (P)', key: 'p' }, 
  { id: 'hand', icon: Hand, tip: 'Hand (H)', key: 'h' }
] as const;

type ToolId = typeof DESIGN_TOOLS[number]['id'] | 'image';

export default function LabXPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [colabView, setColabView] = useState<'home' | 'canvas'>('home');
  const [homeSidebarView, setHomeSidebarView] = useState<'home' | 'recent' | 'shared'>('home');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  
  const [exportFormat, setExportFormat] = useState<'PNG' | 'JPG' | 'SVG'>('PNG');
  const [exportScale, setExportScale] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const lastCursorUpdate = useRef(0);

  const [project, setProject] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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

  const myColor = useMemo(() => {
    if (!user) return '#9cf822';
    let hash = 0;
    for (let i = 0; i < user.id.length; i++) { hash = user.id.charCodeAt(i) + ((hash << 5) - hash); }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  }, [user]);

  // AUTO-SAVE ENGINE
  useEffect(() => {
    if (!projectId || elements.length === 0 || loading) return;
    const timer = setTimeout(() => {
      supabase.from('projects').update({ canvas_data: elements }).eq('id', projectId);
    }, 2000);
    return () => clearTimeout(timer);
  }, [elements, projectId, supabase, loading]);

  // REALTIME ENGINE
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

  const handleUndo = useCallback(() => {
    if (past.length) { 
      const p = past[past.length - 1]; 
      setPast(prev => prev.slice(0, prev.length - 1)); 
      setFuture(f => [elements, ...f]); 
      setElements(p); broadcastElements(p); 
    }
  }, [past, elements, broadcastElements]);

  const handleRedo = useCallback(() => {
    if (future.length) { 
      const n = future[0]; 
      setFuture(f => f.slice(1)); 
      setPast(p => [...p, elements]); 
      setElements(n); broadcastElements(n); 
    }
  }, [future, elements, broadcastElements]);

  // CLIPBOARD ENGINE
  const handleCopy = useCallback(() => { const selected = elements.filter(el => selectedIds.includes(el.id)); if (selected.length > 0) setClipboard(selected); }, [elements, selectedIds]);
  const handleCut = useCallback(() => { handleCopy(); pushToHistory(elements.filter(el => !selectedIds.includes(el.id))); setSelectedIds([]); }, [elements, selectedIds, handleCopy, pushToHistory]);
  
  const handlePaste = useCallback(() => {
    if (clipboard.length === 0) return;
    const newIds: string[] = [];
    const pasted = clipboard.map(el => {
      const newId = `el_${Math.random().toString(36).substr(2, 9)}`; newIds.push(newId);
      return { ...el, id: newId, x: el.x + 20, y: el.y + 20 };
    });
    pushToHistory([...elements, ...pasted]); setSelectedIds(newIds);
  }, [clipboard, elements, pushToHistory]);

  const handleDuplicate = useCallback(() => {
    if (selectedIds.length === 0) return;
    const selected = elements.filter(el => selectedIds.includes(el.id));
    const newIds: string[] = [];
    const duplicated = selected.map(el => {
      const newId = `el_${Math.random().toString(36).substr(2, 9)}`; newIds.push(newId);
      return { ...el, id: newId, x: el.x + 20, y: el.y + 20 };
    });
    pushToHistory([...elements, ...duplicated]); setSelectedIds(newIds);
  }, [selectedIds, elements, pushToHistory]);


  useEffect(() => {
    async function fetchLabData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return router.push('/login');
      setUser(authUser);
      const { data: projectData } = await supabase.from('projects').select('*, profiles:user_id(full_name, avatar_url, role)').eq('id', projectId).single();
      if (!projectData) return router.push('/dashboard');
      
      const { data: collaborators } = await supabase.from('collaborations').select('*, profiles:user_id(full_name, avatar_url, role)').eq('project_id', projectId).eq('status', 'accepted');
      if (projectData.canvas_data && Array.isArray(projectData.canvas_data) && projectData.canvas_data.length > 0) setElements(projectData.canvas_data);
      
      setProject(projectData); setTeam(collaborators || []); setLoading(false);
    }
    fetchLabData();
  }, [projectId, supabase, router]);

  // KEYBOARD & PASTE SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (colabView !== 'canvas') return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const tool = DESIGN_TOOLS.find(t => t.key === e.key);
      if (tool && !e.ctrlKey && !e.metaKey) setActiveTool(tool.id);
      
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key === 'c') { e.preventDefault(); handleCopy(); }
        if (e.key === 'x') { e.preventDefault(); handleCut(); }
        if (e.key === 'v') { if(clipboard.length > 0) { e.preventDefault(); handlePaste(); } }
        if (e.key === 'z') { e.preventDefault(); if (e.shiftKey) handleRedo(); else handleUndo(); }
        if (e.key === 'y') { e.preventDefault(); handleRedo(); }
        if (e.key === 'd') { e.preventDefault(); handleDuplicate(); }
        if (e.key === 's') { e.preventDefault(); handleSaveDesign(); }
      } else {
        if (e.key === 'Backspace' || e.key === 'Delete') { pushToHistory(elements.filter(el => !selectedIds.includes(el.id))); setSelectedIds([]); }
        if (e.key === '[') { e.preventDefault(); handleSendToBack(); }
        if (e.key === ']') { e.preventDefault(); handleBringToFront(); }
      }
    };

    const handlePasteEvent = (e: ClipboardEvent) => {
      if (colabView !== 'canvas') return;
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
  }, [colabView, selectedIds, elements, clipboard, handleCopy, handleCut, handlePaste, handleDuplicate, handleUndo, handleRedo, pushToHistory]);


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

       const newImg: CanvasElement = { 
          id: tempId, name: `Image ${file.name.substring(0, 10)}`, type: 'image', x, y, width: w, height: h, opacity: 100,
          fill: 'transparent', fillOpacity: 100, stroke: 'transparent', strokeWidth: 0, cornerRadius: 0, 
          isVisible: true, isLocked: false, imageUrl: localUrl,
          shadowEnabled: false, shadowType: 'none', shadowColor: '#000000', shadowBlur: 10, shadowOffsetX: 5, shadowOffsetY: 5, shadowOpacity: 50
       };
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
    if (colabView !== 'canvas') return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       const file = e.dataTransfer.files[0];
       if (file.type.startsWith('image/')) processImageFile(file, e.clientX, e.clientY);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault(); 

  const handleGroup = () => {
    if (selectedIds.length < 2) return;
    const newGroupId = `group_${Date.now()}`;
    pushToHistory(elements.map(el => selectedIds.includes(el.id) ? { ...el, groupId: newGroupId } : el));
  };

  const handleUngroup = () => {
    if (!selectedIds.length) return;
    pushToHistory(elements.map(el => selectedIds.includes(el.id) ? { ...el, groupId: undefined } : el));
  };

  const handleBringToFront = () => pushToHistory([...elements.filter(el => !selectedIds.includes(el.id)), ...elements.filter(el => selectedIds.includes(el.id))]);
  const handleSendToBack = () => pushToHistory([...elements.filter(el => selectedIds.includes(el.id)), ...elements.filter(el => !selectedIds.includes(el.id))]);

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
    const minX = Math.min(...s.map(el => (el.type === 'draw' && el.points ? Math.min(...el.points.map(p=>p.x)) : el.x))); 
    const minY = Math.min(...s.map(el => (el.type === 'draw' && el.points ? Math.min(...el.points.map(p=>p.y)) : el.y)));
    const maxX = Math.max(...s.map(el => (el.type === 'draw' && el.points ? Math.max(...el.points.map(p=>p.x)) : el.x + el.width))); 
    const maxY = Math.max(...s.map(el => (el.type === 'draw' && el.points ? Math.max(...el.points.map(p=>p.y)) : el.y + el.height)));
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

      // Bypass CORS by converting external images to base64 before export
      const imageTags = clone.querySelectorAll('image');
      for (let i = 0; i < imageTags.length; i++) {
         const href = imageTags[i].getAttribute('href');
         if (href && href.startsWith('http')) {
            try {
               const res = await fetch(href);
               const blob = await res.blob();
               const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
               });
               imageTags[i].setAttribute('href', base64);
            } catch (e) {
               console.warn("Skipping external image export due to CORS", e);
            }
         }
      }

      const svgData = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const fileName = `export-${Date.now()}`;

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
    const newFrame: CanvasElement = { id: `el_${Date.now()}`, name: finalName, type: 'frame', x: 100, y: 100, width: finalW, height: finalH, fill: '#ffffff', fillOpacity: 100, opacity: 100, stroke: 'transparent', strokeWidth: 0, cornerRadius: 0, isVisible: true, isLocked: false, fontFamily: 'Inter', fontWeight: 'Normal', textAlign: 'left' };
    pushToHistory([...elements, newFrame]); setColabView('canvas'); setActiveTool('select');
  };

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
    } else if (activeTool === 'draw') {
      const newId = `el_${Date.now()}`;
      pushToHistory([...elements, { 
         id: newId, name: 'Path', type: 'draw', x, y, width: 0, height: 0, opacity: 100, 
         fill: 'transparent', fillOpacity: 100, stroke: '#ffffff', strokeWidth: 2, cornerRadius: 0, 
         isVisible: true, isLocked: false, points: [{x, y}]
      }]);
      setSelectedIds([newId]);
      setDragState({ action: 'drawing', id: newId });
    } else if (activeTool !== 'select' && activeTool !== 'image') {
      const isFrame = activeTool === 'frame';
      const containingFrame = isFrame ? undefined : [...elements].reverse().find(f => f.type === 'frame' && x >= f.x && x <= (f.x + f.width) && y >= f.y && y <= (f.y + f.height));
      pushToHistory([...elements, { 
         id: `el_${Date.now()}`, name: activeTool.charAt(0).toUpperCase() + activeTool.slice(1), type: activeTool as any, 
         x, y, width: isFrame ? 400 : (activeTool === 'line' ? 100 : 100), height: isFrame ? 300 : (activeTool === 'line' ? 2 : 100), opacity: 100,
         fill: (isFrame || activeTool === 'line') ? '#ffffff' : '#d4d4d8', fillOpacity: 100, fillType: 'solid', gradientColors: ['#9cf822', '#1E1E1E'],
         stroke: activeTool === 'line' ? '#ffffff' : 'transparent', strokeWidth: activeTool === 'line' ? 2 : 0, cornerRadius: 0, 
         isVisible: true, isLocked: false, text: activeTool === 'text' ? 'New Text' : undefined, fontSize: activeTool === 'text' ? 24 : undefined, 
         fontFamily: 'Inter', fontWeight: 'Normal', textAlign: 'left', frameId: containingFrame ? containingFrame.id : undefined,
         shadowEnabled: false, shadowType: 'none', shadowColor: '#000000', shadowBlur: 10, shadowOffsetX: 5, shadowOffsetY: 5, shadowOpacity: 50
      }]);
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

    if (dragState.action === 'drawing') {
      setElements(prev => prev.map(el => el.id === dragState.id ? { ...el, points: [...(el.points || []), {x, y}] } : el));
      return;
    }

    if (!dragState.hasDragged) setDragState({ ...dragState, hasDragged: true });

    if (dragState.action === 'moving') {
      let dx = x - dragState.startX;
      let dy = y - dragState.startY;

      const activeLines: Array<{type: 'v'|'h', val: number, start: number, end: number}> = [];
      const SNAP_TOLERANCE = 5 / canvasTransform.scale;
      
      if (selectedIds.length === 1 && !e.shiftKey) {
        const primaryEl = dragState.originalElements.find((el: CanvasElement) => el.id === selectedIds[0]);
        if (primaryEl && primaryEl.type !== 'arrow' && primaryEl.type !== 'draw') {
          let tempCX = primaryEl.x + dx + primaryEl.width / 2;
          let tempCY = primaryEl.y + dy + primaryEl.height / 2;

          dragState.originalElements.forEach((target: CanvasElement) => {
            if (target.id === primaryEl.id || !target.isVisible || target.type === 'arrow' || target.type === 'draw') return;
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

      const updated = dragState.originalElements.map((el: CanvasElement) => {
        if (allMovingIds.includes(el.id)) {
           if (el.type === 'draw' && el.points) {
              return { ...el, points: el.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
           }
           return { ...el, x: el.x + dx, y: el.y + dy };
        }
        return el;
      });
      setElements(updated); broadcastElements(updated);
    } 
    else if (dragState.action === 'resizing' && dragState.handle && appMode === 'design') {
      const dx = x - dragState.startX; const dy = y - dragState.startY;
      const updated = dragState.originalElements.map((el: CanvasElement) => {
        if (!selectedIds.includes(el.id)) return el;
        if (el.type === 'draw') return el; 
        
        let newX = el.x, newY = el.y, newW = el.width, newH = el.height;
        const handle = dragState.handle!;
        const ratio = el.width / el.height;

        if (handle.includes('e')) newW = Math.max(10, el.width + dx);
        if (handle.includes('s')) newH = Math.max(10, el.height + dy);
        if (handle.includes('w')) { newW = Math.max(10, el.width - dx); if (newW > 10) newX = el.x + dx; }
        if (handle.includes('n')) { newH = Math.max(10, el.height - dy); if (newH > 10) newY = el.y + dy; }

        // Proportional Shift-Resizing
        if (e.shiftKey) {
            if (Math.abs(dx) > Math.abs(dy)) {
               const tempH = newW / ratio;
               if (handle.includes('n')) newY = el.y + (el.height - tempH);
               newH = tempH;
            } else {
               const tempW = newH * ratio;
               if (handle.includes('w')) newX = el.x + (el.width - tempW);
               newW = tempW;
            }
        }

        return { ...el, x: newX, y: newY, width: newW, height: newH, fontSize: el.type === 'text' && el.fontSize && el.height ? Math.max(8, el.fontSize * (newH / el.height)) : el.fontSize };
      });
      setElements(updated); broadcastElements(updated);
    }
  };

  const handlePointerUp = () => {
    setSnapLines([]); 
    
    if (dragState?.action === 'drawing') {
      setActiveTool('select');
      setPast(prev => [...prev, elements]); setFuture([]); broadcastElements(elements);
      setDragState(null);
      return;
    }

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
               const centerX = el.type === 'draw' && el.points ? el.points[0].x : el.x + el.width / 2; 
               const centerY = el.type === 'draw' && el.points ? el.points[0].y : el.y + el.height / 2;
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
          {el.isMask ? <Scissors size={10} className="text-[#9cf822]" /> : el.type === 'text' ? <TypeIcon size={10}/> : el.type === 'image' ? <ImageIcon size={10}/> : el.type === 'frame' ? <Layout size={10}/> : el.type === 'line' ? <Minus size={10}/> : el.type === 'draw' ? <PenTool size={10}/> : <Square size={10}/>}
          <span className={`truncate flex-grow ${el.type === 'frame' ? 'font-bold text-white' : ''} ${el.isLocked ? 'text-zinc-500 line-through decoration-zinc-600' : ''}`}>{el.name} {el.groupId && <span className="opacity-50 ml-1 text-[9px]">(Grouped)</span>}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); updateSelected({isLocked: !el.isLocked}); }} className="p-1 hover:text-white">
             {el.isLocked ? <LockIcon size={12} className="text-[#9cf822]" /> : <Unlock size={12} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); pushToHistory(elements.map(item => item.id === el.id ? {...item, isVisible: !item.isVisible} : item)); }} className="p-1 hover:text-white">
            {el.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        </div>
      </div>
    );
  };

  const getShadowStyle = (el: CanvasElement) => {
    if (!el.shadowEnabled) return {};
    const hex = el.shadowColor || '#000000';
    const r = parseInt(hex.slice(1, 3) || '00', 16);
    const g = parseInt(hex.slice(3, 5) || '00', 16);
    const b = parseInt(hex.slice(5, 7) || '00', 16);
    const a = (el.shadowOpacity ?? 50) / 100;
    return { filter: `drop-shadow(${el.shadowOffsetX || 0}px ${el.shadowOffsetY || 0}px ${el.shadowBlur || 0}px rgba(${r},${g},${b},${a}))` };
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#1E1E1E]"><Loader2 className="animate-spin text-[#9cf822]" /></div>;

  const bounds = getSelectionBounds();
  const isMultiSelect = selectedIds.length > 1;
  const selectedElementsList = elements.filter(el => selectedIds.includes(el.id));
  const activeSelectedElement = selectedElementsList.length > 0 ? selectedElementsList[0] : null;
  const allSelectedAreText = selectedElementsList.length > 0 && selectedElementsList.every(el => el.type === 'text');

  return (
    <div className={`transition-colors duration-300 flex flex-col font-sans ${isFullscreen ? 'fixed inset-0 z-[9999] bg-[#1E1E1E]' : 'h-screen'} bg-[#1E1E1E] text-zinc-300 selection:bg-[#9cf822]/30 overflow-hidden`}>
      
      {colabView === 'canvas' && (
        <header className="h-11 bg-[#2C2C2C] border-b border-[#383838] flex items-center justify-between px-4 shrink-0 z-50">
          <div className="flex items-center gap-3 w-[240px]">
            <div className="flex items-center gap-1.5">
              <img 
                src="/lab x.png" 
                className="w-6 h-6 hover:opacity-80 transition-opacity object-contain cursor-pointer" 
                alt="Lab X" 
                onClick={() => router.push(`/workspace/${projectId}`)}
                title="Back to Workspace"
              />
              <button 
                onClick={() => setColabView('home')} 
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#383838] rounded transition-colors" 
                title="Go to Home"
              >
                <Home size={16} />
              </button>
            </div>
            <div className="h-3 w-px bg-[#383838]" />
            <div className="text-xs font-medium text-white flex items-center gap-2 cursor-pointer hover:bg-[#383838] px-2 py-1 rounded truncate">
              {project?.title} 
              <span className="text-zinc-500">/</span> 
              <span className="opacity-80">Lab X</span> 
              <ChevronDown size={12} className="text-zinc-500"/>
              <div className="flex items-center gap-1 ml-2 bg-[#9cf822]/10 px-1.5 py-0.5 rounded border border-[#9cf822]/20 text-[#9cf822]"><div className="w-1.5 h-1.5 rounded-full bg-[#9cf822] animate-pulse"></div><span className="text-[9px] uppercase tracking-wider font-bold">Live</span></div>
            </div>
          </div>

          <div className="flex items-center justify-center flex-1 gap-4">
             <div className="flex bg-[#1E1E1E] rounded-md p-0.5 border border-[#383838]">
                <button onClick={() => setAppMode('design')} className={`px-3 py-1 text-[11px] font-bold rounded-sm transition-colors ${appMode === 'design' ? 'bg-[#383838] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Design</button>
                <button onClick={() => setAppMode('prototype')} className={`px-3 py-1 text-[11px] font-bold rounded-sm transition-colors flex items-center gap-1 ${appMode === 'prototype' ? 'bg-[#383838] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><Zap size={10} className={appMode === 'prototype' ? 'text-[#3b82f6] fill-[#3b82f6]' : ''}/> Prototype</button>
             </div>

             {appMode === 'design' && (
               <div className="flex items-center gap-0.5 border-l border-[#383838] pl-4">
                 {DESIGN_TOOLS.map(tool => (
                   <ToolBtn key={tool.id} icon={<tool.icon size={14}/>} active={activeTool === tool.id} onClick={() => setActiveTool(tool.id)} tip={tool.tip} />
                 ))}
               </div>
             )}
          </div>

          <div className="flex items-center justify-end gap-3 w-[300px]">
            <div className="flex items-center bg-[#1E1E1E] rounded border border-[#383838] p-0.5 text-zinc-400 mr-2">
               <button onClick={() => setCanvasTransform(p => ({...p, scale: Math.max(0.1, p.scale - 0.2)}))} className="p-1 hover:text-white transition-colors"><ZoomOut size={12}/></button>
               <span className="text-[10px] font-bold px-2 w-10 text-center">{Math.round(canvasTransform.scale * 100)}%</span>
               <button onClick={() => setCanvasTransform(p => ({...p, scale: Math.min(5, p.scale + 0.2)}))} className="p-1 hover:text-white transition-colors"><ZoomIn size={12}/></button>
            </div>
            
            <div className="flex items-center gap-2 mr-2">
               {team.slice(0, 3).map((m, i) => (
                 <div key={i} className="w-6 h-6 rounded-full bg-[#18181b] border border-[#383838] overflow-hidden">
                    {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} className="w-full h-full object-cover"/> : <User size={12} className="m-auto mt-1.5 text-zinc-500" />}
                 </div>
               ))}
            </div>
            <div className="w-px h-4 bg-[#383838]"></div>
            <button onClick={() => setShowGrid(!showGrid)} className={`p-1 rounded transition-colors ${showGrid ? 'text-[#9cf822]' : 'text-zinc-400 hover:text-white'}`}><Grid size={14} /></button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1 text-zinc-400 hover:text-white rounded transition-colors">{isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}</button>
            <button onClick={handleSaveDesign} disabled={isSaving} className="p-1 text-zinc-400 hover:text-[#9cf822] rounded transition-colors disabled:opacity-50">{isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}</button>
          </div>
        </header>
      )}

      {colabView === 'home' && (
        <div className="flex-grow flex bg-[#1E1E1E] text-zinc-300 relative h-full">
          <div className="w-60 bg-[#2C2C2C] border-r border-[#383838] flex flex-col p-4 hidden md:flex shrink-0">
            <div className="flex items-center gap-3 mb-8 cursor-pointer px-2" onClick={() => router.push(`/workspace/${projectId}`)}>
              <img src="/lab x.png" className="w-6 h-6 hover:opacity-80 transition-opacity object-contain" alt="Lab X" />
            </div>

            <div className="space-y-0.5">
               <button onClick={() => setHomeSidebarView('home')} className={`w-full flex items-center gap-3 px-2 py-2 rounded text-sm font-medium transition-colors ${homeSidebarView === 'home' ? 'bg-[#383838] text-white' : 'text-zinc-400 hover:text-white hover:bg-[#383838]/50'}`}><Home size={16}/> Home</button>
               <button onClick={() => setHomeSidebarView('recent')} className={`w-full flex items-center gap-3 px-2 py-2 rounded text-sm font-medium transition-colors ${homeSidebarView === 'recent' ? 'bg-[#383838] text-white' : 'text-zinc-400 hover:text-white hover:bg-[#383838]/50'}`}><Clock size={16}/> Recent</button>
               <button onClick={() => setHomeSidebarView('shared')} className={`w-full flex items-center gap-3 px-2 py-2 rounded text-sm font-medium transition-colors ${homeSidebarView === 'shared' ? 'bg-[#383838] text-white' : 'text-zinc-400 hover:text-white hover:bg-[#383838]/50'}`}><Users size={16}/> Shared with you</button>
            </div>
            <div className="mt-auto"><button onClick={() => router.push(`/workspace/${projectId}`)} className="w-full flex items-center justify-center gap-2 px-2 py-2 border border-[#383838] text-zinc-400 hover:text-white hover:bg-[#383838]/50 rounded text-sm font-medium transition-colors"><ArrowLeft size={16}/> Back to Workspace</button></div>
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

      {colabView === 'canvas' && (
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
                {elements.filter(e => e.fillType === 'gradient' && e.gradientColors).map(gradEl => (
                   <linearGradient id={`grad_${gradEl.id}`} key={`grad_${gradEl.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={gradEl.gradientColors![0]} />
                      <stop offset="100%" stopColor={gradEl.gradientColors![1]} />
                   </linearGradient>
                ))}
              </defs>

              <g data-transform-wrapper="true" transform={`matrix(${canvasTransform.scale}, 0, 0, ${canvasTransform.scale}, ${canvasTransform.x}, ${canvasTransform.y})`}>
                {elements.map(el => {
                  if (!el.isVisible || el.type === 'arrow') return null; 
                  const isSelected = selectedIds.includes(el.id);
                  const isEditing = editingTextId === el.id;
                  
                  if (el.type === 'frame') {
                     return (
                       <g key={el.id} opacity={(el.opacity ?? 100) / 100}>
                         <text x={el.x} y={el.y - 8} fontSize={12 / canvasTransform.scale} fill="#a1a1aa" fontWeight="600" className="select-none pointer-events-none">{el.name}</text>
                         <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill} filter="url(#artboard-shadow)" stroke={isSelected ? '#9cf822' : 'transparent'} strokeWidth={isSelected ? 2/canvasTransform.scale : 0} onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''}/>
                       </g>
                     );
                  }

                  const dynamicFill = el.fillType === 'gradient' ? `url(#grad_${el.id})` : el.fill;

                  return (
                    <g key={el.id} clipPath={el.frameId ? `url(#clip_frame_${el.frameId})` : undefined} style={getShadowStyle(el)} opacity={(el.opacity ?? 100) / 100}>
                      <g opacity={el.fillOpacity / 100} clipPath={el.clipMaskId ? `url(#clip_${el.clipMaskId})` : undefined}>
                        {el.type === 'rectangle' && <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={dynamicFill} rx={el.cornerRadius} stroke={el.stroke} strokeWidth={el.strokeWidth} strokeDasharray={el.strokeDasharray} onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''}/>}
                        {el.type === 'ellipse' && <ellipse cx={el.x + el.width/2} cy={el.y + el.height/2} rx={el.width/2} ry={el.height/2} fill={dynamicFill} stroke={el.stroke} strokeWidth={el.strokeWidth} strokeDasharray={el.strokeDasharray} onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''} />}
                        {el.type === 'line' && <line x1={el.x} y1={el.y} x2={el.x + el.width} y2={el.y + el.height} stroke={el.stroke} strokeWidth={el.strokeWidth} strokeDasharray={el.strokeDasharray} onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''} />}
                        {el.type === 'draw' && el.points && el.points.length > 0 && (
                           <polyline points={el.points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={el.stroke} strokeWidth={el.strokeWidth} strokeLinecap="round" strokeLinejoin="round" onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''} />
                        )}
                        {el.type === 'text' && (
                           isEditing ? (
                              <foreignObject x={el.x} y={el.y} width={Math.max(300, el.width * 2)} height={(el.fontSize || 24) * 2} className="overflow-visible pointer-events-auto"><input autoFocus defaultValue={el.text} onPointerDown={(e) => e.stopPropagation()} onBlur={(e) => { updateSelected({text: e.target.value}); setEditingTextId(null); }} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); }} style={{ fontSize: el.fontSize, fontFamily: el.fontFamily, color: el.fill, background: 'transparent', outline: '1px solid #9cf822', border: 'none', margin: 0, padding: 0, width: '100%', lineHeight: 1, fontWeight: el.fontWeight, textAlign: el.textAlign }} /></foreignObject>
                           ) : (
                              <text x={el.x} y={el.y + (el.fontSize || 24) * 0.85} fill={dynamicFill} fontSize={el.fontSize} fontFamily={el.fontFamily} fontWeight={el.fontWeight} textAnchor={el.textAlign === 'center' ? 'middle' : el.textAlign === 'right' ? 'end' : 'start'} dx={el.textAlign === 'center' ? el.width/2 : el.textAlign === 'right' ? el.width : 0} onPointerDown={(e) => handleElementPointerDown(e, el)} onDoubleClick={(e) => { e.stopPropagation(); setEditingTextId(el.id); setActiveTool('select'); }} className="select-none cursor-default">{el.text}</text>
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

                {appMode === 'prototype' && activeSelectedElement && activeSelectedElement.type !== 'arrow' && (
                   <g transform={`translate(${activeSelectedElement.x + activeSelectedElement.width + 10}, ${activeSelectedElement.y + activeSelectedElement.height / 2})`} className="cursor-pointer prototype-ui" onPointerDown={(e) => { e.stopPropagation(); setPrototypeDrag({ startId: activeSelectedElement.id, x: getCanvasCoords(e).x, y: getCanvasCoords(e).y }) }}>
                      <circle cx="0" cy="0" r="7" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                      <path d="M -3 0 L 3 0 M 0 -3 L 0 3" stroke="#ffffff" strokeWidth="1.5" />
                   </g>
                )}

                {snapLines.map((line, i) => (
                  line.type === 'v' 
                    ? <line key={`snap-v-${i}`} x1={line.val} y1={line.start} x2={line.val} y2={line.end} stroke="#ff3b30" strokeWidth={1/canvasTransform.scale} strokeDasharray="4" opacity={0.8} />
                    : <line key={`snap-h-${i}`} x1={line.start} y1={line.val} x2={line.end} y2={line.val} stroke="#ff3b30" strokeWidth={1/canvasTransform.scale} strokeDasharray="4" opacity={0.8} />
                ))}

                {appMode === 'design' && bounds && activeTool === 'select' && (
                  <g className="selection-ui">
                    <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill="none" stroke="#9cf822" strokeWidth={1.5 / canvasTransform.scale} pointerEvents="none" />
                    {!isMultiSelect && activeSelectedElement?.type !== 'draw' && (
                      <>
                        <rect onPointerDown={(e) => handleResizeHandleDown(e, 'nw')} x={bounds.x - 3/canvasTransform.scale} y={bounds.y - 3/canvasTransform.scale} width={6/canvasTransform.scale} height={6/canvasTransform.scale} fill="white" stroke="#9cf822" strokeWidth={1/canvasTransform.scale} className="cursor-nwse-resize" />
                        <rect onPointerDown={(e) => handleResizeHandleDown(e, 'ne')} x={bounds.x + bounds.width - 3/canvasTransform.scale} y={bounds.y - 3/canvasTransform.scale} width={6/canvasTransform.scale} height={6/canvasTransform.scale} fill="white" stroke="#9cf822" strokeWidth={1/canvasTransform.scale} className="cursor-nesw-resize" />
                        <rect onPointerDown={(e) => handleResizeHandleDown(e, 'sw')} x={bounds.x - 3/canvasTransform.scale} y={bounds.y + bounds.height - 3/canvasTransform.scale} width={6/canvasTransform.scale} height={6/canvasTransform.scale} fill="white" stroke="#9cf822" strokeWidth={1/canvasTransform.scale} className="cursor-nesw-resize" />
                        <rect onPointerDown={(e) => handleResizeHandleDown(e, 'se')} x={bounds.x + bounds.width - 3/canvasTransform.scale} y={bounds.y + bounds.height - 3/canvasTransform.scale} width={6/canvasTransform.scale} height={6/canvasTransform.scale} fill="white" stroke="#9cf822" strokeWidth={1/canvasTransform.scale} className="cursor-nwse-resize" />
                      </>
                    )}
                  </g>
                )}

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

          <aside className="w-[240px] bg-[#2C2C2C] border-l border-[#383838] overflow-y-auto z-20 shrink-0 text-white select-none pb-20">
            {appMode === 'prototype' ? (
               <div className="p-6 text-center text-zinc-500 h-full flex flex-col items-center justify-center">
                 <Zap size={32} className="mb-4 opacity-20 text-[#3b82f6]" />
                 <h3 className="text-white text-[13px] font-semibold mb-2">Prototype Mode</h3>
                 <p className="text-[11px] leading-relaxed">Select a frame or element, then drag the blue node to connect it to another screen.</p>
               </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 border-b border-[#383838] text-zinc-400">
                  <div className="flex gap-2"><button onClick={() => handleAlign('left')} className="hover:text-white transition-colors"><AlignLeft size={14}/></button><button onClick={() => handleAlign('center')} className="hover:text-white transition-colors"><AlignCenter size={14}/></button><button onClick={() => handleAlign('right')} className="hover:text-white transition-colors"><AlignRight size={14}/></button></div>
                  <div className="flex gap-2"><button onClick={() => handleAlign('top')} className="hover:text-white transition-colors rotate-90"><AlignLeft size={14}/></button><button onClick={() => handleAlign('middle')} className="hover:text-white transition-colors rotate-90"><AlignCenter size={14}/></button><button onClick={() => handleAlign('bottom')} className="hover:text-white transition-colors rotate-90"><AlignRight size={14}/></button></div>
                </div>

                {isMultiSelect && (
                  <div className="p-3 border-b border-[#383838] space-y-3">
                    <div className="text-[11px] font-medium text-white flex justify-between items-center">Multi-Selection <span className="bg-[#383838] px-2 py-0.5 rounded text-[10px]">{selectedIds.length}</span></div>
                    <div className="grid grid-cols-2 gap-2"><button onClick={handleGroup} className="py-1.5 bg-[#383838] hover:bg-[#444] rounded flex items-center justify-center gap-1.5 text-[10px] font-medium transition-colors"><Link2 size={12}/> Group</button><button onClick={handleMakeMask} className="py-1.5 bg-[#383838] hover:bg-[#444] rounded flex items-center justify-center gap-1.5 text-[10px] font-medium transition-colors"><Scissors size={12}/> Mask</button></div>
                  </div>
                )}

                {activeSelectedElement ? (
                  <>
                    <div className="p-3 border-b border-[#383838] space-y-3">
                       <div className="flex items-center justify-between text-[11px] font-medium">Layer Opacity <span className="text-zinc-500">{activeSelectedElement.opacity ?? 100}%</span></div>
                       <input type="range" min="0" max="100" value={activeSelectedElement.opacity ?? 100} onChange={(e) => updateSelected({opacity: Number(e.target.value)})} className="w-full h-1 bg-[#383838] rounded-lg appearance-none cursor-pointer accent-[#9cf822]" />
                       
                       <div className="flex gap-2 mt-2">
                          <button onClick={handleBringToFront} className="flex-1 py-1.5 bg-[#383838] hover:bg-[#444] rounded flex items-center justify-center gap-1.5 text-[10px] font-medium transition-colors"><MoveUp size={12}/> Bring Forward</button>
                          <button onClick={handleSendToBack} className="flex-1 py-1.5 bg-[#383838] hover:bg-[#444] rounded flex items-center justify-center gap-1.5 text-[10px] font-medium transition-colors"><MoveDown size={12}/> Send Back</button>
                       </div>
                    </div>

                    {!isMultiSelect && activeSelectedElement.type !== 'draw' && (
                      <div className="p-3 border-b border-[#383838]">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                           <FigmaInput icon="X" value={Math.round(activeSelectedElement.x)} onChange={(v: string) => updateSelected({x: Number(v)})} />
                           <FigmaInput icon="Y" value={Math.round(activeSelectedElement.y)} onChange={(v: string) => updateSelected({y: Number(v)})} />
                           <FigmaInput icon="W" value={Math.round(activeSelectedElement.width)} onChange={(v: string) => updateSelected({width: Math.max(1, Number(v) || 1)})} />
                           <FigmaInput icon="H" value={Math.round(activeSelectedElement.height)} onChange={(v: string) => updateSelected({height: Math.max(1, Number(v) || 1)})} />
                        </div>
                      </div>
                    )}

                    {(activeSelectedElement.type === 'rectangle' || activeSelectedElement.type === 'image' || activeSelectedElement.type === 'frame') && (
                       <div className="p-3 border-b border-[#383838] space-y-3">
                          <div className="flex items-center justify-between text-[11px] font-medium text-zinc-300">
                             Corner Radius
                             <span className="bg-[#1E1E1E] px-1.5 py-0.5 rounded border border-[#383838]">{activeSelectedElement.cornerRadius || 0}</span>
                          </div>
                          <input 
                             type="range" min="0" max={Math.min(activeSelectedElement.width, activeSelectedElement.height) / 2} 
                             value={activeSelectedElement.cornerRadius || 0} 
                             onChange={(e) => updateSelected({cornerRadius: Number(e.target.value)})} 
                             className="w-full h-1 bg-[#383838] rounded-lg appearance-none cursor-pointer accent-[#9cf822]" 
                          />
                       </div>
                    )}

                    {allSelectedAreText && (
                      <div className="p-3 border-b border-[#383838] space-y-2">
                         <div className="text-[11px] font-medium mb-2">Text Properties</div>
                         <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center justify-between border border-transparent hover:border-[#383838] px-2 py-1 rounded cursor-pointer group relative"><span className="text-[11px]">{activeSelectedElement.fontFamily}</span><ChevronDown size={12} className="text-zinc-500 group-hover:text-white" /><select className="absolute inset-0 opacity-0 cursor-pointer" value={activeSelectedElement.fontFamily} onChange={(e) => updateSelected({fontFamily: e.target.value})}><option value="Inter">Inter</option><option value="Arial">Arial</option><option value="Helvetica">Helvetica</option><option value="Times New Roman">Times New Roman</option></select></div>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center justify-between border border-transparent hover:border-[#383838] px-2 py-1 rounded cursor-pointer group relative"><span className="text-[11px]">{activeSelectedElement.fontWeight}</span><ChevronDown size={12} className="text-zinc-500 group-hover:text-white" /><select className="absolute inset-0 opacity-0 cursor-pointer" value={activeSelectedElement.fontWeight} onChange={(e) => updateSelected({fontWeight: e.target.value})}><option value="Normal">Normal</option><option value="Bold">Bold</option><option value="Bolder">Bolder</option><option value="Lighter">Lighter</option></select></div>
                            <FigmaInput icon={<TypeIcon size={12}/>} value={activeSelectedElement.fontSize || 16} onChange={(v: string) => updateSelected({fontSize: Number(v) || 16})} />
                         </div>
                         <div className="flex items-center gap-1 mt-2 text-zinc-400"><button onClick={() => updateSelected({textAlign: 'left'})} className={`p-1.5 rounded hover:text-white ${activeSelectedElement.textAlign === 'left' ? 'bg-[#383838] text-white' : ''}`}><AlignLeft size={12}/></button><button onClick={() => updateSelected({textAlign: 'center'})} className={`p-1.5 rounded hover:text-white ${activeSelectedElement.textAlign === 'center' ? 'bg-[#383838] text-white' : ''}`}><AlignCenter size={12}/></button><button onClick={() => updateSelected({textAlign: 'right'})} className={`p-1.5 rounded hover:text-white ${activeSelectedElement.textAlign === 'right' ? 'bg-[#383838] text-white' : ''}`}><AlignRight size={12}/></button></div>
                      </div>
                    )}

                    {activeSelectedElement.type !== 'image' && activeSelectedElement.type !== 'draw' && activeSelectedElement.type !== 'line' && (
                      <div className="p-3 border-b border-[#383838]">
                        <div className="flex items-center justify-between mb-3"><span className="text-[11px] font-medium">Fill</span></div>
                        <div className="flex gap-1 bg-[#1E1E1E] p-1 rounded border border-[#383838] mb-3">
                           <button onClick={() => updateSelected({fillType: 'solid'})} className={`flex-1 text-[10px] py-1 rounded transition-colors ${activeSelectedElement.fillType !== 'gradient' ? 'bg-[#383838] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Solid</button>
                           <button onClick={() => updateSelected({fillType: 'gradient'})} className={`flex-1 text-[10px] py-1 rounded transition-colors ${activeSelectedElement.fillType === 'gradient' ? 'bg-[#383838] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Gradient</button>
                        </div>
                        
                        {activeSelectedElement.fillType === 'gradient' ? (
                           <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2">
                               <div className="w-4 h-4 rounded-sm border border-[#444] cursor-pointer shadow-sm relative overflow-hidden flex-shrink-0" style={{ background: activeSelectedElement.gradientColors?.[0] || '#9cf822' }}>
                                 <input type="color" value={activeSelectedElement.gradientColors?.[0] || '#9cf822'} onChange={(e) => updateSelected({gradientColors: [e.target.value, activeSelectedElement.gradientColors?.[1] || '#1E1E1E']})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150" />
                               </div>
                               <input type="text" value={(activeSelectedElement.gradientColors?.[0] || '#9cf822').toUpperCase()} onChange={(e) => updateSelected({gradientColors: [e.target.value, activeSelectedElement.gradientColors?.[1] || '#1E1E1E']})} className="flex-1 bg-transparent border border-transparent hover:border-[#383838] focus:border-[#9cf822] rounded px-1.5 py-1 text-[11px] uppercase font-mono outline-none" />
                             </div>
                             <div className="flex items-center gap-2">
                               <div className="w-4 h-4 rounded-sm border border-[#444] cursor-pointer shadow-sm relative overflow-hidden flex-shrink-0" style={{ background: activeSelectedElement.gradientColors?.[1] || '#1E1E1E' }}>
                                 <input type="color" value={activeSelectedElement.gradientColors?.[1] || '#1E1E1E'} onChange={(e) => updateSelected({gradientColors: [activeSelectedElement.gradientColors?.[0] || '#9cf822', e.target.value]})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150" />
                               </div>
                               <input type="text" value={(activeSelectedElement.gradientColors?.[1] || '#1E1E1E').toUpperCase()} onChange={(e) => updateSelected({gradientColors: [activeSelectedElement.gradientColors?.[0] || '#9cf822', e.target.value]})} className="flex-1 bg-transparent border border-transparent hover:border-[#383838] focus:border-[#9cf822] rounded px-1.5 py-1 text-[11px] uppercase font-mono outline-none" />
                             </div>
                           </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                             <div className="w-4 h-4 rounded-sm border border-[#444] cursor-pointer shadow-sm relative overflow-hidden flex-shrink-0" style={{ background: activeSelectedElement.fill }}>
                                <input type="color" value={activeSelectedElement.fill} onChange={(e) => updateSelected({fill: e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150" />
                             </div>
                             <input type="text" value={activeSelectedElement.fill.toUpperCase()} onChange={(e) => updateSelected({fill: e.target.value})} className="flex-1 bg-transparent border border-transparent hover:border-[#383838] focus:border-[#9cf822] rounded px-1.5 py-1 text-[11px] uppercase font-mono outline-none w-16" />
                          </div>
                        )}
                      </div>
                    )}

                    {activeSelectedElement.type !== 'image' && (
                      <div className="p-3 border-b border-[#383838]">
                        <div className="flex items-center justify-between group cursor-pointer mb-2"><span className="text-[11px] font-medium">Stroke</span><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button className="p-1 hover:bg-[#383838] rounded text-zinc-400 hover:text-white" onClick={() => updateSelected({stroke: '#000000', strokeWidth: 1})}><Plus size={12}/></button></div></div>
                        {activeSelectedElement.stroke && activeSelectedElement.stroke !== 'transparent' && activeSelectedElement.strokeWidth > 0 ? (
                          <>
                            <div className="flex items-center gap-2 group mb-2">
                               <div className="w-4 h-4 rounded-sm border border-[#444] cursor-pointer shadow-sm relative overflow-hidden flex-shrink-0" style={{ background: activeSelectedElement.stroke }}><input type="color" value={activeSelectedElement.stroke} onChange={(e) => updateSelected({stroke: e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150" /></div>
                               <input type="text" value={activeSelectedElement.stroke.toUpperCase()} onChange={(e) => updateSelected({stroke: e.target.value})} className="flex-1 bg-transparent border border-transparent hover:border-[#383838] focus:border-[#9cf822] rounded px-1.5 py-1 text-[11px] uppercase font-mono outline-none w-16" />
                               <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity"><button className="p-1 text-zinc-400 hover:text-white" onClick={() => updateSelected({strokeWidth: 0})}><Minus size={12}/></button></div>
                            </div>
                            <div className="flex items-center gap-2 pl-6">
                              <div className="flex items-center gap-2 bg-transparent border border-transparent hover:border-[#383838] px-1.5 py-1 rounded w-16 cursor-text"><Minus size={10} className="text-zinc-500"/><input type="number" value={activeSelectedElement.strokeWidth} onChange={(e) => updateSelected({strokeWidth: Number(e.target.value) || 0})} className="bg-transparent text-[11px] w-full outline-none" /></div>
                            </div>
                          </>
                        ) : ( <div className="text-[10px] text-zinc-500 pl-1">No strokes applied.</div> )}
                      </div>
                    )}

                    {(activeSelectedElement.type === 'rectangle' || activeSelectedElement.type === 'ellipse' || activeSelectedElement.type === 'image' || activeSelectedElement.type === 'text') && (
                      <div className="p-3 border-b border-[#383838] space-y-3">
                         <div className="flex items-center justify-between group cursor-pointer mb-2">
                            <span className="text-[11px] font-medium">Drop Shadow</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => updateSelected({shadowEnabled: !activeSelectedElement.shadowEnabled, shadowType: 'drop', shadowColor: '#000000', shadowBlur: 10, shadowOffsetX: 5, shadowOffsetY: 5, shadowOpacity: 50})} className="p-1 hover:bg-[#383838] rounded text-zinc-400 hover:text-white">
                                  {activeSelectedElement.shadowEnabled ? <Minus size={12}/> : <Plus size={12}/>}
                               </button>
                            </div>
                         </div>

                         {activeSelectedElement.shadowEnabled && (
                            <>
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                 <button onClick={() => updateSelected({shadowType: 'none', shadowEnabled: false})} className={`py-1 text-[10px] rounded border ${!activeSelectedElement.shadowEnabled ? 'border-[#9cf822] text-[#9cf822] bg-[#9cf822]/10' : 'border-[#383838] text-zinc-400 hover:bg-[#383838] hover:text-white transition-colors'}`}>None</button>
                                 <button onClick={() => updateSelected({shadowType: 'drop', shadowOffsetX: 8, shadowOffsetY: 8, shadowBlur: 8})} className={`py-1 text-[10px] rounded border ${activeSelectedElement.shadowType === 'drop' ? 'border-[#9cf822] text-[#9cf822] bg-[#9cf822]/10' : 'border-[#383838] text-zinc-400 hover:bg-[#383838] hover:text-white transition-colors'}`}>Drop</button>
                                 <button onClick={() => updateSelected({shadowType: 'glow', shadowOffsetX: 0, shadowOffsetY: 0, shadowBlur: 20})} className={`py-1 text-[10px] rounded border ${activeSelectedElement.shadowType === 'glow' ? 'border-[#9cf822] text-[#9cf822] bg-[#9cf822]/10' : 'border-[#383838] text-zinc-400 hover:bg-[#383838] hover:text-white transition-colors'}`}>Glow</button>
                              </div>

                              <div className="space-y-2">
                                 <div className="flex items-center gap-2 group">
                                    <div className="w-4 h-4 rounded-sm border border-[#444] cursor-pointer shadow-sm relative overflow-hidden flex-shrink-0" style={{ background: activeSelectedElement.shadowColor || '#000000' }}>
                                       <input type="color" value={activeSelectedElement.shadowColor || '#000000'} onChange={(e) => updateSelected({shadowColor: e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150" />
                                    </div>
                                    <input type="number" value={activeSelectedElement.shadowOpacity ?? 50} onChange={(e) => updateSelected({shadowOpacity: Number(e.target.value) || 0})} className="flex-1 bg-transparent border border-transparent hover:border-[#383838] focus:border-[#9cf822] rounded px-1.5 py-1 text-[11px] outline-none" /><span className="text-[10px] text-zinc-500">% Op</span>
                                 </div>

                                 <div className="grid grid-cols-2 gap-2">
                                    <FigmaInput icon="B" value={activeSelectedElement.shadowBlur || 0} onChange={(v: string) => updateSelected({shadowBlur: Number(v) || 0})} />
                                    {activeSelectedElement.shadowType === 'drop' && (
                                       <>
                                          <FigmaInput icon="X" value={activeSelectedElement.shadowOffsetX || 0} onChange={(v: string) => updateSelected({shadowOffsetX: Number(v) || 0})} />
                                          <FigmaInput icon="Y" value={activeSelectedElement.shadowOffsetY || 0} onChange={(v: string) => updateSelected({shadowOffsetY: Number(v) || 0})} />
                                       </>
                                    )}
                                 </div>
                              </div>
                            </>
                         )}
                      </div>
                    )}

                    <div className="p-3">
                      <div className="text-[11px] font-medium mb-3">Export</div>
                      <div className="flex gap-2 mb-3">
                         <div className="flex items-center justify-between border border-[#383838] hover:border-[#555] px-2 py-1.5 rounded cursor-pointer group w-16 bg-[#1E1E1E] relative"><span className="text-[11px]">{exportScale}x</span><ChevronDown size={10} className="text-zinc-500 group-hover:text-white" /><select className="absolute opacity-0 inset-0 cursor-pointer" value={exportScale} onChange={(e) => setExportScale(Number(e.target.value))}><option value={1}>1x</option><option value={2}>2x</option><option value={3}>3x</option><option value={4}>4x</option></select></div>
                         <div className="flex-1 flex items-center justify-between border border-[#383838] hover:border-[#555] px-2 py-1.5 rounded cursor-pointer group bg-[#1E1E1E] relative"><span className="text-[11px]">{exportFormat}</span><ChevronDown size={10} className="text-zinc-500 group-hover:text-white" /><select className="absolute opacity-0 inset-0 cursor-pointer" value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)}><option value="PNG">PNG</option><option value="JPG">JPG</option><option value="SVG">SVG</option></select></div>
                      </div>
                      <button onClick={handleExport} disabled={isExporting} className="w-full py-1.5 bg-[#1E1E1E] hover:bg-[#383838] text-white rounded text-[11px] font-medium transition-colors border border-[#383838] flex justify-center items-center gap-2">{isExporting ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12}/>} Export</button>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 p-6"><MousePointer2 size={24} className="mb-4 opacity-20"/><p className="text-[11px]">Select layers to view properties.</p></div>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

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