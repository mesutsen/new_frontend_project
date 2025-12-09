'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { supportService } from '@/services/support.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Eye, Search, Loader2, AlertCircle, Plus, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/pagination';

export default function CustomerTicketsPage() {
    const t = useTranslations('Support');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { data, isLoading, error } = useQuery({
        queryKey: ['customer-tickets', page, pageSize, search, statusFilter],
        queryFn: () =>
            supportService.getTickets({
                page,
                pageSize,
                search: search || undefined,
                status: statusFilter === 'all' ? undefined : statusFilter,
            }),
    });

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            Open: { variant: 'default', label: t('statusOpen') || 'Açık' },
            InProgress: { variant: 'secondary', label: t('statusInProgress') || 'İşlemde' },
            Resolved: { variant: 'outline', label: t('statusResolved') || 'Çözüldü' },
            Closed: { variant: 'outline', label: t('statusClosed') || 'Kapalı' },
        };

        const statusInfo = statusMap[status] || { variant: 'outline' as const, label: status };
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
    };

    const getPriorityBadge = (priority: string) => {
        const priorityMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            Low: { variant: 'outline', label: t('priorityLow') || 'Düşük' },
            Medium: { variant: 'secondary', label: t('priorityMedium') || 'Orta' },
            High: { variant: 'default', label: t('priorityHigh') || 'Yüksek' },
            Urgent: { variant: 'destructive', label: t('priorityUrgent') || 'Acil' },
        };

        const priorityInfo = priorityMap[priority] || { variant: 'outline' as const, label: priority };
        return <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>;
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{tCommon('errorTitle') || 'Hata'}</AlertTitle>
                    <AlertDescription>
                        {t('loadError') || 'Talepler yüklenirken hata oluştu'}
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">{t('myTickets') || 'Taleplerim'}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('myTicketsDescription') || 'Tüm destek taleplerinizi görüntüleyin'}
                        </p>
                    </div>
                    <Button onClick={() => router.push(`/${locale}/customer/support`)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('createTicket') || 'Yeni Talep'}
                    </Button>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>{tCommon('searchAndFilters') || 'Ara ve Filtrele'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder={t('searchPlaceholder') || 'Konu veya mesaj ile ara...'}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder={t('filterByStatus') || 'Duruma göre filtrele'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('allStatuses') || 'Tüm Durumlar'}</SelectItem>
                                    <SelectItem value="Open">{t('statusOpen') || 'Açık'}</SelectItem>
                                    <SelectItem value="InProgress">{t('statusInProgress') || 'İşlemde'}</SelectItem>
                                    <SelectItem value="Resolved">{t('statusResolved') || 'Çözüldü'}</SelectItem>
                                    <SelectItem value="Closed">{t('statusClosed') || 'Kapalı'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Tickets Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('ticketList') || 'Talep Listesi'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('ticketNumber') || 'Talep No'}</TableHead>
                                        <TableHead>{t('subject') || 'Konu'}</TableHead>
                                        <TableHead>{t('category') || 'Kategori'}</TableHead>
                                        <TableHead>{t('priority') || 'Öncelik'}</TableHead>
                                        <TableHead>{t('status') || 'Durum'}</TableHead>
                                        <TableHead>{t('createdAt') || 'Oluşturulma'}</TableHead>
                                        <TableHead className="text-right">{tCommon('actions') || 'İşlemler'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.items && data.items.length > 0 ? (
                                        data.items.map((ticket) => (
                                            <TableRow key={ticket.id}>
                                                <TableCell className="font-medium">#{ticket.id.slice(0, 8)}</TableCell>
                                                <TableCell>{ticket.subject}</TableCell>
                                                <TableCell>{ticket.category}</TableCell>
                                                <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                                                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                                <TableCell>
                                                    {new Date(ticket.createdAt).toLocaleDateString(locale)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => router.push(`/${locale}/customer/support/tickets/${ticket.id}`)}
                                                        title={t('viewDetails') || 'Detayları Görüntüle'}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-muted-foreground">
                                                        {t('noTickets') || 'Henüz talep bulunmamaktadır.'}
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
        </DashboardLayout>
    );
}

