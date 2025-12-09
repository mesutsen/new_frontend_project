'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { scheduledTasksService, type RecurringJob, type BackgroundJob, type CreateRecurringJobRequest } from '@/services/scheduled-tasks.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
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
import {
    Plus,
    Pencil,
    Trash2,
    Play,
    RefreshCw,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    Calendar,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

const recurringJobSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    cron: z.string().min(1, 'Cron expression is required'),
    timeZoneId: z.string().optional(),
    queue: z.string().optional(),
    method: z.string().min(1, 'Method is required'),
});

export default function ScheduledTasksPage() {
    const t = useTranslations('ScheduledTasks');
    const queryClient = useQueryClient();

    const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<RecurringJob | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [backgroundJobState, setBackgroundJobState] = useState<string>('');
    const [backgroundJobPage, setBackgroundJobPage] = useState(1);

    // Statistics
    const { data: statistics, isLoading: statsLoading } = useQuery({
        queryKey: ['scheduled-tasks-statistics'],
        queryFn: () => scheduledTasksService.getStatistics(),
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    // Recurring Jobs
    const { data: recurringJobs, isLoading: recurringLoading, error: recurringError } = useQuery({
        queryKey: ['scheduled-tasks-recurring'],
        queryFn: () => scheduledTasksService.getRecurringJobs(),
        refetchInterval: 30000,
    });

    // Background Jobs
    const { data: backgroundJobsData, isLoading: backgroundLoading, error: backgroundError } = useQuery({
        queryKey: ['scheduled-tasks-background', backgroundJobState, backgroundJobPage],
        queryFn: () => scheduledTasksService.getBackgroundJobs(backgroundJobState, backgroundJobPage, 20),
        refetchInterval: 30000,
    });

    const recurringForm = useForm<CreateRecurringJobRequest>({
        resolver: zodResolver(recurringJobSchema),
        defaultValues: {
            id: '',
            cron: '',
            timeZoneId: 'UTC',
            queue: 'default',
            method: '',
        },
    });

    const createRecurringMutation = useMutation({
        mutationFn: (data: CreateRecurringJobRequest) => scheduledTasksService.createRecurringJob(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduled-tasks-recurring'] });
            queryClient.invalidateQueries({ queryKey: ['scheduled-tasks-statistics'] });
            setRecurringDialogOpen(false);
            recurringForm.reset();
            toast.success(t('createSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('createError'));
        },
    });

    const updateRecurringMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateRecurringJobRequest> }) =>
            scheduledTasksService.updateRecurringJob(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduled-tasks-recurring'] });
            queryClient.invalidateQueries({ queryKey: ['scheduled-tasks-statistics'] });
            setRecurringDialogOpen(false);
            recurringForm.reset();
            toast.success(t('updateSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('updateError'));
        },
    });

    const deleteRecurringMutation = useMutation({
        mutationFn: (id: string) => scheduledTasksService.deleteRecurringJob(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduled-tasks-recurring'] });
            queryClient.invalidateQueries({ queryKey: ['scheduled-tasks-statistics'] });
            setDeleteDialogOpen(false);
            toast.success(t('deleteSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('deleteError'));
        },
    });

    const triggerRecurringMutation = useMutation({
        mutationFn: (id: string) => scheduledTasksService.triggerRecurringJob(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduled-tasks-recurring'] });
            queryClient.invalidateQueries({ queryKey: ['scheduled-tasks-background'] });
            toast.success(t('triggerSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('triggerError'));
        },
    });

    const retryJobMutation = useMutation({
        mutationFn: (jobId: string) => scheduledTasksService.retryJob(jobId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduled-tasks-background'] });
            queryClient.invalidateQueries({ queryKey: ['scheduled-tasks-statistics'] });
            toast.success(t('retrySuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('retryError'));
        },
    });

    const deleteJobMutation = useMutation({
        mutationFn: (jobId: string) => scheduledTasksService.deleteJob(jobId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduled-tasks-background'] });
            queryClient.invalidateQueries({ queryKey: ['scheduled-tasks-statistics'] });
            toast.success(t('deleteJobSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('deleteJobError'));
        },
    });

    const handleCreate = () => {
        setIsEdit(false);
        setSelectedJob(null);
        recurringForm.reset({
            id: '',
            cron: '',
            timeZoneId: 'UTC',
            queue: 'default',
            method: '',
        });
        setRecurringDialogOpen(true);
    };

    const handleEdit = (job: RecurringJob) => {
        setIsEdit(true);
        setSelectedJob(job);
        recurringForm.reset({
            id: job.id,
            cron: job.cron,
            timeZoneId: job.timeZoneId || 'UTC',
            queue: job.queue || 'default',
            method: job.method,
        });
        setRecurringDialogOpen(true);
    };

    const handleDelete = (job: RecurringJob) => {
        setSelectedJob(job);
        setDeleteDialogOpen(true);
    };

    const onSubmitRecurring = (data: CreateRecurringJobRequest) => {
        if (isEdit && selectedJob) {
            updateRecurringMutation.mutate({ id: selectedJob.id, data });
        } else {
            createRecurringMutation.mutate(data);
        }
    };

    const getJobStateIcon = (state: string) => {
        switch (state.toLowerCase()) {
            case 'succeeded':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'processing':
                return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
            case 'enqueued':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        try {
            return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
        } catch {
            return dateString;
        }
    };

    if (recurringError || backgroundError) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('errorTitle')}</AlertTitle>
                    <AlertDescription>{t('errorDescription')}</AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('title')}</h1>
                        <p className="text-muted-foreground">{t('description')}</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('createRecurringJob')}
                    </Button>
                </div>

                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{t('statistics.recurring')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{statistics.recurring}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{t('statistics.enqueued')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{statistics.enqueued}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{t('statistics.processing')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{statistics.processing}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{t('statistics.succeeded')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{statistics.succeeded}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{t('statistics.failed')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{statistics.failed}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{t('statistics.deleted')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{statistics.deleted}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{t('statistics.servers')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{statistics.servers}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Tabs defaultValue="recurring" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="recurring">{t('recurringJobs')}</TabsTrigger>
                        <TabsTrigger value="background">{t('backgroundJobs')}</TabsTrigger>
                    </TabsList>

                    {/* Recurring Jobs Tab */}
                    <TabsContent value="recurring" className="space-y-4">
                        {recurringLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !recurringJobs || recurringJobs.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                {t('noRecurringJobs')}
                            </div>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('recurringJobs')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('id')}</TableHead>
                                                <TableHead>{t('cron')}</TableHead>
                                                <TableHead>{t('method')}</TableHead>
                                                <TableHead>{t('queue')}</TableHead>
                                                <TableHead>{t('lastExecution')}</TableHead>
                                                <TableHead>{t('nextExecution')}</TableHead>
                                                <TableHead className="text-right">{t('actions')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recurringJobs.map((job) => (
                                                <TableRow key={job.id}>
                                                    <TableCell className="font-medium">{job.id}</TableCell>
                                                    <TableCell>
                                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                                            {job.cron}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell>{job.method}</TableCell>
                                                    <TableCell>{job.queue || 'default'}</TableCell>
                                                    <TableCell>{formatDate(job.lastExecution)}</TableCell>
                                                    <TableCell>{formatDate(job.nextExecution)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => triggerRecurringMutation.mutate(job.id)}
                                                                disabled={triggerRecurringMutation.isPending}
                                                            >
                                                                <Play className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEdit(job)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(job)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Background Jobs Tab */}
                    <TabsContent value="background" className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Select value={backgroundJobState} onValueChange={setBackgroundJobState}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder={t('filterByState')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{t('allStates')}</SelectItem>
                                    <SelectItem value="Enqueued">{t('state.enqueued')}</SelectItem>
                                    <SelectItem value="Processing">{t('state.processing')}</SelectItem>
                                    <SelectItem value="Succeeded">{t('state.succeeded')}</SelectItem>
                                    <SelectItem value="Failed">{t('state.failed')}</SelectItem>
                                    <SelectItem value="Deleted">{t('state.deleted')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {backgroundLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !backgroundJobsData || backgroundJobsData.items.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                {t('noBackgroundJobs')}
                            </div>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('backgroundJobs')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('jobId')}</TableHead>
                                                <TableHead>{t('state')}</TableHead>
                                                <TableHead>{t('jobName')}</TableHead>
                                                <TableHead>{t('createdAt')}</TableHead>
                                                <TableHead>{t('startedAt')}</TableHead>
                                                <TableHead>{t('completedAt')}</TableHead>
                                                <TableHead className="text-right">{t('actions')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {backgroundJobsData.items.map((job) => (
                                                <TableRow key={job.id}>
                                                    <TableCell className="font-mono text-xs">{job.id}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getJobStateIcon(job.state)}
                                                            <span>{job.state}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{job.jobName}</TableCell>
                                                    <TableCell>{formatDate(job.createdAt)}</TableCell>
                                                    <TableCell>{formatDate(job.startedAt)}</TableCell>
                                                    <TableCell>{formatDate(job.completedAt)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {job.state === 'Failed' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => retryJobMutation.mutate(job.id)}
                                                                    disabled={retryJobMutation.isPending}
                                                                >
                                                                    <RefreshCw className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => deleteJobMutation.mutate(job.id)}
                                                                disabled={deleteJobMutation.isPending}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {backgroundJobsData.totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="text-sm text-muted-foreground">
                                                {t('paginationInfo', {
                                                    start: (backgroundJobPage - 1) * 20 + 1,
                                                    end: Math.min(backgroundJobPage * 20, backgroundJobsData.totalCount),
                                                    total: backgroundJobsData.totalCount,
                                                })}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setBackgroundJobPage((p) => Math.max(1, p - 1))}
                                                    disabled={backgroundJobPage === 1}
                                                >
                                                    {t('previous')}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setBackgroundJobPage((p) => p + 1)}
                                                    disabled={backgroundJobPage >= backgroundJobsData.totalPages}
                                                >
                                                    {t('next')}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Create/Edit Recurring Job Dialog */}
                <Dialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {isEdit ? t('editRecurringJob') : t('createRecurringJob')}
                            </DialogTitle>
                            <DialogDescription>
                                {isEdit ? t('editRecurringJobDescription') : t('createRecurringJobDescription')}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...recurringForm}>
                            <form onSubmit={recurringForm.handleSubmit(onSubmitRecurring)} className="space-y-4">
                                <FormField
                                    control={recurringForm.control}
                                    name="id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('id')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={isEdit} placeholder="my-recurring-job" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={recurringForm.control}
                                    name="cron"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('cron')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="0 0 * * *" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={recurringForm.control}
                                    name="method"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('method')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="MyService.DoSomething" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={recurringForm.control}
                                    name="queue"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('queue')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="default" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={recurringForm.control}
                                    name="timeZoneId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('timeZone')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="UTC" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setRecurringDialogOpen(false)}
                                    >
                                        {t('cancel')}
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createRecurringMutation.isPending || updateRecurringMutation.isPending}
                                    >
                                        {isEdit ? t('update') : t('create')}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('deleteConfirmDescription', { id: selectedJob?.id || '' })}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => selectedJob && deleteRecurringMutation.mutate(selectedJob.id)}
                                className="bg-destructive text-destructive-foreground"
                            >
                                {t('delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}

