'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { X, Upload, Loader2, CheckCircle2 } from 'lucide-react';

interface ProjectModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProjectUploadModal({ userId, isOpen, onClose, onSuccess }: ProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    // Basic validation to prevent empty uploads
    if (!file || !title) return alert('Please add a title and an image.');
    setLoading(true);

    try {
      // 1. Upload the image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars') // Using the 'avatars' bucket or your preferred bucket
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get the Public URL of the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // 3. Save the project details to the database
      const { error: dbError } = await supabase
        .from('projects')
        .insert([{ 
          user_id: userId, 
          title, 
          image_url: publicUrl 
        }]);

      if (dbError) throw dbError;

      // 4. Success handling: Close and refresh profile stats
      onSuccess(); 
      onClose();
      setTitle('');
      setFile(null);
      setPreview(null);
      
    } catch (err) {
      console.error(err);
      // This alert triggers if the 'projects' table is missing or RLS is blocked
      alert('Upload failed. Please check your database connection.'); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div className="bg-[#0a0a0a] border border-zinc-900 w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#9cf822] rounded-full animate-pulse" />
            <h2 className="text-xl font-medium uppercase tracking-tighter text-white">Upload Job</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* Image Preview / Upload Area */}
        <div 
          onClick={() => document.getElementById('project-file')?.click()}
          className="aspect-video w-full bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-[#9cf822]/50 transition-all"
        >
          {preview ? (
            <img src={preview} className="w-full h-full object-cover" alt="Preview" />
          ) : (
            <div className="text-center">
              <Upload size={32} className="text-zinc-700 mx-auto mb-2 group-hover:text-[#9cf822] transition-colors" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Select Project Image</p>
            </div>
          )}
        </div>
        <input id="project-file" type="file" hidden accept="image/*" onChange={handleFileChange} />

        <div className="space-y-4">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-2">Project Title</label>
          <input 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-xs text-white outline-none focus:border-[#9cf822] transition-colors"
            placeholder="e.g. Brand Identity 2024"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <button 
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-[#9cf822] text-black py-5 rounded-full font-bold uppercase tracking-widest text-[10px] disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16}/>
          ) : (
            <>
              <CheckCircle2 size={16} />
              Add to Portfolio
            </>
          )}
        </button>
      </div>
    </div>
  );
}