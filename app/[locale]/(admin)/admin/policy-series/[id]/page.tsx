'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { policySeriesService } from '@/services/policy-series.service';
import { dealersService } from '@/services/dealers.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    ArrowLeft,
    FileText,
    Calendar,
    Loader2,
    AlertCircle,
    TrendingUp,
    Hash,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Copy,
    Check,
    Building2,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function PolicySeriesDetailPage() {
    const params = useParams();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('PolicySeries');
    const tCommon = useTranslations('Common');
    const queryClient = useQueryClient();
    const id = params.id as string;

    const [copiedValue, setCopiedValue] = useState<string | null>(null);
    const [isAssignDealerDialogOpen, setIsAssignDealerDialogOpen] = useState(false);
    const [selectedDealerId, setSelectedDealerId] = useState<string>('');

    const { data: series, isLoading, error } = useQuery({
        queryKey: ['policy-series', id],
        queryFn: () => policySeriesService.getPolicySeriesById(id),
        enabled: !!id,
    });

    const { data: statistics } = useQuery({
        queryKey: ['policy-series-statistics', id],
        queryFn: () => policySeriesService.getSeriesStatistics(id),
        enabled: !!id,
    });

    // Dealer bilgilerini çek (opsiyonel - hata durumunda sayfa çalışmaya devam eder)
    const { data: dealer, error: dealerError } = useQuery({
        queryKey: ['dealer', series?.dealerId],
        queryFn: () => dealersService.getDealerById(series!.dealerId),
        enabled: !!series?.dealerId,
        retry: false,
    });

    // Bayileri getir (atama için)
    const { data: dealersData } = useQuery({
        queryKey: ['dealers', { page: 1, pageSize: 100 }],
        queryFn: () => dealersService.getDealers({ page: 1, pageSize: 100 }),
    });

    const getNextNumberMutation = useMutation({
        mutationFn: () => policySeriesService.getNextNumber(id),
        onSuccess: (data) => {
            toast.success(t('nextNumberSuccess', { number: data.number }));
            queryClient.invalidateQueries({ queryKey: ['policy-series'] });
        },
        onError: () => {
            toast.error(t('nextNumberError'));
        },
    });

    const generateFullNumberMutation = useMutation({
        mutationFn: () => policySeriesService.generateFullPolicyNumber(id),
        onSuccess: (data) => {
            toast.success(t('fullNumberSuccess', { number: data.policyNumber }));
        },
        onError: () => {
            toast.error(t('fullNumberError'));
        },
    });

    const assignDealerMutation = useMutation({
        mutationFn: (dealerId: string) => policySeriesService.assignDealer(id, dealerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policy-series', id] });
            queryClient.invalidateQueries({ queryKey: ['dealer'] });
            toast.success(t('assignDealerSuccess') || 'Bayi başarıyla atandı');
            setIsAssignDealerDialogOpen(false);
            setSelectedDealerId('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || t('assignDealerError') || 'Bayi atama sırasında bir hata oluştu');
        },
    });

    const copyToClipboard = async (text: string, label: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedValue(text);
        toast.success(t('copied', { value: label }));
        setTimeout(() => setCopiedValue(null), 2000);
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !series) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('errorTitle')}</AlertTitle>
                    <AlertDescription>{t('errorDescription')}</AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    const usagePercentage = statistics?.usagePercentage ||
        Math.round(((series.currentNumber - series.startNumber) / (series.endNumber - series.startNumber + 1)) * 100);
    const remaining = series.endNumber - series.currentNumber;
    const total = series.endNumber - series.startNumber + 1;
    const used = series.currentNumber - series.startNumber;

    return (
        <DashboardLayout>
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/${locale}/admin/policy-series`)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">{series.series}</h1>
                        <p className="text-sm text-muted-foreground">{t('detailTitle')}</p>
                    </div>
                </div>

                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    {/* Temel Bilgiler */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Hash className="h-5 w-5" />
                                {t('basicInfo')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('series')}</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-base font-mono font-semibold">{series.series}</p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => copyToClipboard(series.series, t('series'))}
                                    >
                                        {copiedValue === series.series ? (
                                            <Check className="h-3 w-3 text-green-600" />
                                        ) : (
                                            <Copy className="h-3 w-3" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">{t('dealer')}</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedDealerId(series.dealerId);
                                            setIsAssignDealerDialogOpen(true);
                                        }}
                                    >
                                        <Building2 className="h-4 w-4 mr-1" />
                                        {t('assignDealer') || 'Bayiye Ata'}
                                    </Button>
                                </div>
                                {dealerError ? (
                                    <p className="text-base text-muted-foreground italic">
                                        {t('dealerNotFound') || 'Bayi bulunamadı'}
                                    </p>
                                ) : (
                                    <p className="text-base">{dealer?.name || series.dealerName || series.dealerId}</p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('range')}</p>
                                <p className="text-base font-mono">
                                    {series.startNumber} - {series.endNumber}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('current')}</p>
                                <p className="text-base font-mono font-semibold">{series.currentNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('remaining')}</p>
                                <p className={`text-base font-semibold ${remaining <= 50 ? 'text-red-600' : ''}`}>
                                    {remaining}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* İstatistikler */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                {t('statistics')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm font-medium text-muted-foreground">{t('usagePercentage')}</p>
                                    <span className="text-sm font-semibold">{usagePercentage}%</span>
                                </div>
                                <Progress value={usagePercentage} className="h-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('totalNumbers')}</p>
                                    <p className="text-lg font-semibold">{total}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('usedNumbers')}</p>
                                    <p className="text-lg font-semibold">{used}</p>
                                </div>
                            </div>
                            {statistics && (
                                <>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t('isNearDepletion')}</p>
                                        <div className="mt-1">
                                            {statistics.isNearDepletion ? (
                                                <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Evet
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Hayır
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    {statistics.blacklistedCount > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">{t('blacklistedCount')}</p>
                                            <p className="text-lg font-semibold">{statistics.blacklistedCount}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tarih Bilgileri */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Tarih Bilgileri
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Oluşturulma</p>
                                <p className="text-base">
                                    {format(new Date(series.createdAt), 'dd MMMM yyyy, HH:mm')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Güncellenme</p>
                                <p className="text-base">
                                    {format(new Date(series.updatedAt), 'dd MMMM yyyy, HH:mm')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* İşlemler */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                {t('actions')}
                            </CardTitle>
                            <CardDescription>Poliçe serisi ile ilgili işlemler</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => getNextNumberMutation.mutate()}
                                disabled={getNextNumberMutation.isPending || remaining <= 0}
                            >
                                {getNextNumberMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('getting')}
                                    </>
                                ) : (
                                    <>
                                        <Hash className="mr-2 h-4 w-4" />
                                        {t('getNextNumber')}
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => generateFullNumberMutation.mutate()}
                                disabled={generateFullNumberMutation.isPending || remaining <= 0}
                            >
                                {generateFullNumberMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('generating')}
                                    </>
                                ) : (
                                    <>
                                        <FileText className="mr-2 h-4 w-4" />
                                        {t('generateFullNumber')}
                                    </>
                                )}
                            </Button>
                            {remaining <= 0 && (
                                <Alert variant="destructive" className="mt-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Seri Tükendi</AlertTitle>
                                    <AlertDescription>
                                        Bu seri için kullanılabilir numara kalmadı. Yeni bir seri oluşturmanız gerekiyor.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Assign Dealer Dialog */}
                <Dialog open={isAssignDealerDialogOpen} onOpenChange={setIsAssignDealerDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('assignDealerTitle') || 'Bayiye Ata'}</DialogTitle>
                            <DialogDescription>
                                {t('assignDealerDescription') || 'Poliçe serisini bir bayieye atayın'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium mb-2">{t('series')}</p>
                                <p className="text-base font-mono">{series.series}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-2">{t('selectDealer') || 'Bayi Seçin'}</p>
                                <Select value={selectedDealerId} onValueChange={setSelectedDealerId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectDealerPlaceholder') || 'Bayi seçin'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dealersData?.items.map((dealer) => (
                                            <SelectItem key={dealer.id} value={dealer.id}>
                                                {dealer.name} ({dealer.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsAssignDealerDialogOpen(false);
                                        setSelectedDealerId('');
                                    }}
                                >
                                    {tCommon('cancel')}
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (!selectedDealerId) {
                                            toast.error(t('selectDealerError') || 'Lütfen bir bayi seçin');
                                            return;
                                        }
                                        assignDealerMutation.mutate(selectedDealerId);
                                    }}
                                    disabled={assignDealerMutation.isPending || !selectedDealerId}
                                >
                                    {assignDealerMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {t('assigning') || 'Atanıyor...'}
                                        </>
                                    ) : (
                                        t('assign') || 'Ata'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}

