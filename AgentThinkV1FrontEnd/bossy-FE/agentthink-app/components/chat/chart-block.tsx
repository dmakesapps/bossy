'use client';

import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

interface ChartBlockProps {
    content: string;
}

interface ChartData {
    type: 'bar' | 'line' | 'pie' | 'area';
    title?: string;
    data: Record<string, unknown>[];
    xKey: string;
    yKey: string;
}

const COLORS = ['#FF0000', '#FF7F00', '#0000FF', '#4B0082', '#9400D3', '#00FF00'];

export function ChartBlock({ content }: ChartBlockProps) {
    const chartData = useMemo(() => {
        try {
            return JSON.parse(content) as ChartData;
        } catch {
            return null;
        }
    }, [content]);

    if (!chartData || !chartData.data || !Array.isArray(chartData.data)) {
        // Fall back to code block display
        return (
            <pre className="p-4 bg-gray-100 border border-gray-200 rounded-md overflow-x-auto my-2">
                <code className="font-mono text-sm">{content}</code>
            </pre>
        );
    }

    const { type, title, data, xKey, yKey } = chartData;

    return (
        <div className="my-4 border border-gray-200 rounded-md p-4">
            {title && (
                <h4 className="text-sm font-bold text-black mb-3">{title}</h4>
            )}
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {type === 'bar' ? (
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                            <XAxis
                                dataKey={xKey}
                                tick={{ fontSize: 12, fill: '#000' }}
                                axisLine={{ stroke: '#E5E5E5' }}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: '#000' }}
                                axisLine={{ stroke: '#E5E5E5' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#000',
                                    color: '#fff',
                                    borderRadius: 4,
                                    border: 'none'
                                }}
                            />
                            <Bar dataKey={yKey} fill={COLORS[0]}>
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    ) : type === 'line' ? (
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                            <XAxis
                                dataKey={xKey}
                                tick={{ fontSize: 12, fill: '#000' }}
                            />
                            <YAxis tick={{ fontSize: 12, fill: '#000' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#000',
                                    color: '#fff',
                                    borderRadius: 4
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey={yKey}
                                stroke={COLORS[2]}
                                strokeWidth={2}
                                dot={{ fill: COLORS[2] }}
                            />
                        </LineChart>
                    ) : type === 'area' ? (
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                            <XAxis
                                dataKey={xKey}
                                tick={{ fontSize: 12, fill: '#000' }}
                            />
                            <YAxis tick={{ fontSize: 12, fill: '#000' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#000',
                                    color: '#fff',
                                    borderRadius: 4
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey={yKey}
                                stroke={COLORS[3]}
                                fill={`${COLORS[3]}33`}
                            />
                        </AreaChart>
                    ) : (
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey={yKey}
                                nameKey={xKey}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ name }) => name}
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#000',
                                    color: '#fff',
                                    borderRadius: 4
                                }}
                            />
                        </PieChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
