import React from 'react';

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export const Logo = ({ collapsed, className = "" }: LogoProps) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 1. The Icon Container - Fixed Aspect Ratio */}
      <div className="w-9 h-9 flex items-center justify-center shrink-0">
        <img 
          src="/logo.png" // Replace with your new logo path
          alt="CoLab Logo" 
          className="w-full h-full object-contain" // object-contain prevents stretching
        />
      </div>
      
      {/* 2. The Typography - Hidden when sidebar is collapsed */}
      {!collapsed && (
        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white leading-none">
          CoLab
        </span>
      )}
    </div>
  );
};