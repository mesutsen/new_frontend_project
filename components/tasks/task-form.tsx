'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { observersAdminService } from '@/services/observers-admin.service';
import { dealersService } from '@/services/dealers.service';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '@/services/tasks-admin.service';
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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const taskSchema = z.object({
    title: z.string().min(1, 'Title is required').min(3, 'Title must be at least 3 characters'),
    description: z.string().min(1, 'Description is required').min(10, 'Description must be at least 10 characters'),
    assignedToUserId: z.string().min(1, 'Observer is required'),
    relatedDealerId: z.string().optional().or(z.literal('')),
    dueDate: z.string().optional().or(z.literal('')),
    priority: z.enum(['Low', 'Medium', 'High']),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
    task?: Task | null;
    onSuccess: (data: CreateTaskRequest | UpdateTaskRequest) => void;
    onCancel: () => void;
}

export function TaskForm({ task, onSuccess, onCancel }: TaskFormProps) {
    const t = useTranslations('AdminTasks');
    const tCommon = useTranslations('Common');

    // Observers listesi
    const { data: observersData } = useQuery({
        queryKey: ['admin-observers', { page: 1, pageSize: 1000 }],
        queryFn: () => observersAdminService.getObservers({ page: 1, pageSize: 1000 }),
    });

    // Dealers listesi
    const { data: dealersData } = useQuery({
        queryKey: ['dealers', { page: 1, pageSize: 1000 }],
        queryFn: () => dealersService.getDealers({ page: 1, pageSize: 1000 }),
    });

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: task?.title || '',
            description: task?.description || '',
            assignedToUserId: task?.assignedToUserId || '',
            relatedDealerId: task?.relatedDealerId || 'unassigned',
            dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
            priority: task?.priority || 'Medium',
        },
    });

    const onSubmit = (values: TaskFormValues) => {
        const formData: CreateTaskRequest | UpdateTaskRequest = {
            title: values.title,
            description: values.description,
            assignedToUserId: values.assignedToUserId,
            relatedDealerId: values.relatedDealerId === 'unassigned' ? undefined : (values.relatedDealerId || undefined),
            dueDate: values.dueDate ? `${values.dueDate}T23:59:59` : undefined,
            priority: values.priority,
        };

        if (task) {
            // Update mode - status can be updated separately
            onSuccess(formData);
        } else {
            // Create mode
            onSuccess(formData as CreateTaskRequest);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('title') || 'Title'}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('titlePlaceholder') || 'Enter task title'} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('description') || 'Description'}</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t('descriptionPlaceholder') || 'Enter task description'}
                                    rows={4}
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                {t('descriptionHint') || 'Provide detailed instructions for this task'}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="assignedToUserId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('assignedTo') || 'Assigned To'}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectObserver') || 'Select an observer'} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {observersData?.items.map((observer) => (
                                        <SelectItem key={observer.id} value={observer.id}>
                                            {observer.name} {observer.email ? `(${observer.email})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="relatedDealerId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('relatedDealer') || 'Related Dealer (Optional)'}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || 'unassigned'}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectDealer') || 'Select a dealer (optional)'} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="unassigned">{t('noDealer') || 'No dealer'}</SelectItem>
                                    {dealersData?.items.map((dealer) => (
                                        <SelectItem key={dealer.id} value={dealer.id}>
                                            {dealer.name} ({dealer.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {t('relatedDealerHint') || 'If this task is related to a specific dealer'}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('dueDate') || 'Due Date'}</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('priority') || 'Priority'}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Low">{t('priorityLow') || 'Low'}</SelectItem>
                                        <SelectItem value="Medium">{t('priorityMedium') || 'Medium'}</SelectItem>
                                        <SelectItem value="High">{t('priorityHigh') || 'High'}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        {tCommon('cancel') || 'Cancel'}
                    </Button>
                    <Button type="submit">
                        {task ? tCommon('save') || 'Save' : tCommon('create') || 'Create'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
