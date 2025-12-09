'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { observersService } from '@/services/observers.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
    FileText,
    TrendingUp,
    AlertCircle,
    DollarSign,
    Activity,
    Loader2,
} from 'lucide-react';
import { ChartCard } from '@/components/dashboard/chart-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ObserverDashboardPage() {
    const t = useTranslations('ObserverDashboard');
    const tCommon = useTranslations('Common');
    const locale = useLocale();

    const { data: dashboard, isLoading, error } = useQuery({
        queryKey: ['observer-dashboard'],
        queryFn: () => observersService.getDashboard(),
        staleTime: 60000, // 1 dakika
    });

    // Get dealers for chart data
    const { data: dealersData } = useQuery({
        queryKey: ['observer-dealers-for-chart'],
        queryFn: () => observersService.getDealers({ page: 1, pageSize: 100 }),
        enabled: !!dashboard,
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
                    {t('loadError') || 'Dashboard verileri yüklenirken hata oluştu'}
                </AlertDescription>
            </Alert>
        );
    }

    // Backend'den gelen veri yapısına göre mapping
    const stats = dashboard
        ? {
              totalDealers: dashboard.observedDealers,
              activeDealers: dashboard.activeDealers,
              totalProduction: 0, // Backend'den gelmiyor, hesaplanabilir
              thisMonthProduction: 0, // Backend'den gelmiyor, hesaplanabilir
              pendingTasks: 0, // Backend'den gelmiyor
              activeDealerRate:
                  dashboard.observedDealers > 0
                      ? (dashboard.activeDealers / dashboard.observedDealers) * 100
                      : 0,
          }
        : {
              totalDealers: 0,
              activeDealers: 0,
              totalProduction: 0,
              thisMonthProduction: 0,
              pendingTasks: 0,
              activeDealerRate: 0,
          };

    // Prepare chart data
    const dealerProductionData =
        dealersData?.items.map((dealer) => ({
            name: dealer.name,
            value: dealer.stats?.monthlyIssued || 0,
        })) || [];

    const monthlyTrendData = [
        { name: 'Ocak', value: 0 },
        { name: 'Şubat', value: 0 },
        { name: 'Mart', value: 0 },
        { name: 'Nisan', value: 0 },
        { name: 'Mayıs', value: 0 },
        { name: 'Haziran', value: 0 },
    ];

    return (
        <div className="space-y-2 sm:space-y-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">
                        {t('title') || 'Gözlemci Paneli'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('description') || 'Bağlı bayilerinizin genel bakışı'}
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('totalDealers') || 'Toplam Bayiler'}
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalDealers}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('totalDealersDesc') || 'Bağlı toplam bayi sayısı'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('activeDealers') || 'Aktif Bayiler'}
                            </CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeDealers}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('activeDealersDesc') || 'Aktif bayi sayısı'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('totalPolicies') || 'Toplam Poliçeler'}
                            </CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboard?.totalPolicies || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('totalPoliciesDesc') || 'Bağlı bayilerin toplam poliçe sayısı'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid gap-2 sm:gap-3 md:grid-cols-2">
                    {dealerProductionData.length > 0 && (
                        <ChartCard
                            title={t('dealerProductionDistribution') || 'Bayi Üretim Dağılımı'}
                            description={t('dealerProductionDistributionDesc') || 'Bayi bazlı üretim dağılımı'}
                            chartType="pie"
                            labels={dealerProductionData.map((item) => item.name)}
                            data={dealerProductionData.map((item) => item.value)}
                        />
                    )}

                    <ChartCard
                        title={t('monthlySalesTrend') || 'Aylık Satış Trendi'}
                        description={t('monthlySalesTrendDesc') || 'Aylık satış grafiği'}
                        chartType="line"
                        labels={monthlyTrendData.map((item) => item.name)}
                        data={monthlyTrendData.map((item) => item.value)}
                    />
                </div>
        </div>
    );
}

