'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  X, Loader2, Camera, Globe, Linkedin, 
  Twitter, Instagram, Facebook, MapPin, User, Briefcase, Image as ImageIcon 
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

      // 1. Upload to Supabase Storage Bucket 'profiles'
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get the Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // 3. Update local state so it shows immediately in the modal
      setFormData(prev => ({
        ...prev,
        [type === 'avatar' ? 'avatar_url' : 'header_url']: publicUrl
      }));

    } catch (error) {
      console.error('Error uploading:', error);
      alert('Upload failed! Make sure your "profiles" bucket is set to Public in Supabase.');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...formData,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Save failed! Check if your database columns exist.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f0f0f] w-full max-w-xl rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black dark:text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-grow">
          {/* Images Section */}
          <div className="relative">
            <div className="h-40 bg-zinc-100 dark:bg-zinc-900 relative group">
              {formData.header_url ? (
                <img src={formData.header_url} className="w-full h-full object-cover" alt="Banner" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400"><ImageIcon size={32} /></div>
              )}
              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-sm font-bold gap-2">
                <Camera size={20} /> {uploading === 'header' ? 'Uploading...' : 'Change Banner'}
                <input type="file" accept="image/*" onChange={(e) => uploadImage(e, 'header')} className="hidden" />
              </label>
            </div>

            <div className="px-8">
              <div className="relative w-28 h-28 -mt-14 rounded-full border-4 border-white dark:border-[#0f0f0f] bg-zinc-200 dark:bg-zinc-800 overflow-hidden shadow-lg group">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400"><User size={40} /></div>
                )}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                  <Camera size={20} />
                  <span className="text-[10px] font-bold uppercase mt-1">{uploading === 'avatar' ? '...' : 'Edit'}</span>
                  <input type="file" accept="image/*" onChange={(e) => uploadImage(e, 'avatar')} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <p className="text-[10px] font-medium title case text-[#000000]">Basic Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" placeholder="Full Name" value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm" 
                />
                <input 
                  type="text" placeholder="Role (e.g. Designer)" value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm" 
                />
              </div>
              <input 
                type="text" placeholder="Location" value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm" 
              />
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <p className="text-[10px] font-medium title case text-[#000000]">Social Presence</p>
              <div className="space-y-3">
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" size={16} />
                  <input type="text" placeholder="LinkedIn URL" value={formData.linkedin_url} onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm" />
                </div>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500" size={16} />
                  <input type="text" placeholder="Twitter URL" value={formData.twitter_url} onChange={(e) => setFormData({...formData, twitter_url: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm" />
                </div>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" size={16} />
                  <input type="text" placeholder="Instagram URL" value={formData.instagram_url} onChange={(e) => setFormData({...formData, instagram_url: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm" />
                </div>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9cf822]" size={16} />
                  <input type="text" placeholder="Website URL" value={formData.website_url} onChange={(e) => setFormData({...formData, website_url: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm" />
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
