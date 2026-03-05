import Link from 'next/link';
import { ArrowRight, Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black p-6 text-center transition-colors duration-500">
      {/* Visual Element */}
      <div className="w-20 h-20 bg-[#9cf822]/10 rounded-3xl flex items-center justify-center mb-8 rotate-12 animate-pulse">
        <Compass size={40} className="text-[#9cf822]" />
      </div>

      {/* Text Content */}
      <div className="space-y-2 mb-10">
        <h1 className="text-4xl font-bold text-black dark:text-white tracking-tight">
          Venture path lost
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
          The coordinates you're looking for haven't been initialized yet. Let's get you back to the main discovery feed.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link 
          href="/discover" 
          className="px-8 py-4 bg-[#9cf822] text-black font-bold rounded-2xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-[#9cf822]/20 active:scale-95"
        >
          Explore Projects <Compass size={18} />
        </Link>
        <Link 
          href="/" 
          className="px-8 py-4 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all flex items-center gap-2 active:scale-95"
        >
          Home <Home size={18} />
        </Link>
      </div>

      {/* Decorative Background Element */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent -z-10 opacity-50" />
    </div>
  );
}