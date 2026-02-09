'use client';

import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Users, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Types
interface Project {
    id: string;
    name: string;
}

interface Conversation {
    id: string;
    title: string;
    projectId: string;
}

interface Agent {
    id: string;
    name: string;
    color: string;
    projectId: string;
}

interface SidebarProps {
    activeProjectId?: string;
    activeConversationId?: string;
    onProjectSelect: (projectId: string) => void;
    onConversationSelect: (conversationId: string) => void;
    onNewProject: () => void;
    onNewConversation: () => void;
    onNewAgent: () => void;
}

export function Sidebar({
    activeProjectId,
    activeConversationId,
    onProjectSelect,
    onConversationSelect,
    onNewProject,
    onNewConversation,
    onNewAgent,
}: SidebarProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [ragStatus, setRagStatus] = useState<'connected' | 'disconnected'>('disconnected');

    // Fetch projects
    useEffect(() => {
        fetch('/api/projects')
            .then(res => res.json())
            .then(data => setProjects(data.projects || []))
            .catch(() => setProjects([]));
    }, []);

    // Fetch conversations and agents when project changes
    useEffect(() => {
        if (activeProjectId) {
            fetch(`/api/conversations?projectId=${activeProjectId}`)
                .then(res => res.json())
                .then(data => setConversations(data.conversations || []))
                .catch(() => setConversations([]));

            fetch(`/api/agents?projectId=${activeProjectId}`)
                .then(res => res.json())
                .then(data => setAgents(data.agents || []))
                .catch(() => setAgents([]));
        } else {
            setConversations([]);
            setAgents([]);
        }
    }, [activeProjectId]);

    // Check RAG service health
    useEffect(() => {
        const checkHealth = async () => {
            try {
                const ragUrl = process.env.NEXT_PUBLIC_RAG_SERVICE_URL || 'http://localhost:8100';
                const res = await fetch(`${ragUrl}/api/v1/health`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(3000)
                });
                if (res.ok) {
                    setRagStatus('connected');
                } else {
                    setRagStatus('disconnected');
                }
            } catch {
                setRagStatus('disconnected');
            }
        };

        checkHealth();
        const interval = setInterval(checkHealth, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <aside className="w-64 h-[calc(100vh-48px-28px)] bg-white border-r border-gray-200 fixed top-12 left-0 flex flex-col">
            <ScrollArea className="flex-1 px-3 py-4">
                {/* Projects Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Projects
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={onNewProject}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="space-y-1">
                        {projects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => onProjectSelect(project.id)}
                                className={cn(
                                    'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors',
                                    activeProjectId === project.id
                                        ? 'bg-black text-white'
                                        : 'text-black hover:bg-gray-100'
                                )}
                            >
                                <FolderOpen className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{project.name}</span>
                            </button>
                        ))}
                        {projects.length === 0 && (
                            <p className="text-xs text-gray-400 px-2">No projects yet</p>
                        )}
                    </div>
                </div>

                {/* Conversations Section - Only show when project is selected */}
                {activeProjectId && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Conversations
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={onNewConversation}
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="space-y-1">
                            {conversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => onConversationSelect(conv.id)}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors',
                                        activeConversationId === conv.id
                                            ? 'bg-gray-100'
                                            : 'text-black hover:bg-gray-50'
                                    )}
                                >
                                    <MessageSquare className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                    <span className="truncate">{conv.title}</span>
                                </button>
                            ))}
                            {conversations.length === 0 && (
                                <p className="text-xs text-gray-400 px-2">No conversations yet</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Agents Section - Only show when project is selected */}
                {activeProjectId && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Agents
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={onNewAgent}
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="space-y-1">
                            {agents.map((agent) => (
                                <div
                                    key={agent.id}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm"
                                >
                                    <span
                                        className="h-2 w-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: agent.color }}
                                    />
                                    <span className="truncate text-black">{agent.name}</span>
                                </div>
                            ))}
                            {agents.length === 0 && (
                                <p className="text-xs text-gray-400 px-2">No agents yet</p>
                            )}
                        </div>
                    </div>
                )}
            </ScrollArea>

            {/* RAG Status Indicator */}
            <div className="px-4 py-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            'h-2 w-2 rounded-full',
                            ragStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                        )}
                    />
                    <span className="text-xs text-gray-400">
                        RAG Service: {ragStatus === 'connected' ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            </div>
        </aside>
    );
}
