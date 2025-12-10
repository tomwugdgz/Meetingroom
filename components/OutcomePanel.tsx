import React from 'react';
import { MeetingSummary } from '../types';
import { ResponsiveContainer, Tree, TreeNode } from 'recharts'; // Note: Recharts doesn't have a Tree component, using manual SVG instead for reliability in this specific prompt context without external heavy chart libs.

interface OutcomePanelProps {
    summary: MeetingSummary | null;
    isLoading: boolean;
    onGenerate: () => void;
    onClose: () => void;
}

const OutcomePanel: React.FC<OutcomePanelProps> = ({ summary, isLoading, onGenerate, onClose }) => {
    
    // Mock download function
    const handleDownload = (format: 'PDF' | 'Word') => {
        alert(`Exporting to ${format}... (This is a demo feature)`);
    };

    return (
        <div className="h-full flex flex-col bg-white shadow-xl border-l border-gray-200 w-full md:w-[400px]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-brand-blue text-white">
                <h2 className="text-lg font-bold">Meeting Minutes</h2>
                <button onClick={onClose} className="md:hidden text-white/80 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {!summary && !isLoading && (
                    <div className="text-center py-10">
                        <p className="text-gray-500 mb-4">Meeting in progress...</p>
                        <button 
                            onClick={onGenerate}
                            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-md font-medium"
                        >
                            End Meeting & Generate Minutes
                        </button>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
                        <p className="text-gray-500 text-sm">Organizing thought process...</p>
                    </div>
                )}

                {summary && (
                    <>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h3 className="text-sm font-bold text-brand-blue uppercase tracking-wider mb-2">Topic</h3>
                            <p className="text-gray-800 font-medium">{summary.topic}</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Key Points</h3>
                            <ul className="space-y-2">
                                {summary.keyPoints?.map((point, idx) => (
                                    <li key={idx} className="flex items-start text-sm text-gray-700">
                                        <span className="mr-2 text-brand-orange mt-1">•</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Action Items</h3>
                            <div className="space-y-3">
                                {summary.actionItems?.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-100 text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800">{item.task}</span>
                                            <span className="text-xs text-gray-500">Owner: {item.owner}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            item.status === 'Done' ? 'bg-green-100 text-green-700' :
                                            item.status === 'InProgress' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Conclusion</h3>
                             <p className="text-sm text-gray-600 italic border-l-4 border-brand-orange pl-3 py-1">
                                {summary.conclusion}
                             </p>
                        </div>

                        {summary.decisionTree && (
                             <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Communication Thought Process</h3>
                                <div className="space-y-4 relative pl-4 border-l-2 border-gray-200 ml-2">
                                    {summary.decisionTree.map((node, idx) => (
                                        <div key={idx} className="relative">
                                            <div className="absolute -left-[21px] top-3 w-3 h-3 rounded-full bg-brand-blue border-2 border-white"></div>
                                            <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
                                                <p className="text-sm font-semibold text-gray-800">{node.step}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {node.options?.map((opt, oIdx) => (
                                                        <span key={oIdx} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                                                            {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {summary && (
                <div className="p-4 border-t border-gray-100 grid grid-cols-2 gap-3 bg-gray-50">
                    <button 
                        onClick={() => handleDownload('PDF')}
                        className="flex items-center justify-center px-4 py-2 border border-brand-blue text-brand-blue rounded-lg hover:bg-blue-50 text-sm font-medium transition"
                    >
                        Export PDF
                    </button>
                    <button 
                        onClick={() => handleDownload('Word')}
                        className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-white text-sm font-medium transition"
                    >
                        Export Word
                    </button>
                </div>
            )}
        </div>
    );
};

export default OutcomePanel;
