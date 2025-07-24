import React from 'react';

interface PromptInputProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    onGenerate: () => void;
    isLoading: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ prompt, setPrompt, onGenerate, isLoading }) => {
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
             event.preventDefault();
             if (!isLoading) {
                 onGenerate();
             }
        }
    };

    return (
        <div className="flex flex-col h-full">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., A database schema for a blog with users, posts, and comments."
                className="flex-grow bg-gray-900/50 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-colors"
                rows={10}
                disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-2">Tip: Press Cmd/Ctrl + Enter to generate.</p>
            <button
                onClick={onGenerate}
                disabled={isLoading || !prompt.trim()}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-100"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </>
                ) : (
                    'Generate Diagram'
                )}
            </button>
        </div>
    );
};
