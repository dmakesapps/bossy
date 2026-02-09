'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { EmptyChat } from './empty-chat';
import { ThinkingIndicator } from './thinking-indicator';

interface ChatContainerProps {
    conversationId: string;
    agentId: string;
    projectId: string;
    agentColor: string;
    agentName: string;
    model: string;
}

export function ChatContainer({
    conversationId,
    agentId,
    projectId,
    agentColor,
    agentName,
    model,
}: ChatContainerProps) {
    const [action, setAction] = useState<'chat' | 'report' | 'deep_think'>('chat');
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [startTime, setStartTime] = useState<number | null>(null);

    const chatHelpers = useChat({
        id: conversationId,
        api: '/api/chat',
        body: {
            agentId,
            projectId,
            conversationId,
            action,
        },
        onResponse: () => {
            setStartTime(Date.now());
        },
        onFinish: () => {
            setStartTime(null);
        },
    } as any) as any;

    console.log('useChat result keys:', Object.keys(chatHelpers));

    const { messages, sendMessage, status, error, regenerate } = chatHelpers;

    const isLoading = status === 'submitted' || status === 'streaming';

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSuggestionClick = (suggestion: string) => {
        setInputValue(suggestion);
    };

    const handleActionChange = (newAction: 'chat' | 'report' | 'deep_think') => {
        setAction(newAction);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const messageContent = inputValue;
        setInputValue('');

        await sendMessage({
            role: 'user',
            content: messageContent,
        }, {
            body: {
                agentId,
                projectId,
                conversationId,
                action,
            }
        });
    };

    // Show empty chat if no messages
    if (messages.length === 0 && !isLoading) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex-1">
                    <EmptyChat
                        agentName={agentName}
                        agentColor={agentColor}
                        onSuggestionClick={handleSuggestionClick}
                    />
                </div>
                <ChatInput
                    input={inputValue}
                    agentName={agentName}
                    action={action}
                    isLoading={isLoading}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    onActionChange={handleActionChange}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Agent Header */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200">
                <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: agentColor }}
                />
                <span className="font-bold text-black text-sm">{agentName}</span>
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    {model}
                </span>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4" ref={scrollRef}>
                <div className="py-4 space-y-4">
                    {messages.map((message: any) => (
                        <ChatMessage
                            key={message.id}
                            message={message}
                            agentName={agentName}
                            agentColor={agentColor}
                        />
                    ))}

                    {/* Thinking Indicator */}
                    {isLoading && action === 'deep_think' && startTime && (
                        <ThinkingIndicator startTime={startTime} />
                    )}

                    {/* Loading indicator for regular chat */}
                    {isLoading && action !== 'deep_think' && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span>Responding...</span>
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4 flex items-start gap-3">
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-red-800 mb-1">
                                    Unable to respond
                                </h4>
                                <p className="text-sm text-red-700">
                                    {(() => {
                                        try {
                                            // Try to parse JSON error message if it exists
                                            const errorObj = JSON.parse(error.message);
                                            return errorObj.message || errorObj.error || error.message;
                                        } catch {
                                            return error.message;
                                        }
                                    })()}
                                </p>
                                <button
                                    onClick={() => regenerate()}
                                    className="mt-3 text-xs font-medium text-red-800 underline hover:no-underline"
                                >
                                    Click to retry
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input */}
            <ChatInput
                input={inputValue}
                agentName={agentName}
                action={action}
                isLoading={isLoading}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                onActionChange={handleActionChange}
            />
        </div>
    );
}
