import { api } from '@/lib/axios';

export interface Dealer {
    id: string;
    name: string;
    code: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    stats?: {
        totalPolicies: number;
        activePolicies: number;
        monthlyIssued: number;
    };
    temporaryPassword?: string; // Sadece oluşturma anında döner
    userName?: string; // Bayi kodu (giriş için)
    observerId?: string; // Atanmış gözlemci ID'si
    observerName?: string; // Atanmış gözlemci adı
    observerEmail?: string; // Atanmış gözlemci e-posta
    observerPhone?: string; // Atanmış gözlemci telefon
}

export interface CreateDealerRequest {
    name: string;
    code: string;
    email?: string;
    phone?: string;
}

export interface UpdateDealerRequest {
    name: string;
    code: string;
    email?: string;
    phone?: string;
    isActive: boolean;
}

export interface PagedResponse<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface DealerListParams {
    search?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
}

export interface PolicyNumberSeries {
    id: string;
    series: string;
    startNumber: number;
    endNumber: number;
    currentNumber: number;
    createdAt: string;
}

export const dealersService = {
    /**
     * Bayileri listele (pagination, search, filter)
     */
    getDealers: async (params?: DealerListParams): Promise<PagedResponse<Dealer>> => {
        const response = await api.get<PagedResponse<Dealer>>('/dealers', { params });
        return response.data;
    },

    /**
     * Bayi detayını getir
     */
    getDealerById: async (id: string): Promise<Dealer> => {
        const response = await api.get<Dealer>(`/dealers/${id}`);
        return response.data;
    },

    /**
     * Mevcut kullanıcının bayi bilgilerini getir (Dealer rolü için)
     */
    getCurrentDealer: async (): Promise<Dealer> => {
        const response = await api.get<Dealer>('/dealers/me');
        return response.data;
    },

    /**
     * Yeni bayi oluştur
     */
    createDealer: async (data: CreateDealerRequest): Promise<Dealer> => {
        const response = await api.post<Dealer>('/dealers', data);
        return response.data;
    },

    /**
     * Bayi güncelle
     */
    updateDealer: async (id: string, data: UpdateDealerRequest): Promise<Dealer> => {
        const response = await api.put<Dealer>(`/dealers/${id}`, data);
        return response.data;
    },

    /**
     * Bayi sil
     */
    deleteDealer: async (id: string): Promise<void> => {
        await api.delete(`/dealers/${id}`);
    },

    /**
     * Bayi aktifleştir
     */
    activateDealer: async (id: string): Promise<void> => {
        await api.patch(`/dealers/${id}/activate`);
    },

    /**
     * Bayi deaktifleştir
     */
    deactivateDealer: async (id: string): Promise<void> => {
        await api.patch(`/dealers/${id}/deactivate`);
    },

    /**
     * Bayi poliçe serilerini getir
     */
    getPolicySeries: async (id: string): Promise<PolicyNumberSeries[]> => {
        const response = await api.get<PolicyNumberSeries[]>(`/dealers/${id}/policy-series`);
        return response.data;
    },

    /**
     * Bayi için yeni geçici şifre oluştur
     */
    resetPassword: async (id: string): Promise<Dealer> => {
        const response = await api.post<Dealer>(`/dealers/${id}/reset-password`);
        return response.data;
    },

    /**
     * Bayi performans verilerini getir
     */
    getPerformance: async (): Promise<DealerPerformanceData> => {
        const response = await api.get<DealerPerformanceData>('/dealers/performance');
        return response.data;
    },
};

export interface DealerPerformanceData {
    stats: {
        totalPremium: number;
        activeDealers: number;
        avgGrowth: number;
        topPerformer: string;
    };
    charts: {
        premiumProduction: { label: string; value: number }[];
        policyCount: { label: string; value: number }[];
    };
    rankings: {
        id: string;
        name: string;
        region: string;
        policies: number;
        premium: number;
        growth: number;
        status: string;
    }[];
}

