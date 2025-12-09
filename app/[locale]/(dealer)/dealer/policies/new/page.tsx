'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { dealersService } from '@/services/dealers.service';
import { PolicyForm } from '@/components/policies/policy-form';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function NewPolicyPage() {
    const t = useTranslations('Policies');
    const locale = useLocale();
    const router = useRouter();

    // Get current dealer
    const { data: dealer, isLoading } = useQuery({
        queryKey: ['current-dealer'],
        queryFn: () => dealersService.getCurrentDealer(),
        retry: false,
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!dealer?.id) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold">Yeni Poliçe</h1>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Hata</AlertTitle>
                        <AlertDescription>
                            Bayi bilgisi bulunamadı. Lütfen yöneticinizle iletişime geçin.
                        </AlertDescription>
                    </Alert>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Yeni Poliçe</h1>
                <PolicyForm
                    dealerId={dealer.id}
                    onSuccess={() => router.push(`/${locale}/dealer/policies`)}
                    onCancel={() => router.push(`/${locale}/dealer/policies`)}
                />
            </div>
        </DashboardLayout>
    );
}

