'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { Sidebar } from '@/components/layout/sidebar';
import { StatusBar } from '@/components/layout/status-bar';
import { EmptyChat } from '@/components/chat/empty-chat';
import { DocumentList } from '@/components/documents/document-list';
import { ProjectCreator } from '@/components/workspace/project-creator';
import { AgentCreator } from '@/components/agents/agent-creator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Project {
    id: string;
    name: string;
    description?: string;
}

interface Agent {
    id: string;
    name: string;
    color: string;
    description?: string;
    model: string;
    systemPrompt: string;
    temperature: number;
    toolsEnabled: string;
    actionsEnabled: string;
}

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [activeTab, setActiveTab] = useState('chat');
    const [showProjectCreator, setShowProjectCreator] = useState(false);
    const [showAgentCreator, setShowAgentCreator] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

    // Fetch project details
    useEffect(() => {
        fetch('/api/projects')
            .then(res => res.json())
            .then(data => {
                const found = data.projects?.find((p: Project) => p.id === projectId);
                if (found) {
                    setProject(found);
                }
            })
            .catch(console.error);
    }, [projectId]);

    // Fetch agents for this project
    useEffect(() => {
        fetchAgents();
    }, [projectId]);

    const fetchAgents = async () => {
        try {
            const res = await fetch(`/api/agents?projectId=${projectId}`);
            const data = await res.json();
            setAgents(data.agents || []);
        } catch {
            setAgents([]);
        }
    };

    // Default agent for empty chat
    const defaultAgent = agents[0] || { id: '', name: 'Assistant', color: '#FF0000', model: 'anthropic/claude-sonnet-4-20250514' };

    const handleAgentCreated = (agent: { id: string; name: string; color: string }) => {
        fetchAgents();
        setShowAgentCreator(false);
    };

    const handleStartChat = async (agent: Agent) => {
        // Create a new conversation with this agent
        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, agentId: agent.id }),
            });
            if (res.ok) {
                const data = await res.json();
                router.push(`/project/${projectId}/chat/${data.conversation.id}`);
            }
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        // If we have an agent, start a chat
        if (agents.length > 0) {
            handleStartChat(agents[0]);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Topbar projectName={project?.name} />

            <Sidebar
                activeProjectId={projectId}
                onProjectSelect={(id) => router.push(`/project/${id}`)}
                onConversationSelect={(convId) => router.push(`/project/${projectId}/chat/${convId}`)}
                onNewProject={() => setShowProjectCreator(true)}
                onNewConversation={() => {
                    if (agents.length > 0) {
                        handleStartChat(agents[0]);
                    } else {
                        setActiveTab('agents');
                        setShowAgentCreator(true);
                    }
                }}
                onNewAgent={() => {
                    setActiveTab('agents');
                    setShowAgentCreator(true);
                }}
            />

            <StatusBar modelName={defaultAgent.model} />

            {/* Main Content Area */}
            <main className="ml-64 mt-12 mb-7 min-h-[calc(100vh-48px-28px)]">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start border-b border-gray-200 rounded-none bg-transparent px-4 h-12">
                        <TabsTrigger
                            value="chat"
                            className={cn(
                                'rounded-none border-b-2 border-transparent data-[state=active]:border-black',
                                'data-[state=active]:bg-transparent data-[state=active]:shadow-none',
                                'text-gray-400 data-[state=active]:text-black'
                            )}
                        >
                            Chat
                        </TabsTrigger>
                        <TabsTrigger
                            value="documents"
                            className={cn(
                                'rounded-none border-b-2 border-transparent data-[state=active]:border-black',
                                'data-[state=active]:bg-transparent data-[state=active]:shadow-none',
                                'text-gray-400 data-[state=active]:text-black'
                            )}
                        >
                            Documents
                        </TabsTrigger>
                        <TabsTrigger
                            value="agents"
                            className={cn(
                                'rounded-none border-b-2 border-transparent data-[state=active]:border-black',
                                'data-[state=active]:bg-transparent data-[state=active]:shadow-none',
                                'text-gray-400 data-[state=active]:text-black'
                            )}
                        >
                            Agents
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="chat" className="mt-0 h-[calc(100vh-48px-28px-49px)]">
                        {agents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <p className="text-gray-600 mb-4">Create an agent to start chatting</p>
                                <Button
                                    onClick={() => {
                                        setActiveTab('agents');
                                        setShowAgentCreator(true);
                                    }}
                                    className="bg-black text-white"
                                >
                                    Create Agent
                                </Button>
                            </div>
                        ) : (
                            <EmptyChat
                                agentName={defaultAgent.name}
                                agentColor={defaultAgent.color}
                                onSuggestionClick={handleSuggestionClick}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="documents" className="mt-0">
                        <div className="p-4">
                            <DocumentList projectId={projectId} />
                        </div>
                    </TabsContent>

                    <TabsContent value="agents" className="mt-0">
                        <div className="p-4">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-black">Agents</h2>
                                <Button
                                    onClick={() => setShowAgentCreator(true)}
                                    className="bg-black text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Agent
                                </Button>
                            </div>

                            {agents.length === 0 ? (
                                <div className="text-center py-12 border border-dashed border-gray-200 rounded-md">
                                    <p className="text-gray-600 mb-4">No agents configured for this project</p>
                                    <Button
                                        onClick={() => setShowAgentCreator(true)}
                                        className="bg-black text-white"
                                    >
                                        Create Your First Agent
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {agents.map((agent) => (
                                        <div
                                            key={agent.id}
                                            className="p-4 border border-gray-200 rounded-md hover:border-black transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Avatar */}
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-black flex-shrink-0"
                                                    style={{ border: `3px solid ${agent.color}` }}
                                                >
                                                    {agent.name.charAt(0).toUpperCase()}
                                                </div>
                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-black truncate">{agent.name}</h3>
                                                    <p className="text-sm text-gray-400 truncate">{agent.description || 'No description'}</p>
                                                    <p className="text-xs font-mono text-gray-400 mt-1">{agent.model}</p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 mt-4">
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-black text-white"
                                                    onClick={() => handleStartChat(agent)}
                                                >
                                                    Start Chat
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-black"
                                                    onClick={() => {
                                                        setSelectedAgent(agent);
                                                        setShowAgentCreator(true);
                                                    }}
                                                >
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            <ProjectCreator
                open={showProjectCreator}
                onOpenChange={setShowProjectCreator}
                onProjectCreated={(newProject) => {
                    router.push(`/project/${newProject.id}`);
                }}
            />

            <AgentCreator
                projectId={projectId}
                open={showAgentCreator}
                onOpenChange={(open) => {
                    setShowAgentCreator(open);
                    if (!open) setSelectedAgent(null);
                }}
                onAgentCreated={handleAgentCreated}
                editAgent={selectedAgent ? {
                    id: selectedAgent.id,
                    name: selectedAgent.name,
                    description: selectedAgent.description,
                    systemPrompt: selectedAgent.systemPrompt,
                    model: selectedAgent.model,
                    temperature: selectedAgent.temperature,
                    toolsEnabled: JSON.parse(selectedAgent.toolsEnabled || '[]'),
                    actionsEnabled: JSON.parse(selectedAgent.actionsEnabled || '[]'),
                } : undefined}
            />
        </div>
    );
}
