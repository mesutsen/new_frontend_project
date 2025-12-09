'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { priceListsService, type UpdatePriceListRequest } from '@/services/price-lists.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const updatePriceListSchema = z.object({
    currencyId: z.string().min(1, 'Para birimi gereklidir'),
    name: z.string().min(1, 'Ad gereklidir'),
    description: z.string().optional(),
    startDate: z.string().min(1, 'Başlangıç tarihi gereklidir'),
    endDate: z.string().min(1, 'Bitiş tarihi gereklidir'),
    // 1 Günlük
    price1Day: z.number().optional(),
    price1DayMin: z.number().optional(),
    price1DayMax: z.number().optional(),
    // 15 Günlük
    price15Days: z.number().optional(),
    price15DaysMin: z.number().optional(),
    price15DaysMax: z.number().optional(),
    // 30 Günlük
    price30Days: z.number().optional(),
    price30DaysMin: z.number().optional(),
    price30DaysMax: z.number().optional(),
    // 90 Günlük
    price90Days: z.number().optional(),
    price90DaysMin: z.number().optional(),
    price90DaysMax: z.number().optional(),
    // 365 Günlük
    price365Days: z.number().optional(),
    price365DaysMin: z.number().optional(),
    price365DaysMax: z.number().optional(),
    taxRate: z.number().min(0).max(1),
    dealerCommissionRate: z.number().min(0).max(1).optional(),
    observerCommissionRate: z.number().min(0).max(1).optional(),
    adminCommissionRate: z.number().min(0).max(1).optional(),
    isActive: z.boolean(),
    priority: z.number().int().min(0),
}).refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
}, {
    message: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır',
    path: ['endDate'],
});

export default function EditPriceListPage() {
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const id = params.id as string;
    const t = useTranslations('PriceLists');
    const queryClient = useQueryClient();

    const { data: priceList, isLoading: isLoadingPriceList } = useQuery({
        queryKey: ['price-lists', id],
        queryFn: () => priceListsService.getById(id),
        enabled: !!id,
    });

    const updateForm = useForm<UpdatePriceListRequest>({
        resolver: zodResolver(updatePriceListSchema),
        defaultValues: {
            currencyId: '',
            name: '',
            description: '',
            startDate: '',
            endDate: '',
            price1Day: undefined,
            price1DayMin: undefined,
            price1DayMax: undefined,
            price15Days: undefined,
            price15DaysMin: undefined,
            price15DaysMax: undefined,
            price30Days: undefined,
            price30DaysMin: undefined,
            price30DaysMax: undefined,
            price90Days: undefined,
            price90DaysMin: undefined,
            price90DaysMax: undefined,
            price365Days: undefined,
            price365DaysMin: undefined,
            price365DaysMax: undefined,
            taxRate: 0.18,
            dealerCommissionRate: undefined,
            observerCommissionRate: undefined,
            adminCommissionRate: undefined,
            isActive: true,
            priority: 0,
        },
        values: priceList ? {
            currencyId: priceList.currencyId,
            name: priceList.name,
            description: priceList.description || '',
            startDate: priceList.startDate.split('T')[0],
            endDate: priceList.endDate.split('T')[0],
            price1Day: priceList.price1Day,
            price1DayMin: priceList.price1DayMin,
            price1DayMax: priceList.price1DayMax,
            price15Days: priceList.price15Days,
            price15DaysMin: priceList.price15DaysMin,
            price15DaysMax: priceList.price15DaysMax,
            price30Days: priceList.price30Days,
            price30DaysMin: priceList.price30DaysMin,
            price30DaysMax: priceList.price30DaysMax,
            price90Days: priceList.price90Days,
            price90DaysMin: priceList.price90DaysMin,
            price90DaysMax: priceList.price90DaysMax,
            price365Days: priceList.price365Days,
            price365DaysMin: priceList.price365DaysMin,
            price365DaysMax: priceList.price365DaysMax,
            taxRate: priceList.taxRate,
            dealerCommissionRate: priceList.dealerCommissionRate,
            observerCommissionRate: priceList.observerCommissionRate,
            adminCommissionRate: priceList.adminCommissionRate,
            isActive: priceList.isActive,
            priority: priceList.priority,
        } : undefined,
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdatePriceListRequest) =>
            priceListsService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['price-lists'] });
            toast.success(t('updateSuccess') || 'Fiyat listesi başarıyla güncellendi');
            router.push(`/${locale}/admin/config/price-lists`);
        },
        onError: (error: any) => {
            toast.error(t('updateError') || 'Fiyat listesi güncellenirken bir hata oluştu');
            console.error('Update error:', error);
        },
    });

    const onSubmit = (data: UpdatePriceListRequest) => {
        updateMutation.mutate(data);
    };

    if (isLoadingPriceList) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (!priceList) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Fiyat listesi bulunamadı</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">{t('editTitle') || 'Fiyat Listesi Düzenle'}</h1>
                            <p className="text-muted-foreground">{t('editDescription') || 'Fiyat listesi bilgilerini güncelleyin'}</p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('editTitle') || 'Fiyat Listesi Düzenle'}</CardTitle>
                        <CardDescription>{t('editDescription') || 'Fiyat listesi bilgilerini güncelleyin'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...updateForm}>
                            <form onSubmit={updateForm.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={updateForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formName') || 'Ad'} *</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={updateForm.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formDescription') || 'Açıklama'}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={updateForm.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formStartDate') || 'Başlangıç Tarihi'} *</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={updateForm.control}
                                        name="endDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formEndDate') || 'Bitiş Tarihi'} *</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {/* Süre Bazlı Fiyatlar */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium">{t('formDurationBasedPrices') || 'Süre Bazlı Fiyatlar'}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {t('formDurationBasedPricesDescription') || 'Her süre için normal, minimum ve maksimum fiyat tanımlayın.'}
                                        </p>
                                    </div>
                                    
                                    {/* 1 Günlük */}
                                    <div className="space-y-2 border rounded-lg p-4">
                                        <h4 className="text-sm font-medium">1 Günlük</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <FormField
                                                control={updateForm.control}
                                                name="price1Day"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Normal Fiyat</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={updateForm.control}
                                                name="price1DayMin"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Min Fiyat</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={updateForm.control}
                                                name="price1DayMax"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Max Fiyat</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* 15 Günlük */}
                                    <div className="space-y-2 border rounded-lg p-4">
                                        <h4 className="text-sm font-medium">15 Günlük</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <FormField
                                                control={updateForm.control}
                                                name="price15Days"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Normal Fiyat</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={updateForm.control}
                                                name="price15DaysMin"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Min Fiyat</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={updateForm.control}
                                                name="price15DaysMax"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Max Fiyat</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* 30 Günlük */}
                                    <div className="space-y-2 border rounded-lg p-4">
                                        <h4 className="text-sm font-medium">30 Günlük</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <FormField
                                                control={updateForm.control}
                                                name="price30Days"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Normal Fiyat</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={updateForm.control}
                                                name="price30DaysMin"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Min Fiyat</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={updateForm.control}
                                                name="price30DaysMax"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Max Fiyat</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* 90 Günlük */}
                                    <div className="space-y-2 border rounded-lg p-4">
                                        <h4 className="text-sm font-medium">90 Günlük</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <FormField
                                                control={updateForm.control}
                                                name="price90Days"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Normal Fiyat</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={updateForm.control}
                                                name="price90DaysMin"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Min Fiyat</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={updateForm.control}
                                                name="price90DaysMax"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Max Fiyat</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* 365 Günlük */}
                                    <div className="space-y-2 border rounded-lg p-4">
                                        <h4 className="text-sm font-medium">365 Günlük</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <FormField
                                                control={updateForm.control}
                                                name="price365Days"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Normal Fiyat</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={updateForm.control}
                                                name="price365DaysMin"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Min Fiyat</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={updateForm.control}
                                                name="price365DaysMax"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Max Fiyat</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={updateForm.control}
                                        name="taxRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formTaxRate') || 'KDV Oranı'} *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="1"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                                <FormDescription>Örn: 0.18 = %18</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField
                                        control={updateForm.control}
                                        name="dealerCommissionRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formDealerCommissionRate') || 'Bayi Komisyon Oranı'}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="1"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                    />
                                                </FormControl>
                                                <FormDescription>Boş bırakılırsa poliçe türündeki varsayılan değer kullanılır</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={updateForm.control}
                                        name="observerCommissionRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formObserverCommissionRate') || 'Gözlemci Komisyon Oranı'}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="1"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                    />
                                                </FormControl>
                                                <FormDescription>Boş bırakılırsa poliçe türündeki varsayılan değer kullanılır</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={updateForm.control}
                                        name="adminCommissionRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formAdminCommissionRate') || 'Admin Komisyon Oranı'}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="1"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                    />
                                                </FormControl>
                                                <FormDescription>Boş bırakılırsa poliçe türündeki varsayılan değer kullanılır</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={updateForm.control}
                                        name="priority"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formPriority') || 'Öncelik'}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                                <FormDescription>Yüksek öncelik önce kontrol edilir</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={updateForm.control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel>{t('formIsActive') || 'Aktif'}</FormLabel>
                                                    <FormDescription>Fiyat listesinin aktif olup olmadığını belirler</FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                    >
                                        İptal
                                    </Button>
                                    <Button type="submit" disabled={updateMutation.isPending}>
                                        {updateMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Güncelle
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

