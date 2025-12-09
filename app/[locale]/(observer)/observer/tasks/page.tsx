'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { observersService } from '@/services/observers.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Clock,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Calendar,
    User,
    Filter,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Pagination } from '@/components/pagination';

export default function ObserverTasksPage() {
    const t = useTranslations('ObserverTasks');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const format = useFormatter();
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);

    const { data: tasksData, isLoading, error } = useQuery({
        queryKey: ['observer-tasks', statusFilter, page, pageSize],
        queryFn: () =>
            observersService.getTasks({
                status: statusFilter === 'all' ? undefined : statusFilter,
                page,
                pageSize,
            }),
    });

    const tasks = tasksData?.items || [];

    // Status filter değiştiğinde sayfayı 1'e resetle
    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value);
        setPage(1);
    };

    const updateTaskStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: 'Pending' | 'InProgress' | 'Completed' }) =>
            observersService.updateTaskStatus(taskId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['observer-tasks'] });
            toast.success(t('updateSuccess') || 'Görev durumu güncellendi');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || t('updateError') || 'Görev durumu güncellenirken hata oluştu');
        },
    });

    const handleStatusUpdate = (taskId: string, newStatus: 'Pending' | 'InProgress' | 'Completed') => {
        updateTaskStatusMutation.mutate({ taskId, status: newStatus });
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            Pending: { variant: 'secondary', label: t('statusPending') || 'Beklemede' },
            InProgress: { variant: 'default', label: t('statusInProgress') || 'Devam Ediyor' },
            Completed: { variant: 'outline', label: t('statusCompleted') || 'Tamamlandı' },
        };
        const statusInfo = statusMap[status] || { variant: 'outline' as const, label: status };
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
    };

    const getPriorityBadge = (priority: string) => {
        const priorityMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            Low: { variant: 'outline', label: t('priorityLow') || 'Düşük' },
            Medium: { variant: 'secondary', label: t('priorityMedium') || 'Orta' },
            High: { variant: 'destructive', label: t('priorityHigh') || 'Yüksek' },
        };
        const priorityInfo = priorityMap[priority] || { variant: 'outline' as const, label: priority };
        return <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{tCommon('errorTitle') || 'Hata'}</AlertTitle>
                <AlertDescription>
                    {t('loadError') || 'Görevler yüklenirken hata oluştu'}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                            <Clock className="h-8 w-8" />
                            {t('title') || 'Görevler'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('description') || 'Size atanan görevleri görüntüleyin ve yönetin'}
                        </p>
                    </div>
                    <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder={t('filterByStatus') || 'Duruma göre filtrele'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('allStatuses') || 'Tüm Durumlar'}</SelectItem>
                            <SelectItem value="Pending">{t('statusPending') || 'Beklemede'}</SelectItem>
                            <SelectItem value="InProgress">{t('statusInProgress') || 'Devam Ediyor'}</SelectItem>
                            <SelectItem value="Completed">{t('statusCompleted') || 'Tamamlandı'}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Tasks Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('taskList') || 'Görev Listesi'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('title') || 'Başlık'}</TableHead>
                                        <TableHead>{t('description') || 'Açıklama'}</TableHead>
                                        <TableHead>{t('priority') || 'Öncelik'}</TableHead>
                                        <TableHead>{t('status') || 'Durum'}</TableHead>
                                        <TableHead>{t('assignedBy') || 'Atayan'}</TableHead>
                                        <TableHead>{t('dueDate') || 'Bitiş Tarihi'}</TableHead>
                                        <TableHead className="text-right">{tCommon('actions') || 'İşlemler'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks && tasks.length > 0 ? (
                                        tasks.map((task) => (
                                            <TableRow key={task.id}>
                                                <TableCell className="font-medium">{task.title}</TableCell>
                                                <TableCell className="max-w-md truncate">
                                                    {task.description}
                                                </TableCell>
                                                <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                                                <TableCell>{getStatusBadge(task.status)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        {task.createdByUserName || task.assignedBy || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {task.dueDate ? (
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4" />
                                                            {format.dateTime(new Date(task.dueDate), {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            })}
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {task.status !== 'Completed' && (
                                                        <div className="flex justify-end gap-2">
                                                            {task.status === 'Pending' && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleStatusUpdate(task.id, 'InProgress')
                                                                    }
                                                                    disabled={updateTaskStatusMutation.isPending}
                                                                >
                                                                    {t('startTask') || 'Başlat'}
                                                                </Button>
                                                            )}
                                                            {task.status === 'InProgress' && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleStatusUpdate(task.id, 'Completed')
                                                                    }
                                                                    disabled={updateTaskStatusMutation.isPending}
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                                                    {t('completeTask') || 'Tamamla'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Clock className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-muted-foreground">
                                                        {t('noTasks') || 'Henüz görev bulunmamaktadır.'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {tasksData && tasksData.totalPages && tasksData.totalPages > 1 && (
                            <div className="mt-4 flex justify-center">
                                <Pagination
                                    currentPage={page}
                                    totalPages={tasksData.totalPages}
                                    onPageChange={setPage}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
        </div>
    );
}

