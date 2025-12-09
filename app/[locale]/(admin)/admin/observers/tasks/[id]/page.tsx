'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { tasksAdminService, Task } from '@/services/tasks-admin.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    Calendar,
    User,
    Building2,
    Flag,
    Edit,
    CheckCircle2,
    Clock,
    PlayCircle,
    FileText,
    Mail,
    Phone,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { TaskForm } from '@/components/tasks/task-form';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('AdminTasks');
    const tCommon = useTranslations('Common');
    const format = useFormatter();
    const queryClient = useQueryClient();
    const taskId = params.id as string;

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Task detayı
    const { data: task, isLoading, error } = useQuery({
        queryKey: ['admin-task', taskId],
        queryFn: () => tasksAdminService.getTaskById(taskId),
        enabled: !!taskId,
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => tasksAdminService.updateTask(id, data),
        onSuccess: () => {
            toast.success(t('updateSuccess') || 'Task updated successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-task', taskId] });
            queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
            setIsEditDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('updateError') || 'Failed to update task');
        },
    });

    const handleFormSubmit = (formData: any) => {
        if (task) {
            updateMutation.mutate({ id: task.id, data: formData });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending':
                return (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t('statusPending') || 'Pending'}
                    </Badge>
                );
            case 'InProgress':
                return (
                    <Badge variant="default" className="flex items-center gap-1">
                        <PlayCircle className="h-3 w-3" />
                        {t('statusInProgress') || 'In Progress'}
                    </Badge>
                );
            case 'Completed':
                return (
                    <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3" />
                        {t('statusCompleted') || 'Completed'}
                    </Badge>
                );
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'Low':
                return (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Flag className="h-3 w-3 mr-1" />
                        {t('priorityLow') || 'Low'}
                    </Badge>
                );
            case 'Medium':
                return (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Flag className="h-3 w-3 mr-1" />
                        {t('priorityMedium') || 'Medium'}
                    </Badge>
                );
            case 'High':
                return (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <Flag className="h-3 w-3 mr-1" />
                        {t('priorityHigh') || 'High'}
                    </Badge>
                );
            default:
                return <Badge>{priority}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !task) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{tCommon('error') || 'Error'}</AlertTitle>
                    <AlertDescription>
                        {t('loadError') || 'Failed to load task details. Please try again.'}
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/${locale}/admin/observers/tasks`)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">{task.title}</h1>
                        <p className="text-muted-foreground mt-1">
                            {t('taskDetails') || 'Task details and activity'}
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {tCommon('edit') || 'Edit'}
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Görev Bilgileri */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                {t('taskInformation') || 'Task Information'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('title') || 'Title'}</p>
                                <p className="text-base font-semibold mt-1">{task.title}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('description') || 'Description'}
                                </p>
                                <p className="text-base mt-1 whitespace-pre-wrap">{task.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('status') || 'Status'}</p>
                                    <div className="mt-1">{getStatusBadge(task.status)}</div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('priority') || 'Priority'}
                                    </p>
                                    <div className="mt-1">{getPriorityBadge(task.priority)}</div>
                                </div>
                            </div>
                            {task.dueDate && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('dueDate') || 'Due Date'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-base">
                                            {format.dateTime(new Date(task.dueDate), {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Atama Bilgileri */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                {t('assignmentInformation') || 'Assignment Information'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('assignedTo') || 'Assigned To'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-base font-semibold">
                                        {task.assignedToUserName || task.assignedToUserId}
                                    </p>
                                </div>
                            </div>
                            {task.relatedDealerName && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('relatedDealer') || 'Related Dealer'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-base">{task.relatedDealerName}</p>
                                    </div>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('createdBy') || 'Created By'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-base">
                                        {task.createdByUserName || task.createdByUserId}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tarih Bilgileri */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                {t('dateInformation') || 'Date Information'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('createdAt') || 'Created At'}
                                </p>
                                <p className="text-base">
                                    {format.dateTime(new Date(task.createdAt), {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('updatedAt') || 'Updated At'}
                                </p>
                                <p className="text-base">
                                    {format.dateTime(new Date(task.updatedAt), {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                            {task.completedAt && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('completedAt') || 'Completed At'}
                                    </p>
                                    <p className="text-base">
                                        {format.dateTime(new Date(task.completedAt), {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Görev Durumu */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                {t('taskStatus') || 'Task Status'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{t('currentStatus') || 'Current Status'}</span>
                                    {getStatusBadge(task.status)}
                                </div>
                                {task.status !== 'Completed' && (
                                    <div className="pt-2">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {t('statusChangeNote') || 'You can change the task status by editing the task.'}
                                        </p>
                                    </div>
                                )}
                                {task.status === 'Completed' && task.completedAt && (
                                    <div className="pt-2 border-t">
                                        <p className="text-sm text-muted-foreground">
                                            {t('completedOn') || 'This task was completed on'}{' '}
                                            {format.dateTime(new Date(task.completedAt), {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Görev Aktivite Geçmişi (Gelecekte genişletilebilir) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {t('activityHistory') || 'Activity History'}
                        </CardTitle>
                        <CardDescription>
                            {t('activityHistoryDescription') || 'Task activity and changes'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                                    <FileText className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium">{t('taskCreated') || 'Task Created'}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {t('createdBy') || 'Created by'} {task.createdByUserName || task.createdByUserId}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {format.dateTime(new Date(task.createdAt), {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                            {task.updatedAt !== task.createdAt && (
                                <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 shrink-0">
                                        <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium">{t('taskUpdated') || 'Task Updated'}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {t('lastUpdated') || 'Last updated'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {format.dateTime(new Date(task.updatedAt), {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {task.status === 'Completed' && task.completedAt && (
                                <div className="flex items-start gap-3 p-3 rounded-lg border bg-green-50 dark:bg-green-950">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 shrink-0">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-green-800 dark:text-green-200">
                                            {t('taskCompleted') || 'Task Completed'}
                                        </p>
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            {t('completedOn') || 'Completed on'}{' '}
                                            {format.dateTime(new Date(task.completedAt), {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                {task && (
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{t('editTitle') || 'Edit Task'}</DialogTitle>
                                <DialogDescription>
                                    {t('editDescription') || 'Update task information'}
                                </DialogDescription>
                            </DialogHeader>
                            <TaskForm
                                task={task}
                                onSuccess={handleFormSubmit}
                                onCancel={() => setIsEditDialogOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </DashboardLayout>
    );
}

