'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { policiesService } from '@/services/policies.service';
import { customersService } from '@/services/customers.service';
import { vehiclesService } from '@/services/vehicles.service';
import { dealersService } from '@/services/dealers.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    FileText,
    Calendar,
    Loader2,
    AlertCircle,
    User,
    Car,
    Building2,
    DollarSign,
    Mail,
    Phone,
    Hash,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function PolicyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('Policies');
    const format = useFormatter();
    const id = params.id as string;

    const { data: policy, isLoading, error } = useQuery({
        queryKey: ['policy', id],
        queryFn: () => policiesService.getPolicyById(id),
        enabled: !!id,
    });

    // Customer bilgilerini çek
    const { data: customer } = useQuery({
        queryKey: ['customer', policy?.customerId],
        queryFn: () => customersService.getCustomerById(policy!.customerId),
        enabled: !!policy?.customerId,
    });

    // Vehicle bilgilerini çek
    const { data: vehicle } = useQuery({
        queryKey: ['vehicle', policy?.vehicleId],
        queryFn: () => vehiclesService.getVehicleById(policy!.vehicleId),
        enabled: !!policy?.vehicleId,
    });

    // Dealer bilgilerini çek (opsiyonel - hata durumunda sayfa çalışmaya devam eder)
    const { data: dealer, error: dealerError } = useQuery({
        queryKey: ['dealer', policy?.dealerId],
        queryFn: () => dealersService.getDealerById(policy!.dealerId),
        enabled: !!policy?.dealerId,
        retry: false,
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !policy) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('errorTitle')}</AlertTitle>
                    <AlertDescription>{t('errorDescription')}</AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'Active':
            case 'Approved':
                return 'default';
            case 'PendingApproval':
                return 'secondary';
            case 'Draft':
                return 'outline';
            case 'Rejected':
            case 'Cancelled':
            case 'Canceled':
                return 'destructive';
            case 'Expired':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    const formatCurrency = (amount: number) => {
        // Locale'e göre currency formatlaması
        const localeMap: Record<string, string> = {
            tr: 'tr-TR',
            en: 'en-US',
            bg: 'bg-BG',
        };
        return new Intl.NumberFormat(localeMap[locale] || 'tr-TR', {
            style: 'currency',
            currency: 'TRY',
        }).format(amount);
    };

    return (
        <DashboardLayout>
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/${locale}/admin/policies`)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">{policy.policyNumber}</h1>
                        <p className="text-sm text-muted-foreground">{t('policyDetails')}</p>
                    </div>
                </div>

                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    {/* Temel Bilgiler */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                {t('basicInfo')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('policyNumber')}
                                </p>
                                <p className="text-base font-semibold">{policy.policyNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('policyType')}
                                </p>
                                <p className="text-base">{policy.policyType}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('status')}</p>
                                <Badge variant={getStatusBadgeVariant(policy.status)} className="mt-1">
                                    {t(`status${policy.status}`)}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('premium')}
                                </p>
                                <p className="text-2xl font-bold">{formatCurrency(policy.premium)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Müşteri Bilgileri */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                {t('customerInfo')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('customerName')}
                                </p>
                                <p className="text-base font-semibold">{policy.customerName}</p>
                            </div>
                            {customer?.nationalId && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('nationalId')}
                                    </p>
                                    <p className="text-base">{customer.nationalId}</p>
                                </div>
                            )}
                            {customer?.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('email')}
                                        </p>
                                        <p className="text-base">{customer.email}</p>
                                    </div>
                                </div>
                            )}
                            {customer?.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('phone')}
                                        </p>
                                        <p className="text-base">{customer.phone}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Araç Bilgileri */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Car className="h-5 w-5" />
                                {t('vehicleInfo')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('vehiclePlate')}
                                </p>
                                <p className="text-base font-semibold">{policy.vehiclePlate}</p>
                            </div>
                            {vehicle?.brand && vehicle?.model && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('brandModel')}
                                    </p>
                                    <p className="text-base">
                                        {vehicle.brand} {vehicle.model}
                                    </p>
                                </div>
                            )}
                            {vehicle?.modelYear && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('modelYear')}
                                    </p>
                                    <p className="text-base">{vehicle.modelYear}</p>
                                </div>
                            )}
                            {vehicle?.vin && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('vin')}
                                    </p>
                                    <p className="text-base font-mono text-sm">{vehicle.vin}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bayi Bilgileri */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                {t('dealerInfo')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(dealer || dealerError) && (
                                <>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('dealerName')}
                                        </p>
                                        {dealerError ? (
                                            <p className="text-base font-semibold text-muted-foreground italic">
                                                {t('dealerNotFound') || 'Bayi bulunamadı'}
                                            </p>
                                        ) : (
                                            <p className="text-base font-semibold">{dealer?.name || '-'}</p>
                                        )}
                                    </div>
                                    {dealer && (
                                        <>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    {t('dealerCode')}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                                    <p className="text-base">{dealer.code}</p>
                                                </div>
                                            </div>
                                            {dealer.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">
                                                            {t('email')}
                                                        </p>
                                                        <p className="text-base">{dealer.email}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {dealer.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">
                                                            {t('phone')}
                                                        </p>
                                                        <p className="text-base">{dealer.phone}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                            <div className="pt-2 border-t">
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('dealerCommission')}
                                </p>
                                <p className="text-base font-semibold">
                                    {formatCurrency(policy.dealerCommission)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('observerCommission')}
                                </p>
                                <p className="text-base font-semibold">
                                    {formatCurrency(policy.observerCommission)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tarih Bilgileri */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                {t('dateInfo')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('issueDate')}
                                </p>
                                <p className="text-base">
                                    {format.dateTime(new Date(policy.issueDate), {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('startDate')}
                                </p>
                                <p className="text-base">
                                    {format.dateTime(new Date(policy.startDate), {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('endDate')}
                                </p>
                                <p className="text-base">
                                    {format.dateTime(new Date(policy.endDate), {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('createdAt')}
                                </p>
                                <p className="text-base">
                                    {format.dateTime(new Date(policy.createdAt), {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('updatedAt')}
                                </p>
                                <p className="text-base">
                                    {format.dateTime(new Date(policy.updatedAt), {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Finansal Bilgiler */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                {t('financialInfo')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Fiyat Detayları */}
                            <div className="space-y-2 pb-3 border-b">
                                {/* Base Price ve Taxes hesaplama (premium'dan geriye doğru) */}
                                {(() => {
                                    // Premium = BasePrice + Taxes olduğunu varsayıyoruz
                                    // Genellikle %18 KDV ile: Premium = BasePrice * 1.18
                                    // BasePrice = Premium / 1.18, Taxes = Premium - BasePrice
                                    const estimatedTaxRate = 0.18; // %18 KDV varsayımı
                                    const estimatedBasePrice = policy.premium / (1 + estimatedTaxRate);
                                    const estimatedTaxes = policy.premium - estimatedBasePrice;
                                    
                                    return (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm text-muted-foreground">
                                                    {t('basePrice') || 'Temel Fiyat'}
                                                </p>
                                                <p className="text-base font-medium">
                                                    {formatCurrency(estimatedBasePrice)}
                                                </p>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm text-muted-foreground">
                                                    {t('taxes') || 'Vergiler (KDV %18)'}
                                                </p>
                                                <p className="text-base font-medium">
                                                    {formatCurrency(estimatedTaxes)}
                                                </p>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                            
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('premium') || 'Toplam Prim'}
                                </p>
                                <p className="text-2xl font-bold">{formatCurrency(policy.premium)}</p>
                            </div>
                            
                            <div className="pt-2 border-t space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    {t('commissions') || 'Komisyonlar'}
                                </p>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('dealerCommission')}
                                    </p>
                                    <p className="text-xl font-semibold">
                                        {formatCurrency(policy.dealerCommission)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('observerCommission')}
                                    </p>
                                    <p className="text-xl font-semibold">
                                        {formatCurrency(policy.observerCommission)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

