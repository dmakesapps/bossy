'use client';

interface StatusBarProps {
    modelName?: string;
    tokenCount?: number;
}

export function StatusBar({ modelName, tokenCount }: StatusBarProps) {
    return (
        <footer className="h-7 w-full bg-gray-50 border-t border-gray-200 flex items-center justify-between px-4 fixed bottom-0 left-0 right-0 z-50">
            {/* Left: Model Name */}
            <div className="flex items-center">
                <span className="text-xs font-mono text-gray-600">
                    {modelName || 'No model selected'}
                </span>
            </div>

            {/* Right: Token Count */}
            <div className="flex items-center">
                <span className="text-xs font-mono text-gray-600">
                    {tokenCount !== undefined ? `${tokenCount.toLocaleString()} tokens` : '0 tokens'}
                </span>
            </div>
        </footer>
    );
}
