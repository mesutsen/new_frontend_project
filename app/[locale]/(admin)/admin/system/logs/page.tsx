'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { systemLogsService, type SystemLogListParams } from '@/services/system-logs.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Loader2,
    AlertCircle,
    Eye,
    Download,
    ChevronLeft,
    ChevronRight,
    ScrollText,
    FileText,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SystemLog } from '@/services/system-logs.service';

export default function SystemLogsPage() {
    const t = useTranslations('SystemLogs');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const format = useFormatter();

    const [levelFilter, setLevelFilter] = useState<string>('');
    const [loggerFilter, setLoggerFilter] = useState<string>('');
    const [userIdFilter, setUserIdFilter] = useState<string>('');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [search, setSearch] = useState<string>('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    // System logs listesi
    const params: SystemLogListParams = {
        pageNumber: page,
        pageSize,
        level: levelFilter || undefined,
        logger: loggerFilter || undefined,
        userId: userIdFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        search: search || undefined,
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['systemLogs', params],
        queryFn: () => systemLogsService.getSystemLogs(params),
    });

    const handleExport = async () => {
        try {
            const blob = await systemLogsService.export({
                format: 'csv',
                level: levelFilter || undefined,
                userId: userIdFilter || undefined,
                from: fromDate || undefined,
                to: toDate || undefined,
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    const handleViewDetails = (log: SystemLog) => {
        setSelectedLog(log);
        setDetailDialogOpen(true);
    };

    const getLevelBadgeVariant = (level: string) => {
        switch (level.toLowerCase()) {
            case 'info':
                return 'default';
            case 'warning':
                return 'secondary';
            case 'error':
                return 'destructive';
            case 'fatal':
                return 'destructive';
            default:
                return 'outline';
        }
    };

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

    const handleResetFilters = () => {
        setLevelFilter('');
        setLoggerFilter('');
        setUserIdFilter('');
        setFromDate('');
        setToDate('');
        setSearch('');
        setPage(1);
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('title')}</h1>
                        <p className="text-muted-foreground">{t('description')}</p>
                    </div>
                    <Button onClick={handleExport} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        {t('export')}
                    </Button>
                </div>

                {/* Filtreler */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">{t('filters')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {t('search')}
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t('searchPlaceholder')}
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {t('level')}
                                </label>
                                <Select
                                    value={levelFilter || 'all'}
                                    onValueChange={(value) => {
                                        setLevelFilter(value === 'all' ? '' : value);
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('levelPlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('allLevels')}</SelectItem>
                                        <SelectItem value="Info">Info</SelectItem>
                                        <SelectItem value="Warning">Warning</SelectItem>
                                        <SelectItem value="Error">Error</SelectItem>
                                        <SelectItem value="Fatal">Fatal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {t('logger')}
                                </label>
                                <Input
                                    placeholder={t('loggerPlaceholder')}
                                    value={loggerFilter}
                                    onChange={(e) => {
                                        setLoggerFilter(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {t('userId')}
                                </label>
                                <Input
                                    placeholder={t('userIdPlaceholder')}
                                    value={userIdFilter}
                                    onChange={(e) => {
                                        setUserIdFilter(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {t('fromDate')}
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={fromDate}
                                    onChange={(e) => {
                                        setFromDate(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {t('toDate')}
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={toDate}
                                    onChange={(e) => {
                                        setToDate(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleResetFilters}
                                    variant="outline"
                                    className="w-full"
                                >
                                    {t('resetFilters')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tablo */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">{t('logs')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !data || data.items.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('noData')}
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('timestamp')}</TableHead>
                                                <TableHead>{t('level')}</TableHead>
                                                <TableHead>{t('logger')}</TableHead>
                                                <TableHead>{t('message')}</TableHead>
                                                <TableHead>{t('userId')}</TableHead>
                                                <TableHead className="text-right">
                                                    {t('actions')}
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.items.map((log) => (
                                                <TableRow key={log.id}>
                                                    <TableCell className="font-mono text-xs">
                                                        {formatDate(log.timestamp)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={getLevelBadgeVariant(log.level)}
                                                        >
                                                            {log.level}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">
                                                        {log.logger.length > 30
                                                            ? log.logger.substring(0, 30) + '...'
                                                            : log.logger}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="max-w-md truncate">
                                                            {log.message}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">
                                                        {log.userId
                                                            ? log.userId.substring(0, 8) + '...'
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewDetails(log)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {data.totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            {t('paginationInfo', {
                                                start: (page - 1) * pageSize + 1,
                                                end: Math.min(page * pageSize, data.totalCount),
                                                total: data.totalCount,
                                            })}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="text-sm">
                                                {t('pageInfo', {
                                                    page,
                                                    totalPages: data.totalPages,
                                                })}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setPage((p) =>
                                                        Math.min(data.totalPages, p + 1)
                                                    )
                                                }
                                                disabled={page === data.totalPages}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detay Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {t('logDetails')}
                        </DialogTitle>
                        <DialogDescription>{t('logDetailsDescription')}</DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('timestamp')}
                                    </p>
                                    <p className="text-base">
                                        {formatDate(selectedLog.timestamp)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('level')}
                                    </p>
                                    <Badge variant={getLevelBadgeVariant(selectedLog.level)}>
                                        {selectedLog.level}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('logger')}
                                    </p>
                                    <p className="text-base font-mono text-xs">
                                        {selectedLog.logger}
                                    </p>
                                </div>
                                {selectedLog.userId && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('userId')}
                                        </p>
                                        <p className="text-base font-mono text-xs">
                                            {selectedLog.userId}
                                        </p>
                                    </div>
                                )}
                                {selectedLog.ipAddress && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('ipAddress')}
                                        </p>
                                        <p className="text-base font-mono text-xs">
                                            {selectedLog.ipAddress}
                                        </p>
                                    </div>
                                )}
                                {selectedLog.requestPath && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('requestPath')}
                                        </p>
                                        <p className="text-base font-mono text-xs">
                                            {selectedLog.requestPath}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="w-full">
                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                    {t('message')}
                                </p>
                                <p className="text-base bg-muted p-4 rounded-md break-words whitespace-pre-wrap w-full">
                                    {selectedLog.message}
                                </p>
                            </div>
                            {selectedLog.exception && (
                                <div className="w-full">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">
                                        {t('exception')}
                                    </p>
                                    <pre className="bg-destructive/10 p-4 rounded-md text-xs overflow-auto max-h-[50vh] font-mono whitespace-pre-wrap break-words w-full">
                                        {selectedLog.exception}
                                    </pre>
                                </div>
                            )}
                            {selectedLog.additionalData && (
                                <div className="w-full">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">
                                        {t('additionalData')}
                                    </p>
                                    <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-[50vh] font-mono whitespace-pre-wrap break-words w-full">
                                        {(() => {
                                            try {
                                                return JSON.stringify(
                                                    JSON.parse(selectedLog.additionalData),
                                                    null,
                                                    2
                                                );
                                            } catch {
                                                return selectedLog.additionalData;
                                            }
                                        })()}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

