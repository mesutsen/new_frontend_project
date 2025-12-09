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
    Download,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function CustomerPolicyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('Policies');
    const tCommon = useTranslations('Common');
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

    const handleDownloadPdf = async () => {
        try {
            // TODO: Implement PDF download when API is available
            toast.success(t('downloadStarted') || 'PDF indirme başlatıldı');
        } catch (error) {
            toast.error(t('downloadError') || 'PDF indirme sırasında hata oluştu');
        }
    };

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
                    <AlertTitle>{t('errorTitle') || 'Hata'}</AlertTitle>
                    <AlertDescription>
                        {t('errorDescription') || 'Poliçe bilgileri yüklenirken hata oluştu'}
                    </AlertDescription>
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
        return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : locale === 'en' ? 'en-US' : 'bg-BG', {
            style: 'currency',
            currency: 'TRY',
        }).format(amount);
    };

    return (
        <DashboardLayout>
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/${locale}/customer/policies`)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">{policy.policyNumber}</h1>
                            <p className="text-sm text-muted-foreground">
                                {t('policyDetails') || 'Poliçe Detayları'}
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleDownloadPdf} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        {t('downloadPdf') || 'PDF İndir'}
                    </Button>
                </div>

                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    {/* Temel Bilgiler */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                {t('basicInfo') || 'Temel Bilgiler'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('policyNumber') || 'Poliçe Numarası'}
                                </p>
                                <p className="text-base font-semibold">{policy.policyNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('policyType') || 'Poliçe Tipi'}
                                </p>
                                <p className="text-base">{policy.policyType}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('status') || 'Durum'}
                                </p>
                                <Badge variant={getStatusBadgeVariant(policy.status)}>
                                    {policy.status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('startDate') || 'Başlangıç Tarihi'}
                                </p>
                                <p className="text-base">
                                    {format.dateTime(new Date(policy.startDate), {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('endDate') || 'Bitiş Tarihi'}
                                </p>
                                <p className="text-base">
                                    {format.dateTime(new Date(policy.endDate), {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
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
                                {t('financialInfo') || 'Finansal Bilgiler'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('premium') || 'Prim'}
                                </p>
                                <p className="text-2xl font-bold">{formatCurrency(policy.premium || 0)}</p>
                            </div>
                            {policy.dealerCommission && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('dealerCommission') || 'Bayi Komisyonu'}
                                    </p>
                                    <p className="text-xl font-semibold">
                                        {formatCurrency(policy.dealerCommission)}
                                    </p>
                                </div>
                            )}
                            {policy.observerCommission && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('observerCommission') || 'Gözlemci Komisyonu'}
                                    </p>
                                    <p className="text-xl font-semibold">
                                        {formatCurrency(policy.observerCommission)}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Müşteri Bilgileri */}
                    {customer && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    {t('customerInfo') || 'Müşteri Bilgileri'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('customerName') || 'Ad Soyad'}
                                    </p>
                                    <p className="text-base">
                                        {customer.firstName} {customer.lastName}
                                    </p>
                                </div>
                                {customer.email && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('email') || 'E-posta'}
                                        </p>
                                        <p className="text-base">{customer.email}</p>
                                    </div>
                                )}
                                {customer.phone && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('phone') || 'Telefon'}
                                        </p>
                                        <p className="text-base">{customer.phone}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Araç Bilgileri */}
                    {vehicle && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Car className="h-5 w-5" />
                                    {t('vehicleInfo') || 'Araç Bilgileri'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('plateNumber') || 'Plaka'}
                                    </p>
                                    <p className="text-base font-semibold">{vehicle.plateNumber}</p>
                                </div>
                                {vehicle.brand && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('brand') || 'Marka'}
                                        </p>
                                        <p className="text-base">{vehicle.brand}</p>
                                    </div>
                                )}
                                {vehicle.model && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('model') || 'Model'}
                                        </p>
                                        <p className="text-base">{vehicle.model}</p>
                                    </div>
                                )}
                                {vehicle.modelYear && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('year') || 'Yıl'}
                                        </p>
                                        <p className="text-base">{vehicle.modelYear}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Bayi Bilgileri */}
                    {(dealer || dealerError) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    {t('dealerInfo') || 'Bayi Bilgileri'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('dealerName') || 'Bayi Adı'}
                                    </p>
                                    {dealerError ? (
                                        <p className="text-base text-muted-foreground italic">
                                            {t('dealerNotFound') || 'Bayi bulunamadı'}
                                        </p>
                                    ) : (
                                        <p className="text-base">{dealer?.name || '-'}</p>
                                    )}
                                </div>
                                {dealer && dealer.code && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('dealerCode') || 'Bayi Kodu'}
                                        </p>
                                        <p className="text-base">{dealer.code}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

