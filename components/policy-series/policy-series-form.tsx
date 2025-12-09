'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { policySeriesService, CreatePolicySeriesRequest, UpdatePolicySeriesRequest, PolicySeries } from '@/services/policy-series.service';
import { dealersService } from '@/services/dealers.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const policySeriesSchema = z.object({
    dealerId: z.string().min(1, 'Dealer is required'),
    series: z.string().min(1, 'Series code is required').max(10, 'Series code must be at most 10 characters'),
    startNumber: z.number().min(1, 'Start number must be at least 1'),
    endNumber: z.number().min(1, 'End number must be at least 1'),
}).refine((data) => data.endNumber > data.startNumber, {
    message: 'End number must be greater than start number',
    path: ['endNumber'],
});

type PolicySeriesFormValues = z.infer<typeof policySeriesSchema>;

interface PolicySeriesFormProps {
    series?: PolicySeries;
    onSuccess?: (data: PolicySeries) => void;
    onCancel?: () => void;
}

export function PolicySeriesForm({ series, onSuccess, onCancel }: PolicySeriesFormProps) {
    const t = useTranslations('PolicySeries');
    const tCommon = useTranslations('Common');
    const queryClient = useQueryClient();

    // Bayileri getir
    const { data: dealersData } = useQuery({
        queryKey: ['dealers', { page: 1, pageSize: 100 }],
        queryFn: () => dealersService.getDealers({ page: 1, pageSize: 100 }),
    });

    const form = useForm<PolicySeriesFormValues>({
        resolver: zodResolver(policySeriesSchema),
        defaultValues: {
            dealerId: series?.dealerId || '',
            series: series?.series || '',
            startNumber: series?.startNumber || 1,
            endNumber: series?.endNumber || 10000,
        },
    });

    useEffect(() => {
        if (series) {
            form.reset({
                dealerId: series.dealerId,
                series: series.series,
                startNumber: series.startNumber,
                endNumber: series.endNumber,
            });
        }
    }, [series, form]);

    const createMutation = useMutation({
        mutationFn: (data: CreatePolicySeriesRequest) => policySeriesService.createPolicySeries(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['policy-series'] });
            toast.success(t('createSuccess'));
            onSuccess?.(data);
        },
        onError: () => {
            toast.error(t('createError'));
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdatePolicySeriesRequest }) =>
            policySeriesService.updatePolicySeries(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['policy-series'] });
            toast.success(t('updateSuccess'));
            onSuccess?.(data);
        },
        onError: () => {
            toast.error(t('updateError'));
        },
    });

    const onSubmit = (values: PolicySeriesFormValues) => {
        if (series) {
            updateMutation.mutate({
                id: series.id,
                data: {
                    series: values.series,
                    startNumber: values.startNumber,
                    endNumber: values.endNumber,
                },
            });
        } else {
            createMutation.mutate({
                dealerId: values.dealerId,
                series: values.series,
                startNumber: values.startNumber,
                endNumber: values.endNumber,
            });
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {!series && (
                    <FormField
                        control={form.control}
                        name="dealerId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formDealer')}</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={isLoading}
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
                                <FormDescription>{t('formDealerDescription')}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="series"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formSeries')}</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={t('formSeriesPlaceholder')}
                                    {...field}
                                    disabled={isLoading}
                                    maxLength={10}
                                />
                            </FormControl>
                            <FormDescription>{t('formSeriesDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formStartNumber')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder={t('formStartNumberPlaceholder')}
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormDescription>{t('formStartNumberDescription')}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="endNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formEndNumber')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder={t('formEndNumberPlaceholder')}
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormDescription>{t('formEndNumberDescription')}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                            {tCommon('cancel')}
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {series ? t('updating') : t('creating')}
                            </>
                        ) : (
                            series ? t('updateButton') : t('createButton')
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

