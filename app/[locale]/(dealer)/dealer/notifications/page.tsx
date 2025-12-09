'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { notificationsService } from '@/services/notifications.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Bell, Check, CheckCheck, Loader2, Info, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DealerNotificationsPage() {
    const t = useTranslations('Notifications');
    const locale = useLocale();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [filterUnread, setFilterUnread] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['notifications', page, pageSize, filterUnread],
        queryFn: () =>
            notificationsService.getNotifications({
                page,
                pageSize,
            }),
    });

    const markReadMutation = useMutation({
        mutationFn: (id: string) => notificationsService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Bildirim okundu olarak işaretlendi');
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => notificationsService.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Tüm bildirimler okundu olarak işaretlendi');
        },
    });

    const unreadCount = data?.items.filter((n: any) => !n.isRead).length || 0;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Bildirimler</h1>
                        <p className="text-muted-foreground mt-1">
                            Tüm bildirimlerinizi görüntüleyin ve yönetin
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setFilterUnread(!filterUnread)}
                            className={filterUnread ? 'bg-primary text-primary-foreground' : ''}
                        >
                            <Bell className="h-4 w-4 mr-2" />
                            {filterUnread ? 'Tümünü Göster' : 'Sadece Okunmamışlar'}
                            {unreadCount > 0 && !filterUnread && (
                                <Badge className="ml-2 bg-red-500">{unreadCount}</Badge>
                            )}
                        </Button>
                        {unreadCount > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => markAllReadMutation.mutate()}
                                disabled={markAllReadMutation.isPending}
                            >
                                {markAllReadMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <CheckCheck className="h-4 w-4 mr-2" />
                                )}
                                Tümünü Okundu İşaretle
                            </Button>
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Toplam Bildirim</CardTitle>
                            <Bell className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data?.totalCount || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Tüm bildirimler</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Okunmamış</CardTitle>
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{unreadCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Okunmamış bildirimler</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Okunmuş</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(data?.totalCount || 0) - unreadCount}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Okunmuş bildirimler</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Notifications Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Bildirim Listesi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Başlık</TableHead>
                                            <TableHead>Mesaj</TableHead>
                                            <TableHead>Tarih</TableHead>
                                            <TableHead>Durum</TableHead>
                                            <TableHead>İşlemler</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.items.map((notification: any) => (
                                            <TableRow key={notification.id}>
                                                <TableCell>{notification.title}</TableCell>
                                                <TableCell className="max-w-md truncate">
                                                    {notification.message}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(notification.createdAt).toLocaleDateString('tr-TR')}
                                                </TableCell>
                                                <TableCell>
                                                    {notification.isRead ? (
                                                        <Badge variant="outline" className="text-xs">
                                                            <CheckCheck className="h-3 w-3 mr-1" />
                                                            Okundu
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="default" className="text-xs">
                                                            <Bell className="h-3 w-3 mr-1" />
                                                            Okunmadı
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {!notification.isRead && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => markReadMutation.mutate(notification.id)}
                                                            disabled={markReadMutation.isPending}
                                                        >
                                                            {markReadMutation.isPending ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <Check className="h-3 w-3" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

