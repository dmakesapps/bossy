'use client';

import { useState, useEffect } from 'react';

interface ThinkingIndicatorProps {
    startTime: number;
}

export function ThinkingIndicator({ startTime }: ThinkingIndicatorProps) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="flex items-center gap-3 py-2">
            <div className="flex gap-1">
                <span
                    className="w-2 h-2 rounded-full bg-[#4B0082] animate-pulse"
                    style={{ animationDelay: '0ms' }}
                />
                <span
                    className="w-2 h-2 rounded-full bg-[#4B0082] animate-pulse"
                    style={{ animationDelay: '300ms' }}
                />
                <span
                    className="w-2 h-2 rounded-full bg-[#4B0082] animate-pulse"
                    style={{ animationDelay: '600ms' }}
                />
            </div>
            <span className="text-sm text-gray-600">Thinking deeply...</span>
            <span className="text-xs font-mono text-gray-400">{elapsed}s</span>
        </div>
    );
}
