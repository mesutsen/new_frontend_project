'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { reportsService } from '@/services/reports.service';
import { dealersService } from '@/services/dealers.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, TrendingUp, CreditCard, Calendar, Download, Loader2 } from 'lucide-react';

export default function DealerFinancialPage() {
    const t = useTranslations('Financial');
    const locale = useLocale();
    const [dateFrom, setDateFrom] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

    // Get current dealer
    const { data: dealer } = useQuery({
        queryKey: ['current-dealer'],
        queryFn: () => dealersService.getCurrentDealer(),
        retry: false,
    });

    // Financial report
    const { data: financialData, isLoading: financialLoading } = useQuery({
        queryKey: ['financial-report', dealer?.id, dateFrom, dateTo],
        queryFn: () =>
            reportsService.getFinancial({
                dealerId: dealer?.id,
                from: dateFrom,
                to: dateTo,
            }),
        enabled: !!dealer?.id,
    });

    const summary = financialData
        ? {
              totalCommission: financialData.reduce((sum: number, row: any) => sum + (row.dealerCommission || 0), 0),
              monthlyCommission: financialData
                  .filter((row: any) => {
                      const rowDate = new Date(row.period);
                      const now = new Date();
                      return rowDate.getMonth() === now.getMonth() && rowDate.getFullYear() === now.getFullYear();
                  })
                  .reduce((sum: number, row: any) => sum + (row.dealerCommission || 0), 0),
              pendingCommission: 0,
              paidCommission: 0,
              currency: 'TRY',
          }
        : {
              totalCommission: 0,
              monthlyCommission: 0,
              pendingCommission: 0,
              paidCommission: 0,
              currency: 'TRY',
          };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Finansal Yönetim</h1>
                        <p className="text-muted-foreground mt-1">
                            Komisyon takibi, ödeme geçmişi ve gelir analizi
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => {}}>
                            <Download className="h-4 w-4 mr-2" />
                            CSV
                        </Button>
                        <Button variant="outline" onClick={() => {}}>
                            <Download className="h-4 w-4 mr-2" />
                            Excel
                        </Button>
                        <Button variant="outline" onClick={() => {}}>
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                        </Button>
                    </div>
                </div>

                {/* Date Range Filter */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Tarih Aralığı
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dateFrom">Başlangıç Tarihi</Label>
                                <Input
                                    id="dateFrom"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dateTo">Bitiş Tarihi</Label>
                                <Input
                                    id="dateTo"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Toplam Komisyon</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {summary.totalCommission.toLocaleString('tr-TR')} ₺
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Tüm zamanlar</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Bu Ay Komisyon</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {summary.monthlyCommission.toLocaleString('tr-TR')} ₺
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Bu ay kazanılan</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ödenen Komisyon</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {summary.paidCommission.toLocaleString('tr-TR')} ₺
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Ödenen tutar</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Bekleyen Komisyon</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {summary.pendingCommission.toLocaleString('tr-TR')} ₺
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Ödeme bekliyor</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Financial Report Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Finansal Rapor</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {financialLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="text-muted-foreground">
                                {financialData?.length ? (
                                    <p>Rapor verileri burada görüntülenecek</p>
                                ) : (
                                    <p>Henüz veri yok</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

