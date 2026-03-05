'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MyProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchProjects() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      setProjects(data || []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault(); // Prevents the Link from triggering
    e.stopPropagation(); // Stops the click from bubbling up to the card

    const confirmed = window.confirm("Are you sure you want to delete this project?");
    if (!confirmed) return;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setProjects(projects.filter(p => p.id !== projectId));
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-zinc-500 p-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 pt-32 flex flex-col items-center font-light">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-16">
          <h1 className="text-4xl tracking-tight">My Projects</h1>
          <Link href="/create" className="text-[10px] uppercase border border-zinc-800 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all">
            New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-900 rounded-[40px]">
            <p className="text-zinc-500">No projects found. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project) => (
              <div key={project.id} className="relative group">
                {/* Delete Button - Independent from the Link */}
                <button 
                  onClick={(e) => handleDelete(e, project.id)}
                  className="absolute top-8 right-8 z-20 text-[9px] uppercase text-zinc-700 hover:text-red-500 transition-colors tracking-tighter"
                >
                  [ Delete Project ]
                </button>

                {/* Clickable Card Area - Updated to route to Founder management dashboard */}
                <Link href={`/founder/${project.id}`}>
                  <div className="bg-[#0c0c0c] border border-zinc-900 p-8 rounded-[40px] hover:border-zinc-700 transition-all cursor-pointer h-full">
                    <div className="mb-8">
                      <h2 className="text-2xl mb-1">{project.name}</h2>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] uppercase text-zinc-500 mb-1 tracking-widest">Valuation</p>
                        <p className="text-4xl text-[#9cf822]">₦{project.valuation.toLocaleString()}</p>
                      </div>

                      <div className="flex justify-between pt-6 border-t border-zinc-900/50">
                        <div>
                          <p className="text-[10px] uppercase text-zinc-500 tracking-widest">Collab Pool</p>
                          <p className="text-xl">{project.collaborator_pool}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase text-zinc-500 tracking-widest">Your Share</p>
                          <p className="text-xl text-zinc-400">{project.owner_share}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}