'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { PolicyForm } from '@/components/policies/policy-form';
import { policiesService } from '@/services/policies.service';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function EditPolicyPage() {
    const router = useRouter();
    const params = useParams();
    const locale = useLocale();
    const t = useTranslations('Policies');
    const id = params.id as string;

    const { data: policy, isLoading, error } = useQuery({
        queryKey: ['policy', id],
        queryFn: () => policiesService.getPolicyById(id),
        enabled: !!id,
    });

    const handleSuccess = () => {
        router.push(`/${locale}/admin/policies`);
    };

    const handleCancel = () => {
        router.back();
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Poliçe yükleniyor...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !policy) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto space-y-6">
                    <Alert variant="destructive" className="mt-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Hata</AlertTitle>
                        <AlertDescription>
                            {error ? 'Poliçe yüklenirken bir hata oluştu' : 'Poliçe bulunamadı'}
                        </AlertDescription>
                    </Alert>
                    <Button onClick={() => router.back()} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Geri Dön
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 w-full">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="shrink-0"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold tracking-tight">{t('editTitle') || 'Poliçe Düzenle'}</h1>
                                    {policy.policyNumber && (
                                        <Badge variant="outline" className="text-sm font-mono">
                                            {policy.policyNumber}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground mt-1">{t('editDescription') || 'Poliçe bilgilerini güncelleyin'}</p>
                            </div>
                        </div>
                    </div>
                    <Separator />
                </div>

                {/* Form Card */}
                <Card className="shadow-sm">
                    <CardContent className="pt-6">
                        <PolicyForm
                            policy={policy}
                            onSuccess={handleSuccess}
                            onCancel={handleCancel}
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

