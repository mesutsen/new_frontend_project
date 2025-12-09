'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { policiesService } from '@/services/policies.service';
import { dealersService } from '@/services/dealers.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Eye, Search, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DealerPoliciesPage() {
    const t = useTranslations('Policies');
    const locale = useLocale();
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState('');

    // Get current dealer
    const { data: dealer } = useQuery({
        queryKey: ['current-dealer'],
        queryFn: () => dealersService.getCurrentDealer(),
        retry: false,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['policies', page, pageSize, search, dealer?.id],
        queryFn: () =>
            policiesService.getPolicies({
                page,
                pageSize,
                search: search || undefined,
                dealerId: dealer?.id,
            }),
        enabled: !!dealer?.id,
    });

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            active: 'default',
            pending: 'secondary',
            expired: 'destructive',
            cancelled: 'outline',
        };
        return (
            <Badge variant={variants[status] || 'outline'}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{t('title')}</h1>
                        <p className="text-muted-foreground mt-1">{t('description')}</p>
                    </div>
                    <Button onClick={() => router.push(`/${locale}/dealer/policies/new`)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('createButton')}
                    </Button>
                </div>

                {/* Search */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ara</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Poliçe ara..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Policies Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Liste</CardTitle>
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
                                            <TableHead>Poliçe No</TableHead>
                                            <TableHead>Müşteri</TableHead>
                                            <TableHead>Tip</TableHead>
                                            <TableHead>Prim</TableHead>
                                            <TableHead>Durum</TableHead>
                                            <TableHead>İşlemler</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.items.map((policy: any) => (
                                            <TableRow key={policy.id}>
                                                <TableCell>{policy.policyNumber}</TableCell>
                                                <TableCell>
                                                    {policy.customer?.firstName}{' '}
                                                    {policy.customer?.lastName}
                                                </TableCell>
                                                <TableCell>{policy.policyType}</TableCell>
                                                <TableCell>
                                                    ₺{policy.premium?.toLocaleString() || 0}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(policy.status)}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.push(
                                                                `/${locale}/dealer/policies/${policy.id}`
                                                            )
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="flex justify-between items-center mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                        disabled={page === 1}
                                    >
                                        Önceki
                                    </Button>
                                    <span>
                                        Sayfa {page} / {data?.totalPages || 1}
                                    </span>
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage((prev) => prev + 1)}
                                        disabled={page === (data?.totalPages || 1)}
                                    >
                                        Sonraki
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

