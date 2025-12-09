'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useFormatter } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { usersService, type User, type CreateUserRequest, type UpdateUserRequest } from '@/services/users.service';
import { rolesService } from '@/services/roles.service';
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
    Shield,
    UserCheck,
    UserX,
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

const userSchema = z.object({
    userName: z.string().min(1, 'Kullanıcı adı gereklidir'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    firstName: z.string().min(1, 'Ad gereklidir'),
    lastName: z.string().min(1, 'Soyad gereklidir'),
    phoneNumber: z.string().optional(),
});

const updateUserSchema = z.object({
    userName: z.string().min(1, 'Kullanıcı adı gereklidir'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    firstName: z.string().min(1, 'Ad gereklidir'),
    lastName: z.string().min(1, 'Soyad gereklidir'),
    phoneNumber: z.string().optional(),
    isActive: z.boolean(),
});

const assignRolesSchema = z.object({
    roleIds: z.array(z.string()).min(1, 'En az bir rol seçilmelidir'),
});

export default function SuperAdminUsersPage() {
    const t = useTranslations('Users');
    const format = useFormatter();
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [search, setSearch] = useState('');
    const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEdit, setIsEdit] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['users', page, pageSize, search, isActiveFilter],
        queryFn: () =>
            usersService.getUsers({
                pageNumber: page,
                pageSize,
                search: search || undefined,
                isActive: isActiveFilter,
            }),
    });

    const { data: allRoles } = useQuery({
        queryKey: ['roles'],
        queryFn: () => rolesService.getAllRoles(),
    });

    const createForm = useForm<CreateUserRequest>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            userName: '',
            email: '',
            firstName: '',
            lastName: '',
            phoneNumber: '',
        },
    });

    const updateForm = useForm<UpdateUserRequest>({
        resolver: zodResolver(updateUserSchema),
    });

    const assignRolesForm = useForm<{ roleIds: string[] }>({
        resolver: zodResolver(assignRolesSchema),
        defaultValues: {
            roleIds: [],
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateUserRequest) => usersService.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setDialogOpen(false);
            createForm.reset();
            toast.success('Kullanıcı başarıyla oluşturuldu');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Kullanıcı oluşturulurken bir hata oluştu');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
            usersService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setDialogOpen(false);
            setSelectedUser(null);
            toast.success('Kullanıcı başarıyla güncellendi');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Kullanıcı güncellenirken bir hata oluştu');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => usersService.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setDeleteDialogOpen(false);
            setSelectedUser(null);
            toast.success('Kullanıcı başarıyla silindi');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Kullanıcı silinirken bir hata oluştu');
        },
    });

    const activateMutation = useMutation({
        mutationFn: (id: string) => usersService.activateUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Kullanıcı başarıyla aktifleştirildi');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Kullanıcı aktifleştirilirken bir hata oluştu');
        },
    });

    const deactivateMutation = useMutation({
        mutationFn: (id: string) => usersService.deactivateUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Kullanıcı başarıyla deaktifleştirildi');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Kullanıcı deaktifleştirilirken bir hata oluştu');
        },
    });

    const assignRolesMutation = useMutation({
        mutationFn: ({ userId, roleIds }: { userId: string; roleIds: string[] }) =>
            usersService.assignRoles(userId, roleIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setRolesDialogOpen(false);
            setSelectedUser(null);
            toast.success('Roller başarıyla atandı');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Roller atanırken bir hata oluştu');
        },
    });

    const handleCreate = () => {
        setIsEdit(false);
        setSelectedUser(null);
        createForm.reset();
        setDialogOpen(true);
    };

    const handleEdit = (user: User) => {
        setIsEdit(true);
        setSelectedUser(user);
        updateForm.reset({
            userName: user.userName,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber || '',
            isActive: user.isActive,
        });
        setDialogOpen(true);
    };

    const handleDelete = (user: User) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleAssignRoles = async (user: User) => {
        setSelectedUser(user);
        try {
            const userRoles = await usersService.getUserRoles(user.id);
            assignRolesForm.reset({
                roleIds: userRoles.roleIds || [],
            });
        } catch (error) {
            console.error('Failed to load user roles:', error);
            assignRolesForm.reset({
                roleIds: [],
            });
        }
        setRolesDialogOpen(true);
    };

    const handleActivate = (id: string) => {
        activateMutation.mutate(id);
    };

    const handleDeactivate = (id: string) => {
        deactivateMutation.mutate(id);
    };

    const onSubmitCreate = (data: CreateUserRequest) => {
        createMutation.mutate(data);
    };

    const onSubmitUpdate = (data: UpdateUserRequest) => {
        if (selectedUser) {
            updateMutation.mutate({ id: selectedUser.id, data });
        }
    };

    const onSubmitAssignRoles = (data: { roleIds: string[] }) => {
        if (selectedUser) {
            assignRolesMutation.mutate({ userId: selectedUser.id, roleIds: data.roleIds });
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return format.dateTime(new Date(dateString), {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (error) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Hata</AlertTitle>
                    <AlertDescription>Kullanıcılar yüklenirken bir hata oluştu</AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
                        <p className="text-muted-foreground">Tüm kullanıcıları görüntüleyin ve yönetin</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Kullanıcı
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Kullanıcı ara..."
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
                                value === 'all' ? undefined : value === 'active' ? true : false
                            );
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Durum Filtrele" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tümü</SelectItem>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="inactive">Pasif</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : !data || data.items.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">Kullanıcı bulunamadı</div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kullanıcı Adı</TableHead>
                                        <TableHead>E-posta</TableHead>
                                        <TableHead>Ad Soyad</TableHead>
                                        <TableHead>Telefon</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Son Giriş</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.items.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.userName}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                {user.firstName} {user.lastName}
                                            </TableCell>
                                            <TableCell>{user.phoneNumber || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                                    {user.isActive ? 'Aktif' : 'Pasif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(user.lastLoginDate)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleAssignRoles(user)}
                                                        title="Roller Ata"
                                                    >
                                                        <Shield className="h-4 w-4" />
                                                    </Button>
                                                    {user.isActive ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeactivate(user.id)}
                                                            title="Deaktif Et"
                                                        >
                                                            <UserX className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleActivate(user.id)}
                                                            title="Aktif Et"
                                                        >
                                                            <UserCheck className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(user)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(user)}
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
                        {data.total > pageSize && (
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    {((page - 1) * pageSize + 1)} - {Math.min(page * pageSize, data.total)} / {data.total}
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
                                        Sayfa {page} / {Math.ceil(data.total / pageSize)}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={page >= Math.ceil(data.total / pageSize)}
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEdit ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? 'Kullanıcı bilgilerini güncelleyin' : 'Yeni bir kullanıcı oluşturun'}
                        </DialogDescription>
                    </DialogHeader>
                    {isEdit ? (
                        <Form {...updateForm}>
                            <form onSubmit={updateForm.handleSubmit(onSubmitUpdate)} className="space-y-4">
                                <FormField
                                    control={updateForm.control}
                                    name="userName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kullanıcı Adı</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
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
                                            <FormLabel>E-posta</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="email" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={updateForm.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ad</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
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
                                                <FormLabel>Soyad</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={updateForm.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telefon</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
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
                                        İptal
                                    </Button>
                                    <Button type="submit" disabled={updateMutation.isPending}>
                                        {updateMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Güncelle
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    ) : (
                        <Form {...createForm}>
                            <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
                                <FormField
                                    control={createForm.control}
                                    name="userName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kullanıcı Adı</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
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
                                            <FormLabel>E-posta</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="email" />
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
                                                <FormLabel>Ad</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
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
                                                <FormLabel>Soyad</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={createForm.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telefon</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
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
                                        İptal
                                    </Button>
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        {createMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Oluştur
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
                        <AlertDialogTitle>Kullanıcıyı Sil</AlertDialogTitle>
                        <div className="py-4">
                            <p className="text-sm text-muted-foreground">
                                {selectedUser?.userName} kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </p>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Assign Roles Dialog */}
            <Dialog open={rolesDialogOpen} onOpenChange={setRolesDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Roller Ata</DialogTitle>
                        <DialogDescription>
                            {selectedUser?.userName} kullanıcısına roller atayın
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...assignRolesForm}>
                        <form
                            onSubmit={assignRolesForm.handleSubmit(onSubmitAssignRoles)}
                            className="space-y-4"
                        >
                            <FormField
                                control={assignRolesForm.control}
                                name="roleIds"
                                render={() => (
                                    <FormItem>
                                        <div className="mb-4">
                                            <FormLabel className="text-base">Roller</FormLabel>
                                        </div>
                                        {allRoles?.map((role) => (
                                            <FormField
                                                key={role.id}
                                                control={assignRolesForm.control}
                                                name="roleIds"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={role.id}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(role.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([
                                                                                  ...(field.value || []),
                                                                                  role.id,
                                                                              ])
                                                                            : field.onChange(
                                                                                  field.value?.filter(
                                                                                      (value) => value !== role.id
                                                                                  )
                                                                              );
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                {role.name}
                                                                {role.description && (
                                                                    <span className="text-muted-foreground ml-2">
                                                                        - {role.description}
                                                                    </span>
                                                                )}
                                                            </FormLabel>
                                                        </FormItem>
                                                    );
                                                }}
                                            />
                                        ))}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setRolesDialogOpen(false)}
                                >
                                    İptal
                                </Button>
                                <Button type="submit" disabled={assignRolesMutation.isPending}>
                                    {assignRolesMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Ata
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

