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
import { MODELS } from '@/lib/ai/provider';
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/ai/agents';

interface AgentCreatorProps {
    projectId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAgentCreated: (agent: { id: string; name: string; color: string }) => void;
    editAgent?: {
        id: string;
        name: string;
        description?: string;
        systemPrompt: string;
        model: string;
        temperature: number;
        toolsEnabled: string[];
        actionsEnabled: string[];
    };
}

const modelOptions = Object.values(MODELS);

export function AgentCreator({
    projectId,
    open,
    onOpenChange,
    onAgentCreated,
    editAgent
}: AgentCreatorProps) {
    const isEdit = !!editAgent;

    const [name, setName] = useState(editAgent?.name || '');
    const [description, setDescription] = useState(editAgent?.description || '');
    const [systemPrompt, setSystemPrompt] = useState(editAgent?.systemPrompt || DEFAULT_SYSTEM_PROMPT);
    const [model, setModel] = useState(editAgent?.model || 'anthropic/claude-sonnet-4-20250514');
    const [temperature, setTemperature] = useState(editAgent?.temperature || 0.7);
    const [toolsEnabled, setToolsEnabled] = useState<string[]>(
        editAgent?.toolsEnabled || ['rag_search', 'web_search']
    );
    const [actionsEnabled, setActionsEnabled] = useState<string[]>(
        editAgent?.actionsEnabled || ['chat', 'report', 'deep_think']
    );
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !systemPrompt.trim()) return;

        setIsLoading(true);
        try {
            const method = isEdit ? 'PUT' : 'POST';
            const body = {
                ...(isEdit && { id: editAgent.id }),
                projectId,
                name: name.trim(),
                description: description.trim() || null,
                systemPrompt,
                model,
                temperature,
                toolsEnabled: JSON.stringify(toolsEnabled),
                actionsEnabled: JSON.stringify(actionsEnabled),
            };

            const res = await fetch('/api/agents', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const data = await res.json();
                onAgentCreated(data.agent);
                if (!isEdit) {
                    // Reset form only for create
                    setName('');
                    setDescription('');
                    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
                    setTemperature(0.7);
                }
                onOpenChange(false);
            }
        } catch (error) {
            console.error('Failed to save agent:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTool = (tool: string) => {
        setToolsEnabled((prev) =>
            prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
        );
    };

    const toggleAction = (action: string) => {
        setActionsEnabled((prev) =>
            prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white border border-gray-200 rounded-md max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-black">
                        {isEdit ? 'Edit Agent' : 'Create Agent'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Configure an AI agent with a specific personality and capabilities.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-bold text-black mb-1">
                            Name
                        </label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Legal Analyst"
                            className="border-black"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-bold text-black mb-1">
                            Description
                        </label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this agent's role"
                            className="border-black"
                        />
                    </div>

                    {/* System Prompt */}
                    <div>
                        <label htmlFor="systemPrompt" className="block text-sm font-bold text-black mb-1">
                            System Prompt
                        </label>
                        <Textarea
                            id="systemPrompt"
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="Define this agent's personality, expertise, and behavior..."
                            className="border-black resize-none font-mono text-sm min-h-[200px]"
                            required
                        />
                    </div>

                    {/* Model */}
                    <div>
                        <label htmlFor="model" className="block text-sm font-bold text-black mb-1">
                            Model
                        </label>
                        <select
                            id="model"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full px-3 py-2 border border-black rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            {modelOptions.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs font-mono text-gray-400 mt-1">{model}</p>
                    </div>

                    {/* Temperature */}
                    <div>
                        <label htmlFor="temperature" className="block text-sm font-bold text-black mb-1">
                            Temperature: {temperature}
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Precise</span>
                            <input
                                type="range"
                                id="temperature"
                                min="0"
                                max="1"
                                step="0.1"
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                className="flex-1"
                            />
                            <span className="text-xs text-gray-400">Creative</span>
                        </div>
                    </div>

                    {/* Tools */}
                    <div>
                        <span className="block text-sm font-bold text-black mb-2">Tools</span>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={toolsEnabled.includes('rag_search')}
                                    onChange={() => toggleTool('rag_search')}
                                    className="rounded border-black"
                                />
                                Document Search
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={toolsEnabled.includes('web_search')}
                                    onChange={() => toggleTool('web_search')}
                                    className="rounded border-black"
                                />
                                Web Search
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div>
                        <span className="block text-sm font-bold text-black mb-2">Actions</span>
                        <div className="flex gap-4 flex-wrap">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={actionsEnabled.includes('chat')}
                                    onChange={() => toggleAction('chat')}
                                    className="rounded border-black"
                                />
                                Chat
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={actionsEnabled.includes('report')}
                                    onChange={() => toggleAction('report')}
                                    className="rounded border-black"
                                />
                                Generate Reports
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={actionsEnabled.includes('deep_think')}
                                    onChange={() => toggleAction('deep_think')}
                                    className="rounded border-black"
                                />
                                Deep Thinking
                            </label>
                        </div>
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
                            disabled={isLoading || !name.trim() || !systemPrompt.trim()}
                        >
                            {isLoading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Agent'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
