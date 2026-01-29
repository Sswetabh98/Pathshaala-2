import React from 'react';

interface ScoreTrendChartProps {
    scores: { label: string; value: number }[]; // value is percentage
}

const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({ scores }) => {
    if (scores.length === 0) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-500">No test data available for this period.</p>
            </div>
        );
    }
    
    const maxScore = 100;

    return (
        <div className="w-full h-64 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg flex flex-col">
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Test Score Trends (%)</h4>
            <div className="flex-grow flex items-end justify-around gap-2 border-l border-b border-slate-200 dark:border-slate-600 p-2">
                {scores.map((score, index) => {
                    const barHeight = `${Math.max(0, (score.value / maxScore) * 100)}%`;
                    const barColor = score.value >= 80 ? 'bg-green-500' : score.value >= 60 ? 'bg-yellow-500' : 'bg-red-500';

                    return (
                        <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                            <div
                                className={`w-3/4 rounded-t-md transition-all duration-300 ease-out group-hover:opacity-80 ${barColor}`}
                                style={{ height: barHeight }}
                                title={`${score.label}: ${score.value.toFixed(0)}%`}
                            >
                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {score.value.toFixed(0)}%
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 w-full text-center truncate" title={score.label}>{score.label}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ScoreTrendChart;