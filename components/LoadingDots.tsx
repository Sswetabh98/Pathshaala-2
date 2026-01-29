import React from 'react';

const LoadingDots: React.FC<{ text?: string; className?: string }> = ({ text, className = '' }) => (
  <div className={`flex flex-col justify-center items-center space-y-4 p-4 text-center ${className}`}>
    <div className="flex items-center justify-center space-x-2">
      <span className="sr-only">Loading...</span>
      <div className="h-3 w-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
      <div className="h-3 w-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
      <div className="h-3 w-3 bg-indigo-500 rounded-full animate-bounce"></div>
    </div>
    {text && <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>}
  </div>
);

export default LoadingDots;
