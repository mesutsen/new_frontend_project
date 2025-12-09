'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { policiesService, PolicyListParams } from '@/services/policies.service';
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
    Eye,
    Loader2,
    AlertCircle,
    AlertTriangle,
    Send,
    CheckCircle,
    XCircle,
    Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { PolicyDto } from '@/types/policy';

export default function PoliciesPage() {
    const t = useTranslations('Policies');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const format = useFormatter();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [dealerFilter, setDealerFilter] = useState<string | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedPolicyForDelete, setSelectedPolicyForDelete] = useState<PolicyDto | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedPolicyForReject, setSelectedPolicyForReject] = useState<PolicyDto | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedPolicyForCancel, setSelectedPolicyForCancel] = useState<PolicyDto | null>(null);
    const [cancelReason, setCancelReason] = useState('');

    // Policies listesi
    const params: PolicyListParams = {
        search: search || undefined,
        status: statusFilter,
        dealerId: dealerFilter,
        page,
        pageSize,
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['policies', params],
        queryFn: () => policiesService.getPolicies(params),
    });

    // Dealers listesi (filter için)
    const { data: dealersData } = useQuery({
        queryKey: ['dealers', { page: 1, pageSize: 100 }],
        queryFn: () => dealersService.getDealers({ page: 1, pageSize: 100 }),
    });

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: (id: string) => policiesService.deletePolicy(id),
        onSuccess: () => {
            toast.success(t('deleteSuccess'));
            queryClient.invalidateQueries({ queryKey: ['policies'] });
            setDeleteConfirmOpen(false);
            setSelectedPolicyForDelete(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('deleteError'));
        },
    });

    const submitMutation = useMutation({
        mutationFn: (id: string) => policiesService.submitPolicy(id),
        onSuccess: () => {
            toast.success(t('submitSuccess'));
            queryClient.invalidateQueries({ queryKey: ['policies'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('submitError'));
        },
    });

    const approveMutation = useMutation({
        mutationFn: (id: string) => policiesService.approvePolicy(id),
        onSuccess: () => {
            toast.success(t('approveSuccess'));
            queryClient.invalidateQueries({ queryKey: ['policies'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('approveError'));
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            policiesService.rejectPolicy(id, { Reason: reason }),
        onSuccess: () => {
            toast.success(t('rejectSuccess'));
            queryClient.invalidateQueries({ queryKey: ['policies'] });
            setRejectDialogOpen(false);
            setSelectedPolicyForReject(null);
            setRejectReason('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('rejectError'));
        },
    });

    const cancelMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            policiesService.cancelPolicy(id, reason ? { Reason: reason } : undefined),
        onSuccess: () => {
            toast.success(t('cancelSuccess'));
            queryClient.invalidateQueries({ queryKey: ['policies'] });
            setCancelDialogOpen(false);
            setSelectedPolicyForCancel(null);
            setCancelReason('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('cancelError'));
        },
    });

    const handleView = (id: string) => {
        router.push(`/${locale}/admin/policies/${id}`);
    };

    const handleEdit = (policy: PolicyDto) => {
        router.push(`/${locale}/admin/policies/${policy.id}/edit`);
    };

    const handleDelete = (policy: PolicyDto) => {
        setSelectedPolicyForDelete(policy);
        setDeleteConfirmOpen(true);
    };

    const handleSubmit = (id: string) => {
        submitMutation.mutate(id);
    };

    const handleApprove = (id: string) => {
        approveMutation.mutate(id);
    };

    const handleReject = (policy: PolicyDto) => {
        setSelectedPolicyForReject(policy);
        setRejectDialogOpen(true);
    };

    const handleCancel = (policy: PolicyDto) => {
        setSelectedPolicyForCancel(policy);
        setCancelDialogOpen(true);
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'Active':
            case 'Approved':
                return 'default';
            case 'PendingApproval':
                return 'secondary';
            case 'Draft':
                return 'outline';
            case 'Rejected':
            case 'Cancelled':
            case 'Canceled':
                return 'destructive';
            case 'Expired':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    const getStatusLabel = (status: string) => {
        return t(`status${status}`);
    };

    const formatDate = (dateString: string) => {
        return format.dateTime(new Date(dateString), {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        // Locale'e göre currency formatlaması
        const localeMap: Record<string, string> = {
            tr: 'tr-TR',
            en: 'en-US',
            bg: 'bg-BG',
        };
        return new Intl.NumberFormat(localeMap[locale] || 'tr-TR', {
            style: 'currency',
            currency: 'TRY',
        }).format(amount);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Başlık ve Aksiyonlar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">{t('title')}</h1>
                        <p className="text-muted-foreground">{t('description')}</p>
                    </div>
                    <Button onClick={() => {
                        router.push(`/${locale}/admin/policies/new`);
                    }}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('createButton')}
                    </Button>
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
                        value={statusFilter || 'all'}
                        onValueChange={(value) => {
                            setStatusFilter(value === 'all' ? undefined : value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder={t('filterStatus')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('filterAll')}</SelectItem>
                            <SelectItem value="Draft">{t('statusDraft')}</SelectItem>
                            <SelectItem value="PendingApproval">{t('statusPendingApproval')}</SelectItem>
                            <SelectItem value="Approved">{t('statusApproved')}</SelectItem>
                            <SelectItem value="Active">{t('statusActive')}</SelectItem>
                            <SelectItem value="Rejected">{t('statusRejected')}</SelectItem>
                            <SelectItem value="Cancelled">{t('statusCancelled')}</SelectItem>
                            <SelectItem value="Expired">{t('statusExpired')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={dealerFilter || 'all'}
                        onValueChange={(value) => {
                            setDealerFilter(value === 'all' ? undefined : value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder={t('filterDealer')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('filterAll')}</SelectItem>
                            {dealersData?.items.map((dealer) => (
                                <SelectItem key={dealer.id} value={dealer.id}>
                                    {dealer.name} ({dealer.code})
                                </SelectItem>
                            ))}
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
                                    <TableHead>{t('policyNumber')}</TableHead>
                                    <TableHead>{t('customerName')}</TableHead>
                                    <TableHead>{t('vehiclePlate')}</TableHead>
                                    <TableHead>{t('policyType')}</TableHead>
                                    <TableHead>{t('premium')}</TableHead>
                                    <TableHead>{t('status')}</TableHead>
                                    <TableHead>{t('startDate')}</TableHead>
                                    <TableHead>{t('endDate')}</TableHead>
                                    <TableHead className="text-right">{tCommon('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.items && data.items.length > 0 ? (
                                    data.items.map((policy) => (
                                        <TableRow key={policy.id}>
                                            <TableCell className="font-medium">
                                                {policy.policyNumber}
                                            </TableCell>
                                            <TableCell>{policy.customerName}</TableCell>
                                            <TableCell>{policy.vehiclePlate}</TableCell>
                                            <TableCell>{policy.policyType}</TableCell>
                                            <TableCell>{formatCurrency(policy.premium)}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(policy.status)}>
                                                    {getStatusLabel(policy.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(policy.startDate)}</TableCell>
                                            <TableCell>{formatDate(policy.endDate)}</TableCell>
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
                                                        <DropdownMenuItem onClick={() => handleView(policy.id)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            {t('view')}
                                                        </DropdownMenuItem>
                                                        {policy.status === 'Draft' && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleEdit(policy)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    {tCommon('edit')}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleSubmit(policy.id)}>
                                                                    <Send className="mr-2 h-4 w-4" />
                                                                    {t('submit')}
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        {policy.status === 'PendingApproval' && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleApprove(policy.id)}
                                                                    className="text-green-600"
                                                                    disabled={approveMutation.isPending}
                                                                >
                                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                                    {t('approve')}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleReject(policy)}
                                                                    className="text-red-600"
                                                                >
                                                                    <XCircle className="mr-2 h-4 w-4" />
                                                                    {t('reject')}
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        {(policy.status === 'Active' || policy.status === 'Approved') && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleCancel(policy)}
                                                                className="text-amber-600"
                                                            >
                                                                <Ban className="mr-2 h-4 w-4" />
                                                                {t('cancel')}
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(policy)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            {t('delete')}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                                            {t('noData')}
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
                            {t('paginationInfo', {
                                start: (data.page - 1) * data.pageSize + 1,
                                end: Math.min(data.page * data.pageSize, data.totalCount),
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
                                {tCommon('previous')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                                disabled={page === data.totalPages}
                            >
                                {tCommon('next')}
                            </Button>
                        </div>
                    </div>
                )}

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
                            {selectedPolicyForDelete && (
                                <div className="pt-2 text-base text-muted-foreground space-y-2">
                                    <p>{t('deleteConfirm')}</p>
                                    <div className="mt-3 p-3 bg-muted rounded-md">
                                        <p className="text-sm font-medium">
                                            {t('policyNumber')}: {selectedPolicyForDelete.policyNumber}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {t('customerName')}: {selectedPolicyForDelete.customerName}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel
                                onClick={() => {
                                    setDeleteConfirmOpen(false);
                                    setSelectedPolicyForDelete(null);
                                }}
                            >
                                {tCommon('cancel')}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    if (selectedPolicyForDelete) {
                                        deleteMutation.mutate(selectedPolicyForDelete.id);
                                    }
                                }}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {t('delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Reject Dialog */}
                <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('rejectTitle')}</DialogTitle>
                            <DialogDescription>{t('rejectDescription')}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">{t('rejectReason')}</label>
                                <Textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder={t('rejectReasonPlaceholder')}
                                    className="mt-2"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setRejectDialogOpen(false);
                                        setSelectedPolicyForReject(null);
                                        setRejectReason('');
                                    }}
                                >
                                    {tCommon('cancel')}
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (selectedPolicyForReject && rejectReason.trim()) {
                                            rejectMutation.mutate({
                                                id: selectedPolicyForReject.id,
                                                reason: rejectReason,
                                            });
                                        }
                                    }}
                                    disabled={!rejectReason.trim() || rejectMutation.isPending}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {rejectMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {t('reject')}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Cancel Dialog */}
                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('cancelTitle')}</DialogTitle>
                            <DialogDescription>{t('cancelDescription')}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">{t('cancelReason')}</label>
                                <Textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder={t('cancelReasonPlaceholder')}
                                    className="mt-2"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setCancelDialogOpen(false);
                                        setSelectedPolicyForCancel(null);
                                        setCancelReason('');
                                    }}
                                >
                                    {tCommon('cancel')}
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (selectedPolicyForCancel) {
                                            cancelMutation.mutate({
                                                id: selectedPolicyForCancel.id,
                                                reason: cancelReason.trim() || undefined,
                                            });
                                        }
                                    }}
                                    disabled={cancelMutation.isPending}
                                    className="bg-amber-600 hover:bg-amber-700"
                                >
                                    {cancelMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {t('cancel')}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}

