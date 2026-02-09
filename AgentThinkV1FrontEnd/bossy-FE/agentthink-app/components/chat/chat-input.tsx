'use client';

import { useRef, useEffect } from 'react';
import { Send, Brain, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
    input: string;
    agentName: string;
    action: 'chat' | 'report' | 'deep_think';
    isLoading: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onActionChange: (action: 'chat' | 'report' | 'deep_think') => void;
}

export function ChatInput({
    input,
    agentName,
    action,
    isLoading,
    onInputChange,
    onSubmit,
    onActionChange,
}: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [input]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isLoading && input.trim()) {
                onSubmit(e);
            }
        }
    };

    const getPlaceholder = () => {
        if (action === 'deep_think') {
            return `Ask ${agentName} to think deeply about...`;
        }
        if (action === 'report') {
            return `Ask ${agentName} to generate a report on...`;
        }
        return `Ask ${agentName}...`;
    };

    const toggleAction = (newAction: 'deep_think' | 'report') => {
        if (action === newAction) {
            onActionChange('chat');
        } else {
            onActionChange(newAction);
        }
    };

    return (
        <div className="border-t border-gray-200 bg-white p-4">
            <form onSubmit={onSubmit} className="flex items-end gap-2">
                {/* Action Toggles */}
                <div className="flex gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'h-9 w-9',
                            action === 'deep_think' && 'ring-2 ring-[#4B0082]'
                        )}
                        onClick={() => toggleAction('deep_think')}
                        title="Deep Think"
                    >
                        <Brain className={cn(
                            'h-4 w-4',
                            action === 'deep_think' ? 'text-[#4B0082]' : 'text-gray-400'
                        )} />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'h-9 w-9',
                            action === 'report' && 'ring-2 ring-[#FF7F00]'
                        )}
                        onClick={() => toggleAction('report')}
                        title="Generate Report"
                    >
                        <FileText className={cn(
                            'h-4 w-4',
                            action === 'report' ? 'text-[#FF7F00]' : 'text-gray-400'
                        )} />
                    </Button>
                </div>

                {/* Textarea */}
                <div className={cn(
                    'flex-1 relative',
                    action === 'deep_think' && 'ring-2 ring-[#4B0082] rounded-md',
                    action === 'report' && 'ring-2 ring-[#FF7F00] rounded-md'
                )}>
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={onInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={getPlaceholder()}
                        disabled={isLoading}
                        className="min-h-[44px] max-h-[150px] resize-none border-black pr-12"
                        rows={1}
                    />
                </div>

                {/* Send Button */}
                <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className={cn(
                        'h-11 px-4',
                        action === 'report'
                            ? 'bg-[#FF7F00] hover:bg-[#FF7F00]/90'
                            : 'bg-black hover:bg-gray-800'
                    )}
                >
                    {action === 'report' ? (
                        <>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Report
                        </>
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </form>

            {/* Action Mode Indicator */}
            {action !== 'chat' && (
                <div className="mt-2 text-xs text-gray-400">
                    {action === 'deep_think' && (
                        <span className="flex items-center gap-1">
                            <Brain className="h-3 w-3 text-[#4B0082]" />
                            Deep thinking mode — the agent will show step-by-step reasoning
                        </span>
                    )}
                    {action === 'report' && (
                        <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-[#FF7F00]" />
                            Report mode — the agent will research and generate a structured report
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
