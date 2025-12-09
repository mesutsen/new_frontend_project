'use client';

import { useRouter, useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { PolicyForm } from '@/components/policies/policy-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function NewPolicyPage() {
    const router = useRouter();
    const params = useParams();
    const locale = useLocale();
    const t = useTranslations('Policies');

    const handleSuccess = () => {
        router.push(`/${locale}/admin/policies`);
    };

    const handleCancel = () => {
        router.back();
    };

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
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{t('createTitle') || 'Yeni Poliçe Oluştur'}</h1>
                                <p className="text-muted-foreground mt-1">{t('createDescription') || 'Yeni bir poliçe oluşturun'}</p>
                            </div>
                        </div>
                    </div>
                    <Separator />
                </div>

                {/* Form Card */}
                <Card className="shadow-sm">
                    <CardContent className="pt-6">
                        <PolicyForm
                            onSuccess={handleSuccess}
                            onCancel={handleCancel}
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

