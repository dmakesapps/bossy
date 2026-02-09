'use client';

import { FileText, Globe } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Source {
    type: 'document' | 'web';
    name: string;
    url?: string;
    pageNumber?: number;
}

interface SourceCitationProps {
    sources: Source[];
}

export function SourceCitation({ sources }: SourceCitationProps) {
    if (sources.length === 0) return null;

    return (
        <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Sources</p>
            <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                    {sources.map((source, index) => (
                        <Tooltip key={index}>
                            <TooltipTrigger asChild>
                                {source.type === 'web' && source.url ? (
                                    <a
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-200 transition-colors"
                                    >
                                        <Globe className="h-3 w-3 text-gray-400" />
                                        <span className="truncate max-w-[150px]">
                                            {extractDomain(source.url)}
                                        </span>
                                    </a>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-600">
                                        <FileText className="h-3 w-3 text-gray-400" />
                                        <span className="truncate max-w-[150px]">{source.name}</span>
                                        {source.pageNumber && (
                                            <span className="text-gray-400">p.{source.pageNumber}</span>
                                        )}
                                    </span>
                                )}
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-black text-white text-xs">
                                {source.type === 'web' ? source.url : source.name}
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>
        </div>
    );
}

function extractDomain(url: string): string {
    try {
        const domain = new URL(url).hostname;
        return domain.replace(/^www\./, '');
    } catch {
        return url;
    }
}
