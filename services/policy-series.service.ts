import { api } from '@/lib/axios';

export interface PolicySeries {
    id: string;
    dealerId: string;
    series: string;
    startNumber: number;
    endNumber: number;
    currentNumber: number;
    createdAt: string;
    updatedAt: string;
    dealerName?: string; // Frontend için ekstra bilgi
}

export interface CreatePolicySeriesRequest {
    dealerId: string;
    series: string;
    startNumber: number;
    endNumber: number;
}

export interface UpdatePolicySeriesRequest {
    series: string;
    startNumber: number;
    endNumber: number;
}

export interface PagedResponse<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface PolicySeriesListParams {
    search?: string;
    dealerId?: string;
    page?: number;
    pageSize?: number;
}

export interface SeriesRequest {
    id: string;
    dealerId: string;
    amount: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
    dealerName?: string;
}

export interface SeriesStatistics {
    totalNumbers: number;
    usedNumbers: number;
    remainingNumbers: number;
    usagePercentage: number;
    isNearDepletion: boolean;
    blacklistedCount: number;
}

export interface NextNumberResponse {
    number: number;
    message: string;
}

export interface FullPolicyNumberResponse {
    policyNumber: string;
    message: string;
}

export interface ActiveSeriesResponse {
    seriesId: string;
    seriesCode: string;
    dealerId: string;
    currentNumber: number;
    endNumber: number;
    remainingNumbers: number;
    usagePercentage: number;
    message: string;
    wasCreated: boolean;
}

export const policySeriesService = {
    /**
     * Poliçe serilerini listele (pagination, search, filter)
     */
    getPolicySeries: async (params?: PolicySeriesListParams): Promise<PagedResponse<PolicySeries>> => {
        const response = await api.get<PagedResponse<PolicySeries>>('/policy-series', { params });
        return response.data;
    },

    /**
     * Poliçe serisi detayını getir
     */
    getPolicySeriesById: async (id: string): Promise<PolicySeries> => {
        const response = await api.get<PolicySeries>(`/policy-series/${id}`);
        return response.data;
    },

    /**
     * Yeni poliçe serisi oluştur
     */
    createPolicySeries: async (data: CreatePolicySeriesRequest): Promise<PolicySeries> => {
        const response = await api.post<PolicySeries>('/policy-series', data);
        return response.data;
    },

    /**
     * Poliçe serisi güncelle
     */
    updatePolicySeries: async (id: string, data: UpdatePolicySeriesRequest): Promise<PolicySeries> => {
        const response = await api.put<PolicySeries>(`/policy-series/${id}`, data);
        return response.data;
    },

    /**
     * Poliçe serisi sil
     */
    deletePolicySeries: async (id: string): Promise<void> => {
        await api.delete(`/policy-series/${id}`);
    },

    /**
     * Poliçe serisini bir bayieye ata
     */
    assignDealer: async (id: string, dealerId: string): Promise<PolicySeries> => {
        const response = await api.patch<PolicySeries>(`/policy-series/${id}/assign-dealer`, { dealerId });
        return response.data;
    },

    /**
     * Seri isteklerini getir
     */
    getSeriesRequests: async (): Promise<SeriesRequest[]> => {
        const response = await api.get<SeriesRequest[]>('/policy-series/requests');
        return response.data;
    },

    /**
     * Seri isteğini onayla
     */
    approveSeriesRequest: async (id: string): Promise<void> => {
        await api.patch(`/policy-series/requests/${id}/approve`);
    },

    /**
     * Seri isteğini reddet
     */
    rejectSeriesRequest: async (id: string): Promise<void> => {
        await api.patch(`/policy-series/requests/${id}/reject`);
    },

    /**
     * Sonraki poliçe numarasını al
     */
    getNextNumber: async (id: string): Promise<NextNumberResponse> => {
        const response = await api.post<NextNumberResponse>(`/policy-series/${id}/next-number`);
        return response.data;
    },

    /**
     * Tam poliçe numarası oluştur
     */
    generateFullPolicyNumber: async (id: string): Promise<FullPolicyNumberResponse> => {
        const response = await api.post<FullPolicyNumberResponse>(`/policy-series/${id}/full-policy-number`);
        return response.data;
    },

    /**
     * Seri bitiş yakın mı kontrol et
     */
    isNearDepletion: async (id: string, threshold: number = 50): Promise<boolean> => {
        const response = await api.get<{ isNearDepletion: boolean; threshold: number }>(
            `/policy-series/${id}/near-depletion`,
            { params: { threshold } }
        );
        return response.data.isNearDepletion;
    },

    /**
     * Seri istatistiklerini getir
     */
    getSeriesStatistics: async (id: string): Promise<SeriesStatistics> => {
        const response = await api.get<SeriesStatistics>(`/policy-series/${id}/statistics`);
        return response.data;
    },

    /**
     * Bayi için aktif seriyi getir
     */
    getActiveSeriesByDealer: async (dealerId: string): Promise<ActiveSeriesResponse | null> => {
        try {
            const response = await api.get<ActiveSeriesResponse>(`/policy-series/dealer/${dealerId}/active-series`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 200 && error.response?.data?.message?.includes('bulunamadı')) {
                return null;
            }
            throw error;
        }
    },

    /**
     * Poliçe numarasını karalisteye ekle
     */
    blacklistNumber: async (id: string, number: number, reason: string): Promise<void> => {
        await api.post(`/policy-series/${id}/blacklist`, { number, reason });
    },

    /**
     * Poliçe numarasının karalistede olup olmadığını kontrol et
     */
    isBlacklisted: async (id: string, number: number): Promise<boolean> => {
        const response = await api.get<{ number: number; isBlacklisted: boolean }>(
            `/policy-series/${id}/blacklist/${number}`
        );
        return response.data.isBlacklisted;
    },

    /**
     * Bayi için yeni seri oluştur
     */
    createSeriesForDealer: async (
        dealerId: string,
        seriesCode: string,
        startNumber: number = 1,
        endNumber: number = 10000
    ): Promise<PolicySeries> => {
        const response = await api.post<PolicySeries>('/policy-series/create-series', {
            dealerId,
            seriesCode,
            startNumber,
            endNumber,
        });
        return response.data;
    },

    /**
     * Aktif seri garantisi (yoksa oluşturur)
     */
    ensureActiveSeriesExists: async (dealerId: string, seriesPrefix: string = 'TR'): Promise<ActiveSeriesResponse> => {
        const response = await api.post<ActiveSeriesResponse>('/policy-series/ensure-active-series', {
            dealerId,
            seriesPrefix,
        });
        return response.data;
    },
};

