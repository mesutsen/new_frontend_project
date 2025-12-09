'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useFormatter } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { rolesService, type Role, type CreateRoleRequest, type UpdateRoleRequest } from '@/services/roles.service';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    AlertCircle,
    Shield,
    Eye,
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
import { Badge } from '@/components/ui/badge';

const roleSchema = z.object({
    name: z.string().min(1, 'Rol adı gereklidir'),
    description: z.string().optional(),
    permissionIds: z.array(z.string()),
});

export default function SuperAdminRolesPage() {
    const format = useFormatter();
    const queryClient = useQueryClient();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isEdit, setIsEdit] = useState(false);

    const { data: roles, isLoading, error } = useQuery({
        queryKey: ['roles'],
        queryFn: () => rolesService.getAllRoles(),
    });

    const { data: allPermissions } = useQuery({
        queryKey: ['permissions'],
        queryFn: () => rolesService.getAllPermissions(),
    });

    const { data: rolePermissions } = useQuery({
        queryKey: ['rolePermissions', selectedRole?.id],
        queryFn: () => rolesService.getRolePermissions(selectedRole!.id),
        enabled: !!selectedRole && permissionsDialogOpen,
    });

    const createForm = useForm<CreateRoleRequest>({
        resolver: zodResolver(roleSchema),
        defaultValues: {
            name: '',
            description: '',
            permissionIds: [] as string[],
        },
    });

    const updateForm = useForm<UpdateRoleRequest>({
        resolver: zodResolver(roleSchema),
    });

    const permissionsForm = useForm<{ permissionIds: string[] }>({
        defaultValues: {
            permissionIds: [],
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateRoleRequest) => rolesService.createRole(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            setDialogOpen(false);
            createForm.reset();
            toast.success('Rol başarıyla oluşturuldu');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Rol oluşturulurken bir hata oluştu');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateRoleRequest }) =>
            rolesService.updateRole(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            setDialogOpen(false);
            setSelectedRole(null);
            toast.success('Rol başarıyla güncellendi');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Rol güncellenirken bir hata oluştu');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => rolesService.deleteRole(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            setDeleteDialogOpen(false);
            setSelectedRole(null);
            toast.success('Rol başarıyla silindi');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Rol silinirken bir hata oluştu');
        },
    });

    const updatePermissionsMutation = useMutation({
        mutationFn: ({ id, permissionIds }: { id: string; permissionIds: string[] }) =>
            rolesService.updateRolePermissions(id, { permissionIds }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
            setPermissionsDialogOpen(false);
            setSelectedRole(null);
            toast.success('Yetkiler başarıyla güncellendi');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Yetkiler güncellenirken bir hata oluştu');
        },
    });

    const handleCreate = () => {
        setIsEdit(false);
        setSelectedRole(null);
        createForm.reset();
        setDialogOpen(true);
    };

    const handleEdit = (role: Role) => {
        setIsEdit(true);
        setSelectedRole(role);
        updateForm.reset({
            name: role.name,
            description: role.description || '',
            permissionIds: [] as string[],
        });
        setDialogOpen(true);
    };

    const handleDelete = (role: Role) => {
        setSelectedRole(role);
        setDeleteDialogOpen(true);
    };

    const handleManagePermissions = (role: Role) => {
        setSelectedRole(role);
        rolesService.getRolePermissions(role.id).then((perms) => {
            permissionsForm.reset({
                permissionIds: perms.map((p) => p.id),
            });
            setPermissionsDialogOpen(true);
        });
    };

    const handleView = (role: Role) => {
        setSelectedRole(role);
        setViewDialogOpen(true);
    };

    const onSubmitCreate = (data: CreateRoleRequest) => {
        createMutation.mutate(data);
    };

    const onSubmitUpdate = (data: UpdateRoleRequest) => {
        if (selectedRole) {
            updateMutation.mutate({ id: selectedRole.id, data });
        }
    };

    const onSubmitPermissions = (data: { permissionIds: string[] }) => {
        if (selectedRole) {
            updatePermissionsMutation.mutate({
                id: selectedRole.id,
                permissionIds: data.permissionIds,
            });
        }
    };

    const formatDate = (dateString: string) => {
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
                    <AlertDescription>Roller yüklenirken bir hata oluştu</AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Rol Yönetimi</h1>
                        <p className="text-muted-foreground">Sistem rolleri ve yetkilerini yönetin</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Rol
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : !roles || roles.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">Rol bulunamadı</div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rol Adı</TableHead>
                                    <TableHead>Açıklama</TableHead>
                                    <TableHead>Yetkiler</TableHead>
                                    <TableHead>Oluşturulma</TableHead>
                                    <TableHead className="text-right">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell>{role.description || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {role.permissions.length} Yetki
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(role.createdAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleView(role)}
                                                    title="Görüntüle"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleManagePermissions(role)}
                                                    title="Yetkileri Yönet"
                                                >
                                                    <Shield className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(role)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(role)}
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
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEdit ? 'Rol Düzenle' : 'Yeni Rol'}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? 'Rol bilgilerini güncelleyin' : 'Yeni bir rol oluşturun'}
                        </DialogDescription>
                    </DialogHeader>
                    {isEdit ? (
                        <Form {...updateForm}>
                            <form onSubmit={updateForm.handleSubmit(onSubmitUpdate)} className="space-y-4">
                                <FormField
                                    control={updateForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rol Adı</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={updateForm.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Açıklama</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} />
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
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rol Adı</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Açıklama</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} />
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
                        <AlertDialogTitle>Rolü Sil</AlertDialogTitle>
                        <div className="py-4">
                            <p className="text-sm text-muted-foreground">
                                {selectedRole?.name} rolünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </p>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedRole && deleteMutation.mutate(selectedRole.id)}
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

            {/* Manage Permissions Dialog */}
            <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Yetkileri Yönet</DialogTitle>
                        <DialogDescription>
                            {selectedRole?.name} rolü için yetkileri yönetin
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...permissionsForm}>
                        <form
                            onSubmit={permissionsForm.handleSubmit(onSubmitPermissions)}
                            className="space-y-4"
                        >
                            <FormField
                                control={permissionsForm.control}
                                name="permissionIds"
                                render={() => (
                                    <FormItem>
                                        <div className="space-y-3">
                                            {allPermissions?.map((permission) => (
                                                <FormField
                                                    key={permission.id}
                                                    control={permissionsForm.control}
                                                    name="permissionIds"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem
                                                                key={permission.id}
                                                                className="flex flex-row items-start space-x-3 space-y-0"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(permission.id)}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([
                                                                                      ...(field.value || []),
                                                                                      permission.id,
                                                                                  ])
                                                                                : field.onChange(
                                                                                      field.value?.filter(
                                                                                          (value) => value !== permission.id
                                                                                      )
                                                                                  );
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal">
                                                                    {permission.name}
                                                                    {permission.description && (
                                                                        <span className="text-muted-foreground ml-2">
                                                                            - {permission.description}
                                                                        </span>
                                                                    )}
                                                                </FormLabel>
                                                            </FormItem>
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPermissionsDialogOpen(false)}
                                >
                                    İptal
                                </Button>
                                <Button type="submit" disabled={updatePermissionsMutation.isPending}>
                                    {updatePermissionsMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Güncelle
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rol Detayları</DialogTitle>
                        <DialogDescription>Rol bilgilerini görüntüleyin</DialogDescription>
                    </DialogHeader>
                    {selectedRole && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Rol Adı</p>
                                <p className="text-base">{selectedRole.name}</p>
                            </div>
                            {selectedRole.description && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Açıklama</p>
                                    <p className="text-base">{selectedRole.description}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Yetkiler</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedRole.permissions.length > 0 ? (
                                        selectedRole.permissions.map((perm) => (
                                            <Badge key={perm} variant="secondary">
                                                {perm}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Oluşturulma</p>
                                    <p className="text-base">{formatDate(selectedRole.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Güncelleme</p>
                                    <p className="text-base">{formatDate(selectedRole.updatedAt)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

