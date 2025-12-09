'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Bell, Mail, Smartphone, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DealerSettingsPage() {
    const t = useTranslations('Settings');
    const [loading, setLoading] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState({
        emailEnabled: true,
        pushEnabled: false,
        smsEnabled: false,
        emailAddress: '',
        phoneNumber: '',
    });

    const handleSave = async () => {
        setLoading(true);
        try {
            // TODO: API entegrasyonu eklenecek
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success('Ayarlar başarıyla kaydedildi');
        } catch (error) {
            toast.error('Ayarlar kaydedilirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Ayarlar</h1>
                    <p className="text-muted-foreground mt-1">
                        Hesap ve bildirim ayarlarınızı yönetin
                    </p>
                </div>

                {/* Notification Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Bildirim Ayarları
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="email-notifications" className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        E-posta Bildirimleri
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Önemli bildirimler e-posta adresinize gönderilir
                                    </p>
                                </div>
                                <Switch
                                    id="email-notifications"
                                    checked={notificationSettings.emailEnabled}
                                    onCheckedChange={(checked) =>
                                        setNotificationSettings({
                                            ...notificationSettings,
                                            emailEnabled: checked,
                                        })
                                    }
                                />
                            </div>

                            {notificationSettings.emailEnabled && (
                                <div className="space-y-2 pl-8">
                                    <Label htmlFor="email-address">E-posta Adresi</Label>
                                    <Input
                                        id="email-address"
                                        type="email"
                                        placeholder="ornek@email.com"
                                        value={notificationSettings.emailAddress}
                                        onChange={(e) =>
                                            setNotificationSettings({
                                                ...notificationSettings,
                                                emailAddress: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="push-notifications" className="flex items-center gap-2">
                                        <Bell className="h-4 w-4" />
                                        Push Bildirimleri
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Tarayıcı push bildirimleri alın (PWA gerekli)
                                    </p>
                                </div>
                                <Switch
                                    id="push-notifications"
                                    checked={notificationSettings.pushEnabled}
                                    onCheckedChange={(checked) =>
                                        setNotificationSettings({
                                            ...notificationSettings,
                                            pushEnabled: checked,
                                        })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="sms-notifications" className="flex items-center gap-2">
                                        <Smartphone className="h-4 w-4" />
                                        SMS Bildirimleri
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Kritik bildirimler SMS olarak gönderilir
                                    </p>
                                </div>
                                <Switch
                                    id="sms-notifications"
                                    checked={notificationSettings.smsEnabled}
                                    onCheckedChange={(checked) =>
                                        setNotificationSettings({
                                            ...notificationSettings,
                                            smsEnabled: checked,
                                        })
                                    }
                                />
                            </div>

                            {notificationSettings.smsEnabled && (
                                <div className="space-y-2 pl-8">
                                    <Label htmlFor="phone-number">Telefon Numarası</Label>
                                    <Input
                                        id="phone-number"
                                        type="tel"
                                        placeholder="+90 555 123 4567"
                                        value={notificationSettings.phoneNumber}
                                        onChange={(e) =>
                                            setNotificationSettings({
                                                ...notificationSettings,
                                                phoneNumber: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <Button onClick={handleSave} disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Kaydediliyor...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Kaydet
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

