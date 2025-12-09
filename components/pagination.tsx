'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
    showPageNumbers?: boolean;
    maxVisiblePages?: number;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    className,
    showPageNumbers = true,
    maxVisiblePages = 5,
}: PaginationProps) {
    if (totalPages <= 1) {
        return null;
    }

    // Görüntülenecek sayfa numaralarını hesapla
    const getVisiblePages = () => {
        const pages: (number | string)[] = [];
        
        if (totalPages <= maxVisiblePages) {
            // Tüm sayfaları göster
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // İlk sayfa
            pages.push(1);
            
            // Mevcut sayfanın etrafındaki sayfaları hesapla
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            
            // Başlangıçta ellipsis gerekli mi?
            if (start > 2) {
                pages.push('...');
            }
            
            // Orta sayfalar
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            // Sonda ellipsis gerekli mi?
            if (end < totalPages - 1) {
                pages.push('...');
            }
            
            // Son sayfa
            pages.push(totalPages);
        }
        
        return pages;
    };

    const visiblePages = getVisiblePages();

    return (
        <div className={cn('flex items-center justify-center gap-2', className)}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {showPageNumbers && (
                <div className="flex items-center gap-1">
                    {visiblePages.map((page, index) => {
                        if (page === '...') {
                            return (
                                <span
                                    key={`ellipsis-${index}`}
                                    className="px-2 text-muted-foreground"
                                >
                                    ...
                                </span>
                            );
                        }

                        const pageNumber = page as number;
                        const isActive = pageNumber === currentPage;

                        return (
                            <Button
                                key={pageNumber}
                                variant={isActive ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => onPageChange(pageNumber)}
                                className={cn(
                                    'min-w-[2.5rem]',
                                    isActive && 'bg-primary text-primary-foreground'
                                )}
                                aria-label={`Go to page ${pageNumber}`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {pageNumber}
                            </Button>
                        );
                    })}
                </div>
            )}

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}

