'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { customersService } from '@/services/customers.service';
import { CustomerForm } from '@/components/customers/customer-form';
import { Loader2 } from 'lucide-react';

export default function EditCustomerPage() {
    const params = useParams();
    const router = useRouter();
    const locale = useLocale();
    const id = params.id as string;

    const { data, isLoading } = useQuery({
        queryKey: ['customer', id],
        queryFn: () => customersService.getCustomerById(id),
    });

    if (isLoading || !data) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Müşteri Düzenle</h1>
                <CustomerForm
                    dealerId={data.dealerId}
                    customer={data}
                    onSuccess={() => router.push(`/${locale}/dealer/customers/${id}`)}
                    onCancel={() => router.push(`/${locale}/dealer/customers/${id}`)}
                />
            </div>
        </DashboardLayout>
    );
}

