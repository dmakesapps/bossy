'use client';

import { ToolStep } from './tool-step';

interface ToolInvocation {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: 'partial-call' | 'call' | 'result';
    result?: string;
}

interface ToolInvocationPart {
    type: 'tool-invocation';
    toolInvocation: ToolInvocation;
}

interface ToolInvocationTimelineProps {
    toolInvocations: ToolInvocationPart[];
    agentColor: string;
}

export function ToolInvocationTimeline({ toolInvocations, agentColor }: ToolInvocationTimelineProps) {
    if (toolInvocations.length === 0) return null;

    return (
        <div className="my-4 ml-3 border-l-2 border-gray-200 pl-4">
            <div className="space-y-2">
                {toolInvocations.map((part, index) => (
                    <ToolStep
                        key={part.toolInvocation.toolCallId || index}
                        toolName={part.toolInvocation.toolName}
                        state={part.toolInvocation.state}
                        args={part.toolInvocation.args}
                        result={part.toolInvocation.result}
                        agentColor={agentColor}
                    />
                ))}
            </div>
        </div>
    );
}
