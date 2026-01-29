import React from 'react';
import { BookOpenIcon } from './icons/IconComponents';

const SplashScreen: React.FC<{ isExiting: boolean }> = ({ isExiting }) => {
    return (
        <div className={`fixed inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center transition-opacity duration-500 ${isExiting ? 'animate-splash-container-out' : ''}`}>
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

export default SplashScreen;
