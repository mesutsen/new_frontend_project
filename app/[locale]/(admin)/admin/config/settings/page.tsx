'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { settingsService, type SystemSetting, type CreateSystemSettingRequest } from '@/services/settings.service';
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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Pencil,
    Trash2,
    Mail,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const settingSchema = z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    description: z.string().optional(),
});

const updateSettingSchema = z.object({
    value: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    description: z.string().optional(),
});

const testEmailSchema = z.object({
    email: z.string().email('Invalid email address'),
});

const emailSettingsSchema = z.object({
    smtpHost: z.string().min(1, 'SMTP Host is required'),
    smtpPort: z.string().min(1, 'SMTP Port is required'),
    userName: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    fromAddress: z.string().email('Invalid email address'),
    fromName: z.string().min(1, 'From Name is required'),
    replyAddress: z.string().email('Invalid email address').optional().or(z.literal('')),
});

type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>;

function EmailSettingsCard({ 
    settings, 
    onUpdate 
}: { 
    settings: SystemSetting[]; 
    onUpdate: (key: string, value: string) => void;
}) {
    const t = useTranslations('SystemSettings');
    const [isEditing, setIsEditing] = useState(false);
    
    const getEmailSetting = (key: string) => {
        return settings.find(s => s.key === `Email:${key}`)?.value || '';
    };

    const form = useForm<EmailSettingsFormValues>({
        resolver: zodResolver(emailSettingsSchema),
        defaultValues: {
            smtpHost: getEmailSetting('SmtpHost'),
            smtpPort: getEmailSetting('SmtpPort') || '587',
            userName: getEmailSetting('UserName'),
            password: getEmailSetting('Password'),
            fromAddress: getEmailSetting('FromAddress'),
            fromName: getEmailSetting('FromName') || 'Ersin Sigorta',
            replyAddress: getEmailSetting('ReplyAddress') || '',
        },
    });

    // Form'u settings değiştiğinde güncelle
    React.useEffect(() => {
        form.reset({
            smtpHost: getEmailSetting('SmtpHost'),
            smtpPort: getEmailSetting('SmtpPort') || '587',
            userName: getEmailSetting('UserName'),
            password: getEmailSetting('Password'),
            fromAddress: getEmailSetting('FromAddress'),
            fromName: getEmailSetting('FromName') || 'Ersin Sigorta',
            replyAddress: getEmailSetting('ReplyAddress') || '',
        });
    }, [settings]);

    const onSubmit = (data: EmailSettingsFormValues) => {
        onUpdate('Email:SmtpHost', data.smtpHost);
        onUpdate('Email:SmtpPort', data.smtpPort);
        onUpdate('Email:UserName', data.userName);
        onUpdate('Email:Password', data.password);
        onUpdate('Email:FromAddress', data.fromAddress);
        onUpdate('Email:FromName', data.fromName);
        if (data.replyAddress) {
            onUpdate('Email:ReplyAddress', data.replyAddress);
        }
        setIsEditing(false);
        toast.success(t('emailSettingsUpdated') || 'Email ayarları güncellendi');
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        {t('emailSettings') || 'E-posta Ayarları'}
                    </CardTitle>
                    {!isEditing && (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {t('edit') || 'Düzenle'}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="smtpHost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('smtpHost') || 'SMTP Host'}</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled={!isEditing} placeholder="smtp.gmail.com" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="smtpPort"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('smtpPort') || 'SMTP Port'}</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled={!isEditing} type="number" placeholder="587" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="userName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('smtpUsername') || 'SMTP Kullanıcı Adı'}</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled={!isEditing} placeholder="your-email@gmail.com" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('smtpPassword') || 'SMTP Şifre'}</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled={!isEditing} type="password" placeholder="••••••••" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fromAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('fromAddress') || 'Gönderen E-posta'}</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled={!isEditing} type="email" placeholder="noreply@ersinsigorta.com" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fromName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('fromName') || 'Gönderen Adı'}</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled={!isEditing} placeholder="Ersin Sigorta" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="replyAddress"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>{t('replyAddress') || 'Yanıt Adresi (Opsiyonel)'}</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled={!isEditing} type="email" placeholder="support@ersinsigorta.com" />
                                        </FormControl>
                                        <FormDescription>
                                            {t('replyAddressDescription') || 'E-postalara yanıt verilecek adres. Boş bırakılırsa gönderen adresi kullanılır.'}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {isEditing && (
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditing(false);
                                        form.reset();
                                    }}
                                >
                                    {t('cancel') || 'İptal'}
                                </Button>
                                <Button type="submit">
                                    {t('save') || 'Kaydet'}
                                </Button>
                            </div>
                        )}
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function getEmailSettingDescription(key: string): string {
    const descriptions: Record<string, string> = {
        'SmtpHost': 'SMTP sunucu adresi',
        'SmtpPort': 'SMTP sunucu portu',
        'UserName': 'SMTP kullanıcı adı',
        'Password': 'SMTP şifresi',
        'FromAddress': 'Gönderen e-posta adresi',
        'FromName': 'Gönderen adı',
        'ReplyAddress': 'Yanıt adresi',
    };
    return descriptions[key] || '';
}

export default function SettingsPage() {
    const t = useTranslations('SystemSettings');
    const queryClient = useQueryClient();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
    const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(null);
    const [isEdit, setIsEdit] = useState(false);

    const { data: settings, isLoading, error } = useQuery({
        queryKey: ['settings'],
        queryFn: () => settingsService.getAll(),
    });

    const createForm = useForm<CreateSystemSettingRequest>({
        resolver: zodResolver(settingSchema),
        defaultValues: {
            key: '',
            value: '',
            category: '',
            description: '',
        },
    });

    const updateForm = useForm<{ value?: string; category: string; description?: string }>({
        resolver: zodResolver(updateSettingSchema),
    });

    const testEmailForm = useForm<{ email: string }>({
        resolver: zodResolver(testEmailSchema),
        defaultValues: {
            email: '',
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateSystemSettingRequest) => settingsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            setDialogOpen(false);
            createForm.reset();
            toast.success(t('createSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('createError'));
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ key, data }: { key: string; data: { value?: string; category: string; description?: string } }) =>
            settingsService.update(key, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            setDialogOpen(false);
            setSelectedSetting(null);
            toast.success(t('updateSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('updateError'));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (key: string) => settingsService.delete(key),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            setDeleteDialogOpen(false);
            setSelectedSetting(null);
            toast.success(t('deleteSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('deleteError'));
        },
    });

    const testEmailMutation = useMutation({
        mutationFn: (email: string) => settingsService.testEmail(email),
        onSuccess: () => {
            setTestEmailDialogOpen(false);
            testEmailForm.reset();
            toast.success(t('testEmailSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('testEmailError'));
        },
    });

    const handleCreate = () => {
        setIsEdit(false);
        setSelectedSetting(null);
        createForm.reset();
        setDialogOpen(true);
    };

    const handleEdit = (setting: SystemSetting) => {
        setIsEdit(true);
        setSelectedSetting(setting);
        updateForm.reset({
            value: setting.value || '',
            category: setting.category,
            description: setting.description || '',
        });
        setDialogOpen(true);
    };

    const handleDelete = (setting: SystemSetting) => {
        setSelectedSetting(setting);
        setDeleteDialogOpen(true);
    };

    const handleTestEmail = () => {
        setTestEmailDialogOpen(true);
    };

    const onSubmitCreate = (data: CreateSystemSettingRequest) => {
        createMutation.mutate(data);
    };

    const onSubmitUpdate = (data: { value?: string; category: string; description?: string }) => {
        if (selectedSetting) {
            updateMutation.mutate({ key: selectedSetting.key, data });
        }
    };

    const onSubmitTestEmail = (data: { email: string }) => {
        testEmailMutation.mutate(data.email);
    };

    // Group settings by category
    const groupedSettings = settings?.reduce((acc, setting) => {
        const category = setting.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(setting);
        return acc;
    }, {} as Record<string, SystemSetting[]>) || {};

    const categories = Object.keys(groupedSettings).sort();

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
                    <div className="flex gap-2">
                        <Button onClick={handleTestEmail} variant="outline">
                            <Mail className="mr-2 h-4 w-4" />
                            {t('testEmail')}
                        </Button>
                        <Button onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('create')}
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Email Settings Card */}
                        <EmailSettingsCard 
                            settings={settings || []} 
                            onUpdate={(key, value) => {
                                const setting = settings?.find(s => s.key === key);
                                if (setting) {
                                    updateMutation.mutate({
                                        key: setting.key,
                                        data: {
                                            value,
                                            category: setting.category,
                                            description: setting.description
                                        }
                                    });
                                } else {
                                    createMutation.mutate({
                                        key: key.split(':')[1] || key,
                                        value,
                                        category: 'Email',
                                        description: getEmailSettingDescription(key)
                                    });
                                }
                            }}
                        />

                        {categories.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                {t('noData')}
                            </div>
                        ) : (
                            categories.map((category) => (
                                <Card key={category}>
                                    <CardHeader>
                                        <CardTitle>{category}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>{t('key')}</TableHead>
                                                    <TableHead>{t('value')}</TableHead>
                                                    <TableHead>{t('description')}</TableHead>
                                                    <TableHead className="text-right">{t('actions')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {groupedSettings[category].map((setting) => (
                                                    <TableRow key={setting.key}>
                                                        <TableCell className="font-mono text-xs">
                                                            {setting.key}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="max-w-md truncate">
                                                                {setting.value || '-'}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {setting.description || '-'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleEdit(setting)}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDelete(setting)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEdit ? t('editSetting') : t('createSetting')}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? t('editSettingDescription') : t('createSettingDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    {isEdit ? (
                        <Form {...updateForm}>
                            <form onSubmit={updateForm.handleSubmit(onSubmitUpdate)} className="space-y-4">
                                <FormField
                                    control={updateForm.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('category')}</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('selectCategory')} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Notification">Notification</SelectItem>
                                                    <SelectItem value="Warning">Warning</SelectItem>
                                                    <SelectItem value="File">File</SelectItem>
                                                    <SelectItem value="Theme">Theme</SelectItem>
                                                    <SelectItem value="Language">Language</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={updateForm.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('value')}</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} placeholder={t('valuePlaceholder')} />
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
                                            <FormLabel>{t('description')}</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} placeholder={t('descriptionPlaceholder')} />
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
                                    name="key"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('key')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t('keyPlaceholder')} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('category')}</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('selectCategory')} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Notification">Notification</SelectItem>
                                                    <SelectItem value="Warning">Warning</SelectItem>
                                                    <SelectItem value="File">File</SelectItem>
                                                    <SelectItem value="Theme">Theme</SelectItem>
                                                    <SelectItem value="Language">Language</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('value')}</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} placeholder={t('valuePlaceholder')} />
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
                                            <FormLabel>{t('description')}</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} placeholder={t('descriptionPlaceholder')} />
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
                        <div className="py-4">
                            <p className="text-sm text-muted-foreground">
                                {t('deleteConfirmDescription', { key: selectedSetting?.key || '' })}
                            </p>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedSetting && deleteMutation.mutate(selectedSetting.key)}
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

            {/* Test Email Dialog */}
            <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('testEmail')}</DialogTitle>
                        <DialogDescription>{t('testEmailDescription')}</DialogDescription>
                    </DialogHeader>
                    <Form {...testEmailForm}>
                        <form onSubmit={testEmailForm.handleSubmit(onSubmitTestEmail)} className="space-y-4">
                            <FormField
                                control={testEmailForm.control}
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
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setTestEmailDialogOpen(false)}
                                >
                                    {t('cancel')}
                                </Button>
                                <Button type="submit" disabled={testEmailMutation.isPending}>
                                    {testEmailMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {t('send')}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

