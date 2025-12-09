'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { CreditCard, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DealerPaymentsPage() {
    const t = useTranslations('Payments');
    const locale = useLocale();

    // TODO: paymentsService oluşturulmalı
    const { data: paymentHistory, isLoading } = useQuery({
        queryKey: ['payment-history'],
        queryFn: async () => {
            // Placeholder - paymentsService.getHistory() çağrılacak
            return { items: [], totalCount: 0 };
        },
    });

    const totalAmount = paymentHistory?.items
        .filter((p: any) => p.status === 'succeeded')
        .reduce((sum: number, p: any) => sum + (p.amount / 100 || 0), 0) || 0;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Ödeme Geçmişi</h1>
                        <p className="text-muted-foreground mt-1">Tüm ödeme işlemleriniz</p>
                    </div>
                </div>

                {/* Summary Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Ödenen</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAmount.toLocaleString('tr-TR')} ₺</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {paymentHistory?.items.filter((p: any) => p.status === 'succeeded').length || 0}{' '}
                            başarılı işlem
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Ödeme İşlemleri</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tarih</TableHead>
                                        <TableHead>Tutar</TableHead>
                                        <TableHead>Yöntem</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Açıklama</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentHistory?.items.length ? (
                                        paymentHistory.items.map((payment: any) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>
                                                    {new Date(payment.createdAt).toLocaleDateString('tr-TR')}
                                                </TableCell>
                                                <TableCell>
                                                    {(payment.amount / 100).toLocaleString('tr-TR')}{' '}
                                                    {payment.currency}
                                                </TableCell>
                                                <TableCell>{payment.method}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            payment.status === 'succeeded'
                                                                ? 'default'
                                                                : payment.status === 'failed'
                                                                  ? 'destructive'
                                                                  : 'secondary'
                                                        }
                                                    >
                                                        {payment.status === 'succeeded'
                                                            ? 'Başarılı'
                                                            : payment.status === 'failed'
                                                              ? 'Başarısız'
                                                              : 'İşleniyor'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{payment.description || '-'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                Henüz ödeme işlemi yok
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

