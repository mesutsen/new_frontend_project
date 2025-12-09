'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { vehiclesService, Vehicle, CreateVehicleRequest, UpdateVehicleRequest } from '@/services/vehicles.service';
import { customersService } from '@/services/customers.service';
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
    Eye,
    Car,
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
import { Checkbox } from '@/components/ui/checkbox';

const vehicleSchema = z.object({
    customerId: z.string().min(1, 'Müşteri seçilmelidir'),
    plateNumber: z.string().min(1, 'Plaka gereklidir'),
    brand: z.string().optional(),
    model: z.string().optional(),
    modelYear: z.number().optional(),
    vin: z.string().optional(),
});

const updateVehicleSchema = z.object({
    plateNumber: z.string().min(1, 'Plaka gereklidir'),
    brand: z.string().optional(),
    model: z.string().optional(),
    modelYear: z.number().optional(),
    vin: z.string().optional(),
    isActive: z.boolean(),
});

export default function DealerVehiclesPage() {
    const t = useTranslations('Vehicles');
    const locale = useLocale();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [search, setSearch] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [isAddBrandDialogOpen, setIsAddBrandDialogOpen] = useState(false);
    const [isAddModelDialogOpen, setIsAddModelDialogOpen] = useState(false);
    const [newBrand, setNewBrand] = useState('');
    const [newModel, setNewModel] = useState('');
    const [localBrands, setLocalBrands] = useState<string[]>([]);
    const [localModels, setLocalModels] = useState<string[]>([]);
    const prevBrandRef = useRef<string>('');

    // Get current dealer
    const { data: dealer } = useQuery({
        queryKey: ['current-dealer'],
        queryFn: () => dealersService.getCurrentDealer(),
        retry: false,
    });

    // Get dealer's customers only
    const { data: customersData } = useQuery({
        queryKey: ['customers', 'dealer', dealer?.id],
        queryFn: () =>
            customersService.getCustomers({
                page: 1,
                pageSize: 1000,
                dealerId: dealer?.id,
            }),
        enabled: !!dealer?.id,
    });

    // Get brands
    const { data: brands } = useQuery({
        queryKey: ['vehicle-brands'],
        queryFn: () => vehiclesService.getBrands(),
    });

    // Get models for selected brand
    const { data: models } = useQuery({
        queryKey: ['vehicle-models', selectedBrand],
        queryFn: () => vehiclesService.getModels(selectedBrand),
        enabled: !!selectedBrand,
    });

    // Get vehicles - filter by dealer's customers
    const { data, isLoading, error } = useQuery({
        queryKey: ['vehicles', 'dealer', dealer?.id, page, pageSize, search, selectedCustomerId],
        queryFn: () => {
            // If a specific customer is selected, get their vehicles
            if (selectedCustomerId) {
                return vehiclesService.getVehiclesByCustomer(selectedCustomerId, {
                    page,
                    pageSize,
                    search: search || undefined,
                });
            }
            // Otherwise, get all vehicles for dealer's customers
            // We need to filter by customer IDs on the backend or fetch all and filter
            // For now, we'll get vehicles for all dealer's customers
            const customerIds = customersData?.items.map((c) => c.id) || [];
            if (customerIds.length === 0) {
                return Promise.resolve({
                    items: [],
                    totalCount: 0,
                    page: 1,
                    pageSize: 20,
                    totalPages: 0,
                });
            }
            // Get vehicles for first customer as a workaround - backend should support multiple customer IDs
            // For now, we'll use the search endpoint or get all and filter client-side
            return vehiclesService.getVehicles({
                page,
                pageSize,
                search: search || undefined,
            });
        },
        enabled: !!dealer?.id,
    });

    // Filter vehicles by dealer's customers on client side if needed
    const filteredVehicles = data?.items.filter((vehicle) => {
        if (!customersData?.items) return false;
        return customersData.items.some((customer) => customer.id === vehicle.customerId);
    }) || [];

    const createForm = useForm<CreateVehicleRequest>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            customerId: '',
            plateNumber: '',
            brand: '',
            model: '',
            modelYear: undefined,
            vin: '',
        },
    });

    // Local brands listesini güncelle
    useEffect(() => {
        if (brands && brands.length > 0) {
            setLocalBrands([...brands]);
        }
    }, [brands]);

    // Local models listesini güncelle
    useEffect(() => {
        if (!selectedBrand) {
            setLocalModels([]);
            return;
        }

        const backendModels = models || [];
        if (backendModels.length > 0) {
            setLocalModels((prev) => {
                const newLocalModels = prev.filter((m) => !backendModels.includes(m));
                const combined = [...new Set([...backendModels, ...newLocalModels])].sort();
                if (combined.length === prev.length && combined.every((m, i) => m === prev[i])) {
                    return prev;
                }
                return combined;
            });
        }
    }, [models, selectedBrand]);

    // Marka değiştiğinde modeli sıfırla
    const selectedBrandValue = createForm.watch('brand');
    useEffect(() => {
        if (selectedBrandValue !== prevBrandRef.current) {
            const prevBrand = prevBrandRef.current;
            prevBrandRef.current = selectedBrandValue || '';
            setSelectedBrand(selectedBrandValue || '');
            
            if (prevBrand && prevBrand !== selectedBrandValue) {
                createForm.setValue('model', '');
                setLocalModels([]);
            } else if (!selectedBrandValue) {
                setLocalModels([]);
            }
        }
    }, [selectedBrandValue, createForm]);

    // Yeni marka ekle
    const handleAddBrand = () => {
        if (newBrand.trim()) {
            const brand = newBrand.trim();
            if (!localBrands.includes(brand)) {
                setLocalBrands([...localBrands, brand].sort());
                // Hangi form aktifse ona set et
                if (isEdit) {
                    updateForm.setValue('brand', brand);
                } else {
                    createForm.setValue('brand', brand);
                }
                setSelectedBrand(brand);
                setNewBrand('');
                setIsAddBrandDialogOpen(false);
                toast.success(t('brandAddedSuccess'));
            } else {
                toast.error(t('brandAlreadyExists') || 'Bu marka zaten mevcut');
            }
        }
    };

    // Yeni model ekle
    const handleAddModel = () => {
        if (newModel.trim() && selectedBrand) {
            const model = newModel.trim();
            if (!localModels.includes(model)) {
                setLocalModels((prev) => [...prev, model].sort());
                // Hangi form aktifse ona set et
                if (isEdit) {
                    updateForm.setValue('model', model);
                } else {
                    createForm.setValue('model', model);
                }
                setNewModel('');
                setIsAddModelDialogOpen(false);
                toast.success(t('modelAddedSuccess'));
            } else {
                toast.error(t('modelAlreadyExists') || 'Bu model zaten mevcut');
            }
        }
    };

    const updateForm = useForm<UpdateVehicleRequest>({
        resolver: zodResolver(updateVehicleSchema),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateVehicleRequest) => vehiclesService.createVehicle(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            // Marka ve model listelerini de yenile (yeni eklenen marka/model veritabanına kaydedildi)
            queryClient.invalidateQueries({ queryKey: ['vehicle-brands'] });
            queryClient.invalidateQueries({ queryKey: ['vehicle-models'] });
            setDialogOpen(false);
            createForm.reset();
            setSelectedBrand('');
            toast.success(t('createSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('createError'));
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateVehicleRequest }) =>
            vehiclesService.updateVehicle(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            // Marka ve model listelerini de yenile (yeni eklenen marka/model veritabanına kaydedildi)
            queryClient.invalidateQueries({ queryKey: ['vehicle-brands'] });
            queryClient.invalidateQueries({ queryKey: ['vehicle-models'] });
            setDialogOpen(false);
            setSelectedVehicle(null);
            toast.success(t('updateSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('updateError'));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => vehiclesService.deleteVehicle(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            setDeleteDialogOpen(false);
            setSelectedVehicle(null);
            toast.success(t('deleteSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('deleteError'));
        },
    });

    const handleCreate = () => {
        setIsEdit(false);
        setSelectedVehicle(null);
        createForm.reset();
        setSelectedBrand('');
        setDialogOpen(true);
    };

    const handleEdit = (vehicle: Vehicle) => {
        setIsEdit(true);
        setSelectedVehicle(vehicle);
        const vehicleBrand = vehicle.brand || '';
        setSelectedBrand(vehicleBrand);
        updateForm.reset({
            plateNumber: vehicle.plateNumber,
            brand: vehicleBrand,
            model: vehicle.model || '',
            modelYear: vehicle.modelYear,
            vin: vehicle.vin || '',
            isActive: vehicle.isActive,
        });
        // Eğer marka localBrands'de yoksa ekle
        if (vehicleBrand && !localBrands.includes(vehicleBrand)) {
            setLocalBrands((prev) => [...prev, vehicleBrand].sort());
        }
        // Eğer model localModels'de yoksa ekle
        if (vehicle.model && vehicleBrand) {
            setLocalModels((prev) => {
                if (!prev.includes(vehicle.model!)) {
                    return [...prev, vehicle.model!].sort();
                }
                return prev;
            });
        }
        setDialogOpen(true);
    };

    const handleDelete = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setDeleteDialogOpen(true);
    };

    const handleView = (vehicle: Vehicle) => {
        router.push(`/${locale}/dealer/vehicles/${vehicle.id}`);
    };

    const onSubmitCreate = (data: CreateVehicleRequest) => {
        createMutation.mutate({
            ...data,
            modelYear: data.modelYear ? Number(data.modelYear) : undefined,
        });
    };

    const onSubmitUpdate = (data: UpdateVehicleRequest) => {
        if (selectedVehicle) {
            updateMutation.mutate({
                id: selectedVehicle.id,
                data: {
                    ...data,
                    modelYear: data.modelYear ? Number(data.modelYear) : undefined,
                },
            });
        }
    };

    if (error) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('errorTitle') || 'Hata'}</AlertTitle>
                    <AlertDescription>{t('errorDescription') || 'Araçlar yüklenirken bir hata oluştu'}</AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    const displayData = {
        items: filteredVehicles,
        totalCount: filteredVehicles.length,
        page: data?.page || 1,
        pageSize: data?.pageSize || 20,
        totalPages: Math.ceil(filteredVehicles.length / pageSize),
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('title')}</h1>
                        <p className="text-muted-foreground">{t('description')}</p>
                    </div>
                    <Button onClick={handleCreate} disabled={!dealer?.id}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('createButton')}
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Plaka, marka veya model ara..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={selectedCustomerId || 'all'}
                        onValueChange={(value) => {
                            setSelectedCustomerId(value === 'all' ? undefined : value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Müşteri Filtrele" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Müşterilerim</SelectItem>
                            {customersData?.items.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                    {customer.firstName} {customer.lastName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : !displayData.items || displayData.items.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">{t('noData')}</div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Plaka</TableHead>
                                        <TableHead>Marka</TableHead>
                                        <TableHead>Model</TableHead>
                                        <TableHead>Model Yılı</TableHead>
                                        <TableHead>Şasi No</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayData.items.map((vehicle) => (
                                        <TableRow key={vehicle.id}>
                                            <TableCell className="font-medium">{vehicle.plateNumber}</TableCell>
                                            <TableCell>{vehicle.brand || '-'}</TableCell>
                                            <TableCell>{vehicle.model || '-'}</TableCell>
                                            <TableCell>{vehicle.modelYear || '-'}</TableCell>
                                            <TableCell>{vehicle.vin || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={vehicle.isActive ? 'default' : 'secondary'}>
                                                    {vehicle.isActive ? 'Aktif' : 'Pasif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleView(vehicle)}
                                                        title="Görüntüle"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(vehicle)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(vehicle)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {displayData.totalCount > pageSize && (
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, displayData.totalCount)} arası, toplam {displayData.totalCount} sonuç
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm">
                                        Sayfa {page} / {displayData.totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={page >= displayData.totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create/Edit Dialog - Same as admin version */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? t('editTitle') : t('createTitle')}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? t('editDescription') : t('createDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    {isEdit ? (
                        <Form {...updateForm}>
                            <form onSubmit={updateForm.handleSubmit(onSubmitUpdate)} className="space-y-4">
                                <FormField
                                    control={updateForm.control}
                                    name="plateNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('formPlateNumber')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="34 ABC 123" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={updateForm.control}
                                        name="brand"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formBrand')}</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value === '__add_new_brand__' ? '' : field.value || ''}
                                                        onValueChange={(value) => {
                                                            if (value === '__add_new_brand__') {
                                                                setIsAddBrandDialogOpen(true);
                                                                setTimeout(() => {
                                                                    field.onChange('');
                                                                }, 0);
                                                            } else {
                                                                field.onChange(value);
                                                                setSelectedBrand(value);
                                                                updateForm.setValue('model', '');
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t('formBrandPlaceholder')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {localBrands.map((brand) => (
                                                                <SelectItem key={brand} value={brand}>
                                                                    {brand}
                                                                </SelectItem>
                                                            ))}
                                                            <SelectItem
                                                                value="__add_new_brand__"
                                                                className="text-primary font-medium"
                                                            >
                                                                <Plus className="inline h-4 w-4 mr-2" />
                                                                {t('addNewBrand')}
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={updateForm.control}
                                        name="model"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formModel')}</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value === '__add_new_model__' ? '' : field.value || ''}
                                                        onValueChange={(value) => {
                                                            if (value === '__add_new_model__') {
                                                                setIsAddModelDialogOpen(true);
                                                                setTimeout(() => {
                                                                    field.onChange('');
                                                                }, 0);
                                                            } else {
                                                                field.onChange(value);
                                                            }
                                                        }}
                                                        disabled={!selectedBrand}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t('formModelPlaceholder')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {localModels.map((model) => (
                                                                <SelectItem key={model} value={model}>
                                                                    {model}
                                                                </SelectItem>
                                                            ))}
                                                            {selectedBrand && (
                                                                <SelectItem
                                                                    value="__add_new_model__"
                                                                    className="text-primary font-medium"
                                                                >
                                                                    <Plus className="inline h-4 w-4 mr-2" />
                                                                    {t('addNewModel')}
                                                                </SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={updateForm.control}
                                        name="modelYear"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formModelYear')}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        value={field.value || ''}
                                                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                        placeholder="2024"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={updateForm.control}
                                        name="vin"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formVin')}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder={t('formVinPlaceholder')} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={updateForm.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Aktif</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDialogOpen(false)}
                                    >
                                        {t('cancel') || 'İptal'}
                                    </Button>
                                    <Button type="submit" disabled={updateMutation.isPending}>
                                        {updateMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {t('updateButton')}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    ) : (
                        <Form {...createForm}>
                            <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
                                <FormField
                                    control={createForm.control}
                                    name="customerId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Müşteri</FormLabel>
                                            <FormControl>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Müşteri seçin" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {customersData?.items.map((customer) => (
                                                            <SelectItem key={customer.id} value={customer.id}>
                                                                {customer.firstName} {customer.lastName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="plateNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('formPlateNumber')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="34 ABC 123" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={createForm.control}
                                        name="brand"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formBrand')}</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value === '__add_new_brand__' ? '' : field.value || ''}
                                                        onValueChange={(value) => {
                                                            if (value === '__add_new_brand__') {
                                                                setIsAddBrandDialogOpen(true);
                                                                setTimeout(() => {
                                                                    field.onChange('');
                                                                }, 0);
                                                            } else {
                                                                field.onChange(value);
                                                                setSelectedBrand(value);
                                                                createForm.setValue('model', '');
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t('formBrandPlaceholder')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {localBrands.map((brand) => (
                                                                <SelectItem key={brand} value={brand}>
                                                                    {brand}
                                                                </SelectItem>
                                                            ))}
                                                            <SelectItem
                                                                value="__add_new_brand__"
                                                                className="text-primary font-medium"
                                                            >
                                                                <Plus className="inline h-4 w-4 mr-2" />
                                                                {t('addNewBrand')}
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={createForm.control}
                                        name="model"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formModel')}</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value === '__add_new_model__' ? '' : field.value || ''}
                                                        onValueChange={(value) => {
                                                            if (value === '__add_new_model__') {
                                                                setIsAddModelDialogOpen(true);
                                                                setTimeout(() => {
                                                                    field.onChange('');
                                                                }, 0);
                                                            } else {
                                                                field.onChange(value);
                                                            }
                                                        }}
                                                        disabled={!selectedBrand}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t('formModelPlaceholder')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {localModels.map((model) => (
                                                                <SelectItem key={model} value={model}>
                                                                    {model}
                                                                </SelectItem>
                                                            ))}
                                                            {selectedBrand && (
                                                                <SelectItem
                                                                    value="__add_new_model__"
                                                                    className="text-primary font-medium"
                                                                >
                                                                    <Plus className="inline h-4 w-4 mr-2" />
                                                                    {t('addNewModel')}
                                                                </SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={createForm.control}
                                        name="modelYear"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formModelYear')}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        value={field.value || ''}
                                                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                        placeholder="2024"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={createForm.control}
                                        name="vin"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formVin')}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder={t('formVinPlaceholder')} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDialogOpen(false)}
                                    >
                                        {t('cancel') || 'İptal'}
                                    </Button>
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        {createMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {t('createButton')}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Yeni Marka Ekleme Dialog */}
            <Dialog open={isAddBrandDialogOpen} onOpenChange={setIsAddBrandDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('addNewBrandTitle')}</DialogTitle>
                        <DialogDescription>{t('addNewBrandDescription')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder={t('formBrandPlaceholder')}
                            value={newBrand}
                            onChange={(e) => setNewBrand(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddBrand();
                                }
                            }}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsAddBrandDialogOpen(false);
                                    setNewBrand('');
                                }}
                            >
                                {t('cancel') || 'İptal'}
                            </Button>
                            <Button type="button" onClick={handleAddBrand} disabled={!newBrand.trim()}>
                                {t('addButton') || 'Ekle'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Yeni Model Ekleme Dialog */}
            <Dialog open={isAddModelDialogOpen} onOpenChange={setIsAddModelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('addNewModelTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('addNewModelDescription', { brand: selectedBrand })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder={t('formModelPlaceholder')}
                            value={newModel}
                            onChange={(e) => setNewModel(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddModel();
                                }
                            }}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsAddModelDialogOpen(false);
                                    setNewModel('');
                                }}
                            >
                                {t('cancel') || 'İptal'}
                            </Button>
                            <Button
                                type="button"
                                onClick={handleAddModel}
                                disabled={!newModel.trim() || !selectedBrand}
                            >
                                {t('addButton') || 'Ekle'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('deleteConfirm')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel') || 'İptal'}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedVehicle && deleteMutation.mutate(selectedVehicle.id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {t('delete') || 'Sil'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}

