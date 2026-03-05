'use client';

import React from 'react';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => (
  <div className="border-b border-zinc-900 py-8 group">
    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-[#9cf822] transition-colors mb-4">
      {question}
    </h3>
    <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
      {answer}
    </p>
  </div>
);

export default function FAQPage() {
  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-16">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">FAQ</h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">Common questions & Support</p>
      </header>

      <div className="space-y-2">
        <FAQItem 
          question="How do I create a new project?" 
          answer="Navigate to the 'Create Project' tab in the sidebar. Fill in your project title, valuation, and owner share. You can also attach files and cover images to give your project more visibility."
        />
        <FAQItem 
          question="What are the platform fees?" 
          answer="Currently, CoLab operates on a free tier for all early adopters. Premium features including advanced analytics and higher project limits will be introduced in the future."
        />
        <FAQItem 
          question="Can I edit a project after publishing?" 
          answer="Yes. You can manage and edit your project details at any time through the 'Manage' tab in your sidebar."
        />
      </div>
    </div>
  );
}