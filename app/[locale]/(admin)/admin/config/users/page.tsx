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
    Key,
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
import { CredentialsField } from '@/components/shared/credentials-field';

const userSchema = z.object({
    userName: z.string().min(1, 'Username is required'),
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phoneNumber: z.string().optional(),
});

const updateUserSchema = z.object({
    userName: z.string().min(1, 'Username is required'),
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phoneNumber: z.string().optional(),
    isActive: z.boolean(),
});

const assignRolesSchema = z.object({
    roleId: z.string().min(1, 'A role must be selected'),
});

export default function UsersPage() {
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
    const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
    const [createdUser, setCreatedUser] = useState<User | null>(null);
    const [isResetPasswordDialog, setIsResetPasswordDialog] = useState(false);
    const [resetPasswordConfirmOpen, setResetPasswordConfirmOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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

    const assignRolesForm = useForm<{ roleId: string }>({
        resolver: zodResolver(assignRolesSchema),
        defaultValues: {
            roleId: '',
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateUserRequest) => usersService.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setDialogOpen(false);
            createForm.reset();
            toast.success(t('createSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('createError'));
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
            usersService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setDialogOpen(false);
            setSelectedUser(null);
            toast.success(t('updateSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('updateError'));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => usersService.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setDeleteDialogOpen(false);
            setSelectedUser(null);
            toast.success(t('deleteSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('deleteError'));
        },
    });

    const activateMutation = useMutation({
        mutationFn: (id: string) => usersService.activateUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(t('activateSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('activateError'));
        },
    });

    const deactivateMutation = useMutation({
        mutationFn: (id: string) => usersService.deactivateUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(t('deactivateSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('deactivateError'));
        },
    });

    const assignRolesMutation = useMutation({
        mutationFn: ({ userId, roleIds }: { userId: string; roleIds: string[] }) =>
            usersService.assignRoles(userId, roleIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setRolesDialogOpen(false);
            setSelectedUser(null);
            toast.success(t('assignRolesSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('assignRolesError'));
        },
    });

    const resetPasswordMutation = useMutation({
        mutationFn: (id: string) => usersService.resetPassword(id),
        onSuccess: (data) => {
            // Yeni şifre oluşturuldu, dialog'u aç ve bilgileri göster
            setCreatedUser(data);
            setIsResetPasswordDialog(true);
            setIsCredentialsDialogOpen(true);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('resetPasswordError') || 'Şifre sıfırlama başarısız oldu');
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
            // İlk rolü seç (eğer varsa)
            assignRolesForm.reset({
                roleId: userRoles.roleIds && userRoles.roleIds.length > 0 ? userRoles.roleIds[0] : '',
            });
        } catch (error) {
            console.error('Failed to load user roles:', error);
            assignRolesForm.reset({
                roleId: '',
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

    const onSubmitAssignRoles = (data: { roleId: string }) => {
        if (selectedUser) {
            // Tek rolü array olarak gönder
            assignRolesMutation.mutate({ userId: selectedUser.id, roleIds: [data.roleId] });
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
                    <AlertTitle>{t('errorTitle')}</AlertTitle>
                    <AlertDescription>{t('errorDescription')}</AlertDescription>
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
                        value={isActiveFilter === undefined ? 'all' : isActiveFilter ? 'active' : 'inactive'}
                        onValueChange={(value) => {
                            setIsActiveFilter(
                                value === 'all' ? undefined : value === 'active' ? true : false
                            );
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('filterByStatus')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('allStatuses')}</SelectItem>
                            <SelectItem value="active">{t('active')}</SelectItem>
                            <SelectItem value="inactive">{t('inactive')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : !data || data.items.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">{t('noData')}</div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('userName')}</TableHead>
                                        <TableHead>{t('email')}</TableHead>
                                        <TableHead>{t('fullName')}</TableHead>
                                        <TableHead>{t('phoneNumber')}</TableHead>
                                        <TableHead>{t('status')}</TableHead>
                                        <TableHead>{t('lastLogin')}</TableHead>
                                        <TableHead className="text-right">{t('actions')}</TableHead>
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
                                                    {user.isActive ? t('active') : t('inactive')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(user.lastLoginDate)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleAssignRoles(user)}
                                                        title={t('assignRoles')}
                                                    >
                                                        <Shield className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedUserId(user.id);
                                                            setResetPasswordConfirmOpen(true);
                                                        }}
                                                        disabled={resetPasswordMutation.isPending}
                                                        title={t('resetPassword') || 'Şifre Sıfırla'}
                                                    >
                                                        <Key className="h-4 w-4" />
                                                    </Button>
                                                    {user.isActive ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeactivate(user.id)}
                                                            title={t('deactivate')}
                                                        >
                                                            <UserX className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleActivate(user.id)}
                                                            title={t('activate')}
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
                                    {t('paginationInfo', {
                                        start: (page - 1) * pageSize + 1,
                                        end: Math.min(page * pageSize, data.total),
                                        total: data.total,
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
                                            totalPages: Math.ceil(data.total / pageSize),
                                        })}
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
                        <DialogTitle>{isEdit ? t('editUser') : t('createUser')}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? t('editUserDescription') : t('createUserDescription')}
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
                                            <FormLabel>{t('userName')}</FormLabel>
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
                                            <FormLabel>{t('email')}</FormLabel>
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
                                                <FormLabel>{t('firstName')}</FormLabel>
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
                                                <FormLabel>{t('lastName')}</FormLabel>
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
                                            <FormLabel>{t('phoneNumber')}</FormLabel>
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
                                    name="userName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('userName')}</FormLabel>
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
                                            <FormLabel>{t('email')}</FormLabel>
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
                                                <FormLabel>{t('firstName')}</FormLabel>
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
                                                <FormLabel>{t('lastName')}</FormLabel>
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
                                            <FormLabel>{t('phoneNumber')}</FormLabel>
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
                            {t('deleteConfirmDescription', {
                                userName: selectedUser?.userName || '',
                            })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
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

            {/* Assign Roles Dialog */}
            <Dialog open={rolesDialogOpen} onOpenChange={setRolesDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('assignRoles')}</DialogTitle>
                        <DialogDescription>
                            {t('assignRolesDescription', { userName: selectedUser?.userName || '' })}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...assignRolesForm}>
                        <form
                            onSubmit={assignRolesForm.handleSubmit(onSubmitAssignRoles)}
                            className="space-y-4"
                        >
                            <FormField
                                control={assignRolesForm.control}
                                name="roleId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base">{t('roles')}</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('selectRole') || 'Select a role...'} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {allRoles?.map((role) => (
                                                    <SelectItem key={role.id} value={role.id}>
                                                        <div className="flex flex-col">
                                                            <span>{role.name}</span>
                                                            {role.description && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {role.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                    {t('cancel')}
                                </Button>
                                <Button type="submit" disabled={assignRolesMutation.isPending}>
                                    {assignRolesMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {t('assign')}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Geçici Şifre Dialog'u */}
            <Dialog 
                open={isCredentialsDialogOpen} 
                onOpenChange={(open) => {
                    setIsCredentialsDialogOpen(open);
                    if (!open) {
                        setCreatedUser(null);
                        setIsResetPasswordDialog(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {isResetPasswordDialog ? (
                                <>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                        <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span>{t('resetPasswordDialogTitle') || 'Yeni Geçici Şifre Oluşturuldu'}</span>
                                </>
                            ) : (
                                <>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                        <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span>{t('credentialsTitle') || 'Kullanıcı Giriş Bilgileri'}</span>
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            {isResetPasswordDialog ? (
                                createdUser?.email
                                    ? t('resetPasswordDescriptionWithEmail') || 'Yeni bir geçici şifre oluşturuldu. Giriş bilgileri e-posta ile gönderildi. Aşağıdaki bilgileri de not edebilirsiniz.'
                                    : t('resetPasswordDescription') || 'Yeni bir geçici şifre oluşturuldu. Lütfen kullanıcıyı aşağıdaki bilgilerle bilgilendirin.'
                            ) : (
                                createdUser?.email
                                    ? t('credentialsDescriptionWithEmail') || 'Kullanıcı oluşturuldu. Giriş bilgileri e-posta ile gönderildi. Aşağıdaki bilgileri de not edebilirsiniz.'
                                    : t('credentialsDescription') || 'Kullanıcı oluşturuldu. Lütfen kullanıcıyı aşağıdaki bilgilerle bilgilendirin.'
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    {createdUser && (
                        <div className="space-y-4">
                            {createdUser.email && (
                                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <AlertTitle className="text-blue-800 dark:text-blue-200">
                                        {t('emailSentTitle') || 'E-posta Gönderildi'}
                                    </AlertTitle>
                                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                                        {t('emailSentDescription', { email: createdUser.email }) || 
                                         `Giriş bilgileri ${createdUser.email} adresine gönderildi.`}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                <AlertTitle className="text-amber-800 dark:text-amber-200">
                                    {t('credentialsWarning') || 'Önemli'}
                                </AlertTitle>
                                <AlertDescription className="text-amber-700 dark:text-amber-300">
                                    {t('credentialsWarningText') || 'Lütfen bu bilgileri güvenli bir şekilde saklayın. Kullanıcı ilk girişinde bu bilgileri kullanacaktır.'}
                                </AlertDescription>
                            </Alert>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        {t('userName') || 'Kullanıcı Adı'}
                                    </label>
                                    <CredentialsField
                                        value={createdUser.userName || ''}
                                        label={t('userName') || 'Kullanıcı Adı'}
                                    />
                                </div>
                                
                                {createdUser.temporaryPassword && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            {t('temporaryPassword') || 'Geçici Şifre'}
                                        </label>
                                        <CredentialsField
                                            value={createdUser.temporaryPassword}
                                            label={t('temporaryPassword') || 'Geçici Şifre'}
                                            isPassword
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    onClick={() => {
                                        setIsCredentialsDialogOpen(false);
                                        setCreatedUser(null);
                                        setIsResetPasswordDialog(false);
                                    }}
                                >
                                    {t('close') || 'Kapat'}
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
                            <span>{t('resetPasswordConfirmTitle') || 'Yeni Geçici Şifre Oluştur'}</span>
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('resetPasswordConfirm') || 'Bu kullanıcı için yeni bir geçici şifre oluşturulacak ve e-posta ile gönderilecektir. Devam etmek istiyor musunuz?'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (selectedUserId) {
                                    resetPasswordMutation.mutate(selectedUserId);
                                    setResetPasswordConfirmOpen(false);
                                    setSelectedUserId(null);
                                }
                            }}
                            disabled={resetPasswordMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {resetPasswordMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('resetting') || 'Oluşturuluyor...'}
                                </>
                            ) : (
                                t('confirm') || 'Onayla'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}

