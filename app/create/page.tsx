'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Rocket, AlignLeft, Users, DollarSign, Percent, 
  Plus, Trash2, ShieldCheck, Info, Sparkles, CheckCircle2, Bot, UploadCloud, FileIcon, X, Image as ImageIcon, Flag
} from 'lucide-react';

// Initialize Supabase OUTSIDE the component so it doesn't recreate on every keystroke
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateProjectPage() {
  const router = useRouter();
  
  // --- Form State ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roles, setRoles] = useState([{ id: 1, title: '', type: 'Developer' }]);
  
  // NEW: Milestone State
  const [milestones, setMilestones] = useState([{ id: Date.now(), title: '', amount: '', dueDate: '' }]);
  
  // File Upload State
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  
  // Compensation State
  const [compType, setCompType] = useState<'fixed' | 'percentage' | 'both'>('both');
  const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD');
  const [budget, setBudget] = useState('');
  const [equity, setEquity] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- CoL-Pal (AI) State ---
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);

  // --- Handlers ---
  const handleAddRole = () => setRoles([...roles, { id: Date.now(), title: '', type: 'Designer' }]);
  const handleRemoveRole = (id: number) => { if (roles.length > 1) setRoles(roles.filter(r => r.id !== id)); };
  const handleUpdateRole = (id: number, field: string, value: string) => setRoles(roles.map(r => r.id === id ? { ...r, [field]: value } : r));

  // NEW: Milestone Handlers
  const handleAddMilestone = () => setMilestones([...milestones, { id: Date.now(), title: '', amount: '', dueDate: '' }]);
  const handleRemoveMilestone = (id: number) => { if (milestones.length > 1) setMilestones(milestones.filter(m => m.id !== id)); };
  const handleUpdateMilestone = (id: number, field: string, value: string) => setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: value } : m));

  // --- File Handlers ---
  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAdditionalFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAdditionalFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeAdditionalFile = (indexToRemove: number) => {
    setAdditionalFiles(files => files.filter((_, index) => index !== indexToRemove));
  };

  // --- CoL-Pal Generation Logic ---
  const generateBriefWithAI = async () => {
    if (!title) return;
    setIsGeneratingBrief(true);
    
    setTimeout(() => {
      const generatedText = `Project Overview:\nWe are building a cutting-edge solution for "${title}". The goal is to deliver a premium, high-performing product that stands out in the market.\n\nKey Objectives:\n- Design an intuitive, high-fidelity user interface.\n- Architect a robust, secure, and scalable infrastructure.\n- Ensure cross-platform responsiveness and seamless user experience.\n\nCollaborator Expectations:\nWe are looking for dedicated professionals who can take ownership of their roles, communicate effectively, and ship high-quality work on schedule.`;
      setDescription(generatedText);
      setIsGeneratingBrief(false);
    }, 1800);
  };

  // --- REAL SUPABASE SUBMISSION LOGIC ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Use getSession() to read the local authenticated state
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        throw new Error("Session sync error: Please refresh the page. We couldn't verify your active login state.");
      }

      let coverImageUrl = null;
      let fileUrls: string[] = [];

      // 1. Upload Cover Image (if provided)
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { data: imgData, error: imgError } = await supabase.storage
          .from('project_files') 
          .upload(`covers/${fileName}`, coverImage);
        
        if (imgError) throw new Error("Failed to upload cover image. Check Supabase Storage bucket.");
        
        const { data: { publicUrl } } = supabase.storage
          .from('project_files')
          .getPublicUrl(`covers/${fileName}`);
        coverImageUrl = publicUrl;
      }

      // 2. Upload Additional Files (if provided)
      for (const file of additionalFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-${file.name}`;
        const { data: docData, error: docError } = await supabase.storage
          .from('project_files')
          .upload(`docs/${fileName}`, file);
          
        if (!docError) {
           const { data: { publicUrl } } = supabase.storage
            .from('project_files')
            .getPublicUrl(`docs/${fileName}`);
           fileUrls.push(publicUrl);
        }
      }

      // 3. Insert Project into Database
      const { data: projectData, error: projectError } = await supabase
        .from('projects') 
        .insert({
          user_id: user.id,
          title,
          description,
          cover_image_url: coverImageUrl,
          additional_files: fileUrls,
          compensation_type: compType,
          currency,
          budget: budget ? parseFloat(budget) : null,
          equity: equity ? parseFloat(equity) : null,
          status: 'open'
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // 4. Insert Roles into Database
      if (projectData) {
        const rolesToInsert = roles.map(role => ({
          project_id: projectData.id,
          title: role.title,
          role_name: role.title, // Added to satisfy existing DB schema requirements
          type: role.type,
          status: 'open'
        }));
        
        const { error: rolesError } = await supabase
          .from('project_roles') 
          .insert(rolesToInsert);
          
        if (rolesError) throw rolesError;

        // 5. NEW: Insert Milestones into Database
        // Only insert if the first milestone actually has a title
        if (milestones[0].title.trim() !== '') {
          const milestonesToInsert = milestones.map((m, index) => ({
            project_id: projectData.id,
            title: m.title,
            amount: m.amount ? parseFloat(m.amount) : null,
            due_date: m.dueDate || null,
            order_index: index,
            status: 'pending'
          }));

          const { error: milestonesError } = await supabase
            .from('project_milestones') 
            .insert(milestonesToInsert);
            
          if (milestonesError) throw milestonesError;
        }
      }

      setIsSuccess(true);
      
      // Redirect to discover page after success
      setTimeout(() => {
        router.push('/discover');
      }, 2000);

    } catch (error: any) {
      console.error("Submission error:", error);
      let errorMsg = error.message;
      if (errorMsg.includes('does not exist')) {
        errorMsg = "Database tables are missing in Supabase. Please ensure the 'projects', 'project_roles', and 'project_milestones' tables are created.";
      }
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-10 bg-zinc-900 rounded-[2rem] text-center animate-in zoom-in-95 duration-500 border border-zinc-800 shadow-2xl">
        <div className="w-20 h-20 bg-[#9cf822]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-[#9cf822]" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Project Live!</h2>
        <p className="text-zinc-400 font-medium mb-8">
          Your project has been successfully published to the CoLab ecosystem.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
          <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
          Redirecting to discover feed...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#9cf822]/10 text-[#9cf822] text-xs font-bold uppercase tracking-wider rounded-full mb-4">
          <Sparkles size={14} /> Creation Engine
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Launch a Project
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-2 text-lg">
          Define your vision, lock in the escrow, and attract top-tier talent.
        </p>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECTION 1: Basic Info & Media */}
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <AlignLeft size={20} className="text-[#9cf822]" /> Basic Details
            </h2>
            
            <div className="space-y-6">
              
              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2">Cover Image (Optional)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                    coverImagePreview ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 dark:border-zinc-800 hover:border-[#9cf822] hover:bg-[#9cf822]/5 bg-zinc-50 dark:bg-black'
                  }`}
                >
                  {coverImagePreview ? (
                    <div className="relative w-full h-full group">
                      <img src={coverImagePreview} alt="Cover preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-medium text-sm">Change Image</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ImageIcon size={32} className="text-zinc-400 mb-2" />
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Click to upload a cover image</p>
                      <p className="text-xs text-zinc-500 mt-1">16:9 recommended, max 5MB</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleCoverImageSelect} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2">Project Title</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., CAVIE Fintech App Redesign"
                  className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9cf822] transition-shadow"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-zinc-900 dark:text-white">Project Brief</label>
                  {title.length > 3 && description.length === 0 && !isGeneratingBrief && (
                    <span className="text-[10px] font-bold text-[#9cf822] flex items-center gap-1 animate-pulse uppercase tracking-wider">
                      <Bot size={12} /> CoL-Pal is ready
                    </span>
                  )}
                </div>
                
                <div className="relative">
                  <textarea 
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    placeholder="Describe the problem, your solution, and what you expect from collaborators..."
                    className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9cf822] transition-shadow resize-none"
                  />
                  
                  {title.length > 3 && description.length < 10 && (
                    <div className="absolute bottom-4 right-4 z-10 animate-in zoom-in fade-in duration-300">
                      <button
                        type="button"
                        onClick={generateBriefWithAI}
                        disabled={isGeneratingBrief}
                        className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-[#9cf822] dark:text-black px-4 py-2.5 rounded-xl text-sm font-bold shadow-xl hover:scale-105 transition-all disabled:opacity-80 disabled:hover:scale-100"
                      >
                        {isGeneratingBrief ? (
                          <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Drafting...</>
                        ) : (
                          <><Sparkles size={16} /> Auto-write with CoL-Pal</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Files Upload */}
              <div>
                <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2">Additional Files (Briefs, Wireframes, PDFs)</label>
                <div className="space-y-3">
                  {additionalFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileIcon size={16} className="text-zinc-500 shrink-0" />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{file.name}</span>
                        <span className="text-xs text-zinc-500 shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button type="button" onClick={() => removeAdditionalFile(idx)} className="text-zinc-400 hover:text-red-500 transition-colors p-1">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors py-2"
                  >
                    <UploadCloud size={16} /> Attach Files
                  </button>
                  <input 
                    type="file" 
                    ref={docInputRef} 
                    onChange={handleAdditionalFilesSelect} 
                    multiple 
                    className="hidden" 
                  />
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 2: Roles Required */}
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Users size={20} className="text-[#9cf822]" /> Roles Needed
              </h2>
              <span className="text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                {roles.length} Role{roles.length > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="space-y-4">
              {roles.map((role) => (
                <div key={role.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      required
                      value={role.title}
                      onChange={(e) => handleUpdateRole(role.id, 'title', e.target.value)}
                      placeholder="e.g., Senior Frontend Dev"
                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-zinc-900 dark:text-white focus:ring-0 placeholder-zinc-400"
                    />
                  </div>
                  <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-zinc-200 dark:border-zinc-800 pt-3 sm:pt-0 sm:pl-3">
                    <select 
                      value={role.type}
                      onChange={(e) => handleUpdateRole(role.id, 'type', e.target.value)}
                      className="bg-transparent text-sm font-medium text-zinc-600 dark:text-zinc-400 focus:ring-0 border-none p-0 cursor-pointer"
                    >
                      <option>Developer</option>
                      <option>Designer</option>
                      <option>Creator</option>
                      <option>Marketing</option>
                    </select>
                    {roles.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveRole(role.id)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <button 
                type="button"
                onClick={handleAddRole}
                className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add another role
              </button>
            </div>
          </div>

          {/* NEW SECTION 3: Milestones */}
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Flag size={20} className="text-[#9cf822]" /> Project Milestones
              </h2>
              <span className="text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                {milestones.length} Step{milestones.length > 1 ? 's' : ''}
              </span>
            </div>
            
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-6">
              Break down your project into deliverable phases. This helps with tracking progress and releasing escrow payments safely.
            </p>

            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Milestone {index + 1}</span>
                    {milestones.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMilestone(milestone.id)}
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div>
                    <input 
                      type="text" 
                      value={milestone.title}
                      onChange={(e) => handleUpdateMilestone(milestone.id, 'title', e.target.value)}
                      placeholder="e.g., Deliver High-Fidelity Figma Prototypes"
                      className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 pb-2 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-[#9cf822] placeholder-zinc-400 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Amount / % Share</label>
                      <input 
                        type="number" 
                        value={milestone.amount}
                        onChange={(e) => handleUpdateMilestone(milestone.id, 'amount', e.target.value)}
                        placeholder="e.g., 20"
                        className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#9cf822] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Target Date</label>
                      <input 
                        type="date" 
                        value={milestone.dueDate}
                        onChange={(e) => handleUpdateMilestone(milestone.id, 'dueDate', e.target.value)}
                        className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#9cf822] transition-colors"
                      />
                    </div>
                  </div>

                </div>
              ))}
              
              <button 
                type="button"
                onClick={handleAddMilestone}
                className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add another milestone
              </button>
            </div>
          </div>

          {/* SECTION 4: Compensation & Escrow */}
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#9cf822]" /> Compensation Engine
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-6">
              Funds are held securely in CoLab Escrow until milestones are met.
            </p>
            
            <div className="flex p-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl mb-6">
              {['fixed', 'percentage', 'both'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCompType(type as any)}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all capitalize ${
                    compType === type 
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {(compType === 'fixed' || compType === 'both') && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-zinc-900 dark:text-white">Total Fixed Budget</label>
                    
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-0.5">
                      <button 
                        type="button"
                        onClick={() => setCurrency('USD')}
                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${currency === 'USD' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-zinc-500'}`}
                      >
                        USD
                      </button>
                      <button 
                        type="button"
                        onClick={() => setCurrency('NGN')}
                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${currency === 'NGN' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-zinc-500'}`}
                      >
                        NGN
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">
                      {currency === 'USD' ? '$' : '₦'}
                    </div>
                    <input 
                      type="number" 
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder={currency === 'USD' ? "5,000" : "5,000,000"}
                      className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl py-4 pl-10 pr-4 text-lg font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9cf822] transition-shadow"
                    />
                  </div>
                </div>
              )}

              {(compType === 'percentage' || compType === 'both') && (
                <div>
                  <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2">Percentage Share (Equity/Revenue)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"><Percent size={18} /></div>
                    <input 
                      type="number" 
                      max="100"
                      value={equity}
                      onChange={(e) => setEquity(e.target.value)}
                      placeholder="15"
                      className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl py-4 pl-10 pr-4 text-lg font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9cf822] transition-shadow"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium">This is the total % pool available to split among collaborators.</p>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* RIGHT COLUMN: Summary & Actions */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            
            <div className="bg-zinc-900 text-white rounded-[2rem] p-6 shadow-2xl border border-zinc-800 overflow-hidden relative">
              {coverImagePreview && (
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <img src={coverImagePreview} className="w-full h-full object-cover blur-sm" alt="Background preview" />
                </div>
              )}
              
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-4">Project Overview</h3>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Title</p>
                    <p className="text-sm font-medium line-clamp-1">{title || 'Untitled Project'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Roles Needed</p>
                    <p className="text-sm font-medium">{roles.length} Openings</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Milestones</p>
                    <p className="text-sm font-medium">{milestones[0].title ? milestones.length : 0} defined step{milestones.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Total Pool</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {budget && <span className="text-lg font-bold text-[#9cf822]">{currency === 'USD' ? '$' : '₦'}{Number(budget).toLocaleString()}</span>}
                      {budget && equity && <span className="text-zinc-500">+</span>}
                      {equity && <span className="text-lg font-bold text-purple-400">{equity}%</span>}
                      {!budget && !equity && <span className="text-sm font-medium text-zinc-400">Not set</span>}
                    </div>
                  </div>
                </div>

                <div className="bg-black/50 p-4 rounded-xl flex gap-3 border border-zinc-800 backdrop-blur-md">
                  <Info size={20} className="text-[#9cf822] shrink-0" />
                  <p className="text-xs font-medium text-zinc-400 leading-relaxed">
                    Upon publishing, this project will appear in the Community Feed. Escrow funding will be required before work begins.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                type="submit"
                disabled={isSubmitting || !title || (!budget && !equity)}
                className="w-full py-4 bg-[#9cf822] text-black font-bold rounded-xl hover:bg-[#8be01d] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[#9cf822]/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Publishing to DB...
                  </div>
                ) : (
                  <>Publish Project <Rocket size={18} /></>
                )}
              </button>
            </div>

          </div>
        </div>

      </form>
    </div>
  );
}