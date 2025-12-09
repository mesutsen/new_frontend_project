'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wrench, Clock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function MaintenancePage() {
    const t = useTranslations('Maintenance');
    const searchParams = useSearchParams();
    const message = searchParams.get('message');
    const until = searchParams.get('until');

    // Format date if available
    const formattedDate = until ? new Date(until).toLocaleString('tr-TR', {
        dateStyle: 'long',
        timeStyle: 'short'
    }) : null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            {/* Background Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

            <Card className="w-full max-w-lg border-none shadow-2xl bg-white/95 backdrop-blur-sm dark:bg-slate-900/90">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <Wrench className="h-12 w-12 text-primary animate-pulse" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-primary">
                        {t('title')}
                    </CardTitle>
                    <CardDescription className="text-lg mt-2">
                        {t('description')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6 pt-6">
                    <div className="space-y-2">
                        <p className="text-muted-foreground text-lg">
                            {message || t('defaultMessage', { default: 'Sistemimizde bakım çalışması yapılmaktadır. Lütfen daha sonra tekrar deneyiniz.' })}
                        </p>
                    </div>

                    {formattedDate && (
                        <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-center gap-3 text-sm font-medium">
                            <Clock className="h-5 w-5 text-primary" />
                            <span>
                                {t('expectedCompletion')}: <span className="text-primary">{formattedDate}</span>
                            </span>
                        </div>
                    )}

                    <div className="pt-4 text-xs text-muted-foreground">
                        Ersin Sigorta &copy; {new Date().getFullYear()}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
