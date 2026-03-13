'use client';

import React, { useState } from 'react';
import { 
  ArrowRight, Calendar, Clock, ChevronRight, Zap,
  X, Heart, MessageSquare, Share2
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

// --- Mock Data for Blog Posts (Now with Content) ---
const featuredPost = {
  id: "feat-1",
  category: "Product Update",
  title: "Introducing Percentage Sharing: The new standard for collective upside.",
  excerpt: "We are killing the hourly rate. Learn how CoLab's new native equity and revenue-sharing contracts ensure that when the project wins, the whole team wins.",
  content: "For too long, the creative and tech industries have operated on a broken model: the hourly rate. It penalizes efficiency, creates adversarial relationships between clients and builders, and limits the financial upside for the people actually doing the work.\n\nToday, we are fundamentally changing how builders get paid. Introducing Percentage Sharing—CoLab's native equity and revenue-sharing contract system.\n\nNow, when you assemble a team on CoLab, you aren't just hiring freelancers; you are forming a collective. You can seamlessly allocate percentages of the project's future revenue or equity directly within the platform. Our smart contracts handle the math, the distributions, and the legal scaffolding.\n\nThis means designers, developers, and creators finally get to participate in the success they help build. When the project wins, the whole team wins. Welcome to the new standard of collaboration.",
  date: "Mar 13, 2026",
  readTime: "5 min read",
  image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2940&auto=format&fit=crop"
};

const blogPosts = [
  {
    id: "post-1",
    category: "Engineering",
    title: "How to structure high-fidelity specs that developers actually want to read.",
    date: "Mar 10, 2026",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2940&auto=format&fit=crop",
    content: "The handoff process is where most projects go to die. Designers create pristine, pixel-perfect UI, only to have developers reject it because the logic, edge cases, and state changes weren't documented.\n\nAt CoLab, we emphasize 'high-fidelity specs'—documentation that bridges the gap between Figma and the codebase.\n\n1. Define your states: Don't just show the 'happy path.' What does the component look like when it's loading? When it errors out? When the data is empty?\n2. Export assets correctly: Name your layers, use auto-layout, and provide SVG exports for iconography.\n3. Write logical user stories: Developers need to know *why* a button exists, not just what color it is.\n\nBy elevating the fidelity of your specs, you drastically reduce back-and-forth and increase shipping velocity."
  },
  {
    id: "post-2",
    category: "Design",
    title: "No pixel left behind: The CoLab guide to flawless designer-to-dev handoffs.",
    date: "Mar 05, 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2940&auto=format&fit=crop",
    content: "As a designer on CoLab, your visual identity is your signature. But a design is only as good as its implementation. To ensure 'no pixel is left behind,' you need a robust handoff strategy.\n\nFirst, adopt a design system approach. Use strict design tokens for spacing, typography, and color. When you hand off a variable like 'spacing-md' instead of an arbitrary '16px', developers can map it directly to Tailwind or their CSS-in-JS solution.\n\nSecond, leverage interactive prototyping. A static screen leaves too much room for interpretation regarding animations, transitions, and user flow.\n\nFinally, communicate. CoLab's community feed and project spaces are designed to keep you in sync with your dev partner daily."
  },
  {
    id: "post-3",
    category: "Founders",
    title: "Case Study: Shipping a creative-tech venture in 14 days using the CoLab network.",
    date: "Feb 28, 2026",
    readTime: "10 min read",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2940&auto=format&fit=crop",
    content: "When CAVIE needed to launch their new creative-tech platform, they didn't have months to spend sourcing and vetting a team. They turned to CoLab.\n\nWithin 24 hours of posting their project on the CoLab feed, they assembled an elite squad: a senior UI/UX designer from London, a Next.js specialist from Lagos, and a 3D artist from Toronto.\n\nBecause they utilized CoLab's Percentage Sharing, they bypassed week-long contract negotiations. Everyone was aligned on the upside. By Day 7, the high-fidelity prototypes were locked. By Day 14, the platform was deployed to production.\n\nThis is the power of the CoLab refinery. We filter out the noise so you can focus entirely on execution."
  },
  {
    id: "post-4",
    category: "Community",
    title: "Why elite builders are leaving generic freelance platforms behind.",
    date: "Feb 20, 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2940&auto=format&fit=crop",
    content: "The gig economy is a race to the bottom. Generic freelance platforms are bloated with unverified talent, driving down prices and compromising quality. Elite builders are tired of competing on price instead of execution.\n\nThat's why the migration to CoLab is accelerating. We are not a gig marketplace; we are an execution ecosystem.\n\nBuilders come to CoLab because they want to work alongside peers who take their craft seriously. They want to ship real products, build equity, and stop chasing low-value contracts. Here, execution is the only metric that matters."
  }
];

// --- Post Modal Component ---
const PostModal = ({ post, onClose }: { post: any, onClose: () => void }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 100) + 20);
  const [comments, setComments] = useState<string[]>([]);
  const [commentInput, setCommentInput] = useState("");

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentInput.trim()) {
      setComments([...comments, commentInput.trim()]);
      setCommentInput("");
    }
  };

  const handleShare = () => {
    alert("Post link copied to clipboard!");
  };

  if (!post) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex justify-center overflow-y-auto animate-in fade-in duration-300">
      <div className="w-full max-w-3xl bg-[#0a0a0a] min-h-screen border-x border-zinc-900 relative">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-zinc-900">
          <div className="inline-block px-3 py-1 rounded-full bg-[#9cf822]/10 text-[#9cf822] text-xs font-medium">
            {post.category}
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Hero Image */}
        <div className="w-full h-[40vh] overflow-hidden bg-zinc-900">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover grayscale opacity-80" />
        </div>

        <div className="p-8 md:p-12">
          {/* Post Header Info */}
          <div className="flex items-center gap-6 text-sm text-zinc-500 font-medium mb-6">
            <span className="flex items-center gap-2"><Calendar size={16} /> {post.date}</span>
            <span className="flex items-center gap-2"><Clock size={16} /> {post.readTime}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-medium leading-tight text-white mb-8">
            {post.title}
          </h1>

          {/* Post Content */}
          <div className="space-y-6 text-lg text-zinc-400 leading-relaxed font-medium pb-12 border-b border-zinc-900">
            {post.content.split('\n\n').map((paragraph: string, idx: number) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* Engagement Bar */}
          <div className="py-6 flex items-center gap-6 border-b border-zinc-900">
            <button onClick={handleLike} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
              <Heart size={24} className={`transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'group-hover:text-red-500'}`} />
              <span className="font-medium text-lg">{likesCount}</span>
            </button>
            <button onClick={() => document.getElementById('comment-input')?.focus()} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
              <MessageSquare size={24} className="group-hover:text-blue-500 transition-colors" />
              <span className="font-medium text-lg">{comments.length}</span>
            </button>
            <button onClick={handleShare} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group ml-auto">
              <Share2 size={24} className="group-hover:text-[#9cf822] transition-colors" />
            </button>
          </div>

          {/* Comments Section */}
          <div className="py-8 space-y-8">
            <h3 className="text-xl font-medium text-white">Comments ({comments.length})</h3>
            
            <form onSubmit={handleComment} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-zinc-500">YOU</div>
              <div className="flex-grow flex gap-2">
                <input 
                  id="comment-input"
                  type="text" 
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Share your thoughts..." 
                  className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#9cf822] transition-colors"
                />
                <button type="submit" disabled={!commentInput.trim()} className="px-6 bg-[#9cf822] text-black font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                  Post
                </button>
              </div>
            </form>

            <div className="space-y-6">
              {comments.map((comment, idx) => (
                <div key={idx} className="flex gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0 flex items-center justify-center text-xs font-bold text-zinc-500">YOU</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white text-sm">You</span>
                      <span className="text-xs text-zinc-600">Just now</span>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed">{comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default function BlogPage() {
  const [activePost, setActivePost] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);

  const handleLoadMore = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-[#9cf822] selection:text-black font-sans pb-20">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-48 pb-16 px-6 overflow-hidden border-b border-zinc-900">
        <div className="max-w-6xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-7xl font-medium leading-[1.1] mb-6">
            What's <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-600">New.</span>
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

          <button 
            onClick={() => setActivePost(featuredPost)} 
            className="w-full text-left group grid grid-cols-1 lg:grid-cols-2 gap-10 items-center bg-zinc-900/40 rounded-[2.5rem] p-4 pr-10 border border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer"
          >
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
          </button>
        </div>
      </section>

      {/* RECENT POSTS GRID */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-2xl font-medium">Recent dispatches</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {blogPosts.map((post) => (
              <button 
                key={post.id} 
                onClick={() => setActivePost(post)} 
                className="text-left group flex flex-col bg-transparent border border-zinc-800 hover:border-zinc-600 rounded-[2rem] overflow-hidden transition-all duration-300 cursor-pointer"
              >
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
              </button>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <button 
              onClick={handleLoadMore} 
              className="px-8 py-4 bg-transparent border border-zinc-700 text-white font-medium text-sm rounded-full hover:bg-zinc-800 transition-colors"
            >
              Load more updates
            </button>
          </div>
        </div>
      </section>

      {/* Load More Updates Popup */}
      {showPopup && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#0a0a0a] border border-zinc-800 text-white px-6 py-3 rounded-full shadow-2xl z-[150] animate-in fade-in slide-in-from-bottom-5 font-medium text-sm flex items-center gap-3">
          <Zap size={16} className="text-zinc-500" />
          No updates currently available
        </div>
      )}

      {/* Dynamic Post Modal Overlay */}
      <PostModal post={activePost} onClose={() => setActivePost(null)} />

      {/* FOOTER */}
      <footer className="bg-black py-12 border-t border-zinc-900 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/white.png" alt="CoLab Logo" className="w-6 h-6 object-contain group-hover:rotate-12 transition-transform" />
            <span className="text-xl font-medium text-white">CoLab™</span>
          </Link>
          <div className="text-xs font-medium text-zinc-500">&copy; 2026 CoLab. All rights reserved.</div>
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