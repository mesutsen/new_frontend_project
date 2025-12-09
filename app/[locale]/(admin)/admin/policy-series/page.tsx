'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { policySeriesService, PolicySeries } from '@/services/policy-series.service';
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
    AlertDialogDescription,
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
    FileText,
    TrendingUp,
    AlertTriangle,
    Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PolicySeriesForm } from '@/components/policy-series/policy-series-form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

export default function PolicySeriesPage() {
    const t = useTranslations('PolicySeries');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [dealerFilter, setDealerFilter] = useState<string | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingSeries, setEditingSeries] = useState<PolicySeries | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
    const [isAssignDealerDialogOpen, setIsAssignDealerDialogOpen] = useState(false);
    const [selectedSeriesForAssign, setSelectedSeriesForAssign] = useState<PolicySeries | null>(null);
    const [selectedDealerId, setSelectedDealerId] = useState<string>('');

    // Bayileri getir (filtre için)
    const { data: dealersData } = useQuery({
        queryKey: ['dealers', { page: 1, pageSize: 100 }],
        queryFn: () => dealersService.getDealers({ page: 1, pageSize: 100 }),
    });

    // Policy Series listesi
    const { data, isLoading, error } = useQuery({
        queryKey: ['policy-series', search, dealerFilter, page, pageSize],
        queryFn: () =>
            policySeriesService.getPolicySeries({
                search: search || undefined,
                dealerId: dealerFilter,
                page,
                pageSize,
            }),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => policySeriesService.deletePolicySeries(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policy-series'] });
            toast.success(t('deleteSuccess'));
            setDeleteConfirmOpen(false);
            setSelectedSeriesId(null);
        },
        onError: () => {
            toast.error(t('deleteError'));
        },
    });

    // Assign dealer mutation
    const assignDealerMutation = useMutation({
        mutationFn: ({ seriesId, dealerId }: { seriesId: string; dealerId: string }) =>
            policySeriesService.assignDealer(seriesId, dealerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policy-series'] });
            queryClient.invalidateQueries({ queryKey: ['dealer'] });
            toast.success(t('assignDealerSuccess') || 'Bayi başarıyla atandı');
            setIsAssignDealerDialogOpen(false);
            setSelectedSeriesForAssign(null);
            setSelectedDealerId('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || t('assignDealerError') || 'Bayi atama sırasında bir hata oluştu');
        },
    });

    const handleEdit = (series: PolicySeries) => {
        setEditingSeries(series);
        setIsCreateDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        setSelectedSeriesId(id);
        setDeleteConfirmOpen(true);
    };

    const handleView = (id: string) => {
        router.push(`/${locale}/admin/policy-series/${id}`);
    };

    const handleAssignDealer = (series: PolicySeries) => {
        setSelectedSeriesForAssign(series);
        setSelectedDealerId(series.dealerId);
        setIsAssignDealerDialogOpen(true);
    };

    const handleAssignDealerSubmit = () => {
        if (!selectedSeriesForAssign || !selectedDealerId) {
            toast.error(t('selectDealerError') || 'Lütfen bir bayi seçin');
            return;
        }
        assignDealerMutation.mutate({
            seriesId: selectedSeriesForAssign.id,
            dealerId: selectedDealerId,
        });
    };

    const handleCreateSuccess = () => {
        setIsCreateDialogOpen(false);
        setEditingSeries(null);
        queryClient.invalidateQueries({ queryKey: ['policy-series'] });
    };

    // Kullanım yüzdesini hesapla
    const getUsagePercentage = (series: PolicySeries) => {
        const total = series.endNumber - series.startNumber + 1;
        const used = series.currentNumber - series.startNumber;
        return Math.round((used / total) * 100);
    };

    // Kalan numara sayısını hesapla
    const getRemainingNumbers = (series: PolicySeries) => {
        return series.endNumber - series.currentNumber;
    };

    // Durum badge'i
    const getStatusBadge = (series: PolicySeries) => {
        const usagePercentage = getUsagePercentage(series);
        const remaining = getRemainingNumbers(series);

        if (remaining <= 0) {
            return <Badge variant="destructive">Tükendi</Badge>;
        } else if (usagePercentage >= 90) {
            return <Badge variant="destructive">Kritik</Badge>;
        } else if (usagePercentage >= 75) {
            return <Badge variant="outline" className="border-amber-500 text-amber-700">Yakın</Badge>;
        } else {
            return <Badge variant="secondary">Aktif</Badge>;
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
                            <Button onClick={() => setEditingSeries(null)}>
                                <Plus className="h-4 w-4 mr-2" />
                                {t('createButton')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingSeries ? t('editTitle') : t('createTitle')}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingSeries ? t('editDescription') : t('createDescription')}
                                </DialogDescription>
                            </DialogHeader>
                            <PolicySeriesForm
                                series={editingSeries || undefined}
                                onSuccess={handleCreateSuccess}
                                onCancel={() => {
                                    setIsCreateDialogOpen(false);
                                    setEditingSeries(null);
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
                        value={dealerFilter || 'all'}
                        onValueChange={(value) => {
                            setDealerFilter(value === 'all' ? undefined : value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[200px]">
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
                                    <TableHead>{t('series')}</TableHead>
                                    <TableHead>{t('dealer')}</TableHead>
                                    <TableHead>{t('range')}</TableHead>
                                    <TableHead>{t('current')}</TableHead>
                                    <TableHead>{t('remaining')}</TableHead>
                                    <TableHead>{t('usage')}</TableHead>
                                    <TableHead>{t('status')}</TableHead>
                                    <TableHead className="text-right">{tCommon('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.items && data.items.length > 0 ? (
                                    data.items.map((series) => {
                                        const usagePercentage = getUsagePercentage(series);
                                        const remaining = getRemainingNumbers(series);
                                        // Bayi bilgisini bul
                                        const dealer = dealersData?.items.find(d => d.id === series.dealerId);
                                        const dealerName = dealer ? `${dealer.name} (${dealer.code})` : (t('dealerNotFound') || 'Bayi yok');
                                        
                                        return (
                                            <TableRow key={series.id}>
                                                <TableCell className="font-medium">
                                                    {series.series}
                                                </TableCell>
                                                <TableCell>
                                                    {dealerName}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {series.startNumber} - {series.endNumber}
                                                </TableCell>
                                                <TableCell className="font-mono">
                                                    {series.currentNumber}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={remaining <= 50 ? 'text-red-600 font-semibold' : ''}>
                                                        {remaining}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 w-24">
                                                        <Progress value={usagePercentage} className="h-2" />
                                                        <span className="text-xs text-muted-foreground w-10">
                                                            {usagePercentage}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(series)}
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
                                                            <DropdownMenuItem onClick={() => handleView(series.id)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                {t('view')}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleEdit(series)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                {tCommon('edit')}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleAssignDealer(series)}>
                                                                <Building2 className="mr-2 h-4 w-4" />
                                                                {t('assignDealer') || 'Bayiye Ata'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(series.id)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                {tCommon('delete')}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            {t('noSeries')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
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

                {/* Assign Dealer Dialog */}
                <Dialog open={isAssignDealerDialogOpen} onOpenChange={setIsAssignDealerDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('assignDealerTitle') || 'Bayiye Ata'}</DialogTitle>
                            <DialogDescription>
                                {t('assignDealerDescription') || 'Poliçe serisini bir bayieye atayın'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium mb-2">{t('series')}</p>
                                <p className="text-base font-mono">{selectedSeriesForAssign?.series}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-2">{t('selectDealer') || 'Bayi Seçin'}</p>
                                <Select value={selectedDealerId} onValueChange={setSelectedDealerId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectDealerPlaceholder') || 'Bayi seçin'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dealersData?.items.map((dealer) => (
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
                                        setSelectedSeriesForAssign(null);
                                        setSelectedDealerId('');
                                    }}
                                >
                                    {tCommon('cancel')}
                                </Button>
                                <Button
                                    onClick={handleAssignDealerSubmit}
                                    disabled={assignDealerMutation.isPending || !selectedDealerId}
                                >
                                    {assignDealerMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {t('assigning') || 'Atanıyor...'}
                                        </>
                                    ) : (
                                        t('assign') || 'Ata'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <span>{t('deleteConfirmTitle')}</span>
                            </AlertDialogTitle>
                            <AlertDialogDescription className="pt-2 text-base">
                                {t('deleteConfirm')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    if (selectedSeriesId) {
                                        deleteMutation.mutate(selectedSeriesId);
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
            </div>
        </DashboardLayout>
    );
}

