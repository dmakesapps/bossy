'use client';

import { Button } from '@/components/ui/button';

interface EmptyDashboardProps {
    onCreateProject: () => void;
}

export function EmptyDashboard({ onCreateProject }: EmptyDashboardProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold text-black mb-2">
                Welcome to AgentThink
            </h1>
            <p className="text-base text-gray-600 mb-6">
                Create a project to get started
            </p>
            <Button
                onClick={onCreateProject}
                className="bg-black text-white hover:bg-gray-800"
            >
                Create Project
            </Button>
        </div>
    );
}
