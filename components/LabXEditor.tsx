// components/LabXEditor.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Loader2, ArrowLeft, Users, Plus, Minus, X, Clock,
  Maximize, Minimize, Image as ImageIcon, MousePointer2, 
  Square, Type as TypeIcon, Layout, Circle, Hand, Save, 
  Scissors, Link2, Monitor, Smartphone, LayoutGrid, Home,
  AlignLeft, AlignCenter, AlignRight, ChevronDown, MoreHorizontal,
  Grid, Eye, EyeOff, Upload, Layers
} from 'lucide-react';

// --- TYPES ---
export type ElementType = 'rectangle' | 'ellipse' | 'text' | 'path' | 'frame' | 'image';

export interface CanvasElement {
  id: string; name: string; type: ElementType;
  x: number; y: number; width: number; height: number;
  fill: string; fillOpacity: number;
  stroke: string; strokeWidth: number; strokeDasharray?: string;
  cornerRadius: number;
  text?: string; fontSize?: number; fontFamily?: string;
  fontWeight?: string; textAlign?: 'left' | 'center' | 'right' | 'justify';
  imageUrl?: string;
  isVisible: boolean; isLocked: boolean;
  groupId?: string; clipMaskId?: string; isMask?: boolean;
}

interface LabXEditorProps {
  projectId: string;
  projectTitle: string;
  initialElements: CanvasElement[];
  onExit: () => void;
  team: any[];
}

export default function LabXEditor({ projectId, projectTitle, initialElements, onExit, team }: LabXEditorProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- View State ---
  const [colabView, setColabView] = useState<'home' | 'canvas'>('home');
  const [homeSidebarView, setHomeSidebarView] = useState<'home' | 'recent' | 'shared'>('home');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  
  // --- Export State ---
  const [exportFormat, setExportFormat] = useState<'PNG' | 'JPG' | 'SVG'>('PNG');
  const [exportScale, setExportScale] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);

  // --- Refs ---
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Canvas State ---
  const [elements, setElements] = useState<CanvasElement[]>(initialElements || []);
  const [past, setPast] = useState<CanvasElement[][]>([]);
  const [future, setFuture] = useState<CanvasElement[][]>([]);
  const [clipboard, setClipboard] = useState<CanvasElement[]>([]);
  const [activeTool, setActiveTool] = useState<'select' | 'hand' | 'frame' | 'rectangle' | 'ellipse' | 'text' | 'image'>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragState, setDragState] = useState<any>(null);

  // --- HISTORY ENGINE ---
  const pushToHistory = (newElements: CanvasElement[]) => {
    setPast(prev => [...prev, elements]);
    setFuture([]);
    setElements(newElements);
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast(prev => prev.slice(0, prev.length - 1));
    setFuture(prev => [elements, ...prev]);
    setElements(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(prev => prev.slice(1));
    setPast(prev => [...prev, elements]);
    setElements(next);
  };

  // --- CLIPBOARD ENGINE ---
  const handleCopy = () => {
    const selected = elements.filter(el => selectedIds.includes(el.id));
    if (selected.length > 0) setClipboard(selected);
  };

  const handleCut = () => {
    handleCopy();
    const remaining = elements.filter(el => !selectedIds.includes(el.id));
    pushToHistory(remaining);
    setSelectedIds([]);
  };

  const handlePaste = () => {
    if (clipboard.length === 0) return;
    const newIds: string[] = [];
    const pasted = clipboard.map(el => {
      const newId = `el_${Math.random().toString(36).substr(2, 9)}`;
      newIds.push(newId);
      return { ...el, id: newId, x: el.x + 20, y: el.y + 20 };
    });
    pushToHistory([...elements, ...pasted]);
    setSelectedIds(newIds);
  };

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (colabView !== 'canvas') return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'v') setActiveTool('select');
      if (e.key === 'r') setActiveTool('rectangle');
      if (e.key === 'o') setActiveTool('ellipse');
      if (e.key === 't') setActiveTool('text');
      if (e.key === 'h') setActiveTool('hand');
      if (e.key === 'f') setActiveTool('frame');
      
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key === 'c') { e.preventDefault(); handleCopy(); }
        if (e.key === 'x') { e.preventDefault(); handleCut(); }
        if (e.key === 'v') { e.preventDefault(); handlePaste(); }
        if (e.key === 'z') { e.preventDefault(); if (e.shiftKey) handleRedo(); else handleUndo(); }
        if (e.key === 's') { e.preventDefault(); handleSaveDesign(); }
        if (e.key === 'g') { e.preventDefault(); if (e.shiftKey) handleUngroup(); else handleGroup(); }
      } else {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          pushToHistory(elements.filter(el => !selectedIds.includes(el.id)));
          setSelectedIds([]);
        }
        if (e.key === '[') sendToBack();
        if (e.key === ']') bringToFront();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [colabView, selectedIds, elements, clipboard, past, future]);

  // --- CANVAS ACTIONS ---
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
      let newX = el.x, newY = el.y;
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

  const handleExport = async () => {
    const bounds = getSelectionBounds();
    if (!bounds) return alert("Select a layer or frame to export.");
    setIsExporting(true);
    try {
      const svgElement = containerRef.current?.querySelector('svg');
      if (!svgElement) throw new Error("SVG not found");
      const clone = svgElement.cloneNode(true) as SVGSVGElement;
      clone.querySelectorAll('.selection-ui').forEach(el => el.remove());
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
        const a = document.createElement('a'); a.href = url; a.download = `${fileName}.svg`; a.click();
        URL.revokeObjectURL(url); setIsExporting(false); return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = bounds.width * exportScale; canvas.height = bounds.height * exportScale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        if (exportFormat === 'JPG') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const a = document.createElement('a');
        a.href = canvas.toDataURL(exportFormat === 'JPG' ? 'image/jpeg' : 'image/png', 1.0);
        a.download = `${fileName}.${exportFormat.toLowerCase()}`; a.click();
        URL.revokeObjectURL(url); setIsExporting(false);
      };
      img.crossOrigin = 'anonymous'; img.src = url;
    } catch (err) { alert("Export failed."); setIsExporting(false); }
  };

  const startWithTemplate = (name: string, w: number, h: number) => {
    const newFrame: CanvasElement = {
      id: `el_${Date.now()}`, name: name, type: 'frame', x: 100, y: 100, width: w, height: h, 
      fill: '#ffffff', fillOpacity: 100, stroke: '#e4e4e7', strokeWidth: 1, 
      cornerRadius: 0, isVisible: true, isLocked: false, fontFamily: 'Inter', fontWeight: 'Normal', textAlign: 'left'
    };
    pushToHistory([...elements, newFrame]);
    setColabView('canvas');
  };

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
        const delta = -e.deltaY * 0.005;
        const newScale = Math.min(Math.max(0.1, canvasTransform.scale + delta), 5);
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
        setCanvasTransform({ 
          x: mouseX - (mouseX - canvasTransform.x) * (newScale / canvasTransform.scale), 
          y: mouseY - (mouseY - canvasTransform.y) * (newScale / canvasTransform.scale), 
          scale: newScale 
        });
      } else {
        setCanvasTransform(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [canvasTransform, colabView]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (editingTextId) return; 
    if (isPanning || activeTool === 'hand' || e.button === 1) {
      setDragState({ action: 'panning', startX: e.clientX, startY: e.clientY }); return;
    }
    const { x, y } = getCanvasCoords(e);
    if (activeTool === 'select' && (e.target as HTMLElement).tagName === 'svg') setSelectedIds([]);
    else if (activeTool !== 'select' && activeTool !== 'image') {
      const newId = `el_${Date.now()}`;
      pushToHistory([...elements, { id: newId, name: activeTool.charAt(0).toUpperCase() + activeTool.slice(1), type: activeTool as any, x, y, width: 100, height: 100, fill: '#d4d4d8', fillOpacity: 100, stroke: 'transparent', strokeWidth: 0, cornerRadius: 0, isVisible: true, isLocked: false, text: activeTool === 'text' ? 'New Text' : undefined, fontSize: activeTool === 'text' ? 24 : undefined, fontFamily: 'Inter', fontWeight: 'Normal', textAlign: 'left' }]);
      setSelectedIds([newId]); setActiveTool('select');
    }
  };

  const handleElementPointerDown = (e: React.PointerEvent, el: CanvasElement) => {
    if (activeTool !== 'select' || isPanning || el.isLocked || !el.isVisible || editingTextId === el.id) return;
    e.stopPropagation();
    const groupIdsToSelect = el.groupId ? elements.filter(e => e.groupId === el.groupId).map(e => e.id) : [el.id];
    let newSelection = [...selectedIds];
    if (e.shiftKey) {
      if (groupIdsToSelect.every(id => selectedIds.includes(id))) newSelection = selectedIds.filter(id => !groupIdsToSelect.includes(id));
      else newSelection = [...selectedIds, ...groupIdsToSelect].filter((v, i, a) => a.indexOf(v) === i);
    } else {
      if (!selectedIds.includes(el.id)) newSelection = groupIdsToSelect;
    }
    setSelectedIds(newSelection);
    setDragState({ action: 'moving', startX: getCanvasCoords(e).x, startY: getCanvasCoords(e).y, originalElements: elements, hasDragged: false });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    if (activeTool === 'hand' || dragState.action === 'panning') {
      setCanvasTransform(prev => ({ ...prev, x: prev.x + (e.clientX - dragState.startX), y: prev.y + (e.clientY - dragState.startY) }));
      setDragState({ ...dragState, startX: e.clientX, startY: e.clientY }); return;
    }
    if (!dragState.hasDragged) setDragState({ ...dragState, hasDragged: true });
    const { x, y } = getCanvasCoords(e);
    const dx = x - dragState.startX; const dy = y - dragState.startY;

    if (dragState.action === 'moving') {
      setElements(dragState.originalElements.map((el: CanvasElement) => selectedIds.includes(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el));
    } else if (dragState.action === 'resizing' && dragState.handle) {
      setElements(dragState.originalElements.map((el: CanvasElement) => {
        if (!selectedIds.includes(el.id)) return el;
        let newX = el.x, newY = el.y, newW = el.width, newH = el.height;
        if (dragState.handle.includes('e')) newW = Math.max(10, el.width + dx);
        if (dragState.handle.includes('s')) newH = Math.max(10, el.height + dy);
        if (dragState.handle.includes('w')) { newW = Math.max(10, el.width - dx); if (newW > 10) newX = el.x + dx; }
        if (dragState.handle.includes('n')) { newH = Math.max(10, el.height - dy); if (newH > 10) newY = el.y + dy; }
        return { ...el, x: newX, y: newY, width: newW, height: newH, fontSize: el.type === 'text' && el.fontSize ? Math.max(8, el.fontSize * (newH / el.height)) : el.fontSize };
      }));
    }
  };

  const handlePointerUp = () => {
    if (dragState && dragState.action !== 'panning' && dragState.hasDragged) {
      setPast(prev => [...prev, dragState.originalElements]); setFuture([]);
    }
    setDragState(null);
  };

  const handleResizeHandleDown = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation(); const { x, y } = getCanvasCoords(e);
    setDragState({ action: 'resizing', handle, startX: x, startY: y, originalElements: elements, hasDragged: false });
  };

  const handleSaveDesign = async () => {
    setIsSaving(true);
    await supabase.from('projects').update({ canvas_data: elements }).eq('id', projectId);
    setIsSaving(false);
  };

  const bringToFront = () => pushToHistory([...elements.filter(el => !selectedIds.includes(el.id)), ...elements.filter(el => selectedIds.includes(el.id))]);
  const sendToBack = () => pushToHistory([...elements.filter(el => selectedIds.includes(el.id)), ...elements.filter(el => !selectedIds.includes(el.id))]);
  const updateSelected = (updates: Partial<CanvasElement>) => pushToHistory(elements.map(el => selectedIds.includes(el.id) ? { ...el, ...updates } : el));
  const getSelectionBounds = () => {
    if (selectedIds.length === 0) return null;
    const s = elements.filter(el => selectedIds.includes(el.id));
    const minX = Math.min(...s.map(el => el.x)), minY = Math.min(...s.map(el => el.y));
    return { x: minX, y: minY, width: Math.max(...s.map(el => el.x + el.width)) - minX, height: Math.max(...s.map(el => el.y + el.height)) - minY };
  };

  const bounds = getSelectionBounds();
  const isMultiSelect = selectedIds.length > 1;
  const singleSelectedElement = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null;

  return (
    <div className={`flex-grow flex flex-col font-sans ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'h-full'} bg-[#1E1E1E] text-zinc-300 selection:bg-[#9cf822]/30 overflow-hidden`}>
      {colabView === 'canvas' && (
        <header className="h-11 bg-[#2C2C2C] border-b border-[#383838] flex items-center justify-between px-4 shrink-0 z-50">
          <div className="flex items-center gap-3">
            <button onClick={() => setColabView('home')} className="p-1 hover:bg-[#383838] rounded transition-colors text-zinc-400 hover:text-white" title="Back to Home"><Home size={14} /></button>
            <div className="h-3 w-px bg-[#383838]" />
            <div className="text-xs font-medium text-white flex items-center gap-2 cursor-pointer hover:bg-[#383838] px-2 py-1 rounded">
              {projectTitle} <span className="text-zinc-500">/</span> <span className="opacity-80">Draft</span> <ChevronDown size={12} className="text-zinc-500"/>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <ToolBtn icon={<MousePointer2 size={14}/>} active={activeTool === 'select'} onClick={() => setActiveTool('select')} tip="Move (V)" />
            <ToolBtn icon={<Layout size={14}/>} active={activeTool === 'frame'} onClick={() => setActiveTool('frame')} tip="Frame (F)" />
            <ToolBtn icon={<Square size={14}/>} active={activeTool === 'rectangle'} onClick={() => setActiveTool('rectangle')} tip="Rectangle (R)" />
            <ToolBtn icon={<Circle size={14}/>} active={activeTool === 'ellipse'} onClick={() => setActiveTool('ellipse')} tip="Ellipse (O)" />
            <ToolBtn icon={<TypeIcon size={14}/>} active={activeTool === 'text'} onClick={() => setActiveTool('text')} tip="Text (T)" />
            <ToolBtn icon={<Hand size={14}/>} active={activeTool === 'hand'} onClick={() => setActiveTool('hand')} tip="Hand (H)" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 mr-2">
               {team.slice(0, 3).map((m, i) => (
                 <div key={i} className="w-6 h-6 rounded-full bg-[#18181b] border border-[#383838] overflow-hidden">
                    {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} className="w-full h-full object-cover"/> : <div className="m-auto mt-1.5 text-zinc-500">U</div>}
                 </div>
               ))}
               <button onClick={() => alert('Link copied')} className="px-3 py-1 bg-[#9cf822] text-black text-[11px] font-bold rounded hover:opacity-90 transition-opacity">Share</button>
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
            <div className="flex items-center gap-3 mb-8 cursor-pointer px-2" onClick={onExit}>
              <img src="/lab x.svg" className="w-12 h-12 hover:opacity-80 transition-opacity object-contain" alt="Lab X" />
            </div>
            <div className="space-y-0.5">
               <button onClick={() => setHomeSidebarView('home')} className={`w-full flex items-center gap-3 px-2 py-2 rounded text-sm font-medium transition-colors ${homeSidebarView === 'home' ? 'bg-[#383838] text-white' : 'text-zinc-400 hover:text-white hover:bg-[#383838]/50'}`}><Home size={16}/> Home</button>
               <button onClick={() => setHomeSidebarView('recent')} className={`w-full flex items-center gap-3 px-2 py-2 rounded text-sm font-medium transition-colors ${homeSidebarView === 'recent' ? 'bg-[#383838] text-white' : 'text-zinc-400 hover:text-white hover:bg-[#383838]/50'}`}><Clock size={16}/> Recent</button>
               <button onClick={() => setHomeSidebarView('shared')} className={`w-full flex items-center gap-3 px-2 py-2 rounded text-sm font-medium transition-colors ${homeSidebarView === 'shared' ? 'bg-[#383838] text-white' : 'text-zinc-400 hover:text-white hover:bg-[#383838]/50'}`}><Users size={16}/> Shared with you</button>
            </div>
            <div className="mt-auto">
              <button onClick={onExit} className="w-full flex items-center justify-center gap-2 px-2 py-2 border border-[#383838] text-zinc-400 hover:text-white hover:bg-[#383838]/50 rounded text-sm font-medium transition-colors">
                <ArrowLeft size={16}/> Exit to Overview
              </button>
            </div>
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
                          <div className="col-span-6 flex items-center gap-3">
                             <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center shrink-0 border border-zinc-700">
                               <img src="/lab x.svg" className="w-4 h-4 object-contain opacity-50" alt="Lab X" />
                             </div>
                             <span className="text-sm font-medium text-white">{projectTitle} Canvas</span>
                          </div>
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
          {/* LAYERS */}
          <aside className="w-[240px] bg-[#2C2C2C] border-r border-[#383838] flex flex-col z-20 shrink-0">
            <div className="px-3 py-2.5 border-b border-[#383838] flex items-center gap-2 text-[11px] font-bold text-white"><Layers size={12} /> Layers</div>
            <div className="flex-grow overflow-y-auto p-2 space-y-0.5">
              {[...elements].reverse().map(el => (
                <div key={el.id} onClick={(e) => { e.stopPropagation(); setActiveTool('select'); e.shiftKey ? setSelectedIds([...selectedIds, el.id].filter((v, i, a) => a.indexOf(v) === i)) : setSelectedIds([el.id]); }} onDoubleClick={(e) => { e.stopPropagation(); if (el.type === 'text') { setEditingTextId(el.id); setActiveTool('select'); } }} className={`flex items-center justify-between px-2 py-1.5 rounded text-[11px] cursor-pointer group ${selectedIds.includes(el.id) ? 'bg-[#9cf822]/10 text-[#9cf822] font-medium' : 'text-zinc-300 hover:bg-[#383838]'}`}>
                  <div className="flex items-center gap-2 truncate">
                    {el.isMask ? <Scissors size={10} className="text-[#9cf822]" /> : el.type === 'text' ? <TypeIcon size={10}/> : el.type === 'image' ? <ImageIcon size={10}/> : el.type === 'frame' ? <Layout size={10}/> : <Square size={10}/>}
                    <span className="truncate flex-grow">{el.name} {el.groupId && <span className="opacity-50 ml-1 text-[9px]">(Grouped)</span>}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); pushToHistory(elements.map(item => item.id === el.id ? {...item, isVisible: !item.isVisible} : item)); }} className="p-1 hover:text-white">{el.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}</button>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* CANVAS */}
          <main ref={containerRef} className="flex-grow bg-[#1E1E1E] relative cursor-crosshair overflow-hidden" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
            {showGrid && <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: `${20 * canvasTransform.scale}px ${20 * canvasTransform.scale}px`, backgroundPosition: `${canvasTransform.x}px ${canvasTransform.y}px` }} />}
            <svg className="w-full h-full absolute inset-0">
              <defs>{elements.filter(e => e.isMask).map(m => (<clipPath id={`clip_${m.id}`} key={`clip_${m.id}`}>{m.type === 'rectangle' && <rect x={m.x} y={m.y} width={m.width} height={m.height} rx={m.cornerRadius} />}{m.type === 'ellipse' && <ellipse cx={m.x + m.width/2} cy={m.y + m.height/2} rx={m.width/2} ry={m.height/2} />}</clipPath>))}</defs>
              <g data-transform-wrapper="true" transform={`matrix(${canvasTransform.scale}, 0, 0, ${canvasTransform.scale}, ${canvasTransform.x}, ${canvasTransform.y})`}>
                {elements.map(el => {
                  if (!el.isVisible) return null;
                  const isSelected = selectedIds.includes(el.id);
                  const isEditing = editingTextId === el.id;
                  return (
                    <g key={el.id} opacity={el.fillOpacity / 100} clipPath={el.clipMaskId ? `url(#clip_${el.clipMaskId})` : undefined}>
                      {el.type === 'frame' && (<g><text x={el.x} y={el.y - 8} fontSize={10 / canvasTransform.scale} fill="#71717a" fontWeight="bold">{el.name}</text><rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill} stroke={isSelected ? '#9cf822' : '#27272a'} strokeWidth={isSelected ? 1.5/canvasTransform.scale : 1} onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''}/></g>)}
                      {el.type === 'rectangle' && <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill} rx={el.cornerRadius} stroke={el.stroke} strokeWidth={el.strokeWidth} strokeDasharray={el.strokeDasharray} onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''}/>}
                      {el.type === 'ellipse' && <ellipse cx={el.x + el.width/2} cy={el.y + el.height/2} rx={el.width/2} ry={el.height/2} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} strokeDasharray={el.strokeDasharray} onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''} />}
                      {el.type === 'text' && (isEditing ? (
                            <foreignObject x={el.x} y={el.y} width={Math.max(300, el.width * 2)} height={(el.fontSize || 24) * 2} className="overflow-visible pointer-events-auto">
                              <input autoFocus defaultValue={el.text} onPointerDown={(e) => e.stopPropagation()} onBlur={(e) => { updateSelected({text: e.target.value}); setEditingTextId(null); }} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); }} style={{ fontSize: el.fontSize, fontFamily: el.fontFamily, color: el.fill, background: 'transparent', outline: '1px solid #9cf822', border: 'none', margin: 0, padding: 0, width: '100%', lineHeight: 1, fontWeight: el.fontWeight, textAlign: el.textAlign }} />
                            </foreignObject>
                         ) : (
                            <text x={el.x} y={el.y + (el.fontSize || 24) * 0.85} fill={el.fill} fontSize={el.fontSize} fontFamily={el.fontFamily} fontWeight={el.fontWeight} textAnchor={el.textAlign === 'center' ? 'middle' : el.textAlign === 'right' ? 'end' : 'start'} dx={el.textAlign === 'center' ? el.width/2 : el.textAlign === 'right' ? el.width : 0} onPointerDown={(e) => handleElementPointerDown(e, el)} onDoubleClick={(e) => { e.stopPropagation(); setEditingTextId(el.id); setActiveTool('select'); }} className="select-none cursor-default">{el.text}</text>
                         )
                      )}
                      {el.type === 'image' && el.imageUrl && <image href={el.imageUrl} x={el.x} y={el.y} width={el.width} height={el.height} preserveAspectRatio="none" onPointerDown={(e) => handleElementPointerDown(e, el)} className={el.isLocked ? 'pointer-events-none' : ''} />}
                    </g>
                  );
                })}
                {bounds && activeTool === 'select' && (
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
              </g>
            </svg>
          </main>

          {/* INSPECTOR */}
          <aside className="w-[240px] bg-[#2C2C2C] border-l border-[#383838] overflow-y-auto z-20 shrink-0 text-white select-none">
            <div className="flex items-center justify-between p-3 border-b border-[#383838] text-zinc-400">
              <div className="flex gap-2">
                 <button onClick={() => handleAlign('left')} className="hover:text-white transition-colors" title="Align left"><AlignLeft size={14}/></button>
                 <button onClick={() => handleAlign('center')} className="hover:text-white transition-colors" title="Align horizontal centers"><AlignCenter size={14}/></button>
                 <button onClick={() => handleAlign('right')} className="hover:text-white transition-colors" title="Align right"><AlignRight size={14}/></button>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => handleAlign('top')} className="hover:text-white transition-colors rotate-90" title="Align top"><AlignLeft size={14}/></button>
                 <button onClick={() => handleAlign('middle')} className="hover:text-white transition-colors rotate-90" title="Align vertical centers"><AlignCenter size={14}/></button>
                 <button onClick={() => handleAlign('bottom')} className="hover:text-white transition-colors rotate-90" title="Align bottom"><AlignRight size={14}/></button>
              </div>
            </div>

            {isMultiSelect ? (
              <div className="p-3 border-b border-[#383838] space-y-3">
                <div className="text-[11px] font-medium text-white">Selection</div>
                <div className="text-[10px] text-zinc-400 flex items-center gap-2 bg-[#383838]/50 p-2 rounded"><Layers size={12}/> {selectedIds.length} layers selected</div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                   <button onClick={handleGroup} className="py-1.5 bg-[#383838] hover:bg-[#444] rounded flex items-center justify-center gap-1.5 text-[10px] font-medium transition-colors"><Link2 size={12}/> Group</button>
                   <button onClick={handleMakeMask} className="py-1.5 bg-[#383838] hover:bg-[#444] rounded flex items-center justify-center gap-1.5 text-[10px] font-medium transition-colors"><Scissors size={12}/> Mask</button>
                </div>
              </div>
            ) : singleSelectedElement ? (
              <>
                <div className="p-3 border-b border-[#383838]">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <FigmaInput icon="X" value={Math.round(singleSelectedElement.x)} onChange={(v: string) => updateSelected({x: Number(v)})} />
                    <FigmaInput icon="Y" value={Math.round(singleSelectedElement.y)} onChange={(v: string) => updateSelected({y: Number(v)})} />
                    <FigmaInput icon="W" value={Math.round(singleSelectedElement.width)} onChange={(v: string) => updateSelected({width: Math.max(1, Number(v) || 1)})} />
                    <FigmaInput icon="H" value={Math.round(singleSelectedElement.height)} onChange={(v: string) => updateSelected({height: Math.max(1, Number(v) || 1)})} />
                    <FigmaInput icon="∠" value={"0°"} onChange={() => {}} />
                    <FigmaInput icon="R" value={singleSelectedElement.cornerRadius || 0} onChange={(v: string) => updateSelected({cornerRadius: Number(v) || 0})} />
                  </div>
                </div>

                {singleSelectedElement.type === 'text' && (
                  <div className="p-3 border-b border-[#383838] space-y-2">
                     <div className="text-[11px] font-medium mb-2">Text</div>
                     <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center justify-between border border-transparent hover:border-[#383838] px-2 py-1 rounded cursor-pointer group relative">
                           <span className="text-[11px]">{singleSelectedElement.fontFamily}</span>
                           <ChevronDown size={12} className="text-zinc-500 group-hover:text-white" />
                           <select className="absolute inset-0 opacity-0 cursor-pointer" value={singleSelectedElement.fontFamily} onChange={(e) => updateSelected({fontFamily: e.target.value})}>
                             <option value="Inter">Inter</option><option value="Arial">Arial</option><option value="Helvetica">Helvetica</option><option value="Times New Roman">Times New Roman</option>
                           </select>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-between border border-transparent hover:border-[#383838] px-2 py-1 rounded cursor-pointer group relative">
                           <span className="text-[11px]">{singleSelectedElement.fontWeight}</span>
                           <ChevronDown size={12} className="text-zinc-500 group-hover:text-white" />
                           <select className="absolute inset-0 opacity-0 cursor-pointer" value={singleSelectedElement.fontWeight} onChange={(e) => updateSelected({fontWeight: e.target.value})}><option value="Normal">Normal</option><option value="Bold">Bold</option><option value="Bolder">Bolder</option><option value="Lighter">Lighter</option></select>
                        </div>
                        <FigmaInput icon={<TypeIcon size={12}/>} value={singleSelectedElement.fontSize || 16} onChange={(v: string) => updateSelected({fontSize: Number(v) || 16})} />
                     </div>
                     <div className="flex items-center gap-1 mt-2 text-zinc-400">
                        <button onClick={() => updateSelected({textAlign: 'left'})} className={`p-1.5 rounded hover:text-white ${singleSelectedElement.textAlign === 'left' ? 'bg-[#383838] text-white' : ''}`}><AlignLeft size={12}/></button>
                        <button onClick={() => updateSelected({textAlign: 'center'})} className={`p-1.5 rounded hover:text-white ${singleSelectedElement.textAlign === 'center' ? 'bg-[#383838] text-white' : ''}`}><AlignCenter size={12}/></button>
                        <button onClick={() => updateSelected({textAlign: 'right'})} className={`p-1.5 rounded hover:text-white ${singleSelectedElement.textAlign === 'right' ? 'bg-[#383838] text-white' : ''}`}><AlignRight size={12}/></button>
                     </div>
                  </div>
                )}

                {singleSelectedElement.type !== 'image' && (
                  <div className="p-3 border-b border-[#383838]">
                    <div className="flex items-center justify-between group cursor-pointer mb-2">
                      <span className="text-[11px] font-medium">Fill</span>
                      <button className="p-1 hover:bg-[#383838] rounded text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100"><Plus size={12}/></button>
                    </div>
                    <div className="flex items-center gap-2 group">
                       <div className="w-4 h-4 rounded-sm border border-[#444] cursor-pointer shadow-sm relative overflow-hidden flex-shrink-0" style={{ background: singleSelectedElement.fill }}>
                          {singleSelectedElement.fillOpacity < 100 && <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '8px 8px'}}/>}
                          <input type="color" value={singleSelectedElement.fill} onChange={(e) => updateSelected({fill: e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150" />
                       </div>
                       <input type="text" value={singleSelectedElement.fill.toUpperCase()} onChange={(e) => updateSelected({fill: e.target.value})} className="flex-1 bg-transparent border border-transparent hover:border-[#383838] focus:border-[#9cf822] rounded px-1.5 py-1 text-[11px] uppercase font-mono outline-none w-16" />
                       <input type="number" value={singleSelectedElement.fillOpacity} onChange={(e) => updateSelected({fillOpacity: Number(e.target.value) || 0})} className="w-10 bg-transparent border border-transparent hover:border-[#383838] focus:border-[#9cf822] rounded px-1.5 py-1 text-[11px] text-right outline-none" /><span className="text-[10px] text-zinc-500">%</span>
                       <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => updateSelected({fillOpacity: singleSelectedElement.fillOpacity === 0 ? 100 : 0})} className="p-1 text-zinc-400 hover:text-white">{singleSelectedElement.fillOpacity === 0 ? <EyeOff size={12}/> : <Eye size={12}/>}</button>
                         <button className="p-1 text-zinc-400 hover:text-white"><Minus size={12}/></button>
                       </div>
                    </div>
                  </div>
                )}

                {singleSelectedElement.type !== 'image' && (
                  <div className="p-3 border-b border-[#383838]">
                    <div className="flex items-center justify-between group cursor-pointer mb-2">
                      <span className="text-[11px] font-medium">Stroke</span>
                      <button className="p-1 hover:bg-[#383838] rounded text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100" onClick={() => updateSelected({stroke: '#000000', strokeWidth: 1})}><Plus size={12}/></button>
                    </div>
                    {singleSelectedElement.stroke && singleSelectedElement.stroke !== 'transparent' && singleSelectedElement.strokeWidth > 0 ? (
                      <>
                        <div className="flex items-center gap-2 group mb-2">
                           <div className="w-4 h-4 rounded-sm border border-[#444] cursor-pointer shadow-sm relative overflow-hidden flex-shrink-0" style={{ background: singleSelectedElement.stroke }}>
                              <input type="color" value={singleSelectedElement.stroke} onChange={(e) => updateSelected({stroke: e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150" />
                           </div>
                           <input type="text" value={singleSelectedElement.stroke.toUpperCase()} onChange={(e) => updateSelected({stroke: e.target.value})} className="flex-1 bg-transparent border border-transparent hover:border-[#383838] focus:border-[#9cf822] rounded px-1.5 py-1 text-[11px] uppercase font-mono outline-none w-16" />
                           <div className="w-10 text-right text-[11px]">100%</div>
                           <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="p-1 text-zinc-400 hover:text-white"><Eye size={12}/></button>
                             <button className="p-1 text-zinc-400 hover:text-white" onClick={() => updateSelected({strokeWidth: 0})}><Minus size={12}/></button>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 pl-6">
                          <div className="flex items-center gap-2 bg-transparent border border-transparent hover:border-[#383838] px-1.5 py-1 rounded w-16 cursor-text">
                             <Minus size={10} className="text-zinc-500"/>
                             <input type="number" value={singleSelectedElement.strokeWidth} onChange={(e) => updateSelected({strokeWidth: Number(e.target.value) || 0})} className="bg-transparent text-[11px] w-full outline-none" />
                          </div>
                          <div className="flex items-center justify-between border border-transparent hover:border-[#383838] px-2 py-1 rounded cursor-pointer group w-16">
                             <span className="text-[11px]">Inside</span><ChevronDown size={10} className="text-zinc-500 group-hover:text-white" />
                          </div>
                        </div>
                      </>
                    ) : <div className="text-[10px] text-zinc-500 pl-1">No strokes applied.</div>}
                  </div>
                )}

                <div className="p-3">
                  <div className="text-[11px] font-medium mb-3">Export</div>
                  <div className="flex gap-2 mb-3">
                     <div className="flex items-center justify-between border border-[#383838] hover:border-[#555] px-2 py-1.5 rounded cursor-pointer group w-16 bg-[#1E1E1E] relative">
                        <span className="text-[11px]">{exportScale}x</span><ChevronDown size={10} className="text-zinc-500 group-hover:text-white" />
                        <select className="absolute opacity-0 inset-0 cursor-pointer" value={exportScale} onChange={(e) => setExportScale(Number(e.target.value))}><option value={1}>1x</option><option value={2}>2x</option><option value={3}>3x</option><option value={4}>4x</option></select>
                     </div>
                     <div className="flex-1 flex items-center justify-between border border-[#383838] hover:border-[#555] px-2 py-1.5 rounded cursor-pointer group bg-[#1E1E1E] relative">
                        <span className="text-[11px]">{exportFormat}</span><ChevronDown size={10} className="text-zinc-500 group-hover:text-white" />
                        <select className="absolute opacity-0 inset-0 cursor-pointer" value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)}><option value="PNG">PNG</option><option value="JPG">JPG</option><option value="SVG">SVG</option></select>
                     </div>
                  </div>
                  <button onClick={handleExport} disabled={isExporting} className="w-full py-1.5 bg-[#1E1E1E] hover:bg-[#383838] text-white rounded text-[11px] font-medium transition-colors border border-[#383838] flex justify-center items-center gap-2">
                     {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12}/>} Export {singleSelectedElement.name}
                  </button>
                </div>
              </>
            ) : <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 p-6"><MousePointer2 size={24} className="mb-4 opacity-20"/><p className="text-[11px]">Select a layer to view properties.</p></div>}
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