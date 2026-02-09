import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, agents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/conversations?projectId=xxx - List conversations for a project
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        const projectConversations = await db
            .select()
            .from(conversations)
            .where(eq(conversations.projectId, projectId))
            .orderBy(conversations.updatedAt);

        return NextResponse.json({ conversations: projectConversations });
    } catch (error) {
        console.error('Failed to fetch conversations:', error);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, agentId, title } = body;

        if (!projectId || !agentId) {
            return NextResponse.json({ error: 'Project ID and Agent ID are required' }, { status: 400 });
        }

        // Verify agent exists
        const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        const [newConversation] = await db.insert(conversations).values({
            projectId,
            agentId,
            title: title || 'New Conversation',
        }).returning();

        return NextResponse.json({ conversation: newConversation }, { status: 201 });
    } catch (error) {
        console.error('Failed to create conversation:', error);
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }
}

// DELETE /api/conversations?id=xxx - Delete a conversation
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
        }

        await db.delete(conversations).where(eq(conversations.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete conversation:', error);
        return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
    }
}
