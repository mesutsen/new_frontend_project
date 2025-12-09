'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuth } from '@/components/providers/auth-provider';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    User,
    Mail,
    Phone,
    Lock,
    Bell,
    Globe,
    Save,
    Loader2,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface UserProfile {
    id: string;
    userName: string;
    email: string;
    phoneNumber?: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
    lastLoginDate?: string;
}

const profileSchema = z.object({
    firstName: z.string().min(1, 'Ad gereklidir'),
    lastName: z.string().min(1, 'Soyad gereklidir'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    phoneNumber: z.string().optional(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Mevcut şifre gereklidir'),
    newPassword: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
    confirmPassword: z.string().min(1, 'Şifre onayı gereklidir'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
});

export default function SettingsPage() {
    const t = useTranslations('Settings');
    const format = useFormatter();
    const locale = useLocale();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState('profile');

    const { data: profile, isLoading, error } = useQuery({
        queryKey: ['user-profile', user?.id],
        queryFn: async () => {
            const response = await api.get<UserProfile>(`/users/${user?.id}`);
            return response.data;
        },
        enabled: !!user?.id,
    });

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
        },
        values: profile ? {
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            email: profile.email || '',
            phoneNumber: profile.phoneNumber || '',
        } : undefined,
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (data: z.infer<typeof profileSchema>) => {
            const response = await api.put(`/users/${user?.id}`, {
                userName: profile?.userName,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber,
                isActive: true,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            toast.success(t('profileUpdateSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('profileUpdateError'));
        },
    });

    const changePasswordMutation = useMutation({
        mutationFn: async (data: z.infer<typeof passwordSchema>) => {
            const response = await api.post('/auth/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            return response.data;
        },
        onSuccess: () => {
            passwordForm.reset();
            toast.success(t('passwordChangeSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('passwordChangeError'));
        },
    });

    const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
        updateProfileMutation.mutate(data);
    };

    const onPasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
        changePasswordMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !profile) {
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
                <div>
                    <h1 className="text-2xl font-bold">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('description')}</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="profile">
                            <User className="mr-2 h-4 w-4" />
                            {t('profile')}
                        </TabsTrigger>
                        <TabsTrigger value="password">
                            <Lock className="mr-2 h-4 w-4" />
                            {t('password')}
                        </TabsTrigger>
                        <TabsTrigger value="notifications">
                            <Bell className="mr-2 h-4 w-4" />
                            {t('notifications')}
                        </TabsTrigger>
                        <TabsTrigger value="preferences">
                            <Globe className="mr-2 h-4 w-4" />
                            {t('preferences')}
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('profileInformation')}</CardTitle>
                                <CardDescription>{t('profileInformationDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <Label>{t('firstName')}</Label>
                                            <Input
                                                {...profileForm.register('firstName')}
                                                placeholder={t('firstNamePlaceholder')}
                                            />
                                            {profileForm.formState.errors.firstName && (
                                                <p className="text-sm text-destructive mt-1">
                                                    {profileForm.formState.errors.firstName.message}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label>{t('lastName')}</Label>
                                            <Input
                                                {...profileForm.register('lastName')}
                                                placeholder={t('lastNamePlaceholder')}
                                            />
                                            {profileForm.formState.errors.lastName && (
                                                <p className="text-sm text-destructive mt-1">
                                                    {profileForm.formState.errors.lastName.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <Label>{t('email')}</Label>
                                        <Input
                                            type="email"
                                            {...profileForm.register('email')}
                                            placeholder={t('emailPlaceholder')}
                                        />
                                        {profileForm.formState.errors.email && (
                                            <p className="text-sm text-destructive mt-1">
                                                {profileForm.formState.errors.email.message}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label>{t('phoneNumber')}</Label>
                                        <Input
                                            type="tel"
                                            {...profileForm.register('phoneNumber')}
                                            placeholder={t('phoneNumberPlaceholder')}
                                        />
                                        {profileForm.formState.errors.phoneNumber && (
                                            <p className="text-sm text-destructive mt-1">
                                                {profileForm.formState.errors.phoneNumber.message}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label>{t('username')}</Label>
                                        <Input
                                            value={profile.userName}
                                            disabled
                                            className="bg-muted"
                                        />
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {t('usernameCannotChange')}
                                        </p>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={updateProfileMutation.isPending}
                                        >
                                            {updateProfileMutation.isPending && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            <Save className="mr-2 h-4 w-4" />
                                            {t('save')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Password Tab */}
                    <TabsContent value="password" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('changePassword')}</CardTitle>
                                <CardDescription>{t('changePasswordDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                    <div>
                                        <Label>{t('currentPassword')}</Label>
                                        <Input
                                            type="password"
                                            {...passwordForm.register('currentPassword')}
                                            placeholder={t('currentPasswordPlaceholder')}
                                        />
                                        {passwordForm.formState.errors.currentPassword && (
                                            <p className="text-sm text-destructive mt-1">
                                                {passwordForm.formState.errors.currentPassword.message}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label>{t('newPassword')}</Label>
                                        <Input
                                            type="password"
                                            {...passwordForm.register('newPassword')}
                                            placeholder={t('newPasswordPlaceholder')}
                                        />
                                        {passwordForm.formState.errors.newPassword && (
                                            <p className="text-sm text-destructive mt-1">
                                                {passwordForm.formState.errors.newPassword.message}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label>{t('confirmPassword')}</Label>
                                        <Input
                                            type="password"
                                            {...passwordForm.register('confirmPassword')}
                                            placeholder={t('confirmPasswordPlaceholder')}
                                        />
                                        {passwordForm.formState.errors.confirmPassword && (
                                            <p className="text-sm text-destructive mt-1">
                                                {passwordForm.formState.errors.confirmPassword.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={changePasswordMutation.isPending}
                                        >
                                            {changePasswordMutation.isPending && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            <Save className="mr-2 h-4 w-4" />
                                            {t('changePassword')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('notificationSettings')}</CardTitle>
                                <CardDescription>{t('notificationSettingsDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Alert>
                                        <Bell className="h-4 w-4" />
                                        <AlertTitle>{t('comingSoon')}</AlertTitle>
                                        <AlertDescription>{t('notificationSettingsComingSoon')}</AlertDescription>
                                    </Alert>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Preferences Tab */}
                    <TabsContent value="preferences" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('preferences')}</CardTitle>
                                <CardDescription>{t('preferencesDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Alert>
                                        <Globe className="h-4 w-4" />
                                        <AlertTitle>{t('comingSoon')}</AlertTitle>
                                        <AlertDescription>{t('preferencesComingSoon')}</AlertDescription>
                                    </Alert>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}

