import React from 'react';

const SkeletonLoader: React.FC<{ lines?: number; className?: string }> = ({ lines = 5, className = '' }) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        {Array.from({ length: lines - 1 }).map((_, i) => (
            <div key={i} className={`h-4 bg-slate-200 dark:bg-slate-700 rounded ${ i % 3 === 0 ? 'w-5/6' : 'w-full' }`}></div>
        ))}
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
    </div>
  );
};

export default SkeletonLoader;
