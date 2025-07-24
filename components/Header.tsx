import React from 'react';

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3.75H19.5M8.25 3.75V19.5M8.25 3.75C5.47 3.75 3.75 5.47 3.75 8.25V19.5C3.75 20.88 4.87 22 6.25 22H17.75C19.13 22 20.25 20.88 20.25 19.5V8.25C20.25 5.47 18.53 3.75 15.75 3.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5H15.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 11.25H15.75" />
        <path strokeLinecap="round" strokeLinejoin="round"d="M8.25 15H12" />
    </svg>
);


export const Header: React.FC = () => {
    return (
        <header className="bg-gray-800/50 backdrop-blur-sm p-4 shadow-lg border-b border-gray-700 sticky top-0 z-10">
            <div className="container mx-auto flex items-center gap-4">
                <BrainIcon />
                <div>
                    <h1 className="text-2xl font-bold text-white">DrawIO LLM</h1>
                    <p className="text-sm text-gray-400">Generate diagrams from natural language descriptions.</p>
                </div>
            </div>
        </header>
    );
};
