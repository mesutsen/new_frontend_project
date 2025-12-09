'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { customersService } from '@/services/customers.service';
import { vehiclesService } from '@/services/vehicles.service';
import { dealersService } from '@/services/dealers.service';
import { policiesService } from '@/services/policies.service';
import type { PolicyDto } from '@/types/policy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, ArrowLeft, Loader2, Plus, Trash2, FileText, Eye } from 'lucide-react';
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
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import { VehicleForm } from '@/components/vehicles/vehicle-form';

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('Customers');
    const tVehicles = useTranslations('Vehicles');
    const tPolicies = useTranslations('Policies');
    const tCommon = useTranslations('Common');
    const queryClient = useQueryClient();
    const id = params.id as string;
    const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
    const [deleteVehicleDialogOpen, setDeleteVehicleDialogOpen] = useState(false);
    const [selectedVehicleForDelete, setSelectedVehicleForDelete] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['customer', id],
        queryFn: () => customersService.getCustomerById(id),
    });

    const { data: dealer } = useQuery({
        queryKey: ['dealer', data?.dealerId],
        queryFn: () => dealersService.getDealerById(data!.dealerId),
        enabled: !!data?.dealerId,
    });

    const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
        queryKey: ['vehicles', 'customer', id],
        queryFn: () => vehiclesService.getVehiclesByCustomer(id, { page: 1, pageSize: 100 }),
        enabled: !!id,
    });

    const { data: policiesData, isLoading: policiesLoading } = useQuery({
        queryKey: ['policies', 'customer', id],
        queryFn: () => policiesService.getPolicies({ customerId: id, page: 1, pageSize: 100 }),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!data) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold">{t('title')}</h1>
                    <p className="text-muted-foreground">Müşteri bulunamadı.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/${locale}/admin/customers`)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">
                                {data.firstName} {data.lastName}
                            </h1>
                            <p className="text-muted-foreground">{t('description')}</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/${locale}/admin/customers/${id}/edit`)}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        {t('edit')}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kişisel Bilgiler</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('firstName')}</p>
                                <p className="font-medium">{data.firstName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t('lastName')}</p>
                                <p className="font-medium">{data.lastName}</p>
                            </div>
                            {data.nationalId && (
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('nationalId')}</p>
                                    <p className="font-medium">{data.nationalId}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-muted-foreground">{t('email')}</p>
                                <p className="font-medium">{data.email || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t('phone')}</p>
                                <p className="font-medium">{data.phone || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t('status')}</p>
                                <Badge variant={data.isActive ? 'default' : 'secondary'}>
                                    {data.isActive ? t('active') : t('inactive')}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Bayi Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {dealer ? (
                                <>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Bayi Adı</p>
                                        <p className="font-medium">{dealer.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Bayi Kodu</p>
                                        <p className="font-medium">{dealer.code}</p>
                                    </div>
                                    {dealer.email && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">E-posta</p>
                                            <p className="font-medium">{dealer.email}</p>
                                        </div>
                                    )}
                                    {dealer.phone && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Telefon</p>
                                            <p className="font-medium">{dealer.phone}</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-muted-foreground">Bayi bilgisi yükleniyor...</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{tPolicies('title') || 'Poliçeler'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {policiesLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : policiesData?.items && policiesData.items.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{tPolicies('policyNumber') || 'Poliçe No'}</TableHead>
                                        <TableHead>{tPolicies('vehiclePlate') || 'Araç Plakası'}</TableHead>
                                        <TableHead>{tPolicies('policyType') || 'Poliçe Tipi'}</TableHead>
                                        <TableHead>{tPolicies('premium') || 'Prim'}</TableHead>
                                        <TableHead>{tPolicies('startDate') || 'Başlangıç'}</TableHead>
                                        <TableHead>{tPolicies('endDate') || 'Bitiş'}</TableHead>
                                        <TableHead>{tPolicies('status') || 'Durum'}</TableHead>
                                        <TableHead className="text-right">{tCommon('actions') || 'İşlemler'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {policiesData.items.map((policy: PolicyDto) => (
                                        <TableRow key={policy.id}>
                                            <TableCell className="font-medium">
                                                <Button
                                                    variant="link"
                                                    className="p-0 h-auto"
                                                    onClick={() =>
                                                        router.push(`/${locale}/admin/policies/${policy.id}`)
                                                    }
                                                >
                                                    {policy.policyNumber || '-'}
                                                </Button>
                                            </TableCell>
                                            <TableCell>{policy.vehiclePlate || '-'}</TableCell>
                                            <TableCell>{policy.policyType || '-'}</TableCell>
                                            <TableCell>
                                                {new Intl.NumberFormat('tr-TR', {
                                                    style: 'currency',
                                                    currency: 'TRY',
                                                }).format(policy.premium || 0)}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(policy.startDate).toLocaleDateString('tr-TR')}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(policy.endDate).toLocaleDateString('tr-TR')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        policy.status === 'Approved' || policy.status === 'Active'
                                                            ? 'default'
                                                            : policy.status === 'Rejected' ||
                                                              policy.status === 'Cancelled'
                                                            ? 'destructive'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {policy.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        router.push(`/${locale}/admin/policies/${policy.id}`)
                                                    }
                                                    title="Görüntüle"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">
                                Bu müşteriye ait poliçe bulunamadı.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{tVehicles('title')}</CardTitle>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setEditingVehicle(null);
                                    setIsVehicleDialogOpen(true);
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {tVehicles('createButton')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {vehiclesLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : vehiclesData?.items && vehiclesData.items.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{tVehicles('formPlateNumber')}</TableHead>
                                        <TableHead>{tVehicles('formBrand')}</TableHead>
                                        <TableHead>{tVehicles('formModel')}</TableHead>
                                        <TableHead>{tVehicles('formModelYear')}</TableHead>
                                        <TableHead>{tVehicles('formVin')}</TableHead>
                                        <TableHead>{t('status')}</TableHead>
                                        <TableHead className="text-right">{tCommon('actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vehiclesData.items.map((vehicle) => (
                                        <TableRow key={vehicle.id}>
                                            <TableCell className="font-medium">
                                                <Button
                                                    variant="link"
                                                    className="p-0 h-auto"
                                                    onClick={() =>
                                                        router.push(`/${locale}/admin/vehicles/${vehicle.id}`)
                                                    }
                                                >
                                                    {vehicle.plateNumber}
                                                </Button>
                                            </TableCell>
                                            <TableCell>{vehicle.brand || '-'}</TableCell>
                                            <TableCell>{vehicle.model || '-'}</TableCell>
                                            <TableCell>{vehicle.modelYear || '-'}</TableCell>
                                            <TableCell>{vehicle.vin || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={vehicle.isActive ? 'default' : 'secondary'}>
                                                    {vehicle.isActive ? t('active') : t('inactive')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setEditingVehicle(vehicle.id);
                                                            setIsVehicleDialogOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedVehicleForDelete(vehicle.id);
                                                            setDeleteVehicleDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">
                                {tVehicles('noData')}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Araç Ekleme/Düzenleme Dialog */}
                <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingVehicle ? tVehicles('editTitle') : tVehicles('createTitle')}
                            </DialogTitle>
                            <DialogDescription>
                                {editingVehicle ? tVehicles('editDescription') : tVehicles('createDescription')}
                            </DialogDescription>
                        </DialogHeader>
                        {id && (
                            <VehicleForm
                                customerId={id}
                                vehicle={
                                    editingVehicle
                                        ? vehiclesData?.items.find((v) => v.id === editingVehicle) || null
                                        : null
                                }
                                onSuccess={() => {
                                    setIsVehicleDialogOpen(false);
                                    setEditingVehicle(null);
                                    queryClient.invalidateQueries({ queryKey: ['vehicles', 'customer', id] });
                                }}
                                onCancel={() => {
                                    setIsVehicleDialogOpen(false);
                                    setEditingVehicle(null);
                                }}
                            />
                        )}
                    </DialogContent>
                </Dialog>

                {/* Araç Silme Onay Dialog */}
                <AlertDialog open={deleteVehicleDialogOpen} onOpenChange={setDeleteVehicleDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{tVehicles('deleteConfirmTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>{tVehicles('deleteConfirm')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{tVehicles('cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={async () => {
                                    if (selectedVehicleForDelete) {
                                        try {
                                            await vehiclesService.deleteVehicle(selectedVehicleForDelete);
                                            toast.success(tVehicles('deleteSuccess'));
                                            queryClient.invalidateQueries({ queryKey: ['vehicles', 'customer', id] });
                                            setDeleteVehicleDialogOpen(false);
                                            setSelectedVehicleForDelete(null);
                                        } catch (error: any) {
                                            toast.error(error.response?.data?.error || tVehicles('deleteError'));
                                        }
                                    }
                                }}
                            >
                                {tVehicles('delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}

