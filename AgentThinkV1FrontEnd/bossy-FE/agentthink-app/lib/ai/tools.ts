import { tool } from 'ai';
import { z } from 'zod';
import { ragClient } from '@/lib/rag-client';
import { tavilyClient } from '@/lib/tavily-client';

// RAG Search Tool Factory - creates a tool instance bound to a specific project
function createRagSearchTool(projectId: string) {
    return tool({
        description:
            "Search through the project's uploaded documents to find relevant information. Use this when the user asks questions that could be answered by the project's documents.",
        parameters: z.object({
            query: z.string().describe('The search query to find relevant document chunks'),
            top_k: z
                .number()
                .optional()
                .default(5)
                .describe('Number of results to return'),
        }),
        execute: async ({ query, top_k }) => {
            try {
                const response = await ragClient.search(query, projectId, top_k);

                const results = response.results.map((r) => ({
                    document_name: r.document_name,
                    page_number: r.metadata?.page_number,
                    content: r.content,
                    score: r.score,
                }));

                return JSON.stringify({
                    tool: 'rag_search',
                    query,
                    resultCount: results.length,
                    results,
                });
            } catch (error) {
                console.error('RAG search error:', error);
                return JSON.stringify({
                    tool: 'rag_search',
                    query,
                    error: 'RAG service is not available. Document search is currently disabled.',
                    resultCount: 0,
                    results: [],
                });
            }
        },
    });
}

// Web Search Tool - stateless, can be reused
export const webSearchTool = tool({
    description:
        "Search the internet for current, up-to-date information. Use this when the user asks about recent events, needs current data, or asks about something not covered in the project documents.",
    parameters: z.object({
        query: z.string().describe('The web search query'),
        max_results: z
            .number()
            .optional()
            .default(5)
            .describe('Number of results to return'),
    }),
    execute: async ({ query, max_results }) => {
        try {
            const response = await tavilyClient.search(query, { maxResults: max_results });

            const results = response.results.map((r) => ({
                title: r.title,
                url: r.url,
                content: r.content,
                score: r.score,
            }));

            return JSON.stringify({
                tool: 'web_search',
                query,
                answer: response.answer,
                resultCount: results.length,
                results,
            });
        } catch (error) {
            console.error('Web search error:', error);
            return JSON.stringify({
                tool: 'web_search',
                query,
                error: 'Web search is not available. Please check your TAVILY_API_KEY.',
                resultCount: 0,
                results: [],
            });
        }
    },
});

export const ALL_TOOLS_NAMES = ['rag_search', 'web_search'] as const;
export type ToolName = typeof ALL_TOOLS_NAMES[number];

// Create tools with project context injected
export function createToolsWithContext(
    toolsEnabled: string[] | string,
    projectId: string
) {
    const enabledTools = typeof toolsEnabled === 'string'
        ? JSON.parse(toolsEnabled) as string[]
        : toolsEnabled;

    const tools: Record<string, any> = {};

    for (const toolName of enabledTools) {
        if (toolName === 'web_search') {
            tools.web_search = webSearchTool;
        } else if (toolName === 'rag_search') {
            // Create a fresh instance bound to this project ID
            tools.rag_search = createRagSearchTool(projectId);
        }
    }

    return tools;
}

// Deprecated function kept for compatibility if needed elsewhere
// But prefer using createToolsWithContext
export function getToolsForAgent(toolsEnabled: string[] | string) {
    return createToolsWithContext(toolsEnabled, '');
}
