import React, { useState, useEffect } from 'react';
import AIAssistant from './AIAssistant';
import VideoAnalyzer from './VideoAnalyzer';
import AudioTranscriber from './AudioTranscriber';
import ResearchAssistant from './ResearchAssistant';
import { TestIcon, VideoIcon, MicIcon, SearchIcon, ArrowLeftIcon } from './icons/IconComponents';
import { User, Connection, Test, TestQuestion } from '../types';

type AITab = 'assistant' | 'video' | 'audio' | 'research';

const ToolCard: React.FC<{ icon: React.FC<any>, title: string, description: string, onClick: () => void, isHighlighted: boolean }> = ({ icon: Icon, title, description, onClick, isHighlighted }) => (
    <button
        onClick={onClick}
        className={`bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl text-left hover:bg-white dark:hover:bg-slate-700/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border dark:border-slate-700/50 relative ${isHighlighted ? 'animate-highlight-glow' : ''}`}
    >
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 mb-4">
            <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="font-bold text-lg text-slate-800 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        {isHighlighted && <span className="absolute top-4 right-4 h-3 w-3 rounded-full bg-indigo-500 animate-pulse"></span>}
    </button>
);

interface AIToolsSuiteProps {
    currentUser: User;
    connections: Connection[];
    allUsers: User[];
    aiToolsState: {
        generator: { isLoading: boolean; isCompleted: boolean; questions: TestQuestion[] | null; topic: string; };
        evaluator: { isLoading: boolean; isCompleted: boolean; result: string | null; };
        subjective_grader: { isLoading: boolean; isCompleted: boolean; result: string | null; };
        thinking: { isLoading: boolean; isCompleted: boolean; result: string | null; };
    };
    onGenerateTest: (topic: string, numQuestions: string, questionType: string, difficulty: string) => Promise<void>;
    onClearGeneratedTest: () => void;
    onCreateTest: (testData: Omit<Test, 'id' | 'createdAt'>, studentIds: string[]) => void;
    onQuickFeedback: (question: string, answer: string) => Promise<void>;
    onGradeSubjective: (question: string, answer: string) => Promise<void>;
    onComplexQuery: (prompt: string) => Promise<void>;
    onClearAiToolsCompletion: (suite: 'assistant') => void;
    activeTool: AITab | null;
    setActiveTool: (tool: AITab | null) => void;
}

const AIToolsSuite: React.FC<AIToolsSuiteProps> = (props) => {
    const { currentUser, connections, allUsers, aiToolsState, onGenerateTest, onClearGeneratedTest, onCreateTest, onQuickFeedback, onGradeSubjective, onComplexQuery, onClearAiToolsCompletion, activeTool, setActiveTool } = props;

    const tools = {
        assistant: { id: 'assistant', title: 'Test & Lesson Suite', icon: TestIcon, description: 'Generate tests, grade answers, and create detailed lesson plans.', component: <AIAssistant currentUser={currentUser} connections={connections} allUsers={allUsers} aiToolsState={aiToolsState} onGenerateTest={onGenerateTest} onClearGeneratedTest={onClearGeneratedTest} onCreateTest={onCreateTest} onQuickFeedback={onQuickFeedback} onGradeSubjective={onGradeSubjective} onComplexQuery={onComplexQuery} /> },
        video: { id: 'video', title: 'Video Analyzer', icon: VideoIcon, description: 'Get summaries and key insights from educational videos.', component: <VideoAnalyzer /> },
        audio: { id: 'audio', title: 'Audio Transcriber', icon: MicIcon, description: 'Transcribe lectures or discussions in real-time.', component: <AudioTranscriber /> },
        research: { id: 'research', title: 'Research Assistant', icon: SearchIcon, description: 'Get up-to-date, factual answers powered by Google Search.', component: <ResearchAssistant /> },
    };
    
    const isAssistantSuiteHighlighted = aiToolsState.generator.isCompleted || aiToolsState.evaluator.isCompleted || aiToolsState.subjective_grader.isCompleted || aiToolsState.thinking.isCompleted;

    if (activeTool) {
        const tool = tools[activeTool];
        return (
            <div className="h-full flex flex-col">
                <div className="flex-shrink-0 p-4 border-b dark:border-slate-200 dark:dark:border-slate-700">
                    <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                        <ArrowLeftIcon className="w-5 h-5" />
                        Back to AI Tools
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {tool.component}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">AI Mission Control</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Select a tool to begin.</p>
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.values(tools).map(tool => (
                        <ToolCard
                            key={tool.id}
                            icon={tool.icon}
                            title={tool.title}
                            description={tool.description}
                            onClick={() => {
                                if (tool.id === 'assistant' && isAssistantSuiteHighlighted) {
                                    onClearAiToolsCompletion('assistant');
                                }
                                setActiveTool(tool.id as AITab);
                            }}
                            isHighlighted={tool.id === 'assistant' && isAssistantSuiteHighlighted}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AIToolsSuite;