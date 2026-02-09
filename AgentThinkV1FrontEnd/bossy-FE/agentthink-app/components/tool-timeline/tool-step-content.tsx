'use client';

import { useState } from 'react';
import { RagSearchResult } from './rag-search-result';
import { WebSearchResult } from './web-search-result';

interface ToolStepContentProps {
    toolName: string;
    result?: string;
}

export function ToolStepContent({ toolName, result }: ToolStepContentProps) {
    const [showAll, setShowAll] = useState(false);

    if (!result) {
        return (
            <div className="text-xs text-gray-400">Waiting for results...</div>
        );
    }

    let parsed;
    try {
        parsed = JSON.parse(result);
    } catch {
        return (
            <div className="text-xs text-gray-400">Unable to parse results</div>
        );
    }

    const results = parsed.results || [];
    const displayResults = showAll ? results : results.slice(0, 3);

    if (toolName === 'rag_search') {
        return (
            <div className="space-y-2">
                <p className="text-xs text-gray-400">
                    {results.length} document chunks found
                </p>
                {displayResults.map((r: RagResult, i: number) => (
                    <RagSearchResult
                        key={i}
                        documentName={r.document_name}
                        pageNumber={r.page_number}
                        content={r.content}
                        score={r.score}
                    />
                ))}
                {results.length > 3 && !showAll && (
                    <button
                        onClick={() => setShowAll(true)}
                        className="text-xs text-blue-600 hover:underline"
                    >
                        Show all {results.length} results
                    </button>
                )}
            </div>
        );
    }

    if (toolName === 'web_search') {
        return (
            <div className="space-y-2">
                {/* Show answer if available */}
                {parsed.answer && (
                    <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                        <p className="text-xs text-gray-400 mb-1">Quick answer</p>
                        {parsed.answer}
                    </div>
                )}
                <p className="text-xs text-gray-400">
                    {results.length} web results found
                </p>
                {displayResults.map((r: WebResult, i: number) => (
                    <WebSearchResult
                        key={i}
                        title={r.title}
                        url={r.url}
                        content={r.content}
                        score={r.score}
                    />
                ))}
                {results.length > 3 && !showAll && (
                    <button
                        onClick={() => setShowAll(true)}
                        className="text-xs text-blue-600 hover:underline"
                    >
                        Show all {results.length} results
                    </button>
                )}
            </div>
        );
    }

    // Fallback for unknown tools
    return (
        <pre className="text-xs font-mono text-gray-600 overflow-auto max-h-40">
            {JSON.stringify(parsed, null, 2)}
        </pre>
    );
}

interface RagResult {
    document_name: string;
    page_number?: number;
    content: string;
    score: number;
}

interface WebResult {
    title: string;
    url: string;
    content: string;
    score: number;
}
