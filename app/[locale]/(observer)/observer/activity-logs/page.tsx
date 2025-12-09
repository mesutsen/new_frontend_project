'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { observersService } from '@/services/observers.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Search, Loader2, AlertCircle, Calendar, User, Activity } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/pagination';

export default function ObserverActivityLogsPage() {
    const t = useTranslations('ObserverActivityLogs');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const format = useFormatter();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [search, setSearch] = useState('');
    const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

    const { data, isLoading, error } = useQuery({
        queryKey: [
            'observer-activity-logs',
            page,
            pageSize,
            search,
            actionTypeFilter,
            dateFrom,
            dateTo,
        ],
        queryFn: () =>
            observersService.getActivityLogs({
                page,
                pageSize,
                actionType: actionTypeFilter === 'all' ? undefined : actionTypeFilter,
                dateFrom,
                dateTo,
            }),
    });

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
                    {t('loadError') || 'Aktivite logları yüklenirken hata oluştu'}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-3 sm:space-y-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Activity className="h-8 w-8" />
                        {t('title') || 'Aktivite Logları'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('description') || 'Bağlı bayilerin sistem üzerindeki hareketlerini takip edin'}
                    </p>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>{tCommon('searchAndFilters') || 'Ara ve Filtrele'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder={t('searchPlaceholder') || 'Ara...'}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('filterByActionType') || 'İşlem Tipi'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('allActionTypes') || 'Tüm Tipler'}</SelectItem>
                                    <SelectItem value="Create">{t('actionCreate') || 'Oluşturma'}</SelectItem>
                                    <SelectItem value="Update">{t('actionUpdate') || 'Güncelleme'}</SelectItem>
                                    <SelectItem value="Delete">{t('actionDelete') || 'Silme'}</SelectItem>
                                    <SelectItem value="View">{t('actionView') || 'Görüntüleme'}</SelectItem>
                                </SelectContent>
                            </Select>
                            <div>
                                <Label htmlFor="dateFrom" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {tCommon('dateFrom') || 'Başlangıç'}
                                </Label>
                                <Input
                                    id="dateFrom"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="dateTo" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {tCommon('dateTo') || 'Bitiş'}
                                </Label>
                                <Input
                                    id="dateTo"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Activity Logs Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('activityLogList') || 'Aktivite Log Listesi'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('action') || 'İşlem'}</TableHead>
                                        <TableHead>{t('description') || 'Açıklama'}</TableHead>
                                        <TableHead>{t('user') || 'Kullanıcı'}</TableHead>
                                        <TableHead>{t('timestamp') || 'Tarih'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.items && data.items.length > 0 ? (
                                        data.items.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium">{log.action}</TableCell>
                                                <TableCell>{log.description}</TableCell>
                                                <TableCell>
                                                    {log.userName ? (
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4" />
                                                            {log.userName}
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {format.dateTime(new Date(log.timestamp), {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Activity className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-muted-foreground">
                                                        {t('noLogs') || 'Henüz aktivite logu bulunmamaktadır.'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {data && data.totalPages > 1 && (
                            <div className="mt-4">
                                <Pagination
                                    currentPage={data.page}
                                    totalPages={data.totalPages}
                                    onPageChange={setPage}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
        </div>
    );
}

