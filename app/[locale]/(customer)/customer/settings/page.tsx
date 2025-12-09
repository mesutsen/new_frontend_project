'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Loader2, AlertCircle, Bell, Mail, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { notificationsService } from '@/services/notifications.service';

interface NotificationSettings {
    emailEnabled: boolean;
    pushEnabled: boolean;
    smsEnabled: boolean;
}

export default function CustomerSettingsPage() {
    const t = useTranslations('Settings');
    const tCommon = useTranslations('Common');
    const locale = useLocale();

    const [settings, setSettings] = useState<NotificationSettings>({
        emailEnabled: true,
        pushEnabled: false,
        smsEnabled: false,
    });

    // TODO: Fetch settings from API when available
    // const { data: fetchedSettings, isLoading: settingsLoading } = useQuery({
    //     queryKey: ['notification-settings'],
    //     queryFn: () => notificationsService.getNotificationSettings(),
    //     onSuccess: (data) => {
    //         setSettings(data);
    //     },
    // });

    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings: NotificationSettings) => {
            // TODO: Replace with actual API call when available
            // return notificationsService.updateNotificationSettings(newSettings);
            return Promise.resolve(newSettings);
        },
        onSuccess: () => {
            toast.success(t('settingsUpdateSuccess') || 'Ayarlar başarıyla güncellendi');
        },
        onError: (error) => {
            console.error('Failed to update settings:', error);
            toast.error(t('settingsUpdateError') || 'Ayarlar güncellenirken hata oluştu');
        },
    });

    const handleSaveSettings = () => {
        updateSettingsMutation.mutate(settings);
    };

    return (
        <DashboardLayout>
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">{t('title') || 'Ayarlar'}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('description') || 'Hesap ayarlarınızı yönetin'}
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            {t('notificationSettings') || 'Bildirim Ayarları'}
                        </CardTitle>
                        <CardDescription>
                            {t('notificationSettingsDescription') || 'Bildirim tercihlerinizi yönetin'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="email-notifications" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {t('emailNotifications') || 'E-posta Bildirimleri'}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {t('emailNotificationsDescription') || 'E-posta ile bildirim al'}
                                </p>
                            </div>
                            <Switch
                                id="email-notifications"
                                checked={settings.emailEnabled}
                                onCheckedChange={(checked) =>
                                    setSettings((prev) => ({ ...prev, emailEnabled: checked }))
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="push-notifications" className="flex items-center gap-2">
                                    <Bell className="h-4 w-4" />
                                    {t('pushNotifications') || 'Push Bildirimleri'}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {t('pushNotificationsDescription') || 'Tarayıcı push bildirimleri al'}
                                </p>
                            </div>
                            <Switch
                                id="push-notifications"
                                checked={settings.pushEnabled}
                                onCheckedChange={(checked) =>
                                    setSettings((prev) => ({ ...prev, pushEnabled: checked }))
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="sms-notifications" className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    {t('smsNotifications') || 'SMS Bildirimleri'}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {t('smsNotificationsDescription') || 'SMS ile bildirim al'}
                                </p>
                            </div>
                            <Switch
                                id="sms-notifications"
                                checked={settings.smsEnabled}
                                onCheckedChange={(checked) =>
                                    setSettings((prev) => ({ ...prev, smsEnabled: checked }))
                                }
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSaveSettings} disabled={updateSettingsMutation.isPending}>
                                {updateSettingsMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                {tCommon('save') || 'Kaydet'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('privacySettings') || 'Gizlilik Ayarları'}</CardTitle>
                        <CardDescription>
                            {t('privacySettingsDescription') || 'Gizlilik tercihlerinizi yönetin'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{t('comingSoon') || 'Yakında'}</AlertTitle>
                            <AlertDescription>
                                {t('privacySettingsComingSoon') || 'Gizlilik ayarları yakında eklenecektir.'}
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('languageSettings') || 'Dil Ayarları'}</CardTitle>
                        <CardDescription>
                            {t('languageSettingsDescription') || 'Tercih ettiğiniz dili seçin'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="language">{t('preferredLanguage') || 'Tercih Edilen Dil'}</Label>
                            <Input
                                id="language"
                                value={locale}
                                disabled
                                className="max-w-xs"
                            />
                            <p className="text-sm text-muted-foreground">
                                {t('languageChangeNote') || 'Dil değişikliği yakında eklenecektir.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

