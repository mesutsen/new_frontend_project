'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { notificationsService, Notification } from '@/services/notifications.service';
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
    Bell,
    CheckCircle2,
    Circle,
    Loader2,
    Search,
    Eye,
    CheckCheck,
    AlertCircle,
    Info,
    AlertTriangle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NotificationsPage() {
    const t = useTranslations('Notifications');
    const format = useFormatter();
    const locale = useLocale();
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all');
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['notifications', page, pageSize],
        queryFn: () => notificationsService.getNotifications({ page, pageSize }),
    });

    const { data: unreadCount } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: () => notificationsService.getUnreadCount(),
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => notificationsService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
            toast.success(t('markAsReadSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('markAsReadError'));
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () => notificationsService.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
            toast.success(t('markAllAsReadSuccess'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('markAllAsReadError'));
        },
    });

    const handleViewNotification = async (notification: Notification) => {
        setSelectedNotification(notification);
        setDetailDialogOpen(true);
        if (!notification.isRead) {
            markAsReadMutation.mutate(notification.id);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'info':
                return <Info className="h-4 w-4 text-blue-500" />;
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'success':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            default:
                return <Bell className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getNotificationBadge = (type: string) => {
        switch (type.toLowerCase()) {
            case 'info':
                return 'default';
            case 'warning':
                return 'secondary';
            case 'error':
                return 'destructive';
            case 'success':
                return 'outline';
            default:
                return 'outline';
        }
    };

    const filteredItems = data?.items.filter(
        (item) =>
            (!search ||
                item.title.toLowerCase().includes(search.toLowerCase()) ||
                item.message.toLowerCase().includes(search.toLowerCase())) &&
            (filter === 'all' || (filter === 'read' && item.isRead) || (filter === 'unread' && !item.isRead))
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
                    <div className="flex items-center gap-4">
                        {unreadCount !== undefined && unreadCount > 0 && (
                            <Badge variant="destructive" className="text-sm">
                                {unreadCount} {t('unread')}
                            </Badge>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => markAllAsReadMutation.mutate()}
                            disabled={markAllAsReadMutation.isPending || unreadCount === 0}
                        >
                            {markAllAsReadMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCheck className="mr-2 h-4 w-4" />
                            )}
                            {t('markAllAsRead')}
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('totalNotifications')}</CardTitle>
                            <Bell className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data?.totalCount || 0}</div>
                            <p className="text-xs text-muted-foreground">{t('totalNotificationsDesc')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('unreadNotifications')}</CardTitle>
                            <Circle className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{unreadCount || 0}</div>
                            <p className="text-xs text-muted-foreground">{t('unreadNotificationsDesc')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('readNotifications')}</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(data?.totalCount || 0) - (unreadCount || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">{t('readNotificationsDesc')}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('searchPlaceholder')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <div>
                                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('filterBy')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('all')}</SelectItem>
                                        <SelectItem value="unread">{t('unread')}</SelectItem>
                                        <SelectItem value="read">{t('read')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
                    <TabsList>
                        <TabsTrigger value="all">{t('all')}</TabsTrigger>
                        <TabsTrigger value="unread">
                            {t('unread')} {unreadCount !== undefined && unreadCount > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                    {unreadCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="read">{t('read')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value={filter} className="space-y-4">
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
                                                <TableHead className="w-[50px]"></TableHead>
                                                <TableHead>{t('type')}</TableHead>
                                                <TableHead>{t('title')}</TableHead>
                                                <TableHead>{t('message')}</TableHead>
                                                <TableHead>{t('status')}</TableHead>
                                                <TableHead>{t('createdAt')}</TableHead>
                                                <TableHead className="text-right">{t('actions')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredItems.map((item) => (
                                                <TableRow
                                                    key={item.id}
                                                    className={cn(
                                                        !item.isRead && 'bg-muted/50 font-medium'
                                                    )}
                                                >
                                                    <TableCell>
                                                        {getNotificationIcon(item.type)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getNotificationBadge(item.type) as any}>
                                                            {item.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{item.title}</TableCell>
                                                    <TableCell className="max-w-md truncate">
                                                        {item.message}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.isRead ? (
                                                            <Badge variant="outline" className="gap-1">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                {t('read')}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="gap-1">
                                                                <Circle className="h-3 w-3" />
                                                                {t('unread')}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {format.relativeTime(new Date(item.createdAt), {
                                                            now: new Date(),
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewNotification(item)}
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            {t('view')}
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
                                                {t('pageInfo', {
                                                    page,
                                                    total: Math.ceil(data.totalCount / pageSize),
                                                })}
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
                    </TabsContent>
                </Tabs>
            </div>

            {/* Detail Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedNotification && getNotificationIcon(selectedNotification.type)}
                            {selectedNotification?.title}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedNotification?.createdAt
                                ? format.dateTime(new Date(selectedNotification.createdAt), {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                  })
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedNotification && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant={getNotificationBadge(selectedNotification.type) as any}>
                                        {selectedNotification.type}
                                    </Badge>
                                    {selectedNotification.isRead ? (
                                        <Badge variant="outline" className="gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {t('read')}
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="gap-1">
                                            <Circle className="h-3 w-3" />
                                            {t('unread')}
                                        </Badge>
                                    )}
                                </div>
                                <div className="rounded-lg border p-4 bg-muted/50">
                                    <p className="text-sm whitespace-pre-wrap">{selectedNotification.message}</p>
                                </div>
                            </div>
                            {!selectedNotification.isRead && (
                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => {
                                            markAsReadMutation.mutate(selectedNotification.id);
                                            setDetailDialogOpen(false);
                                        }}
                                        disabled={markAsReadMutation.isPending}
                                    >
                                        {markAsReadMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {t('markAsRead')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

