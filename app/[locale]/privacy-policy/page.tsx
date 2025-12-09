'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText, Lock, Eye, Database, UserCheck } from 'lucide-react';

export default function PrivacyPolicyPage() {
    const t = useTranslations('PrivacyPolicy');

    const sections = [
        {
            icon: Shield,
            titleKey: 'section1Title',
            contentKey: 'section1Content',
        },
        {
            icon: Database,
            titleKey: 'section2Title',
            contentKey: 'section2Content',
        },
        {
            icon: Lock,
            titleKey: 'section3Title',
            contentKey: 'section3Content',
        },
        {
            icon: Eye,
            titleKey: 'section4Title',
            contentKey: 'section4Content',
        },
        {
            icon: UserCheck,
            titleKey: 'section5Title',
            contentKey: 'section5Content',
        },
        {
            icon: FileText,
            titleKey: 'section6Title',
            contentKey: 'section6Content',
        },
    ];

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="container mx-auto max-w-4xl px-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Shield className="h-8 w-8 text-primary" />
                            <CardTitle className="text-3xl">{t('title')}</CardTitle>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            {t('lastUpdated')}: {t('lastUpdatedDate')}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="prose prose-sm max-w-none">
                            <p className="text-muted-foreground leading-relaxed">
                                {t('introduction')}
                            </p>
                        </div>

                        {sections.map((section, index) => {
                            const Icon = section.icon;
                            return (
                                <div key={index} className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Icon className="h-6 w-6 text-primary" />
                                        <h2 className="text-xl font-semibold">
                                            {t(section.titleKey as any)}
                                        </h2>
                                    </div>
                                    <div className="pl-9 space-y-2 text-muted-foreground">
                        {t(section.contentKey as any)
                            .split('\n')
                            .map((paragraph: string, pIndex: number) => (
                                <p key={pIndex} className="leading-relaxed">
                                    {paragraph}
                                </p>
                            ))}
                                    </div>
                                </div>
                            );
                        })}

                        <div className="border-t pt-6 mt-8">
                            <h3 className="text-lg font-semibold mb-3">{t('contactTitle')}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {t('contactContent')}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

