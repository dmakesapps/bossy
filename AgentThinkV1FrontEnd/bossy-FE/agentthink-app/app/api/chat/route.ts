import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { agents, projects, messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getModel, getModelConfig } from '@/lib/ai/provider';
import { createToolsWithContext } from '@/lib/ai/tools';
import { buildAgentSystemPrompt } from '@/lib/ai/agents';

export const maxDuration = 60; // Allow up to 60 seconds for streaming

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            messages: chatMessages,
            agentId,
            projectId,
            conversationId,
            action = 'chat',
        } = body;

        // Validate required fields
        if (!agentId || !projectId) {
            return new Response(
                JSON.stringify({ error: 'Agent ID and Project ID are required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Load the agent configuration
        const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
        if (!agent) {
            return new Response(
                JSON.stringify({ error: 'Agent not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Load the project
        const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
        if (!project) {
            return new Response(
                JSON.stringify({ error: 'Project not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Build the system prompt
        const systemPrompt = buildAgentSystemPrompt(agent, project, action as 'chat' | 'report' | 'deep_think');

        // Get the tools for this agent with project context
        const tools = createToolsWithContext(agent.toolsEnabled || '[]', projectId);

        // Get the model
        const model = getModel(agent.model || 'anthropic/claude-sonnet-4-20250514');
        const modelConfig = getModelConfig(agent.model || 'anthropic/claude-sonnet-4-20250514');

        // Stream the response
        const result = streamText({
            model,
            system: systemPrompt,
            messages: chatMessages,
            tools: modelConfig.supportsTools ? tools : undefined,
            onFinish: async ({ text, toolCalls, toolResults, usage }) => {
                // Save the assistant message to the database
                if (conversationId && text) {
                    try {
                        await db.insert(messages).values({
                            conversationId,
                            role: 'assistant',
                            content: text,
                            toolCalls: toolCalls ? JSON.stringify(toolCalls) : null,
                            toolResults: toolResults ? JSON.stringify(toolResults) : null,
                            metadata: JSON.stringify({
                                action,
                                usage,
                                model: agent.model,
                            }),
                        });
                    } catch (error) {
                        console.error('Failed to save message:', error);
                    }
                }
            },
        });

        // Return the streaming response using AI SDK v6 method
        return result.toTextStreamResponse();
    } catch (error) {
        console.error('Chat API error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Return 401 for authentication errors (missing API key)
        if (errorMessage.includes('OPENROUTER_API_KEY')) {
            return new Response(
                JSON.stringify({ error: errorMessage }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ error: 'Internal server error', details: errorMessage }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
