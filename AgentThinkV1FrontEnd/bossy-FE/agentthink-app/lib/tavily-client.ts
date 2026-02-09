// Tavily Web Search API Client

const TAVILY_API_URL = 'https://api.tavily.com/search';

export interface TavilySearchResult {
    title: string;
    url: string;
    content: string;
    score: number;
}

export interface TavilySearchResponse {
    answer: string | null;
    results: TavilySearchResult[];
}

interface TavilySearchOptions {
    maxResults?: number;
    searchDepth?: 'basic' | 'advanced';
    includeDomains?: string[];
    excludeDomains?: string[];
}

class TavilyClient {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.TAVILY_API_KEY || '';
    }

    async search(
        query: string,
        options: TavilySearchOptions = {}
    ): Promise<TavilySearchResponse> {
        const {
            maxResults = 5,
            searchDepth = 'advanced',
            includeDomains,
            excludeDomains,
        } = options;

        // If no API key, return empty results
        if (!this.apiKey) {
            console.warn('Tavily API key not configured');
            return { answer: null, results: [] };
        }

        try {
            const response = await fetch(TAVILY_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: this.apiKey,
                    query,
                    search_depth: searchDepth,
                    include_answer: true,
                    include_raw_content: false,
                    max_results: maxResults,
                    include_domains: includeDomains,
                    exclude_domains: excludeDomains,
                }),
                signal: AbortSignal.timeout(30000), // 30 second timeout
            });

            if (!response.ok) {
                throw new Error(`Tavily search failed: ${response.statusText}`);
            }

            const data = await response.json();

            return {
                answer: data.answer || null,
                results: (data.results || []).map((r: TavilySearchResult) => ({
                    title: r.title,
                    url: r.url,
                    content: r.content,
                    score: r.score,
                })),
            };
        } catch (error) {
            console.error('Tavily search error:', error);
            // Return empty results on error so the agent can still respond
            return { answer: null, results: [] };
        }
    }
}

// Export a singleton instance
export const tavilyClient = new TavilyClient();
