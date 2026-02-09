'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Trash2, Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { ragClient, DocumentListItem } from '@/lib/rag-client';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

interface DocumentListProps {
    projectId: string;
}

export function DocumentList({ projectId }: DocumentListProps) {
    const [documents, setDocuments] = useState<DocumentListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch documents
    const fetchDocuments = async () => {
        try {
            const docs = await ragClient.listDocuments(projectId);
            setDocuments(docs);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
            // Don't toast on initial load error to avoid spam if backend is down
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();

        // Poll for updates if any document is processing
        const interval = setInterval(() => {
            setDocuments(prev => {
                const hasProcessing = prev.some(d => d.status === 'processing' || d.status === 'pending');
                if (hasProcessing) {
                    // We can't fetch inside setState, so trigger fetch outside
                    fetchDocuments();
                }
                return prev;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [projectId]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const documentId = nanoid();

        setUploading(true);

        // Optimistic update
        const newDoc: DocumentListItem = {
            document_id: documentId,
            filename: file.name,
            status: 'processing',
            chunk_count: 0,
            created_at: Date.now() / 1000,
            error_message: null
        };

        setDocuments(prev => [newDoc, ...prev]);

        try {
            const result = await ragClient.uploadDocument(file, projectId, documentId);

            if (result) {
                toast.success('Document uploaded successfully');
                // Give backend a moment to register file
                setTimeout(fetchDocuments, 1000);
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload document');

            // Mark as error
            setDocuments(prev => prev.map(d =>
                d.document_id === documentId
                    ? { ...d, status: 'error', error_message: 'Upload failed' }
                    : d
            ));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (documentId: string) => {
        try {
            // Optimistic update
            const oldDocs = [...documents];
            setDocuments(prev => prev.filter(d => d.document_id !== documentId));

            const success = await ragClient.deleteDocument(documentId, projectId);

            if (success) {
                toast.success('Document deleted');
            } else {
                // Revert on failure
                setDocuments(oldDocs);
                throw new Error('Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete document');
        }
    };

    if (loading && documents.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Project Documents</h3>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.docx,.txt,.md,.csv"
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-black text-white hover:bg-gray-800"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Document
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {documents.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-lg p-12 text-center">
                    <div className="mx-auto h-12 w-12 text-gray-400 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                        <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No documents yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Upload documents to chat with your data.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {documents.map((doc) => (
                        <Card key={doc.document_id} className="p-4 flex items-center justify-between hover:border-black transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="font-medium truncate max-w-[300px]">{doc.filename}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <StatusBadge status={doc.status} />
                                        {doc.status === 'ready' && (
                                            <span className="text-xs text-gray-400">• {doc.chunk_count} chunks</span>
                                        )}
                                        <span className="text-xs text-gray-400">• {new Date(doc.created_at * 1000).toLocaleDateString()}</span>
                                    </div>
                                    {doc.error_message && (
                                        <p className="text-xs text-red-500 mt-1">{doc.error_message}</p>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(doc.document_id)}
                                className="text-gray-400 hover:text-red-500"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'ready':
            return (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle className="h-3 w-3" /> Ready
                </span>
            );
        case 'processing':
        case 'pending':
            return (
                <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    <Loader2 className="h-3 w-3 animate-spin" /> Processing
                </span>
            );
        case 'error':
            return (
                <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    <AlertCircle className="h-3 w-3" /> Error
                </span>
            );
        default:
            return null;
    }
}
