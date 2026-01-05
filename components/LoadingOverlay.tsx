import React from 'react';

interface LoadingOverlayProps {
  message: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md text-white p-6 text-center animate-fadeIn overflow-hidden">
      {/* Subtle animated background gradients */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] animate-pulse delay-1000"></div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Enhanced Spinner */}
        <div className="relative w-16 h-16 mb-8">
          {/* Static ring */}
          <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
          {/* Spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin shadow-[0_0_20px_rgba(99,102,241,0.3)]"></div>
          {/* Inner pulse */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping delay-300"></div>
        </div>

        {/* Animated Text */}
        <h2 className="text-2xl font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-white to-purple-200 animate-pulse">
          {message}
        </h2>
        
        {/* Subtitle */}
        <div className="flex items-center justify-center gap-2 mt-4">
           <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
           <p className="text-xs font-mono text-indigo-300/80 tracking-[0.2em] uppercase">Powered by Gemini</p>
        </div>
      </div>
    </div>
  );
};