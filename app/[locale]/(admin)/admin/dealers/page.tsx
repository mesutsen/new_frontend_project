'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { dealersService, Dealer } from '@/services/dealers.service';
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
    AlertTriangle,
    Copy,
    Check,
    Key,
    User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DealerForm } from '@/components/dealers/dealer-form';
import { CredentialsField } from '@/components/shared/credentials-field';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function DealersPage() {
    const t = useTranslations('Dealers');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
    const [createdDealer, setCreatedDealer] = useState<Dealer | null>(null);
    const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
    const [isResetPasswordDialog, setIsResetPasswordDialog] = useState(false);
    const [resetPasswordConfirmOpen, setResetPasswordConfirmOpen] = useState(false);
    const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedDealerForDelete, setSelectedDealerForDelete] = useState<Dealer | null>(null);

    // Dealers listesi
    const { data, isLoading, error } = useQuery({
        queryKey: ['dealers', search, isActiveFilter, page, pageSize],
        queryFn: () =>
            dealersService.getDealers({
                search: search || undefined,
                isActive: isActiveFilter,
                page,
                pageSize,
            }),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => dealersService.deleteDealer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dealers'] });
            toast.success(t('deleteSuccess'));
            setDeleteConfirmOpen(false);
            setSelectedDealerForDelete(null);
        },
        onError: () => {
            toast.error(t('deleteError'));
        },
    });

    // Activate mutation
    const activateMutation = useMutation({
        mutationFn: (id: string) => dealersService.activateDealer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dealers'] });
            toast.success(t('activateSuccess'));
        },
        onError: () => {
            toast.error(t('activateError'));
        },
    });

    // Deactivate mutation
    const deactivateMutation = useMutation({
        mutationFn: (id: string) => dealersService.deactivateDealer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dealers'] });
            toast.success(t('deactivateSuccess'));
        },
        onError: () => {
            toast.error(t('deactivateError'));
        },
    });

    // Reset password mutation
    const resetPasswordMutation = useMutation({
        mutationFn: (id: string) => dealersService.resetPassword(id),
        onSuccess: (data) => {
            // Yeni şifre oluşturuldu, dialog'u aç ve bilgileri göster
            setCreatedDealer(data);
            setIsResetPasswordDialog(true);
            setIsCredentialsDialogOpen(true);
        },
        onError: () => {
            toast.error(t('resetPasswordError'));
        },
    });

    const handleEdit = (dealer: Dealer) => {
        setEditingDealer(dealer);
        setIsCreateDialogOpen(true);
    };

    const handleDelete = (dealer: Dealer) => {
        setSelectedDealerForDelete(dealer);
        setDeleteConfirmOpen(true);
    };

    const handleView = (id: string) => {
        router.push(`/${locale}/admin/dealers/${id}`);
    };

    const handleCreateSuccess = (createdDealerData?: Dealer) => {
        setIsCreateDialogOpen(false);
        setEditingDealer(null);
        queryClient.invalidateQueries({ queryKey: ['dealers'] });
        
        // Geçici şifre varsa credentials dialog'unu aç
        if (createdDealerData?.temporaryPassword && createdDealerData?.userName) {
            setCreatedDealer(createdDealerData);
            setIsResetPasswordDialog(false); // Yeni bayi oluşturma
            setIsCredentialsDialogOpen(true);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">{t('title')}</h1>
                        <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingDealer(null)}>
                                <Plus className="h-4 w-4 mr-2" />
                                {t('createButton')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingDealer ? t('editTitle') : t('createTitle')}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingDealer ? t('editDescription') : t('createDescription')}
                                </DialogDescription>
                            </DialogHeader>
                            <DealerForm
                                dealer={editingDealer}
                                onSuccess={handleCreateSuccess}
                                onCancel={() => {
                                    setIsCreateDialogOpen(false);
                                    setEditingDealer(null);
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filtreler */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('searchPlaceholder')}
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={isActiveFilter === undefined ? 'all' : isActiveFilter ? 'active' : 'inactive'}
                        onValueChange={(value) => {
                            setIsActiveFilter(
                                value === 'all' ? undefined : value === 'active'
                            );
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder={t('filterStatus')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('filterAll')}</SelectItem>
                            <SelectItem value="active">{t('filterActive')}</SelectItem>
                            <SelectItem value="inactive">{t('filterInactive')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Hata durumu */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t('errorTitle')}</AlertTitle>
                        <AlertDescription>{t('errorDescription')}</AlertDescription>
                    </Alert>
                )}

                {/* Tablo */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">{t('code')}</TableHead>
                                    <TableHead>{t('name')}</TableHead>
                                    <TableHead>{t('email')}</TableHead>
                                    <TableHead>{t('phone')}</TableHead>
                                    <TableHead>{t('observer') || 'Gözlemci'}</TableHead>
                                    <TableHead>{t('status')}</TableHead>
                                    <TableHead className="text-right">{tCommon('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.items && data.items.length > 0 ? (
                                    data.items.map((dealer) => (
                                        <TableRow key={dealer.id}>
                                            <TableCell className="font-medium">
                                                {dealer.code}
                                            </TableCell>
                                            <TableCell>{dealer.name}</TableCell>
                                            <TableCell>{dealer.email || '-'}</TableCell>
                                            <TableCell>{dealer.phone || '-'}</TableCell>
                                            <TableCell>
                                                {dealer.observerName ? (
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{dealer.observerName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={dealer.isActive ? 'default' : 'secondary'}
                                                >
                                                    {dealer.isActive ? t('active') : t('inactive')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>
                                                            {tCommon('actions')}
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleView(dealer.id)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            {t('view')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEdit(dealer)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            {tCommon('edit')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedDealerId(dealer.id);
                                                                setResetPasswordConfirmOpen(true);
                                                            }}
                                                            disabled={resetPasswordMutation.isPending}
                                                            className="text-blue-600"
                                                        >
                                                            <Key className="mr-2 h-4 w-4" />
                                                            {t('resetPassword')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {dealer.isActive ? (
                                                            <DropdownMenuItem
                                                                onClick={() => deactivateMutation.mutate(dealer.id)}
                                                                className="text-amber-600"
                                                            >
                                                                <PowerOff className="mr-2 h-4 w-4" />
                                                                {t('deactivate')}
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onClick={() => activateMutation.mutate(dealer.id)}
                                                                className="text-green-600"
                                                            >
                                                                <Power className="mr-2 h-4 w-4" />
                                                                {t('activate')}
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(dealer)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            {tCommon('delete')}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            {t('noDealers')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            {t('showingResults', {
                                from: (data.page - 1) * data.pageSize + 1,
                                to: Math.min(data.page * data.pageSize, data.totalCount),
                                total: data.totalCount,
                            })}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                {t('previous')}
                            </Button>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">
                                    {t('pageInfo', { page: data.page, total: data.totalPages })}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                                disabled={page >= data.totalPages}
                            >
                                {t('next')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Geçici Şifre Dialog'u */}
            <Dialog 
                open={isCredentialsDialogOpen} 
                onOpenChange={(open) => {
                    setIsCredentialsDialogOpen(open);
                    if (!open) {
                        setCreatedDealer(null);
                        setIsResetPasswordDialog(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {isResetPasswordDialog ? (
                                <>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                        <Key className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <span>{t('resetPasswordDialogTitle')}</span>
                                </>
                            ) : (
                                <>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                                        <Check className="h-5 w-5 text-green-600" />
                                    </div>
                                    <span>{t('credentialsTitle')}</span>
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            {isResetPasswordDialog ? (
                                createdDealer?.email
                                    ? t('resetPasswordDescriptionWithEmail')
                                    : t('resetPasswordDescription')
                            ) : (
                                createdDealer?.email
                                    ? t('credentialsDescriptionWithEmail')
                                    : t('credentialsDescription')
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    {createdDealer && (
                        <div className="space-y-4">
                            {createdDealer.email && (
                                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <AlertTitle className="text-blue-800 dark:text-blue-200">{t('emailSentTitle')}</AlertTitle>
                                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                                        {t('emailSentDescription', { email: createdDealer.email })}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                <AlertTitle className="text-amber-800 dark:text-amber-200">{t('credentialsWarning')}</AlertTitle>
                                <AlertDescription className="text-amber-700 dark:text-amber-300">{t('credentialsWarningText')}</AlertDescription>
                            </Alert>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        {t('userName')}
                                    </label>
                                    <CredentialsField
                                        value={createdDealer.userName || ''}
                                        label={t('userName')}
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        {t('temporaryPassword')}
                                    </label>
                                    <CredentialsField
                                        value={createdDealer.temporaryPassword || ''}
                                        label={t('temporaryPassword')}
                                        isPassword
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    onClick={() => {
                                        setIsCredentialsDialogOpen(false);
                                        setCreatedDealer(null);
                                        setIsResetPasswordDialog(false);
                                    }}
                                >
                                    {t('close')}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Reset Password Onay Dialog'u */}
            <AlertDialog open={resetPasswordConfirmOpen} onOpenChange={setResetPasswordConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span>{t('resetPasswordConfirmTitle')}</span>
                        </AlertDialogTitle>
                        <div className="pt-2 text-base text-muted-foreground">
                            {t('resetPasswordConfirm')}
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (selectedDealerId) {
                                    resetPasswordMutation.mutate(selectedDealerId);
                                    setResetPasswordConfirmOpen(false);
                                    setSelectedDealerId(null);
                                }
                            }}
                            disabled={resetPasswordMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {resetPasswordMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('resetting')}
                                </>
                            ) : (
                                t('confirm')
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <span>{t('deleteConfirmTitle')}</span>
                        </AlertDialogTitle>
                        {selectedDealerForDelete && (
                            <div className="pt-2 text-base text-muted-foreground space-y-2">
                                <p>{t('deleteConfirm')}</p>
                                <div className="mt-3 p-3 bg-muted rounded-md">
                                    <p className="text-sm font-medium">{t('name')}: {selectedDealerForDelete.name}</p>
                                    <p className="text-sm text-muted-foreground">{t('code')}: {selectedDealerForDelete.code}</p>
                                </div>
                            </div>
                        )}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setDeleteConfirmOpen(false);
                            setSelectedDealerForDelete(null);
                        }}>
                            {tCommon('cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (selectedDealerForDelete) {
                                    deleteMutation.mutate(selectedDealerForDelete.id);
                                }
                            }}
                            disabled={deleteMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('deleting')}
                                </>
                            ) : (
                                tCommon('delete')
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}

