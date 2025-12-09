'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    customersService,
    Customer,
    CreateCustomerRequest,
    UpdateCustomerRequest,
} from '@/services/customers.service';
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

const customerSchema = z.object({
    firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
    nationalId: z.string().optional().or(z.literal('')),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    isActive: z.boolean().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
    dealerId: string;
    customer?: Customer | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function CustomerForm({ dealerId, customer, onSuccess, onCancel }: CustomerFormProps) {
    const t = useTranslations('Customers');
    const queryClient = useQueryClient();

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            firstName: customer?.firstName || '',
            lastName: customer?.lastName || '',
            nationalId: customer?.nationalId || '',
            email: customer?.email || '',
            phone: customer?.phone || '',
            isActive: customer?.isActive ?? true,
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateCustomerRequest) => customersService.createCustomer(data),
        onSuccess: () => {
            toast.success(t('createSuccess'));
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dealer-customers', dealerId] });
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('createError'));
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; payload: UpdateCustomerRequest }) =>
            customersService.updateCustomer(data.id, data.payload),
        onSuccess: () => {
            toast.success(t('updateSuccess'));
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dealer-customers', dealerId] });
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('updateError'));
        },
    });

    const onSubmit = (data: CustomerFormValues) => {
        if (customer) {
            updateMutation.mutate({
                id: customer.id,
                payload: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    nationalId: data.nationalId || undefined,
                    email: data.email || undefined,
                    phone: data.phone || undefined,
                    isActive: data.isActive ?? true,
                },
            });
        } else {
            createMutation.mutate({
                dealerId,
                firstName: data.firstName,
                lastName: data.lastName,
                nationalId: data.nationalId || undefined,
                email: data.email || undefined,
                phone: data.phone || undefined,
            });
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('firstName')}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('firstNamePlaceholder')} {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('lastName')}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('lastNamePlaceholder')} {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="nationalId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('nationalId')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('nationalIdPlaceholder')} {...field} disabled={isLoading} />
                            </FormControl>
                            <FormDescription>{t('nationalIdDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('email')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder={t('emailPlaceholder')}
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
                            <FormLabel>{t('phone')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="tel"
                                    placeholder={t('phonePlaceholder')}
                                    {...field}
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {customer && (
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
                                    <FormLabel>{t('isActive')}</FormLabel>
                                    <FormDescription>{t('isActiveDescription')}</FormDescription>
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
                        {customer ? t('update') : t('create')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

