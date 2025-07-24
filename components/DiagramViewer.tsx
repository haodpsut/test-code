import React, { useMemo } from 'react';

interface DiagramViewerProps {
    xml: string;
}

export const DiagramViewer: React.FC<DiagramViewerProps> = ({ xml }) => {
    const diagramUrl = useMemo(() => {
        if (!xml) return '';
        // The data parameter for embed.diagrams.net is the URL-encoded XML content
        const encodedXml = encodeURIComponent(xml);
        return `https://embed.diagrams.net/?ui=atlas&spin=1&modified=0&proto=json&data=${encodedXml}`;
    }, [xml]);

    if (!diagramUrl) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No diagram to display.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-gray-100 rounded-b-lg overflow-hidden absolute inset-0">
            <iframe
                src={diagramUrl}
                className="w-full h-full border-0"
                title="Diagram Viewer"
                sandbox="allow-scripts allow-same-origin"
            ></iframe>
        </div>
    );
};
