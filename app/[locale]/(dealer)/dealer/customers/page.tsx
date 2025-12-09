'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { customersService, Customer } from '@/services/customers.service';
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
import { Plus, Eye, Edit, Search, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DealerCustomersPage() {
    const t = useTranslations('Customers');
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
        queryKey: ['customers', page, pageSize, search, dealer?.id],
        queryFn: () =>
            customersService.getCustomers({
                page,
                pageSize,
                search: search || undefined,
                dealerId: dealer?.id,
            }),
        enabled: !!dealer?.id,
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{t('title')}</h1>
                        <p className="text-muted-foreground mt-1">{t('description')}</p>
                    </div>
                    <Button onClick={() => router.push(`/${locale}/dealer/customers/new`)}>
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
                                    placeholder="Müşteri ara..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Customers Table */}
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
                                            <TableHead>Ad</TableHead>
                                            <TableHead>Soyad</TableHead>
                                            <TableHead>E-posta</TableHead>
                                            <TableHead>Telefon</TableHead>
                                            <TableHead>Durum</TableHead>
                                            <TableHead>İşlemler</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.items.map((customer) => (
                                            <TableRow key={customer.id}>
                                                <TableCell>{customer.firstName}</TableCell>
                                                <TableCell>{customer.lastName}</TableCell>
                                                <TableCell>{customer.email || '-'}</TableCell>
                                                <TableCell>{customer.phone || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            customer.isActive
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {customer.isActive ? 'Aktif' : 'Pasif'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                router.push(
                                                                    `/${locale}/dealer/customers/${customer.id}`
                                                                )
                                                            }
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                router.push(
                                                                    `/${locale}/dealer/customers/${customer.id}/edit`
                                                                )
                                                            }
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </div>
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

