import React from 'react';

interface LoaderProps {
    message?: string;
    subMessage?: string;
}

export const Loader: React.FC<LoaderProps> = ({ 
    message = "Generating your diagram...", 
    subMessage = "The AI is thinking. This might take a moment." 
}) => (
    <div className="flex-grow flex flex-col items-center justify-center bg-gray-800 rounded-lg p-4">
        <svg className="animate-spin h-12 w-12 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg text-gray-300">{message}</p>
        <p className="text-sm text-gray-500">{subMessage}</p>
    </div>
);