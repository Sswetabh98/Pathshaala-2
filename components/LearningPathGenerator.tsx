import React, { useState } from 'react';
import { generateLearningPath } from '../services/geminiService';
import SkeletonLoader from './SkeletonLoader';
import MarkdownRenderer from './MarkdownRenderer';
import { BookOpenIcon } from './icons/IconComponents';

const LearningPathGenerator: React.FC = () => {
  const [goals, setGoals] = useState('Prepare for final exams and build a strong foundation for college entrance tests.');
  const [subjects, setSubjects] = useState('Physics, Chemistry, Mathematics');
  const [timeframe, setTimeframe] = useState('8 Weeks');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleGenerate = async () => {
    if (!goals || !subjects || !timeframe) {
      alert('Please fill in all fields to generate a plan.');
      return;
    }
    setIsLoading(true);
    setResult('');
    try {
      const response = await generateLearningPath(goals, subjects, timeframe);
      setResult(response);
    } catch (error) {
      setResult(`Error generating learning path: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 h-full flex flex-col">
      <h2 className="text-3xl font-bold mb-4 text-slate-800 dark:text-white">Personalized Learning Path</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Input Form */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xl font-semibold">Your Learning Goals</h3>
          <div>
            <label htmlFor="goals" className="block text-sm font-medium text-slate-700 dark:text-slate-300">What do you want to achieve?</label>
            <textarea
              id="goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={4}
              className="input-style w-full mt-1"
              placeholder="e.g., Score above 90% in my finals, understand quantum mechanics..."
            />
          </div>
          <div>
            <label htmlFor="subjects" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Subjects</label>
            <input
              id="subjects"
              type="text"
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              className="input-style w-full mt-1"
              placeholder="e.g., Physics, History..."
            />
          </div>
          <div>
            <label htmlFor="timeframe" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Timeframe</label>
            <input
              id="timeframe"
              type="text"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="input-style w-full mt-1"
              placeholder="e.g., 4 Weeks, 3 Months..."
            />
          </div>
          <button onClick={handleGenerate} disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Generating Plan...' : 'Generate My Plan'}
          </button>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 flex flex-col min-h-0">
          <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200">Your Custom Study Plan</h3>
          <div className="flex-1 overflow-y-auto pr-2">
            {isLoading && <SkeletonLoader lines={10} />}
            {!isLoading && result && (
              <MarkdownRenderer text={result} />
            )}
            {!isLoading && !result && (
              <div className="text-center py-10 text-slate-500">
                <BookOpenIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="mt-2">Your personalized study plan will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathGenerator;