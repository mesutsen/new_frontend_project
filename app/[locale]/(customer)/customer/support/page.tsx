'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
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
    HelpCircle,
    FileText,
    MessageCircle,
    Plus,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supportService } from '@/services/support.service';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';

const supportFormSchema = z.object({
    subject: z.string().min(1, 'Konu gereklidir'),
    message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır'),
    category: z.string().min(1, 'Kategori seçiniz'),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
});

export default function CustomerSupportPage() {
    const t = useTranslations('Support');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);

    const form = useForm<z.infer<typeof supportFormSchema>>({
        resolver: zodResolver(supportFormSchema),
        defaultValues: {
            subject: '',
            message: '',
            category: '',
            priority: 'Medium',
        },
    });

    const onSubmit = async (data: z.infer<typeof supportFormSchema>) => {
        setIsSubmitting(true);
        try {
            await supportService.createTicket({
                subject: data.subject,
                message: data.message,
                category: data.category,
                priority: data.priority,
                attachments: attachments.length > 0 ? attachments : undefined,
            });
            toast.success(t('submitSuccess') || 'Talep başarıyla oluşturuldu');
            form.reset();
            setAttachments([]);
            router.push(`/${locale}/customer/support/tickets`);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || t('submitError') || 'Talep oluşturulurken hata oluştu');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-3 sm:space-y-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">{t('title') || 'Müşteri Hizmetleri'}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('description') || 'Size nasıl yardımcı olabiliriz?'}
                    </p>
                </div>

                <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
                    {/* Contact Information */}
                    <div className="space-y-3 sm:space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Phone className="h-5 w-5" />
                                    {t('contactInfo') || 'İletişim Bilgileri'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('phone') || 'Telefon'}</p>
                                    <p className="text-sm">+90 (212) 123 45 67</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('email') || 'E-posta'}</p>
                                    <p className="text-sm">destek@ersinsigorta.com</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('address') || 'Adres'}</p>
                                    <p className="text-sm">İstanbul, Türkiye</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('workingHours') || 'Çalışma Saatleri'}
                                    </p>
                                    <p className="text-sm">{t('workingHoursValue') || 'Pazartesi - Cuma: 09:00 - 18:00'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <HelpCircle className="h-5 w-5" />
                                    {t('quickHelp') || 'Hızlı Yardım'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => router.push(`/${locale}/customer/support/faq`)}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    {t('viewFaq') || 'Sıkça Sorulan Sorular'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => router.push(`/${locale}/customer/support/tickets`)}
                                >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    {t('myTickets') || 'Taleplerim'}
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
                                    {t('createTicket') || 'Yeni Talep Oluştur'}
                                </CardTitle>
                                <CardDescription>
                                    {t('createTicketDescription') || 'Sorununuzu detaylı bir şekilde açıklayın'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">{t('category') || 'Kategori'}</Label>
                                        <Select
                                            value={form.watch('category')}
                                            onValueChange={(value) => form.setValue('category', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('selectCategory') || 'Kategori seçiniz'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="General">{t('categoryGeneral') || 'Genel'}</SelectItem>
                                                <SelectItem value="Policy">{t('categoryPolicy') || 'Poliçe'}</SelectItem>
                                                <SelectItem value="Claim">{t('categoryClaim') || 'Hasar'}</SelectItem>
                                                <SelectItem value="Payment">{t('categoryPayment') || 'Ödeme'}</SelectItem>
                                                <SelectItem value="Technical">{t('categoryTechnical') || 'Teknik'}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {form.formState.errors.category && (
                                            <p className="text-sm text-destructive">
                                                {form.formState.errors.category.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="priority">{t('priority') || 'Öncelik'}</Label>
                                        <Select
                                            value={form.watch('priority') || 'Medium'}
                                            onValueChange={(value) =>
                                                form.setValue('priority', value as 'Low' | 'Medium' | 'High' | 'Urgent')
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Low">{t('priorityLow') || 'Düşük'}</SelectItem>
                                                <SelectItem value="Medium">{t('priorityMedium') || 'Orta'}</SelectItem>
                                                <SelectItem value="High">{t('priorityHigh') || 'Yüksek'}</SelectItem>
                                                <SelectItem value="Urgent">{t('priorityUrgent') || 'Acil'}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subject">{t('subject') || 'Konu'}</Label>
                                        <Input
                                            id="subject"
                                            {...form.register('subject')}
                                            placeholder={t('subjectPlaceholder') || 'Talep konusunu giriniz'}
                                        />
                                        {form.formState.errors.subject && (
                                            <p className="text-sm text-destructive">
                                                {form.formState.errors.subject.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message">{t('message') || 'Mesaj'}</Label>
                                        <Textarea
                                            id="message"
                                            {...form.register('message')}
                                            placeholder={t('messagePlaceholder') || 'Sorununuzu detaylı bir şekilde açıklayın...'}
                                            rows={6}
                                        />
                                        {form.formState.errors.message && (
                                            <p className="text-sm text-destructive">
                                                {form.formState.errors.message.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{t('attachments') || 'Ekler (Opsiyonel)'}</Label>
                                        <FileUpload
                                            accept="image/*,.pdf,.doc,.docx"
                                            multiple
                                            onFilesChange={(files) => setAttachments(files)}
                                            maxFiles={5}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                form.reset();
                                                setAttachments([]);
                                            }}
                                        >
                                            {tCommon('cancel') || 'İptal'}
                                        </Button>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    {t('submitting') || 'Gönderiliyor...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4 mr-2" />
                                                    {t('submit') || 'Gönder'}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

