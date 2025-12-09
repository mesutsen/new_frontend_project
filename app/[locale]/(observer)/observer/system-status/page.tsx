'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Server,
    Database,
    Activity,
    Globe,
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SystemStatus {
    server: 'healthy' | 'degraded' | 'down';
    database: 'connected' | 'disconnected';
    api: 'operational' | 'slow' | 'down';
    activeUsers: number;
}

export default function ObserverSystemStatusPage() {
    const t = useTranslations('ObserverSystemStatus');
    const tCommon = useTranslations('Common');

    const { data: systemStatus, isLoading, error } = useQuery<SystemStatus>({
        queryKey: ['observer-system-status'],
        queryFn: async () => {
            // TODO: Gerçek API endpoint'i eklenecek
            return {
                server: 'healthy' as const,
                database: 'connected' as const,
                api: 'operational' as const,
                activeUsers: 0,
            };
        },
        refetchInterval: 60000, // 1 dakikada bir yenile
    });

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive'; icon: any; label: string }> = {
            healthy: {
                variant: 'default',
                icon: CheckCircle2,
                label: t('statusHealthy') || 'Sağlıklı',
            },
            degraded: {
                variant: 'secondary',
                icon: AlertCircle,
                label: t('statusDegraded') || 'Düşük Performans',
            },
            down: {
                variant: 'destructive',
                icon: XCircle,
                label: t('statusDown') || 'Çalışmıyor',
            },
            connected: {
                variant: 'default',
                icon: CheckCircle2,
                label: t('statusConnected') || 'Bağlı',
            },
            disconnected: {
                variant: 'destructive',
                icon: XCircle,
                label: t('statusDisconnected') || 'Bağlantı Yok',
            },
            operational: {
                variant: 'default',
                icon: CheckCircle2,
                label: t('statusOperational') || 'Çalışıyor',
            },
            slow: {
                variant: 'secondary',
                icon: AlertCircle,
                label: t('statusSlow') || 'Yavaş',
            },
        };
        const statusInfo = statusMap[status] || {
            variant: 'outline' as const,
            icon: AlertCircle,
            label: status,
        };
        const Icon = statusInfo.icon;
        return (
            <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {statusInfo.label}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !systemStatus) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{tCommon('errorTitle') || 'Hata'}</AlertTitle>
                <AlertDescription>
                    {t('loadError') || 'Sistem durumu yüklenirken hata oluştu'}
                </AlertDescription>
            </Alert>
        );
    }

    const statusCards = [
        {
            title: t('serverStatus') || 'Sunucu Durumu',
            status: systemStatus.server,
            icon: Server,
            description: t('serverStatusDesc') || 'Backend sunucu durumu',
        },
        {
            title: t('databaseStatus') || 'Veritabanı Durumu',
            status: systemStatus.database,
            icon: Database,
            description: t('databaseStatusDesc') || 'Veritabanı bağlantı durumu',
        },
        {
            title: t('apiStatus') || 'API Durumu',
            status: systemStatus.api,
            icon: Globe,
            description: t('apiStatusDesc') || 'API servis durumu',
        },
        {
            title: t('activeUsers') || 'Aktif Kullanıcılar',
            status: 'operational',
            icon: Activity,
            description: t('activeUsersDesc') || 'Şu anda aktif kullanıcı sayısı',
            value: systemStatus.activeUsers,
        },
    ];

    return (
        <div className="space-y-3 sm:space-y-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Server className="h-8 w-8" />
                        {t('title') || 'Sistem Durumu'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('description') || 'Sistem bileşenlerinin durumunu görüntüleyin'}
                    </p>
                </div>

                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    {statusCards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <Card key={index}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    {card.value !== undefined ? (
                                        <div className="text-2xl font-bold">{card.value}</div>
                                    ) : (
                                        <div className="mt-2">{getStatusBadge(card.status)}</div>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
        </div>
    );
}

