'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { policyTypesService, type PolicyType, type CreatePolicyTypeRequest, type UpdatePolicyTypeRequest } from '@/services/policy-types.service';
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
    FormDescription,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Search,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
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
import { Switch } from '@/components/ui/switch';

const policyTypeSchema = z.object({
    name: z.string().min(1, 'Ad gereklidir'),
    code: z.string().min(1, 'Kod gereklidir').regex(/^[A-Z0-9_]+$/, 'Kod sadece büyük harf, rakam ve alt çizgi içerebilir'),
    description: z.string().optional(),
    isActive: z.boolean(),
    defaultDealerCommissionRate: z.number().min(0).max(1),
    defaultObserverCommissionRate: z.number().min(0).max(1),
    defaultAdminCommissionRate: z.number().min(0).max(1),
});

const updatePolicyTypeSchema = z.object({
    name: z.string().min(1, 'Ad gereklidir'),
    description: z.string().optional(),
    isActive: z.boolean(),
    defaultDealerCommissionRate: z.number().min(0).max(1),
    defaultObserverCommissionRate: z.number().min(0).max(1),
    defaultAdminCommissionRate: z.number().min(0).max(1),
});

export default function PolicyTypesPage() {
    const t = useTranslations('PolicyTypes');
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedPolicyType, setSelectedPolicyType] = useState<PolicyType | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['policy-types', page, search, isActiveFilter],
        queryFn: () => policyTypesService.getList({ page, pageSize: 20, search, isActive: isActiveFilter }),
    });

    const createForm = useForm<CreatePolicyTypeRequest>({
        resolver: zodResolver(policyTypeSchema),
        defaultValues: {
            name: '',
            code: '',
            description: '',
            isActive: true,
            defaultDealerCommissionRate: 0.10,
            defaultObserverCommissionRate: 0.05,
            defaultAdminCommissionRate: 0.03,
        },
    });

    const updateForm = useForm<UpdatePolicyTypeRequest>({
        resolver: zodResolver(updatePolicyTypeSchema),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreatePolicyTypeRequest) => policyTypesService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policy-types'] });
            setDialogOpen(false);
            createForm.reset();
            toast.success(t('createSuccess') || 'Poliçe türü başarıyla oluşturuldu');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || t('createError') || 'Poliçe türü oluşturulurken bir hata oluştu');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdatePolicyTypeRequest }) =>
            policyTypesService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policy-types'] });
            setDialogOpen(false);
            setSelectedPolicyType(null);
            updateForm.reset();
            toast.success(t('updateSuccess') || 'Poliçe türü başarıyla güncellendi');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || t('updateError') || 'Poliçe türü güncellenirken bir hata oluştu');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => policyTypesService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policy-types'] });
            setDeleteDialogOpen(false);
            setSelectedPolicyType(null);
            toast.success(t('deleteSuccess') || 'Poliçe türü başarıyla silindi');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || t('deleteError') || 'Poliçe türü silinirken bir hata oluştu');
        },
    });

    const handleCreate = () => {
        setIsEdit(false);
        setSelectedPolicyType(null);
        createForm.reset();
        setDialogOpen(true);
    };

    const handleEdit = (policyType: PolicyType) => {
        setIsEdit(true);
        setSelectedPolicyType(policyType);
        updateForm.reset({
            name: policyType.name,
            description: policyType.description || '',
            isActive: policyType.isActive,
            defaultDealerCommissionRate: policyType.defaultDealerCommissionRate,
            defaultObserverCommissionRate: policyType.defaultObserverCommissionRate,
            defaultAdminCommissionRate: policyType.defaultAdminCommissionRate,
        });
        setDialogOpen(true);
    };

    const handleDelete = (policyType: PolicyType) => {
        setSelectedPolicyType(policyType);
        setDeleteDialogOpen(true);
    };

    const onSubmitCreate = (data: CreatePolicyTypeRequest) => {
        createMutation.mutate(data);
    };

    const onSubmitUpdate = (data: UpdatePolicyTypeRequest) => {
        if (selectedPolicyType) {
            updateMutation.mutate({ id: selectedPolicyType.id, data });
        }
    };

    if (error) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Hata</AlertTitle>
                    <AlertDescription>Veriler yüklenirken bir hata oluştu</AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('title') || 'Poliçe Türleri'}</h1>
                        <p className="text-muted-foreground">{t('description') || 'Poliçe türlerini görüntüleyin ve yönetin'}</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('createButton') || 'Yeni Poliçe Türü'}
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={t('searchPlaceholder') || 'Ara...'}
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-10"
                        />
                    </div>
                    <select
                        value={isActiveFilter === undefined ? 'all' : isActiveFilter ? 'active' : 'inactive'}
                        onChange={(e) => {
                            setIsActiveFilter(e.target.value === 'all' ? undefined : e.target.value === 'active');
                            setPage(1);
                        }}
                        className="rounded-md border border-input bg-background px-3 py-2"
                    >
                        <option value="all">Tümü</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Pasif</option>
                    </select>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ad</TableHead>
                                <TableHead>Kod</TableHead>
                                <TableHead>Bayi Komisyon</TableHead>
                                <TableHead>Gözlemci Komisyon</TableHead>
                                <TableHead>Admin Komisyon</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            ) : data?.items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        {t('noData') || 'Poliçe türü bulunamadı'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.items.map((policyType: PolicyType) => (
                                    <TableRow key={policyType.id}>
                                        <TableCell className="font-medium">{policyType.name}</TableCell>
                                        <TableCell>{policyType.code}</TableCell>
                                        <TableCell>{(policyType.defaultDealerCommissionRate * 100).toFixed(2)}%</TableCell>
                                        <TableCell>{(policyType.defaultObserverCommissionRate * 100).toFixed(2)}%</TableCell>
                                        <TableCell>{(policyType.defaultAdminCommissionRate * 100).toFixed(2)}%</TableCell>
                                        <TableCell>
                                            <Badge variant={policyType.isActive ? 'default' : 'secondary'}>
                                                {policyType.isActive ? 'Aktif' : 'Pasif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(policyType)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(policyType)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {data && data.total > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Toplam {data.total} kayıt, Sayfa {page} / {Math.ceil(data.total / 20)}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= Math.ceil(data.total / 20)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Create/Edit Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {isEdit ? t('editTitle') || 'Poliçe Türü Düzenle' : t('createTitle') || 'Yeni Poliçe Türü Oluştur'}
                            </DialogTitle>
                            <DialogDescription>
                                {isEdit ? t('editDescription') || 'Poliçe türü bilgilerini güncelleyin' : t('createDescription') || 'Yeni bir poliçe türü ekleyin'}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...(isEdit ? updateForm : createForm)}>
                            <form
                                onSubmit={(isEdit ? updateForm : createForm).handleSubmit(isEdit ? onSubmitUpdate : onSubmitCreate)}
                                className="space-y-4"
                            >
                                {!isEdit && (
                                    <FormField
                                        control={createForm.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Kod *</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="KASKO" />
                                                </FormControl>
                                                <FormDescription>Büyük harf, rakam ve alt çizgi kullanın</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                <FormField
                                    control={(isEdit ? updateForm : createForm).control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ad *</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={(isEdit ? updateForm : createForm).control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Açıklama</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField
                                        control={(isEdit ? updateForm : createForm).control}
                                        name="defaultDealerCommissionRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bayi Komisyon Oranı</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="1"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                                <FormDescription>Örn: 0.10 = %10</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={(isEdit ? updateForm : createForm).control}
                                        name="defaultObserverCommissionRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gözlemci Komisyon Oranı</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="1"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                                <FormDescription>Örn: 0.05 = %5</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={(isEdit ? updateForm : createForm).control}
                                        name="defaultAdminCommissionRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Admin Komisyon Oranı</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="1"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                                <FormDescription>Örn: 0.03 = %3</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={(isEdit ? updateForm : createForm).control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel>Aktif</FormLabel>
                                                <FormDescription>Poliçe türünün aktif olup olmadığını belirler</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDialogOpen(false)}
                                    >
                                        İptal
                                    </Button>
                                    <Button type="submit" disabled={(isEdit ? updateMutation : createMutation).isPending}>
                                        {(isEdit ? updateMutation : createMutation).isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {isEdit ? 'Güncelle' : 'Oluştur'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('deleteConfirmTitle') || 'Poliçe Türünü Sil'}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('deleteConfirm') || 'Bu poliçe türünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    if (selectedPolicyType) {
                                        deleteMutation.mutate(selectedPolicyType.id);
                                    }
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Sil
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}

