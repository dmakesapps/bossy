'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { Sidebar } from '@/components/layout/sidebar';
import { StatusBar } from '@/components/layout/status-bar';
import { ChatContainer } from '@/components/chat/chat-container';
import { ProjectCreator } from '@/components/workspace/project-creator';

interface Project {
    id: string;
    name: string;
}

interface Agent {
    id: string;
    name: string;
    color: string;
    model: string;
}

interface Conversation {
    id: string;
    title: string;
    agentId: string;
}

export default function ChatPage({
    params
}: {
    params: Promise<{ projectId: string; chatId: string }>
}) {
    const { projectId, chatId } = use(params);
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [agent, setAgent] = useState<Agent | null>(null);
    const [showProjectCreator, setShowProjectCreator] = useState(false);

    // Fetch project
    useEffect(() => {
        fetch('/api/projects')
            .then(res => res.json())
            .then(data => {
                const found = data.projects?.find((p: Project) => p.id === projectId);
                if (found) setProject(found);
            })
            .catch(console.error);
    }, [projectId]);

    // Fetch conversation and agent
    useEffect(() => {
        fetch(`/api/conversations?projectId=${projectId}`)
            .then(res => res.json())
            .then(async (data) => {
                const conv = data.conversations?.find((c: Conversation) => c.id === chatId);
                if (conv) {
                    setConversation(conv);
                    // Fetch the agent for this conversation
                    const agentsRes = await fetch(`/api/agents?projectId=${projectId}`);
                    const agentsData = await agentsRes.json();
                    const agnt = agentsData.agents?.find((a: Agent) => a.id === conv.agentId);
                    if (agnt) setAgent(agnt);
                }
            })
            .catch(console.error);
    }, [projectId, chatId]);

    if (!project || !conversation || !agent) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Topbar projectName={project.name} />

            <Sidebar
                activeProjectId={projectId}
                activeConversationId={chatId}
                onProjectSelect={(id) => router.push(`/project/${id}`)}
                onConversationSelect={(convId) => router.push(`/project/${projectId}/chat/${convId}`)}
                onNewProject={() => setShowProjectCreator(true)}
                onNewConversation={() => {
                    // Create new conversation with same agent
                    createConversation(projectId, agent.id, router);
                }}
                onNewAgent={() => router.push(`/project/${projectId}/agents`)}
            />

            <StatusBar modelName={agent.model} />

            {/* Chat Area */}
            <main className="ml-64 mt-12 mb-7 h-[calc(100vh-48px-28px)]">
                <ChatContainer
                    conversationId={chatId}
                    agentId={agent.id}
                    projectId={projectId}
                    agentColor={agent.color}
                    agentName={agent.name}
                    model={agent.model}
                />
            </main>

            <ProjectCreator
                open={showProjectCreator}
                onOpenChange={setShowProjectCreator}
                onProjectCreated={(newProject) => {
                    router.push(`/project/${newProject.id}`);
                }}
            />
        </div>
    );
}

async function createConversation(projectId: string, agentId: string, router: ReturnType<typeof useRouter>) {
    try {
        const res = await fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, agentId }),
        });
        if (res.ok) {
            const data = await res.json();
            router.push(`/project/${projectId}/chat/${data.conversation.id}`);
        }
    } catch (error) {
        console.error('Failed to create conversation:', error);
    }
}
