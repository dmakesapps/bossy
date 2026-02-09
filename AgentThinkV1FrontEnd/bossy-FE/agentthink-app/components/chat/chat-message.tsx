'use client';

import type { UIMessage } from '@ai-sdk/react';
import { format } from 'date-fns';
import { RichResponse } from './rich-response';
import { SourceCitation } from './source-citation';
import { ToolInvocationTimeline } from '@/components/tool-timeline/tool-invocation-timeline';

interface ChatMessageProps {
    message: UIMessage;
    agentName: string;
    agentColor: string;
}

export function ChatMessage({ message, agentName, agentColor }: ChatMessageProps) {
    const isUser = message.role === 'user';
    const timestamp = message.createdAt ? format(new Date(message.createdAt), 'h:mm a') : '';

    // For user messages, render simple bubble
    if (isUser) {
        return (
            <div className="flex justify-end">
                <div className="max-w-[70%]">
                    <div className="bg-gray-100 rounded-md px-4 py-2">
                        <p className="text-sm text-black whitespace-pre-wrap">
                            {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                        </p>
                    </div>
                    {timestamp && (
                        <p className="text-xs text-gray-400 mt-1 text-right">{timestamp}</p>
                    )}
                </div>
            </div>
        );
    }

    // For assistant messages, render with parts support
    return (
        <div className="flex">
            <div className="w-full" style={{ borderLeft: `3px solid ${agentColor}` }}>
                <div className="pl-4">
                    {/* Agent header */}
                    <div className="flex items-center gap-2 mb-2">
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black bg-white"
                            style={{ border: `2px solid ${agentColor}` }}
                        >
                            {agentName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-sm text-black">{agentName}</span>
                    </div>

                    {/* Message content - handle parts array if available */}
                    {renderMessageContent(message, agentColor)}

                    {/* Timestamp */}
                    {timestamp && (
                        <p className="text-xs text-gray-400 mt-2">{timestamp}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function renderMessageContent(message: UIMessage, agentColor: string) {
    // AI SDK v6 uses parts array for structured content
    const parts = message.parts;

    if (parts && Array.isArray(parts)) {
        const elements: React.ReactNode[] = [];
        const toolInvocations: ToolInvocationPart[] = [];

        parts.forEach((part, index) => {
            if (part.type === 'text') {
                // Render text content
                elements.push(
                    <RichResponse key={`text-${index}`} content={part.text} />
                );
            } else if (part.type === 'tool-invocation') {
                toolInvocations.push(part);
            }
        });

        // Extract sources from tool results for citations
        const sources = extractSources(parts);

        return (
            <>
                {toolInvocations.length > 0 && (
                    <ToolInvocationTimeline
                        toolInvocations={toolInvocations}
                        agentColor={agentColor}
                    />
                )}
                {elements}
                {sources.length > 0 && <SourceCitation sources={sources} />}
            </>
        );
    }

    // Fallback to simple content rendering
    const content = typeof message.content === 'string'
        ? message.content
        : JSON.stringify(message.content);

    return <RichResponse content={content} />;
}

// Type definitions for message parts
interface ToolInvocationPart {
    type: 'tool-invocation';
    toolInvocation: {
        toolCallId: string;
        toolName: string;
        args: Record<string, unknown>;
        state: 'partial-call' | 'call' | 'result';
        result?: string;
    };
}

interface Source {
    type: 'document' | 'web';
    name: string;
    url?: string;
    pageNumber?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSources(parts: any[]): Source[] {
    const sources: Source[] = [];

    for (const part of parts) {
        if (part.type === 'tool-invocation' && part.toolInvocation?.state === 'result') {
            try {
                const result = JSON.parse(part.toolInvocation.result || '{}');

                if (result.tool === 'rag_search' && result.results) {
                    for (const r of result.results) {
                        sources.push({
                            type: 'document',
                            name: r.document_name,
                            pageNumber: r.page_number,
                        });
                    }
                }

                if (result.tool === 'web_search' && result.results) {
                    for (const r of result.results) {
                        sources.push({
                            type: 'web',
                            name: r.title,
                            url: r.url,
                        });
                    }
                }
            } catch {
                // Ignore parse errors
            }
        }
    }

    // Deduplicate sources
    const seen = new Set<string>();
    return sources.filter((s) => {
        const key = s.type === 'document'
            ? `${s.name}-${s.pageNumber}`
            : s.url || s.name;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
