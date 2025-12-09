'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { authService } from '@/services/auth.service';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
    const t = useTranslations('ChangePassword');
    const tAuth = useTranslations('Auth');
    const locale = useLocale();
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    // Eğer kullanıcı giriş yapmamışsa login sayfasına yönlendir
    useEffect(() => {
        if (!user) {
            router.push(`/${locale}/login`);
        }
    }, [user, locale, router]);

    // Kullanıcı yoksa loading göster
    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    async function onSubmit(data: ChangePasswordFormValues) {
        setIsLoading(true);
        try {
            await authService.changePassword(data.currentPassword, data.newPassword);
            toast.success(t('success'));
            
            // Şifre değiştirildikten sonra kullanıcıyı dashboard'a yönlendir
            if (user) {
                const roles = user.roles || [];
                if (roles.includes('SuperAdmin') || roles.includes('Admin')) {
                    router.push(`/${locale}/admin/dashboard`);
                } else if (roles.includes('Dealer')) {
                    router.push(`/${locale}/dealer/dashboard`);
                } else if (roles.includes('Customer')) {
                    router.push(`/${locale}/customer/policies`);
                } else if (roles.includes('Observer')) {
                    router.push(`/${locale}/observer/dashboard`);
                } else {
                    router.push(`/${locale}`);
                }
            } else {
                router.push(`/${locale}`);
            }
        } catch (error: any) {
            console.error('Change password error:', error);
            toast.error(error.response?.data?.detail || error.message || t('error'));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-center mb-2">
                        <div className="rounded-full bg-primary/10 p-3">
                            <Lock className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center">{t('title')}</CardTitle>
                    <CardDescription className="text-center">{t('description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t('warningTitle')}</AlertTitle>
                        <AlertDescription>{t('warningDescription')}</AlertDescription>
                    </Alert>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="currentPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('currentPassword')}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showCurrentPassword ? 'text' : 'password'}
                                                    placeholder={t('currentPasswordPlaceholder')}
                                                    {...field}
                                                    disabled={isLoading}
                                                    className="pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full px-3"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    disabled={isLoading}
                                                >
                                                    {showCurrentPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('newPassword')}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    placeholder={t('newPasswordPlaceholder')}
                                                    {...field}
                                                    disabled={isLoading}
                                                    className="pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full px-3"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    disabled={isLoading}
                                                >
                                                    {showNewPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormDescription>{t('passwordRequirements')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('confirmPassword')}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    placeholder={t('confirmPasswordPlaceholder')}
                                                    {...field}
                                                    disabled={isLoading}
                                                    className="pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full px-3"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    disabled={isLoading}
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('submitButton')}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

