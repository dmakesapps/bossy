import type { Message } from 'ai';
import { getModelConfig } from './provider';

interface TokenBudget {
    systemPrompt: number;
    toolResults: number;
    messageHistory: number;
    responseSpace: number;
    total: number;
}

// Simple token estimation: ~4 characters per token
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

// Calculate token budgets based on model context window
export function calculateBudget(modelId: string): TokenBudget {
    const config = getModelConfig(modelId);
    const contextWindow = config.contextWindow;

    return {
        systemPrompt: Math.floor(contextWindow * 0.15), // 15% for system prompt
        toolResults: Math.floor(contextWindow * 0.30),   // 30% for tool results
        messageHistory: Math.floor(contextWindow * 0.40), // 40% for message history
        responseSpace: Math.floor(contextWindow * 0.15), // 15% reserved for response
        total: contextWindow,
    };
}

// Trim message history to fit within budget
export function trimMessageHistory(
    messages: Message[],
    maxTokens: number
): Message[] {
    if (messages.length === 0) return messages;

    // Always keep the last 6 messages
    const keepLast = 6;
    const lastMessages = messages.slice(-keepLast);
    const earlierMessages = messages.slice(0, -keepLast);

    // Estimate tokens in last messages
    const lastTokens = lastMessages.reduce(
        (sum, msg) => sum + estimateTokens(typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)),
        0
    );

    // If last messages already exceed budget, just return them
    if (lastTokens >= maxTokens) {
        return lastMessages;
    }

    // If we have earlier messages and room in budget, create a summary
    if (earlierMessages.length > 0) {
        const remainingBudget = maxTokens - lastTokens;

        // Calculate how many earlier messages we can keep
        let tokenCount = 0;
        let keepCount = 0;

        for (let i = earlierMessages.length - 1; i >= 0; i--) {
            const msgTokens = estimateTokens(
                typeof earlierMessages[i].content === 'string'
                    ? earlierMessages[i].content
                    : JSON.stringify(earlierMessages[i].content)
            );

            if (tokenCount + msgTokens <= remainingBudget) {
                tokenCount += msgTokens;
                keepCount++;
            } else {
                break;
            }
        }

        // Keep the first message (initial context) if possible
        const firstMessage = earlierMessages[0];
        const keptMessages = earlierMessages.slice(-keepCount);

        if (keepCount < earlierMessages.length && firstMessage) {
            return [firstMessage, ...keptMessages, ...lastMessages];
        }

        return [...keptMessages, ...lastMessages];
    }

    return lastMessages;
}

// Truncate tool results if they exceed budget
export function truncateToolResults(
    results: string,
    maxTokens: number
): string {
    const estimatedTokens = estimateTokens(results);

    if (estimatedTokens <= maxTokens) {
        return results;
    }

    // Truncate to fit budget (approximate)
    const maxChars = maxTokens * 4;
    const truncated = results.slice(0, maxChars);

    // Try to end at a reasonable break point
    const lastNewline = truncated.lastIndexOf('\n');
    if (lastNewline > maxChars * 0.8) {
        return truncated.slice(0, lastNewline) + '\n[Results truncated due to length]';
    }

    return truncated + '...[truncated]';
}

// Prepare messages for API call, trimming if necessary
export function prepareMessages(
    messages: Message[],
    systemPrompt: string,
    modelId: string
): Message[] {
    const budget = calculateBudget(modelId);
    const systemTokens = estimateTokens(systemPrompt);

    // Calculate remaining budget for messages
    const messageBudget = budget.messageHistory;

    // If system prompt exceeds its budget, warn but continue
    if (systemTokens > budget.systemPrompt) {
        console.warn(
            `System prompt (${systemTokens} tokens) exceeds budget (${budget.systemPrompt} tokens)`
        );
    }

    return trimMessageHistory(messages, messageBudget);
}

export class TokenBudgetManager {
    private modelId: string;
    private budget: TokenBudget;

    constructor(modelId: string) {
        this.modelId = modelId;
        this.budget = calculateBudget(modelId);
    }

    getBudget(): TokenBudget {
        return this.budget;
    }

    estimateMessageTokens(messages: Message[]): number {
        return messages.reduce(
            (sum, msg) => sum + estimateTokens(typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)),
            0
        );
    }

    prepareMessages(messages: Message[], systemPrompt: string): Message[] {
        return prepareMessages(messages, systemPrompt, this.modelId);
    }

    isWithinBudget(
        messages: Message[],
        systemPrompt: string,
        toolResults?: string
    ): boolean {
        const messageTokens = this.estimateMessageTokens(messages);
        const systemTokens = estimateTokens(systemPrompt);
        const toolTokens = toolResults ? estimateTokens(toolResults) : 0;

        const total = messageTokens + systemTokens + toolTokens;
        const available = this.budget.total - this.budget.responseSpace;

        return total <= available;
    }
}
