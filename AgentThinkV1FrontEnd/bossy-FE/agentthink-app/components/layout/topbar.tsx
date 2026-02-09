'use client';

import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopbarProps {
    projectName?: string;
}

export function Topbar({ projectName }: TopbarProps) {
    return (
        <header className="h-12 w-full bg-white border-b border-gray-200 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50">
            {/* Left: Logo */}
            <div className="flex items-center">
                <span className="text-lg font-bold text-black">AgentThink</span>
            </div>

            {/* Center: Project Name */}
            <div className="flex items-center">
                <span className="text-sm text-gray-600">
                    {projectName || 'Select a Project'}
                </span>
            </div>

            {/* Right: Settings */}
            <div className="flex items-center">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4 text-black" />
                </Button>
            </div>
        </header>
    );
}
