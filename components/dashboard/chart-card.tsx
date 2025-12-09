'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { ChartSeries } from '@/services/dashboard.service';

interface ChartCardProps {
    title: string;
    description?: string;
    series?: ChartSeries[];
    chartType?: 'line' | 'bar' | 'pie';
    type?: 'line' | 'bar'; // Deprecated: use chartType instead
    height?: number;
    // Alternative format for simple charts
    labels?: string[];
    data?: number[];
}

export function ChartCard({ 
    title, 
    description,
    series, 
    chartType,
    type, // Deprecated
    height = 250,
    labels,
    data,
}: ChartCardProps) {
    // Determine actual chart type
    const actualType = chartType || type || 'line';
    
    // If labels and data are provided, convert to ChartSeries format
    let normalizedSeries: ChartSeries[] = [];
    
    if (labels && data && labels.length > 0) {
        // Convert labels + data format to ChartSeries format
        normalizedSeries = [
            {
                name: (series && series.length > 0 ? series[0].name : null) || 'Value',
                points: labels.map((label, index) => ({
                    label,
                    value: data[index] || 0,
                })),
            },
        ];
    } else if (series && series.length > 0) {
        normalizedSeries = series;
    } else {
        // No data available
        normalizedSeries = [];
    }

    // Recharts için veri formatını dönüştür
    const chartData = normalizedSeries[0]?.points?.map((point, index) => {
        const dataPoint: Record<string, any> = {
            label: point.label,
        };
        normalizedSeries.forEach((s) => {
            dataPoint[s.name] = s.points?.[index]?.value ?? 0;
        });
        return dataPoint;
    }) || [];

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    // For pie charts, prepare data differently
    const pieData = actualType === 'pie' && normalizedSeries[0]?.points
        ? normalizedSeries[0].points.map((point) => ({
              name: point.label,
              value: point.value,
          }))
        : [];

    return (
        <Card>
            <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
                {description && (
                    <CardDescription className="text-xs sm:text-sm mt-1">{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="pt-0">
                {chartData.length === 0 && pieData.length === 0 ? (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                        No data available
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={height}>
                        {actualType === 'pie' ? (
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '0.5rem',
                                        fontSize: '12px',
                                        padding: '8px',
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                                    iconSize={12}
                                />
                            </PieChart>
                        ) : actualType === 'line' ? (
                        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11, fill: 'currentColor' }}
                                tickMargin={8}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: 'currentColor' }}
                                tickMargin={8}
                                width={50}
                                tickFormatter={(value) => {
                                    // Büyük sayılar için kısaltma (örn: 1000 -> 1K, 1000000 -> 1M)
                                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                                    return value.toString();
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '0.5rem',
                                    fontSize: '12px',
                                    padding: '8px',
                                }}
                                formatter={(value: any) => {
                                    // Prim tutarı için formatla
                                    if (typeof value === 'number' && value >= 1000) {
                                        return `${value.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} TRY`;
                                    }
                                    return value;
                                }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                                iconSize={12}
                            />
                            {normalizedSeries.map((s, index) => (
                                <Line
                                    key={s.name}
                                    type="monotone"
                                    dataKey={s.name}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            ))}
                        </LineChart>
                        ) : (
                            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 11, fill: 'currentColor' }}
                                    tickMargin={8}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: 'currentColor' }}
                                    tickMargin={8}
                                    width={50}
                                    tickFormatter={(value) => {
                                        // Büyük sayılar için kısaltma (örn: 1000 -> 1K, 1000000 -> 1M)
                                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                                        return value.toString();
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '0.5rem',
                                        fontSize: '12px',
                                        padding: '8px',
                                    }}
                                    formatter={(value: any) => {
                                        // Prim tutarı için formatla
                                        if (typeof value === 'number' && value >= 1000) {
                                            return `${value.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} TRY`;
                                        }
                                        return value;
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                                    iconSize={12}
                                />
                                {normalizedSeries.map((s, index) => (
                                    <Bar
                                        key={s.name}
                                        dataKey={s.name}
                                        fill={colors[index % colors.length]}
                                        radius={[3, 3, 0, 0]}
                                    />
                                ))}
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

