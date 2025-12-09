'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, LogOut, Bell } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { navigationConfig } from '@/config/navigation';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export function Header() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const locale = useLocale();
    const format = useFormatter();
    const t = useTranslations('Header');
    const tNav = useTranslations('Navigation');
    const queryClient = useQueryClient();

    // Bildirimleri yükle
    const { data: notifications, isLoading: notificationsLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationsService.getNotifications({ page: 1, pageSize: 10 }),
        refetchInterval: 30000, // 30 saniyede bir yenile
    });

    // Okunmamış bildirim sayısını yükle
    const { data: unreadCount } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: () => notificationsService.getUnreadCount(),
        refetchInterval: 30000,
    });

    // Bildirimi okundu olarak işaretle
    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => notificationsService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });

    // Tüm bildirimleri okundu olarak işaretle
    const markAllAsReadMutation = useMutation({
        mutationFn: () => notificationsService.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });

    const handleNotificationClick = (notificationId: string, isRead: boolean) => {
        if (!isRead) {
            markAsReadMutation.mutate(notificationId);
        }
    };

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    if (!user) return null;

    const filteredNav = navigationConfig.filter((item) => {
        const hasRole = item.roles?.some((role) => user.roles.includes(role));
        const shouldExclude = item.excludeRoles?.some((role) => user.roles.includes(role));
        return hasRole && !shouldExclude;
    });

    // Locale'li href oluştur
    const getLocalizedHref = (href?: string) => {
        if (!href) return '#';
        if (href.startsWith(`/${locale}`)) {
            return href;
        }
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

    const userInitials = user.firstName && user.lastName
        ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
        : user.userName.charAt(0).toUpperCase();

    const userFullName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.userName;

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 fixed top-0 right-0 left-0 md:left-64 z-50">
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 md:hidden"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                    <nav className="grid gap-2 text-lg font-medium">
                        <Link
                            href={`/${locale}`}
                            className="flex items-center gap-2 text-lg font-semibold"
                        >
                            <span className="sr-only">Ersin Sigorta</span>
                        </Link>
                        {filteredNav.map((item, index) => {
                            const Icon = item.icon;
                            const label = item.translationKey ? tNav(item.translationKey as any) : item.title;

                            // Eğer item'ın alt menüleri varsa, collapsible kullan
                            if (item.items && item.items.length > 0) {
                                return (
                                    <div key={index} className="space-y-1">
                                        <div
                                            className={cn(
                                                "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground",
                                                hasActiveChild(item) && "bg-muted text-foreground"
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                            {label}
                                        </div>
                                        <div className="ml-4 space-y-1">
                                            {item.items
                                                .filter((childItem) =>
                                                    childItem.roles?.some((role) => user.roles.includes(role))
                                                )
                                                .map((childItem, childIndex) => {
                                                    const ChildIcon = childItem.icon;
                                                    const childLabel = childItem.translationKey
                                                        ? tNav(childItem.translationKey as any)
                                                        : childItem.title;
                                                    const childLocalizedHref = getLocalizedHref(childItem.href);

                                                    return (
                                                        <Link
                                                            key={childIndex}
                                                            href={childLocalizedHref}
                                                            className={cn(
                                                                "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-foreground",
                                                                isActive(childItem.href)
                                                                    ? "bg-muted text-foreground"
                                                                    : "text-muted-foreground"
                                                            )}
                                                        >
                                                            <ChildIcon className="h-5 w-5" />
                                                            {childLabel}
                                                        </Link>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                );
                            }

                            // Normal link item
                            const localizedHref = getLocalizedHref(item.href);

                            return (
                                <Link
                                    key={index}
                                    href={localizedHref}
                                    className={cn(
                                        "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-foreground",
                                        isActive(item.href)
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>
                </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
                {/* Search or Breadcrumbs could go here */}
            </div>
            <LanguageSwitcher />
            <ThemeToggle />

            {/* Notifications Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount && unreadCount > 0 && (
                            <Badge
                                variant="destructive"
                                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                            >
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                        )}
                        <span className="sr-only">{t('notifications')}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                    <div className="flex items-center justify-between px-2 py-1.5">
                        <DropdownMenuLabel>{t('notifications')}</DropdownMenuLabel>
                        {unreadCount && unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={handleMarkAllAsRead}
                                disabled={markAllAsReadMutation.isPending}
                            >
                                {markAllAsReadMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    t('markAllAsRead')
                                )}
                            </Button>
                        )}
                    </div>
                    <DropdownMenuSeparator />
                    <ScrollArea className="h-[400px]">
                        {notificationsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : !notifications || notifications.items.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                {t('noNotifications')}
                            </div>
                        ) : (
                            <div className="py-1">
                                {notifications.items.map((notification) => (
                                    <DropdownMenuItem
                                        key={notification.id}
                                        className={cn(
                                            "flex flex-col items-start gap-1 px-3 py-2 cursor-pointer",
                                            !notification.isRead && "bg-muted"
                                        )}
                                        onClick={() => handleNotificationClick(notification.id, notification.isRead)}
                                    >
                                        <div className="flex items-start justify-between w-full gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-sm font-medium truncate",
                                                    !notification.isRead && "font-semibold"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                    {notification.message}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {format.relativeTime(new Date(notification.createdAt), { now: new Date() })}
                                        </p>
                                    </DropdownMenuItem>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                    {notifications && notifications.items.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <div className="px-2 py-1.5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-center text-xs"
                                    asChild
                                >
                                    <Link href={`/${locale}/admin/notifications`}>
                                        {t('viewAll')}
                                    </Link>
                                </Button>
                            </div>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                        <Avatar>
                            <AvatarImage src="" alt={userFullName} />
                            <AvatarFallback>{userInitials}</AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('myAccount')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href={`/${locale}/admin/settings`}>{t('settings')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/${locale}/admin/support`}>{t('support')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('logout')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
