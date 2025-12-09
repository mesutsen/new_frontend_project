'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { maintenanceService, type ActivateMaintenanceRequest } from '@/services/maintenance.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Wrench,
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle,
    Calendar,
    MessageSquare,
    Globe,
    Power,
    PowerOff,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const PORTALS = [
    { id: 'admin', label: 'Admin Portal' },
    { id: 'dealer', label: 'Dealer Portal' },
    { id: 'customer', label: 'Customer Portal' },
    { id: 'observer', label: 'Observer Portal' },
];

export default function MaintenancePage() {
    const t = useTranslations('Maintenance');
    const locale = useLocale();
    const format = useFormatter();
    const queryClient = useQueryClient();

    const [activateDialogOpen, setActivateDialogOpen] = useState(false);
    const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
    const [selectedPortals, setSelectedPortals] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [until, setUntil] = useState('');

    // Maintenance status
    const { data: status, isLoading, error } = useQuery({
        queryKey: ['maintenanceStatus'],
        queryFn: () => maintenanceService.getStatus(),
        refetchInterval: 5000, // Her 5 saniyede bir kontrol et
    });

    // Activate mutation
    const activateMutation = useMutation({
        mutationFn: (request: ActivateMaintenanceRequest) =>
            maintenanceService.activate(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenanceStatus'] });
            setActivateDialogOpen(false);
            setSelectedPortals([]);
            setMessage('');
            setUntil('');
            toast.success(t('activateSuccess'));
        },
        onError: () => {
            toast.error(t('activateError'));
        },
    });

    // Deactivate mutation
    const deactivateMutation = useMutation({
        mutationFn: () => maintenanceService.deactivate(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenanceStatus'] });
            setDeactivateDialogOpen(false);
            toast.success(t('deactivateSuccess'));
        },
        onError: () => {
            toast.error(t('deactivateError'));
        },
    });

    const handleActivate = () => {
        if (selectedPortals.length === 0) {
            toast.error(t('selectPortalsError'));
            return;
        }
        if (!message.trim()) {
            toast.error(t('messageRequired'));
            return;
        }

        // Convert local datetime to UTC ISO string
        let untilDate: string | undefined = undefined;
        if (until) {
            untilDate = new Date(until).toISOString();
        }

        const request: ActivateMaintenanceRequest = {
            affectedPortals: selectedPortals,
            message: message.trim(),
            until: untilDate,
        };

        activateMutation.mutate(request);
    };

    const handleDeactivate = () => {
        deactivateMutation.mutate();
    };

    const togglePortal = (portalId: string) => {
        setSelectedPortals((prev) =>
            prev.includes(portalId)
                ? prev.filter((id) => id !== portalId)
                : [...prev, portalId]
        );
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return format.dateTime(new Date(dateString), {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

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
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : status?.isActive ? (
                        <Button
                            variant="destructive"
                            onClick={() => setDeactivateDialogOpen(true)}
                        >
                            <PowerOff className="mr-2 h-4 w-4" />
                            {t('deactivate')}
                        </Button>
                    ) : (
                        <Button onClick={() => setActivateDialogOpen(true)}>
                            <Power className="mr-2 h-4 w-4" />
                            {t('activate')}
                        </Button>
                    )}
                </div>

                {/* Status Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wrench className="h-5 w-5" />
                            {t('currentStatus')}
                        </CardTitle>
                        <CardDescription>{t('currentStatusDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : status?.isActive ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Badge variant="destructive" className="gap-2">
                                        <XCircle className="h-4 w-4" />
                                        {t('active')}
                                    </Badge>
                                </div>

                                {status.message && (
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                                            <MessageSquare className="inline h-4 w-4 mr-2" />
                                            {t('message')}
                                        </Label>
                                        <p className="text-base bg-muted p-3 rounded-md">
                                            {status.message}
                                        </p>
                                    </div>
                                )}

                                {status.until && (
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                                            <Calendar className="inline h-4 w-4 mr-2" />
                                            {t('until')}
                                        </Label>
                                        <p className="text-base">{formatDate(status.until)}</p>
                                    </div>
                                )}

                                {status.affectedPortals && status.affectedPortals.length > 0 && (
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                                            <Globe className="inline h-4 w-4 mr-2" />
                                            {t('affectedPortals')}
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {status.affectedPortals.map((portal) => (
                                                <Badge key={portal} variant="secondary">
                                                    {PORTALS.find((p) => p.id === portal)?.label ||
                                                        portal}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Badge variant="default" className="gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    {t('inactive')}
                                </Badge>
                                <p className="text-muted-foreground">{t('noMaintenance')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Activate Dialog */}
            <Dialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Power className="h-5 w-5" />
                            {t('activateTitle')}
                        </DialogTitle>
                        <DialogDescription>{t('activateDescription')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label className="mb-2 block">{t('affectedPortals')}</Label>
                            <div className="space-y-2">
                                {PORTALS.map((portal) => (
                                    <div
                                        key={portal.id}
                                        className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50"
                                    >
                                        <Checkbox
                                            id={portal.id}
                                            checked={selectedPortals.includes(portal.id)}
                                            onCheckedChange={() => togglePortal(portal.id)}
                                        />
                                        <label
                                            htmlFor={portal.id}
                                            className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {portal.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="message" className="mb-2 block">
                                {t('message')} *
                            </Label>
                            <Textarea
                                id="message"
                                placeholder={t('messagePlaceholder')}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <div>
                            <Label htmlFor="until" className="mb-2 block">
                                {t('until')} ({t('optional')})
                            </Label>
                            <Input
                                id="until"
                                type="datetime-local"
                                value={until}
                                onChange={(e) => setUntil(e.target.value)}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t('untilDescription')}
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setActivateDialogOpen(false);
                                setSelectedPortals([]);
                                setMessage('');
                                setUntil('');
                            }}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            onClick={handleActivate}
                            disabled={activateMutation.isPending}
                        >
                            {activateMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('activating')}
                                </>
                            ) : (
                                <>
                                    <Power className="mr-2 h-4 w-4" />
                                    {t('activate')}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Deactivate Dialog */}
            <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <PowerOff className="h-5 w-5" />
                            {t('deactivateTitle')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>{t('deactivateDescription')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeactivate}
                            disabled={deactivateMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deactivateMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('deactivating')}
                                </>
                            ) : (
                                t('deactivate')
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}

