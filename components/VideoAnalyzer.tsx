import React, { useState, useCallback } from 'react';
import { analyzeVideo } from '../services/geminiService';
import SkeletonLoader from './SkeletonLoader';

const ExpandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 1v-4m0 0h-4m4 0l-5 5" />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const RotateIcon: React.FC<{ className?: string }> = ({ className }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l5 5M20 20l-5-5" transform="rotate(90 12 12)" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" />
    </svg>
);


const VideoAnalyzer: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('Summarize the key points of this video.');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setRotation(0);
      setIsExpanded(false);
      if (videoPreview) {
          URL.revokeObjectURL(videoPreview);
      }
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!videoFile || !prompt) {
      alert('Please upload a video and provide a prompt.');
      return;
    }
    setIsLoading(true);
    setResult('');
    try {
      const base64Video = await fileToBase64(videoFile);
      const response = await analyzeVideo(base64Video, videoFile.type, prompt);
      setResult(response);
    } catch (error) {
      console.error("Error analyzing video:", error);
      setResult((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [videoFile, prompt]);

  const handleRotate = () => {
      setRotation(prev => (prev + 90) % 360);
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 h-full flex flex-col">
        <h2 className="text-3xl font-bold mb-4 text-slate-800 dark:text-white">Video Content Analyzer</h2>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">1. Upload Video File</label>
              <input 
                type="file" 
                accept="video/*" 
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
            {videoPreview && (
              <div className="mt-4 relative">
                  <video 
                      key={videoPreview}
                      controls 
                      src={videoPreview} 
                      className="w-full rounded-lg shadow-md transition-transform duration-300"
                      style={{ transform: `rotate(${rotation}deg)` }}
                  >
                  </video>
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                    <button onClick={handleRotate} className="text-sm py-1.5 px-3 bg-black/50 text-white hover:bg-black/70 rounded-md flex items-center gap-1">
                        <RotateIcon className="w-4 h-4" /> Rotate
                    </button>
                    <button onClick={() => setIsExpanded(true)} className="p-2 bg-black/50 text-white hover:bg-black/70 rounded-full">
                        <ExpandIcon className="w-5 h-5" />
                    </button>
                  </div>
              </div>
            )}
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">2. What should I analyze?</label>
              <textarea 
                id="prompt"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-3 py-2 text-slate-900 bg-slate-100 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white dark:border-slate-600"
              />
            </div>
            <button onClick={handleAnalyze} disabled={isLoading || !videoFile} className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors">
              {isLoading ? 'Analyzing...' : 'Analyze Video'}
            </button>
          </div>

          {/* Output Section */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 flex flex-col">
            <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">Analysis Result</h3>
            <div className="flex-1 overflow-y-auto">
              {isLoading && <SkeletonLoader lines={8} />}
              {!isLoading && result && (
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-300">{result}</pre>
              )}
              {!isLoading && !result && (
                <p className="text-slate-500 text-center pt-10">Upload a video and click "Analyze" to see the results here.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {isExpanded && videoPreview && (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4" onClick={() => setIsExpanded(false)}>
              <video
                  controls
                  autoPlay
                  src={videoPreview}
                  className="max-w-full max-h-[85vh] transition-transform duration-300"
                  style={{ transform: `rotate(${rotation}deg)` }}
                  onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                   <button onClick={handleRotate} className="px-4 py-2 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 flex items-center gap-2">
                        <RotateIcon className="w-5 h-5" /> Rotate
                   </button>
              </div>
              <button onClick={() => setIsExpanded(false)} className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/30">
                  <CloseIcon className="w-6 h-6" />
              </button>
          </div>
      )}
    </>
  );
};

export default VideoAnalyzer;