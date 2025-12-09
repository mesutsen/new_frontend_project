'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { observersAdminService, ObserverDealer } from '@/services/observers-admin.service';
import { dealersService, Dealer } from '@/services/dealers.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    Users,
    Plus,
    Trash2,
    Mail,
    Phone,
    Calendar,
    User,
    X,
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
import { ObserverForm } from '@/components/observers/observer-form';
import { useFormatter } from 'next-intl';

export default function ObserverDetailPage() {
    const t = useTranslations('AdminObservers');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const router = useRouter();
    const params = useParams();
    const format = useFormatter();
    const queryClient = useQueryClient();

    const observerId = params.id as string;
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAssignDealerDialogOpen, setIsAssignDealerDialogOpen] = useState(false);
    const [selectedDealerId, setSelectedDealerId] = useState<string>('');
    const [removeDealerConfirmOpen, setRemoveDealerConfirmOpen] = useState(false);
    const [selectedDealerForRemove, setSelectedDealerForRemove] = useState<ObserverDealer | null>(null);

    // Observer detayı
    const { data: observer, isLoading: isLoadingObserver, error: observerError } = useQuery({
        queryKey: ['admin-observer', observerId],
        queryFn: () => observersAdminService.getObserverById(observerId),
        enabled: !!observerId,
    });

    // Atanmış bayiler
    const { data: assignedDealers, isLoading: isLoadingDealers } = useQuery({
        queryKey: ['admin-observer-dealers', observerId],
        queryFn: () => observersAdminService.getObserverDealers(observerId),
        enabled: !!observerId,
    });

    // Tüm bayiler (atama için)
    const { data: allDealers } = useQuery({
        queryKey: ['dealers', { page: 1, pageSize: 1000 }],
        queryFn: () => dealersService.getDealers({ page: 1, pageSize: 1000 }),
    });

    // Atanmamış bayileri filtrele
    const availableDealers =
        allDealers?.items.filter(
            (dealer) => !assignedDealers?.some((ad) => ad.id === dealer.id)
        ) || [];

    // Bayi atama mutation
    const assignDealerMutation = useMutation({
        mutationFn: (dealerId: string) => observersAdminService.assignDealer(observerId, dealerId),
        onSuccess: () => {
            toast.success(t('dealerAssignedSuccess') || 'Dealer assigned successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-observer-dealers', observerId] });
            setIsAssignDealerDialogOpen(false);
            setSelectedDealerId('');
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.detail || t('dealerAssignedError') || 'Failed to assign dealer'
            );
        },
    });

    // Bayi çıkarma mutation
    const removeDealerMutation = useMutation({
        mutationFn: (dealerId: string) => observersAdminService.removeDealer(observerId, dealerId),
        onSuccess: () => {
            toast.success(t('dealerRemovedSuccess') || 'Dealer removed successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-observer-dealers', observerId] });
            setRemoveDealerConfirmOpen(false);
            setSelectedDealerForRemove(null);
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.detail || t('dealerRemovedError') || 'Failed to remove dealer'
            );
        },
    });

    const handleAssignDealer = () => {
        if (!selectedDealerId) {
            toast.error(t('selectDealerError') || 'Please select a dealer');
            return;
        }
        assignDealerMutation.mutate(selectedDealerId);
    };

    const handleRemoveDealer = (dealer: ObserverDealer) => {
        setSelectedDealerForRemove(dealer);
        setRemoveDealerConfirmOpen(true);
    };

    if (isLoadingObserver) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (observerError || !observer) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{tCommon('error') || 'Error'}</AlertTitle>
                    <AlertDescription>
                        {t('loadError') || 'Failed to load observer details. Please try again.'}
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
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/${locale}/admin/observers`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">{observer.name}</h1>
                        <p className="text-muted-foreground mt-1">
                            {t('observerDetails') || 'Observer details and dealer assignments'}
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                        {tCommon('edit') || 'Edit'}
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Observer Bilgileri */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                {t('observerInfo') || 'Observer Information'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('name') || 'Name'}</p>
                                <p className="text-base">{observer.name}</p>
                            </div>
                            {observer.email && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {t('email') || 'Email'}
                                    </p>
                                    <p className="text-base">{observer.email}</p>
                                </div>
                            )}
                            {observer.phone && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        {t('phone') || 'Phone'}
                                    </p>
                                    <p className="text-base">{observer.phone}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('status') || 'Status'}</p>
                                <div className="mt-1">
                                    {observer.isActive ? (
                                        <Badge variant="default">{t('statusActive') || 'Active'}</Badge>
                                    ) : (
                                        <Badge variant="secondary">{t('statusInactive') || 'Inactive'}</Badge>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {t('createdAt') || 'Created At'}
                                </p>
                                <p className="text-base">
                                    {format.dateTime(new Date(observer.createdAt), {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* İstatistikler */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                {t('statistics') || 'Statistics'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('assignedDealers') || 'Assigned Dealers'}
                                </p>
                                <p className="text-2xl font-bold">{observer.assignedDealerCount ?? assignedDealers?.length ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('activeTasks') || 'Active Tasks'}
                                </p>
                                <p className="text-2xl font-bold">{observer.activeTaskCount ?? 0}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Atanmış Bayiler */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    {t('assignedDealers') || 'Assigned Dealers'}
                                </CardTitle>
                                <CardDescription>
                                    {t('assignedDealersDescription') || 'Dealers assigned to this observer'}
                                </CardDescription>
                            </div>
                            <Dialog open={isAssignDealerDialogOpen} onOpenChange={setIsAssignDealerDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('assignDealer') || 'Assign Dealer'}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{t('assignDealer') || 'Assign Dealer'}</DialogTitle>
                                        <DialogDescription>
                                            {t('assignDealerDescription') || 'Select a dealer to assign to this observer'}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <Select value={selectedDealerId} onValueChange={setSelectedDealerId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('selectDealer') || 'Select a dealer'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableDealers.length > 0 ? (
                                                    availableDealers.map((dealer) => (
                                                        <SelectItem key={dealer.id} value={dealer.id}>
                                                            {dealer.name} ({dealer.code})
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                        {t('noAvailableDealers') || 'No available dealers'}
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsAssignDealerDialogOpen(false)}
                                            >
                                                {tCommon('cancel') || 'Cancel'}
                                            </Button>
                                            <Button
                                                onClick={handleAssignDealer}
                                                disabled={!selectedDealerId || assignDealerMutation.isPending}
                                            >
                                                {assignDealerMutation.isPending && (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                )}
                                                {tCommon('assign') || 'Assign'}
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingDealers ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : assignedDealers && assignedDealers.length > 0 ? (
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
                                        {assignedDealers.map((dealer) => (
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
                                                        onClick={() => handleRemoveDealer(dealer)}
                                                        disabled={removeDealerMutation.isPending}
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
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                {observer && (
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{t('editTitle') || 'Edit Observer'}</DialogTitle>
                                <DialogDescription>
                                    {t('editDescription') || 'Update observer information'}
                                </DialogDescription>
                            </DialogHeader>
                            <ObserverForm
                                observer={observer}
                                onSuccess={() => {
                                    setIsEditDialogOpen(false);
                                    queryClient.invalidateQueries({ queryKey: ['admin-observer', observerId] });
                                }}
                                onCancel={() => setIsEditDialogOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                )}

                {/* Remove Dealer Confirmation */}
                <AlertDialog open={removeDealerConfirmOpen} onOpenChange={setRemoveDealerConfirmOpen}>
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
                                    selectedDealerForRemove &&
                                    removeDealerMutation.mutate(selectedDealerForRemove.id)
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {removeDealerMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {tCommon('remove') || 'Remove'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}

