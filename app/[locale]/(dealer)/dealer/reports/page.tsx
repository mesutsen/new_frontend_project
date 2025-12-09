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
import { FileText, TrendingUp, Users, Download, Loader2 } from 'lucide-react';

type ReportTab = 'sales' | 'customers' | 'performance';

export default function DealerReportsPage() {
    const t = useTranslations('Reports');
    const locale = useLocale();
    const [activeTab, setActiveTab] = useState<ReportTab>('sales');
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

    const filter = {
        dealerId: dealer?.id,
        from: dateFrom,
        to: dateTo,
    };

    // Sales Report
    const { data: salesData, isLoading: salesLoading } = useQuery({
        queryKey: ['sales-report', dealer?.id, dateFrom, dateTo],
        queryFn: () => reportsService.getPolicies(filter),
        enabled: !!dealer?.id && activeTab === 'sales',
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Raporlar</h1>
                        <p className="text-muted-foreground mt-1">
                            Satış, müşteri ve performans raporları
                        </p>
                    </div>
                </div>

                {/* Date Range Filter */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tarih Aralığı</CardTitle>
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

                {/* Tabs */}
                <div className="flex gap-2 border-b">
                    <Button
                        variant={activeTab === 'sales' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('sales')}
                        className="rounded-b-none"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Satış Raporları
                    </Button>
                    <Button
                        variant={activeTab === 'performance' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('performance')}
                        className="rounded-b-none"
                    >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Performans Analizi
                    </Button>
                    <Button
                        variant={activeTab === 'customers' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('customers')}
                        className="rounded-b-none"
                    >
                        <Users className="h-4 w-4 mr-2" />
                        Müşteri Raporları
                    </Button>
                </div>

                {/* Sales Report */}
                {activeTab === 'sales' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Satış Raporu</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {salesLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="text-muted-foreground">
                                    {salesData?.length ? (
                                        <p>Satış raporu verileri burada görüntülenecek</p>
                                    ) : (
                                        <p>Henüz veri yok</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Performance Report */}
                {activeTab === 'performance' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Performans Raporu</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Performans raporu verileri burada görüntülenecek
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Customer Report */}
                {activeTab === 'customers' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Müşteri Raporları</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Müşteri raporları özelliği yakında eklenecek.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}

