import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

import { Header } from './components/Header';
import { DiagramViewer } from './components/DiagramViewer';
import { XmlViewer } from './components/XmlViewer';
import { Loader } from './components/Loader';
import { ErrorDisplay } from './components/ErrorDisplay';
import { generateDiagramXml, analyzeDocumentAndCreatePrompt } from './services/geminiService';

// --- File Parsing Utilities ---
const parseDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
};

const parsePdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const numPages = pdf.numPages;
    let fullText = '';
    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
    }
    return fullText;
};

const parseFile = async (file: File): Promise<string> => {
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
        return parseDocx(file);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        return parsePdf(file);
    } else {
        throw new Error('Unsupported file type. Please upload a .docx or .pdf file.');
    }
};

// --- UI Components ---
const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const FileUpload: React.FC<{
    onFileSelect: (file: File | null) => void;
    selectedFile: File | null;
    disabled: boolean;
}> = ({ onFileSelect, selectedFile, disabled }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        onFileSelect(file);
    };

    const handleClearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFileSelect(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileSelect = () => fileInputRef.current?.click();

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Upload Document</label>
            <div onClick={!disabled ? triggerFileSelect : undefined} className={`flex items-center justify-between w-full p-3 border-2 border-dashed rounded-lg transition-colors ${disabled ? 'bg-gray-700 cursor-not-allowed' : 'border-gray-600 hover:border-blue-500 bg-gray-900/50 cursor-pointer'}`}>
                <div className="flex items-center overflow-hidden"><FileIcon /><span className="text-sm text-gray-400 truncate">{selectedFile ? selectedFile.name : 'Click to upload .docx or .pdf'}</span></div>
                {selectedFile && <button onClick={handleClearFile} className="p-1 rounded-full hover:bg-gray-600 text-gray-400 hover:text-white transition-colors" aria-label="Clear file" disabled={disabled}><CloseIcon /></button>}
            </div>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={disabled} />
        </div>
    );
};

// --- Main App Component ---
type ActiveTab = 'diagram' | 'xml';

const App: React.FC = () => {
    useEffect(() => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs`;
    }, []);

    const [prompt, setPrompt] = useState<string>('A flowchart for a user login process with a start, credential check, dashboard on success, error on failure, and end points.');
    const [diagramXml, setDiagramXml] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('diagram');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const isProcessing = isLoading || isAnalyzing;

    const handleAnalyze = useCallback(async () => {
        if (!uploadedFile) {
            setError('Please select a file to analyze.');
            return;
        }
        setIsAnalyzing(true);
        setError(null);
        setDiagramXml('');
        setPrompt('');
        try {
            const fileContent = await parseFile(uploadedFile);
            if (!fileContent.trim()) throw new Error("Could not extract text from the document or the document is empty.");
            const generatedPrompt = await analyzeDocumentAndCreatePrompt(fileContent);
            setPrompt(generatedPrompt);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unexpected error occurred during analysis.');
        } finally {
            setIsAnalyzing(false);
        }
    }, [uploadedFile]);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Please enter or generate a description for the diagram.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setDiagramXml('');
        try {
            const xml = await generateDiagramXml(prompt);
            setDiagramXml(xml);
            setActiveTab('diagram');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [prompt]);

    const handleFileSelect = (file: File | null) => {
        setUploadedFile(file);
        if (!file) return;
        setError(null);
        setDiagramXml('');
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            if (!isProcessing && prompt.trim()) handleGenerate();
        }
    };

    const TabButton = ({ tabName, label }: { tabName: ActiveTab, label: string }) => (
        <button onClick={() => setActiveTab(tabName)} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ${activeTab === tabName ? 'bg-gray-700 border-b-2 border-blue-400 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            {label}
        </button>
    );

    const loadingMessage = isAnalyzing ? 'Analyzing your document...' : 'Generating your diagram...';
    const subMessage = isAnalyzing ? 'The AI is reading your file to create a prompt.' : 'The AI is thinking. This might take a moment.';

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
            <Header />
            <main className="flex-grow flex flex-col md:flex-row p-4 gap-4">
                <div className="md:w-1/3 flex flex-col gap-4">
                    <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-full flex flex-col">
                        <h2 className="text-lg font-bold mb-3 text-blue-300">Step 1: Provide Idea</h2>
                        <FileUpload selectedFile={uploadedFile} onFileSelect={handleFileSelect} disabled={isProcessing} />
                        <button onClick={handleAnalyze} disabled={!uploadedFile || isProcessing} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition-all duration-200">
                            {isAnalyzing ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Analyzing...</>) : 'Analyze & Create Prompt'}
                        </button>
                        <div className="relative my-4"><div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-600" /></div><div className="relative flex justify-center"><span className="bg-gray-800 px-2 text-sm text-gray-400">OR</span></div></div>
                        <h2 className="text-lg font-bold mb-3 text-blue-300">Step 2: Describe or Edit Prompt</h2>
                        <div className="flex flex-col flex-grow">
                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={handleKeyDown} placeholder={isAnalyzing ? "AI is generating a prompt..." : "Describe diagram, or edit generated prompt."} className="flex-grow bg-gray-900/50 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-colors" rows={8} disabled={isProcessing} />
                            <p className="text-xs text-gray-500 mt-2">Tip: Press Cmd/Ctrl + Enter to generate.</p>
                            <button onClick={handleGenerate} disabled={isProcessing || !prompt.trim()} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-100">
                                {isLoading ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generating...</>) : 'Generate Diagram'}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="md:w-2/3 flex flex-col">
                    <div className="bg-gray-800 rounded-lg shadow-lg flex-grow flex flex-col">
                       {isProcessing && <Loader message={loadingMessage} subMessage={subMessage} />}
                       {error && !isProcessing && <ErrorDisplay message={error} />}
                       {!isProcessing && !error && !diagramXml && <div className="flex-grow flex items-center justify-center p-4"><p className="text-gray-400 text-center">Your generated diagram will appear here. <br/>Upload a document or describe a diagram to start.</p></div>}
                       {diagramXml && !isProcessing && !error && (
                            <>
                                <div className="flex border-b border-gray-700 px-4"><TabButton tabName="diagram" label="Diagram" /><TabButton tabName="xml" label="Draw.io XML" /></div>
                                <div className="flex-grow p-1 md:p-2 bg-gray-800 rounded-b-lg relative">
                                    {activeTab === 'diagram' && <DiagramViewer xml={diagramXml} />}
                                    {activeTab === 'xml' && <XmlViewer xml={diagramXml} />}
                                </div>
                            </>
                       )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;