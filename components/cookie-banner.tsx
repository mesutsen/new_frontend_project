'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { X, Settings, Cookie } from 'lucide-react';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const COOKIE_CONSENT_KEY = 'cookieConsent.v1';

export interface CookiePreferences {
    necessary: boolean; // Her zaman true (zorunlu)
    analytics: boolean;
    marketing: boolean;
    acceptedAt: string;
}

export function CookieBanner() {
    const t = useTranslations('Cookies');
    const locale = useLocale();
    const [visible, setVisible] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState<CookiePreferences>({
        necessary: true, // Zorunlu, değiştirilemez
        analytics: false,
        marketing: false,
        acceptedAt: '',
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!saved) {
            setVisible(true);
        } else {
            try {
                const parsed = JSON.parse(saved) as CookiePreferences;
                setPreferences(parsed);
            } catch {
                // Geçersiz format, tekrar göster
                setVisible(true);
            }
        }
    }, []);

    const savePreferences = (prefs: CookiePreferences) => {
        const consent = {
            ...prefs,
            acceptedAt: new Date().toISOString(),
        };
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
        setVisible(false);
        setShowSettings(false);
        
        // Cookie tercihlerini backend'e kaydet (eğer kullanıcı login ise)
        // Bu işlem login sonrası yapılabilir
    };

    const acceptAll = () => {
        savePreferences({
            necessary: true,
            analytics: true,
            marketing: true,
            acceptedAt: new Date().toISOString(),
        });
    };

    const rejectOptional = () => {
        savePreferences({
            necessary: true, // Zorunlu
            analytics: false,
            marketing: false,
            acceptedAt: new Date().toISOString(),
        });
    };

    const saveCustomPreferences = () => {
        savePreferences(preferences);
    };

    if (!visible) return null;

    return (
        <>
            <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-5xl p-4 animate-in slide-in-from-bottom">
                <div className="flex items-start justify-between gap-4 rounded-lg border bg-background p-4 shadow-lg">
                    <div className="flex items-start gap-3 flex-1">
                        <Cookie className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 space-y-2">
                            <p className="text-sm font-medium">{t('bannerTitle')}</p>
                            <p className="text-xs text-muted-foreground">
                                {t('bannerDescription')}{' '}
                                <Link
                                    href={`/${locale}/cookie-policy`}
                                    className="text-primary hover:underline"
                                    target="_blank"
                                >
                                    {t('learnMore')}
                                </Link>
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSettings(true)}
                        >
                            <Settings className="h-4 w-4 mr-1" />
                            {t('settings')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={rejectOptional}>
                            {t('rejectOptional')}
                        </Button>
                        <Button size="sm" onClick={acceptAll}>
                            {t('acceptAll')}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={rejectOptional}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{t('settingsTitle')}</DialogTitle>
                        <DialogDescription>{t('settingsDescription')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Zorunlu Çerezler */}
                        <div className="flex items-start space-x-3 rounded-md border p-3">
                            <Checkbox checked={true} disabled className="mt-1" />
                            <div className="flex-1 space-y-1">
                                <Label className="text-sm font-medium cursor-default">
                                    {t('necessaryTitle')}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {t('necessaryDescription')}
                                </p>
                            </div>
                        </div>

                        {/* Analitik Çerezler */}
                        <div className="flex items-start space-x-3 rounded-md border p-3">
                            <Checkbox
                                checked={preferences.analytics}
                                onCheckedChange={(checked) =>
                                    setPreferences({ ...preferences, analytics: !!checked })
                                }
                                className="mt-1"
                            />
                            <div className="flex-1 space-y-1">
                                <Label className="text-sm font-medium cursor-pointer">
                                    {t('analyticsTitle')}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {t('analyticsDescription')}
                                </p>
                            </div>
                        </div>

                        {/* Pazarlama Çerezleri */}
                        <div className="flex items-start space-x-3 rounded-md border p-3">
                            <Checkbox
                                checked={preferences.marketing}
                                onCheckedChange={(checked) =>
                                    setPreferences({ ...preferences, marketing: !!checked })
                                }
                                className="mt-1"
                            />
                            <div className="flex-1 space-y-1">
                                <Label className="text-sm font-medium cursor-pointer">
                                    {t('marketingTitle')}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {t('marketingDescription')}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowSettings(false)}>
                            {t('cancel')}
                        </Button>
                        <Button onClick={saveCustomPreferences}>
                            {t('savePreferences')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

