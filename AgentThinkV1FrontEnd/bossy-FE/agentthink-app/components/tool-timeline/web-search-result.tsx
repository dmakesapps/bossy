'use client';

import { Globe, ExternalLink } from 'lucide-react';

interface WebSearchResultProps {
    title: string;
    url: string;
    content: string;
    score: number;
}

export function WebSearchResult({ title, url, content }: WebSearchResultProps) {
    // Truncate content to 150 characters
    const truncatedContent = content.length > 150
        ? content.slice(0, 150) + '...'
        : content;

    // Extract domain from URL
    let domain = '';
    try {
        domain = new URL(url).hostname.replace(/^www\./, '');
    } catch {
        domain = url;
    }

    return (
        <div className="flex gap-2 p-2 bg-gray-50 border border-gray-200 rounded">
            <Globe className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-black line-clamp-1">
                        {title}
                    </span>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-gray-400 hover:text-blue-600"
                    >
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-blue-600 hover:underline block truncate mb-1"
                >
                    {domain}
                </a>
                <p className="text-xs text-gray-600 leading-relaxed">
                    {truncatedContent}
                </p>
            </div>
        </div>
    );
}
