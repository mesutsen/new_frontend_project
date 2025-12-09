'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { supportService } from '@/services/support.service';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    Send,
    FileText,
    Calendar,
    User,
    MessageSquare,
    CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { FileUpload } from '@/components/ui/file-upload';

export default function CustomerTicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('Support');
    const tCommon = useTranslations('Common');
    const queryClient = useQueryClient();
    const id = params.id as string;

    const [replyMessage, setReplyMessage] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);

    const { data: ticket, isLoading, error } = useQuery({
        queryKey: ['ticket', id],
        queryFn: () => supportService.getTicketById(id),
        enabled: !!id,
    });

    const addReplyMutation = useMutation({
        mutationFn: (request: { message: string; attachments?: File[] }) =>
            supportService.addReply(id, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ticket', id] });
            setReplyMessage('');
            setAttachments([]);
            toast.success(t('replySuccess') || 'Yanıt başarıyla gönderildi');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || t('replyError') || 'Yanıt gönderilirken hata oluştu');
        },
    });

    const closeTicketMutation = useMutation({
        mutationFn: () => supportService.closeTicket(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ticket', id] });
            toast.success(t('closeSuccess') || 'Talep başarıyla kapatıldı');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || t('closeError') || 'Talep kapatılırken hata oluştu');
        },
    });

    const handleSendReply = () => {
        if (!replyMessage.trim()) {
            toast.error(t('messageRequired') || 'Mesaj gereklidir');
            return;
        }
        addReplyMutation.mutate({
            message: replyMessage,
            attachments: attachments.length > 0 ? attachments : undefined,
        });
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            Open: { variant: 'default', label: t('statusOpen') || 'Açık' },
            InProgress: { variant: 'secondary', label: t('statusInProgress') || 'İşlemde' },
            Resolved: { variant: 'outline', label: t('statusResolved') || 'Çözüldü' },
            Closed: { variant: 'outline', label: t('statusClosed') || 'Kapalı' },
        };
        const statusInfo = statusMap[status] || { variant: 'outline' as const, label: status };
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
    };

    const getPriorityBadge = (priority: string) => {
        const priorityMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            Low: { variant: 'outline', label: t('priorityLow') || 'Düşük' },
            Medium: { variant: 'secondary', label: t('priorityMedium') || 'Orta' },
            High: { variant: 'default', label: t('priorityHigh') || 'Yüksek' },
            Urgent: { variant: 'destructive', label: t('priorityUrgent') || 'Acil' },
        };
        const priorityInfo = priorityMap[priority] || { variant: 'outline' as const, label: priority };
        return <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>;
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

    if (error || !ticket) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{tCommon('errorTitle') || 'Hata'}</AlertTitle>
                    <AlertDescription>
                        {t('loadError') || 'Talep bilgileri yüklenirken hata oluştu'}
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/${locale}/customer/support/tickets`)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">#{ticket.id.slice(0, 8)}</h1>
                            <p className="text-sm text-muted-foreground">{ticket.subject}</p>
                        </div>
                    </div>
                    {ticket.status !== 'Closed' && (
                        <Button
                            variant="outline"
                            onClick={() => closeTicketMutation.mutate()}
                            disabled={closeTicketMutation.isPending}
                        >
                            {closeTicketMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                            )}
                            {t('closeTicket') || 'Talebi Kapat'}
                        </Button>
                    )}
                </div>

                <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
                    {/* Ticket Info */}
                    <div className="md:col-span-2 space-y-3 sm:space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" />
                                    {t('ticketDetails') || 'Talep Detayları'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('subject') || 'Konu'}</p>
                                    <p className="text-base">{ticket.subject}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('message') || 'Mesaj'}
                                    </p>
                                    <p className="text-base whitespace-pre-wrap">{ticket.message}</p>
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('status') || 'Durum'}
                                        </p>
                                        <div className="mt-1">{getStatusBadge(ticket.status)}</div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('priority') || 'Öncelik'}
                                        </p>
                                        <div className="mt-1">{getPriorityBadge(ticket.priority)}</div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('category') || 'Kategori'}
                                        </p>
                                        <p className="text-base">{ticket.category}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Replies */}
                        {ticket.replies && ticket.replies.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('replies') || 'Yanıtlar'}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {ticket.replies.map((reply) => (
                                        <div
                                            key={reply.id}
                                            className={`p-4 rounded-lg ${
                                                reply.isFromCustomer
                                                    ? 'bg-primary/10 ml-4'
                                                    : 'bg-muted mr-4'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    <span className="text-sm font-medium">
                                                        {reply.isFromCustomer
                                                            ? t('you') || 'Siz'
                                                            : t('supportTeam') || 'Destek Ekibi'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(reply.createdAt).toLocaleString(locale)}
                                                </span>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Add Reply */}
                        {ticket.status !== 'Closed' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('addReply') || 'Yanıt Ekle'}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reply">{t('yourMessage') || 'Mesajınız'}</Label>
                                        <Textarea
                                            id="reply"
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            placeholder={t('replyPlaceholder') || 'Yanıtınızı yazın...'}
                                            rows={4}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('attachments') || 'Ekler (Opsiyonel)'}</Label>
                                        <FileUpload
                                            accept="image/*,.pdf,.doc,.docx"
                                            multiple
                                            onFilesChange={(files) => setAttachments(files)}
                                            maxFiles={3}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleSendReply}
                                            disabled={addReplyMutation.isPending || !replyMessage.trim()}
                                        >
                                            {addReplyMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4 mr-2" />
                                            )}
                                            {t('sendReply') || 'Gönder'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-3 sm:space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    {t('dates') || 'Tarihler'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('createdAt') || 'Oluşturulma'}
                                    </p>
                                    <p className="text-sm">
                                        {new Date(ticket.createdAt).toLocaleString(locale)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('updatedAt') || 'Güncellenme'}
                                    </p>
                                    <p className="text-sm">
                                        {new Date(ticket.updatedAt).toLocaleString(locale)}
                                    </p>
                                </div>
                                {ticket.resolvedAt && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('resolvedAt') || 'Çözülme'}
                                        </p>
                                        <p className="text-sm">
                                            {new Date(ticket.resolvedAt).toLocaleString(locale)}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

