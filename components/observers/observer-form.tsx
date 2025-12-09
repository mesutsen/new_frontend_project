'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    observersAdminService,
    Observer,
    CreateObserverRequest,
    UpdateObserverRequest,
} from '@/services/observers-admin.service';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const observerSchema = z.object({
    name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    isActive: z.boolean().optional(),
});

type ObserverFormValues = z.infer<typeof observerSchema>;

interface ObserverFormProps {
    observer?: Observer | null;
    onSuccess: (createdObserverData?: Observer) => void;
    onCancel: () => void;
}

export function ObserverForm({ observer, onSuccess, onCancel }: ObserverFormProps) {
    const t = useTranslations('AdminObservers');
    const tCommon = useTranslations('Common');
    const queryClient = useQueryClient();

    const form = useForm<ObserverFormValues>({
        resolver: zodResolver(observerSchema),
        defaultValues: {
            name: observer?.name || '',
            email: observer?.email || '',
            phone: observer?.phone || '',
            isActive: observer?.isActive ?? true,
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateObserverRequest) => observersAdminService.createObserver(data),
        onSuccess: (data) => {
            toast.success(t('createSuccess') || 'Observer created successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-observers'] });
            onSuccess(data);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('createError') || 'Failed to create observer');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; payload: UpdateObserverRequest }) =>
            observersAdminService.updateObserver(data.id, data.payload),
        onSuccess: () => {
            toast.success(t('updateSuccess') || 'Observer updated successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-observers'] });
            queryClient.invalidateQueries({ queryKey: ['admin-observer', observer?.id] });
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('updateError') || 'Failed to update observer');
        },
    });

    const onSubmit = (values: ObserverFormValues) => {
        if (observer) {
            updateMutation.mutate({
                id: observer.id,
                payload: {
                    name: values.name,
                    email: values.email || undefined,
                    phone: values.phone || undefined,
                    isActive: values.isActive,
                },
            });
        } else {
            createMutation.mutate({
                name: values.name,
                email: values.email || undefined,
                phone: values.phone || undefined,
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
                            <FormLabel>{t('name') || 'Name'}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('namePlaceholder') || 'Enter observer name'} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('email') || 'Email'}</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder={t('emailPlaceholder') || 'Enter email address'}
                                    {...field}
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
                            <FormLabel>{t('phone') || 'Phone'}</FormLabel>
                            <FormControl>
                                <Input
                                    type="tel"
                                    placeholder={t('phonePlaceholder') || 'Enter phone number'}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {observer && (
                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>{t('isActive') || 'Active'}</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                        {tCommon('cancel') || 'Cancel'}
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {observer ? tCommon('save') || 'Save' : tCommon('create') || 'Create'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

