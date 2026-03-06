'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  X, Loader2, Camera, Globe, Linkedin, 
  Twitter, Instagram, Facebook, MapPin, User, Briefcase, 
  Image as ImageIcon, MoveHorizontal, Maximize, MoveVertical
} from 'lucide-react';

interface EditProfileModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditProfileModal({ user, isOpen, onClose, onUpdate }: EditProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<'avatar' | 'header' | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    role: '',
    address: '',
    linkedin_url: '',
    twitter_url: '',
    instagram_url: '',
    facebook_url: '',
    website_url: '',
    avatar_url: '',
    header_url: '',
    avatar_zoom: 1,
    header_zoom: 1,
    header_y: 50, // Vertical position percentage
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        full_name: user.user_metadata?.full_name || user.full_name || '',
        role: user.role || '',
        address: user.address || '',
        linkedin_url: user.linkedin_url || '',
        twitter_url: user.twitter_url || '',
        instagram_url: user.instagram_url || '',
        facebook_url: user.facebook_url || '',
        website_url: user.website_url || '',
        avatar_url: user.avatar_url || '',
        header_url: user.header_url || '',
        avatar_zoom: user.avatar_zoom || 1,
        header_zoom: user.header_zoom || 1,
        header_y: user.header_y || 50,
      });
    }
  }, [user, isOpen]);

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'header') => {
    try {
      setUploading(type);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${type}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        [type === 'avatar' ? 'avatar_url' : 'header_url']: publicUrl,
        [type === 'avatar' ? 'avatar_zoom' : 'header_zoom']: 1, // Reset zoom on new upload
      }));

    } catch (error) {
      console.error('Error uploading:', error);
      alert('Upload failed! Check bucket permissions.');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // STRICT PAYLOAD: We abandon "...formData" to prevent ANY empty strings ("")
      // from sneaking into columns that Supabase expects to be numbers or text.
      // We explicitly cast numbers and fall back to null for empty text.
      const payload = {
        id: user.id,
        full_name: formData.full_name || null,
        role: formData.role || null,
        address: formData.address || null,
        linkedin_url: formData.linkedin_url || null,
        twitter_url: formData.twitter_url || null,
        instagram_url: formData.instagram_url || null,
        facebook_url: formData.facebook_url || null,
        website_url: formData.website_url || null,
        avatar_url: formData.avatar_url || null,
        header_url: formData.header_url || null,
        avatar_zoom: Number(formData.avatar_zoom) || 1,
        header_zoom: Number(formData.header_zoom) || 1,
        header_y: Number(formData.header_y) || 50,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(payload);

      if (error) throw error;
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Save failed! Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f0f0f] w-full max-w-xl md:rounded-[2.5rem] border-t md:border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col h-full md:max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black dark:text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-grow scrollbar-hide">
          {/* ADJUSTABLE IMAGES SECTION */}
          <div className="relative group/main">
            {/* Header / Banner Container */}
            <div className="h-48 md:h-56 bg-zinc-100 dark:bg-zinc-900 relative overflow-hidden">
              {formData.header_url ? (
                <div className="w-full h-full relative">
                  <img 
                    src={formData.header_url} 
                    className="w-full h-full object-cover transition-transform duration-300" 
                    style={{ 
                      objectPosition: `center ${formData.header_y}%`,
                      transform: `scale(${formData.header_zoom})`
                    }}
                    alt="Banner" 
                  />
                  {/* Adjustment Overlays (Only visible when not uploading) */}
                  {!uploading && (
                    <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-0 group-hover/main:opacity-100 transition-opacity">
                      <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <Maximize size={14} className="text-white/60" />
                          <input 
                            type="range" min="1" max="2" step="0.01" 
                            value={formData.header_zoom}
                            onChange={(e) => setFormData({...formData, header_zoom: parseFloat(e.target.value) || 1})}
                            className="w-24 accent-[#9cf822]" 
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <MoveVertical size={14} className="text-white/60" />
                          <input 
                            type="range" min="0" max="100" step="1" 
                            value={formData.header_y}
                            onChange={(e) => setFormData({...formData, header_y: parseInt(e.target.value) || 50})}
                            className="w-24 accent-[#9cf822]" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400"><ImageIcon size={32} /></div>
              )}
              
              <label className="absolute top-4 left-4 p-3 bg-black/50 hover:bg-black/70 rounded-xl cursor-pointer text-white transition-all backdrop-blur-sm">
                <Camera size={18} />
                <input type="file" accept="image/*" onChange={(e) => uploadImage(e, 'header')} className="hidden" />
              </label>
            </div>

            {/* Avatar Container */}
            <div className="px-8 flex items-end justify-between">
              <div className="relative group">
                <div className="w-28 h-28 md:w-36 md:h-36 -mt-14 rounded-full border-4 border-white dark:border-[#0f0f0f] bg-zinc-200 dark:bg-zinc-800 overflow-hidden shadow-xl relative">
                  {formData.avatar_url ? (
                    <img 
                      src={formData.avatar_url} 
                      className="w-full h-full object-cover" 
                      style={{ transform: `scale(${formData.avatar_zoom})` }}
                      alt="Avatar" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400"><User size={40} /></div>
                  )}
                  
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                    <Camera size={20} />
                    <input type="file" accept="image/*" onChange={(e) => uploadImage(e, 'avatar')} className="hidden" />
                  </label>
                </div>
                
                {/* Avatar Zoom Slider */}
                {formData.avatar_url && (
                  <div className="absolute -right-16 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                    <input 
                      type="range" min="1" max="2" step="0.01" 
                      value={formData.avatar_zoom}
                      onChange={(e) => setFormData({...formData, avatar_zoom: parseFloat(e.target.value) || 1})}
                      className="w-20 accent-[#9cf822] rotate-270" 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Section: Basic Info (Updated with text-base to prevent zoom) */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Basic Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold ml-1 text-zinc-500">Full Name</label>
                  <input 
                    type="text" placeholder="Your name" value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-base md:text-sm focus:ring-2 focus:ring-[#9cf822] transition-all outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold ml-1 text-zinc-500">Professional Role</label>
                  <input 
                    type="text" placeholder="e.g. Designer" value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-base md:text-sm focus:ring-2 focus:ring-[#9cf822] transition-all outline-none" 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold ml-1 text-zinc-500">Location</label>
                <input 
                  type="text" placeholder="City, Country" value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-base md:text-sm focus:ring-2 focus:ring-[#9cf822] transition-all outline-none" 
                />
              </div>
            </div>

            {/* Section: Social Links */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Social Presence</p>
              <div className="space-y-3">
                <div className="relative group">
                  <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                  <input type="text" placeholder="LinkedIn URL" value={formData.linkedin_url} onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-base md:text-sm outline-none" />
                </div>
                <div className="relative group">
                  <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-sky-500 transition-colors" size={16} />
                  <input type="text" placeholder="Twitter URL" value={formData.twitter_url} onChange={(e) => setFormData({...formData, twitter_url: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-base md:text-sm outline-none" />
                </div>
                <div className="relative group">
                  <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-rose-500 transition-colors" size={16} />
                  <input type="text" placeholder="Instagram URL" value={formData.instagram_url} onChange={(e) => setFormData({...formData, instagram_url: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-base md:text-sm outline-none" />
                </div>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#9cf822] transition-colors" size={16} />
                  <input type="text" placeholder="Personal Website URL" value={formData.website_url} onChange={(e) => setFormData({...formData, website_url: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-base md:text-sm outline-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 flex gap-3">
          <button onClick={onClose} className="flex-1 px-6 py-3 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl font-bold text-sm">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 px-6 py-3 bg-[#9cf822] text-black rounded-2xl font-black text-sm hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
