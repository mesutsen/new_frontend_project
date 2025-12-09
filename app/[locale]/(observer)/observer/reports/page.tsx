'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { observersService } from '@/services/observers.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    FileBarChart,
    Download,
    Loader2,
    AlertCircle,
    Calendar,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ObserverReportsPage() {
    const t = useTranslations('ObserverReports');
    const tCommon = useTranslations('Common');
    const locale = useLocale();

    const [dateFrom, setDateFrom] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
    const [reportType, setReportType] = useState<string>('all');

    const { data: reports, isLoading, error } = useQuery({
        queryKey: ['observer-reports', dateFrom, dateTo, reportType],
        queryFn: () =>
            observersService.getReports({
                dateFrom,
                dateTo,
                type: reportType === 'all' ? undefined : reportType,
            }),
    });

    const handleExport = async (reportId: string, format: 'pdf' | 'excel') => {
        try {
            // TODO: Implement export when API is available
            toast.success(t('exportSuccess') || 'Rapor indiriliyor...');
        } catch (error) {
            toast.error(t('exportError') || 'Rapor indirilirken hata oluştu');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{tCommon('errorTitle') || 'Hata'}</AlertTitle>
                <AlertDescription>
                    {t('loadError') || 'Raporlar yüklenirken hata oluştu'}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-3 sm:space-y-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">{t('title') || 'Raporlar'}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('description') || 'Bayi performans raporlarını görüntüleyin ve indirin'}
                    </p>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>{tCommon('filters') || 'Filtreler'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="reportType">{t('reportType') || 'Rapor Tipi'}</Label>
                                <Select value={reportType} onValueChange={setReportType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('allTypes') || 'Tüm Tipler'}</SelectItem>
                                        <SelectItem value="Sales">{t('typeSales') || 'Satış'}</SelectItem>
                                        <SelectItem value="Performance">
                                            {t('typePerformance') || 'Performans'}
                                        </SelectItem>
                                        <SelectItem value="Regional">{t('typeRegional') || 'Bölgesel'}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="dateFrom" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {tCommon('dateFrom') || 'Başlangıç'}
                                </Label>
                                <Input
                                    id="dateFrom"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="dateTo" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {tCommon('dateTo') || 'Bitiş'}
                                </Label>
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

                {/* Reports Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('reportList') || 'Rapor Listesi'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('title') || 'Başlık'}</TableHead>
                                        <TableHead>{t('type') || 'Tip'}</TableHead>
                                        <TableHead>{t('dateRange') || 'Tarih Aralığı'}</TableHead>
                                        <TableHead>{t('createdAt') || 'Oluşturulma'}</TableHead>
                                        <TableHead className="text-right">{tCommon('actions') || 'İşlemler'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports && reports.length > 0 ? (
                                        reports.map((report) => (
                                            <TableRow key={report.id}>
                                                <TableCell className="font-medium">{report.title}</TableCell>
                                                <TableCell>{report.type}</TableCell>
                                                <TableCell>
                                                    {new Date(report.dateFrom).toLocaleDateString(locale)} -{' '}
                                                    {new Date(report.dateTo).toLocaleDateString(locale)}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(report.createdAt).toLocaleDateString(locale)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm">
                                                                <Download className="h-4 w-4 mr-2" />
                                                                {tCommon('export') || 'Dışa Aktar'}
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => handleExport(report.id, 'pdf')}
                                                            >
                                                                {tCommon('exportPdf') || 'PDF'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleExport(report.id, 'excel')}
                                                            >
                                                                {tCommon('exportExcel') || 'Excel'}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <FileBarChart className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-muted-foreground">
                                                        {t('noReports') || 'Henüz rapor bulunmamaktadır.'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
        </div>
    );
}

