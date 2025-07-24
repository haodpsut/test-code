import React, { useState } from 'react';

interface XmlViewerProps {
    xml: string;
}

export const XmlViewer: React.FC<XmlViewerProps> = ({ xml }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(xml);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative h-full bg-gray-900 rounded-b-lg p-4 absolute inset-0">
            <button
                onClick={handleCopy}
                className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded-md text-xs transition-colors z-10"
            >
                {copied ? 'Copied!' : 'Copy XML'}
            </button>
            <pre className="h-full w-full overflow-auto whitespace-pre-wrap text-sm text-gray-300">
                <code>{xml}</code>
            </pre>
        </div>
    );
};
