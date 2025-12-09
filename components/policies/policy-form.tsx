'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { policiesService, CreatePolicyRequest, UpdatePolicyRequest } from '@/services/policies.service';
import { dealersService } from '@/services/dealers.service';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, AlertCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PolicyDto } from '@/types/policy';
import { useAuth } from '@/components/providers/auth-provider';
import { customersService } from '@/services/customers.service';
import { vehiclesService } from '@/services/vehicles.service';
import { VehicleForm } from '@/components/vehicles/vehicle-form';
import { pricingPlansService } from '@/services/pricing-plans.service';
import { policySeriesService } from '@/services/policy-series.service';
import { policyTypesService } from '@/services/policy-types.service';
import { priceListsService } from '@/services/price-lists.service';
import { currenciesService } from '@/services/currencies.service';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

// Customer ve Vehicle için basit interface'ler
interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    nationalId?: string;
    fullName?: string; // Backward compatibility
    tcKimlik?: string; // Backward compatibility
}

interface Vehicle {
    id: string;
    plateNumber: string;
    brand?: string;
    model?: string;
}

const policySchema = z.object({
    dealerId: z.string().min(1, 'Dealer is required'),
    customerId: z.string().min(1, 'Customer is required'),
    vehicleId: z.string().min(1, 'Vehicle is required'),
    policyType: z.string().min(1, 'Policy type is required'),
    currencyId: z.string().optional().nullable(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    durationDays: z.number().int().min(1).max(365).optional().nullable(),
    premium: z.number().min(0, 'Premium must be positive').optional(),
}).refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
}, {
    message: 'End date must be after start date',
    path: ['endDate'],
});

type PolicyFormValues = z.infer<typeof policySchema>;

interface PolicyFormProps {
    dealerId?: string; // Dealer için otomatik set edilecek
    policy?: PolicyDto | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function PolicyForm({ dealerId: propDealerId, policy, onSuccess, onCancel }: PolicyFormProps) {
    const t = useTranslations('Policies');
    const tCommon = useTranslations('Common');
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);

    // Kullanıcının rolünü kontrol et
    const isDealer = user?.roles?.some(role => role.toLowerCase() === 'dealer');
    const isAdmin = user?.roles?.some(role => role.toLowerCase() === 'admin' || role.toLowerCase() === 'superadmin');

    const form = useForm<PolicyFormValues>({
        resolver: zodResolver(policySchema),
        defaultValues: {
            dealerId: propDealerId || policy?.dealerId || '',
            customerId: policy?.customerId || '',
            vehicleId: policy?.vehicleId || '',
            policyType: policy?.policyType || '',
            startDate: policy?.startDate ? policy.startDate.split('T')[0] : '',
            endDate: policy?.endDate ? policy.endDate.split('T')[0] : '',
            durationDays: undefined,
            premium: policy?.premium,
        },
    });

    // DealerId prop'u varsa ve form'da yoksa set et
    useEffect(() => {
        if (propDealerId && !form.getValues('dealerId')) {
            form.setValue('dealerId', propDealerId);
        }
    }, [propDealerId, form]);

    // Dealer rolü için mevcut dealer'ı al
    const { data: currentDealer } = useQuery({
        queryKey: ['current-dealer'],
        queryFn: () => dealersService.getCurrentDealer(),
        enabled: isDealer && !propDealerId && !policy?.dealerId,
        retry: false,
    });

    // Dealer rolü için mevcut dealer'ı form'a set et
    useEffect(() => {
        if (isDealer && currentDealer?.id && !form.getValues('dealerId')) {
            form.setValue('dealerId', currentDealer.id);
        }
    }, [isDealer, currentDealer, form]);

    const selectedDealerId = form.watch('dealerId');
    const selectedCustomerId = form.watch('customerId');
    const selectedVehicleId = form.watch('vehicleId');
    const selectedPolicyType = form.watch('policyType');
    const selectedStartDate = form.watch('startDate');
    const selectedEndDate = form.watch('endDate');
    const selectedDurationDays = form.watch('durationDays');

    // Aktif seriyi getir (pricing plan için)
    const { data: activeSeries } = useQuery({
        queryKey: ['active-series', selectedDealerId],
        queryFn: () => policySeriesService.getActiveSeriesByDealer(selectedDealerId),
        enabled: !!selectedDealerId,
        retry: false,
    });

    // Aktif poliçe türlerini getir
    const { data: policyTypes } = useQuery({
        queryKey: ['policy-types-active'],
        queryFn: () => policyTypesService.getActive(),
    });

    // Aktif para birimlerini çek
    const { data: currencies } = useQuery({
        queryKey: ['currencies', 'active'],
        queryFn: () => currenciesService.getActive(),
    });

    // Varsayılan para birimini çek
    const { data: defaultCurrency } = useQuery({
        queryKey: ['currencies', 'default'],
        queryFn: () => currenciesService.getDefault(),
    });

    // Seçilen policy type'ın ID'sini bul
    const selectedPolicyTypeEntity = policyTypes?.find(
        pt => pt.code === selectedPolicyType || pt.name === selectedPolicyType
    );

    // Price list bilgilerini getir (min-max için) - yeni sistem
    const { data: priceList } = useQuery({
        queryKey: ['price-list', selectedPolicyTypeEntity?.id, selectedStartDate],
        queryFn: async () => {
            if (!selectedPolicyTypeEntity?.id || !selectedStartDate) return null;
            try {
                return await priceListsService.getActiveForDate(
                    selectedPolicyTypeEntity.id,
                    new Date(selectedStartDate).toISOString()
                );
            } catch (error: any) {
                // 404 veya başka hata durumunda null döndür
                if (error.response?.status === 404 || error.response?.status === 400) {
                    return null;
                }
                throw error;
            }
        },
        enabled: !!selectedPolicyTypeEntity?.id && !!selectedStartDate,
        retry: false,
    });

    // Süre seçimine göre endDate'i otomatik hesapla
    useEffect(() => {
        if (selectedDurationDays && selectedStartDate && !policy) {
            const start = new Date(selectedStartDate);
            const end = new Date(start);
            end.setDate(end.getDate() + selectedDurationDays);
            form.setValue('endDate', end.toISOString().split('T')[0]);
        }
    }, [selectedDurationDays, selectedStartDate, policy, form]);

    // Fiyat hesaplama
    const { data: calculatedPrice, isLoading: isCalculatingPrice } = useQuery({
        queryKey: ['calculate-price', selectedCustomerId, selectedVehicleId, selectedPolicyType, selectedStartDate, selectedEndDate, selectedDurationDays],
        queryFn: async () => {
            if (!selectedCustomerId || !selectedVehicleId || !selectedPolicyType || !selectedStartDate || !selectedEndDate) return null;
            return await pricingPlansService.calculatePrice({
                customerId: selectedCustomerId,
                vehicleId: selectedVehicleId,
                policyType: selectedPolicyType,
                currency: 'TRY',
                startDate: new Date(selectedStartDate).toISOString(),
                endDate: new Date(selectedEndDate).toISOString(),
                durationDays: selectedDurationDays ?? undefined,
            });
        },
        enabled: !!selectedCustomerId && !!selectedVehicleId && !!selectedPolicyType && !!selectedStartDate && !!selectedEndDate && !policy,
        retry: false,
    });

    // Hesaplanan fiyat varsa form'a set et
    useEffect(() => {
        if (calculatedPrice && !policy && !form.getValues('premium')) {
            form.setValue('premium', calculatedPrice.total);
        }
    }, [calculatedPrice, policy, form]);

    // Dealers listesi (sadece Admin/SuperAdmin için)
    const { data: dealersData } = useQuery({
        queryKey: ['dealers', { page: 1, pageSize: 100 }],
        queryFn: () => dealersService.getDealers({ page: 1, pageSize: 100 }),
        enabled: !!isAdmin, // Sadece Admin/SuperAdmin için
    });

    // Customers listesi (dealer seçildiğinde)
    const { data: customersData } = useQuery({
        queryKey: ['customers', selectedDealerId],
        queryFn: () => customersService.getCustomersByDealer(selectedDealerId, {
            page: 1,
            pageSize: 100,
        }),
        enabled: !!selectedDealerId,
    });

    // Vehicles listesi (customer seçildiğinde)
    const { data: vehiclesData } = useQuery({
        queryKey: ['vehicles', selectedCustomerId],
        queryFn: async () => {
            if (!selectedCustomerId) return { items: [] };
            const response = await api.get(`/vehicles/customer/${selectedCustomerId}`, {
                params: { page: 1, pageSize: 100 },
            });
            return response.data;
        },
        enabled: !!selectedCustomerId,
    });

    // Customer değiştiğinde vehicle'ı sıfırla
    const handleCustomerChange = (customerId: string) => {
        form.setValue('customerId', customerId);
        form.setValue('vehicleId', '');
    };

    // Dealer değiştiğinde customer ve vehicle'ı sıfırla
    const handleDealerChange = (dealerId: string) => {
        form.setValue('dealerId', dealerId);
        form.setValue('customerId', '');
        form.setValue('vehicleId', '');
    };

    const createMutation = useMutation({
        mutationFn: (data: CreatePolicyRequest) => policiesService.createPolicy(data),
        onSuccess: () => {
            toast.success(t('createSuccess'));
            queryClient.invalidateQueries({ queryKey: ['policies'] });
            onSuccess();
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message || t('createError');
            const errorCode = error.response?.data?.code;
            
            // Poliçe serisi bulunamadı hatası için özel mesaj
            if (errorCode === 'NO_ACTIVE_SERIES' || errorMessage.includes('aktif poliçe serisi') || errorMessage.includes('poliçe serisi')) {
                toast.error(t('noActiveSeriesError'), {
                    description: t('noActiveSeriesDescription'),
                    duration: 8000,
                });
            } 
            // Policy type bulunamadı hatası için özel mesaj
            else if (errorCode === 'POLICY_TYPE_NOT_FOUND' || errorMessage.includes('Poliçe türü') || errorMessage.includes('policy type') || errorMessage.includes('tanımlı değil')) {
                toast.error(t('policyTypeNotFoundError') || 'Poliçe Türü Bulunamadı', {
                    description: errorMessage,
                    duration: 8000,
                });
            } 
            else {
                toast.error(errorMessage, {
                    duration: 8000,
                });
            }
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; payload: UpdatePolicyRequest }) =>
            policiesService.updatePolicy(data.id, data.payload),
        onSuccess: () => {
            toast.success(t('updateSuccess'));
            queryClient.invalidateQueries({ queryKey: ['policies'] });
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('updateError'));
        },
    });

    const onSubmit = async (data: PolicyFormValues) => {
        if (policy) {
            updateMutation.mutate({
                id: policy.id,
                payload: {
                    policyType: data.policyType,
                    startDate: new Date(data.startDate).toISOString(),
                    endDate: new Date(data.endDate).toISOString(),
                },
            });
        } else {
            // Yeni poliçe oluşturulurken aktif seri kontrolü
            if (!activeSeries) {
                // Aktif seri yoksa kullanıcıyı bilgilendir
                // Backend otomatik olarak seri oluşturmaya çalışacak
                toast.info(t('noActiveSeriesInfo') || 'Aktif poliçe serisi bulunamadı. Sistem otomatik olarak yeni seri oluşturmaya çalışacak...', {
                    duration: 5000,
                });
            }
            
            createMutation.mutate({
                dealerId: data.dealerId,
                customerId: data.customerId,
                vehicleId: data.vehicleId,
                policyType: data.policyType,
                currencyId: data.currencyId || undefined,
                startDate: new Date(data.startDate).toISOString(),
                endDate: new Date(data.endDate).toISOString(),
                durationDays: data.durationDays ?? undefined,
                premium: data.premium,
            });
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Aktif seri uyarısı - yeni poliçe oluşturulurken ve aktif seri yoksa */}
                {!policy && selectedDealerId && !activeSeries && (
                    <Alert variant="default" className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertTitle className="text-amber-800 dark:text-amber-200">
                            {t('noActiveSeriesWarning') || 'Aktif Poliçe Serisi Bulunamadı'}
                        </AlertTitle>
                        <AlertDescription className="text-amber-700 dark:text-amber-300">
                            {t('noActiveSeriesWarningDescription') || 'Bu bayi için aktif poliçe serisi bulunmamaktadır. Sistem otomatik olarak yeni seri oluşturmaya çalışacaktır.'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Temel Bilgiler */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <h3 className="text-lg font-semibold">Temel Bilgiler</h3>
                    </div>
                
                {/* Dealer dropdown - sadece Admin/SuperAdmin için göster */}
                {isAdmin && (
                    <FormField
                        control={form.control}
                        name="dealerId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formDealer')}</FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        handleDealerChange(value);
                                    }}
                                    value={field.value}
                                    disabled={isLoading || !!policy}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('formDealerPlaceholder')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {dealersData?.items.map((dealer) => (
                                            <SelectItem key={dealer.id} value={dealer.id}>
                                                {dealer.name} ({dealer.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Dealer rolü için sadece dealer bilgisi göster */}
                {isDealer && currentDealer && (
                    <FormItem>
                        <FormLabel>{t('formDealer')}</FormLabel>
                        <Input
                            value={`${currentDealer.name} (${currentDealer.code})`}
                            disabled
                            className="bg-muted"
                        />
                        <FormDescription>
                            {t('formDealerDescription') || 'Mevcut bayi bilgisi'}
                        </FormDescription>
                    </FormItem>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="customerId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formCustomer')}</FormLabel>
                            <Select
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    handleCustomerChange(value);
                                }}
                                value={field.value}
                                disabled={isLoading || !!policy || !selectedDealerId}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('formCustomerPlaceholder')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {customersData?.items?.map((customer: Customer) => {
                                        const fullName = customer.fullName || `${customer.firstName} ${customer.lastName}`;
                                        const nationalId = customer.tcKimlik || customer.nationalId;
                                        return (
                                            <SelectItem key={customer.id} value={customer.id}>
                                                {fullName} {nationalId ? `(${nationalId})` : ''}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {!selectedDealerId && t('formCustomerDescription')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                        control={form.control}
                        name="vehicleId"
                        render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>{t('formVehicle')}</FormLabel>
                                {selectedCustomerId && !policy && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsVehicleDialogOpen(true)}
                                        disabled={isLoading}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t('addVehicle')}
                                    </Button>
                                )}
                            </div>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isLoading || !!policy || !selectedCustomerId}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('formVehiclePlaceholder')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {vehiclesData?.items?.map((vehicle: Vehicle) => (
                                        <SelectItem key={vehicle.id} value={vehicle.id}>
                                            {vehicle.plateNumber} {vehicle.brand && vehicle.model ? `- ${vehicle.brand} ${vehicle.model}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {!selectedCustomerId && t('formVehicleDescription')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                {/* Araç Ekleme Dialog */}
                <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>{t('addVehicleTitle')}</DialogTitle>
                            <DialogDescription>{t('addVehicleDescription')}</DialogDescription>
                        </DialogHeader>
                        {selectedCustomerId && (
                            <VehicleForm
                                customerId={selectedCustomerId}
                                onSuccess={() => {
                                    setIsVehicleDialogOpen(false);
                                    queryClient.invalidateQueries({ queryKey: ['vehicles', selectedCustomerId] });
                                    toast.success(t('vehicleAddedSuccess'));
                                }}
                                onCancel={() => setIsVehicleDialogOpen(false)}
                            />
                        )}
                    </DialogContent>
                </Dialog>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="policyType"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formPolicyType')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('formPolicyTypePlaceholder')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {policyTypes && policyTypes.length > 0 ? (
                                        policyTypes.map((pt) => (
                                            <SelectItem key={pt.id} value={pt.code || pt.name}>
                                                {pt.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        // Fallback: Eğer policy type'lar yüklenemediyse eski hardcoded değerler
                                        <>
                                            <SelectItem value="Kasko">Kasko</SelectItem>
                                            <SelectItem value="Trafik">Trafik</SelectItem>
                                            <SelectItem value="KASKO">KASKO</SelectItem>
                                            <SelectItem value="TRAFFIC">TRAFFIC</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {!policyTypes || policyTypes.length === 0
                                    ? t('loadingPolicyTypes') || 'Poliçe türleri yükleniyor...'
                                    : t('formPolicyTypeDescription') || 'Poliçe türü seçin'}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                        control={form.control}
                        name="currencyId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formCurrency') || 'Para Birimi'}</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value || ''}
                                disabled={isLoading}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('formCurrencyPlaceholder') || 'Para birimi seçin'} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {currencies && currencies.length > 0 ? (
                                        currencies.map((currency) => (
                                            <SelectItem key={currency.id} value={currency.id}>
                                                {currency.symbol} {currency.name} ({currency.code})
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <>
                                            <SelectItem value="11111111-1111-1111-1111-111111111111">€ Euro (EUR)</SelectItem>
                                            <SelectItem value="22222222-2222-2222-2222-222222222222">Bulgarian Lev (BGN)</SelectItem>
                                            <SelectItem value="33333333-3333-3333-3333-333333333333">₺ Turkish Lira (TRY)</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {t('formCurrencyDescription') || 'Poliçe fiyatının gösterileceği para birimi. Varsayılan: EUR'}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                </div>

                {/* Tarih ve Süre Bilgileri */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <h3 className="text-lg font-semibold">Tarih ve Süre Bilgileri</h3>
                    </div>
                    
                    <FormField
                        control={form.control}
                        name="durationDays"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formDurationDays') || 'Poliçe Süresi'}</FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        const days = value ? parseInt(value) : null;
                                        field.onChange(days);
                                    }}
                                    value={field.value?.toString() || ''}
                                    disabled={isLoading || !!policy}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('formDurationDaysPlaceholder') || 'Süre seçin (opsiyonel)'} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="1">1 Gün</SelectItem>
                                        <SelectItem value="15">15 Gün</SelectItem>
                                        <SelectItem value="30">30 Gün</SelectItem>
                                        <SelectItem value="90">90 Gün</SelectItem>
                                        <SelectItem value="365">365 Gün (1 Yıl)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    {t('formDurationDaysDescription') || 'Süre seçildiğinde bitiş tarihi otomatik hesaplanır. Boş bırakılırsa manuel tarih girişi yapabilirsiniz.'}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('formStartDate')}</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('formEndDate')}</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} disabled={isLoading || !!selectedDurationDays} />
                                    </FormControl>
                                    <FormDescription>
                                        {selectedDurationDays ? t('formEndDateAutoCalculated') || 'Bitiş tarihi süre seçimine göre otomatik hesaplanmıştır' : ''}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Fiyat Hesaplama Sonuçları */}
                {calculatedPrice && !policy && (
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <DollarSign className="h-5 w-5" />
                                {t('priceBreakdown') || 'Fiyat Detayları'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{t('basePrice') || 'Temel Fiyat'}:</span>
                                <span className="font-medium">
                                    {calculatedPrice.basePrice.toFixed(2)} {calculatedPrice.currencySymbol || calculatedPrice.currency || 'EUR'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{t('taxes') || 'Vergiler'}:</span>
                                <span className="font-medium">
                                    {calculatedPrice.taxes.toFixed(2)} {calculatedPrice.currencySymbol || calculatedPrice.currency || 'EUR'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t">
                                <span className="text-sm font-semibold">{t('total') || 'Toplam'}:</span>
                                <span className="text-lg font-bold">
                                    {calculatedPrice.total.toFixed(2)} {calculatedPrice.currencySymbol || calculatedPrice.currency || 'EUR'}
                                </span>
                            </div>
                            
                            {/* Diğer para birimlerinde fiyatlar */}
                            {calculatedPrice.pricesInOtherCurrencies && Object.keys(calculatedPrice.pricesInOtherCurrencies).length > 0 && (
                                <div className="pt-2 border-t space-y-1">
                                    <div className="text-xs text-muted-foreground mb-1">{t('pricesInOtherCurrencies') || 'Diğer Para Birimlerinde Fiyatlar'}:</div>
                                    {Object.entries(calculatedPrice.pricesInOtherCurrencies).map(([code, price]) => {
                                        const currency = currencies?.find(c => c.code === code);
                                        return (
                                            <div key={code} className="flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground">{currency?.name || code}:</span>
                                                <span className="text-xs font-medium">
                                                    {price.toFixed(2)} {currency?.symbol || code}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            
                            <div className="pt-2 border-t space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">{t('dealerCommission') || 'Bayi Komisyonu'}:</span>
                                    <span className="text-sm font-medium">
                                        {calculatedPrice.dealerCommission.toFixed(2)} {calculatedPrice.currencySymbol || calculatedPrice.currency || 'EUR'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">{t('observerCommission') || 'Gözlemci Komisyonu'}:</span>
                                    <span className="text-sm font-medium">
                                        {calculatedPrice.observerCommission.toFixed(2)} {calculatedPrice.currencySymbol || calculatedPrice.currency || 'EUR'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {isCalculatingPrice && !policy && (
                    <Alert>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertTitle>{t('calculatingPrice') || 'Fiyat hesaplanıyor...'}</AlertTitle>
                    </Alert>
                )}

                {/* Fiyat Bilgileri */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <h3 className="text-lg font-semibold">Fiyat Bilgileri</h3>
                    </div>
                    <FormField
                        control={form.control}
                        name="premium"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formPremium') || 'Prim (Opsiyonel)'}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        placeholder={calculatedPrice ? calculatedPrice.total.toFixed(2) : (t('formPremiumPlaceholder') || 'Otomatik hesaplanır')}
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            field.onChange(value === '' ? undefined : parseFloat(value));
                                        }}
                                        disabled={isLoading || !!policy}
                                        className="max-w-md"
                                    />
                                </FormControl>
                                <FormDescription>
                                    {calculatedPrice
                                        ? `${t('calculatedPrice') || 'Hesaplanan fiyat'}: ${calculatedPrice.total.toFixed(2)} ${calculatedPrice.currencySymbol || calculatedPrice.currency || 'EUR'}`
                                        : t('formPremiumDescription') || 'Boş bırakılırsa otomatik hesaplanır'}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Form Butonları */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} size="lg">
                        {tCommon('cancel')}
                    </Button>
                    <Button type="submit" disabled={isLoading} size="lg">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {policy ? t('updateButton') : t('createButton')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

