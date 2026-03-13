'use client';

import React from 'react';
import { 
  ArrowRight, Sparkles, Calendar, Clock, ChevronRight, Zap 
} from 'lucide-react';
import Link from 'next/link';

// --- Reusable Navbar (Matches Landing Page) ---
const Navbar = () => (
  <nav className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#0a0a0a] border border-white/10 backdrop-blur-md rounded-full px-6 py-3 flex items-center justify-between z-[100] shadow-2xl w-[90%] max-w-5xl">
    <Link href="/" className="flex items-center gap-3 group">
      <img src="/white.png" alt="CoLab Logo" className="w-6 h-6 object-contain group-hover:rotate-12 transition-transform" />
      <span className="text-xl font-medium text-white">CoLab</span>
    </Link>
    
    <Link href="/community" className="text-sm font-medium text-black bg-[#9cf822] hover:bg-[#8be01d] transition-colors px-6 py-2 rounded-full">
      Enter App
    </Link>
  </nav>
);

// --- Mock Data for Blog Posts ---
const featuredPost = {
  category: "Product Update",
  title: "Introducing Percentage Sharing: The new standard for collective upside.",
  excerpt: "We are killing the hourly rate. Learn how CoLab's new native equity and revenue-sharing contracts ensure that when the project wins, the whole team wins.",
  date: "Mar 13, 2026",
  readTime: "5 min read",
  image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2940&auto=format&fit=crop"
};

const blogPosts = [
  {
    category: "Engineering",
    title: "How to structure high-fidelity specs that developers actually want to read.",
    date: "Mar 10, 2026",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2940&auto=format&fit=crop"
  },
  {
    category: "Design",
    title: "No pixel left behind: The CoLab guide to flawless designer-to-dev handoffs.",
    date: "Mar 05, 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2940&auto=format&fit=crop"
  },
  {
    category: "Founders",
    title: "Case Study: Shipping a creative-tech venture in 14 days using the CoLab network.",
    date: "Feb 28, 2026",
    readTime: "10 min read",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2940&auto=format&fit=crop"
  },
  {
    category: "Community",
    title: "Why elite builders are leaving generic freelance platforms behind.",
    date: "Feb 20, 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2940&auto=format&fit=crop"
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-[#9cf822] selection:text-black font-sans pb-20">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-48 pb-16 px-6 overflow-hidden border-b border-zinc-900">
        <div className="absolute top-40 left-10 text-[#9cf822] opacity-20"><Sparkles size={64} strokeWidth={1} /></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-7xl font-medium leading-[1.1] mb-6">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-600">Output.</span>
          </h1>
          <p className="text-xl text-zinc-400 font-medium max-w-2xl">
            Thoughts, updates, and execution strategies from the frontlines of the CoLab ecosystem.
          </p>
        </div>
      </section>

      {/* FEATURED POST */}
      <section className="py-16 px-6 border-b border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <Zap size={16} className="text-[#9cf822] fill-[#9cf822]" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Featured</span>
          </div>

          <Link href="#" className="group grid grid-cols-1 lg:grid-cols-2 gap-10 items-center bg-zinc-900/40 rounded-[2.5rem] p-4 pr-10 border border-zinc-800 hover:border-zinc-600 transition-colors">
            <div className="w-full aspect-video lg:aspect-[4/3] rounded-[2rem] overflow-hidden bg-zinc-800">
              <img 
                src={featuredPost.image} 
                className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
                alt="Featured article" 
              />
            </div>
            <div className="py-6 lg:py-0 space-y-6">
              <div className="inline-block px-4 py-1.5 rounded-full bg-[#9cf822]/10 text-[#9cf822] text-xs font-medium">
                {featuredPost.category}
              </div>
              <h2 className="text-3xl lg:text-5xl font-medium leading-tight group-hover:text-[#9cf822] transition-colors">
                {featuredPost.title}
              </h2>
              <p className="text-lg text-zinc-400 leading-relaxed font-medium">
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center gap-6 text-sm text-zinc-500 font-medium pt-4">
                <span className="flex items-center gap-2"><Calendar size={16} /> {featuredPost.date}</span>
                <span className="flex items-center gap-2"><Clock size={16} /> {featuredPost.readTime}</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* RECENT POSTS GRID */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-2xl font-medium">Recent dispatches</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {blogPosts.map((post, idx) => (
              <Link key={idx} href="#" className="group flex flex-col bg-transparent border border-zinc-800 hover:border-zinc-600 rounded-[2rem] overflow-hidden transition-all duration-300">
                <div className="w-full aspect-video bg-zinc-900 overflow-hidden relative">
                  <div className="absolute inset-0 bg-[#9cf822] opacity-0 group-hover:opacity-10 transition-opacity z-10 mix-blend-overlay"></div>
                  <img src={post.image} className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" alt={post.title} />
                  <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-xs font-medium text-white">
                    {post.category}
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h4 className="text-2xl font-medium leading-snug mb-6 group-hover:text-[#9cf822] transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  <div className="mt-auto flex items-center justify-between text-sm text-zinc-500 font-medium">
                    <span className="flex items-center gap-2"><Calendar size={14} /> {post.date}</span>
                    <span className="flex items-center gap-1 group-hover:text-white transition-colors">Read <ChevronRight size={16} /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <button className="px-8 py-4 bg-transparent border border-zinc-700 text-white font-medium text-sm rounded-full hover:bg-zinc-800 transition-colors">
              Load more updates
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black py-12 border-t border-zinc-900 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/white.png" alt="CoLab Logo" className="w-6 h-6 object-contain group-hover:rotate-12 transition-transform" />
            <span className="text-xl font-medium text-white">CoLab™</span>
          </Link>
          <div className="text-xs font-medium text-zinc-500">CoLab 2026, all rights reserved</div>
          <div className="flex items-center gap-6">
              {['About', 'Terms', 'Privacy', 'Blog'].map(item => (
                  <Link key={item} href={`/${item.toLowerCase()}`} className="text-xs font-medium text-zinc-500 hover:text-[#9cf822] transition-colors">{item}</Link>
              ))}
          </div>
        </div>
      </footer>

    </div>
  );
}