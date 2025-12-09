'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { claimsService } from '@/services/claims.service';
import { policiesService } from '@/services/policies.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    Send,
    MapPin,
    Calendar,
    DollarSign,
    FileText,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { FileUpload } from '@/components/ui/file-upload';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const claimFormSchema = z.object({
    policyId: z.string().min(1, 'Poliçe seçiniz'),
    claimType: z.string().min(1, 'Hasar tipi seçiniz'),
    description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
    claimDate: z.string().min(1, 'Hasar tarihi gereklidir'),
    incidentLocation: z.string().optional(),
    estimatedDamage: z.string().optional(),
});

export default function NewClaimPage() {
    const t = useTranslations('Claims');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const router = useRouter();

    const [attachments, setAttachments] = useState<File[]>([]);

    // Get customer's active policies
    const { data: policiesData } = useQuery({
        queryKey: ['customer-policies-for-claim'],
        queryFn: () =>
            policiesService.getPolicies({
                page: 1,
                pageSize: 100,
                status: 'Active',
            }),
    });

    const form = useForm<z.infer<typeof claimFormSchema>>({
        resolver: zodResolver(claimFormSchema),
        defaultValues: {
            policyId: '',
            claimType: '',
            description: '',
            claimDate: new Date().toISOString().split('T')[0],
            incidentLocation: '',
            estimatedDamage: '',
        },
    });

    const createClaimMutation = useMutation({
        mutationFn: (data: z.infer<typeof claimFormSchema>) =>
            claimsService.createClaim({
                policyId: data.policyId,
                claimType: data.claimType,
                description: data.description,
                claimDate: data.claimDate,
                incidentLocation: data.incidentLocation || undefined,
                estimatedDamage: data.estimatedDamage ? parseFloat(data.estimatedDamage) : undefined,
                attachments: attachments.length > 0 ? attachments : undefined,
            }),
        onSuccess: () => {
            toast.success(t('createSuccess') || 'Hasar bildirimi başarıyla oluşturuldu');
            router.push(`/${locale}/customer/claims`);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || t('createError') || 'Hasar bildirimi oluşturulurken hata oluştu');
        },
    });

    const onSubmit = (data: z.infer<typeof claimFormSchema>) => {
        createClaimMutation.mutate(data);
    };

    return (
        <DashboardLayout>
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/${locale}/customer/claims`)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">{t('reportClaim') || 'Hasar Bildirimi'}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('reportClaimDescription') || 'Hasarınızı hızlıca bildirin'}
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('claimInformation') || 'Hasar Bilgileri'}</CardTitle>
                        <CardDescription>
                            {t('claimInformationDescription') || 'Lütfen hasar bilgilerinizi eksiksiz doldurun'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="policyId">{t('policy') || 'Poliçe'}</Label>
                                <Select
                                    value={form.watch('policyId')}
                                    onValueChange={(value) => form.setValue('policyId', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectPolicy') || 'Poliçe seçiniz'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {policiesData?.items
                                            ?.filter((p) => p.status === 'Active')
                                            .map((policy) => (
                                                <SelectItem key={policy.id} value={policy.id}>
                                                    {policy.policyNumber} - {policy.policyType}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.policyId && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.policyId.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="claimType">{t('claimType') || 'Hasar Tipi'}</Label>
                                <Select
                                    value={form.watch('claimType')}
                                    onValueChange={(value) => form.setValue('claimType', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectClaimType') || 'Hasar tipi seçiniz'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Accident">{t('claimTypeAccident') || 'Kaza'}</SelectItem>
                                        <SelectItem value="Theft">{t('claimTypeTheft') || 'Hırsızlık'}</SelectItem>
                                        <SelectItem value="Fire">{t('claimTypeFire') || 'Yangın'}</SelectItem>
                                        <SelectItem value="NaturalDisaster">
                                            {t('claimTypeNaturalDisaster') || 'Doğal Afet'}
                                        </SelectItem>
                                        <SelectItem value="Vandalism">{t('claimTypeVandalism') || 'Vandalizm'}</SelectItem>
                                        <SelectItem value="Other">{t('claimTypeOther') || 'Diğer'}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.claimType && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.claimType.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="claimDate" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {t('claimDate') || 'Hasar Tarihi'}
                                </Label>
                                <Input
                                    id="claimDate"
                                    type="date"
                                    {...form.register('claimDate')}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                                {form.formState.errors.claimDate && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.claimDate.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="incidentLocation" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {t('incidentLocation') || 'Olay Yeri (Opsiyonel)'}
                                </Label>
                                <Input
                                    id="incidentLocation"
                                    {...form.register('incidentLocation')}
                                    placeholder={t('incidentLocationPlaceholder') || 'Olay yerini giriniz'}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="estimatedDamage" className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    {t('estimatedDamage') || 'Tahmini Hasar Tutarı (Opsiyonel)'}
                                </Label>
                                <Input
                                    id="estimatedDamage"
                                    type="number"
                                    step="0.01"
                                    {...form.register('estimatedDamage')}
                                    placeholder={t('estimatedDamagePlaceholder') || '0.00'}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">{t('description') || 'Açıklama'}</Label>
                                <Textarea
                                    id="description"
                                    {...form.register('description')}
                                    placeholder={t('descriptionPlaceholder') || 'Hasarı detaylı bir şekilde açıklayın...'}
                                    rows={6}
                                />
                                {form.formState.errors.description && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.description.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>{t('attachments') || 'Ekler (Fotoğraf/Video)'}</Label>
                                <FileUpload
                                    accept="image/*,.pdf,.mp4"
                                    multiple
                                    onFilesChange={(files) => setAttachments(files)}
                                    maxFiles={10}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t('attachmentsNote') || 'Maksimum 10 dosya yükleyebilirsiniz. Desteklenen formatlar: JPG, PNG, PDF, MP4'}
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push(`/${locale}/customer/claims`)}
                                >
                                    {tCommon('cancel') || 'İptal'}
                                </Button>
                                <Button type="submit" disabled={createClaimMutation.isPending}>
                                    {createClaimMutation.isPending ? (
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
        </DashboardLayout>
    );
}

