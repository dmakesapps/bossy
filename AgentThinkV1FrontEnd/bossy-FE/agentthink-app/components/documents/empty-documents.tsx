'use client';

import { Upload } from 'lucide-react';

export function EmptyDocuments() {
    return (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-black rounded-md mx-4 my-8">
            <Upload className="h-10 w-10 text-black mb-4" />
            <p className="text-lg font-medium text-black mb-2">
                Drop documents here
            </p>
            <p className="text-sm text-gray-400">
                Supports PDF, DOCX, CSV, TXT, MD
            </p>
        </div>
    );
}
