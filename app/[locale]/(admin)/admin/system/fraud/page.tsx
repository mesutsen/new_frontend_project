'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { fraudService, FraudDetectionLog } from '@/services/fraud.service';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlertCircle,
    CheckCircle2,
    XCircle,
    Loader2,
    Search,
    Eye,
    Shield,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function FraudDetectionPage() {
    const t = useTranslations('Fraud');
    const format = useFormatter();
    const locale = useLocale();
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [search, setSearch] = useState('');
    const [selectedLog, setSelectedLog] = useState<FraudDetectionLog | null>(null);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [reviewDecision, setReviewDecision] = useState<string>('');
    const [reviewNotes, setReviewNotes] = useState<string>('');

    const { data, isLoading, error } = useQuery({
        queryKey: ['fraud-suspicious', page, pageSize],
        queryFn: () => fraudService.getSuspicious({ pageNumber: page, pageSize }),
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, decision }: { id: string; decision: string }) =>
            fraudService.review(id, decision),
        onSuccess: () => {
            toast.success(t('reviewSuccess'));
            queryClient.invalidateQueries({ queryKey: ['fraud-suspicious'] });
            setReviewDialogOpen(false);
            setSelectedLog(null);
            setReviewDecision('');
            setReviewNotes('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('reviewError'));
        },
    });

    const handleReview = (log: FraudDetectionLog) => {
        setSelectedLog(log);
        setReviewDecision('');
        setReviewNotes('');
        setReviewDialogOpen(true);
    };

    const handleSubmitReview = () => {
        if (!selectedLog || !reviewDecision) {
            toast.error(t('decisionRequired'));
            return;
        }
        reviewMutation.mutate({ id: selectedLog.id, decision: reviewDecision });
    };

    const getRiskScoreColor = (score: number) => {
        if (score >= 80) return 'text-red-600 dark:text-red-400';
        if (score >= 60) return 'text-orange-600 dark:text-orange-400';
        if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-green-600 dark:text-green-400';
    };

    const getRiskScoreBadge = (score: number) => {
        if (score >= 80) return 'destructive';
        if (score >= 60) return 'default';
        if (score >= 40) return 'secondary';
        return 'outline';
    };

    const parseReasons = (reasonsJson?: string): string[] => {
        if (!reasonsJson) return [];
        try {
            const parsed = JSON.parse(reasonsJson);
            if (Array.isArray(parsed)) return parsed;
            if (typeof parsed === 'object') return Object.values(parsed) as string[];
            return [String(parsed)];
        } catch {
            return [reasonsJson];
        }
    };

    const filteredItems = data?.items.filter(
        (item) =>
            !search ||
            item.transactionId.toLowerCase().includes(search.toLowerCase()) ||
            item.entityName.toLowerCase().includes(search.toLowerCase()) ||
            item.entityId.toLowerCase().includes(search.toLowerCase())
    ) || [];

    if (error) {
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

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('title')}</h1>
                        <p className="text-muted-foreground">{t('description')}</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('totalSuspicious')}</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data?.totalCount || 0}</div>
                            <p className="text-xs text-muted-foreground">{t('suspiciousItems')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('highRisk')}</CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data?.items.filter((item) => item.riskScore >= 80).length || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">{t('riskScore80Plus')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('mediumRisk')}</CardTitle>
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data?.items.filter((item) => item.riskScore >= 60 && item.riskScore < 80).length || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">{t('riskScore60to80')}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('searchPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : !data || filteredItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">{t('noData')}</div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('transactionId')}</TableHead>
                                        <TableHead>{t('entityName')}</TableHead>
                                        <TableHead>{t('entityId')}</TableHead>
                                        <TableHead>{t('riskScore')}</TableHead>
                                        <TableHead>{t('status')}</TableHead>
                                        <TableHead>{t('createdAt')}</TableHead>
                                        <TableHead className="text-right">{t('actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.transactionId}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{item.entityName}</Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{item.entityId}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={getRiskScoreBadge(item.riskScore)}
                                                    className={cn('font-semibold', getRiskScoreColor(item.riskScore))}
                                                >
                                                    {item.riskScore.toFixed(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {item.status === 'New' && t('statusNew')}
                                                    {item.status === 'Suspicious' && t('statusSuspicious')}
                                                    {item.status === 'Reviewed' && t('statusReviewed')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {format.dateTime(new Date(item.createdAt), {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleReview(item)}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    {t('review')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {data.totalCount > pageSize && (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    {t('showingResults', {
                                        from: (page - 1) * pageSize + 1,
                                        to: Math.min(page * pageSize, data.totalCount),
                                        total: data.totalCount,
                                    })}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        {t('previous')}
                                    </Button>
                                    <span className="text-sm flex items-center">
                                        {t('pageInfo', { page, total: Math.ceil(data.totalCount / pageSize) })}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={page >= Math.ceil(data.totalCount / pageSize)}
                                    >
                                        {t('next')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Review Dialog */}
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('reviewTitle')}</DialogTitle>
                        <DialogDescription>{t('reviewDescription')}</DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            {/* Log Details */}
                            <div className="space-y-2 rounded-lg border p-4 bg-muted/50">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-medium text-muted-foreground">{t('transactionId')}</p>
                                        <p className="font-mono">{selectedLog.transactionId}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-muted-foreground">{t('entityName')}</p>
                                        <p>{selectedLog.entityName}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-muted-foreground">{t('entityId')}</p>
                                        <p className="font-mono text-xs">{selectedLog.entityId}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-muted-foreground">{t('riskScore')}</p>
                                        <Badge
                                            variant={getRiskScoreBadge(selectedLog.riskScore)}
                                            className={cn('font-semibold', getRiskScoreColor(selectedLog.riskScore))}
                                        >
                                            {selectedLog.riskScore.toFixed(1)}
                                        </Badge>
                                    </div>
                                </div>
                                {selectedLog.reasonsJson && (
                                    <div className="mt-4">
                                        <p className="font-medium text-muted-foreground mb-2">{t('reasons')}</p>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                            {parseReasons(selectedLog.reasonsJson).map((reason, idx) => (
                                                <li key={idx}>{reason}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Review Form */}
                            <div className="space-y-4">
                                <div>
                                    <Label>{t('decision')}</Label>
                                    <Select value={reviewDecision} onValueChange={setReviewDecision}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('selectDecision')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="false_positive">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    {t('falsePositive')}
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="confirmed_fraud">
                                                <div className="flex items-center gap-2">
                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                    {t('confirmedFraud')}
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="requires_investigation">
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4 text-orange-500" />
                                                    {t('requiresInvestigation')}
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>{t('notes')}</Label>
                                    <Textarea
                                        placeholder={t('notesPlaceholder')}
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        rows={4}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setReviewDialogOpen(false);
                                        setSelectedLog(null);
                                        setReviewDecision('');
                                        setReviewNotes('');
                                    }}
                                >
                                    {t('cancel')}
                                </Button>
                                <Button
                                    onClick={handleSubmitReview}
                                    disabled={reviewMutation.isPending || !reviewDecision}
                                >
                                    {reviewMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {t('submitReview')}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

