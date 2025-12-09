'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { dashboardService } from '@/services/dashboard.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    FileText,
    TrendingUp,
    AlertCircle,
    DollarSign,
    Car,
    Plus,
    Eye,
    Calendar,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Loader2 } from 'lucide-react';

export default function DealerDashboardPage() {
    const t = useTranslations('DealerDashboard');
    const router = useRouter();
    const locale = useLocale();

    const { data: dashboard, isLoading } = useQuery({
        queryKey: ['dealer-dashboard'],
        queryFn: async () => {
            const data = await dashboardService.getDealerDashboard();
            return {
                totalCustomers: data.customers || 0,
                activePolicies: data.activePolicies || 0,
                totalPolicies: data.totalPolicies || 0,
                expiringSoon: data.expiringSoon || 0,
                totalRevenue: data.totalRevenue || 0,
                monthlyCommission: data.monthlyCommission || 0,
                pendingTasks: data.pendingTasks || 0,
                satisfactionRate: data.satisfactionRate || 0,
                renewalRate: data.renewalRate || 0,
                thisMonthPolicies: data.thisMonthPolicies || 0,
            };
        },
        staleTime: 60000,
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'expired':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'cancelled':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const mainStats = [
        {
            title: t('totalCustomers'),
            value: dashboard?.totalCustomers ?? 0,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            description: t('totalCustomersDesc'),
            trend: '+12%',
        },
        {
            title: t('activePolicies'),
            value: dashboard?.activePolicies ?? 0,
            icon: FileText,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            description: t('activePoliciesDesc'),
            trend: '+8%',
        },
        {
            title: t('totalRevenue'),
            value: `₺${(dashboard?.totalRevenue ?? 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            description: t('totalRevenueDesc'),
            trend: '+15%',
        },
        {
            title: t('monthlyCommission'),
            value: `₺${(dashboard?.monthlyCommission ?? 0).toLocaleString()}`,
            icon: TrendingUp,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            description: t('monthlyCommissionDesc'),
            trend: '+5%',
        },
    ];

    const performanceStats = [
        {
            title: t('pendingTasks'),
            value: dashboard?.pendingTasks ?? 0,
            icon: AlertCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            description: t('pendingTasksDesc'),
        },
        {
            title: t('satisfactionRate'),
            value: `%${dashboard?.satisfactionRate ?? 0}`,
            icon: Eye,
            color: 'text-teal-600',
            bgColor: 'bg-teal-50',
            description: t('satisfactionRateDesc'),
        },
        {
            title: t('renewalRate'),
            value: `%${dashboard?.renewalRate ?? 0}`,
            icon: Calendar,
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-50',
            description: t('renewalRateDesc'),
        },
        {
            title: t('thisMonthPolicies'),
            value: dashboard?.thisMonthPolicies ?? 0,
            icon: Car,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            description: t('thisMonthPoliciesDesc'),
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{t('title')}</h1>
                        <p className="text-muted-foreground mt-1">
                            {t('description')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/${locale}/dealer/customers/new`)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('newCustomer')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/${locale}/dealer/policies/new`)}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            {t('newPolicy')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/${locale}/dealer/reports`)}
                        >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            {t('reports')}
                        </Button>
                    </div>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {mainStats.map((stat) => (
                        <Card key={stat.title}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {stat.title}
                                        </p>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <h3 className="text-2xl font-bold">{stat.value}</h3>
                                            <Badge variant="secondary" className="text-xs">
                                                {stat.trend}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {stat.description}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {performanceStats.map((stat) => (
                        <Card key={stat.title}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {stat.title}
                                        </p>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <h3 className="text-2xl font-bold">{stat.value}</h3>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {stat.description}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('quickActions')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="h-20 flex-col gap-2"
                                onClick={() => router.push(`/${locale}/dealer/customers/new`)}
                            >
                                <Users className="h-6 w-6" />
                                <span className="text-sm">{t('addCustomer')}</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-20 flex-col gap-2"
                                onClick={() => router.push(`/${locale}/dealer/policies/new`)}
                            >
                                <Plus className="h-6 w-6" />
                                <span className="text-sm">{t('newPolicy')}</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-20 flex-col gap-2"
                                onClick={() => router.push(`/${locale}/dealer/customers/new`)}
                            >
                                <Car className="h-6 w-6" />
                                <span className="text-sm">{t('addVehicle')}</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-20 flex-col gap-2"
                                onClick={() => router.push(`/${locale}/dealer/payments`)}
                            >
                                <DollarSign className="h-6 w-6" />
                                <span className="text-sm">{t('payments')}</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

