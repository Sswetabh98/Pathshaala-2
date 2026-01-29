import React, { useState } from 'react';
import AIStudyBuddy from './AIStudyBuddy';
import LearningPathGenerator from './LearningPathGenerator';
import { ChatBubbleIcon, BookOpenIcon, ArrowLeftIcon } from './icons/IconComponents';

type AITab = 'buddy' | 'planner';

const ToolCard: React.FC<{ icon: React.FC<any>, title: string, description: string, onClick: () => void }> = ({ icon: Icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl text-left hover:bg-white dark:hover:bg-slate-700/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border dark:border-slate-700/50"
    >
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 mb-4">
            <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="font-bold text-lg text-slate-800 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
    </button>
);

const StudentAITools: React.FC = () => {
    const [activeTool, setActiveTool] = useState<AITab | null>(null);

    const tools = {
        buddy: { id: 'buddy', title: 'AI Study Buddy', icon: ChatBubbleIcon, description: 'Ask questions and get guided help to find the answers yourself.', component: <AIStudyBuddy /> },
        planner: { id: 'planner', title: 'Learning Path Generator', icon: BookOpenIcon, description: 'Create a custom study plan to reach your learning goals.', component: <LearningPathGenerator /> },
    };

    if (activeTool) {
        const tool = tools[activeTool];
        return (
            <div className="h-full flex flex-col">
                <div className="flex-shrink-0 p-4 rounded-t-xl border-b dark:border-slate-200 dark:dark:border-slate-700">
                    <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                        <ArrowLeftIcon className="w-5 h-5" />
                        Back to AI Tools
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {tool.component}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">Your AI Toolkit</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Powerful tools to help you learn smarter.</p>
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.values(tools).map(tool => (
                        <ToolCard
                            key={tool.id}
                            icon={tool.icon}
                            title={tool.title}
                            description={tool.description}
                            onClick={() => setActiveTool(tool.id as AITab)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StudentAITools;