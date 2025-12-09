'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { priceListsService, type CreatePriceListRequest } from '@/services/price-lists.service';
import { policyTypesService } from '@/services/policy-types.service';
import { currenciesService } from '@/services/currencies.service';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const priceListSchema = z.object({
    policyTypeId: z.string().min(1, 'Poliçe türü gereklidir'),
    currencyId: z.string().min(1, 'Para birimi gereklidir'),
    name: z.string().min(1, 'Ad gereklidir'),
    description: z.string().optional(),
    startDate: z.string().min(1, 'Başlangıç tarihi gereklidir'),
    endDate: z.string().min(1, 'Bitiş tarihi gereklidir'),
    // 1 Günlük
    price1Day: z.number().optional().nullable(),
    price1DayMin: z.number().optional().nullable(),
    price1DayMax: z.number().optional().nullable(),
    // 15 Günlük
    price15Days: z.number().optional().nullable(),
    price15DaysMin: z.number().optional().nullable(),
    price15DaysMax: z.number().optional().nullable(),
    // 30 Günlük
    price30Days: z.number().optional().nullable(),
    price30DaysMin: z.number().optional().nullable(),
    price30DaysMax: z.number().optional().nullable(),
    // 90 Günlük
    price90Days: z.number().optional().nullable(),
    price90DaysMin: z.number().optional().nullable(),
    price90DaysMax: z.number().optional().nullable(),
    // 365 Günlük
    price365Days: z.number().optional().nullable(),
    price365DaysMin: z.number().optional().nullable(),
    price365DaysMax: z.number().optional().nullable(),
    taxRate: z.number().min(0).max(1),
    dealerCommissionRate: z.number().min(0).max(1).optional().nullable(),
    observerCommissionRate: z.number().min(0).max(1).optional().nullable(),
    adminCommissionRate: z.number().min(0).max(1).optional().nullable(),
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

export default function NewPriceListPage() {
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const t = useTranslations('PriceLists');
    const queryClient = useQueryClient();

    const { data: policyTypes, isLoading: isLoadingPolicyTypes } = useQuery({
        queryKey: ['policy-types', 'active'],
        queryFn: () => policyTypesService.getActive(),
    });

    const { data: currencies, isLoading: isLoadingCurrencies } = useQuery({
        queryKey: ['currencies', 'active'],
        queryFn: () => currenciesService.getActive(),
    });

    const createForm = useForm<CreatePriceListRequest>({
        resolver: zodResolver(priceListSchema),
        defaultValues: {
            name: '',
            description: '',
            startDate: '',
            endDate: '',
            price1Day: null,
            price1DayMin: null,
            price1DayMax: null,
            price15Days: null,
            price15DaysMin: null,
            price15DaysMax: null,
            price30Days: null,
            price30DaysMin: null,
            price30DaysMax: null,
            price90Days: null,
            price90DaysMin: null,
            price90DaysMax: null,
            price365Days: null,
            price365DaysMin: null,
            price365DaysMax: null,
            taxRate: 0.18,
            dealerCommissionRate: null,
            observerCommissionRate: null,
            adminCommissionRate: null,
            isActive: true,
            priority: 0,
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreatePriceListRequest) => priceListsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['price-lists'] });
            toast.success(t('createSuccess') || 'Fiyat listesi başarıyla oluşturuldu');
            router.push(`/${locale}/admin/config/price-lists`);
        },
        onError: (error: any) => {
            toast.error(t('createError') || 'Fiyat listesi oluşturulurken bir hata oluştu');
            console.error('Create error:', error);
        },
    });

    const onSubmit = (data: CreatePriceListRequest) => {
        createMutation.mutate(data);
    };

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
                            <h1 className="text-3xl font-bold">{t('createTitle') || 'Yeni Fiyat Listesi Oluştur'}</h1>
                            <p className="text-muted-foreground">{t('createDescription') || 'Yeni bir fiyat listesi ekleyin'}</p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('createTitle') || 'Yeni Fiyat Listesi Oluştur'}</CardTitle>
                        <CardDescription>{t('createDescription') || 'Yeni bir fiyat listesi ekleyin'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...createForm}>
                            <form onSubmit={createForm.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={createForm.control}
                                    name="policyTypeId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('formPolicyType') || 'Poliçe Türü'} *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingPolicyTypes}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('formPolicyTypePlaceholder') || 'Poliçe türü seçin'} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {policyTypes?.map((pt) => (
                                                        <SelectItem key={pt.id} value={pt.id}>
                                                            {pt.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={createForm.control}
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
                                        control={createForm.control}
                                        name="currencyId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formCurrency') || 'Para Birimi'} *</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value || ''}
                                                    disabled={isLoadingCurrencies || !currencies || currencies.length === 0}
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
                                                    {t('formCurrencyDescription') || 'Fiyat listesinin para birimi'}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={createForm.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formDescription') || 'Açıklama'}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={createForm.control}
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
                                        control={createForm.control}
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
                                                control={createForm.control}
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
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={createForm.control}
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
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={createForm.control}
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
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
                                                control={createForm.control}
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
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={createForm.control}
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
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={createForm.control}
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
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
                                                control={createForm.control}
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
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={createForm.control}
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
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={createForm.control}
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
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
                                                control={createForm.control}
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
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={createForm.control}
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
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={createForm.control}
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
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
                                                control={createForm.control}
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
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={createForm.control}
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
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={createForm.control}
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
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
                                        control={createForm.control}
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
                                        control={createForm.control}
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
                                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                    />
                                                </FormControl>
                                                <FormDescription>Boş bırakılırsa poliçe türündeki varsayılan değer kullanılır</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={createForm.control}
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
                                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                                    />
                                                </FormControl>
                                                <FormDescription>Boş bırakılırsa poliçe türündeki varsayılan değer kullanılır</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={createForm.control}
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
                                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
                                        control={createForm.control}
                                        name="priority"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formPriority') || 'Öncelik'}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                                <FormDescription>Yüksek öncelik önce kontrol edilir</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={createForm.control}
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
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        {createMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Oluştur
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

