
import React, { useEffect } from 'react';
import { BookOpenIcon } from './icons/IconComponents';

interface AnimatedIntroductionProps {
  onAnimationEnd: () => void;
}

const AnimatedIntroduction: React.FC<AnimatedIntroductionProps> = ({ onAnimationEnd }) => {
    useEffect(() => {
        // This timer controls how long the animation plays before navigating.
        // 4000ms is chosen to match the original SplashScreen duration for consistency.
        const animationTimer = setTimeout(() => {
            onAnimationEnd();
        }, 4000); 

        return () => clearTimeout(animationTimer);
    }, [onAnimationEnd]);

    return (
        // This component reuses the same styles and structure as SplashScreen for consistency.
        <div className={`fixed inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center`}>
            <div className="text-center space-y-4">
                <BookOpenIcon
                    className="w-24 h-24 text-indigo-500 mx-auto opacity-0 animate-splash-item-in"
                    style={{ animationDelay: '0.2s' }}
                />
                <h1
                    className="text-5xl font-bold tracking-tighter text-slate-800 dark:text-white opacity-0 animate-splash-item-in"
                    style={{ animationDelay: '0.5s' }}
                >
                    Pathshaala
                </h1>
                <p
                    className="text-lg text-slate-500 dark:text-slate-400 opacity-0 animate-splash-item-in"
                    style={{ animationDelay: '0.8s' }}
                >
                    Your Gateway to Knowledge.
                </p>
            </div>
        </div>
    );
};

export default AnimatedIntroduction;
