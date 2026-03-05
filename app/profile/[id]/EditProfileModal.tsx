'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  X, Camera, Loader2, User, Image as ImageIcon, MoveVertical, 
  Linkedin, Facebook, Instagram, Twitter, Video, MapPin, Phone,
  Link, Check
} from 'lucide-react';

interface EditProfileModalProps {
  user: any;
  isOpen: boolean; 
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditProfileModal({ user, isOpen, onClose, onUpdate }: EditProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Helper to force browser to ignore old cached images
  const getBustedUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('blob:')) return url; 
    return `${url}${url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
  };

  // State Management
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [tiktok, setTiktok] = useState('');

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [headerPos, setHeaderPos] = useState(50);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // CRITICAL FIX: Sync local state whenever the user data or modal status changes
  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.full_name || user.user_metadata?.full_name || '');
      setRole(user.role || user.user_metadata?.role || '');
      setAddress(user.address || user.user_metadata?.address || '');
      setPhone(user.phone || user.user_metadata?.phone || '');
      setLinkedin(user.linkedin || user.user_metadata?.linkedin || '');
      setFacebook(user.facebook || user.user_metadata?.facebook || '');
      setInstagram(user.instagram || user.user_metadata?.instagram || '');
      setTwitter(user.twitter || user.user_metadata?.twitter || '');
      setTiktok(user.tiktok || user.user_metadata?.tiktok || '');
      
      // Load current images with cache busting
      setAvatarPreview(getBustedUrl(user.avatar_url || user.user_metadata?.avatar_url));
      setHeaderPreview(getBustedUrl(user.header_url || user.user_metadata?.header_url));
      setHeaderPos(user.header_pos || user.user_metadata?.header_pos || 50);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/profile/${user.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'header') => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      if (type === 'avatar') {
        setAvatarFile(file);
        setAvatarPreview(url);
      } else {
        setHeaderFile(file);
        setHeaderPreview(url);
      }
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`; // Unique filename prevents caching
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let avatarUrl = user?.avatar_url || user?.user_metadata?.avatar_url;
      let headerUrl = user?.header_url || user?.user_metadata?.header_url;

      if (avatarFile) avatarUrl = await uploadImage(avatarFile);
      if (headerFile) headerUrl = await uploadImage(headerFile);

      const profilePayload = {
        full_name: fullName, 
        role,
        address,
        phone,
        linkedin,
        facebook,
        instagram,
        twitter,
        tiktok,
        avatar_url: avatarUrl,
        header_url: headerUrl,
        header_pos: headerPos
      };

      // 1. Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: profilePayload
      });
      if (authError) throw authError;

      // 2. Update Profiles Table (Source of Truth)
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', user.id);
        
      if (profileError) throw profileError;

      onUpdate();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-zinc-900/40 backdrop-blur-sm dark:bg-black/60">
      <div className="w-full max-w-2xl bg-white rounded-2xl relative shadow-2xl dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <h2 className="text-lg font-medium text-black dark:text-white">Edit profile</h2>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopyLink} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white text-xs font-medium transition-all"
            >
              {copied ? <Check size={14} className="text-black dark:text-white" /> : <Link size={14} />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:text-white transition-all"
            >
              <X size={16}/>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 flex-grow">
          
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase  border-b border-zinc-100 pb-2 dark:border-zinc-800">Visuals</h3>
            
            <div className="relative mb-12 mt-4">
              <div className="h-32 md:h-40 w-full bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center justify-center cursor-pointer overflow-hidden group relative dark:bg-zinc-900/50 dark:border-zinc-800">
                {headerPreview ? (
                  <img src={headerPreview} className="w-full h-full object-cover" style={{ objectPosition: `50% ${headerPos}%` }} alt="Banner" />
                ) : (
                  <div className="flex flex-col items-center text-zinc-400">
                    <ImageIcon size={24} className="mb-2" />
                    <span className="text-xs font-medium">Add Cover</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => document.getElementById('header-input')?.click()}>
                  <Camera size={24} className="text-white" />
                </div>
              </div>

              <div className="absolute -bottom-8 left-8">
                <div className="relative w-24 h-24 group cursor-pointer shadow-xl" onClick={() => document.getElementById('avatar-input')?.click()}>
                  <div className="w-full h-full rounded-full border-4 border-white bg-zinc-100 overflow-hidden flex items-center justify-center dark:bg-black dark:border-black">
                    {avatarPreview ? (
                      <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      <User size={32} className="text-zinc-400" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={20} className="text-white" />
                  </div>
                </div>
              </div>

              <input id="header-input" type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'header')} />
              <input id="avatar-input" type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
            </div>

            {headerPreview && (
              <div className="flex items-center gap-4 bg-zinc-50 p-3 rounded-2xl border border-zinc-100 dark:bg-zinc-900/30 dark:border-zinc-800">
                <MoveVertical size={16} className="text-zinc-400 shrink-0" />
                <input type="range" min="0" max="100" value={headerPos} onChange={(e) => setHeaderPos(parseInt(e.target.value))} className="flex-grow accent-black dark:accent-white h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-800" />
              </div>
            )}
          </div>

          <div className="space-y-6 pt-2">
            <section>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Identity</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
                <input className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. Artist)" />
              </div>
            </section>

            <section>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Location & Contact</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-11 pr-4 py-3 text-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-white outline-none" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City, Country" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-11 pr-4 py-3 text-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-white outline-none" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
                </div>
              </div>
            </section>

            <section>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Socials</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative"><Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} /><input className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-11 pr-4 py-3 text-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-white outline-none" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="LinkedIn" /></div>
                <div className="relative"><Twitter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} /><input className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-11 pr-4 py-3 text-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-white outline-none" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="X / Twitter" /></div>
                <div className="relative"><Facebook className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} /><input className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-11 pr-4 py-3 text-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-white outline-none" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Facebook" /></div>
                <div className="relative"><Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} /><input className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-11 pr-4 py-3 text-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-white outline-none" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram" /></div>
                <div className="relative md:col-span-2"><Video className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} /><input className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-11 pr-4 py-3 text-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-white outline-none" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="TikTok" /></div>
              </div>
            </section>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-100 bg-white dark:bg-[#0a0a0a] dark:border-[zinc-800] shrink-0">
          <button 
            onClick={handleSave} disabled={loading}
            className="w-full bg-black text-white dark:bg-white dark:text-black py-4 rounded-2xl font-bold text-xs uppercase hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}