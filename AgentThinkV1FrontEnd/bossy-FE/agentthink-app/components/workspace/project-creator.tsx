'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ProjectCreatorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProjectCreated: (project: { id: string; name: string }) => void;
}

export function ProjectCreator({ open, onOpenChange, onProjectCreated }: ProjectCreatorProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
            });

            if (res.ok) {
                const data = await res.json();
                onProjectCreated(data.project);
                setName('');
                setDescription('');
                onOpenChange(false);
            }
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white border border-gray-200 rounded-md max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-black">Create Project</DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Create a new project to organize your documents, agents, and conversations.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-bold text-black mb-1">
                            Name
                        </label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Q3 Research Project"
                            className="border-black"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-bold text-black mb-1">
                            Description
                        </label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this project about?"
                            className="border-black resize-none"
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-black text-white hover:bg-gray-800"
                            disabled={isLoading || !name.trim()}
                        >
                            {isLoading ? 'Creating...' : 'Create Project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
