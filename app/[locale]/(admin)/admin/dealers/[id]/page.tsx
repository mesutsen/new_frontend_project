'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { dealersService } from '@/services/dealers.service';
import { gamificationService } from '@/services/gamification.service';
import { customersService, Customer } from '@/services/customers.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ArrowLeft,
    Mail,
    Phone,
    Building2,
    FileText,
    Calendar,
    Loader2,
    AlertCircle,
    Trophy,
    Target,
    Award,
    TrendingUp,
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    Users,
    Search,
    User,
    Eye,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { CustomerForm } from '@/components/customers/customer-form';
import { toast } from 'sonner';

export default function DealerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('Dealers');
    const tCustomers = useTranslations('Customers');
    const queryClient = useQueryClient();
    const id = params.id as string;

    const [customerSearch, setCustomerSearch] = useState('');
    const [customerPage, setCustomerPage] = useState(1);
    const [customerPageSize] = useState(10);
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deleteCustomerDialogOpen, setDeleteCustomerDialogOpen] = useState(false);
    const [selectedCustomerForDelete, setSelectedCustomerForDelete] = useState<Customer | null>(null);

    const { data: dealer, isLoading, error } = useQuery({
        queryKey: ['dealer', id],
        queryFn: () => dealersService.getDealerById(id),
        enabled: !!id,
    });

    const { data: policySeries } = useQuery({
        queryKey: ['dealer-policy-series', id],
        queryFn: () => dealersService.getPolicySeries(id),
        enabled: !!id,
    });

    // Gamification data
    const { data: performance } = useQuery({
        queryKey: ['dealer-performance', id],
        queryFn: () => gamificationService.getPerformance(id),
        enabled: !!id,
    });

    const { data: goals } = useQuery({
        queryKey: ['dealer-goals', id],
        queryFn: () => gamificationService.getGoals(id),
        enabled: !!id,
    });

    const { data: rewards } = useQuery({
        queryKey: ['dealer-rewards', performance?.level],
        queryFn: () => gamificationService.getRewards(performance?.level || 'Bronze'),
        enabled: !!performance?.level,
    });

    // Customers data
    const { data: customersData, isLoading: customersLoading } = useQuery({
        queryKey: ['dealer-customers', id, customerSearch, customerPage, customerPageSize],
        queryFn: () =>
            customersService.getCustomersByDealer(id, {
                search: customerSearch || undefined,
                page: customerPage,
                pageSize: customerPageSize,
            }),
        enabled: !!id,
    });

    const deleteCustomerMutation = useMutation({
        mutationFn: (customerId: string) => customersService.deleteCustomer(customerId),
        onSuccess: () => {
            toast.success(tCustomers('deleteSuccess'));
            queryClient.invalidateQueries({ queryKey: ['dealer-customers', id] });
            setDeleteCustomerDialogOpen(false);
            setSelectedCustomerForDelete(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || tCustomers('deleteError'));
        },
    });

    const format = useFormatter();

    const getLevelColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'bronze':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
            case 'silver':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
            case 'gold':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'platinum':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'bronze':
            case 'silver':
            case 'gold':
            case 'platinum':
                return <Trophy className="h-4 w-4" />;
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !dealer) {
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
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/${locale}/admin/dealers`)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">{dealer.name}</h1>
                        <p className="text-sm text-muted-foreground">{t('dealerDetails')}</p>
                    </div>
                </div>

                <div className="grid gap-3 sm:gap-4 md:grid-cols-2 auto-rows-min">
                    {/* Temel Bilgiler */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                {t('basicInfo')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('code')}</p>
                                <p className="text-base font-semibold">{dealer.code}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('name')}</p>
                                <p className="text-base">{dealer.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('status')}</p>
                                <Badge variant={dealer.isActive ? 'default' : 'secondary'} className="mt-1">
                                    {dealer.isActive ? t('active') : t('inactive')}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* İletişim Bilgileri */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                {t('contactInfo')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {dealer.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t('email')}</p>
                                        <p className="text-base">{dealer.email}</p>
                                    </div>
                                </div>
                            )}
                            {dealer.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t('phone')}</p>
                                        <p className="text-base">{dealer.phone}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Gözlemci Bilgileri */}
                    {dealer.observerId && dealer.observerName && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    {t('observerInfo') || 'Gözlemci Bilgileri'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('observerName') || 'Gözlemci Adı'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-base font-semibold">{dealer.observerName}</p>
                                    </div>
                                </div>
                                {dealer.observerEmail && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">{t('email')}</p>
                                            <p className="text-base">{dealer.observerEmail}</p>
                                        </div>
                                    </div>
                                )}
                                {dealer.observerPhone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">{t('phone')}</p>
                                            <p className="text-base">{dealer.observerPhone}</p>
                                        </div>
                                    </div>
                                )}
                                {dealer.observerId && (
                                    <div className="pt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/${locale}/admin/observers/${dealer.observerId}`)}
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            {t('viewObserver') || 'Gözlemci Detayını Görüntüle'}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* İstatistikler */}
                    {dealer.stats && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    {t('statistics')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('totalPolicies')}
                                    </p>
                                    <p className="text-2xl font-bold">{dealer.stats.totalPolicies}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('activePolicies')}
                                    </p>
                                    <p className="text-2xl font-bold">{dealer.stats.activePolicies}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('monthlyIssued')}
                                    </p>
                                    <p className="text-2xl font-bold">{dealer.stats.monthlyIssued}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tarih Bilgileri */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                {t('dateInfo')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('createdAt')}</p>
                                <p className="text-base">
                                    {format.dateTime(new Date(dealer.createdAt), {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('updatedAt')}</p>
                                <p className="text-base">
                                    {format.dateTime(new Date(dealer.updatedAt), {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Card */}
                {performance && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                {t('performance')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('performanceLevel')}</p>
                                    <Badge className={cn('mt-1', getLevelColor(performance.level))}>
                                        {getLevelIcon(performance.level)}
                                        <span className="ml-1 capitalize">{performance.level || '-'}</span>
                                    </Badge>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-muted-foreground">{t('performanceScore')}</p>
                                    <p className="text-2xl font-bold">{((performance.score ?? 0) as number).toFixed(1)}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('totalPolicies')}</p>
                                    <p className="text-xl font-semibold">{performance.policies ?? 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('totalPremium')}</p>
                                    <p className="text-xl font-semibold">
                                        {new Intl.NumberFormat(locale, {
                                            style: 'currency',
                                            currency: 'TRY',
                                        }).format(performance.totalPremium ?? 0)}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium text-muted-foreground">{t('conversionRate')}</p>
                                    <p className="text-sm font-semibold">{((performance.conversionRate ?? 0) as number).toFixed(1)}%</p>
                                </div>
                                <Progress value={performance.conversionRate ?? 0} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Goals Card */}
                {goals && goals.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                {t('goals')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {goals.map((goal) => {
                                const progress = (goal.currentValue / goal.targetValue) * 100;
                                const isCompleted = goal.currentValue >= goal.targetValue;
                                return (
                                    <div key={goal.id} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium">{goal.name}</p>
                                                <p className="text-sm text-muted-foreground">{goal.metric}</p>
                                            </div>
                                            {isCompleted && (
                                                <Badge variant="default" className="ml-2">
                                                    <Award className="h-3 w-3 mr-1" />
                                                    {t('completed')}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span>
                                                    {goal.currentValue.toLocaleString(locale)} /{' '}
                                                    {goal.targetValue.toLocaleString(locale)}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {format.dateTime(new Date(goal.deadline), {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                            <Progress
                                                value={Math.min(progress, 100)}
                                                className={cn('h-2', isCompleted && 'bg-green-500')}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                {/* Rewards Card */}
                {rewards && rewards.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5" />
                                {t('availableRewards')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {rewards.map((reward) => (
                                    <div
                                        key={reward.id}
                                        className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50"
                                    >
                                        <Award className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium">{reward.title}</p>
                                            <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                                            <Badge variant="outline" className="mt-2">
                                                {reward.levelRequired}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Müşteriler */}
                <Card className="col-span-full">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                {tCustomers('title')}
                            </CardTitle>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setEditingCustomer(null);
                                    setIsCustomerDialogOpen(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                {tCustomers('create')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={tCustomers('searchPlaceholder')}
                                    value={customerSearch}
                                    onChange={(e) => {
                                        setCustomerSearch(e.target.value);
                                        setCustomerPage(1);
                                    }}
                                    className="pl-9"
                                />
                            </div>

                            {/* Table */}
                            {customersLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : !customersData || customersData.items.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    {tCustomers('noCustomers')}
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>{tCustomers('fullName')}</TableHead>
                                                    <TableHead>{tCustomers('nationalId')}</TableHead>
                                                    <TableHead>{tCustomers('email')}</TableHead>
                                                    <TableHead>{tCustomers('phone')}</TableHead>
                                                    <TableHead>{tCustomers('status')}</TableHead>
                                                    <TableHead className="text-right">{tCustomers('actions')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {customersData.items.map((customer) => (
                                                    <TableRow key={customer.id}>
                                                        <TableCell className="font-medium">
                                                            {customer.firstName} {customer.lastName}
                                                        </TableCell>
                                                        <TableCell>{customer.nationalId || '-'}</TableCell>
                                                        <TableCell>{customer.email || '-'}</TableCell>
                                                        <TableCell>{customer.phone || '-'}</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={customer.isActive ? 'default' : 'secondary'}
                                                            >
                                                                {customer.isActive
                                                                    ? tCustomers('active')
                                                                    : tCustomers('inactive')}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setEditingCustomer(customer);
                                                                            setIsCustomerDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        {tCustomers('edit')}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedCustomerForDelete(customer);
                                                                            setDeleteCustomerDialogOpen(true);
                                                                        }}
                                                                        className="text-destructive"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        {tCustomers('delete')}
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Pagination */}
                                    {customersData.totalPages > 1 && (
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-muted-foreground">
                                                {tCustomers('showingResults', {
                                                    from: (customerPage - 1) * customerPageSize + 1,
                                                    to: Math.min(
                                                        customerPage * customerPageSize,
                                                        customersData.totalCount
                                                    ),
                                                    total: customersData.totalCount,
                                                })}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
                                                    disabled={customerPage === 1}
                                                >
                                                    {tCustomers('previous')}
                                                </Button>
                                                <span className="text-sm flex items-center">
                                                    {tCustomers('pageInfo', {
                                                        page: customerPage,
                                                        total: customersData.totalPages,
                                                    })}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCustomerPage((p) => p + 1)}
                                                    disabled={customerPage >= customersData.totalPages}
                                                >
                                                    {tCustomers('next')}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Poliçe Serileri */}
                {policySeries && policySeries.length > 0 && (
                    <Card className="col-span-full">
                        <CardHeader>
                            <CardTitle>{t('policySeries')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-2 text-left">{t('series')}</th>
                                            <th className="p-2 text-left">{t('startNumber')}</th>
                                            <th className="p-2 text-left">{t('endNumber')}</th>
                                            <th className="p-2 text-left">{t('currentNumber')}</th>
                                            <th className="p-2 text-left">{t('createdAt')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {policySeries.map((series) => (
                                            <tr key={series.id} className="border-b">
                                                <td className="p-2 font-medium">{series.series}</td>
                                                <td className="p-2">{series.startNumber}</td>
                                                <td className="p-2">{series.endNumber}</td>
                                                <td className="p-2">{series.currentNumber}</td>
                                                <td className="p-2">
                                                    {format.dateTime(new Date(series.createdAt), {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

            {/* Customer Dialog */}
            <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCustomer ? tCustomers('editTitle') : tCustomers('createTitle')}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCustomer
                                ? tCustomers('editDescription')
                                : tCustomers('createDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <CustomerForm
                        dealerId={id}
                        customer={editingCustomer}
                        onSuccess={() => {
                            setIsCustomerDialogOpen(false);
                            setEditingCustomer(null);
                        }}
                        onCancel={() => {
                            setIsCustomerDialogOpen(false);
                            setEditingCustomer(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Customer Dialog */}
            <AlertDialog open={deleteCustomerDialogOpen} onOpenChange={setDeleteCustomerDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{tCustomers('deleteConfirmTitle')}</AlertDialogTitle>
                        <div className="py-4">
                            <p className="text-sm text-muted-foreground">
                                {tCustomers('deleteConfirm', {
                                    name: selectedCustomerForDelete
                                        ? `${selectedCustomerForDelete.firstName} ${selectedCustomerForDelete.lastName}`
                                        : '',
                                })}
                            </p>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{tCustomers('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                selectedCustomerForDelete &&
                                deleteCustomerMutation.mutate(selectedCustomerForDelete.id)
                            }
                            disabled={deleteCustomerMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteCustomerMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {tCustomers('delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            </div>
        </DashboardLayout>
    );
}

