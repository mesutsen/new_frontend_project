'use client';

import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useTranslations } from 'next-intl';
import { dashboardService } from '@/services/dashboard.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    FileText,
    Clock,
    Users,
    Building2,
    Car,
    Loader2,
    AlertCircle,
    TrendingUp,
    DollarSign,
    RefreshCw,
    Server,
    Activity,
    Shield,
    Database,
    Globe,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChartCard } from '@/components/dashboard/chart-card';
import { useAuth } from '@/components/providers/auth-provider';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

function StatCard({ title, value, icon: Icon, iconColor = 'text-primary', trend }: StatCardProps) {
    return (
        <Card className="relative overflow-hidden transition-all hover:shadow-sm">
            <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Icon className={`h-4 w-4 ${iconColor} shrink-0`} />
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                                {title}
                            </p>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold leading-tight">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                        </p>
                        {trend && (
                            <p
                                className={`text-[10px] sm:text-xs flex items-center gap-1 mt-1 ${
                                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                                }`}
                            >
                                <span>{trend.isPositive ? '↑' : '↓'}</span>
                                {Math.abs(trend.value)}%
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function SuperAdminDashboard() {
    const t = useTranslations('Dashboard');
    const { user } = useAuth();

    // Super Admin dashboard ana verileri
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: () => dashboardService.getAdminDashboard(),
        refetchInterval: 30000, // 30 saniyede bir yenile
    });

    // KPI istatistikleri
    const {
        data: statsData,
        isLoading: statsLoading,
        error: statsError,
    } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => dashboardService.getStats(),
        refetchInterval: 30000,
    });

    // Grafik verileri
    const {
        data: chartsData,
        isLoading: chartsLoading,
        error: chartsError,
    } = useQuery({
        queryKey: ['dashboard-charts', 'admin'],
        queryFn: () => dashboardService.getCharts('admin'),
        refetchInterval: 30000,
    });

    // Sistem durumu (mock - gerçek API endpoint'i eklenecek)
    const { data: systemStatus } = useQuery({
        queryKey: ['system-status'],
        queryFn: async () => {
            // TODO: Gerçek API endpoint'i eklenecek
            return {
                server: 'healthy',
                database: 'connected',
                api: 'operational',
                activeUsers: 0,
            };
        },
        refetchInterval: 60000, // 1 dakikada bir yenile
    });

    const isLoadingAll = isLoading || statsLoading || chartsLoading;
    const hasError = error || statsError || chartsError;

    if (isLoadingAll) {
        return (
            <DashboardLayout>
                <div className="space-y-3 sm:space-y-4">
                    <div className="mb-2">
                        <h1 className="text-2xl sm:text-3xl font-bold">Super Admin Dashboard</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Sistem genel bakış ve yönetim paneli
                        </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                        {[...Array(5)].map((_, i) => (
                            <Card key={i} className="p-3 sm:p-4">
                                <div className="flex items-center justify-center h-16 sm:h-20">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (hasError && !data) {
        return (
            <DashboardLayout>
                <div className="space-y-3 sm:space-y-4">
                    <div className="mb-2">
                        <h1 className="text-2xl sm:text-3xl font-bold">Super Admin Dashboard</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Sistem genel bakış ve yönetim paneli
                        </p>
                    </div>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-sm">Hata</AlertTitle>
                        <AlertDescription className="text-xs sm:text-sm">
                            Veriler yüklenirken bir hata oluştu.
                            <button
                                onClick={() => refetch()}
                                className="ml-2 underline font-medium"
                            >
                                Tekrar Dene
                            </button>
                        </AlertDescription>
                    </Alert>
                </div>
            </DashboardLayout>
        );
    }

    const stats = [
        {
            title: t('totalPolicies'),
            value: data?.totalPolicies ?? 0,
            icon: FileText,
            iconColor: 'text-blue-500',
        },
        {
            title: t('pendingApprovals'),
            value: data?.pendingApprovals ?? 0,
            icon: Clock,
            iconColor: 'text-amber-500',
        },
        {
            title: t('dealers'),
            value: data?.dealers ?? 0,
            icon: Building2,
            iconColor: 'text-purple-500',
        },
        {
            title: t('customers'),
            value: data?.customers ?? 0,
            icon: Users,
            iconColor: 'text-green-500',
        },
        {
            title: t('vehicles'),
            value: data?.vehicles ?? 0,
            icon: Car,
            iconColor: 'text-orange-500',
        },
    ];

    // Sistem durumu kartları
    const systemStatusCards = [
        {
            title: 'Sunucu Durumu',
            value: systemStatus?.server === 'healthy' ? 'Sağlıklı' : 'Sorunlu',
            icon: Server,
            iconColor: systemStatus?.server === 'healthy' ? 'text-green-500' : 'text-red-500',
        },
        {
            title: 'Veritabanı',
            value: systemStatus?.database === 'connected' ? 'Bağlı' : 'Bağlantı Yok',
            icon: Database,
            iconColor: systemStatus?.database === 'connected' ? 'text-green-500' : 'text-red-500',
        },
        {
            title: 'API Servis',
            value: systemStatus?.api === 'operational' ? 'Çalışıyor' : 'Durduruldu',
            icon: Globe,
            iconColor: systemStatus?.api === 'operational' ? 'text-green-500' : 'text-red-500',
        },
        {
            title: 'Aktif Kullanıcılar',
            value: systemStatus?.activeUsers ?? 0,
            icon: Activity,
            iconColor: 'text-blue-500',
        },
    ];

    // KPI istatistikleri için ikon ve renk eşleştirmesi
    const getKpiIcon = (key: string) => {
        switch (key) {
            case 'conversion':
                return TrendingUp;
            case 'avgPremium':
                return DollarSign;
            case 'renewalRate':
                return RefreshCw;
            default:
                return TrendingUp;
        }
    };

    const getKpiColor = (key: string) => {
        switch (key) {
            case 'conversion':
                return 'text-blue-500';
            case 'avgPremium':
                return 'text-green-500';
            case 'renewalRate':
                return 'text-purple-500';
            default:
                return 'text-primary';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-3 sm:space-y-4">
                <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Shield className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl sm:text-3xl font-bold">Super Admin Dashboard</h1>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Sistem genel bakış ve yönetim paneli
                    </p>
                </div>

                {/* Sistem Durumu */}
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Sistem Durumu</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        {systemStatusCards.map((stat, index) => (
                            <StatCard
                                key={index}
                                title={stat.title}
                                value={stat.value}
                                icon={stat.icon}
                                iconColor={stat.iconColor}
                            />
                        ))}
                    </div>
                </div>

                {/* Ana İstatistikler */}
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Genel İstatistikler</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                        {stats.map((stat, index) => (
                            <StatCard
                                key={index}
                                title={stat.title}
                                value={stat.value}
                                icon={stat.icon}
                                iconColor={stat.iconColor}
                            />
                        ))}
                    </div>
                </div>

                {/* KPI İstatistikleri */}
                {statsData && statsData.length > 0 && (
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{t('kpiTitle')}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                            {statsData.map((kpi) => {
                                const Icon = getKpiIcon(kpi.key);
                                const iconColor = getKpiColor(kpi.key);
                                return (
                                    <StatCard
                                        key={kpi.key}
                                        title={t(`kpi.${kpi.key}`)}
                                        value={`${kpi.value.toLocaleString()} ${kpi.unit}`}
                                        icon={Icon}
                                        iconColor={iconColor}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Grafikler */}
                {chartsData && chartsData.series && chartsData.series.length > 0 && (
                    <div className="space-y-2 sm:space-y-3">
                        <h2 className="text-lg sm:text-xl font-semibold">{t('chartsTitle')}</h2>
                        <div className="grid gap-2 sm:gap-3 md:grid-cols-1 lg:grid-cols-2">
                            {/* Poliçe Sayısı Grafiği */}
                            {chartsData.series.find(s => s.name === 'Poliçe Sayısı') && (
                                <ChartCard
                                    title={t('policyChartTitle')}
                                    series={[chartsData.series.find(s => s.name === 'Poliçe Sayısı')!]}
                                    type="line"
                                    height={300}
                                />
                            )}
                            {/* Prim Tutarı Grafiği */}
                            {chartsData.series.find(s => s.name === 'Prim Tutarı') && (
                                <ChartCard
                                    title={t('premiumChartTitle')}
                                    series={[chartsData.series.find(s => s.name === 'Prim Tutarı')!]}
                                    type="bar"
                                    height={300}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Hata mesajları (eğer varsa ama veri de varsa) */}
                {hasError && data && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Kısmi Hata</AlertTitle>
                        <AlertDescription>
                            Bazı veriler yüklenirken hata oluştu, ancak mevcut veriler gösteriliyor.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </DashboardLayout>
    );
}

