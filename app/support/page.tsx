'use client';

import React, { useState } from 'react';
import { 
  Search, HelpCircle, Book, MessageCircle, 
  ChevronDown, ArrowRight, LifeBuoy, Mail, 
  Globe, Shield, Zap, Scale
} from 'lucide-react';

const faqs = [
  {
    category: 'Venture Initialization',
    icon: <Zap size={18} />,
    questions: [
      { 
        q: "What does it mean to 'Initialize' a venture?", 
        a: "Initializing is CoLab's version of 'Deployment.' When you initialize, you create a digital legal entity on our platform capable of tracking ownership, assigning equity shares, and recruiting specialized talent." 
      },
      { 
        q: "Can I keep my project private while in development?", 
        a: "Yes. Every venture has a 'Stealth Mode' setting. This keeps your project hidden from the public Discover feed while you build your core assets or recruit via private invite links." 
      }
    ]
  },
  {
    category: 'Equity & Valuation',
    icon: <Scale size={18} />,
    questions: [
      { 
        q: "How is the project 'Valuation' determined?", 
        a: "Valuation starts as a founder-led estimate. As you hit milestones and accept high-value collaborators, our ColPal AI helps adjust this figure based on market trends and the collective professional weight of your team." 
      },
      { 
        q: "Is the Equity Split legally binding?", 
        a: "The split on CoLab serves as a 'Digital Memorandum of Understanding' (MOU). While it tracks the logic of your venture, we recommend exporting your CoLab agreement for professional legal review as you scale toward external funding." 
      },
      { 
        q: "What is the 'Platform Share' in the equity slider?", 
        a: "The platform share is a small percentage (usually 0.5% - 2%) reserved for the CoLab ecosystem to ensure long-term maintenance of the ledger and continued access to our networking tools." 
      }
    ]
  },
  {
    category: 'Collaboration Engine',
    icon: <MessageCircle size={18} />,
    questions: [
      { 
        q: "What happens when I click 'Request Collaboration'?", 
        a: "The project owner receives a notification in their Manage dashboard. They can view your full professional profile, portfolio, and social links before deciding to 'Accept' or 'Decline' the request." 
      },
      { 
        q: "How are milestones used for equity release?", 
        a: "Equity can be tied to 'Milestone Releases.' Owners set specific tasks (e.g., 'Finish Beta UI'). Once the owner marks the milestone as complete, the assigned equity is officially credited to your collaborator dashboard." 
      }
    ]
  }
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-4 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* HEADER & SEARCH */}
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-3xl font-semibold text-black dark:text-white tracking-tight">Support center</h1>
          <p className="text-zinc-500 text-sm mt-1">Everything you need to know about initializing and scaling on CoLab.</p>
          
          <div className="mt-8 relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text"
              placeholder="Search documentation (e.g. 'equity', 'stealth mode')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-[1.5rem] text-sm focus:outline-none focus:border-[#5a9a00] dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-white dark:focus:border-[#9cf822] shadow-sm transition-all"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* FAQ ACCORDIONS */}
          <div className="lg:col-span-2 space-y-10">
            {faqs.map((cat, catIdx) => (
              <section key={catIdx} className="space-y-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="text-[#5a9a00] dark:text-[#9cf822]">{cat.icon}</div>
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">{cat.category}</h3>
                </div>
                
                <div className="space-y-2">
                  {cat.questions.map((item, qIdx) => {
                    const id = `${catIdx}-${qIdx}`;
                    const isOpen = openItems.includes(id);
                    return (
                      <div 
                        key={id} 
                        className={`border rounded-2xl transition-all duration-300 ${isOpen ? 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900/30 dark:border-zinc-800' : 'bg-white border-zinc-100 dark:bg-transparent dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                      >
                        <button 
                          onClick={() => toggleItem(id)}
                          className="w-full flex items-center justify-between p-5 text-left"
                        >
                          <span className="text-sm font-medium text-black dark:text-white leading-snug">{item.q}</span>
                          <ChevronDown size={16} className={`text-zinc-400 transition-transform duration-300 shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="p-5 pt-0 text-sm text-zinc-500 leading-relaxed">
                            {item.a}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* CONTACT SIDEBAR */}
          <aside className="space-y-6">
            <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-[2rem] dark:bg-[#1D2226] dark:border-zinc-800">
              <LifeBuoy className="text-[#5a9a00] dark:text-[#9cf822] mb-4" size={24} />
              <h4 className="text-base font-semibold text-black dark:text-white">Human help</h4>
              <p className="text-xs text-zinc-500 leading-relaxed mt-2 mb-6">Can't find what you're looking for? Our team of venture specialists is here to assist.</p>
              
              <div className="space-y-3">
                <a href="mailto:support@colab.com" className="flex items-center justify-between p-3 bg-white dark:bg-black rounded-xl border border-zinc-100 dark:border-zinc-800 group hover:border-[#5a9a00] dark:hover:border-[#9cf822] transition-all">
                  <div className="flex items-center gap-3">
                    <Mail size={14} className="text-zinc-400 group-hover:text-[#5a9a00] dark:group-hover:text-[#9cf822]" />
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Email support</span>
                  </div>
                  <ArrowRight size={14} className="text-zinc-300 group-hover:text-black dark:group-hover:text-white" />
                </a>
                
                <button className="w-full flex items-center justify-between p-3 bg-white dark:bg-black rounded-xl border border-zinc-100 dark:border-zinc-800 group hover:border-[#5a9a00] dark:hover:border-[#9cf822] transition-all">
                  <div className="flex items-center gap-3">
                    <MessageCircle size={14} className="text-zinc-400 group-hover:text-[#5a9a00] dark:group-hover:text-[#9cf822]" />
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Join Community</span>
                  </div>
                  <ArrowRight size={14} className="text-zinc-300 group-hover:text-black dark:group-hover:text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 border border-zinc-100 rounded-[2rem] dark:border-zinc-800">
               <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Platform status</h4>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#9cf822] animate-pulse" />
                 <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">All systems operational</span>
               </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}