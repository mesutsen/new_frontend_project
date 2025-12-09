import { api } from '@/lib/axios';
import { PagedResponse } from './common';

export interface PriceList {
    id: string;
    policyTypeId: string;
    policyTypeName: string;
    policyTypeCode: string;
    currencyId: string;
    currencyCode: string;
    currencyName: string;
    currencySymbol: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    // 1 Günlük
    price1Day?: number;
    price1DayMin?: number;
    price1DayMax?: number;
    // 15 Günlük
    price15Days?: number;
    price15DaysMin?: number;
    price15DaysMax?: number;
    // 30 Günlük
    price30Days?: number;
    price30DaysMin?: number;
    price30DaysMax?: number;
    // 90 Günlük
    price90Days?: number;
    price90DaysMin?: number;
    price90DaysMax?: number;
    // 365 Günlük
    price365Days?: number;
    price365DaysMin?: number;
    price365DaysMax?: number;
    taxRate: number;
    dealerCommissionRate?: number;
    observerCommissionRate?: number;
    adminCommissionRate?: number;
    isActive: boolean;
    priority: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePriceListRequest {
    policyTypeId: string;
    currencyId: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    // 1 Günlük
    price1Day?: number;
    price1DayMin?: number;
    price1DayMax?: number;
    // 15 Günlük
    price15Days?: number;
    price15DaysMin?: number;
    price15DaysMax?: number;
    // 30 Günlük
    price30Days?: number;
    price30DaysMin?: number;
    price30DaysMax?: number;
    // 90 Günlük
    price90Days?: number;
    price90DaysMin?: number;
    price90DaysMax?: number;
    // 365 Günlük
    price365Days?: number;
    price365DaysMin?: number;
    price365DaysMax?: number;
    taxRate: number;
    dealerCommissionRate?: number;
    observerCommissionRate?: number;
    adminCommissionRate?: number;
    isActive?: boolean;
    priority?: number;
}

export interface UpdatePriceListRequest {
    currencyId: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    // 1 Günlük
    price1Day?: number;
    price1DayMin?: number;
    price1DayMax?: number;
    // 15 Günlük
    price15Days?: number;
    price15DaysMin?: number;
    price15DaysMax?: number;
    // 30 Günlük
    price30Days?: number;
    price30DaysMin?: number;
    price30DaysMax?: number;
    // 90 Günlük
    price90Days?: number;
    price90DaysMin?: number;
    price90DaysMax?: number;
    // 365 Günlük
    price365Days?: number;
    price365DaysMin?: number;
    price365DaysMax?: number;
    taxRate: number;
    dealerCommissionRate?: number;
    observerCommissionRate?: number;
    adminCommissionRate?: number;
    isActive: boolean;
    priority: number;
}

export interface PriceListListParams {
    policyTypeId?: string;
    search?: string;
    isActive?: boolean;
    date?: string; // ISO date string
    page?: number;
    pageSize?: number;
}

export const priceListsService = {
    async getList(params?: PriceListListParams): Promise<PagedResponse<PriceList>> {
        const response = await api.get<PagedResponse<PriceList>>('/price-lists', { params });
        return response.data;
    },

    async getById(id: string): Promise<PriceList> {
        const response = await api.get<PriceList>(`/price-lists/${id}`);
        return response.data;
    },

    async getActiveForDate(policyTypeId: string, date: string): Promise<PriceList | null> {
        try {
            const response = await api.get<PriceList>('/price-lists/active', {
                params: { policyTypeId, date },
            });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    async create(data: CreatePriceListRequest): Promise<PriceList> {
        const response = await api.post<PriceList>('/price-lists', data);
        return response.data;
    },

    async update(id: string, data: UpdatePriceListRequest): Promise<PriceList> {
        const response = await api.put<PriceList>(`/price-lists/${id}`, data);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/price-lists/${id}`);
    },
};

