import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Agent color palette - assigned in order of creation
const AGENT_COLORS = [
    '#FF0000', // red
    '#FF7F00', // orange
    '#0000FF', // blue
    '#4B0082', // indigo
    '#9400D3', // violet
    '#00FF00', // green
    '#FFFF00', // yellow
];

// GET /api/agents?projectId=xxx - List agents for a project
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        const projectAgents = await db
            .select()
            .from(agents)
            .where(eq(agents.projectId, projectId))
            .orderBy(agents.createdAt);

        return NextResponse.json({ agents: projectAgents });
    } catch (error) {
        console.error('Failed to fetch agents:', error);
        return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, name, description, systemPrompt, model, temperature, toolsEnabled, actionsEnabled } = body;

        if (!projectId || !name || !systemPrompt) {
            return NextResponse.json({ error: 'Project ID, name, and system prompt are required' }, { status: 400 });
        }

        // Get existing agents to determine next color
        const existingAgents = await db
            .select()
            .from(agents)
            .where(eq(agents.projectId, projectId));

        const usedColors = new Set(existingAgents.map(a => a.color));
        const nextColor = AGENT_COLORS.find(c => !usedColors.has(c)) || AGENT_COLORS[0];

        const [newAgent] = await db.insert(agents).values({
            projectId,
            name,
            description: description || null,
            systemPrompt,
            model: model || 'anthropic/claude-sonnet-4-20250514',
            temperature: temperature ?? 0.7,
            color: nextColor,
            toolsEnabled: toolsEnabled || '["rag_search","web_search"]',
            actionsEnabled: actionsEnabled || '["chat","report","deep_think"]',
        }).returning();

        return NextResponse.json({ agent: newAgent }, { status: 201 });
    } catch (error) {
        console.error('Failed to create agent:', error);
        return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
    }
}

// PUT /api/agents - Update an agent
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, description, systemPrompt, model, temperature, toolsEnabled, actionsEnabled } = body;

        if (!id) {
            return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
        }

        const [updatedAgent] = await db
            .update(agents)
            .set({
                name,
                description,
                systemPrompt,
                model,
                temperature,
                toolsEnabled,
                actionsEnabled,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(agents.id, id))
            .returning();

        return NextResponse.json({ agent: updatedAgent });
    } catch (error) {
        console.error('Failed to update agent:', error);
        return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
    }
}

// DELETE /api/agents?id=xxx - Delete an agent
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
        }

        await db.delete(agents).where(eq(agents.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete agent:', error);
        return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
    }
}
