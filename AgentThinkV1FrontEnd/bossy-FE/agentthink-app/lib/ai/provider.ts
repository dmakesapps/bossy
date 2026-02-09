import { createOpenAI } from '@ai-sdk/openai';

// Available models with their configurations
export const MODELS = {
    'anthropic/claude-sonnet-4-20250514': {
        id: 'anthropic/claude-sonnet-4-20250514',
        label: 'Claude Sonnet 4',
        contextWindow: 200000,
        supportsTools: true,
    },
    'anthropic/claude-haiku-3.5': {
        id: 'anthropic/claude-haiku-3.5',
        label: 'Claude Haiku 3.5',
        contextWindow: 200000,
        supportsTools: true,
    },
    'openai/gpt-4o': {
        id: 'openai/gpt-4o',
        label: 'GPT-4o',
        contextWindow: 128000,
        supportsTools: true,
    },
    'openai/gpt-4o-mini': {
        id: 'openai/gpt-4o-mini',
        label: 'GPT-4o Mini',
        contextWindow: 128000,
        supportsTools: true,
    },
    'google/gemini-2.5-flash': {
        id: 'google/gemini-2.5-flash',
        label: 'Gemini 2.5 Flash',
        contextWindow: 1000000,
        supportsTools: true,
    },
    'meta-llama/llama-3.3-70b-instruct': {
        id: 'meta-llama/llama-3.3-70b-instruct',
        label: 'Llama 3.3 70B',
        contextWindow: 131072,
        supportsTools: true,
    },
    'deepseek/deepseek-r1': {
        id: 'deepseek/deepseek-r1',
        label: 'DeepSeek R1',
        contextWindow: 64000,
        supportsTools: false,
    },
} as const;

export type ModelId = keyof typeof MODELS;

// Create OpenRouter-compatible provider
const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    headers: {
        'HTTP-Referer': 'https://agentthink.app',
        'X-Title': 'AgentThink',
    },
});

// Check if API key is configured
export function isOpenRouterConfigured(): boolean {
    return !!process.env.OPENROUTER_API_KEY;
}

// Get a model instance by ID
export function getModel(modelId: string) {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error(
            'OPENROUTER_API_KEY is not set. Please add your API key to .env.local. ' +
            'Get one at https://openrouter.ai/keys'
        );
    }
    return openrouter(modelId);
}

// Get model configuration
export function getModelConfig(modelId: string) {
    return MODELS[modelId as ModelId] || MODELS['anthropic/claude-sonnet-4-20250514'];
}

// List all available models
export function listModels() {
    return Object.values(MODELS);
}
