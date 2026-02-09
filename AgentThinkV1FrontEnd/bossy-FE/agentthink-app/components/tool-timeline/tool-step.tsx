'use client';

import { useState } from 'react';
import { Search, Globe, Check, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ToolStepContent } from './tool-step-content';
import { cn } from '@/lib/utils';

interface ToolStepProps {
    toolName: string;
    state: 'partial-call' | 'call' | 'result';
    args: Record<string, unknown>;
    result?: string;
    agentColor: string;
}

export function ToolStep({ toolName, state, args, result, agentColor }: ToolStepProps) {
    const [isOpen, setIsOpen] = useState(state !== 'result');
    const isComplete = state === 'result';
    const isInProgress = state === 'partial-call' || state === 'call';

    // Get tool display info
    const toolInfo = getToolInfo(toolName);

    // Parse result count if available
    let resultCount = 0;
    if (result) {
        try {
            const parsed = JSON.parse(result);
            resultCount = parsed.resultCount || parsed.results?.length || 0;
        } catch {
            // Ignore parse errors
        }
    }

    return (
        <div className="relative">
            {/* Timeline connector dot */}
            <div
                className={cn(
                    'absolute -left-[21px] top-3 w-3 h-3 rounded-full border-2',
                    isComplete ? 'bg-white border-gray-400' : 'border-transparent',
                    isInProgress && 'animate-spin border-t-2 border-r-2',
                )}
                style={{
                    borderColor: isInProgress ? agentColor : undefined,
                    backgroundColor: isComplete ? 'white' : undefined,
                }}
            >
                {isComplete && (
                    <Check className="w-2 h-2 text-gray-400 absolute top-0 left-0" />
                )}
            </div>

            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <div className="border border-gray-200 rounded bg-white">
                    {/* Header */}
                    <CollapsibleTrigger asChild>
                        <button className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                            {/* Tool Icon */}
                            <toolInfo.icon className="h-4 w-4 text-gray-400" />

                            {/* Tool Name */}
                            <span className="text-sm font-medium text-black">{toolInfo.label}</span>

                            {/* Status Badge */}
                            <div className="flex items-center gap-1 ml-auto">
                                {isInProgress ? (
                                    <>
                                        <Loader2 className="h-3 w-3 text-gray-400 animate-spin" />
                                        <span className="text-xs text-gray-400">Running...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-3 w-3 text-green-600" />
                                        <span className="text-xs text-green-600">Complete</span>
                                    </>
                                )}

                                {/* Expand/collapse indicator */}
                                {isOpen ? (
                                    <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-400 ml-2" />
                                )}
                            </div>
                        </button>
                    </CollapsibleTrigger>

                    {/* Query preview */}
                    <div className="px-3 pb-2 border-t border-gray-100">
                        <p className="text-xs font-mono text-gray-600 truncate">
                            {args.query as string}
                        </p>
                        {isComplete && resultCount > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                                {resultCount} {toolName === 'rag_search' ? 'document chunks' : 'web results'} found
                            </p>
                        )}
                    </div>

                    {/* Expandable content */}
                    <CollapsibleContent>
                        <div className="border-t border-gray-100 p-3">
                            <ToolStepContent toolName={toolName} result={result} />
                        </div>
                    </CollapsibleContent>
                </div>
            </Collapsible>
        </div>
    );
}

function getToolInfo(toolName: string): { icon: typeof Search; label: string } {
    switch (toolName) {
        case 'rag_search':
            return { icon: Search, label: 'Searching documents' };
        case 'web_search':
            return { icon: Globe, label: 'Searching the web' };
        default:
            return { icon: Search, label: toolName };
    }
}
