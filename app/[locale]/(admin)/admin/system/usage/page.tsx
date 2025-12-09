'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { systemUsageService } from '@/services/system-usage.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Activity,
    Loader2,
    AlertCircle,
    TrendingUp,
    Clock,
    Server,
    Globe,
    Zap,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
} from 'recharts';

export default function SystemUsagePage() {
    const t = useTranslations('SystemUsage');
    const locale = useLocale();
    const format = useFormatter();

    const { data: usage, isLoading, error } = useQuery({
        queryKey: ['systemUsage'],
        queryFn: () => systemUsageService.getUsage(),
        refetchInterval: 10000, // Her 10 saniyede bir güncelle
    });

    const formatDate = (dateString: string) => {
        return format.dateTime(new Date(dateString), {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : locale === 'bg' ? 'bg-BG' : 'en-US').format(num);
    };

    // Prepare chart data
    const requestsByMethodData = usage
        ? Object.entries(usage.requests.byMethod).map(([method, count]) => ({
              method,
              count,
          }))
        : [];

    const requestsByStatusData = usage
        ? Object.entries(usage.requests.byStatus).map(([status, count]) => ({
              status,
              count,
          }))
        : [];

    const topPathsData = usage
        ? Object.entries(usage.requests.byPath)
              .slice(0, 10)
              .map(([path, count]) => ({
                  path: path.length > 30 ? path.substring(0, 30) + '...' : path,
                  count,
              }))
        : [];

    const responseTimeByMethodData = usage
        ? Object.entries(usage.responseTime.byMethod).map(([method, time]) => ({
              method,
              time: Math.round(time),
          }))
        : [];

    const getStatusColor = (status: string) => {
        const code = parseInt(status);
        if (code >= 200 && code < 300) return 'default';
        if (code >= 300 && code < 400) return 'secondary';
        if (code >= 400 && code < 500) return 'destructive';
        if (code >= 500) return 'destructive';
        return 'outline';
    };

    if (error) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('errorTitle')}</AlertTitle>
                    <AlertDescription>{t('errorDescription')}</AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('description')}</p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : usage ? (
                    <>
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {t('totalRequests')}
                                    </CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatNumber(usage.requests.total)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {t('lastUpdated')}: {formatDate(usage.timestamp)}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {t('avgResponseTime')}
                                    </CardTitle>
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {Math.round(usage.responseTime.average)} ms
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        P95: {Math.round(usage.responseTime.p95)} ms
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {t('environment')}
                                    </CardTitle>
                                    <Server className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        <Badge variant="outline">{usage.environment}</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {t('responseTimeP99')}
                                    </CardTitle>
                                    <Zap className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {Math.round(usage.responseTime.p99)} ms
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {t('percentile99')}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Requests by Method */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5" />
                                    {t('requestsByMethod')}
                                </CardTitle>
                                <CardDescription>{t('requestsByMethodDescription')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {requestsByMethodData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={requestsByMethodData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="method" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="count" fill="#8884d8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {t('noData')}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Requests by Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    {t('requestsByStatus')}
                                </CardTitle>
                                <CardDescription>{t('requestsByStatusDescription')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                                    {Object.entries(usage.requests.byStatus).map(([status, count]) => (
                                        <div
                                            key={status}
                                            className="flex flex-col items-center justify-center p-4 border rounded-lg"
                                        >
                                            <Badge variant={getStatusColor(status)} className="mb-2">
                                                {status}
                                            </Badge>
                                            <div className="text-2xl font-bold">{formatNumber(count)}</div>
                                        </div>
                                    ))}
                                </div>
                                {requestsByStatusData.length > 0 && (
                                    <div className="mt-4">
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={requestsByStatusData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="status" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="count" fill="#82ca9d" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Paths */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('topPaths')}</CardTitle>
                                <CardDescription>{t('topPathsDescription')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {topPathsData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={topPathsData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="path" type="category" width={150} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="count" fill="#ffc658" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {t('noData')}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Response Time by Method */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('responseTimeByMethod')}</CardTitle>
                                <CardDescription>
                                    {t('responseTimeByMethodDescription')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {responseTimeByMethodData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={responseTimeByMethodData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="method" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="time"
                                                stroke="#8884d8"
                                                strokeWidth={2}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {t('noData')}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">{t('noData')}</div>
                )}
            </div>
        </DashboardLayout>
    );
}

