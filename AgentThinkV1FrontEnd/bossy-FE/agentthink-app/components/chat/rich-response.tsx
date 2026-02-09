'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ChartBlock } from './chart-block';
import { ReportBlock } from './report-block';

interface RichResponseProps {
    content: string;
}

export function RichResponse({ content }: RichResponseProps) {
    // Check for report markers
    const reportMatch = content.match(/<!-- REPORT_START -->([\s\S]*?)<!-- REPORT_END -->/);
    if (reportMatch) {
        const beforeReport = content.slice(0, content.indexOf('<!-- REPORT_START -->'));
        const reportContent = reportMatch[1];
        const afterReport = content.slice(content.indexOf('<!-- REPORT_END -->') + '<!-- REPORT_END -->'.length);

        return (
            <>
                {beforeReport && <MarkdownContent content={beforeReport} />}
                <ReportBlock content={reportContent} />
                {afterReport && <MarkdownContent content={afterReport} />}
            </>
        );
    }

    return <MarkdownContent content={content} />;
}

function MarkdownContent({ content }: { content: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
                // Headings
                h1: ({ children }) => (
                    <h1 className="text-xl font-bold text-black mt-4 mb-2">{children}</h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-lg font-bold text-black mt-3 mb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-base font-bold text-black mt-2 mb-1">{children}</h3>
                ),

                // Paragraphs
                p: ({ children }) => (
                    <p className="text-base text-black mb-2 leading-relaxed">{children}</p>
                ),

                // Lists
                ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2 space-y-1 text-black">{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-2 space-y-1 text-black">{children}</ol>
                ),
                li: ({ children }) => (
                    <li className="text-base">{children}</li>
                ),

                // Code blocks
                code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    const content = String(children).replace(/\n$/, '');

                    // Check if this is a chart code block
                    if (className?.includes('language-chart') || className?.includes('language-data')) {
                        return <ChartBlock content={content} />;
                    }

                    if (isInline) {
                        return (
                            <code className="bg-gray-100 text-black font-mono text-sm px-1 py-0.5 rounded" {...props}>
                                {children}
                            </code>
                        );
                    }

                    return <CodeBlock className={className} content={content} />;
                },
                pre: ({ children }) => <>{children}</>,

                // Tables
                table: ({ children }) => (
                    <div className="overflow-x-auto mb-4">
                        <table className="min-w-full border border-gray-200 rounded-md">
                            {children}
                        </table>
                    </div>
                ),
                thead: ({ children }) => (
                    <thead className="bg-gray-100">{children}</thead>
                ),
                tbody: ({ children }) => (
                    <tbody className="divide-y divide-gray-200">{children}</tbody>
                ),
                tr: ({ children }) => (
                    <tr className="even:bg-gray-50">{children}</tr>
                ),
                th: ({ children }) => (
                    <th className="px-3 py-2 text-left text-sm font-bold text-black border-b border-gray-200">
                        {children}
                    </th>
                ),
                td: ({ children }) => (
                    <td className="px-3 py-2 text-sm text-black">{children}</td>
                ),

                // Blockquotes
                blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-200 pl-4 italic text-gray-600 my-2">
                        {children}
                    </blockquote>
                ),

                // Links
                a: ({ href, children }) => (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                    >
                        {children}
                    </a>
                ),

                // Emphasis
                strong: ({ children }) => (
                    <strong className="font-bold">{children}</strong>
                ),
                em: ({ children }) => (
                    <em className="italic">{children}</em>
                ),

                // Horizontal rule
                hr: () => <hr className="my-4 border-gray-200" />,
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

function CodeBlock({ className, content }: { className?: string; content: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative my-2 rounded-md border border-gray-200 bg-gray-100">
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-black transition-colors"
                title="Copy code"
            >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
            <pre className="p-4 overflow-x-auto">
                <code className={`font-mono text-sm ${className || ''}`}>{content}</code>
            </pre>
        </div>
    );
}
