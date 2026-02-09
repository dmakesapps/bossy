'use client';

import { FileText } from 'lucide-react';

interface RagSearchResultProps {
    documentName: string;
    pageNumber?: number;
    content: string;
    score: number;
}

export function RagSearchResult({ documentName, pageNumber, content, score }: RagSearchResultProps) {
    // Truncate content to 150 characters
    const truncatedContent = content.length > 150
        ? content.slice(0, 150) + '...'
        : content;

    // Score as percentage
    const scorePercent = Math.round(score * 100);

    return (
        <div className="flex gap-2 p-2 bg-gray-50 border border-gray-200 rounded">
            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-black truncate">
                        {documentName}
                    </span>
                    {pageNumber && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                            Page {pageNumber}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                    {truncatedContent}
                </p>
                <div className="mt-1 flex items-center gap-1">
                    <div className="h-1 w-16 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${scorePercent}%` }}
                        />
                    </div>
                    <span className="text-xs text-gray-400">{scorePercent}%</span>
                </div>
            </div>
        </div>
    );
}
