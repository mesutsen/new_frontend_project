'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { observersAdminService, Observer, ObserverDealer } from '@/services/observers-admin.service';
import { dealersService } from '@/services/dealers.service';
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
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Power,
    PowerOff,
    Eye,
    Loader2,
    AlertCircle,
    Users,
    Check,
    Copy,
    User,
    AlertTriangle,
    Key,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ObserverForm } from '@/components/observers/observer-form';
import { CredentialsField } from '@/components/shared/credentials-field';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/pagination';

export default function ObserversPage() {
    const t = useTranslations('AdminObservers');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingObserver, setEditingObserver] = useState<Observer | null>(null);
    const [createdObserver, setCreatedObserver] = useState<Observer | null>(null);
    const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedObserverForDelete, setSelectedObserverForDelete] = useState<Observer | null>(null);
    const [isAssignDealerDialogOpen, setIsAssignDealerDialogOpen] = useState(false);
    const [selectedObserverForDealer, setSelectedObserverForDealer] = useState<Observer | null>(null);
    const [selectedDealerId, setSelectedDealerId] = useState<string>('');
    const [isViewDealersDialogOpen, setIsViewDealersDialogOpen] = useState(false);
    const [selectedObserverForView, setSelectedObserverForView] = useState<Observer | null>(null);
    const [removeDealerFromListConfirmOpen, setRemoveDealerFromListConfirmOpen] = useState(false);
    const [selectedDealerForRemoveFromList, setSelectedDealerForRemoveFromList] = useState<ObserverDealer | null>(null);
    const [isResetPasswordDialog, setIsResetPasswordDialog] = useState(false);
    const [resetPasswordConfirmOpen, setResetPasswordConfirmOpen] = useState(false);
    const [selectedObserverId, setSelectedObserverId] = useState<string | null>(null);

    // Observers listesi
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-observers', search, isActiveFilter, page, pageSize],
        queryFn: () =>
            observersAdminService.getObservers({
                search: search || undefined,
                isActive: isActiveFilter,
                page,
                pageSize,
            }),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => observersAdminService.deleteObserver(id),
        onSuccess: () => {
            toast.success(t('deleteSuccess') || 'Observer deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-observers'] });
            setDeleteConfirmOpen(false);
            setSelectedObserverForDelete(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('deleteError') || 'Failed to delete observer');
        },
    });

    // Activate/Deactivate mutation
    const toggleActiveMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            isActive
                ? observersAdminService.activateObserver(id)
                : observersAdminService.deactivateObserver(id),
        onSuccess: (_, variables) => {
            toast.success(
                variables.isActive
                    ? t('activateSuccess') || 'Observer activated successfully'
                    : t('deactivateSuccess') || 'Observer deactivated successfully'
            );
            queryClient.invalidateQueries({ queryKey: ['admin-observers'] });
            queryClient.invalidateQueries({ queryKey: ['admin-observer', variables.id] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('toggleError') || 'Failed to toggle observer status');
        },
    });

    // Bayi atama için dealers listesi
    const { data: dealersData } = useQuery({
        queryKey: ['dealers', { page: 1, pageSize: 1000 }],
        queryFn: () => dealersService.getDealers({ page: 1, pageSize: 1000 }),
    });

    // Seçili observer'ın atanmış bayileri (atama için)
    const { data: assignedDealers } = useQuery({
        queryKey: ['admin-observer-dealers', selectedObserverForDealer?.id],
        queryFn: () => observersAdminService.getObserverDealers(selectedObserverForDealer!.id),
        enabled: !!selectedObserverForDealer?.id && isAssignDealerDialogOpen,
    });

    // Seçili observer'ın atanmış bayileri (görüntüleme için)
    const { data: viewDealers, isLoading: isLoadingViewDealers } = useQuery({
        queryKey: ['admin-observer-dealers', selectedObserverForView?.id],
        queryFn: () => observersAdminService.getObserverDealers(selectedObserverForView!.id),
        enabled: !!selectedObserverForView?.id && isViewDealersDialogOpen,
    });

    // Atanmamış bayileri filtrele
    const availableDealers =
        dealersData?.items.filter(
            (dealer) => !assignedDealers?.some((ad) => ad.id === dealer.id)
        ) || [];

    // Bayi atama mutation
    const assignDealerMutation = useMutation({
        mutationFn: ({ observerId, dealerId }: { observerId: string; dealerId: string }) =>
            observersAdminService.assignDealer(observerId, dealerId),
        onSuccess: () => {
            toast.success(t('dealerAssignedSuccess') || 'Dealer assigned successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-observers'] });
            queryClient.invalidateQueries({ queryKey: ['admin-observer-dealers', selectedObserverForDealer?.id] });
            setIsAssignDealerDialogOpen(false);
            setSelectedDealerId('');
            setSelectedObserverForDealer(null);
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.detail || t('dealerAssignedError') || 'Failed to assign dealer'
            );
        },
    });

    const handleEdit = (observer: Observer) => {
        setEditingObserver(observer);
    };

    const handleDelete = (observer: Observer) => {
        setSelectedObserverForDelete(observer);
        setDeleteConfirmOpen(true);
    };

    const handleToggleActive = (observer: Observer) => {
        toggleActiveMutation.mutate({ id: observer.id, isActive: !observer.isActive });
    };

    const handleAssignDealer = (observer: Observer) => {
        setSelectedObserverForDealer(observer);
        setIsAssignDealerDialogOpen(true);
        setSelectedDealerId('');
    };

    const handleAssignDealerSubmit = () => {
        if (!selectedDealerId || !selectedObserverForDealer) {
            toast.error(t('selectDealerError') || 'Please select a dealer');
            return;
        }
        assignDealerMutation.mutate({
            observerId: selectedObserverForDealer.id,
            dealerId: selectedDealerId,
        });
    };

    const handleViewDealers = (observer: Observer) => {
        setSelectedObserverForView(observer);
        setIsViewDealersDialogOpen(true);
    };

    // Reset password mutation
    const resetPasswordMutation = useMutation({
        mutationFn: (id: string) => observersAdminService.resetPassword(id),
        onSuccess: (data) => {
            // Yeni şifre oluşturuldu, dialog'u aç ve bilgileri göster
            setCreatedObserver(data);
            setIsResetPasswordDialog(true);
            setIsCredentialsDialogOpen(true);
        },
        onError: () => {
            toast.error(t('resetPasswordError') || 'Failed to reset password');
        },
    });

    // Bayi çıkarma mutation (liste modal'ından)
    const removeDealerFromListMutation = useMutation({
        mutationFn: ({ observerId, dealerId }: { observerId: string; dealerId: string }) =>
            observersAdminService.removeDealer(observerId, dealerId),
        onSuccess: () => {
            toast.success(t('dealerRemovedSuccess') || 'Dealer removed successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-observers'] });
            queryClient.invalidateQueries({ queryKey: ['admin-observer-dealers', selectedObserverForView?.id] });
            setRemoveDealerFromListConfirmOpen(false);
            setSelectedDealerForRemoveFromList(null);
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.detail || t('dealerRemovedError') || 'Failed to remove dealer'
            );
        },
    });

    const handleRemoveDealerFromList = (dealer: ObserverDealer) => {
        setSelectedDealerForRemoveFromList(dealer);
        setRemoveDealerFromListConfirmOpen(true);
    };

    const handleFormSuccess = (createdObserverData?: Observer) => {
        setIsCreateDialogOpen(false);
        setEditingObserver(null);
        queryClient.invalidateQueries({ queryKey: ['admin-observers'] });
        
        // Geçici şifre varsa credentials dialog'unu aç
        if (createdObserverData?.temporaryPassword && createdObserverData?.userName) {
            setCreatedObserver(createdObserverData);
            setIsCredentialsDialogOpen(true);
        }
    };

    const handleFormCancel = () => {
        setIsCreateDialogOpen(false);
        setEditingObserver(null);
    };

    if (error) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{tCommon('error') || 'Error'}</AlertTitle>
                    <AlertDescription>
                        {t('loadError') || 'Failed to load observers. Please try again.'}
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
                                {t('createButton') || 'Create Observer'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{t('createTitle') || 'Create New Observer'}</DialogTitle>
                                <DialogDescription>
                                    {t('createDescription') || 'Add a new observer to the system'}
                                </DialogDescription>
                            </DialogHeader>
                            <ObserverForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={t('searchPlaceholder') || 'Search observers...'}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={isActiveFilter === undefined ? 'all' : isActiveFilter ? 'active' : 'inactive'}
                        onValueChange={(value) => {
                            if (value === 'all') setIsActiveFilter(undefined);
                            else setIsActiveFilter(value === 'active');
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('filterByStatus') || 'Filter by status'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('allStatuses') || 'All Statuses'}</SelectItem>
                            <SelectItem value="active">{t('statusActive') || 'Active'}</SelectItem>
                            <SelectItem value="inactive">{t('statusInactive') || 'Inactive'}</SelectItem>
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
                                    <TableHead>{t('name') || 'Name'}</TableHead>
                                    <TableHead>{t('email') || 'Email'}</TableHead>
                                    <TableHead>{t('phone') || 'Phone'}</TableHead>
                                    <TableHead>{t('assignedDealers') || 'Assigned Dealers'}</TableHead>
                                    <TableHead>{t('activeTasks') || 'Active Tasks'}</TableHead>
                                    <TableHead>{t('status') || 'Status'}</TableHead>
                                    <TableHead className="text-right">{tCommon('actions') || 'Actions'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.items && data.items.length > 0 ? (
                                    data.items.map((observer) => (
                                        <TableRow key={observer.id}>
                                            <TableCell className="font-medium">{observer.name}</TableCell>
                                            <TableCell>{observer.email || '-'}</TableCell>
                                            <TableCell>{observer.phone || '-'}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-auto p-0 font-normal"
                                                    onClick={() => handleViewDealers(observer)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <span className="underline">{observer.assignedDealerCount ?? 0}</span>
                                                    </div>
                                                </Button>
                                            </TableCell>
                                            <TableCell>{observer.activeTaskCount ?? 0}</TableCell>
                                            <TableCell>
                                                {observer.isActive ? (
                                                    <Badge variant="default">{t('statusActive') || 'Active'}</Badge>
                                                ) : (
                                                    <Badge variant="secondary">{t('statusInactive') || 'Inactive'}</Badge>
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
                                                            onClick={() => router.push(`/${locale}/admin/observers/${observer.id}`)}
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            {t('viewDetails') || 'View Details'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEdit(observer)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            {tCommon('edit') || 'Edit'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleToggleActive(observer)}
                                                            disabled={toggleActiveMutation.isPending}
                                                        >
                                                            {observer.isActive ? (
                                                                <>
                                                                    <PowerOff className="mr-2 h-4 w-4" />
                                                                    {t('deactivate') || 'Deactivate'}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Power className="mr-2 h-4 w-4" />
                                                                    {t('activate') || 'Activate'}
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleAssignDealer(observer)}>
                                                            <Users className="mr-2 h-4 w-4" />
                                                            {t('assignDealer') || 'Assign Dealer'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedObserverId(observer.id);
                                                                setResetPasswordConfirmOpen(true);
                                                            }}
                                                            disabled={resetPasswordMutation.isPending}
                                                            className="text-blue-600"
                                                        >
                                                            <Key className="mr-2 h-4 w-4" />
                                                            {t('resetPassword') || 'Reset Password'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(observer)}
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
                                            {t('noObservers') || 'No observers found.'}
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
                {editingObserver && (
                    <Dialog open={!!editingObserver} onOpenChange={(open) => !open && setEditingObserver(null)}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{t('editTitle') || 'Edit Observer'}</DialogTitle>
                                <DialogDescription>
                                    {t('editDescription') || 'Update observer information'}
                                </DialogDescription>
                            </DialogHeader>
                            <ObserverForm
                                observer={editingObserver}
                                onSuccess={handleFormSuccess}
                                onCancel={handleFormCancel}
                            />
                        </DialogContent>
                    </Dialog>
                )}

                {/* Geçici Şifre Dialog'u */}
                <Dialog 
                    open={isCredentialsDialogOpen} 
                    onOpenChange={(open) => {
                        setIsCredentialsDialogOpen(open);
                        if (!open) {
                            setCreatedObserver(null);
                            setIsResetPasswordDialog(false);
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                {isResetPasswordDialog ? (
                                    <>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                            <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span>{t('resetPasswordDialogTitle') || 'New Temporary Password Created'}</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <span>{t('credentialsTitle') || 'Observer Login Credentials'}</span>
                                    </>
                                )}
                            </DialogTitle>
                            <DialogDescription className="text-base pt-2">
                                {isResetPasswordDialog ? (
                                    createdObserver?.email
                                        ? t('resetPasswordDescriptionWithEmail') || 'A new temporary password has been created. Login credentials have been sent via email. You can also note the information below.'
                                        : t('resetPasswordDescription') || 'A new temporary password has been created. Please inform the observer with the following information.'
                                ) : (
                                    createdObserver?.email
                                        ? t('credentialsDescriptionWithEmail') || 'Observer created. Login credentials have been sent via email. You can also note the information below.'
                                        : t('credentialsDescription') || 'Observer created. Please inform the observer with the following information.'
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        {createdObserver && (
                            <div className="space-y-4">
                                {createdObserver.email && (
                                    <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <AlertTitle className="text-blue-800 dark:text-blue-200">
                                            {t('emailSentTitle') || 'Email Sent'}
                                        </AlertTitle>
                                        <AlertDescription className="text-blue-700 dark:text-blue-300">
                                            {t('emailSentDescription', { email: createdObserver.email }) || 
                                             `Login credentials have been sent to ${createdObserver.email}.`}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <AlertTitle className="text-amber-800 dark:text-amber-200">
                                        {t('credentialsWarning') || 'Important'}
                                    </AlertTitle>
                                    <AlertDescription className="text-amber-700 dark:text-amber-300">
                                        {t('credentialsWarningText') || 'Please store these credentials securely. The observer will use these for first login.'}
                                    </AlertDescription>
                                </Alert>
                                
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            {t('userName') || 'Username'}
                                        </label>
                                        <CredentialsField
                                            value={createdObserver.userName || ''}
                                            label={t('userName') || 'Username'}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            {t('temporaryPassword') || 'Temporary Password'}
                                        </label>
                                        <CredentialsField
                                            value={createdObserver.temporaryPassword || ''}
                                            label={t('temporaryPassword') || 'Temporary Password'}
                                            isPassword
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button
                                        onClick={() => {
                                            setIsCredentialsDialogOpen(false);
                                            setCreatedObserver(null);
                                            setIsResetPasswordDialog(false);
                                        }}
                                    >
                                        {t('close') || 'Close'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Bayi Atama Dialog */}
                <Dialog open={isAssignDealerDialogOpen} onOpenChange={setIsAssignDealerDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{t('assignDealer') || 'Assign Dealer'}</DialogTitle>
                            <DialogDescription>
                                {selectedObserverForDealer
                                    ? t('assignDealerDescriptionWithName', { name: selectedObserverForDealer.name }) ||
                                      `Select a dealer to assign to ${selectedObserverForDealer.name}`
                                    : t('assignDealerDescription') || 'Select a dealer to assign to this observer'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {availableDealers.length === 0 ? (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>{t('noAvailableDealers') || 'No Available Dealers'}</AlertTitle>
                                    <AlertDescription>
                                        {t('noAvailableDealersDescription') ||
                                            'All dealers are already assigned to this observer or there are no dealers in the system.'}
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            {t('selectDealer') || 'Select Dealer'}
                                        </label>
                                        <Select value={selectedDealerId} onValueChange={setSelectedDealerId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('selectDealerPlaceholder') || 'Choose a dealer...'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableDealers.map((dealer) => (
                                                    <SelectItem key={dealer.id} value={dealer.id}>
                                                        {dealer.name} ({dealer.code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsAssignDealerDialogOpen(false);
                                                setSelectedDealerId('');
                                                setSelectedObserverForDealer(null);
                                            }}
                                        >
                                            {tCommon('cancel') || 'Cancel'}
                                        </Button>
                                        <Button
                                            onClick={handleAssignDealerSubmit}
                                            disabled={!selectedDealerId || assignDealerMutation.isPending}
                                        >
                                            {assignDealerMutation.isPending && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            {t('assign') || 'Assign'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* View Dealers Dialog */}
                <Dialog open={isViewDealersDialogOpen} onOpenChange={setIsViewDealersDialogOpen}>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                {selectedObserverForView
                                    ? t('assignedDealersFor', { name: selectedObserverForView.name }) ||
                                      `Assigned Dealers for ${selectedObserverForView.name}`
                                    : t('assignedDealers') || 'Assigned Dealers'}
                            </DialogTitle>
                            <DialogDescription>
                                {t('assignedDealersDescription') || 'Dealers assigned to this observer'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {isLoadingViewDealers ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : viewDealers && viewDealers.length > 0 ? (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('dealerName') || 'Dealer Name'}</TableHead>
                                                <TableHead>{t('dealerCode') || 'Code'}</TableHead>
                                                <TableHead>{t('email') || 'Email'}</TableHead>
                                                <TableHead>{t('phone') || 'Phone'}</TableHead>
                                                <TableHead>{t('observer') || 'Observer'}</TableHead>
                                                <TableHead>{t('status') || 'Status'}</TableHead>
                                                <TableHead className="text-right">{tCommon('actions') || 'Actions'}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {viewDealers.map((dealer) => (
                                                <TableRow key={dealer.id}>
                                                    <TableCell className="font-medium">{dealer.name}</TableCell>
                                                    <TableCell>{dealer.code}</TableCell>
                                                    <TableCell>{dealer.email || '-'}</TableCell>
                                                    <TableCell>{dealer.phone || '-'}</TableCell>
                                                    <TableCell>
                                                        {dealer.observerName ? (
                                                            <div className="flex items-center gap-2">
                                                                <User className="h-4 w-4 text-muted-foreground" />
                                                                <span>{dealer.observerName}</span>
                                                            </div>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {dealer.isActive ? (
                                                            <Badge variant="default">{t('statusActive') || 'Active'}</Badge>
                                                        ) : (
                                                            <Badge variant="secondary">{t('statusInactive') || 'Inactive'}</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveDealerFromList(dealer)}
                                                            disabled={removeDealerFromListMutation.isPending}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('noAssignedDealers') || 'No dealers assigned to this observer'}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsViewDealersDialogOpen(false);
                                    setSelectedObserverForView(null);
                                }}
                            >
                                {tCommon('close') || 'Close'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Remove Dealer From List Confirmation */}
                <AlertDialog open={removeDealerFromListConfirmOpen} onOpenChange={setRemoveDealerFromListConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {t('removeDealerConfirmTitle') || 'Remove Dealer?'}
                            </AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{tCommon('cancel') || 'Cancel'}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() =>
                                    selectedDealerForRemoveFromList &&
                                    selectedObserverForView &&
                                    removeDealerFromListMutation.mutate({
                                        observerId: selectedObserverForView.id,
                                        dealerId: selectedDealerForRemoveFromList.id,
                                    })
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {removeDealerFromListMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {tCommon('remove') || 'Remove'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Reset Password Onay Dialog'u */}
                <AlertDialog open={resetPasswordConfirmOpen} onOpenChange={setResetPasswordConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                    <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span>{t('resetPasswordConfirmTitle') || 'Generate New Temporary Password'}</span>
                            </AlertDialogTitle>
                            <div className="pt-2 text-base text-muted-foreground">
                                {t('resetPasswordConfirm') || 'A new temporary password will be generated for this observer and sent via email. Do you want to continue?'}
                            </div>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{tCommon('cancel') || 'Cancel'}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    if (selectedObserverId) {
                                        resetPasswordMutation.mutate(selectedObserverId);
                                        setResetPasswordConfirmOpen(false);
                                        setSelectedObserverId(null);
                                    }
                                }}
                                disabled={resetPasswordMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {resetPasswordMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('resetting') || 'Generating...'}
                                    </>
                                ) : (
                                    t('confirm') || 'Confirm'
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Delete Confirmation */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('deleteConfirmTitle') || 'Are you sure?'}</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{tCommon('cancel') || 'Cancel'}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => selectedObserverForDelete && deleteMutation.mutate(selectedObserverForDelete.id)}
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

