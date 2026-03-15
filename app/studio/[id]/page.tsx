'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Loader2, ArrowLeft, Users, CheckCircle, 
  XCircle, User, Percent, Briefcase, ShieldCheck, ArrowRight,
  Image as ImageIcon, FileText, Download
} from 'lucide-react';
import Link from 'next/link';

export default function ManageProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]); 
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Accept Modal State
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [assignedRole, setAssignedRole] = useState('');
  const [assignedEquity, setAssignedEquity] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  useEffect(() => {
    async function fetchManagementData() {
      // 1. Verify User Ownership
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      // 2. Fetch Project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (projectError || projectData.user_id !== user.id) {
        return router.push('/my-projects');
      }
      setProject(projectData);

      // 3. Fetch Dynamic Roles
      const { data: rolesData } = await supabase
        .from('project_roles')
        .select('*')
        .eq('project_id', projectId);
      setRoles(rolesData || []);

      // 4. Fetch Applications
      const { data: appsData } = await supabase
        .from('collaborations')
        .select('*, profiles:user_id(full_name, avatar_url, role)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      setApplications(appsData || []);
      setLoading(false);
    }

    fetchManagementData();
  }, [projectId, supabase, router]);

  const handleDecline = async (appId: string) => {
    if (!window.confirm("Are you sure you want to decline this applicant?")) return;
    triggerHaptic(10);
    
    // Optimistic UI
    setApplications(apps => apps.map(app => app.id === appId ? { ...app, status: 'declined' } : app));
    
    // DB Update
    await supabase.from('collaborations').update({ status: 'declined' }).eq('id', appId);
  };

  const handleAccept = async () => {
    if (!assignedRole || !assignedEquity) return alert("Please assign a role and equity share.");
    
    const equityNum = Number(assignedEquity);
    const currentEquity = project.equity || project.available_share || 0;

    if (equityNum > currentEquity) return alert("You cannot assign more equity than you have available.");
    
    setIsProcessing(true);
    triggerHaptic(50);

    try {
      // 1. Update Collaboration Status
      await supabase.from('collaborations').update({ 
        status: 'accepted',
        assigned_role: assignedRole,
        equity_share: equityNum
      }).eq('id', selectedApp.id);

      // 2. Deduct Equity from Project Pool 
      const newAvailableShare = currentEquity - equityNum;
      await supabase.from('projects').update({ 
        equity: newAvailableShare,
        available_share: newAvailableShare 
      }).eq('id', project.id);

      // 3. Update the specific Role to 'filled' 
      const matchedRole = roles.find(r => (r.title || r.role_name) === assignedRole);
      if (matchedRole) {
        await supabase.from('project_roles').update({ status: 'filled' }).eq('id', matchedRole.id);
      }

      // 4. Notify the user they were accepted
      await supabase.from('notifications').insert({
        user_id: selectedApp.user_id,
        sender_id: project.user_id,
        project_id: projectId,
        type: 'accepted',
        message: `accepted your request to join as ${assignedRole}`
      });

      // Update Local State
      setProject({ ...project, equity: newAvailableShare, available_share: newAvailableShare });
      setApplications(apps => apps.map(app => 
        app.id === selectedApp.id 
          ? { ...app, status: 'accepted', assigned_role: assignedRole, equity_share: equityNum } 
          : app
      ));

      setSelectedApp(null);
      setAssignedRole('');
      setAssignedEquity('');
    } catch (error: any) {
      alert("Something went wrong: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><Loader2 className="animate-spin text-[#9cf822]" /></div>;

  const pendingApps = applications.filter(app => app.status === 'pending');
  const activeTeam = applications.filter(app => app.status === 'accepted');

  const displayEquity = project.equity || project.available_share || 0;
  const displayImage = project.cover_image_url || project.image_url;

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 pb-24">
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-12">
        
        {/* HEADER */}
        <Link href="/my-projects" className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white transition-colors mb-8 w-fit">
          <ArrowLeft size={16} /> Back to My Projects
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0 shadow-sm border border-zinc-200 dark:border-zinc-800">
              {displayImage ? (
                <img src={displayImage} className="w-full h-full object-cover" alt={project.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700"><ImageIcon size={32}/></div>
              )}
            </div>
            <div>
              <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3 inline-block">
                Project Management
              </span>
              <h1 className="text-2xl md:text-3xl font-medium text-black dark:text-white tracking-tight">{project.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shrink-0">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Available Equity</p>
              <p className="text-2xl font-semibold text-[#5a9a00] dark:text-[#9cf822]">{displayEquity}%</p>
            </div>
            <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800 mx-2" />
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Team Size</p>
              <p className="text-2xl font-semibold text-black dark:text-white">{activeTeam.length + 1}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* LEFT: PENDING APPLICATIONS */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-medium text-black dark:text-white flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-4">
              Pending Applications <span className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs px-2 py-0.5 rounded-full">{pendingApps.length}</span>
            </h2>

            {pendingApps.length === 0 ? (
              <div className="p-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] text-center bg-zinc-50/50 dark:bg-zinc-950/50">
                <Users className="mx-auto text-zinc-400 mb-3" size={32} />
                <p className="text-sm font-medium text-black dark:text-white">No pending requests</p>
                <p className="text-xs text-zinc-500 mt-1">When users apply to join your venture, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApps.map(app => (
                  <div key={app.id} className="p-6 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0">
                          {app.profiles?.avatar_url ? (
                            <img src={app.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} className="m-auto mt-3 text-zinc-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-black dark:text-white">{app.profiles?.full_name || 'Anonymous User'}</h4>
                          <p className="text-xs text-zinc-500">{app.profiles?.role || 'Creative Professional'}</p>
                        </div>
                      </div>
                      <Link href={`/profile/${app.user_id}`} className="text-[10px] font-bold uppercase tracking-widest text-[#5a9a00] dark:text-[#9cf822] hover:underline">
                        View Profile
                      </Link>
                    </div>
                    
                    <div className="mt-5 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Professional Pitch</p>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 italic whitespace-pre-wrap">"{app.message}"</p>
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedApp(app)}
                        className="flex-1 py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        <CheckCircle size={16} /> Accept & Assign Role
                      </button>
                      <button 
                        onClick={() => handleDecline(app.id)}
                        className="p-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: TEAM & ASSETS */}
          <div className="space-y-12">
            
            {/* Active Team */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-black dark:text-white flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                Active Team roster
              </h2>

              <div className="space-y-3">
                {/* The Founder Card */}
                <div className="p-4 bg-[#9cf822]/10 border border-[#9cf822]/20 rounded-2xl flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
                     <ShieldCheck className="text-[#9cf822]" size={20} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-[#5a9a00] dark:text-[#9cf822] flex items-center gap-1">You <span className="text-[10px] uppercase tracking-widest opacity-70">(Project Lead)</span></p>
                   </div>
                </div>

                {/* Accepted Members */}
                {activeTeam.map(member => (
                  <div key={member.id} className="p-4 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0">
                      {member.profiles?.avatar_url ? (
                        <img src={member.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={16} className="m-auto mt-2.5 text-zinc-400" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold text-black dark:text-white truncate">{member.profiles?.full_name}</p>
                      <p className="text-xs text-zinc-500 truncate">{member.assigned_role}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-black dark:text-white">{member.equity_share}%</span>
                    </div>
                  </div>
                ))}

                {activeTeam.length > 0 && (
                  <button 
                    onClick={() => router.push(`/workspace/${project.id}`)}
                    className="w-full mt-4 py-4 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    Enter Workspace <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Project Assets / Files */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-black dark:text-white flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                Project Assets
              </h2>

              {project.additional_files?.length > 0 ? (
                <div className="space-y-3">
                  {project.additional_files.map((file: string, idx: number) => (
                    <a key={idx} href={file} target="_blank" className="flex items-center justify-between p-4 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-[#9cf822] transition-colors group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText size={16} className="text-zinc-400 group-hover:text-[#9cf822] shrink-0" />
                        <span className="text-sm font-semibold text-black dark:text-white truncate">Attachment_{idx + 1}</span>
                      </div>
                      <Download size={16} className="text-zinc-400 group-hover:text-[#9cf822] shrink-0" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center bg-zinc-50/50 dark:bg-zinc-950/50">
                  <p className="text-sm font-medium text-zinc-500">No additional files uploaded.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* ACCEPT MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-md rounded-[2.5rem] border border-zinc-100 dark:border-zinc-900 overflow-hidden shadow-2xl">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-black dark:text-white">Accept Collaborator</h3>
                  <p className="text-xs text-zinc-500 mt-1">Assign role and equity to {selectedApp.profiles?.full_name}</p>
                </div>
                <button onClick={() => setSelectedApp(null)} className="p-2 text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 rounded-full transition-colors">
                  <XCircle size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Briefcase size={12}/> Select Role</label>
                  <select 
                    value={assignedRole} onChange={(e) => setAssignedRole(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#9cf822] text-black dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Choose from open roles...</option>
                    {roles.map((role: any) => (
                      <option key={role.id} value={role.title || role.role_name}>{role.title || role.role_name}</option>
                    ))}
                    <option value="Custom Role">Other / Custom Role</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Percent size={12}/> Equity Share</label>
                    <span className="text-xs text-zinc-500">Max available: {displayEquity}%</span>
                  </div>
                  <input 
                    type="number" value={assignedEquity} onChange={(e) => setAssignedEquity(e.target.value)}
                    placeholder="e.g. 10" max={displayEquity}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#9cf822] text-black dark:text-white"
                  />
                </div>
              </div>

              <button 
                onClick={handleAccept}
                disabled={isProcessing || !assignedRole || !assignedEquity}
                className="w-full py-4 bg-[#9cf822] text-black rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#84cc0e] transition-all"
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : "Confirm & Welcome to Team"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}