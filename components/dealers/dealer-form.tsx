'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dealersService, Dealer, CreateDealerRequest, UpdateDealerRequest } from '@/services/dealers.service';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const dealerSchema = z.object({
    name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
    code: z.string().min(1, 'Code is required').min(2, 'Code must be at least 2 characters'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    isActive: z.boolean().optional(),
});

type DealerFormValues = z.infer<typeof dealerSchema>;

interface DealerFormProps {
    dealer?: Dealer | null;
    onSuccess: (createdDealer?: Dealer) => void;
    onCancel: () => void;
}

export function DealerForm({ dealer, onSuccess, onCancel }: DealerFormProps) {
    const t = useTranslations('Dealers');
    const queryClient = useQueryClient();

    const form = useForm<DealerFormValues>({
        resolver: zodResolver(dealerSchema),
        defaultValues: {
            name: dealer?.name || '',
            code: dealer?.code || '',
            email: dealer?.email || '',
            phone: dealer?.phone || '',
            isActive: dealer?.isActive ?? true,
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateDealerRequest) => dealersService.createDealer(data),
        onSuccess: (response) => {
            toast.success(t('createSuccess'));
            queryClient.invalidateQueries({ queryKey: ['dealers'] });
            // Geçici şifre varsa parent'a gönder
            if (response.temporaryPassword && response.userName) {
                onSuccess(response);
            } else {
                onSuccess();
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('createError'));
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; payload: UpdateDealerRequest }) =>
            dealersService.updateDealer(data.id, data.payload),
        onSuccess: () => {
            toast.success(t('updateSuccess'));
            queryClient.invalidateQueries({ queryKey: ['dealers'] });
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('updateError'));
        },
    });

    const onSubmit = (data: DealerFormValues) => {
        if (dealer) {
            updateMutation.mutate({
                id: dealer.id,
                payload: {
                    name: data.name,
                    code: data.code,
                    email: data.email || undefined,
                    phone: data.phone || undefined,
                    isActive: data.isActive ?? true,
                },
            });
        } else {
            createMutation.mutate({
                name: data.name,
                code: data.code,
                email: data.email || undefined,
                phone: data.phone || undefined,
            });
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formName')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('formNamePlaceholder')} {...field} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formCode')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('formCodePlaceholder')} {...field} disabled={isLoading} />
                            </FormControl>
                            <FormDescription>{t('formCodeDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formEmail')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder={t('formEmailPlaceholder')}
                                    {...field}
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formPhone')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="tel"
                                    placeholder={t('formPhonePlaceholder')}
                                    {...field}
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {dealer && (
                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>{t('formIsActive')}</FormLabel>
                                    <FormDescription>{t('formIsActiveDescription')}</FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {dealer ? t('updateButton') : t('createButton')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

