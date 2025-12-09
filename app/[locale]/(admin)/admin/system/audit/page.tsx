'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { auditLogsService, type AuditLogListParams } from '@/services/audit-logs.service';
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
    FileSearch,
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
import type { AuditLog } from '@/services/audit-logs.service';

export default function AuditLogsPage() {
    const t = useTranslations('AuditLogs');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const format = useFormatter();

    const [entityNameFilter, setEntityNameFilter] = useState<string>('');
    const [actionFilter, setActionFilter] = useState<string>('');
    const [userIdFilter, setUserIdFilter] = useState<string>('');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    // Audit logs listesi
    const params: AuditLogListParams = {
        pageNumber: page,
        pageSize,
        entityName: entityNameFilter || undefined,
        action: actionFilter || undefined,
        userId: userIdFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['auditLogs', params],
        queryFn: () => auditLogsService.getAuditLogs(params),
    });

    const handleExport = async () => {
        try {
            const blob = await auditLogsService.export({
                format: 'csv',
                entityName: entityNameFilter || undefined,
                userId: userIdFilter || undefined,
                from: fromDate || undefined,
                to: toDate || undefined,
            });

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    const handleViewDetails = (log: AuditLog) => {
        setSelectedLog(log);
        setDetailDialogOpen(true);
    };

    const getActionBadgeVariant = (action: string) => {
        switch (action.toLowerCase()) {
            case 'create':
                return 'default';
            case 'update':
                return 'secondary';
            case 'delete':
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
        setEntityNameFilter('');
        setActionFilter('');
        setUserIdFilter('');
        setFromDate('');
        setToDate('');
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
                                    {t('entityName')}
                                </label>
                                <Input
                                    placeholder={t('entityNamePlaceholder')}
                                    value={entityNameFilter}
                                    onChange={(e) => {
                                        setEntityNameFilter(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {t('action')}
                                </label>
                                <Select
                                    value={actionFilter || 'all'}
                                    onValueChange={(value) => {
                                        setActionFilter(value === 'all' ? '' : value);
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('actionPlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('allActions')}</SelectItem>
                                        <SelectItem value="Create">Create</SelectItem>
                                        <SelectItem value="Update">Update</SelectItem>
                                        <SelectItem value="Delete">Delete</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                                <TableHead>{t('entityName')}</TableHead>
                                                <TableHead>{t('entityId')}</TableHead>
                                                <TableHead>{t('action')}</TableHead>
                                                <TableHead>{t('userId')}</TableHead>
                                                <TableHead>{t('ipAddress')}</TableHead>
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
                                                    <TableCell>{log.entityName}</TableCell>
                                                    <TableCell className="font-mono text-xs">
                                                        {log.entityId.substring(0, 8)}...
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={getActionBadgeVariant(
                                                                log.action
                                                            )}
                                                        >
                                                            {log.action}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">
                                                        {log.userId.substring(0, 8)}...
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">
                                                        {log.ipAddress || '-'}
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
                            <FileSearch className="h-5 w-5" />
                            {t('logDetails')}
                        </DialogTitle>
                        <DialogDescription>{t('logDetailsDescription')}</DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
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
                                        {t('action')}
                                    </p>
                                    <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                                        {selectedLog.action}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('entityName')}
                                    </p>
                                    <p className="text-base">{selectedLog.entityName}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('entityId')}
                                    </p>
                                    <p className="text-base font-mono text-xs">
                                        {selectedLog.entityId}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('userId')}
                                    </p>
                                    <p className="text-base font-mono text-xs">
                                        {selectedLog.userId}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('ipAddress')}
                                    </p>
                                    <p className="text-base font-mono text-xs">
                                        {selectedLog.ipAddress || '-'}
                                    </p>
                                </div>
                                {selectedLog.userAgent && (
                                    <div className="col-span-2">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('userAgent')}
                                        </p>
                                        <p className="text-base text-xs break-all">
                                            {selectedLog.userAgent}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {(selectedLog.oldValues || selectedLog.newValues) && (
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedLog.oldValues && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-2">
                                                {t('oldValues')}
                                            </p>
                                            <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-48">
                                                {(() => {
                                                    try {
                                                        return JSON.stringify(
                                                            JSON.parse(selectedLog.oldValues!),
                                                            null,
                                                            2
                                                        );
                                                    } catch {
                                                        return selectedLog.oldValues;
                                                    }
                                                })()}
                                            </pre>
                                        </div>
                                    )}
                                    {selectedLog.newValues && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-2">
                                                {t('newValues')}
                                            </p>
                                            <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-48">
                                                {(() => {
                                                    try {
                                                        return JSON.stringify(
                                                            JSON.parse(selectedLog.newValues!),
                                                            null,
                                                            2
                                                        );
                                                    } catch {
                                                        return selectedLog.newValues;
                                                    }
                                                })()}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

