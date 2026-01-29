import React, { useState } from 'react';
import { generateTestQuestions, evaluateAnswer, getComplexResponse, getQuickFeedback } from '../services/geminiService';
import SkeletonLoader from './SkeletonLoader';
import MarkdownRenderer from './MarkdownRenderer';
import { TestQuestion, User, Connection, Test } from '../types';
import { generateId } from '../utils';
import AssignTestModal from './AssignTestModal';

type AITab = 'generator' | 'evaluator' | 'subjective_grader' | 'thinking';

interface AIAssistantProps {
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
}

const AIAssistant: React.FC<AIAssistantProps> = ({ currentUser, connections, allUsers, aiToolsState, onGenerateTest, onClearGeneratedTest, onCreateTest, onQuickFeedback, onGradeSubjective, onComplexQuery }) => {
  const [activeTab, setActiveTab] = useState<AITab>('generator');
  
  // States for Test Generator
  const [topic, setTopic] = useState(aiToolsState.generator.topic || 'The Laws of Thermodynamics');
  const [numQuestions, setNumQuestions] = useState('5');
  const [questionType, setQuestionType] = useState('multiple-choice');
  const [difficulty, setDifficulty] = useState('medium');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // States for Answer Evaluator
  const [quickQuestion, setQuickQuestion] = useState('Explain the second law of thermodynamics.');
  const [quickAnswer, setQuickAnswer] = useState('It states that the total entropy of an isolated system can only increase over time.');
  
  // States for Subjective Grader
  const [subjectiveQuestion, setSubjectiveQuestion] = useState('Describe the impact of the industrial revolution on society.');
  const [subjectiveAnswer, setSubjectiveAnswer] = useState('The industrial revolution led to major changes. People moved to cities, factories were built, and new technologies were invented. This created a new working class and changed family structures. While it brought economic growth, it also caused problems like pollution and poor working conditions.');


  // States for Thinking Mode
  const [prompt, setPrompt] = useState('Create a week-long lesson plan for an 11th-grade physics class on the topic of special relativity. Include daily objectives, activities, and assessment methods.');

  const handleGenerateTest = () => {
    if (!topic || !numQuestions) return;
    onGenerateTest(topic, numQuestions, questionType, difficulty);
  };

  const handleAssignTest = (studentIds: string[], dueDate?: number, timeLimitSeconds?: number) => {
    if (!aiToolsState.generator.questions || !currentUser) return;
    const newTest: Omit<Test, 'id' | 'createdAt'> = {
        teacherId: currentUser.id,
        title: aiToolsState.generator.topic,
        questions: aiToolsState.generator.questions,
        dueDate,
        timeLimitSeconds,
    };
    onCreateTest(newTest, studentIds);
    onClearGeneratedTest();
  };
  
  const handleQuickFeedback = () => {
      if (!quickQuestion || !quickAnswer) return;
      onQuickFeedback(quickQuestion, quickAnswer);
  };

  const handleGradeSubjective = async () => {
    if (!subjectiveQuestion || !subjectiveAnswer) return;
    onGradeSubjective(subjectiveQuestion, subjectiveAnswer);
  };
  
  const handleComplexQuery = async () => {
    if (!prompt) return;
    onComplexQuery(prompt);
  };
  
  const connectedStudents = allUsers.filter(u => u.role === 'student' && connections.some(c => (c.teacherId === currentUser.id && c.studentId === u.id) || (c.studentId === currentUser.id && c.teacherId === u.id)));

  const isLoading = 
      (activeTab === 'generator' && aiToolsState.generator.isLoading) ||
      (activeTab === 'evaluator' && aiToolsState.evaluator.isLoading) ||
      (activeTab === 'subjective_grader' && aiToolsState.subjective_grader.isLoading) ||
      (activeTab === 'thinking' && aiToolsState.thinking.isLoading);

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 h-full flex flex-col">
        <h2 className="text-3xl font-bold mb-4 text-slate-800 dark:text-white">AI Assistant for Educators</h2>
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button onClick={() => setActiveTab('generator')} className={`${activeTab === 'generator' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Test Generator</button>
              <button onClick={() => setActiveTab('evaluator')} className={`${activeTab === 'evaluator' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Quick Feedback</button>
              <button onClick={() => setActiveTab('subjective_grader')} className={`${activeTab === 'subjective_grader' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Subjective Grader</button>
              <button onClick={() => setActiveTab('thinking')} className={`${activeTab === 'thinking' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Lesson Planner</button>
          </nav>
        </div>

        <div className="py-6 flex-1 overflow-y-auto">
          {activeTab === 'generator' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Generate Test Questions</h3>
              <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Topic</label>
                  <input id="topic" type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Photosynthesis" className="w-full input-style mt-1" />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                      <label htmlFor="numQuestions" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Number of Questions</label>
                      <input id="numQuestions" type="number" value={numQuestions} onChange={e => setNumQuestions(e.target.value)} placeholder="e.g., 5" className="w-full input-style mt-1" />
                  </div>
                  <div>
                      <label htmlFor="questionType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Question Type</label>
                      <select id="questionType" value={questionType} onChange={e => setQuestionType(e.target.value)} className="w-full input-style mt-1">
                          <option value="multiple-choice">Multiple Choice</option>
                          <option value="true-false">True/False</option>
                          <option value="short-answer">Short Answer</option>
                      </select>
                  </div>
                  <div>
                      <label htmlFor="difficulty" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Difficulty</label>
                      <select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full input-style mt-1">
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                      </select>
                  </div>
              </div>
              <button onClick={handleGenerateTest} disabled={isLoading} className="btn-primary">Generate</button>
            </div>
          )}
          {activeTab === 'evaluator' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Get Quick Feedback on an Answer</h3>
              <textarea value={quickQuestion} onChange={e => setQuickQuestion(e.target.value)} placeholder="Question" className="w-full input-style" rows={2}></textarea>
              <textarea value={quickAnswer} onChange={e => setQuickAnswer(e.target.value)} placeholder="Student's Answer" className="w-full input-style" rows={4}></textarea>
              <button onClick={handleQuickFeedback} disabled={isLoading} className="btn-primary">Evaluate</button>
            </div>
          )}
          {activeTab === 'subjective_grader' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Grade a Subjective Answer</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Input the question and the student's full answer. The AI will provide detailed feedback and a suggested score out of 10.</p>
              <div>
                  <label htmlFor="subjectiveQuestion" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Question</label>
                  <textarea id="subjectiveQuestion" value={subjectiveQuestion} onChange={e => setSubjectiveQuestion(e.target.value)} className="w-full input-style mt-1" rows={3}></textarea>
              </div>
              <div>
                   <label htmlFor="subjectiveAnswer" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Student's Answer</label>
                  <textarea id="subjectiveAnswer" value={subjectiveAnswer} onChange={e => setSubjectiveAnswer(e.target.value)} className="w-full input-style mt-1" rows={8}></textarea>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Or upload answer document (optional)</label>
                  <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mt-1" />
                  <p className="text-xs text-slate-400 mt-1">File upload is for demonstration and is not yet functional.</p>
              </div>
              <button onClick={handleGradeSubjective} disabled={isLoading} className="btn-primary">Grade Answer</button>
            </div>
          )}
          {activeTab === 'thinking' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Advanced Lesson Planner</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Use for complex tasks like lesson planning, curriculum design, or generating detailed explanations. This mode uses a more powerful model and takes longer to respond.</p>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter your complex query..." className="w-full input-style" rows={6}></textarea>
              <button onClick={handleComplexQuery} disabled={isLoading} className="btn-primary">Submit Query</button>
            </div>
          )}

          <div className="mt-6">
              {isLoading && (
                  <div className="p-6 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                      <h4 className="font-semibold text-lg mb-4 text-slate-800 dark:text-white">Generating Result...</h4>
                      <SkeletonLoader lines={5} />
                  </div>
              )}
              {activeTab === 'generator' && !isLoading && aiToolsState.generator.questions && (
                  <div className="p-6 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold text-lg text-slate-800 dark:text-white">Test Preview: {aiToolsState.generator.topic}</h4>
                           <div className="flex gap-2">
                                <button onClick={onClearGeneratedTest} className="btn-secondary">Clear</button>
                                <button onClick={() => setIsAssignModalOpen(true)} className="btn-primary">Save & Assign Test</button>
                           </div>
                      </div>
                      <div className="space-y-6">
                          {aiToolsState.generator.questions.map((q, index) => (
                              <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-md">
                                  <p className="font-bold text-lg leading-relaxed">{index + 1}. {q.questionText}</p>
                                  {q.options && (
                                      <ul className="pl-2 mt-3 space-y-2 text-base">
                                          {q.options.map((opt, i) => (
                                            <li key={i} className="flex items-center">
                                                <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                                                <span>{opt}</span>
                                            </li>
                                          ))}
                                      </ul>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              )}
              {activeTab === 'evaluator' && !isLoading && aiToolsState.evaluator.result && <div className="p-6 bg-slate-100 dark:bg-slate-700/50 rounded-lg"><h4 className="font-semibold text-lg mb-4">Result:</h4><MarkdownRenderer text={aiToolsState.evaluator.result} /></div>}
              {activeTab === 'subjective_grader' && !isLoading && aiToolsState.subjective_grader.result && <div className="p-6 bg-slate-100 dark:bg-slate-700/50 rounded-lg"><h4 className="font-semibold text-lg mb-4">Result:</h4><MarkdownRenderer text={aiToolsState.subjective_grader.result} /></div>}
              {activeTab === 'thinking' && !isLoading && aiToolsState.thinking.result && <div className="p-6 bg-slate-100 dark:bg-slate-700/50 rounded-lg"><h4 className="font-semibold text-lg mb-4">Result:</h4><MarkdownRenderer text={aiToolsState.thinking.result} /></div>}
          </div>
        </div>
      </div>
      <AssignTestModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleAssignTest}
        connectedStudents={connectedStudents}
        testTitle={aiToolsState.generator.topic}
      />
    </>
  );
};

export default AIAssistant;