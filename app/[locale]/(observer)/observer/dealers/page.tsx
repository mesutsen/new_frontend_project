'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { observersService } from '@/services/observers.service';
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
import { Eye, Search, Loader2, AlertCircle, MapPin } from 'lucide-react';
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

export default function ObserverDealersPage() {
    const t = useTranslations('ObserverDealers');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'Active', 'Inactive'

    const { data, isLoading, error } = useQuery({
        queryKey: ['observer-dealers', page, pageSize, search, statusFilter],
        queryFn: () =>
            observersService.getDealers({
                page,
                pageSize,
                search: search || undefined,
                status: statusFilter === 'all' ? undefined : statusFilter,
            }),
    });

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge variant="default">{t('statusActive') || 'Aktif'}</Badge>
        ) : (
            <Badge variant="secondary">{t('statusInactive') || 'Pasif'}</Badge>
        );
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
                    {t('loadError') || 'Bayiler yüklenirken hata oluştu'}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-3 sm:space-y-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">{t('title') || 'Bayiler'}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('description') || 'Bağlı bayilerinizi görüntüleyin ve izleyin'}
                    </p>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>{tCommon('searchAndFilters') || 'Ara ve Filtrele'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder={t('searchPlaceholder') || 'Bayi adı veya kod ile ara...'}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('filterByStatus') || 'Duruma göre filtrele'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('allStatuses') || 'Tüm Durumlar'}</SelectItem>
                                    <SelectItem value="Active">{t('statusActive') || 'Aktif'}</SelectItem>
                                    <SelectItem value="Inactive">{t('statusInactive') || 'Pasif'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Dealers Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('dealerList') || 'Bayi Listesi'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('dealerName') || 'Bayi Adı'}</TableHead>
                                        <TableHead>{t('dealerCode') || 'Kod'}</TableHead>
                                        <TableHead>{t('email') || 'E-posta'}</TableHead>
                                        <TableHead>{t('phone') || 'Telefon'}</TableHead>
                                        <TableHead>{t('totalPolicies') || 'Toplam Poliçe'}</TableHead>
                                        <TableHead>{t('status') || 'Durum'}</TableHead>
                                        <TableHead className="text-right">{tCommon('actions') || 'İşlemler'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.items && data.items.length > 0 ? (
                                        data.items.map((dealer) => (
                                            <TableRow key={dealer.id}>
                                                <TableCell className="font-medium">{dealer.name}</TableCell>
                                                <TableCell>{dealer.code}</TableCell>
                                                <TableCell>{dealer.email || '-'}</TableCell>
                                                <TableCell>{dealer.phone || '-'}</TableCell>
                                                <TableCell>{dealer.stats?.totalPolicies || 0}</TableCell>
                                                <TableCell>{getStatusBadge(dealer.isActive)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => router.push(`/${locale}/observer/dealers/${dealer.id}`)}
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
                                                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-muted-foreground">
                                                        {t('noDealers') || 'Henüz bayi bulunmamaktadır.'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {data && Math.ceil(data.total / pageSize) > 1 && (
                            <div className="mt-4">
                                <Pagination
                                    currentPage={data.page}
                                    totalPages={Math.ceil(data.total / pageSize)}
                                    onPageChange={setPage}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
        </div>
    );
}

