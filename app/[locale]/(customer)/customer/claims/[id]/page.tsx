'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { claimsService } from '@/services/claims.service';
import { policiesService } from '@/services/policies.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    FileText,
    Calendar,
    MapPin,
    DollarSign,
    Image,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CustomerClaimDetailPage() {
    const params = useParams();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('Claims');
    const tCommon = useTranslations('Common');
    const format = useFormatter();
    const id = params.id as string;

    const { data: claim, isLoading, error } = useQuery({
        queryKey: ['claim', id],
        queryFn: () => claimsService.getClaimById(id),
        enabled: !!id,
    });

    const { data: policy } = useQuery({
        queryKey: ['policy', claim?.policyId],
        queryFn: () => policiesService.getPolicyById(claim!.policyId),
        enabled: !!claim?.policyId,
    });

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            Pending: { variant: 'secondary', label: t('statusPending') || 'Beklemede' },
            InReview: { variant: 'default', label: t('statusInReview') || 'İnceleniyor' },
            Approved: { variant: 'default', label: t('statusApproved') || 'Onaylandı' },
            Rejected: { variant: 'destructive', label: t('statusRejected') || 'Reddedildi' },
            Closed: { variant: 'outline', label: t('statusClosed') || 'Kapalı' },
        };
        const statusInfo = statusMap[status] || { variant: 'outline' as const, label: status };
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
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

    if (error || !claim) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{tCommon('errorTitle') || 'Hata'}</AlertTitle>
                    <AlertDescription>
                        {t('loadError') || 'Hasar kaydı yüklenirken hata oluştu'}
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/${locale}/customer/claims`)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">#{claim.id.slice(0, 8)}</h1>
                        <p className="text-sm text-muted-foreground">{claim.claimType}</p>
                    </div>
                </div>

                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    {/* Claim Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                {t('claimDetails') || 'Hasar Detayları'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('claimType') || 'Hasar Tipi'}
                                </p>
                                <p className="text-base">{claim.claimType}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('claimDate') || 'Hasar Tarihi'}
                                </p>
                                <p className="text-base">
                                    {format.dateTime(new Date(claim.claimDate), {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            {claim.incidentLocation && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        {t('incidentLocation') || 'Olay Yeri'}
                                    </p>
                                    <p className="text-base">{claim.incidentLocation}</p>
                                </div>
                            )}
                            {claim.estimatedDamage && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        {t('estimatedDamage') || 'Tahmini Hasar'}
                                    </p>
                                    <p className="text-base">
                                        {new Intl.NumberFormat(locale, {
                                            style: 'currency',
                                            currency: 'TRY',
                                        }).format(claim.estimatedDamage)}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t('status') || 'Durum'}
                                </p>
                                <div className="mt-1">{getStatusBadge(claim.status)}</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Policy Info */}
                    {policy && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('policyInfo') || 'Poliçe Bilgileri'}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('policyNumber') || 'Poliçe No'}
                                    </p>
                                    <p className="text-base font-semibold">{policy.policyNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('policyType') || 'Poliçe Tipi'}
                                    </p>
                                    <p className="text-base">{policy.policyType}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Description */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>{t('description') || 'Açıklama'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap">{claim.description}</p>
                        </CardContent>
                    </Card>

                    {/* Attachments */}
                    {claim.attachments && claim.attachments.length > 0 && (
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Image className="h-5 w-5" />
                                    {t('attachments') || 'Ekler'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {claim.attachments.map((attachment) => (
                                        <a
                                            key={attachment.id}
                                            href={attachment.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted transition-colors"
                                        >
                                            <FileText className="h-8 w-8 mb-2 text-muted-foreground" />
                                            <p className="text-xs text-center truncate w-full">
                                                {attachment.fileName}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {(attachment.fileSize / 1024).toFixed(2)} KB
                                            </p>
                                        </a>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notes */}
                    {claim.notes && claim.notes.length > 0 && (
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>{t('notes') || 'Notlar'}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {claim.notes.map((note) => (
                                    <div
                                        key={note.id}
                                        className={`p-4 rounded-lg ${
                                            note.isFromCustomer
                                                ? 'bg-primary/10 ml-4'
                                                : 'bg-muted mr-4'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">
                                                {note.isFromCustomer
                                                    ? t('you') || 'Siz'
                                                    : t('supportTeam') || 'Destek Ekibi'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {format.dateTime(new Date(note.createdAt), {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

