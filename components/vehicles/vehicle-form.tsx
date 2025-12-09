'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vehiclesService, CreateVehicleRequest, UpdateVehicleRequest } from '@/services/vehicles.service';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Upload, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Vehicle } from '@/services/vehicles.service';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// Türkiye plaka formatı kaba doğrulama (Örnek: 34 ABC 123)
const plateRegex = /^(0[1-9]|[1-7][0-9]|8[01])\s?[A-ZÇĞİÖŞÜ]{1,3}\s?\d{2,4}$/i;

const vehicleSchema = z.object({
    plateNumber: z.string().min(2, 'Plaka gereklidir').regex(plateRegex, 'Geçerli bir plaka giriniz'),
    brand: z.string().min(1, 'Marka gereklidir'),
    model: z.string().min(1, 'Model gereklidir'),
    modelYear: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
    vin: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
    customerId: string;
    vehicle?: Vehicle | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function VehicleForm({ customerId, vehicle, onSuccess, onCancel }: VehicleFormProps) {
    const t = useTranslations('Vehicles');
    const tCommon = useTranslations('Common');
    const queryClient = useQueryClient();
    const [selectedBrand, setSelectedBrand] = useState(vehicle?.brand || '');
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [documentPreview, setDocumentPreview] = useState<string | null>(vehicle?.registrationImageUrl || null);
    const [isAddBrandDialogOpen, setIsAddBrandDialogOpen] = useState(false);
    const [isAddModelDialogOpen, setIsAddModelDialogOpen] = useState(false);
    const [newBrand, setNewBrand] = useState('');
    const [newModel, setNewModel] = useState('');
    const [localBrands, setLocalBrands] = useState<string[]>([]);
    const [localModels, setLocalModels] = useState<string[]>([]);
    const prevBrandRef = useRef<string>('');

    const form = useForm<VehicleFormValues>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            plateNumber: vehicle?.plateNumber || '',
            brand: vehicle?.brand || '',
            model: vehicle?.model || '',
            modelYear: vehicle?.modelYear || undefined,
            vin: vehicle?.vin || '',
        },
    });

    // Markaları getir
    const { data: brandsData = [] } = useQuery({
        queryKey: ['vehicle-brands'],
        queryFn: () => vehiclesService.getBrands(),
    });

    // Local brands listesini güncelle
    useEffect(() => {
        if (brandsData.length > 0) {
            setLocalBrands([...brandsData]);
        }
    }, [brandsData]);

    // Seçili markaya ait modelleri getir
    const { data: modelsData = [] } = useQuery({
        queryKey: ['vehicle-models', selectedBrand],
        queryFn: () => vehiclesService.getModels(selectedBrand),
        enabled: !!selectedBrand,
    });

    // Local models listesini güncelle (backend'den gelen modellerle başlat)
    // selectedBrand değiştiğinde modelleri sıfırla (yukarıdaki useEffect'te yapılıyor)
    const modelsDataString = JSON.stringify(modelsData);
    useEffect(() => {
        if (!selectedBrand) {
            return;
        }

        const backendModels = modelsData || [];
        if (backendModels.length > 0) {
            // Backend'den gelen modelleri kullan
            setLocalModels((prev) => {
                // Local'de eklenen modelleri filtrele (sadece backend'de olmayanlar)
                const newLocalModels = prev.filter((m) => !backendModels.includes(m));
                // Birleştir ve sırala
                const combined = [...new Set([...backendModels, ...newLocalModels])].sort();
                // Eğer değişiklik yoksa, önceki değeri döndür (sonsuz döngüyü önle)
                if (combined.length === prev.length && combined.every((m, i) => m === prev[i])) {
                    return prev;
                }
                return combined;
            });
        }
    }, [modelsDataString, selectedBrand]);

    // Yeni marka ekle
    const handleAddBrand = () => {
        if (newBrand.trim()) {
            const brand = newBrand.trim();
            if (!localBrands.includes(brand)) {
                setLocalBrands([...localBrands, brand].sort());
                form.setValue('brand', brand);
                setSelectedBrand(brand);
                setNewBrand('');
                setIsAddBrandDialogOpen(false);
                toast.success(t('brandAddedSuccess'));
            } else {
                toast.error(t('brandAlreadyExists'));
            }
        }
    };

    // Yeni model ekle
    const handleAddModel = () => {
        if (newModel.trim() && selectedBrand) {
            const model = newModel.trim();
            if (!localModels.includes(model)) {
                // Yeni modeli listeye ekle
                setLocalModels((prev) => [...prev, model].sort());
                // Form'a set et
                form.setValue('model', model);
                setNewModel('');
                setIsAddModelDialogOpen(false);
                toast.success(t('modelAddedSuccess'));
            } else {
                toast.error(t('modelAlreadyExists'));
            }
        }
    };

    // Marka değiştiğinde modeli sıfırla
    const selectedBrandValue = form.watch('brand');
    useEffect(() => {
        // Sadece marka gerçekten değiştiyse işlem yap
        if (selectedBrandValue !== prevBrandRef.current) {
            const prevBrand = prevBrandRef.current;
            prevBrandRef.current = selectedBrandValue || '';
            
            // selectedBrand state'ini güncelle
            setSelectedBrand(selectedBrandValue || '');
            
            // Marka değiştiyse modeli sıfırla
            if (prevBrand && prevBrand !== selectedBrandValue) {
                form.setValue('model', '');
                setLocalModels([]); // Modelleri sıfırla, backend'den yüklenecek
            } else if (!selectedBrandValue) {
                // Marka seçilmemişse
                setLocalModels([]);
            }
        }
    }, [selectedBrandValue, form]);

    const createMutation = useMutation({
        mutationFn: (data: CreateVehicleRequest) => vehiclesService.createVehicle(data),
        onSuccess: async (createdVehicle) => {
            // Doküman yükleme varsa
            if (documentFile) {
                try {
                    await vehiclesService.uploadDocument(createdVehicle.id, documentFile);
                } catch (error: any) {
                    toast.error(error.response?.data?.error || t('uploadDocumentError'));
                }
            }
            toast.success(t('createSuccess'));
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            // Marka ve model listelerini de yenile (yeni eklenen marka/model veritabanına kaydedildi)
            queryClient.invalidateQueries({ queryKey: ['vehicle-brands'] });
            queryClient.invalidateQueries({ queryKey: ['vehicle-models'] });
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || t('createError'));
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; payload: UpdateVehicleRequest }) =>
            vehiclesService.updateVehicle(data.id, data.payload),
        onSuccess: async (updatedVehicle) => {
            // Doküman yükleme varsa
            if (documentFile) {
                try {
                    await vehiclesService.uploadDocument(updatedVehicle.id, documentFile);
                } catch (error: any) {
                    toast.error(error.response?.data?.error || t('uploadDocumentError'));
                }
            }
            toast.success(t('updateSuccess'));
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            // Marka ve model listelerini de yenile (yeni eklenen marka/model veritabanına kaydedildi)
            queryClient.invalidateQueries({ queryKey: ['vehicle-brands'] });
            queryClient.invalidateQueries({ queryKey: ['vehicle-models'] });
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || t('updateError'));
        },
    });

    const onSubmit = (data: VehicleFormValues) => {
        if (vehicle) {
            updateMutation.mutate({
                id: vehicle.id,
                payload: {
                    plateNumber: data.plateNumber.trim().toUpperCase(),
                    brand: data.brand,
                    model: data.model,
                    modelYear: data.modelYear,
                    vin: data.vin || undefined,
                    isActive: vehicle.isActive,
                },
            });
        } else {
            createMutation.mutate({
                customerId,
                plateNumber: data.plateNumber.trim().toUpperCase(),
                brand: data.brand,
                model: data.model,
                modelYear: data.modelYear,
                vin: data.vin || undefined,
            });
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Dosya tipi kontrolü
            if (!file.type.startsWith('image/')) {
                toast.error(t('invalidFileType'));
                return;
            }
            // Dosya boyutu kontrolü (10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error(t('fileTooLarge'));
                return;
            }
            setDocumentFile(file);
            // Preview oluştur
            const reader = new FileReader();
            reader.onloadend = () => {
                setDocumentPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveFile = () => {
        setDocumentFile(null);
        setDocumentPreview(null);
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formBrand')}</FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        if (value === '__add_new_brand__') {
                                            setIsAddBrandDialogOpen(true);
                                            // Select'i resetle
                                            setTimeout(() => {
                                                field.onChange('');
                                            }, 0);
                                        } else {
                                            field.onChange(value);
                                        }
                                    }}
                                    value={field.value === '__add_new_brand__' ? '' : field.value}
                                    disabled={isLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('formBrandPlaceholder')} />
                                        </SelectTrigger>
                                    </FormControl>
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
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formModel')}</FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        if (value === '__add_new_model__') {
                                            setIsAddModelDialogOpen(true);
                                            // Select'i resetle
                                            setTimeout(() => {
                                                field.onChange('');
                                            }, 0);
                                        } else {
                                            field.onChange(value);
                                        }
                                    }}
                                    value={field.value === '__add_new_model__' ? '' : field.value}
                                    disabled={isLoading || !selectedBrand}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('formModelPlaceholder')} />
                                        </SelectTrigger>
                                    </FormControl>
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
                                <FormDescription>
                                    {!selectedBrand && t('formModelDescription')}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="plateNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formPlateNumber')}</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="34 ABC 123"
                                        {...field}
                                        disabled={isLoading}
                                        className="uppercase"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="modelYear"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('formModelYear')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder={new Date().getFullYear().toString()}
                                        {...field}
                                        value={field.value || ''}
                                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="vin"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formVin')}</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={t('formVinPlaceholder')}
                                    {...field}
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormDescription>{t('formVinDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-2">
                    <FormLabel>{t('formRegistrationDocument')}</FormLabel>
                    {documentPreview ? (
                        <div className="relative">
                            <img
                                src={documentPreview}
                                alt="Ruhsat önizleme"
                                className="w-full h-48 object-contain border rounded-md"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={handleRemoveFile}
                                disabled={isLoading}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed rounded-md p-6 text-center">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">
                                {t('formRegistrationDocumentDescription')}
                            </p>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                disabled={isLoading}
                                className="hidden"
                                id="registration-document"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('registration-document')?.click()}
                                disabled={isLoading}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                {t('formUploadDocument')}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                        {tCommon('cancel')}
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {vehicle ? t('updateButton') : t('createButton')}
                    </Button>
                </div>
            </form>

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
                                {tCommon('cancel')}
                            </Button>
                            <Button type="button" onClick={handleAddBrand} disabled={!newBrand.trim()}>
                                {t('addButton')}
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
                                {tCommon('cancel')}
                            </Button>
                            <Button
                                type="button"
                                onClick={handleAddModel}
                                disabled={!newModel.trim() || !selectedBrand}
                            >
                                {t('addButton')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Form>
    );
}

