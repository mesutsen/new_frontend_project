import { api } from '@/lib/axios';

export interface Observer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    assignedDealerCount?: number; // Backend'den gelebilir
    activeTaskCount?: number; // Backend'den gelebilir
    temporaryPassword?: string; // Sadece oluşturma anında döner
    userName?: string; // Gözlemci kullanıcı adı (giriş için)
}

export interface CreateObserverRequest {
    name: string;
    email?: string;
    phone?: string;
}

export interface UpdateObserverRequest {
    name: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
}

export interface PagedObserverResponse {
    items: Observer[];
    total: number;
    page: number;
    pageSize: number;
    totalPages?: number;
}

export interface ObserverListParams {
    search?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
}

export interface ObserverDealer {
    id: string;
    name: string;
    code: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    observerId?: string;
    observerName?: string;
}

export const observersAdminService = {
    /**
     * Get all observers (paginated)
     */
    async getObservers(params: ObserverListParams = {}): Promise<PagedObserverResponse> {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.append('search', params.search);
        if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

        const response = await api.get<PagedObserverResponse>(
            `/observers?${queryParams.toString()}`
        );
        
        const data = response.data;
        // Backend'den totalPages gelmiyorsa hesapla
        if (!data.totalPages && data.pageSize) {
            data.totalPages = Math.ceil(data.total / data.pageSize);
        }
        
        return data;
    },

    /**
     * Get observer by ID
     */
    async getObserverById(id: string): Promise<Observer> {
        const response = await api.get<Observer>(`/observers/${id}`);
        return response.data;
    },

    /**
     * Create a new observer
     */
    async createObserver(data: CreateObserverRequest): Promise<Observer> {
        const response = await api.post<Observer>('/observers', data);
        return response.data;
    },

    /**
     * Update observer
     */
    async updateObserver(id: string, data: UpdateObserverRequest): Promise<Observer> {
        const response = await api.put<Observer>(`/observers/${id}`, data);
        return response.data;
    },

    /**
     * Delete observer (soft delete)
     */
    async deleteObserver(id: string): Promise<void> {
        await api.delete(`/observers/${id}`);
    },

    /**
     * Activate observer
     */
    async activateObserver(id: string): Promise<void> {
        await api.patch(`/observers/${id}/activate`);
    },

    /**
     * Deactivate observer
     */
    async deactivateObserver(id: string): Promise<void> {
        await api.patch(`/observers/${id}/deactivate`);
    },

    /**
     * Get assigned dealers for an observer
     */
    async getObserverDealers(observerId: string): Promise<ObserverDealer[]> {
        const response = await api.get<ObserverDealer[]>(`/observers/${observerId}/dealers`);
        return response.data;
    },

    /**
     * Assign dealer to observer
     * Note: Backend endpoint'i kontrol edilmeli, şimdilik POST /observers/{id}/dealers varsayılıyor
     */
    async assignDealer(observerId: string, dealerId: string): Promise<void> {
        await api.post(`/observers/${observerId}/dealers`, { dealerId });
    },

    /**
     * Remove dealer from observer
     */
    async removeDealer(observerId: string, dealerId: string): Promise<void> {
        await api.delete(`/observers/${observerId}/dealers/${dealerId}`);
    },

    /**
     * Reset observer password (generate new temporary password)
     */
    async resetPassword(id: string): Promise<Observer> {
        const response = await api.post<Observer>(`/observers/${id}/reset-password`);
        return response.data;
    },
};

