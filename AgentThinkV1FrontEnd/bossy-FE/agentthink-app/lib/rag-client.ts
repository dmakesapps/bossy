// RAG Service HTTP Client
// Communicates with the Python RAG service for document search

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8100';

export interface RagSearchResult {
    chunk_id: string;
    document_id: string;
    document_name: string;
    content: string;
    score: number;
    metadata: {
        page_number?: number;
        section?: string;
        chunk_index?: number;
    };
}

export interface RagSearchResponse {
    results: RagSearchResult[];
}

export interface RagHealthResponse {
    status: string;
    qdrant_connected: boolean;
    embedding_model_loaded: boolean;
}

export interface DocumentUploadResponse {
    status: string;
    document_id: string;
}

export interface DocumentStatusResponse {
    document_id: string;
    status: 'pending' | 'processing' | 'ready' | 'error';
    chunk_count: number;
    error_message: string | null;
}

export interface DocumentListItem {
    document_id: string;
    filename: string;
    status: 'pending' | 'processing' | 'ready' | 'error';
    chunk_count: number;
    created_at: number;
    error_message: string | null;
}

export interface DocumentListResponse {
    documents: DocumentListItem[];
}


class RagClient {
    private baseUrl: string;

    constructor(baseUrl: string = RAG_SERVICE_URL) {
        this.baseUrl = baseUrl;
    }

    // Search documents for relevant chunks
    async search(
        query: string,
        projectId: string,
        topK: number = 5,
        scoreThreshold: number = 0.7
    ): Promise<RagSearchResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    project_id: projectId,
                    top_k: topK,
                    score_threshold: scoreThreshold,
                }),
                signal: AbortSignal.timeout(30000), // 30 second timeout
            });

            if (!response.ok) {
                throw new Error(`RAG search failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('RAG search error:', error);
            // Return empty results on error so the agent can still respond
            return { results: [] };
        }
    }

    // Check RAG service health
    async health(): Promise<RagHealthResponse | null> {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch {
            return null;
        }
    }

    // Upload a document for processing
    async uploadDocument(
        file: File,
        projectId: string,
        documentId: string
    ): Promise<DocumentUploadResponse | null> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('project_id', projectId);
            formData.append('document_id', documentId);

            const response = await fetch(`${this.baseUrl}/api/v1/documents/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Document upload error:', error);
            return null;
        }
    }

    // Get document processing status
    async getDocumentStatus(documentId: string): Promise<DocumentStatusResponse | null> {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/documents/${documentId}/status`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch {
            return null;
        }
    }

    // Delete a document
    async deleteDocument(documentId: string, projectId: string): Promise<boolean> {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/v1/documents/${documentId}?project_id=${projectId}`,
                { method: 'DELETE' }
            );

            return response.ok;
        } catch {
            return false;
        }
    }
    // List all documents for a project
    async listDocuments(projectId: string): Promise<DocumentListItem[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/documents/list?project_id=${projectId}`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) {
                return [];
            }

            const data: DocumentListResponse = await response.json();
            return data.documents;
        } catch {
            return [];
        }
    }
}

// Export a singleton instance
export const ragClient = new RagClient();

