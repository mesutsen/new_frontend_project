import { api } from '@/lib/axios';
import type { PolicyDto, PolicyStatus } from '@/types/policy';

export interface PagedResponse<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface PolicyListParams {
    search?: string;
    dealerId?: string;
    customerId?: string;
    vehicleId?: string;
    status?: string;
    from?: string; // ISO date string
    to?: string; // ISO date string
    sort?: string;
    page?: number;
    pageSize?: number;
}

export interface CreatePolicyRequest {
    dealerId: string;
    customerId: string;
    vehicleId: string;
    policyType: string;
    currencyId?: string; // Para birimi (EUR, BGN, TRY) - null ise varsayılan para birimi kullanılır
    startDate: string; // ISO date string
    endDate: string; // ISO date string
    durationDays?: number; // Süre seçimi: 1, 15, 30, 90, 365
    premium?: number; // Opsiyonel: Manuel fiyat girişi
}

export interface UpdatePolicyRequest {
    policyType: string;
    startDate: string; // ISO date string
    endDate: string; // ISO date string
    premium?: number; // Opsiyonel: Manuel fiyat girişi
}

export interface BatchCreatePolicyRequest {
    items: CreatePolicyRequest[];
}

export interface RejectPolicyRequest {
    Reason: string; // Backend'de büyük R ile Reason bekleniyor
}

export interface CancelPolicyRequest {
    Reason?: string; // Backend'de büyük R ile Reason bekleniyor
}

export const policiesService = {
    /**
     * Poliçeleri listele (pagination, search, filter)
     */
    getPolicies: async (params?: PolicyListParams): Promise<PagedResponse<PolicyDto>> => {
        const response = await api.get<PagedResponse<PolicyDto>>('/policies', { params });
        return response.data;
    },

    /**
     * Belirli bir dealer'a ait poliçeleri getir
     */
    getPoliciesByDealer: async (
        dealerId: string,
        params?: Omit<PolicyListParams, 'dealerId'>
    ): Promise<PagedResponse<PolicyDto>> => {
        const response = await api.get<PagedResponse<PolicyDto>>(`/policies/dealer/${dealerId}`, { params });
        return response.data;
    },

    /**
     * Poliçe detayını getir
     */
    getPolicyById: async (id: string): Promise<PolicyDto> => {
        const response = await api.get<PolicyDto>(`/policies/${id}`);
        return response.data;
    },

    /**
     * Onay bekleyen poliçeleri getir (Admin, SuperAdmin)
     */
    getPendingApproval: async (): Promise<PolicyDto[]> => {
        const response = await api.get<PolicyDto[]>('/policies/pending-approval');
        return response.data;
    },

    /**
     * Yeni poliçe oluştur
     */
    createPolicy: async (data: CreatePolicyRequest): Promise<PolicyDto> => {
        const response = await api.post<PolicyDto>('/policies', data);
        return response.data;
    },

    /**
     * Toplu poliçe oluştur
     */
    batchCreatePolicies: async (data: BatchCreatePolicyRequest): Promise<PolicyDto[]> => {
        const response = await api.post<PolicyDto[]>('/policies/batch', data);
        return response.data;
    },

    /**
     * Poliçe güncelle
     */
    updatePolicy: async (id: string, data: UpdatePolicyRequest): Promise<PolicyDto> => {
        const response = await api.put<PolicyDto>(`/policies/${id}`, data);
        return response.data;
    },

    /**
     * Poliçe sil
     */
    deletePolicy: async (id: string): Promise<void> => {
        await api.delete(`/policies/${id}`);
    },

    /**
     * Poliçeyi gönder (onay için)
     */
    submitPolicy: async (id: string): Promise<void> => {
        await api.patch(`/policies/${id}/submit`);
    },

    /**
     * Poliçeyi onayla (SuperAdmin)
     */
    approvePolicy: async (id: string): Promise<void> => {
        await api.patch(`/policies/${id}/approve`);
    },

    /**
     * Poliçeyi reddet (SuperAdmin)
     */
    rejectPolicy: async (id: string, data: RejectPolicyRequest): Promise<void> => {
        await api.patch(`/policies/${id}/reject`, data);
    },

    /**
     * Poliçeyi iptal et
     */
    cancelPolicy: async (id: string, data?: CancelPolicyRequest): Promise<void> => {
        // Backend CancelRequest bekliyor, Reason nullable
        await api.patch(`/policies/${id}/cancel`, data ?? {});
    },

    /**
     * OCR ile veri çıkar
     */
    extractOcr: async (file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/policies/ocr/extract', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

