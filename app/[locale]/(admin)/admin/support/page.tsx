'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Mail,
    Phone,
    MapPin,
    Clock,
    MessageSquare,
    Send,
    Loader2,
    CheckCircle2,
    HelpCircle,
    FileText,
    MessageCircle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const supportFormSchema = z.object({
    subject: z.string().min(1, 'Konu gereklidir'),
    message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    phone: z.string().optional(),
});

export default function SupportPage() {
    const t = useTranslations('Support');
    const locale = useLocale();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof supportFormSchema>>({
        resolver: zodResolver(supportFormSchema),
        defaultValues: {
            subject: '',
            message: '',
            email: '',
            phone: '',
        },
    });

    const onSubmit = async (data: z.infer<typeof supportFormSchema>) => {
        setIsSubmitting(true);
        try {
            // TODO: Backend endpoint'e gönderilecek
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success(t('submitSuccess'));
            form.reset();
        } catch (error) {
            toast.error(t('submitError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('description')}</p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Contact Information */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Phone className="h-5 w-5" />
                                    {t('contactInfo')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('phone')}</p>
                                    <p className="text-sm">+90 (212) 123 45 67</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('email')}</p>
                                    <p className="text-sm">destek@ersinsigorta.com</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('address')}</p>
                                    <p className="text-sm">İstanbul, Türkiye</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('workingHours')}</p>
                                    <p className="text-sm">{t('workingHoursValue')}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <HelpCircle className="h-5 w-5" />
                                    {t('faq')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">{t('faqDescription')}</p>
                                <Button variant="outline" className="w-full">
                                    <FileText className="mr-2 h-4 w-4" />
                                    {t('viewFaq')}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Support Form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" />
                                    {t('contactForm')}
                                </CardTitle>
                                <CardDescription>{t('contactFormDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <div>
                                        <Label>{t('email')}</Label>
                                        <Input
                                            type="email"
                                            {...form.register('email')}
                                            placeholder={t('emailPlaceholder')}
                                        />
                                        {form.formState.errors.email && (
                                            <p className="text-sm text-destructive mt-1">
                                                {form.formState.errors.email.message}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label>{t('phone')}</Label>
                                        <Input
                                            type="tel"
                                            {...form.register('phone')}
                                            placeholder={t('phonePlaceholder')}
                                        />
                                        {form.formState.errors.phone && (
                                            <p className="text-sm text-destructive mt-1">
                                                {form.formState.errors.phone.message}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label>{t('subject')}</Label>
                                        <Input
                                            {...form.register('subject')}
                                            placeholder={t('subjectPlaceholder')}
                                        />
                                        {form.formState.errors.subject && (
                                            <p className="text-sm text-destructive mt-1">
                                                {form.formState.errors.subject.message}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label>{t('message')}</Label>
                                        <Textarea
                                            {...form.register('message')}
                                            placeholder={t('messagePlaceholder')}
                                            rows={6}
                                        />
                                        {form.formState.errors.message && (
                                            <p className="text-sm text-destructive mt-1">
                                                {form.formState.errors.message.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            <Send className="mr-2 h-4 w-4" />
                                            {t('send')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Quick Links */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>{t('quickLinks')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-2">
                                    <Button variant="outline" className="justify-start">
                                        <FileText className="mr-2 h-4 w-4" />
                                        {t('documentation')}
                                    </Button>
                                    <Button variant="outline" className="justify-start">
                                        <MessageCircle className="mr-2 h-4 w-4" />
                                        {t('liveChat')}
                                    </Button>
                                    <Button variant="outline" className="justify-start">
                                        <HelpCircle className="mr-2 h-4 w-4" />
                                        {t('helpCenter')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

