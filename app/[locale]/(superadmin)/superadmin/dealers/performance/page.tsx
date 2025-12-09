'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartCard } from '@/components/dashboard/chart-card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Users, DollarSign, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useQuery } from '@tanstack/react-query';
import { dealersService } from '@/services/dealers.service';

export default function DealerPerformancePage() {
    const t = useTranslations('DealerPerformance');
    const tCommon = useTranslations('Common');

    const { data, isLoading } = useQuery({
        queryKey: ['dealer-performance'],
        queryFn: () => dealersService.getPerformance(),
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!data) {
        return (
            <DashboardLayout>
                <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                    {tCommon('noData')}
                </div>
            </DashboardLayout>
        );
    }

    // Debug logging
    console.log('Dealer Performance Data:', data);

    const stats = data.stats || {};
    const charts = data.charts || { premiumProduction: [], policyCount: [] };
    const rankings = data.rankings || [];

    const performanceStats = [
        {
            title: 'totalPremium',
            value: `₺${(stats.totalPremium || 0).toLocaleString()}`,
            change: '+12%', // Mock change
            icon: DollarSign,
            color: 'text-green-500',
        },
        {
            title: 'activeDealers',
            value: (stats.activeDealers || 0).toString(),
            change: '+3', // Mock change
            icon: Users,
            color: 'text-blue-500',
        },
        {
            title: 'avgGrowth',
            value: `${stats.avgGrowth || 0}%`,
            change: '+2.1%', // Mock change
            icon: TrendingUp,
            color: 'text-purple-500',
        },
        {
            title: 'topPerformer',
            value: stats.topPerformer || '-',
            change: '₺450k', // Mock change
            icon: Trophy,
            color: 'text-amber-500',
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground">
                        {t('description')}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {performanceStats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={index}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {t(stat.title)}
                                    </CardTitle>
                                    <Icon className={`h-4 w-4 ${stat.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <p className="text-xs text-muted-foreground">
                                        <span className={stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}>
                                            {stat.change}
                                        </span>{' '}
                                        {t('fromLastMonth')}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Charts */}
                <div className="grid gap-4 md:grid-cols-2">
                    <ChartCard
                        title={t('monthlyPremiumProduction')}
                        series={[{ name: 'Premium', points: charts.premiumProduction || [] }]}
                        type="bar"
                    />
                    <ChartCard
                        title={t('policyIssuanceTrend')}
                        series={[{ name: 'Policies', points: charts.policyCount || [] }]}
                        type="line"
                    />
                </div>

                {/* Detailed Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('dealerRankings')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('dealerName')}</TableHead>
                                    <TableHead>{t('region')}</TableHead>
                                    <TableHead className="text-right">{t('policiesIssued')}</TableHead>
                                    <TableHead className="text-right">{t('totalPremium')} (₺)</TableHead>
                                    <TableHead className="text-right">{t('growth')} (%)</TableHead>
                                    <TableHead className="text-center">{t('status')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rankings.map((dealer) => (
                                    <TableRow key={dealer.id}>
                                        <TableCell className="font-medium">{dealer.name}</TableCell>
                                        <TableCell>{dealer.region}</TableCell>
                                        <TableCell className="text-right">{dealer.policies}</TableCell>
                                        <TableCell className="text-right">{dealer.premium.toLocaleString()}</TableCell>
                                        <TableCell className={`text-right ${dealer.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {dealer.growth > 0 ? '+' : ''}{dealer.growth}%
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={dealer.status === 'High' ? 'default' : dealer.status === 'Medium' ? 'secondary' : 'destructive'}>
                                                {t(dealer.status.toLowerCase())}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
