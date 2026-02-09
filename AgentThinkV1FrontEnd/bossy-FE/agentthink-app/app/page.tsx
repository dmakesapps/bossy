'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { Sidebar } from '@/components/layout/sidebar';
import { StatusBar } from '@/components/layout/status-bar';
import { EmptyDashboard } from '@/components/workspace/empty-dashboard';
import { ProjectCreator } from '@/components/workspace/project-creator';

export default function Home() {
  const router = useRouter();
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [projectName, setProjectName] = useState<string | undefined>();
  const [showProjectCreator, setShowProjectCreator] = useState(false);

  const handleProjectSelect = (projectId: string) => {
    setActiveProjectId(projectId);
    router.push(`/project/${projectId}`);
  };

  const handleConversationSelect = (conversationId: string) => {
    setActiveConversationId(conversationId);
    if (activeProjectId) {
      router.push(`/project/${activeProjectId}/chat/${conversationId}`);
    }
  };

  const handleProjectCreated = (project: { id: string; name: string }) => {
    setActiveProjectId(project.id);
    setProjectName(project.name);
    router.push(`/project/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Topbar projectName={projectName} />

      <Sidebar
        activeProjectId={activeProjectId}
        activeConversationId={activeConversationId}
        onProjectSelect={handleProjectSelect}
        onConversationSelect={handleConversationSelect}
        onNewProject={() => setShowProjectCreator(true)}
        onNewConversation={() => {
          // Will be implemented in Phase 4
          console.log('New conversation');
        }}
        onNewAgent={() => {
          // Will be implemented in Phase 6
          console.log('New agent');
        }}
      />

      <StatusBar modelName="anthropic/claude-sonnet-4-20250514" />

      {/* Main Content Area */}
      <main className="ml-64 mt-12 mb-7 min-h-[calc(100vh-48px-28px)] flex items-center justify-center">
        <EmptyDashboard onCreateProject={() => setShowProjectCreator(true)} />
      </main>

      <ProjectCreator
        open={showProjectCreator}
        onOpenChange={setShowProjectCreator}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
