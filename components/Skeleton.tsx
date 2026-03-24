import React from 'react';

type SkeletonProps = {
  type: 'feed' | 'message-list' | 'chat';
  count?: number;
};

export default function Skeleton({ type, count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count });

  if (type === 'feed') {
    return (
      <div className="space-y-6 w-full max-w-3xl mx-auto">
        {items.map((_, i) => (
          <div key={i} className="w-full bg-white dark:bg-black sm:bg-transparent sm:dark:bg-transparent sm:border sm:border-zinc-200 sm:dark:border-zinc-800 sm:rounded-[2.5rem] p-4 sm:p-8 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0"></div>
              <div className="flex-grow space-y-2">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/3"></div>
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/4"></div>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-full"></div>
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-5/6"></div>
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-4/6"></div>
            </div>
            <div className="h-48 sm:h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-full mb-4"></div>
            <div className="flex gap-6 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
              <div className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800"></div>
              <div className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800"></div>
              <div className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'message-list') {
    return (
      <div className="flex-1 overflow-y-auto px-2">
        {items.map((_, i) => (
          <div key={i} className="w-full px-2 py-3 flex items-start gap-3 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="flex justify-between">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/2"></div>
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-8"></div>
              </div>
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chat') {
    return (
      <div className="flex-1 w-full p-4 md:p-6 space-y-6">
        {items.map((_, i) => {
          const isRight = i % 2 !== 0;
          return (
            <div key={i} className={`flex ${isRight ? 'justify-end' : 'justify-start'} animate-pulse`}>
              <div className={`h-12 bg-zinc-200 dark:bg-zinc-800 rounded-2xl ${isRight ? 'w-2/3 rounded-br-sm' : 'w-1/2 rounded-bl-sm'}`}></div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}