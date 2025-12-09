'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { policiesService, PolicyListParams } from '@/services/policies.service';
import { useAuth } from '@/components/providers/auth-provider';
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
import { Eye, Search, Loader2, AlertCircle, Download, FileText } from 'lucide-react';
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
import { toast } from 'sonner';

export default function CustomerPoliciesPage() {
    const t = useTranslations('Policies');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const router = useRouter();
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Get customer's policies
    const { data, isLoading, error } = useQuery({
        queryKey: ['customer-policies', page, pageSize, search, statusFilter, user?.id],
        queryFn: () =>
            policiesService.getPolicies({
                page,
                pageSize,
                search: search || undefined,
                status: statusFilter === 'all' ? undefined : statusFilter,
                // TODO: Backend'de customerId filter'ı eklendiğinde kullanılacak
                // customerId: user?.id,
            }),
        enabled: !!user?.id,
    });

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            Active: { variant: 'default', label: t('statusActive') || 'Aktif' },
            PendingApproval: { variant: 'secondary', label: t('statusPending') || 'Onay Bekliyor' },
            Expired: { variant: 'destructive', label: t('statusExpired') || 'Süresi Dolmuş' },
            Cancelled: { variant: 'outline', label: t('statusCancelled') || 'İptal Edilmiş' },
            Draft: { variant: 'outline', label: t('statusDraft') || 'Taslak' },
        };

        const statusInfo = statusMap[status] || { variant: 'outline' as const, label: status };
        return (
            <Badge variant={statusInfo.variant}>
                {statusInfo.label}
            </Badge>
        );
    };

    const handleViewPolicy = (policyId: string) => {
        router.push(`/${locale}/customer/policies/${policyId}`);
    };

    const handleDownloadPolicy = async (policyId: string) => {
        try {
            // TODO: Implement PDF download when API is available
            toast.success(t('downloadStarted') || 'İndirme başlatıldı');
        } catch (error) {
            toast.error(t('downloadError') || 'İndirme sırasında hata oluştu');
        }
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
                        {t('loadError') || 'Poliçeler yüklenirken hata oluştu'}
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
                        <h1 className="text-2xl sm:text-3xl font-bold">{t('myPolicies') || 'Poliçelerim'}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('myPoliciesDescription') || 'Tüm poliçelerinizi görüntüleyin ve yönetin'}
                        </p>
                    </div>
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
                                    placeholder={t('searchPlaceholder') || 'Poliçe numarası, plaka veya müşteri adı ile ara...'}
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
                                    <SelectItem value="Active">{t('statusActive') || 'Aktif'}</SelectItem>
                                    <SelectItem value="PendingApproval">{t('statusPending') || 'Onay Bekliyor'}</SelectItem>
                                    <SelectItem value="Expired">{t('statusExpired') || 'Süresi Dolmuş'}</SelectItem>
                                    <SelectItem value="Cancelled">{t('statusCancelled') || 'İptal Edilmiş'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Policies Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('policyList') || 'Poliçe Listesi'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('policyNumber') || 'Poliçe No'}</TableHead>
                                        <TableHead>{t('policyType') || 'Poliçe Tipi'}</TableHead>
                                        <TableHead>{t('vehiclePlate') || 'Plaka'}</TableHead>
                                        <TableHead>{t('startDate') || 'Başlangıç'}</TableHead>
                                        <TableHead>{t('endDate') || 'Bitiş'}</TableHead>
                                        <TableHead>{t('premium') || 'Prim'}</TableHead>
                                        <TableHead>{t('status') || 'Durum'}</TableHead>
                                        <TableHead className="text-right">{tCommon('actions') || 'İşlemler'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.items && data.items.length > 0 ? (
                                        data.items.map((policy) => (
                                            <TableRow key={policy.id}>
                                                <TableCell className="font-medium">{policy.policyNumber}</TableCell>
                                                <TableCell>{policy.policyType}</TableCell>
                                                <TableCell>{policy.vehiclePlate || '-'}</TableCell>
                                                <TableCell>
                                                    {new Date(policy.startDate).toLocaleDateString(locale)}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(policy.endDate).toLocaleDateString(locale)}
                                                </TableCell>
                                                <TableCell>
                                                    {new Intl.NumberFormat(locale, {
                                                        style: 'currency',
                                                        currency: 'TRY',
                                                    }).format(policy.premium || 0)}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(policy.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleViewPolicy(policy.id)}
                                                            title={t('viewDetails') || 'Detayları Görüntüle'}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDownloadPolicy(policy.id)}
                                                            title={t('downloadPdf') || 'PDF İndir'}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-muted-foreground">
                                                        {t('noPolicies') || 'Henüz poliçe bulunmamaktadır.'}
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

