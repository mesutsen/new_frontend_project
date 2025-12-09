'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { vehiclesService } from '@/services/vehicles.service';
import { customersService } from '@/services/customers.service';
import { dealersService } from '@/services/dealers.service';
import { policiesService } from '@/services/policies.service';
import type { PolicyDto } from '@/types/policy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, ArrowLeft, Loader2, AlertCircle, FileText, Eye, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';

export default function VehicleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('Vehicles');
    const tCustomers = useTranslations('Customers');
    const tPolicies = useTranslations('Policies');
    const id = params.id as string;

    const { data: vehicle, isLoading, error } = useQuery({
        queryKey: ['vehicle', id],
        queryFn: () => vehiclesService.getVehicleById(id),
        enabled: !!id,
    });

    const { data: customer } = useQuery({
        queryKey: ['customer', vehicle?.customerId],
        queryFn: () => customersService.getCustomerById(vehicle!.customerId),
        enabled: !!vehicle?.customerId,
    });

    const { data: dealer } = useQuery({
        queryKey: ['dealer', customer?.dealerId],
        queryFn: () => dealersService.getDealerById(customer!.dealerId),
        enabled: !!customer?.dealerId,
    });

    const { data: policiesData, isLoading: policiesLoading } = useQuery({
        queryKey: ['policies', 'vehicle', id],
        queryFn: () => policiesService.getPolicies({ vehicleId: id, page: 1, pageSize: 100 }),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !vehicle) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Hata</AlertTitle>
                    <AlertDescription>
                        {error ? 'Araç bilgileri yüklenirken bir hata oluştu.' : 'Araç bulunamadı.'}
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/${locale}/admin/vehicles`)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">{vehicle.plateNumber}</h1>
                            <p className="text-muted-foreground">{t('description')}</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/${locale}/admin/vehicles/${id}/edit`)}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        {t('editTitle')}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Araç Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('formPlateNumber')}</p>
                                <p className="font-medium text-lg">{vehicle.plateNumber}</p>
                            </div>
                            {vehicle.brand && (
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('formBrand')}</p>
                                    <p className="font-medium">{vehicle.brand}</p>
                                </div>
                            )}
                            {vehicle.model && (
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('formModel')}</p>
                                <p className="font-medium">{vehicle.model}</p>
                                </div>
                            )}
                            {vehicle.modelYear && (
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('formModelYear')}</p>
                                    <p className="font-medium">{vehicle.modelYear}</p>
                                </div>
                            )}
                            {vehicle.vin && (
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('formVin')}</p>
                                    <p className="font-mono text-sm">{vehicle.vin}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-muted-foreground">Durum</p>
                                <Badge variant={vehicle.isActive ? 'default' : 'secondary'}>
                                    {vehicle.isActive ? 'Aktif' : 'Pasif'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Müşteri Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {customer ? (
                                <>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{tCustomers('fullName')}</p>
                                        <Button
                                            variant="link"
                                            className="p-0 h-auto font-medium"
                                            onClick={() =>
                                                router.push(`/${locale}/admin/customers/${customer.id}`)
                                            }
                                        >
                                            {customer.firstName} {customer.lastName}
                                        </Button>
                                    </div>
                                    {customer.email && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">{tCustomers('email')}</p>
                                            <p className="font-medium">{customer.email}</p>
                                        </div>
                                    )}
                                    {customer.phone && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">{tCustomers('phone')}</p>
                                            <p className="font-medium">{customer.phone}</p>
                                        </div>
                                    )}
                                    {dealer && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Bayi</p>
                                            <p className="font-medium">{dealer.name} ({dealer.code})</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-muted-foreground">Müşteri bilgisi yükleniyor...</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{tPolicies('title') || 'Poliçeler'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {policiesLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : policiesData?.items && policiesData.items.length > 0 ? (
                            <div className="space-y-4">
                                {policiesData.items.map((policy: PolicyDto) => (
                                    <div
                                        key={policy.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">
                                                        <Button
                                                            variant="link"
                                                            className="p-0 h-auto"
                                                            onClick={() =>
                                                                router.push(`/${locale}/admin/policies/${policy.id}`)
                                                            }
                                                        >
                                                            {policy.policyNumber || '-'}
                                                        </Button>
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {policy.policyType} •{' '}
                                                        {new Date(policy.startDate).toLocaleDateString('tr-TR')} -{' '}
                                                        {new Date(policy.endDate).toLocaleDateString('tr-TR')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant={
                                                    policy.status === 'Approved' || policy.status === 'Active'
                                                        ? 'default'
                                                        : policy.status === 'Rejected' ||
                                                          policy.status === 'Cancelled'
                                                        ? 'destructive'
                                                        : 'secondary'
                                                }
                                            >
                                                {policy.status}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    router.push(`/${locale}/admin/policies/${policy.id}`)
                                                }
                                                title="Görüntüle"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">
                                Bu araç için poliçe bulunamadı.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Yüklenmiş Belgeler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {vehicle.registrationImageUrl ? (() => {
                            // Backend URL'ini tam URL'e çevir
                            const imageUrl = vehicle.registrationImageUrl.startsWith('http') 
                                ? vehicle.registrationImageUrl 
                                : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://5.245.250.23:5000'}${vehicle.registrationImageUrl}`;
                            
                            return (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">Ruhsat Belgesi</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {vehicle.registrationImageUrl.split('/').pop() || 'Belge'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(imageUrl, '_blank')}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Görüntüle
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = imageUrl;
                                                    link.download = `ruhsat-${vehicle.plateNumber}.jpg`;
                                                    link.click();
                                                }}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                İndir
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="relative w-full h-64 border rounded-md overflow-hidden">
                                        <Image
                                            src={imageUrl}
                                            alt={`${vehicle.plateNumber} ruhsat belgesi`}
                                            fill
                                            className="object-contain"
                                            unoptimized
                                        />
                                    </div>
                                </div>
                            );
                        })() : (
                            <p className="text-muted-foreground text-center py-8">
                                Bu araç için yüklenmiş belge bulunmamaktadır.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

