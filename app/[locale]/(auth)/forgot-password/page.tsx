'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { authService } from '@/services/auth.service';
import { LanguageSelectorInline } from '@/components/language-selector-inline';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { CookieBanner } from '@/components/cookie-banner';

const forgotPasswordSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const t = useTranslations('Auth');
    const locale = useLocale();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    });

    async function onSubmit(data: ForgotPasswordFormValues) {
        setIsLoading(true);
        try {
            await authService.forgotPassword(data.email);
            setIsSuccess(true);
            toast.success(t('forgotPasswordSuccess') || 'Şifre sıfırlama linki e-posta adresinize gönderildi');
        } catch (error: any) {
            console.error('Forgot password error:', error);
            toast.error(error.response?.data?.message || error.message || t('forgotPasswordError') || 'Bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    }

    if (isSuccess) {
        return (
            <>
                <CookieBanner />
                <Card className="w-full shadow-lg border-muted">
                    <CardHeader className="space-y-3">
                        <div className="flex items-center justify-center">
                            <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-center">
                            {t('checkEmail') || 'E-postanızı Kontrol Edin'}
                        </CardTitle>
                        <CardDescription className="text-center">
                            {t('resetPasswordEmailSent') || 
                             'E-posta adresinize şifre sıfırlama linki gönderildi. Lütfen e-postanızı kontrol edin ve linke tıklayarak şifrenizi sıfırlayın.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                                <p className="mb-2">
                                    {t('emailCheckInstructions') || 
                                     'E-postanızı kontrol ettiyseniz ve şifre sıfırlama e-postasını bulamıyorsanız:'}
                                </p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>{t('checkSpamFolder') || 'Spam klasörünüzü kontrol edin'}</li>
                                    <li>{t('waitFewMinutes') || 'Birkaç dakika bekleyin ve tekrar kontrol edin'}</li>
                                    <li>{t('contactSupport') || 'Sorun devam ederse destek ekibi ile iletişime geçin'}</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                        <Link
                            href={`/${locale}/login`}
                            className="w-full"
                        >
                            <Button variant="outline" className="w-full">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {t('backToLogin') || 'Giriş Sayfasına Dön'}
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </>
        );
    }

    return (
        <>
            <CookieBanner />
            <Card className="w-full shadow-lg border-muted">
                <CardHeader className="space-y-3">
                    <div className="flex items-center justify-center">
                        <div className="rounded-full bg-primary/10 p-3">
                            <Mail className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">
                        {t('forgotPasswordTitle') || 'Şifremi Unuttum'}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {t('forgotPasswordDescription') || 
                         'E-posta adresinize şifre sıfırlama linki göndereceğiz. Lütfen e-posta adresinizi girin.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-center gap-4">
                        <LanguageSelectorInline />
                        <div className="h-8 w-px bg-border" />
                        <ThemeToggle />
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('emailLabel') || 'E-posta Adresi'}</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="email" 
                                                placeholder={t('emailPlaceholder') || 'ornek@email.com'} 
                                                {...field} 
                                                disabled={isLoading} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('sending') || 'Gönderiliyor...'}
                                    </>
                                ) : (
                                    <>
                                        <Mail className="mr-2 h-4 w-4" />
                                        {t('sendResetLink') || 'Sıfırlama Linki Gönder'}
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                    <Link
                        href={`/${locale}/login`}
                        className="hover:text-primary underline underline-offset-4 transition-colors inline-flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('backToLogin') || 'Giriş Sayfasına Dön'}
                    </Link>
                </CardFooter>
            </Card>
        </>
    );
}

