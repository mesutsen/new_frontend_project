'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { claimsService } from '@/services/claims.service';
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

export default function CustomerClaimsPage() {
    const t = useTranslations('Claims');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { data, isLoading, error } = useQuery({
        queryKey: ['customer-claims', page, pageSize, search, statusFilter],
        queryFn: () =>
            claimsService.getClaims({
                page,
                pageSize,
                search: search || undefined,
                status: statusFilter === 'all' ? undefined : statusFilter,
            }),
    });

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            Pending: { variant: 'secondary', label: t('statusPending') || 'Beklemede' },
            InReview: { variant: 'default', label: t('statusInReview') || 'İnceleniyor' },
            Approved: { variant: 'default', label: t('statusApproved') || 'Onaylandı' },
            Rejected: { variant: 'destructive', label: t('statusRejected') || 'Reddedildi' },
            Closed: { variant: 'outline', label: t('statusClosed') || 'Kapalı' },
        };
        const statusInfo = statusMap[status] || { variant: 'outline' as const, label: status };
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
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
                        {t('loadError') || 'Hasar kayıtları yüklenirken hata oluştu'}
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
                        <h1 className="text-2xl sm:text-3xl font-bold">{t('myClaims') || 'Hasar Kayıtlarım'}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('myClaimsDescription') || 'Tüm hasar kayıtlarınızı görüntüleyin'}
                        </p>
                    </div>
                    <Button onClick={() => router.push(`/${locale}/customer/claims/new`)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('reportClaim') || 'Hasar Bildir'}
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
                                    placeholder={t('searchPlaceholder') || 'Hasar kaydı ara...'}
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
                                    <SelectItem value="Pending">{t('statusPending') || 'Beklemede'}</SelectItem>
                                    <SelectItem value="InReview">{t('statusInReview') || 'İnceleniyor'}</SelectItem>
                                    <SelectItem value="Approved">{t('statusApproved') || 'Onaylandı'}</SelectItem>
                                    <SelectItem value="Rejected">{t('statusRejected') || 'Reddedildi'}</SelectItem>
                                    <SelectItem value="Closed">{t('statusClosed') || 'Kapalı'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Claims Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('claimList') || 'Hasar Kayıtları'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('claimNumber') || 'Hasar No'}</TableHead>
                                        <TableHead>{t('claimType') || 'Hasar Tipi'}</TableHead>
                                        <TableHead>{t('claimDate') || 'Hasar Tarihi'}</TableHead>
                                        <TableHead>{t('estimatedDamage') || 'Tahmini Hasar'}</TableHead>
                                        <TableHead>{t('status') || 'Durum'}</TableHead>
                                        <TableHead>{t('createdAt') || 'Oluşturulma'}</TableHead>
                                        <TableHead className="text-right">{tCommon('actions') || 'İşlemler'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.items && data.items.length > 0 ? (
                                        data.items.map((claim) => (
                                            <TableRow key={claim.id}>
                                                <TableCell className="font-medium">#{claim.id.slice(0, 8)}</TableCell>
                                                <TableCell>{claim.claimType}</TableCell>
                                                <TableCell>
                                                    {new Date(claim.claimDate).toLocaleDateString(locale)}
                                                </TableCell>
                                                <TableCell>
                                                    {claim.estimatedDamage
                                                        ? new Intl.NumberFormat(locale, {
                                                              style: 'currency',
                                                              currency: 'TRY',
                                                          }).format(claim.estimatedDamage)
                                                        : '-'}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(claim.status)}</TableCell>
                                                <TableCell>
                                                    {new Date(claim.createdAt).toLocaleDateString(locale)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => router.push(`/${locale}/customer/claims/${claim.id}`)}
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
                                                        {t('noClaims') || 'Henüz hasar kaydı bulunmamaktadır.'}
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

