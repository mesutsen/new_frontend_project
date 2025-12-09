'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { customersService, Customer, CreateCustomerRequest, UpdateCustomerRequest } from '@/services/customers.service';
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
    Building2,
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

const customerSchema = z.object({
    dealerId: z.string().min(1, 'Bayi seçilmelidir'),
    firstName: z.string().min(1, 'Ad gereklidir'),
    lastName: z.string().min(1, 'Soyad gereklidir'),
    nationalId: z.string().optional(),
    email: z.string().email('Geçerli bir e-posta adresi giriniz').optional().or(z.literal('')),
    phone: z.string().optional(),
});

const updateCustomerSchema = z.object({
    firstName: z.string().min(1, 'Ad gereklidir'),
    lastName: z.string().min(1, 'Soyad gereklidir'),
    nationalId: z.string().optional(),
    email: z.string().email('Geçerli bir e-posta adresi giriniz').optional().or(z.literal('')),
    phone: z.string().optional(),
    isActive: z.boolean(),
});

export default function CustomersPage() {
    const t = useTranslations('Customers');
    const locale = useLocale();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [search, setSearch] = useState('');
    const [selectedDealerId, setSelectedDealerId] = useState<string | undefined>(undefined);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isEdit, setIsEdit] = useState(false);

    // Get all dealers for filter and create form
    const { data: dealersData } = useQuery({
        queryKey: ['dealers', 'all'],
        queryFn: () => dealersService.getDealers({ page: 1, pageSize: 1000 }),
    });

    // Get customers
    const { data, isLoading, error } = useQuery({
        queryKey: ['customers', page, pageSize, search, selectedDealerId],
        queryFn: () =>
            customersService.getCustomers({
                page,
                pageSize,
                search: search || undefined,
                dealerId: selectedDealerId,
            }),
    });

    const createForm = useForm<CreateCustomerRequest>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            dealerId: '',
            firstName: '',
            lastName: '',
            nationalId: '',
            email: '',
            phone: '',
        },
    });

    const updateForm = useForm<UpdateCustomerRequest>({
        resolver: zodResolver(updateCustomerSchema),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateCustomerRequest) => customersService.createCustomer(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setDialogOpen(false);
            createForm.reset();
            toast.success(t('createSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('createError'));
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCustomerRequest }) =>
            customersService.updateCustomer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setDialogOpen(false);
            setSelectedCustomer(null);
            toast.success(t('updateSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('updateError'));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => customersService.deleteCustomer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setDeleteDialogOpen(false);
            setSelectedCustomer(null);
            toast.success(t('deleteSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('deleteError'));
        },
    });

    const handleCreate = () => {
        setIsEdit(false);
        setSelectedCustomer(null);
        createForm.reset();
        setDialogOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setIsEdit(true);
        setSelectedCustomer(customer);
        updateForm.reset({
            firstName: customer.firstName,
            lastName: customer.lastName,
            nationalId: customer.nationalId || '',
            email: customer.email || '',
            phone: customer.phone || '',
            isActive: customer.isActive,
        });
        setDialogOpen(true);
    };

    const handleDelete = (customer: Customer) => {
        setSelectedCustomer(customer);
        setDeleteDialogOpen(true);
    };

    const handleView = (customer: Customer) => {
        router.push(`/${locale}/admin/customers/${customer.id}`);
    };

    const onSubmitCreate = (data: CreateCustomerRequest) => {
        createMutation.mutate(data);
    };

    const onSubmitUpdate = (data: UpdateCustomerRequest) => {
        if (selectedCustomer) {
            updateMutation.mutate({ id: selectedCustomer.id, data });
        }
    };

    if (error) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('errorTitle') || 'Hata'}</AlertTitle>
                    <AlertDescription>{t('errorDescription') || 'Müşteriler yüklenirken bir hata oluştu'}</AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('title')}</h1>
                        <p className="text-muted-foreground">{t('description')}</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('create')}
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
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
                        value={selectedDealerId || 'all'}
                        onValueChange={(value) => {
                            setSelectedDealerId(value === 'all' ? undefined : value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Bayi Filtrele" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Bayiler</SelectItem>
                            {dealersData?.items.map((dealer) => (
                                <SelectItem key={dealer.id} value={dealer.id}>
                                    {dealer.name} ({dealer.code})
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
                ) : !data || data.items.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">{t('noCustomers')}</div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('firstName')}</TableHead>
                                        <TableHead>{t('lastName')}</TableHead>
                                        <TableHead>{t('nationalId')}</TableHead>
                                        <TableHead>{t('email')}</TableHead>
                                        <TableHead>{t('phone')}</TableHead>
                                        <TableHead>{t('status')}</TableHead>
                                        <TableHead className="text-right">{t('actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.items.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell className="font-medium">{customer.firstName}</TableCell>
                                            <TableCell>{customer.lastName}</TableCell>
                                            <TableCell>{customer.nationalId || '-'}</TableCell>
                                            <TableCell>{customer.email || '-'}</TableCell>
                                            <TableCell>{customer.phone || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                                                    {customer.isActive ? t('active') : t('inactive')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleView(customer)}
                                                        title="Görüntüle"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(customer)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(customer)}
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
                        {data.totalCount > pageSize && (
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    {t('showingResults', {
                                        from: (page - 1) * pageSize + 1,
                                        to: Math.min(page * pageSize, data.totalCount),
                                        total: data.totalCount,
                                    })}
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
                                        {t('pageInfo', {
                                            page,
                                            total: data.totalPages,
                                        })}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={page >= data.totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create/Edit Dialog */}
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
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={updateForm.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('firstName')}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder={t('firstNamePlaceholder')} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={updateForm.control}
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('lastName')}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder={t('lastNamePlaceholder')} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={updateForm.control}
                                    name="nationalId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('nationalId')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t('nationalIdPlaceholder')} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={updateForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('email')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="email" placeholder={t('emailPlaceholder')} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={updateForm.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('phone')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t('phonePlaceholder')} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
                                                <FormLabel>{t('isActive')}</FormLabel>
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
                                        {t('cancel')}
                                    </Button>
                                    <Button type="submit" disabled={updateMutation.isPending}>
                                        {updateMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {t('update')}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    ) : (
                        <Form {...createForm}>
                            <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
                                <FormField
                                    control={createForm.control}
                                    name="dealerId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bayi</FormLabel>
                                            <FormControl>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Bayi seçin" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {dealersData?.items.map((dealer) => (
                                                            <SelectItem key={dealer.id} value={dealer.id}>
                                                                {dealer.name} ({dealer.code})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={createForm.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('firstName')}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder={t('firstNamePlaceholder')} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={createForm.control}
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('lastName')}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder={t('lastNamePlaceholder')} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={createForm.control}
                                    name="nationalId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('nationalId')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t('nationalIdPlaceholder')} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('email')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="email" placeholder={t('emailPlaceholder')} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('phone')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t('phonePlaceholder')} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDialogOpen(false)}
                                    >
                                        {t('cancel')}
                                    </Button>
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        {createMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {t('create')}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('deleteConfirm', {
                                name: `${selectedCustomer?.firstName} ${selectedCustomer?.lastName}`,
                            })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedCustomer && deleteMutation.mutate(selectedCustomer.id)}
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
        </DashboardLayout>
    );
}

