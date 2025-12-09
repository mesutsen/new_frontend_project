'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { navigationConfig } from '@/config/navigation';
import { Shield, ChevronDown, ChevronRight } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function Sidebar() {
    const pathname = usePathname();
    const locale = useLocale();
    const { user } = useAuth();
    const t = useTranslations('Navigation');

    if (!user) return null;

    // Menüleri filtrele ve sırala
    const filteredNav = navigationConfig
        .filter((item) => {
            const hasRole = item.roles?.some((role) => user.roles.includes(role));
            const shouldExclude = item.excludeRoles?.some((role) => user.roles.includes(role));
            return hasRole && !shouldExclude;
        })
        .sort((a, b) => {
            // Order değerine göre sırala (order yoksa en sona koy)
            const orderA = a.order ?? 9999;
            const orderB = b.order ?? 9999;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            // Order aynıysa alfabetik sırala
            return (a.title || '').localeCompare(b.title || '');
        });

    // Locale'li href oluştur
    const getLocalizedHref = (href: string) => {
        // Eğer href zaten locale ile başlıyorsa, değiştirme
        if (href.startsWith(`/${locale}`)) {
            return href;
        }
        // Locale prefix ekle
        return `/${locale}${href}`;
    };

    // Pathname'i locale'siz karşılaştır
    const isActive = (href?: string) => {
        if (!href) return false;
        const localizedHref = getLocalizedHref(href);
        return pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);
    };

    // Bir item'ın veya alt item'larının aktif olup olmadığını kontrol et
    const hasActiveChild = (item: typeof navigationConfig[0]): boolean => {
        if (item.items) {
            return item.items.some((child) => isActive(child.href) || hasActiveChild(child));
        }
        return isActive(item.href);
    };

    return (
        <div className="hidden border-r bg-background md:block w-64 h-screen fixed left-0 top-0 z-40">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href={`/${locale}`} className="flex items-center gap-2 font-semibold">
                        <Shield className="h-6 w-6" />
                        <span className="">Ersin Sigorta</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <nav className="flex flex-col gap-1 px-2 text-sm font-medium lg:px-4 py-2">
                        {filteredNav.map((item, index) => {
                            const Icon = item.icon;
                            const label = item.translationKey ? t(item.translationKey as any) : item.title;

                            // Eğer item'ın alt menüleri varsa, collapsible kullan
                            if (item.items && item.items.length > 0) {
                                const isOpen = hasActiveChild(item);

                                return (
                                    <div key={index} className="mb-1">
                                        <Collapsible defaultOpen={isOpen}>
                                            <CollapsibleTrigger
                                                className={cn(
                                                    "group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                                    hasActiveChild(item)
                                                        ? "bg-muted text-primary"
                                                        : "text-muted-foreground"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon className="h-4 w-4" />
                                                    {label}
                                                </div>
                                                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="overflow-hidden">
                                                <div className="ml-4 mt-2 space-y-1 pb-2">
                                                    {item.items
                                                        .filter((childItem) =>
                                                            childItem.roles?.some((role) => user.roles.includes(role))
                                                        )
                                                        .sort((a, b) => {
                                                            // Order değerine göre sırala (order yoksa en sona koy)
                                                            const orderA = a.order ?? 9999;
                                                            const orderB = b.order ?? 9999;
                                                            if (orderA !== orderB) {
                                                                return orderA - orderB;
                                                            }
                                                            // Order aynıysa alfabetik sırala
                                                            return (a.title || '').localeCompare(b.title || '');
                                                        })
                                                        .map((childItem, childIndex) => {
                                                            const ChildIcon = childItem.icon;
                                                            const childLabel = childItem.translationKey
                                                                ? t(childItem.translationKey as any)
                                                                : childItem.title;
                                                            const childLocalizedHref = getLocalizedHref(childItem.href!);

                                                            return (
                                                                <Link
                                                                    key={childIndex}
                                                                    href={childLocalizedHref}
                                                                    className={cn(
                                                                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                                                        isActive(childItem.href)
                                                                            ? "bg-muted text-primary"
                                                                            : "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    <ChildIcon className="h-4 w-4" />
                                                                    {childLabel}
                                                                </Link>
                                                            );
                                                        })}
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    </div>
                                );
                            }

                            // Normal link item
                            const localizedHref = item.href ? getLocalizedHref(item.href) : '#';

                            return (
                                <Link
                                    key={index}
                                    href={localizedHref}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary mb-1",
                                        isActive(item.href)
                                            ? "bg-muted text-primary"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </div>
    );
}
