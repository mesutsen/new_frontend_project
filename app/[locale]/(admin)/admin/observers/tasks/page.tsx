'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { tasksAdminService, Task } from '@/services/tasks-admin.service';
import { observersAdminService } from '@/services/observers-admin.service';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    Loader2,
    AlertCircle,
    Calendar,
    User,
    Building2,
    Flag,
    Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TaskForm } from '@/components/tasks/task-form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/pagination';

export default function AdminTasksPage() {
    const t = useTranslations('AdminTasks');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const format = useFormatter();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [observerFilter, setObserverFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedTaskForDelete, setSelectedTaskForDelete] = useState<Task | null>(null);

    // Tasks listesi
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-tasks', observerFilter, statusFilter, priorityFilter, page, pageSize],
        queryFn: () =>
            tasksAdminService.getTasks({
                assignedToUserId: observerFilter === 'all' ? undefined : observerFilter,
                status: statusFilter === 'all' ? undefined : statusFilter as any,
                priority: priorityFilter === 'all' ? undefined : priorityFilter as any,
                page,
                pageSize,
            }),
    });

    // Observers listesi (filter için)
    const { data: observersData } = useQuery({
        queryKey: ['admin-observers', { page: 1, pageSize: 1000 }],
        queryFn: () => observersAdminService.getObservers({ page: 1, pageSize: 1000 }),
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: any) => tasksAdminService.createTask(data),
        onSuccess: () => {
            toast.success(t('createSuccess') || 'Task created successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
            setIsCreateDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('createError') || 'Failed to create task');
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => tasksAdminService.updateTask(id, data),
        onSuccess: () => {
            toast.success(t('updateSuccess') || 'Task updated successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
            setEditingTask(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('updateError') || 'Failed to update task');
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => tasksAdminService.deleteTask(id),
        onSuccess: () => {
            toast.success(t('deleteSuccess') || 'Task deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
            setDeleteConfirmOpen(false);
            setSelectedTaskForDelete(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('deleteError') || 'Failed to delete task');
        },
    });

    const handleFormSubmit = (formData: any) => {
        if (editingTask) {
            updateMutation.mutate({ id: editingTask.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (task: Task) => {
        setEditingTask(task);
    };

    const handleDelete = (task: Task) => {
        setSelectedTaskForDelete(task);
        setDeleteConfirmOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending':
                return <Badge variant="secondary">{t('statusPending') || 'Pending'}</Badge>;
            case 'InProgress':
                return <Badge variant="default">{t('statusInProgress') || 'In Progress'}</Badge>;
            case 'Completed':
                return <Badge variant="outline">{t('statusCompleted') || 'Completed'}</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'Low':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700">{t('priorityLow') || 'Low'}</Badge>;
            case 'Medium':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">{t('priorityMedium') || 'Medium'}</Badge>;
            case 'High':
                return <Badge variant="outline" className="bg-red-50 text-red-700">{t('priorityHigh') || 'High'}</Badge>;
            default:
                return <Badge>{priority}</Badge>;
        }
    };

    if (error) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{tCommon('error') || 'Error'}</AlertTitle>
                    <AlertDescription>
                        {t('loadError') || 'Failed to load tasks. Please try again.'}
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{t('title')}</h1>
                        <p className="text-muted-foreground mt-1">
                            {t('description')}
                        </p>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                {t('createButton') || 'Create Task'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{t('createTitle') || 'Create New Task'}</DialogTitle>
                                <DialogDescription>
                                    {t('createDescription') || 'Assign a new task to an observer'}
                                </DialogDescription>
                            </DialogHeader>
                            <TaskForm
                                onSuccess={handleFormSubmit}
                                onCancel={() => setIsCreateDialogOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <Select value={observerFilter} onValueChange={setObserverFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder={t('filterByObserver') || 'Filter by observer'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('allObservers') || 'All Observers'}</SelectItem>
                            {observersData?.items.map((observer) => (
                                <SelectItem key={observer.id} value={observer.id}>
                                    {observer.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('filterByStatus') || 'Filter by status'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('allStatuses') || 'All Statuses'}</SelectItem>
                            <SelectItem value="Pending">{t('statusPending') || 'Pending'}</SelectItem>
                            <SelectItem value="InProgress">{t('statusInProgress') || 'In Progress'}</SelectItem>
                            <SelectItem value="Completed">{t('statusCompleted') || 'Completed'}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('filterByPriority') || 'Filter by priority'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('allPriorities') || 'All Priorities'}</SelectItem>
                            <SelectItem value="Low">{t('priorityLow') || 'Low'}</SelectItem>
                            <SelectItem value="Medium">{t('priorityMedium') || 'Medium'}</SelectItem>
                            <SelectItem value="High">{t('priorityHigh') || 'High'}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('title') || 'Title'}</TableHead>
                                    <TableHead>{t('assignedTo') || 'Assigned To'}</TableHead>
                                    <TableHead>{t('relatedDealer') || 'Related Dealer'}</TableHead>
                                    <TableHead>{t('priority') || 'Priority'}</TableHead>
                                    <TableHead>{t('status') || 'Status'}</TableHead>
                                    <TableHead>{t('dueDate') || 'Due Date'}</TableHead>
                                    <TableHead className="text-right">{tCommon('actions') || 'Actions'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.items && data.items.length > 0 ? (
                                    data.items.map((task) => (
                                        <TableRow key={task.id}>
                                            <TableCell className="font-medium">{task.title}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    {task.assignedToUserName || task.assignedToUserId}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {task.relatedDealerName ? (
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        {task.relatedDealerName}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                                            <TableCell>{getStatusBadge(task.status)}</TableCell>
                                            <TableCell>
                                                {task.dueDate ? (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {format.dateTime(new Date(task.dueDate), {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>{tCommon('actions') || 'Actions'}</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => router.push(`/${locale}/admin/observers/tasks/${task.id}`)}
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            {t('viewDetails') || 'View Details'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEdit(task)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            {tCommon('edit') || 'Edit'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(task)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            {tCommon('delete') || 'Delete'}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            {t('noTasks') || 'No tasks found.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Pagination */}
                {data && data.totalPages && data.totalPages > 1 && (
                    <div className="flex justify-center">
                        <Pagination
                            currentPage={data.page}
                            totalPages={data.totalPages}
                            onPageChange={setPage}
                        />
                    </div>
                )}

                {/* Edit Dialog */}
                {editingTask && (
                    <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{t('editTitle') || 'Edit Task'}</DialogTitle>
                                <DialogDescription>
                                    {t('editDescription') || 'Update task information'}
                                </DialogDescription>
                            </DialogHeader>
                            <TaskForm
                                task={editingTask}
                                onSuccess={handleFormSubmit}
                                onCancel={() => setEditingTask(null)}
                            />
                        </DialogContent>
                    </Dialog>
                )}

                {/* Delete Confirmation */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('deleteConfirmTitle') || 'Are you sure?'}</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{tCommon('cancel') || 'Cancel'}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => selectedTaskForDelete && deleteMutation.mutate(selectedTaskForDelete.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {tCommon('delete') || 'Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}

