'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/components/providers/auth-provider';
import { authService } from '@/services/auth.service';
import { gdprService } from '@/services/gdpr.service';
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
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ExternalLink } from 'lucide-react';
import { CookieBanner } from '@/components/cookie-banner';
import { cookieService } from '@/services/cookie.service';

const loginSchema = z.object({
    userName: z.string().min(1, 'Username is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    privacyConsent: z.boolean().refine((val) => val === true, {
        message: 'Privacy consent is required',
    }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const t = useTranslations('Auth');
    const locale = useLocale();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            userName: '',
            password: '',
            privacyConsent: false,
        },
    });

    /**
     * Login form submit handler
     * 
     * GDPR/KVKK Uyumluluk Notu:
     * - Onay login ÖNCESİ alınıyor (checkbox zorunlu) - GDPR uyumlu
     * - Backend kaydı login SONRASI yapılıyor - UserId gerektiği için teknik zorunluluk
     * - Bu yaklaşım GDPR/KVKK gereksinimlerini karşılar çünkü:
     *   1. Veri işleme başlamadan önce onay alınıyor
     *   2. Onay kaydı backend'de güvenli şekilde saklanıyor
     */
    async function onSubmit(data: LoginFormValues) {
        setIsLoading(true);
        try {
            // GDPR/KVKK: Onay login öncesi alındı (form validasyonu ile zorunlu)
            // Şimdi login işlemini gerçekleştiriyoruz
            const response = await authService.login(data);

            if (!response || !response.user) {
                throw new Error('Invalid response from server');
            }

            // Login başarılı - kullanıcıyı sisteme al
            // requiresPasswordChange flag'ini kontrol et
            login(
                response.user,
                response.accessToken,
                response.refreshToken,
                response.requiresPasswordChange || false
            );

            // GDPR/KVKK: Onayı backend'e kaydet (fire-and-forget, yönlendirmeyi engellemesin)
            // Not: Onay zaten login öncesi alındı, şimdi backend'de kaydediyoruz
            // Bu işlem yönlendirmeyi engellememesi için async olarak çalıştırılıyor
            (async () => {
                try {
                    const ipAddress = typeof window !== 'undefined' ? await getClientIp() : undefined;
                    
                    await gdprService.setConsent(
                        {
                            purpose: 'privacy_policy_and_terms',
                            granted: true,
                            metadata: {
                                acceptedAt: new Date().toISOString(),
                                locale,
                                ipAddress,
                                userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
                                // Onayın login öncesi alındığını belirt
                                preLoginConsent: true,
                            },
                        },
                        response.accessToken // Token ile backend'e kaydet
                    );
                } catch (consentError) {
                    // Onay kaydı başarısız olsa bile login devam etsin
                    // Log'a kaydedelim ki takip edilebilsin
                    console.warn('GDPR consent kaydı başarısız (login devam ediyor):', consentError);
                }
            })();

            // Cookie tercihlerini backend'e kaydet (fire-and-forget)
            (async () => {
                try {
                    await cookieService.syncToBackend(response.accessToken);
                } catch (cookieError) {
                    // Cookie tercihleri kaydı başarısız olsa bile login devam etsin
                    console.warn('Cookie tercihleri kaydı başarısız (login devam ediyor):', cookieError);
                }
            })();

            toast.success(t('loginSuccess'));
        } catch (error: any) {
            console.error('Login error:', error);
            toast.error(error.response?.data?.detail || error.message || t('loginError'));
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Client IP adresini almak için yardımcı fonksiyon
     * GDPR/KVKK uyumluluğu için IP adresi kaydı
     */
    async function getClientIp(): Promise<string | undefined> {
        if (typeof window === 'undefined') return undefined;
        
        try {
            // Timeout ile IP servisi çağrısı
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 saniye timeout
            
            const response = await fetch('https://api.ipify.org?format=json', {
                signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            const data = await response.json();
            return data.ip;
        } catch (error) {
            // IP alınamazsa sessizce devam et (opsiyonel veri)
            console.debug('IP adresi alınamadı (opsiyonel):', error);
            return undefined;
        }
    }

    return (
        <>
            <CookieBanner />
            <Card className="w-full shadow-lg border-muted">
            <CardHeader className="space-y-3">
                <CardTitle className="text-2xl font-bold text-center">{t('loginTitle')}</CardTitle>
                <CardDescription className="text-center">
                    {t('loginDescription')}
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
                            name="userName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('usernameLabel')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="username" {...field} disabled={isLoading} />
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
                                    <FormLabel>{t('passwordLabel')}</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="privacyConsent"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="text-sm font-normal cursor-pointer">
                                            {t('privacyConsent')}
                                        </FormLabel>
                                        <div className="text-xs text-muted-foreground space-y-2">
                                            <p>{t('privacyConsentText')}</p>
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={`/${locale}/privacy-policy`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {t('privacyPolicyLink')}
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                                <span className="text-muted-foreground">•</span>
                                                <Link
                                                    href={`/${locale}/terms-of-service`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {t('termsOfServiceLink')}
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </div>
                                        </div>
                                        <FormMessage />
                                    </div>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('loggingIn')}
                                </>
                            ) : (
                                t('loginButton')
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                <Link
                    href={`/${locale}/forgot-password`}
                    className="hover:text-primary underline underline-offset-4 transition-colors"
                >
                    {t('forgotPassword')}
                </Link>
            </CardFooter>
        </Card>
        </>
    );
}
