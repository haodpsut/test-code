import React from 'react';

interface ErrorDisplayProps {
    message: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => (
    <div className="flex-grow flex items-center justify-center bg-gray-800 rounded-lg p-4">
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md relative text-center" role="alert">
            <strong className="font-bold block">An error occurred</strong>
            <span className="block sm:inline whitespace-pre-wrap">{message}</span>
        </div>
    </div>
);
