'use client';

import { Button } from '@/components/ui/button';

interface EmptyChatProps {
    agentName: string;
    agentColor: string;
    onSuggestionClick: (suggestion: string) => void;
}

const SUGGESTIONS = [
    'Summarize my documents',
    'What are the key findings?',
    'Search the web for...',
    'Generate a report on...',
];

export function EmptyChat({ agentName, agentColor, onSuggestionClick }: EmptyChatProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full px-4">
            {/* Agent Avatar */}
            <div
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4"
                style={{ border: `3px solid ${agentColor}` }}
            >
                <span className="text-2xl font-bold text-black">
                    {agentName.charAt(0).toUpperCase()}
                </span>
            </div>

            {/* Agent Name */}
            <h2 className="text-lg font-bold text-black mb-2">{agentName}</h2>

            {/* Prompt */}
            <p className="text-base text-gray-600 mb-8">
                Start a conversation with {agentName}
            </p>

            {/* Suggestion Chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {SUGGESTIONS.map((suggestion) => (
                    <Button
                        key={suggestion}
                        variant="outline"
                        className="rounded-full border-black text-black hover:bg-gray-100"
                        onClick={() => onSuggestionClick(suggestion)}
                    >
                        {suggestion}
                    </Button>
                ))}
            </div>
        </div>
    );
}
