'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { reportsService, ReportFilterDto } from '@/services/reports.service';
import { dealersService } from '@/services/dealers.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
    Download,
    Loader2,
    FileBarChart,
    AlertCircle,
    Search,
    Calendar,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

type ReportType = 'policies' | 'dealers' | 'performance' | 'financial' | 'analytics' | 'predictions';

export default function ReportsPage() {
    const t = useTranslations('Reports');
    const format = useFormatter();
    const locale = useLocale();

    const [activeTab, setActiveTab] = useState<ReportType>('policies');
    const [filter, setFilter] = useState<ReportFilterDto>({
        search: '',
        dealerId: undefined,
        from: undefined,
        to: undefined,
    });
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');

    // Dealers listesi (filtre için)
    const { data: dealersData } = useQuery({
        queryKey: ['dealers'],
        queryFn: () => dealersService.getDealers({ page: 1, pageSize: 1000 }),
    });

    // Policies report
    const { data: policiesData, isLoading: policiesLoading, error: policiesError } = useQuery({
        queryKey: ['reports', 'policies', filter],
        queryFn: () => reportsService.getPolicies(filter),
        enabled: activeTab === 'policies',
    });

    // Dealers report
    const { data: dealersReportData, isLoading: dealersLoading, error: dealersError } = useQuery({
        queryKey: ['reports', 'dealers', filter],
        queryFn: () => reportsService.getDealers(filter),
        enabled: activeTab === 'dealers',
    });

    // Dealer Performance report
    const { data: performanceData, isLoading: performanceLoading, error: performanceError } = useQuery({
        queryKey: ['reports', 'performance', filter],
        queryFn: () => reportsService.getDealerPerformance(filter),
        enabled: activeTab === 'performance',
    });

    // Financial report
    const { data: financialData, isLoading: financialLoading, error: financialError } = useQuery({
        queryKey: ['reports', 'financial', filter],
        queryFn: () => reportsService.getFinancial(filter),
        enabled: activeTab === 'financial',
    });

    // Analytics report
    const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery({
        queryKey: ['reports', 'analytics', filter],
        queryFn: () => reportsService.getAnalytics(filter),
        enabled: activeTab === 'analytics',
    });

    // Predictions report
    const { data: predictionsData, isLoading: predictionsLoading, error: predictionsError } = useQuery({
        queryKey: ['reports', 'predictions', filter],
        queryFn: () => reportsService.getPredictions(filter),
        enabled: activeTab === 'predictions',
    });

    const handleApplyFilter = () => {
        const newFilter: ReportFilterDto = {
            search: filter.search || undefined,
            dealerId: filter.dealerId || undefined,
            from: fromDate ? new Date(fromDate).toISOString() : undefined,
            to: toDate ? new Date(toDate).toISOString() : undefined,
        };
        setFilter(newFilter);
    };

    const handleResetFilter = () => {
        setFilter({});
        setFromDate('');
        setToDate('');
    };

    const handleExport = async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
        try {
            const exportFilter: ReportFilterDto = {
                ...filter,
                from: fromDate ? new Date(fromDate).toISOString() : undefined,
                to: toDate ? new Date(toDate).toISOString() : undefined,
            };

            let reportType: 'policies' | 'dealers' | 'financial' | 'analytics' | 'predictions';
            if (activeTab === 'policies') reportType = 'policies';
            else if (activeTab === 'dealers' || activeTab === 'performance') reportType = 'dealers';
            else if (activeTab === 'financial') reportType = 'financial';
            else if (activeTab === 'analytics') reportType = 'analytics';
            else reportType = 'predictions';

            const blob = await reportsService.export(reportType, format, exportFilter);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportType}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success(t('exportSuccess'));
        } catch (error: any) {
            toast.error(error.response?.data?.detail || t('exportError'));
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : locale === 'bg' ? 'bg-BG' : 'en-US', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const isLoading =
        (activeTab === 'policies' && policiesLoading) ||
        (activeTab === 'dealers' && dealersLoading) ||
        (activeTab === 'performance' && performanceLoading) ||
        (activeTab === 'financial' && financialLoading) ||
        (activeTab === 'analytics' && analyticsLoading) ||
        (activeTab === 'predictions' && predictionsLoading);

    const error =
        (activeTab === 'policies' && policiesError) ||
        (activeTab === 'dealers' && dealersError) ||
        (activeTab === 'performance' && performanceError) ||
        (activeTab === 'financial' && financialError) ||
        (activeTab === 'analytics' && analyticsError) ||
        (activeTab === 'predictions' && predictionsError);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('title')}</h1>
                        <p className="text-muted-foreground">{t('description')}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleExport('csv')} disabled={isLoading}>
                            <Download className="mr-2 h-4 w-4" />
                            CSV
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('excel')} disabled={isLoading}>
                            <Download className="mr-2 h-4 w-4" />
                            Excel
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('pdf')} disabled={isLoading}>
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            {t('filters')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div>
                                <Label>{t('search')}</Label>
                                <Input
                                    placeholder={t('searchPlaceholder')}
                                    value={filter.search || ''}
                                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>{t('dealer')}</Label>
                                <Select
                                    value={filter.dealerId || 'all'}
                                    onValueChange={(value) =>
                                        setFilter({ ...filter, dealerId: value === 'all' ? undefined : value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectDealer')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('allDealers')}</SelectItem>
                                        {dealersData?.items.map((dealer) => (
                                            <SelectItem key={dealer.id} value={dealer.id}>
                                                {dealer.name} ({dealer.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>{t('fromDate')}</Label>
                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>{t('toDate')}</Label>
                                <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button onClick={handleApplyFilter}>
                                <Search className="mr-2 h-4 w-4" />
                                {t('apply')}
                            </Button>
                            <Button variant="outline" onClick={handleResetFilter}>
                                {t('reset')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Error State */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t('errorTitle')}</AlertTitle>
                        <AlertDescription>{t('errorDescription')}</AlertDescription>
                    </Alert>
                )}

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportType)}>
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="policies">{t('policies')}</TabsTrigger>
                        <TabsTrigger value="dealers">{t('dealers')}</TabsTrigger>
                        <TabsTrigger value="performance">{t('performance')}</TabsTrigger>
                        <TabsTrigger value="financial">{t('financial')}</TabsTrigger>
                        <TabsTrigger value="analytics">{t('analytics')}</TabsTrigger>
                        <TabsTrigger value="predictions">{t('predictions')}</TabsTrigger>
                    </TabsList>

                    {/* Policies Report */}
                    <TabsContent value="policies" className="space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !policiesData || policiesData.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">{t('noData')}</div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('policyNumber')}</TableHead>
                                            <TableHead>{t('policyType')}</TableHead>
                                            <TableHead>{t('dealer')}</TableHead>
                                            <TableHead>{t('customer')}</TableHead>
                                            <TableHead>{t('vehiclePlate')}</TableHead>
                                            <TableHead>{t('startDate')}</TableHead>
                                            <TableHead>{t('endDate')}</TableHead>
                                            <TableHead className="text-right">{t('premium')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {policiesData.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{row.policyNumber}</TableCell>
                                                <TableCell>{row.policyType}</TableCell>
                                                <TableCell>{row.dealer}</TableCell>
                                                <TableCell>{row.customer}</TableCell>
                                                <TableCell>{row.vehiclePlate}</TableCell>
                                                <TableCell>
                                                    {format.dateTime(new Date(row.startDate), {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    {format.dateTime(new Date(row.endDate), {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(row.premium)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    {/* Dealers Report */}
                    <TabsContent value="dealers" className="space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !dealersReportData || dealersReportData.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">{t('noData')}</div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('dealer')}</TableHead>
                                            <TableHead className="text-right">{t('policyCount')}</TableHead>
                                            <TableHead className="text-right">{t('totalPremium')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dealersReportData.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{row.dealer}</TableCell>
                                                <TableCell className="text-right">{row.policyCount}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(row.totalPremium)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    {/* Performance Report */}
                    <TabsContent value="performance" className="space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !performanceData || performanceData.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">{t('noData')}</div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('dealer')}</TableHead>
                                            <TableHead className="text-right">{t('policyCount')}</TableHead>
                                            <TableHead className="text-right">{t('totalPremium')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {performanceData.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{row.dealer}</TableCell>
                                                <TableCell className="text-right">{row.policyCount}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(row.totalPremium)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    {/* Financial Report */}
                    <TabsContent value="financial" className="space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !financialData || financialData.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">{t('noData')}</div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('period')}</TableHead>
                                            <TableHead className="text-right">{t('premium')}</TableHead>
                                            <TableHead className="text-right">{t('dealerCommission')}</TableHead>
                                            <TableHead className="text-right">{t('observerCommission')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {financialData.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{row.period}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(row.premium)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(row.dealerCommission)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(row.observerCommission)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    {/* Analytics Report */}
                    <TabsContent value="analytics" className="space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !analyticsData || analyticsData.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">{t('noData')}</div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('metric')}</TableHead>
                                            <TableHead className="text-right">{t('value')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {analyticsData.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{row.metric}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(row.value)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    {/* Predictions Report */}
                    <TabsContent value="predictions" className="space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !predictionsData || predictionsData.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">{t('noData')}</div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('period')}</TableHead>
                                            <TableHead className="text-right">{t('predictedPremium')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {predictionsData.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{row.period}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(row.predictedPremium)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}

