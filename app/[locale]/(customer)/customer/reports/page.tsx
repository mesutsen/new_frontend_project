'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { policiesService } from '@/services/policies.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
    FileBarChart,
    Download,
    Loader2,
    AlertCircle,
    Calendar,
    DollarSign,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChartCard } from '@/components/dashboard/chart-card';
import { toast } from 'sonner';

export default function CustomerReportsPage() {
    const t = useTranslations('Reports');
    const tCommon = useTranslations('Common');
    const locale = useLocale();

    const [dateFrom, setDateFrom] = useState(() => {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 1);
        return date.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

    // Get policies for report
    const { data: policiesData, isLoading } = useQuery({
        queryKey: ['customer-policies-report', dateFrom, dateTo],
        queryFn: () =>
            policiesService.getPolicies({
                page: 1,
                pageSize: 1000,
                from: dateFrom,
                to: dateTo,
            }),
    });

    const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
        try {
            // TODO: Implement export when API is available
            toast.success(t('exportSuccess') || 'Rapor indiriliyor...');
        } catch (error) {
            toast.error(t('exportError') || 'Rapor indirilirken hata oluştu');
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

    const totalPremium = policiesData?.items.reduce((sum, p) => sum + (p.premium || 0), 0) || 0;
    const activePolicies = policiesData?.items.filter((p) => p.status === 'Active').length || 0;
    const expiredPolicies = policiesData?.items.filter((p) => p.status === 'Expired').length || 0;

    const chartData = policiesData?.items.map((p) => ({
        name: new Date(p.startDate).toLocaleDateString(locale, { month: 'short', year: 'numeric' }),
        Premium: p.premium || 0,
    })) || [];

    return (
        <DashboardLayout>
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">{t('title') || 'Raporlar'}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('description') || 'Poliçe geçmişinizi ve istatistiklerinizi görüntüleyin'}
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                {tCommon('export') || 'Dışa Aktar'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport('csv')}>
                                {tCommon('exportCsv') || 'CSV'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('excel')}>
                                {tCommon('exportExcel') || 'Excel'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                {tCommon('exportPdf') || 'PDF'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Date Range Filter */}
                <Card>
                    <CardHeader>
                        <CardTitle>{tCommon('filterByDate') || 'Tarih Aralığı'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="dateFrom">{tCommon('dateFrom') || 'Başlangıç'}</Label>
                                <Input
                                    id="dateFrom"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="dateTo">{tCommon('dateTo') || 'Bitiş'}</Label>
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

                {/* Summary Cards */}
                <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('totalPremium') || 'Toplam Prim'}</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat(locale, {
                                    style: 'currency',
                                    currency: 'TRY',
                                }).format(totalPremium)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('totalPremiumDescription') || 'Seçili dönemdeki toplam prim'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('activePolicies') || 'Aktif Poliçeler'}
                            </CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activePolicies}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('activePoliciesDescription') || 'Aktif poliçe sayısı'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('expiredPolicies') || 'Süresi Dolmuş'}
                            </CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{expiredPolicies}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('expiredPoliciesDescription') || 'Süresi dolmuş poliçe sayısı'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Chart */}
                {chartData.length > 0 && (
                    <ChartCard
                        title={t('premiumTrend') || 'Prim Trendi'}
                        description={t('premiumTrendDescription') || 'Zaman içindeki prim değişimi'}
                        chartType="line"
                        labels={chartData.map((item) => item.name)}
                        data={chartData.map((item) => item.Premium)}
                    />
                )}

                {/* Policies Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('policyHistory') || 'Poliçe Geçmişi'}</CardTitle>
                        <CardDescription>
                            {t('policyHistoryDescription') || 'Seçili dönemdeki tüm poliçeler'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('policyNumber') || 'Poliçe No'}</TableHead>
                                        <TableHead>{t('policyType') || 'Tip'}</TableHead>
                                        <TableHead>{t('startDate') || 'Başlangıç'}</TableHead>
                                        <TableHead>{t('endDate') || 'Bitiş'}</TableHead>
                                        <TableHead>{t('premium') || 'Prim'}</TableHead>
                                        <TableHead>{t('status') || 'Durum'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {policiesData?.items && policiesData.items.length > 0 ? (
                                        policiesData.items.map((policy) => (
                                            <TableRow key={policy.id}>
                                                <TableCell className="font-medium">{policy.policyNumber}</TableCell>
                                                <TableCell>{policy.policyType}</TableCell>
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
                                                <TableCell>{policy.status}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-muted-foreground">
                                                        {t('noData') || 'Bu dönemde poliçe bulunmamaktadır.'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

