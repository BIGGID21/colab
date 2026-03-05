'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Briefcase, Percent, Image as ImageIcon, 
  UploadCloud, Plus, Trash2, ChevronDown, Loader2, Sparkles,
  ArrowRight, ArrowLeft, Target, Crown, Users, ShieldCheck
} from 'lucide-react';

export default function CreateProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [step, setStep] = useState(1); 
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(''); 
  const [currency, setCurrency] = useState('USD');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [roles, setRoles] = useState([{ id: 1, title: '', share: '' }]); 

  const [milestones, setMilestones] = useState([
    { id: 1, title: 'Phase 1: Initial Draft', timeline: '' }
  ]);

  const PLATFORM_FEE = 5; 
  const [collaboratorPool, setCollaboratorPool] = useState(45); 
  const leadShare = Math.max(0, 100 - PLATFORM_FEE - collaboratorPool); 
  
  const totalAssignedRoles = roles.reduce((sum, role) => sum + (Number(role.share) || 0), 0);
  const isRolesOverAllocated = totalAssignedRoles > collaboratorPool;

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const handleGenerateAI = async () => {
    if (!projectName) return;
    setIsAiLoading(true);
    triggerHaptic([10, 30, 10]);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const title = projectName.toLowerCase();
      let generatedBrief = "";

      if (title.includes('branding') || title.includes('design')) {
        generatedBrief = `Project Scope for ${projectName.toUpperCase()}: We are looking for talented designers to collaborate on a complete visual identity overhaul. Deliverables include a new logo suite, brand guidelines, and social media assets.`;
      } else if (title.includes('app') || title.includes('tech') || title.includes('web')) {
        generatedBrief = `Project Scope for ${projectName.toUpperCase()}: A fast-paced development project to build a responsive, high-performance digital product. Seeking experienced developers to handle frontend architecture and backend integration.`;
      } else {
        generatedBrief = `Project Scope for ${projectName.toUpperCase()}: A collaborative creative project requiring specialized skills to execute a shared vision. We are looking for dedicated professionals to deliver high-quality results on an agreed timeline.`;
      }

      setDescription(generatedBrief);
      triggerHaptic(20);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddRole = () => {
    setRoles([...roles, { id: Date.now(), title: '', share: '' }]);
    triggerHaptic(10);
  };

  const handleRemoveRole = (id: number) => {
    if (roles.length > 1) {
      setRoles(roles.filter(role => role.id !== id));
      triggerHaptic(5);
    }
  };

  const updateRole = (id: number, field: 'title' | 'share', value: string) => {
    setRoles(roles.map(role => role.id === id ? { ...role, [field]: value } : role));
  };

  const handleAddMilestone = () => {
    setMilestones([...milestones, { id: Date.now(), title: '', timeline: '' }]);
    triggerHaptic(10);
  };

  const handleRemoveMilestone = (id: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter(m => m.id !== id));
      triggerHaptic(5);
    }
  };

  const updateMilestone = (id: number, field: string, value: string) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleDeployProject = async () => {
    if (!projectName || !description) return alert("Fill in the project name and scope.");
    setLoading(true);
    triggerHaptic(50);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      let image_url = null;
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('projects')
          .upload(fileName, coverImage);

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage.from('projects').getPublicUrl(uploadData.path);
          image_url = publicUrlData.publicUrl;
        }
      }

      const neededRoles = roles.map(r => r.title).filter(Boolean);

      const { data, error } = await supabase.from('projects').insert({
        user_id: user.id,
        title: projectName,
        description,
        valuation: Number(budget) || 0, 
        currency,
        available_share: collaboratorPool,
        needed_roles: neededRoles,
        image_url: image_url 
      }).select().single();

      if (error) throw error;
      
      if (data && milestones.length > 0) {
        const milestonePayload = milestones.map(m => ({
          project_id: data.id,
          title: m.title,
          status: 'pending',
          description: `Timeline: ${m.timeline}`
        }));

        await supabase.from('milestones').insert(milestonePayload);
      }
      
      router.push(data && data.id ? `/project/${data.id}` : '/discover');
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 pb-24 overflow-x-hidden">
      <div className="max-w-2xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-black dark:text-white tracking-tight">
              {step === 1 ? 'Create Project' : 'Set Deliverables'}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-8 h-[2px] bg-[#9cf822]" />
              <p className="text-sm text-zinc-500 font-medium">
                {step === 1 ? 'Step 1: Core Details' : 'Step 2: Milestones & Timeline'}
              </p>
            </div>
          </div>

          {step === 2 && (
            <button 
              onClick={() => { setStep(1); triggerHaptic(10); }}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
        </header>

        <div className="bg-white border border-zinc-200 rounded-[2rem] shadow-sm dark:bg-[#0a0a0a] dark:border-zinc-800 overflow-hidden relative">
          
          <div className={`transition-all duration-500 ${step === 1 ? 'block opacity-100' : 'hidden opacity-0 absolute pointer-events-none'}`}>
            <form className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Project Name</label>
                    <input 
                      type="text" value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. Mamas Kitchen Website"
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm text-black focus:outline-none focus:border-[#9cf822] transition-all dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Total Budget</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="0.00"
                        className="flex-grow bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm text-black focus:outline-none focus:border-[#9cf822] transition-all dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-white"
                      />
                      <div className="relative w-28">
                        <select 
                          value={currency} onChange={(e) => setCurrency(e.target.value)}
                          className="w-full appearance-none bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-4 text-xs font-bold text-black focus:outline-none focus:border-[#9cf822] dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-white cursor-pointer"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="NGN">NGN</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-end justify-between mb-2 min-h-[40px]">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Project Scope & Details</label>
                    <div className={`transition-all duration-500 transform ${projectName.length >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
                      <button 
                        type="button" onClick={handleGenerateAI} disabled={isAiLoading}
                        className="flex items-center gap-2 px-4 py-1.5 bg-black text-[#9cf822] rounded-full shadow-xl hover:bg-zinc-900 transition-all dark:bg-white dark:text-black border border-zinc-800 dark:border-zinc-200"
                      >
                        {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        <span className="text-[10px] font-bold uppercase tracking-tight">Write Brief</span>
                      </button>
                    </div>
                  </div>

                  <textarea 
                    rows={5} value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the deliverables..."
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm text-black focus:outline-none focus:border-[#9cf822] transition-all resize-none dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Cover Image</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group relative overflow-hidden">
                      {coverImage ? (
                        <div className="absolute inset-0 w-full h-full">
                          <img src={URL.createObjectURL(coverImage)} alt="Cover preview" className="w-full h-full object-cover opacity-60" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <span className="text-[10px] font-bold text-white bg-black/50 px-3 py-1 rounded-full truncate max-w-[80%]">{coverImage.name}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-zinc-400 group-hover:text-[#9cf822] transition-colors">
                          <ImageIcon size={24} className="mb-2" />
                          <p className="text-xs font-medium">Click to upload image</p>
                        </div>
                      )}
                      <input 
                        type="file" accept="image/*" className="hidden" 
                        onChange={(e) => { if(e.target.files?.[0]) { setCoverImage(e.target.files[0]); triggerHaptic(10); } }} 
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Brief & Assets</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-zinc-400 group-hover:text-[#9cf822] transition-colors">
                        <UploadCloud size={24} className="mb-2" />
                        <p className="text-xs font-medium">Upload project files</p>
                      </div>
                      <input 
                        type="file" multiple accept=".pdf,.doc,.docx" className="hidden" 
                        onChange={(e) => { if(e.target.files) { setDocuments(Array.from(e.target.files)); triggerHaptic(10); } }} 
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* REVENUE SPLIT SECTION WITH ICONS */}
              <div className="p-8 bg-zinc-50/50 dark:bg-black/10">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6 text-center">Revenue Share Split</label>
                
                <div className="relative h-6 w-full rounded-2xl overflow-hidden flex mb-10 bg-zinc-200 dark:bg-zinc-800 p-1 shadow-inner">
                  <div style={{ width: `${leadShare}%` }} className="h-full bg-black dark:bg-white rounded-xl transition-all duration-500 ease-out shadow-lg" />
                  <div style={{ width: `${collaboratorPool}%` }} className={`h-full mx-1 transition-all duration-500 rounded-xl shadow-lg ${isRolesOverAllocated ? 'bg-red-500' : 'bg-[#9cf822]'}`} />
                  <div style={{ width: `${PLATFORM_FEE}%` }} className="h-full bg-zinc-400 dark:bg-zinc-600 rounded-xl" />
                  
                  <input 
                    type="range" min="0" max="95" step="1" 
                    value={collaboratorPool} 
                    onChange={(e) => {
                      setCollaboratorPool(Number(e.target.value));
                      triggerHaptic(5);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  <div className="p-4 rounded-2xl border border-zinc-100 bg-white dark:bg-zinc-900 dark:border-zinc-800 flex flex-col items-center">
                    <Crown size={18} className="text-zinc-400 mb-2" />
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight mb-0.5">Lead</p>
                    <span className="text-xl font-bold">{leadShare}%</span>
                  </div>
                  <div className={`p-4 rounded-2xl border flex flex-col items-center ${isRolesOverAllocated ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800'}`}>
                    <Users size={18} className={`${isRolesOverAllocated ? 'text-red-500' : 'text-[#5a9a00] dark:text-[#9cf822]'} mb-2`} />
                    <p className="text-[9px] font-bold uppercase tracking-tight mb-0.5">Team</p>
                    <span className="text-xl font-bold">{collaboratorPool}%</span>
                  </div>
                  <div className="p-4 rounded-2xl border border-zinc-100 bg-zinc-50 dark:bg-black/20 dark:border-zinc-800 flex flex-col items-center grayscale opacity-60">
                    <ShieldCheck size={18} className="text-zinc-400 mb-2" />
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight mb-0.5">Fee</p>
                    <span className="text-xl font-bold">{PLATFORM_FEE}%</span>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Required Roles</label>
                  <button type="button" onClick={handleAddRole} className="text-[10px] font-bold uppercase tracking-widest text-[#5a9a00] flex items-center gap-1">
                    <Plus size={14} /> Add Role
                  </button>
                </div>
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center gap-3">
                      <input 
                        type="text" value={role.title} onChange={(e) => updateRole(role.id, 'title', e.target.value)}
                        placeholder="e.g. Lead UI Designer"
                        className="flex-grow bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-white outline-none focus:border-[#9cf822]"
                      />
                      <div className="w-24 relative">
                        <Percent size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                          type="number" value={role.share} onChange={(e) => updateRole(role.id, 'share', e.target.value)}
                          placeholder="0"
                          className="w-full bg-zinc-50 border border-zinc-100 rounded-xl py-3 pl-4 pr-8 text-sm dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-white outline-none focus:border-[#9cf822]"
                        />
                      </div>
                      <button type="button" onClick={() => handleRemoveRole(role.id)} className="p-3 text-zinc-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </form>
            
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/20">
              <button 
                type="button"
                onClick={() => { setStep(2); triggerHaptic(15); }}
                disabled={!projectName || !budget || isRolesOverAllocated}
                className="w-full flex items-center justify-center gap-3 py-5 bg-black text-white dark:bg-white dark:text-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all font-bold text-sm uppercase tracking-widest disabled:opacity-50"
              >
                <span>Set Deliverables</span> <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className={`transition-all duration-500 ${step === 2 ? 'block opacity-100' : 'hidden opacity-0 absolute pointer-events-none'}`}>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-black dark:text-white uppercase tracking-tight">Deliverables Roadmap</h3>
                  <p className="text-xs text-zinc-500">Break your project into trackable phases and dates.</p>
                </div>
                <button type="button" onClick={handleAddMilestone} className="text-[10px] font-bold uppercase tracking-widest text-[#5a9a00] flex items-center gap-1 bg-[#9cf822]/10 px-3 py-1.5 rounded-lg">
                  <Plus size={14} /> Add Phase
                </button>
              </div>

              <div className="space-y-6">
                {milestones.map((milestone, idx) => (
                  <div key={milestone.id} className="p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 relative group">
                    <span className="absolute -top-3 left-4 bg-white dark:bg-black px-2 text-[10px] font-bold text-zinc-400 tracking-widest uppercase border border-zinc-100 dark:border-zinc-800 rounded-full">Phase {idx + 1}</span>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-2">
                      <div className="md:col-span-7 relative">
                        <Target size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                          type="text" value={milestone.title} onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                          placeholder="e.g. Wireframes & UI Kit"
                          className="w-full bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-9 pr-3 text-sm focus:border-[#9cf822] transition-colors outline-none text-black dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-5 relative flex gap-2">
                        <div className="relative flex-grow">
                          <input 
                            type="date" value={milestone.timeline} 
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => updateMilestone(milestone.id, 'timeline', e.target.value)}
                            className="w-full bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm focus:border-[#9cf822] transition-colors outline-none text-black dark:text-white cursor-pointer"
                          />
                        </div>
                        <button type="button" onClick={() => handleRemoveMilestone(milestone.id)} className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors shrink-0">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/20">
              <button 
                onClick={handleDeployProject} 
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-5 bg-[#9cf822] text-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all font-bold text-sm uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-[#9cf822]/20"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <><span>Post Project</span><Briefcase size={18} /></>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}