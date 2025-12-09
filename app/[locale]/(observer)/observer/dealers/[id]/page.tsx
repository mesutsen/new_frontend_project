'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { observersService } from '@/services/observers.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    User,
    Mail,
    Phone,
    FileText,
    TrendingUp,
    Calendar,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ObserverDealerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('ObserverDealers');
    const tCommon = useTranslations('Common');
    const format = useFormatter();
    const id = params.id as string;

    const { data: dealer, isLoading, error } = useQuery({
        queryKey: ['observer-dealer', id],
        queryFn: () => observersService.getDealerById(id),
        enabled: !!id,
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
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !dealer) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{tCommon('errorTitle') || 'Hata'}</AlertTitle>
                <AlertDescription>
                    {t('loadError') || 'Bayi bilgileri yüklenirken hata oluştu'}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/${locale}/observer/dealers`)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">{dealer.name}</h1>
                        <p className="text-sm text-muted-foreground">{dealer.code}</p>
                    </div>
                </div>

                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    {/* Contact Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                {t('contactInfo') || 'İletişim Bilgileri'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {dealer.email && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {t('email') || 'E-posta'}
                                    </p>
                                    <p className="text-base">{dealer.email}</p>
                                </div>
                            )}
                            {dealer.phone && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        {t('phone') || 'Telefon'}
                                    </p>
                                    <p className="text-base">{dealer.phone}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('status') || 'Durum'}
                                </p>
                                <div className="mt-1">{getStatusBadge(dealer.isActive)}</div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {t('createdAt') || 'Oluşturulma'}
                                </p>
                                <p className="text-base">
                                    {format.dateTime(new Date(dealer.createdAt), {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statistics */}
                    {dealer.stats && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    {t('statistics') || 'İstatistikler'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('totalPolicies') || 'Toplam Poliçe'}
                                    </p>
                                    <p className="text-2xl font-bold">{dealer.stats.totalPolicies}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('activePolicies') || 'Aktif Poliçe'}
                                    </p>
                                    <p className="text-xl font-semibold">{dealer.stats.activePolicies}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        {t('monthlyIssued') || 'Bu Ay Çıkarılan'}
                                    </p>
                                    <p className="text-xl font-semibold">{dealer.stats.monthlyIssued}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
        </div>
    );
}
