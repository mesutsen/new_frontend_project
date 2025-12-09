'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { priceListsService, type PriceList } from '@/services/price-lists.service';
import { policyTypesService } from '@/services/policy-types.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Search,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function PriceListsPage() {
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const t = useTranslations('PriceLists');
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [policyTypeFilter, setPolicyTypeFilter] = useState<string>('');
    const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);

    const { data: policyTypes } = useQuery({
        queryKey: ['policy-types-active'],
        queryFn: () => policyTypesService.getActive(),
    });

    const { data, isLoading, error } = useQuery({
        queryKey: ['price-lists', page, search, policyTypeFilter, isActiveFilter],
        queryFn: () => priceListsService.getList({
            page,
            pageSize: 20,
            search,
            policyTypeId: policyTypeFilter || undefined,
            isActive: isActiveFilter,
        }),
    });


    const deleteMutation = useMutation({
        mutationFn: (id: string) => priceListsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['price-lists'] });
            setDeleteDialogOpen(false);
            setSelectedPriceList(null);
            toast.success(t('deleteSuccess') || 'Fiyat listesi başarıyla silindi');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || t('deleteError') || 'Fiyat listesi silinirken bir hata oluştu');
        },
    });

    const handleCreate = () => {
        router.push(`/${locale}/admin/config/price-lists/new`);
    };

    const handleEdit = (priceList: PriceList) => {
        router.push(`/${locale}/admin/config/price-lists/${priceList.id}`);
    };

    const handleDelete = (priceList: PriceList) => {
        setSelectedPriceList(priceList);
        setDeleteDialogOpen(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    if (error) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Hata</AlertTitle>
                    <AlertDescription>Veriler yüklenirken bir hata oluştu</AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('title') || 'Fiyat Listeleri'}</h1>
                        <p className="text-muted-foreground">{t('description') || 'Fiyat listelerini görüntüleyin ve yönetin'}</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('createButton') || 'Yeni Fiyat Listesi'}
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={t('searchPlaceholder') || 'Ara...'}
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-10"
                        />
                    </div>
                    <select
                        value={policyTypeFilter}
                        onChange={(e) => {
                            setPolicyTypeFilter(e.target.value);
                            setPage(1);
                        }}
                        className="rounded-md border border-input bg-background px-3 py-2"
                    >
                        <option value="">Tüm Poliçe Türleri</option>
                        {policyTypes?.map((pt) => (
                            <option key={pt.id} value={pt.id}>
                                {pt.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={isActiveFilter === undefined ? 'all' : isActiveFilter ? 'active' : 'inactive'}
                        onChange={(e) => {
                            setIsActiveFilter(e.target.value === 'all' ? undefined : e.target.value === 'active');
                            setPage(1);
                        }}
                        className="rounded-md border border-input bg-background px-3 py-2"
                    >
                        <option value="all">Tümü</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Pasif</option>
                    </select>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ad</TableHead>
                                <TableHead>Poliçe Türü</TableHead>
                                <TableHead>Para Birimi</TableHead>
                                <TableHead>Başlangıç</TableHead>
                                <TableHead>Bitiş</TableHead>
                                <TableHead>KDV Oranı</TableHead>
                                <TableHead>Öncelik</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            ) : data?.items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                                        {t('noData') || 'Fiyat listesi bulunamadı'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.items.map((priceList: PriceList) => (
                                    <TableRow key={priceList.id}>
                                        <TableCell className="font-medium">{priceList.name}</TableCell>
                                        <TableCell>{priceList.policyTypeName}</TableCell>
                                        <TableCell>{priceList.currencySymbol} {priceList.currencyCode}</TableCell>
                                        <TableCell>{formatDate(priceList.startDate)}</TableCell>
                                        <TableCell>{formatDate(priceList.endDate)}</TableCell>
                                        <TableCell>{(priceList.taxRate * 100).toFixed(0)}%</TableCell>
                                        <TableCell>{priceList.priority}</TableCell>
                                        <TableCell>
                                            <Badge variant={priceList.isActive ? 'default' : 'secondary'}>
                                                {priceList.isActive ? 'Aktif' : 'Pasif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(priceList)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(priceList)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {data && data.totalCount > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Toplam {data.totalCount} kayıt, Sayfa {page} / {Math.ceil(data.totalCount / 20)}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= Math.ceil(data.totalCount / 20)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Delete Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('deleteConfirmTitle') || 'Fiyat Listesini Sil'}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('deleteConfirm') || 'Bu fiyat listesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    if (selectedPriceList) {
                                        deleteMutation.mutate(selectedPriceList.id);
                                    }
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Sil
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}

